/**
 * Message bodies as text.
 *
 * The admin panel shows every message as TEXT, never as the sender's HTML: it is a page an
 * administrator opens holding markup written by whoever felt like writing to the shop, and rendering it
 * would be a stored-XSS hole in the one session that can send mail as the shop. The plain-text part is
 * what mail clients have always been required to carry; where a sender omits it, the markup is flattened
 * here rather than trusted.
 */

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };

/** Last-resort readable text for a message that arrived as HTML only. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/g, (_, name: string) => ENTITIES[name] ?? "")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Our own signature off a message we sent. `--` on a line of its own is the standard signature
 * delimiter, and the block beneath it is the same few lines under every reply; repeated down a
 * conversation it buries what was actually written. For display only: the stored text is exactly what
 * was sent.
 */
export function withoutSignature(text: string): string {
  const lines = text.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i]!.trimEnd() === "--") return lines.slice(0, i).join("\n").trimEnd();
  }
  return text;
}

/**
 * The part of an incoming reply that is new: the quoted history most clients append ("On … wrote:",
 * "> …" lines) cut off, for the one-line preview in the thread list. The thread page shows everything.
 */
export function withoutQuotedHistory(text: string): string {
  const lines = text.split("\n");
  const cut = lines.findIndex(
    (line, i) =>
      /^\s*>/.test(line) ||
      /^-{2,}\s*(Original Message|Оригинално съобщение|Forwarded message|Препратено съобщение)/i.test(line) ||
      // "On Mon, 3 Nov 2026 at 10:00, Shop <contact@…> wrote:", possibly wrapped over two lines.
      (/^(On|На|Am|Le|El)\s.+/i.test(line) &&
        /(wrote|написа|schrieb|a écrit|escribió):\s*$/i.test(line + " " + (lines[i + 1] ?? ""))),
  );
  return (cut > 0 ? lines.slice(0, cut) : lines).join("\n").trim();
}

/** A one-line preview of a body. */
export function snippet(text: string | null | undefined, length = 160): string {
  return withoutQuotedHistory(withoutSignature(text ?? ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, length);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The readable body of a stored message. */
export function readableBody(message: {
  direction: "in" | "out";
  bodyText: string | null;
  bodyHtml: string | null;
}): string {
  const text = message.bodyText?.trim();
  if (text) return message.direction === "out" ? withoutSignature(text) : text;
  if (message.bodyHtml) return htmlToText(message.bodyHtml);
  return "";
}
