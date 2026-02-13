import { getAllOrders, type GetAllOrdersOptions } from "@/queries/orders";
import React from "react";
import { OrdersTable } from "./orders-table";

type Props = {
  status?: GetAllOrdersOptions["status"];
};

const OrdersTableLoader: React.FC<Props> = async ({ status }) => {
  const orders = await getAllOrders({ status });
  return <OrdersTable orders={orders} currentStatus={status} />;
};

export { OrdersTableLoader };
