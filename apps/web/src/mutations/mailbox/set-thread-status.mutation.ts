"use server";

import { requireAdmin } from "@/lib/auth-guard";
import type { ActionResult } from "@/types/action-result.type";
import { db } from "@ecommerce/database";
import type { MailThreadStatus } from "@ecommerce/database/schema";
import { setThreadStatus } from "@ecommerce/mailbox";
import { revalidatePath } from "next/cache";

/** Mark a conversation done, or open it again. A new message in it opens it again by itself. */
async function setThreadStatusAction(threadId: string, status: MailThreadStatus): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (status !== "open" && status !== "done") return { success: false, error: `Unknown status: ${status}` };
    await setThreadStatus(db, threadId, status);
    revalidatePath("/admin/mailbox", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating conversation status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update the conversation" };
  }
}

export { setThreadStatusAction };
