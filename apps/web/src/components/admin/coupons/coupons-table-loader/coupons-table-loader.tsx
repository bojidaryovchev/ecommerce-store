import { Pagination } from "@/components/common/pagination";
import { getCoupons } from "@/queries/coupons";
import React from "react";
import { CouponsTable } from "./coupons-table";

type Props = {
  page?: number;
};

const CouponsTableLoader: React.FC<Props> = async ({ page = 1 }) => {
  const { data: coupons, pageCount } = await getCoupons({ page });

  return (
    <>
      <CouponsTable coupons={coupons} />
      <Pagination page={page} pageCount={pageCount} />
    </>
  );
};

export { CouponsTableLoader };
