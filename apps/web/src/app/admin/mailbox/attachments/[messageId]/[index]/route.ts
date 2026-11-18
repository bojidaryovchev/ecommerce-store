import { requireAdmin } from "@/lib/auth-guard";
import { attachmentDownload } from "@/lib/mailbox";
import { db } from "@ecommerce/database";
import { getMessage } from "@ecommerce/mailbox";

/**
 * An attachment, proxied. Resend's links are signed and expire, so one is asked for per click and the
 * file streamed through; the link itself never reaches the browser, and the only URL that exists for a
 * customer's document is this one, behind the admin session.
 */
export async function GET(_request: Request, context: { params: Promise<{ messageId: string; index: string }> }) {
  // A route handler gets no layout, and the proxy's check is not the only one there should be.
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messageId, index } = await context.params;
  const position = Number(index);
  if (!Number.isInteger(position) || position < 0) return new Response("Bad attachment", { status: 400 });

  const message = await getMessage(db, messageId);
  if (!message) return new Response("Message not found", { status: 404 });

  const download = await attachmentDownload(message.direction, messageId, message.attachments?.[position], position);
  if (!download) return new Response("Attachment not found", { status: 404 });

  const upstream = await fetch(download.url);
  if (!upstream.ok || !upstream.body) return new Response("Attachment could not be fetched", { status: 502 });

  return new Response(upstream.body, {
    headers: {
      "content-type": download.contentType || "application/octet-stream",
      // RFC 5987, because these names are routinely Cyrillic and plain `filename=` is ASCII-only.
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(download.filename)}`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
