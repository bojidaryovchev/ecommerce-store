import { getMailIdentity, getMailTransport, mailboxThreadUrl } from "@/lib/mailbox";
import { db } from "@ecommerce/database";
import { handleInboundWebhook } from "@ecommerce/mailbox";
import { revalidatePath } from "next/cache";

/**
 * Resend's `email.received` webhook: mail to the shop's address (EMAIL_FROM) lands in /admin/mailbox.
 *
 * Register this URL in Resend under Webhooks, subscribed to `email.received`, and put its signing secret
 * in RESEND_WEBHOOK_SECRET. The status codes matter: Resend retries a 5xx and gives up on a 2xx, so "we
 * understood this and chose not to keep it" has to be a 200, and "we could not keep it" a 500.
 */
export async function POST(request: Request) {
  // Raw text, not request.json(): the signature covers the exact bytes.
  const payload = await request.text();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return new Response("Missing signature headers", { status: 400 });
  }

  const identity = getMailIdentity();
  const transport = getMailTransport();
  if (!identity || !transport || !process.env.RESEND_WEBHOOK_SECRET) {
    console.error("[mailbox] Not configured: EMAIL_FROM, RESEND_API_KEY and RESEND_WEBHOOK_SECRET are all needed");
    return new Response("Mailbox not configured", { status: 500 });
  }

  const outcome = await handleInboundWebhook(
    { db, transport, identity, notifyTo: process.env.MAIL_TO || null, threadUrl: mailboxThreadUrl },
    payload,
    { id, timestamp, signature },
  );

  switch (outcome.status) {
    case "recorded":
      if (outcome.notifyError) console.warn("[mailbox] Recorded, but the heads-up copy failed:", outcome.notifyError);
      revalidatePath("/admin/mailbox", "layout");
      return Response.json({ recorded: outcome.messageId, thread: outcome.threadId });
    case "duplicate":
      return Response.json({ duplicate: outcome.messageId });
    case "ignored":
      return Response.json({ ignored: outcome.reason });
    case "unauthorized":
      return new Response("Invalid signature", { status: 401 });
    case "failed":
      console.error("[mailbox] Incoming mail not recorded:", outcome.error);
      return new Response("Not recorded", { status: 500 });
  }
}
