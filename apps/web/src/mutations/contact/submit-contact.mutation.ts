"use server";

import { CONTACT_EMAIL } from "@/constants";
import { routing } from "@/i18n/routing";
import { getMailDeps, getMailIdentity, mailboxThreadUrl } from "@/lib/mailbox";
import { productHref } from "@/lib/routes";
import { SITE_URL } from "@/lib/site-url";
import { getProductBySlug } from "@/queries/products";
import { contactSchema, type ContactField, type ContactInput } from "@/schemas/contact.schema";
import { db } from "@ecommerce/database";
import { composeNotification, recordFormSubmission, replyToThread } from "@ecommerce/mailbox";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

export type ContactFormState = {
  ok?: boolean;
  /** Where the answer will go, shown back on success. */
  email?: string;
  /** Per field, the key of the message under `contact.errors`. */
  errors?: Partial<Record<ContactField, ContactField>>;
  /** A message for the whole form, already in the visitor's language. */
  error?: string;
};

export type ContactSubmission = ContactInput & {
  locale: string;
  /** When the page was opened: a person needs longer to fill the form than a script. */
  startedAt: number;
  /** The field only bots fill. */
  website?: string;
  /** The product the question is about, when the form was opened from its page. */
  product?: string;
};

/** A person needs longer than this to fill the form; a script does not. */
const MIN_FILL_MS = 2500;

/**
 * The contact and site-visit form. It files the message in the admin mailbox as a conversation with the
 * visitor's address, sends them an acknowledgement from the shop's address (their reply joins the same
 * conversation), and a heads-up to the owner's inbox when MAIL_TO is set.
 *
 * Public, so everything is checked here again with the form's own schema: a hidden field only bots fill, and
 * a minimum time on the page; neither is announced to whoever trips it.
 */
async function submitContactAction(submission: ContactSubmission): Promise<ContactFormState> {
  const locale = routing.locales.includes(submission.locale as never) ? submission.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "contact" });

  // A bot filled the field people never see: answer as if it worked, record nothing.
  if (submission.website) return { ok: true, email: submission.email };
  const startedAt = Number(submission.startedAt);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) return { error: t("errors.tooFast") };

  const parsed = contactSchema.safeParse(submission);
  if (!parsed.success) {
    const errors: ContactFormState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (field === "name" || field === "email" || field === "message" || field === "consent") errors[field] = field;
    }
    return Object.keys(errors).length > 0 ? { errors } : { error: t("errors.failed", { email: CONTACT_EMAIL }) };
  }
  const input = parsed.data;

  const identity = getMailIdentity();
  const systemName = input.system ? t(`form.systems.${input.system}`) : null;
  // Looked up rather than taken from the form, so the subject only ever names a real product.
  const productSlug = submission.product;
  const product = productSlug && /^[a-z0-9-]{1,200}$/.test(productSlug) ? await getProductBySlug(productSlug) : null;
  const subject =
    input.topic === "ogled"
      ? t("subject.ogled", { system: [systemName ?? t("form.systems.drugo"), input.city].filter(Boolean).join(", ") })
      : product
        ? t("subject.product", { product: product.name })
        : t("subject.vapros");
  const details = [
    `${t("fields.name")}: ${input.name}`,
    product && `${t("fields.product")}: ${product.name} (${SITE_URL}${productHref(product)})`,
    systemName && `${t("fields.system")}: ${systemName}`,
    input.city && `${t("fields.city")}: ${input.city}`,
    input.phone && `${t("fields.phone")}: ${input.phone}`,
  ].filter(Boolean);
  const text = [...details, "", input.message].join("\n").trim();

  try {
    const recorded = await recordFormSubmission(db, {
      name: input.name,
      email: input.email,
      subject,
      text,
      to: identity?.address ?? CONTACT_EMAIL,
    });
    if ("error" in recorded) return { errors: { email: "email" } };

    const deps = getMailDeps();
    if (deps) {
      const ack = [
        t("ack.greeting", { name: input.name }),
        "",
        t(input.topic === "ogled" ? "ack.bodyVisit" : "ack.body"),
        t("ack.replyHint"),
        "",
        t("ack.copy"),
        "",
        ...text.split("\n").map((line) => (line ? `> ${line}` : ">")),
      ].join("\n");
      const sent = await replyToThread({ db, ...deps }, { threadId: recorded.threadId, body: ack, keepWaiting: true });
      if (!sent.ok) console.error("[contact] Acknowledgement not sent:", sent.error);

      const owner = process.env.MAIL_TO?.trim();
      if (owner && owner.toLowerCase() !== deps.identity.address) {
        const copy = composeNotification(
          deps.identity,
          {
            from: `${input.name} <${input.email}>`,
            to: [deps.identity.address],
            subject,
            text,
            receivedAt: new Date(),
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
            replyTo: [input.email],
          })
          .catch((error) => console.error("[contact] Heads-up copy not sent:", error));
      }
    }

    revalidatePath("/admin/mailbox", "layout");
    return { ok: true, email: input.email };
  } catch (error) {
    console.error("[contact] Form not recorded:", error);
    return { error: t("errors.failed", { email: identity?.address ?? CONTACT_EMAIL }) };
  }
}

export { submitContactAction };
