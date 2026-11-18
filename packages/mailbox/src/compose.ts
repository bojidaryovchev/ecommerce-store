import { singleMailbox } from "./address";
import { escapeHtml } from "./text";

/** Who the shop's mail is from: the mailbox's address, which is also where replies come back to. */
export type MailIdentity = {
  /** The From header, e.g. `Shop <contact@example.com>`. */
  from: string;
  address: string;
  name: string;
  /** The public site, for the signature. */
  siteUrl: string | null;
};

/**
 * The identity from EMAIL_FROM ("Shop <contact@example.com>" or a bare address). Null when it does not
 * name exactly one address, which leaves the mailbox switched off rather than guessing.
 */
export function mailIdentity(emailFrom: string | null | undefined, siteUrl?: string | null): MailIdentity | null {
  const mailbox = singleMailbox(emailFrom?.trim());
  if (!mailbox) return null;
  const name = mailbox.name ?? mailbox.address;
  return { from: emailFrom!.trim(), address: mailbox.address, name, siteUrl: siteUrl?.replace(/\/+$/, "") || null };
}

const siteHost = (siteUrl: string | null) => (siteUrl ? siteUrl.replace(/^https?:\/\//, "") : null);

/** Paragraphs and line breaks of plain text, as HTML. */
function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function layout(identity: MailIdentity, inner: string): string {
  const host = siteHost(identity.siteUrl);
  const footer = [
    `<strong style="color:#333">${escapeHtml(identity.name)}</strong>`,
    `<a href="mailto:${escapeHtml(identity.address)}" style="color:#555">${escapeHtml(identity.address)}</a>`,
    host ? `<a href="${escapeHtml(identity.siteUrl!)}" style="color:#555">${escapeHtml(host)}</a>` : null,
  ]
    .filter(Boolean)
    .join(" &middot; ");
  return [
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>',
    '<body style="margin:0;padding:0;background:#f5f5f5">',
    '<div style="max-width:600px;margin:0 auto;padding:24px 16px">',
    '<div style="background:#ffffff;border-radius:8px;padding:28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#111">',
    inner,
    '<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0 16px">',
    `<p style="margin:0;font-size:13px;color:#666">${footer}</p>`,
    "</div></div></body></html>",
  ].join("");
}

/**
 * A message as it leaves: the text exactly as typed, under a signature. The text part is not a
 * fallback nicety: some clients show only text, and a message without one scores worse with spam
 * filters. The signature's lone `--` is the standard delimiter the admin view hides it by.
 */
export function composeMessage(identity: MailIdentity, body: string): { text: string; html: string } {
  const typed = body.trim();
  const host = siteHost(identity.siteUrl);
  const text = [typed, "", "--", identity.name, [identity.address, host].filter(Boolean).join(" · ")].join("\n");
  return { text, html: layout(identity, textToHtml(typed)) };
}

/**
 * The heads-up copy of an incoming message for the owner's own inbox (MAIL_TO), because a panel nobody
 * has open notifies nobody. It carries the text and a link to answer from the admin panel, where the
 * answer leaves as the shop's address. Reply-To is the customer, so pressing Reply still reaches them,
 * from the owner's personal address. Attachments stay in the panel.
 */
export function composeNotification(
  identity: MailIdentity,
  message: {
    from: string;
    to: string[];
    subject: string;
    text: string;
    receivedAt: Date;
    attachments: string[];
    senderVerified: boolean | null;
  },
  threadUrl: string | null,
): { subject: string; text: string; html: string } {
  const envelope = [
    `From: ${message.from}`,
    `To: ${message.to.join(", ")}`,
    `Received: ${message.receivedAt.toISOString().replace("T", " ").slice(0, 16)} UTC`,
    ...(message.attachments.length > 0 ? [`Attachments: ${message.attachments.join(", ")}`] : []),
    ...(message.senderVerified === false ? ["Warning: the sending server did not vouch for this From address."] : []),
  ];
  const text = [
    ...envelope,
    ...(threadUrl ? ["", `Reply from the admin panel: ${threadUrl}`] : []),
    "",
    "---",
    "",
    message.text || "(empty message)",
  ].join("\n");

  const html = layout(
    identity,
    [
      `<p style="margin:0 0 16px;font-size:13px;color:#555">${envelope.map(escapeHtml).join("<br>")}</p>`,
      threadUrl
        ? `<p style="margin:0 0 20px"><a href="${escapeHtml(threadUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:bold">Reply from the admin panel</a></p>`
        : "",
      '<div style="border-left:3px solid #e5e5e5;padding-left:12px">',
      textToHtml(message.text || "(empty message)"),
      "</div>",
    ].join(""),
  );

  return { subject: message.subject || "(no subject)", text, html };
}
