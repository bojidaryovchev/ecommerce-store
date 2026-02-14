import { Pagination } from "@/components/common/pagination";
import { getPromotionCodes } from "@/queries/promotions";
import React from "react";
import { PromotionsTable } from "./promotions-table";

type Props = {
  page?: number;
};

const PromotionsTableLoader: React.FC<Props> = async ({ page = 1 }) => {
  const { data: promotionCodes, pageCount } = await getPromotionCodes({ page });

  return (
    <>
      <PromotionsTable promotionCodes={promotionCodes} />
      <Pagination page={page} pageCount={pageCount} />
    </>
  );
};

export { PromotionsTableLoader };
