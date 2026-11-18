"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { replyToThreadAction } from "@/mutations/mailbox";
import type { MailFormState } from "@/types/mail-form-state.type";
import React, { startTransition, useActionState, useEffect, useRef } from "react";

type Props = {
  threadId: string;
  /** Shown above the box: which address the answer leaves from is the reason to answer here. */
  from: string;
  to: string;
};

/**
 * The reply box. Plain text on purpose. Submitted by hand rather than through `<form action>`, which
 * would reset the fields when the action returns, error or not: a failed send must leave the typed
 * reply where it was. Cleared only after a send that worked.
 */
const ReplyForm: React.FC<Props> = ({ threadId, from, to }) => {
  const [state, dispatch, pending] = useActionState<MailFormState, FormData>(replyToThreadAction, {});
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.sentAt) form.current?.reset();
  }, [state.sentAt]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  };

  return (
    <form ref={form} onSubmit={onSubmit} className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label htmlFor="reply-body">Reply</Label>
        <p className="text-muted-foreground text-xs">
          from {from} to {to}
        </p>
      </div>
      <input type="hidden" name="threadId" value={threadId} />
      <Textarea id="reply-body" name="body" rows={7} required placeholder="Write your reply…" disabled={pending} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input type="file" name="files" multiple className="max-w-sm" disabled={pending} aria-label="Attachments" />
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send reply"}
        </Button>
      </div>
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      {state.sentAt && !state.error && !pending && (
        <p role="status" className="text-muted-foreground text-sm">
          Sent.
        </p>
      )}
    </form>
  );
};

export { ReplyForm };
