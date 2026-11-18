"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { replyToThreadAction } from "@/mutations/mailbox";
import { mailFormData, replySchema, type ReplyInput } from "@/schemas/mail.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

type Props = {
  threadId: string;
  /** Shown above the box: which address the answer leaves from is the reason to answer here. */
  from: string;
  to: string;
};

/**
 * The reply box. Plain text on purpose. A failed send leaves the typed reply where it was; it is cleared only
 * after a send that worked.
 */
const ReplyForm: React.FC<Props> = ({ threadId, from, to }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReplyInput>({
    resolver: zodResolver(replySchema),
    defaultValues: { body: "" },
  });

  const onSubmit = async (values: ReplyInput) => {
    const state = await replyToThreadAction({}, mailFormData({ threadId, body: values.body }, values.files));
    if (state.error) {
      toast.error(state.error);
      return;
    }
    toast.success("Reply sent");
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label htmlFor="reply-body">Reply</Label>
        <p className="text-muted-foreground text-xs">
          from {from} to {to}
        </p>
      </div>
      <Textarea
        id="reply-body"
        rows={7}
        placeholder="Write your reply…"
        {...register("body")}
        aria-invalid={Boolean(errors.body)}
        aria-describedby={errors.body ? "reply-body-error" : undefined}
        disabled={isSubmitting}
      />
      {errors.body?.message && (
        <p id="reply-body-error" className="text-destructive text-sm">
          {errors.body.message}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          type="file"
          multiple
          className="max-w-sm"
          {...register("files")}
          disabled={isSubmitting}
          aria-label="Attachments"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reply"}
        </Button>
      </div>
    </form>
  );
};

export { ReplyForm };
