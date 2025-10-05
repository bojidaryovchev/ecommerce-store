import { getCategories } from "@/actions/get-categories.action";
import { getOrderStats, getRecentOrders } from "@/actions/get-order-analytics.action";
import { getProducts } from "@/actions/get-products.action";
import OrderStatsCards from "@/components/order-stats-cards";
import RecentOrdersTable from "@/components/recent-orders-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderTree, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Admin dashboard overview",
};

const AdminDashboardPage: React.FC = async () => {
  // Fetch data for stats
  const [productsResult, categoriesResult, orderStats, recentOrders] = await Promise.all([
    getProducts(),
    getCategories(),
    getOrderStats(30),
    getRecentOrders(10),
  ]);

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

      {/* Order Stats */}
      <OrderStatsCards stats={orderStats} />

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

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentOrdersTable orders={recentOrders} />
        </CardContent>
      </Card>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product Summary */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Product Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total Products</p>
                  <p className="text-muted-foreground text-xs">All products in catalog</p>
                </div>
                <p className="text-2xl font-bold">{productsCount}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Active Products</p>
                  <p className="text-muted-foreground text-xs">Currently available</p>
                </div>
                <p className="text-2xl font-bold">{activeProducts}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Featured Products</p>
                  <p className="text-muted-foreground text-xs">Shown on homepage</p>
                </div>
                <p className="text-2xl font-bold">{featuredProducts}</p>
              </div>
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
