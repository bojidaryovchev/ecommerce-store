"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startThreadAction } from "@/mutations/mailbox";
import { composeSchema, mailFormData, type ComposeInput } from "@/schemas/mail.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

type Props = {
  from: string;
  defaults: {
    to?: string;
    subject?: string;
    name?: string | null;
    orderId?: string | null;
  };
};

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={id} className="text-destructive text-sm">
      {message}
    </p>
  ) : null;

/** A new message from the shop's address. Opens the conversation once sent (the action redirects); keeps the text if not. */
const ComposeForm: React.FC<Props> = ({ from, defaults }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ComposeInput>({
    resolver: zodResolver(composeSchema),
    mode: "onTouched",
    defaultValues: { to: defaults.to ?? "", subject: defaults.subject ?? "", body: "" },
  });

  const onSubmit = async (values: ComposeInput) => {
    const state = await startThreadAction(
      {},
      mailFormData(
        { to: values.to, subject: values.subject, body: values.body, name: defaults.name, orderId: defaults.orderId },
        values.files,
      ),
    );
    if (state.error) toast.error(state.error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-3xl space-y-4 rounded-lg border p-6">
      <p className="text-muted-foreground text-sm">From {from}</p>
      <div className="space-y-2">
        <Label htmlFor="compose-to">To</Label>
        <Input
          id="compose-to"
          type="email"
          {...register("to")}
          aria-invalid={Boolean(errors.to)}
          aria-describedby={errors.to ? "compose-to-error" : undefined}
          disabled={isSubmitting}
        />
        <FieldError id="compose-to-error" message={errors.to?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="compose-subject">Subject</Label>
        <Input
          id="compose-subject"
          {...register("subject")}
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? "compose-subject-error" : undefined}
          disabled={isSubmitting}
        />
        <FieldError id="compose-subject-error" message={errors.subject?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="compose-body">Message</Label>
        <Textarea
          id="compose-body"
          rows={10}
          {...register("body")}
          aria-invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? "compose-body-error" : undefined}
          disabled={isSubmitting}
        />
        <FieldError id="compose-body-error" message={errors.body?.message} />
      </div>
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
          {isSubmitting ? "Sending…" : "Send"}
        </Button>
      </div>
    </form>
  );
};

export { ComposeForm };
