# Mailbox

The shop's email address is a real inbox. Mail sent to it lands in **/admin/mailbox**. Answers sent from there leave from the same address. The same approach is used in the buy-a-vend and rent-a-vend projects.

```
customer ──mail──▶ contact@… (MX → Resend) ──email.received──▶ /api/webhooks/resend ──▶ mail_thread / mail_message
                                                                                      └──▶ heads-up copy to MAIL_TO (optional)
admin panel ──reply / new message──▶ Resend (from EMAIL_FROM, In-Reply-To/References) ──▶ customer
```

- **Code.** The logic is in `packages/mailbox`, with tests. The web app wires it to Resend (`apps/web/src/lib/mailbox.ts`) and adds the webhook route and the admin screens.
- **Recording.** Each incoming message is recorded first. If the optional `MAIL_TO` heads-up copy fails, only a notification is lost. If the record fails, Resend retries.
- **Threads.** A message joins an existing conversation when its `References` / `In-Reply-To` headers match one, or when the same sender writes with the same subject while the thread is open. Either way, only the same correspondent's conversation can be joined.
- **Senders.** The sender is the single address the From header names, parsed strictly. A display name that looks like an address (`"<customer@x>" <attacker@y>`) never counts. A From that names no address, or several, is kept but cannot be answered from the panel.
- **Orders.** A conversation is tied to an order in two cases:
  - it was started from the order page ("Email customer");
  - the customer's subject quotes the order reference (`#7a1ffab1`, as in "Re: Поръчка #7A1FFAB1 е потвърдена") and they wrote from the order's email address.
- **Unverified senders.** If Resend's receiving server says the From address was not authenticated (DMARC/DKIM), the message is flagged in the panel and not tied to an order.
- **Bodies.** Messages are shown as text, never as the sender's HTML.
- **Attachments.** The files stay in Resend and are proxied on download behind the admin session.
- **Size limit.** Attachments on outgoing mail are capped at 4 MB in total, because Vercel's request limit is 4.5 MB.

## Setup

1. **Domain in Resend.** It must be verified for sending, with **receiving enabled**: the MX record points at Resend's inbound server.
2. **API key.** `RESEND_API_KEY` must be a **full access** key from that same Resend account. A sending-only key can send replies but cannot read received mail.
3. **Webhook.** In Resend, add a webhook `https://<site>/api/webhooks/resend` for `email.received`. Put its signing secret in `RESEND_WEBHOOK_SECRET`.
4. **Sender address.** Set `EMAIL_FROM`, e.g. `Shop <contact@example.com>`. This is the mailbox's address, and every email leaves from it, order confirmations included. Only mail sent to this exact address is recorded; the account's other addresses and domains are ignored.
5. **Optional heads-up copy.** Set `MAIL_TO` to your own inbox to get a copy of each new message, with a link to answer it from the panel.

The Resend account fires `email.received` for every domain it receives for, so one account can serve several sites. Each site keeps only mail to its own address.

## Tests

```sh
pnpm --filter @ecommerce/mailbox test   # unit tests
# plus the integration test, against a disposable migrated database (the mail tables are truncated):
MAILBOX_TEST_DATABASE_URL=postgres://postgres:devpass@localhost:55432/ecommerce pnpm --filter @ecommerce/mailbox test
```
