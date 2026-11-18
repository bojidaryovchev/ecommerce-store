import { z } from "zod";

/**
 * The admin mailbox's compose and reply forms. React Hook Form checks the text here; the actions take the
 * message as FormData (attachments ride along) and check everything again, attachment sizes included.
 */
export const composeSchema = z.object({
  to: z.string().trim().pipe(z.email("A valid email address")),
  subject: z.string().trim().min(1, "Write a subject").max(200, "At most 200 characters"),
  body: z.string().trim().min(1, "Write a message").max(50_000, "Too long"),
  files: z.custom<FileList | null>().optional(),
});

export const replySchema = z.object({
  body: z.string().trim().min(1, "Write a reply").max(50_000, "Too long"),
  files: z.custom<FileList | null>().optional(),
});

export type ComposeInput = z.input<typeof composeSchema>;
export type ReplyInput = z.input<typeof replySchema>;

/** The form's values as the actions read them. */
export function mailFormData(fields: Record<string, string | null | undefined>, files?: FileList | null): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) if (value) data.set(name, value);
  for (const file of Array.from(files ?? [])) data.append("files", file);
  return data;
}
