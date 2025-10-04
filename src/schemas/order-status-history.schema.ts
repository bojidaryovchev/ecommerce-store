import { z } from "zod";
import { orderStatusEnum } from "./order.schema";

/**
 * Order status history creation schema
 * Records changes in order status with optional notes
 */
export const orderStatusHistorySchema = z.object({
  orderId: z.cuid("Invalid order ID"),

  fromStatus: orderStatusEnum.optional().nullable(),

  toStatus: orderStatusEnum,

  note: z.string().max(5000, "Note must be less than 5000 characters").trim().optional().nullable(),
});

/**
 * Type inference for order status history form data
 */
export type OrderStatusHistoryFormData = z.infer<typeof orderStatusHistorySchema>;
