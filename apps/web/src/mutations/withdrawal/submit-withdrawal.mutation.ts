"use server";

import { CONTACT_EMAIL } from "@/constants";
import { routing } from "@/i18n/routing";
import { getMailDeps, getMailIdentity, mailboxThreadUrl } from "@/lib/mailbox";
import { db } from "@ecommerce/database";
import { composeNotification, findOrderByReference, recordFormSubmission, replyToThread } from "@ecommerce/mailbox";
import { getFormatter, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type WithdrawalField = "name" | "email" | "order" | "items";
export type WithdrawalFormState = {
  ok?: boolean;
  /** Where the confirmation went, and when the statement was made, shown back on success. */
  email?: string;
  date?: string;
  time?: string;
  errors?: Partial<Record<WithdrawalField, string>>;
  error?: string;
};

/** A person needs longer than this to fill the form; a script does not. */
const MIN_FILL_MS = 2500;

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().trim().max(200),
  order: z.string().trim().min(1).max(100),
  scope: z.enum(["all", "part"]),
  items: z.string().trim().max(2000).optional(),
  note: z.string().trim().max(2000).optional(),
});

/** "№ 8e04 fc85", "#8E04FC85" → "8e04fc85": the reference customers see, if that is what they typed. */
const orderReferenceOf = (typed: string) => {
  const compact = typed.replace(/[\s#№-]/g, "").toLowerCase();
  return /^[0-9a-f]{8}$/.test(compact) ? compact : null;
};

/**
 * The online withdrawal function (Directive 2011/83/EU art. 11a, added by Directive 2023/2673): the
 * consumer states the withdrawal here, and gets an acknowledgement on a durable medium (an email)
 * with the statement and the date and time it was made.
 *
 * The statement is filed in the admin mailbox as a conversation with the consumer, linked to the
 * order when the number and the address match one; the acknowledgement goes out from the shop's
 * address, so a reply joins the same conversation. Nothing beyond what the law asks for is required:
 * no account, no reason, no consent box. A bot filling the hidden field is told it worked.
 */
async function submitWithdrawalAction(
  _previous: WithdrawalFormState,
  formData: FormData,
): Promise<WithdrawalFormState> {
  const value = (key: string) => {
    const raw = formData.get(key);
    return typeof raw === "string" && raw.trim() !== "" ? raw : undefined;
  };
  const locale = routing.locales.includes(value("locale") as never)
    ? (value("locale") as string)
    : routing.defaultLocale;
  const [t, format] = await Promise.all([
    getTranslations({ locale, namespace: "info.withdrawal" }),
    getFormatter({ locale }),
  ]);
  const submittedAt = new Date();
  const date = format.dateTime(submittedAt, { dateStyle: "long" });
  const time = format.dateTime(submittedAt, { timeStyle: "short" });

  if (value("website")) return { ok: true, email: value("email"), date, time };
  const startedAt = Number(value("startedAt"));
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) return { error: t("errors.tooFast") };

  const parsed = schema.safeParse({
    name: value("name") ?? "",
    email: value("email") ?? "",
    order: value("order") ?? "",
    scope: value("scope") ?? "all",
    items: value("items"),
    note: value("note"),
  });
  const data = parsed.data;
  const itemsMissing = data?.scope === "part" && !data.items;
  if (!parsed.success || !data || itemsMissing) {
    const fields = new Set(parsed.error?.issues.map((issue) => String(issue.path[0])) ?? []);
    if (itemsMissing) fields.add("items");
    const errors: WithdrawalFormState["errors"] = {};
    for (const field of ["name", "email", "order", "items"] as const) {
      if (fields.has(field)) errors[field] = t(`errors.${field}`);
    }
    return { errors };
  }

  const reference = orderReferenceOf(data.order);
  const orderLabel = reference ? reference.toUpperCase() : data.order;
  const subject = t("subject", { order: orderLabel });
  // Optional, so an unreadable date is left out rather than refused: nothing may stand between a
  // consumer and a withdrawal.
  const receivedRaw = value("received");
  const receivedOn =
    receivedRaw && /^\d{4}-\d{2}-\d{2}$/.test(receivedRaw) ? new Date(`${receivedRaw}T12:00:00Z`) : null;
  const received =
    receivedOn && !Number.isNaN(receivedOn.getTime()) ? format.dateTime(receivedOn, { dateStyle: "long" }) : null;
  const text = [
    data.scope === "all" ? t("statement") : t("statementPart"),
    "",
    `${t("labels.name")}: ${data.name}`,
    `${t("labels.email")}: ${data.email}`,
    `${t("labels.order")}: ${orderLabel}`,
    `${t("labels.scope")}: ${data.scope === "all" ? t("fields.scopeAll") : t("fields.scopePart")}`,
    data.scope === "part" && data.items && `${t("labels.items")}: ${data.items}`,
    received && `${t("labels.received")}: ${received}`,
    `${t("labels.submitted")}: ${date}, ${time}`,
    data.note && "",
    data.note && `${t("labels.note")}: ${data.note}`,
  ]
    .filter((line) => line !== false && line !== null && line !== undefined)
    .join("\n");

  const identity = getMailIdentity();
  try {
    const orderId = reference ? await findOrderByReference(db, [reference], data.email) : null;
    const recorded = await recordFormSubmission(db, {
      name: data.name,
      email: data.email,
      subject,
      text,
      to: identity?.address ?? CONTACT_EMAIL,
      orderId,
      createdAt: submittedAt,
    });
    if ("error" in recorded) return { errors: { email: t("errors.email") } };

    const deps = getMailDeps();
    if (deps) {
      const ack = [
        t("ack.greeting", { name: data.name }),
        "",
        t("ack.body", { date, time }),
        t("ack.replyHint"),
        "",
        t("ack.copy"),
        "",
        ...text.split("\n").map((line) => (line ? `> ${line}` : ">")),
      ].join("\n");
      const sent = await replyToThread({ db, ...deps }, { threadId: recorded.threadId, body: ack, keepWaiting: true });
      if (!sent.ok) console.error("[withdrawal] Acknowledgement not sent:", sent.error);

      const owner = process.env.MAIL_TO?.trim();
      if (owner && owner.toLowerCase() !== deps.identity.address) {
        const copy = composeNotification(
          deps.identity,
          {
            from: `${data.name} <${data.email}>`,
            to: [deps.identity.address],
            subject,
            text,
            receivedAt: submittedAt,
            attachments: [],
            senderVerified: null,
          },
          mailboxThreadUrl(recorded.threadId),
        );
        await deps.transport
          .send({
            from: deps.identity.from,
            to: owner,
            subject: copy.subject,
            text: copy.text,
            html: copy.html,
            replyTo: [data.email],
          })
          .catch((error) => console.error("[withdrawal] Heads-up copy not sent:", error));
      }
    }

    revalidatePath("/admin/mailbox", "layout");
    return { ok: true, email: data.email, date, time };
  } catch (error) {
    console.error("[withdrawal] Statement not recorded:", error);
    return { error: t("errors.failed", { email: identity?.address ?? CONTACT_EMAIL }) };
  }
}

export { submitWithdrawalAction };
