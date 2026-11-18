"use server";

import { CONTACT_EMAIL } from "@/constants";
import { routing } from "@/i18n/routing";
import { getMailDeps, getMailIdentity, mailboxThreadUrl } from "@/lib/mailbox";
import { withdrawalSchema, type WithdrawalField, type WithdrawalInput } from "@/schemas/withdrawal.schema";
import { db } from "@ecommerce/database";
import { composeNotification, findOrderByReference, recordFormSubmission, replyToThread } from "@ecommerce/mailbox";
import { getFormatter, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

export type WithdrawalFormState = {
  ok?: boolean;
  /** Where the confirmation went, and when the statement was made, shown back on success. */
  email?: string;
  date?: string;
  time?: string;
  /** Per field, the key of the message under `info.withdrawal.errors`. */
  errors?: Partial<Record<WithdrawalField, WithdrawalField>>;
  /** A message for the whole form, already in the consumer's language. */
  error?: string;
};

export type WithdrawalSubmission = WithdrawalInput & {
  locale: string;
  /** When the page was opened: a person needs longer to fill the form than a script. */
  startedAt: number;
  /** The field only bots fill. */
  website?: string;
};

/** A person needs longer than this to fill the form; a script does not. */
const MIN_FILL_MS = 2500;

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
async function submitWithdrawalAction(submission: WithdrawalSubmission): Promise<WithdrawalFormState> {
  const locale = routing.locales.includes(submission.locale as never) ? submission.locale : routing.defaultLocale;
  const [t, format] = await Promise.all([
    getTranslations({ locale, namespace: "info.withdrawal" }),
    getFormatter({ locale }),
  ]);
  const submittedAt = new Date();
  const date = format.dateTime(submittedAt, { dateStyle: "long" });
  const time = format.dateTime(submittedAt, { timeStyle: "short" });

  if (submission.website) return { ok: true, email: submission.email, date, time };
  const startedAt = Number(submission.startedAt);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) return { error: t("errors.tooFast") };

  const parsed = withdrawalSchema.safeParse(submission);
  if (!parsed.success) {
    const errors: WithdrawalFormState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (field === "name" || field === "email" || field === "order" || field === "items") errors[field] = field;
    }
    return Object.keys(errors).length > 0 ? { errors } : { error: t("errors.failed", { email: CONTACT_EMAIL }) };
  }
  const data = parsed.data;

  const reference = orderReferenceOf(data.order);
  const orderLabel = reference ? reference.toUpperCase() : data.order;
  const subject = t("subject", { order: orderLabel });
  // Optional, so an unreadable date is left out rather than refused: nothing may stand between a
  // consumer and a withdrawal.
  const receivedRaw = data.received;
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
    if ("error" in recorded) return { errors: { email: "email" } };

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
