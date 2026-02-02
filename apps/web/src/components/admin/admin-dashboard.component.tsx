"use client";

import { Card, CardBody } from "@heroui/react";

const AdminDashboardContent: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-default-500">Categories</p>
            <p className="text-2xl font-bold">Manage your categories</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-default-500">Products</p>
            <p className="text-2xl font-bold">Manage your products</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-default-500">Orders</p>
            <p className="text-2xl font-bold">View orders</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardContent;
