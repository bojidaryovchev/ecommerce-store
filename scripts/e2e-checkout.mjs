// End-to-end guest checkout in a real browser: product page → cart → Stripe Checkout (test card)
// → success page. The order, webhook and email are then visible in the database, Stripe and Resend.
//
//   pnpm exec playwright install chromium   # once
//   pnpm e2e:checkout -- --base http://localhost:3000 --product <slug>
//   pnpm e2e:checkout -- --base https://<deployment> --product <slug> --bypass <vercel-automation-bypass-secret>
//
// Options: --email (default delivered@resend.dev, Resend's always-delivered test inbox), --shots <dir>.
// Only ever run this against Stripe TEST mode: it pays with card 4242 4242 4242 4242.
import { mkdirSync } from "node:fs";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "http://localhost:3000" },
    product: { type: "string" },
    email: { type: "string", default: "delivered@resend.dev" },
    bypass: { type: "string" },
    shots: { type: "string", default: "e2e-screenshots" },
  },
});
if (!values.product) {
  console.error("Pass --product <slug> (a product with a price that is in stock)");
  process.exit(1);
}
const base = values.base.replace(/\/+$/, "");
mkdirSync(values.shots, { recursive: true });

const step = (message) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${message}`);
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The first frame that has an element matching the selector (Stripe renders its form in iframes). */
async function frameWith(page, selector, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      if (await frame.$(selector).catch(() => null)) return frame;
    }
    await page.waitForTimeout(500);
  }
  throw new Error(`No frame has ${selector}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ locale: "bg-BG", viewport: { width: 1400, height: 1100 } });
page.setDefaultTimeout(30_000);

try {
  if (values.bypass) {
    // Vercel deployment protection: take the bypass cookie once. A custom header on every request
    // would also reach Stripe's APIs and break their CORS.
    await page.goto(`${base}/?x-vercel-protection-bypass=${values.bypass}&x-vercel-set-bypass-cookie=samesitenone`);
  }

  step(`product /produkt/${values.product}`);
  await page.goto(`${base}/produkt/${values.product}`, { waitUntil: "networkidle" });
  step(`"${(await page.locator("h1").first().textContent())?.trim()}"`);

  step("add to cart");
  await page.getByRole("button", { name: "Добави в количката" }).first().click();
  await page.getByText("Добавено в количката").first().waitFor({ timeout: 15_000 });

  const checkoutButton = page.getByRole("button", { name: "Към плащане" });
  if (!(await checkoutButton.isVisible().catch(() => false))) {
    await page.getByRole("button", { name: "Отвори количката" }).click();
  }
  await checkoutButton.waitFor();

  step("checkout → Stripe");
  await Promise.all([page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 }), checkoutButton.click()]);

  step(`contact and shipping (${values.email})`);
  const form = await frameWith(page, "#linkAuthentication-emailInput", 45_000);
  await form.fill("#linkAuthentication-emailInput", values.email);
  await form.fill("#shippingAddress-nameInput", "Иван Тестов");
  await form.fill("#shippingAddress-addressLine1Input", "ул. Витоша 1");
  await form.fill("#shippingAddress-localityInput", "София");
  await form.fill("#shippingAddress-postalCodeInput", "1000");

  step("card 4242");
  // Payment methods are listed as an accordion; the card inputs appear once "Card" is selected.
  const cardOption = '[data-value="card"], button[value="card"], #card-tab';
  const optionFrame = await frameWith(page, cardOption, 5_000).catch(() => null);
  if (optionFrame) await optionFrame.click(cardOption).catch(() => {});
  const card = await frameWith(page, 'input[name="number"], input[autocomplete="cc-number"]');
  await card.fill('input[name="number"], input[autocomplete="cc-number"]', "4242424242424242");
  await card.fill('input[name="expiry"], input[autocomplete="cc-exp"]', "12 / 34");
  await card.fill('input[name="cvc"], input[autocomplete="cc-csc"]', "123");
  await page.screenshot({ path: `${values.shots}/stripe-filled.png`, fullPage: true });

  step("pay");
  // Let Stripe finish validating the card before submitting; an early click is silently ignored.
  await page.waitForTimeout(2500);
  const submit = "[data-testid='payment-form-submit-button'], [data-testid='hosted-payment-submit-button']";
  await Promise.all([
    page.waitForURL(new RegExp(`^${escape(base)}/(en/)?checkout/success`), { timeout: 120_000 }),
    (await frameWith(page, submit)).click(submit),
  ]);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${values.shots}/success.png`, fullPage: true });
  const text = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  step(`success: ${text.slice(0, 160)}…`);
  console.log(`OK session=${new URL(page.url()).searchParams.get("session_id")}`);
} catch (error) {
  await page.screenshot({ path: `${values.shots}/error.png`, fullPage: true }).catch(() => {});
  console.error(`FAILED at ${page.url().slice(0, 100)}: ${error.message.split("\n")[0]}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
