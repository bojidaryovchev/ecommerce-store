import { z } from "zod";

/**
 * The online withdrawal form, checked the same way in the browser (React Hook Form) and in the action. It asks
 * only for what the law lets a trader ask: who, which contract, and where to send the confirmation. Each
 * message is the key of its text under `info.withdrawal.errors`.
 */
export const withdrawalSchema = z
  .object({
    name: z.string().trim().min(1, "name").max(120, "name"),
    email: z.string().trim().max(200, "email").pipe(z.email("email")),
    order: z.string().trim().min(1, "order").max(100, "order"),
    /** The day the goods arrived, "YYYY-MM-DD"; optional, and left out rather than refused when unreadable. */
    received: z.string().trim().max(10),
    scope: z.enum(["all", "part"]),
    items: z.string().trim().max(2000, "items"),
    note: z.string().trim().max(2000),
  })
  .superRefine((input, context) => {
    if (input.scope === "part" && !input.items) context.addIssue({ code: "custom", path: ["items"], message: "items" });
  });

export type WithdrawalInput = z.input<typeof withdrawalSchema>;
export type WithdrawalField = "name" | "email" | "order" | "items";
