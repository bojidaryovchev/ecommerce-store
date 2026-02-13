import { Card, CardContent } from "@/components/ui/card";

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Categories</p>
            <p className="text-2xl font-bold">Manage your categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Products</p>
            <p className="text-2xl font-bold">Manage your products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Orders</p>
            <p className="text-2xl font-bold">View orders</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { AdminDashboard };
