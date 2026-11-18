"use server";

import { CONTACT_EMAIL } from "@/constants";
import { routing } from "@/i18n/routing";
import { INSTALLATION_SYSTEMS } from "@/lib/installation-systems";
import { getMailDeps, getMailIdentity, mailboxThreadUrl } from "@/lib/mailbox";
import { db } from "@ecommerce/database";
import { composeNotification, recordFormSubmission, replyToThread } from "@ecommerce/mailbox";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ContactField = "name" | "email" | "message" | "consent";
export type ContactFormState = {
  ok?: boolean;
  /** Where the answer will go, shown back on success. */
  email?: string;
  errors?: Partial<Record<ContactField, string>>;
  error?: string;
};

const SYSTEMS = [...INSTALLATION_SYSTEMS.map((system) => system.slug), "drugo"] as const;
/** A person needs longer than this to fill the form; a script does not. */
const MIN_FILL_MS = 2500;

const schema = z.object({
  locale: z.enum(routing.locales),
  topic: z.enum(["ogled", "vapros"]),
  system: z.enum(SYSTEMS).optional(),
  name: z.string().trim().min(1).max(120),
  email: z.email().trim().max(200),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(100).optional(),
  message: z.string().trim().max(4000),
  consent: z.literal("on"),
});

/**
 * The contact and site-visit form. It files the message in the admin mailbox as a conversation with
 * the visitor's address, sends them an acknowledgement from the shop's address (their reply joins
 * the same conversation), and a heads-up to the owner's inbox when MAIL_TO is set.
 *
 * Public, so everything is checked here: a hidden field only bots fill, and a minimum time on the
 * page; neither is announced to whoever trips it.
 */
async function submitContactAction(_previous: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const value = (key: string) => {
    const raw = formData.get(key);
    return typeof raw === "string" && raw.trim() !== "" ? raw : undefined;
  };
  const locale = routing.locales.includes(value("locale") as never)
    ? (value("locale") as string)
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "contact" });

  // A bot filled the field people never see: answer as if it worked, record nothing.
  if (value("website")) return { ok: true, email: value("email") };
  const startedAt = Number(value("startedAt"));
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) return { error: t("errors.tooFast") };

  const parsed = schema.safeParse({
    locale,
    topic: value("topic") ?? "vapros",
    system: value("system"),
    name: value("name") ?? "",
    email: value("email") ?? "",
    phone: value("phone"),
    city: value("city"),
    message: value("message") ?? "",
    consent: value("consent"),
  });
  const input = parsed.data;
  const messageMissing = input && input.topic === "vapros" && input.message.length < 3;
  if (!parsed.success || !input || messageMissing) {
    const fields = new Set(parsed.error?.issues.map((issue) => String(issue.path[0])) ?? []);
    if (messageMissing) fields.add("message");
    const errors: ContactFormState["errors"] = {};
    for (const field of ["name", "email", "message", "consent"] as const) {
      if (fields.has(field)) errors[field] = t(`errors.${field}`);
    }
    return { errors };
  }

  const identity = getMailIdentity();
  const systemName = input.system ? t(`form.systems.${input.system}`) : null;
  const subject =
    input.topic === "ogled"
      ? t("subject.ogled", { system: [systemName ?? t("form.systems.drugo"), input.city].filter(Boolean).join(", ") })
      : t("subject.vapros");
  const details = [
    `${t("fields.name")}: ${input.name}`,
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
    if ("error" in recorded) return { errors: { email: t("errors.email") } };

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
