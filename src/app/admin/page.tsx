import { getCategories } from "@/actions/get-categories.action";
import { getProducts } from "@/actions/get-products.action";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp, DollarSign, FolderTree, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Admin dashboard overview",
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, description }) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && <p className="text-muted-foreground text-xs">{description}</p>}
          </div>
          <div className="bg-primary/10 rounded-full p-3">
            <Icon className="text-primary h-6 w-6" />
          </div>
        </div>

        {change !== undefined && (
          <div className="mt-4 flex items-center gap-1 text-sm">
            {isPositive ? (
              <>
                <ArrowUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">+{change}%</span>
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-600">{change}%</span>
              </>
            )}
            <span className="text-muted-foreground">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AdminDashboardPage: React.FC = async () => {
  // Fetch data for stats
  const [productsResult, categoriesResult] = await Promise.all([getProducts(), getCategories()]);

  const productsCount = productsResult.success ? productsResult.data.length : 0;
  const categoriesCount = categoriesResult.success ? categoriesResult.data.length : 0;

  // Calculate active and featured products
  const activeProducts = productsResult.success ? productsResult.data.filter((p) => p.isActive).length : 0;
  const featuredProducts = productsResult.success ? productsResult.data.filter((p) => p.isFeatured).length : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here&apos;s an overview of your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value="$45,231" change={20.1} icon={DollarSign} description="From 356 orders" />

        <StatCard title="Total Orders" value="356" change={12.5} icon={ShoppingCart} description="124 pending" />

        <StatCard
          title="Total Products"
          value={productsCount}
          icon={Package}
          description={`${activeProducts} active`}
        />

        <StatCard title="Total Customers" value="1,234" change={5.3} icon={Users} description="89 new this month" />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Categories</p>
                <p className="text-2xl font-bold">{categoriesCount}</p>
              </div>
              <FolderTree className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Featured Products</p>
                <p className="text-2xl font-bold">{featuredProducts}</p>
              </div>
              <TrendingUp className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Conversion Rate</p>
                <p className="text-2xl font-bold">3.24%</p>
              </div>
              <TrendingUp className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Recent Orders</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div>
                    <p className="font-medium">Order #{1000 + i}</p>
                    <p className="text-muted-foreground text-sm">Customer {i}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(Math.random() * 500 + 50).toFixed(2)}</p>
                    <p className="text-muted-foreground text-sm">Just now</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Low Stock Alert</h3>
            <div className="space-y-4">
              {productsResult.success ? (
                productsResult.data
                  .filter((p) => p.stockQuantity < 10)
                  .slice(0, 5)
                  .map((product) => (
                    <div key={product.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-muted-foreground text-sm">{product.category?.name || "Uncategorized"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-orange-600">{product.stockQuantity} left</p>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-sm">No low stock products</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
