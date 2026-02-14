import { getCoupons } from "@/queries/coupons";
import React from "react";
import { PromotionForm } from "./promotion-form";

const PromotionFormLoader: React.FC = async () => {
  const { data: coupons } = await getCoupons({ pageSize: 200 });

  return <PromotionForm coupons={coupons} />;
};

export { PromotionFormLoader };
