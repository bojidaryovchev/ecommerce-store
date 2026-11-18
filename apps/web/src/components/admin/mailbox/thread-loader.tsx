import { OrderStatusBadge } from "@/components/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMailIdentity } from "@/lib/mailbox";
import { cn, formatCurrency } from "@/lib/utils";
import { getMailboxThread } from "@/queries/mailbox";
import type { MailMessage } from "@ecommerce/database/schema";
import { orderReference, readableBody, singleMailbox, UNCLEAR_RECIPIENT } from "@ecommerce/mailbox";
import { ArrowLeft, Paperclip } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";
import { formatFileSize, formatMailDate } from "./format";
import { ReplyForm } from "./reply-form";
import { ThreadStatusButton } from "./thread-status-button";

/**
 * One message. Bodies are rendered as TEXT, never as the sender's HTML: this page holds markup written
 * by whoever felt like writing to the shop, in the one session that can send mail as the shop.
 */
const MessageCard: React.FC<{ message: MailMessage }> = ({ message }) => {
  const outgoing = message.direction === "out";
  const body = readableBody(message);

  return (
    <li className={cn("rounded-lg border p-4", outgoing ? "bg-muted/40" : "bg-background")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="min-w-0 text-sm font-medium break-all">
          {outgoing ? (
            <>You ({message.fromAddress})</>
          ) : (
            <>
              {message.fromName && <span className="mr-1">{message.fromName}</span>}
              <span className={cn(message.fromName && "text-muted-foreground font-normal")}>
                &lt;{message.fromAddress}&gt;
              </span>
            </>
          )}
        </p>
        <p className="text-muted-foreground text-xs tabular-nums">{formatMailDate(message.createdAt)}</p>
      </div>
      {!outgoing && message.senderVerified === false && (
        <p className="text-destructive mt-2 text-xs">
          The sending server did not vouch for this address, so it may be forged. Confirm before acting on payment,
          address or delivery changes.
        </p>
      )}
      {message.ccAddresses && <p className="text-muted-foreground mt-1 text-xs">Cc: {message.ccAddresses}</p>}
      <div className="mt-3 text-sm leading-relaxed break-words whitespace-pre-wrap">
        {body || <span className="text-muted-foreground italic">(empty message)</span>}
      </div>
      {message.attachments && message.attachments.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {message.attachments.map((file, index) => (
            <li key={`${message.id}-${index}`}>
              <a
                href={`/admin/mailbox/attachments/${encodeURIComponent(message.id)}/${index}`}
                className="hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs"
              >
                <Paperclip className="h-3 w-3" />
                {file.filename}
                <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

type Props = {
  id: string;
};

const ThreadLoader: React.FC<Props> = async ({ id }) => {
  const result = await getMailboxThread(id);
  if (!result) notFound();
  const { thread, orders } = result;
  const identity = getMailIdentity();
  // A conversation whose sender is not one address we can read cannot be answered from here.
  const answerable = singleMailbox(thread.correspondent) !== null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/mailbox">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All conversations
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold break-words">{thread.subject}</h1>
              <p className="text-muted-foreground mt-1 text-sm break-all">
                {thread.correspondentName
                  ? `${thread.correspondentName} · ${thread.correspondent}`
                  : thread.correspondent}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {thread.status === "open" && thread.lastMessageDirection === "in" && <Badge>Waiting for reply</Badge>}
                {thread.status === "done" && <Badge variant="secondary">Done</Badge>}
                {thread.order && (
                  <Badge asChild variant="outline">
                    <Link href={`/admin/orders/${thread.order.id}`}>Order #{orderReference(thread.order.id)}</Link>
                  </Badge>
                )}
              </div>
            </div>
            <ThreadStatusButton threadId={thread.id} status={thread.status} />
          </div>

          <ol className="space-y-3">
            {thread.messages.map((message) => (
              <MessageCard key={message.id} message={message} />
            ))}
          </ol>

          {!answerable ? (
            <p className="text-muted-foreground rounded-lg border p-4 text-sm">{UNCLEAR_RECIPIENT}</p>
          ) : identity ? (
            <ReplyForm threadId={thread.id} from={identity.address} to={thread.correspondent} />
          ) : (
            <p className="text-muted-foreground rounded-lg border p-4 text-sm">
              Email is not configured (EMAIL_FROM, RESEND_API_KEY), so replies cannot be sent.
            </p>
          )}
        </div>

        <aside className="space-y-3">
          <h2 className="text-sm font-semibold">Orders from this address</h2>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">None.</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="hover:bg-muted/50 block rounded-md border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">#{orderReference(order.id)}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                      <span>{formatMailDate(order.createdAt)}</span>
                      <span>{formatCurrency(order.totalAmount, order.currency.toUpperCase())}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {answerable && (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/admin/mailbox/new?to=${encodeURIComponent(thread.correspondent)}`}>
                New message to this address
              </Link>
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
};

export { ThreadLoader };
