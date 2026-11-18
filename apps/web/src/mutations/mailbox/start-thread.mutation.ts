"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { getMailDeps, readAttachments } from "@/lib/mailbox";
import type { MailFormState } from "@/types/mail-form-state.type";
import { db } from "@ecommerce/database";
import { startThread } from "@ecommerce/mailbox";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** Write to someone first, from the shop's address; opens the new conversation once it is sent. */
async function startThreadAction(_previous: MailFormState, formData: FormData): Promise<MailFormState> {
  let userId: string | null;
  try {
    userId = (await requireAdmin())?.user?.id ?? null;
  } catch {
    return { error: "Your session has expired. Sign in again and retry." };
  }

  const deps = getMailDeps();
  if (!deps) return { error: "Email is not configured (EMAIL_FROM and RESEND_API_KEY)." };

  const attachments = await readAttachments(formData);
  if ("error" in attachments) return { error: attachments.error };

  const result = await startThread(
    { db, ...deps },
    {
      to: String(formData.get("to") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      body: String(formData.get("body") ?? ""),
      orderId: String(formData.get("orderId") ?? "") || null,
      correspondentName: String(formData.get("name") ?? "") || null,
      attachments,
      sentBy: userId,
    },
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/mailbox", "layout");
  redirect(`/admin/mailbox/${result.threadId}`);
}

export { startThreadAction };
