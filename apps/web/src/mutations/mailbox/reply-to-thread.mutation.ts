"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { getMailDeps, readAttachments } from "@/lib/mailbox";
import type { MailFormState } from "@/types/mail-form-state.type";
import { db } from "@ecommerce/database";
import { replyToThread } from "@ecommerce/mailbox";
import { revalidatePath } from "next/cache";

/**
 * Answer a conversation from the shop's address. Returns state rather than redirecting: a failed send
 * has to leave the typed reply in front of the person who typed it.
 */
async function replyToThreadAction(_previous: MailFormState, formData: FormData): Promise<MailFormState> {
  let userId: string | null;
  try {
    userId = (await requireAdmin())?.user?.id ?? null;
  } catch {
    return { error: "Your session has expired. Sign in again and retry." };
  }

  const deps = getMailDeps();
  if (!deps) return { error: "Email is not configured (EMAIL_FROM and RESEND_API_KEY)." };

  const threadId = String(formData.get("threadId") ?? "");
  const body = String(formData.get("body") ?? "");
  const attachments = await readAttachments(formData);
  if ("error" in attachments) return { error: attachments.error };

  const result = await replyToThread({ db, ...deps }, { threadId, body, attachments, sentBy: userId });
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/mailbox", "layout");
  return { sentAt: Date.now() };
}

export { replyToThreadAction };
