import { Pagination } from "@/components/common/pagination";
import { getAllOrders, type GetAllOrdersOptions } from "@/queries/orders";
import React from "react";
import { OrdersTable } from "./orders-table";

type Props = {
  status?: GetAllOrdersOptions["status"];
  page?: number;
};

const OrdersTableLoader: React.FC<Props> = async ({ status, page = 1 }) => {
  const { data: orders, pageCount } = await getAllOrders({ status, page });

  return (
    <>
      <OrdersTable orders={orders} currentStatus={status} />
      <Pagination page={page} pageCount={pageCount} />
    </>
  );
};

export { OrdersTableLoader };
