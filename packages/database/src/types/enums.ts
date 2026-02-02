import {
  addressTypeEnum,
  couponDurationEnum,
  orderStatusEnum,
  priceBillingSchemeEnum,
  priceTypeEnum,
  refundReasonEnum,
  refundStatusEnum,
  taxBehaviorEnum,
  userRoleEnum,
} from "../enums";

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type AddressType = (typeof addressTypeEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type PriceType = (typeof priceTypeEnum.enumValues)[number];
export type PriceBillingScheme = (typeof priceBillingSchemeEnum.enumValues)[number];
export type TaxBehavior = (typeof taxBehaviorEnum.enumValues)[number];
export type CouponDuration = (typeof couponDurationEnum.enumValues)[number];
export type RefundStatus = (typeof refundStatusEnum.enumValues)[number];
export type RefundReason = (typeof refundReasonEnum.enumValues)[number];
