import { Pagination } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMailboxCounts, getMailboxThreads } from "@/queries/mailbox";
import { THREAD_VIEWS, type ThreadView } from "@ecommerce/mailbox";
import Link from "next/link";
import React from "react";
import { formatMailDate } from "./format";

const VIEW_LABELS: Record<ThreadView, string> = {
  waiting: "Waiting for reply",
  open: "Open",
  done: "Done",
  all: "All",
};

const EMPTY: Record<ThreadView, string> = {
  waiting: "Nobody is waiting for an answer.",
  open: "No open conversations.",
  done: "No finished conversations yet.",
  all: "No mail yet.",
};

type Props = {
  view: ThreadView;
  page: number;
};

/**
 * The inbox, newest activity first. "Waiting for reply" (open, and the last word was theirs) is the
 * question this screen exists to answer, so those rows stand out in every view.
 */
const ThreadListLoader: React.FC<Props> = async ({ view, page }) => {
  const [counts, { threads, pageCount }] = await Promise.all([getMailboxCounts(), getMailboxThreads(view, page)]);

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2" aria-label="Conversations">
        {THREAD_VIEWS.map((option) => (
          <Button key={option} asChild size="sm" variant={option === view ? "default" : "outline"}>
            <Link href={`/admin/mailbox?view=${option}`}>
              {VIEW_LABELS[option]}
              <span className="tabular-nums opacity-70">{counts[option]}</span>
            </Link>
          </Button>
        ))}
      </nav>

      {threads.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          <p>{EMPTY[view]}</p>
          {counts.all === 0 && (
            <p className="mx-auto mt-2 max-w-prose text-xs">
              Messages appear here as soon as Resend calls /api/webhooks/resend. If mail was sent and nothing shows,
              check the Resend webhook (email.received) and RESEND_WEBHOOK_SECRET.
            </p>
          )}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {threads.map((thread) => {
            const waiting = thread.status === "open" && thread.lastMessageDirection === "in";
            return (
              <li key={thread.id}>
                <Link
                  href={`/admin/mailbox/${thread.id}`}
                  className={cn(
                    "hover:bg-muted/50 block px-4 py-3 transition-colors",
                    waiting ? "bg-background" : "bg-muted/20",
                  )}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p
                      className={cn(
                        "min-w-0 truncate",
                        waiting ? "font-semibold" : "text-muted-foreground font-medium",
                      )}
                    >
                      {thread.correspondentName ?? thread.correspondent}
                      {thread.correspondentName && (
                        <span className="text-muted-foreground ml-2 text-xs font-normal">{thread.correspondent}</span>
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {formatMailDate(thread.lastMessageAt)}
                      {thread.messageCount > 1 && ` · ${thread.messageCount} messages`}
                    </p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {waiting && <Badge>Waiting for reply</Badge>}
                    {thread.status === "done" && <Badge variant="secondary">Done</Badge>}
                    {thread.orderReference && <Badge variant="outline">Order #{thread.orderReference}</Badge>}
                    <span className="min-w-0 text-sm">{thread.subject}</span>
                  </div>
                  {thread.snippet && (
                    <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
                      {thread.lastMessageDirection === "out" && "You: "}
                      {thread.snippet}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination page={page} pageCount={pageCount} />
    </div>
  );
};

export { ThreadListLoader };
