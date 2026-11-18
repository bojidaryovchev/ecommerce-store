"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startThreadAction } from "@/mutations/mailbox";
import type { MailFormState } from "@/types/mail-form-state.type";
import React, { startTransition, useActionState } from "react";

type Props = {
  from: string;
  defaults: {
    to?: string;
    subject?: string;
    name?: string | null;
    orderId?: string | null;
  };
};

/** A new message from the shop's address. Opens the conversation once sent; keeps the text if not. */
const ComposeForm: React.FC<Props> = ({ from, defaults }) => {
  const [state, dispatch, pending] = useActionState<MailFormState, FormData>(startThreadAction, {});

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  };

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-4 rounded-lg border p-6">
      <p className="text-muted-foreground text-sm">From {from}</p>
      {defaults.orderId && <input type="hidden" name="orderId" value={defaults.orderId} />}
      {defaults.name && <input type="hidden" name="name" value={defaults.name} />}
      <div className="space-y-2">
        <Label htmlFor="compose-to">To</Label>
        <Input id="compose-to" name="to" type="email" required defaultValue={defaults.to} disabled={pending} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="compose-subject">Subject</Label>
        <Input id="compose-subject" name="subject" required defaultValue={defaults.subject} disabled={pending} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="compose-body">Message</Label>
        <Textarea id="compose-body" name="body" rows={10} required disabled={pending} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input type="file" name="files" multiple className="max-w-sm" disabled={pending} aria-label="Attachments" />
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </Button>
      </div>
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
    </form>
  );
};

export { ComposeForm };
