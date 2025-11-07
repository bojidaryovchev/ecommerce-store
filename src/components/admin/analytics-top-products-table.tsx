"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/analytics-utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ProductPerformance {
  productId: string;
  name: string;
  slug: string;
  unitsSold: number;
  revenue: number;
  orders: number;
}

interface AnalyticsTopProductsTableProps {
  data: ProductPerformance[];
  title?: string;
  description?: string;
  showImages?: boolean;
}

type SortColumn = "revenue" | "unitsSold" | "orders";
type SortDirection = "asc" | "desc";

// SortIcon component - moved outside render
const SortIcon = ({
  column,
  sortColumn,
  sortDirection,
}: {
  column: SortColumn;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}) => {
  if (sortColumn !== column) return null;
  return sortDirection === "asc" ? (
    <ArrowUp className="ml-1 inline h-4 w-4" />
  ) : (
    <ArrowDown className="ml-1 inline h-4 w-4" />
  );
};

export function AnalyticsTopProductsTable({
  data,
  title = "Top Products",
  description,
}: AnalyticsTopProductsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("revenue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead
                className="hover:text-foreground cursor-pointer text-right"
                onClick={() => handleSort("revenue")}
              >
                Revenue <SortIcon column="revenue" sortColumn={sortColumn} sortDirection={sortDirection} />
              </TableHead>
              <TableHead
                className="hover:text-foreground cursor-pointer text-right"
                onClick={() => handleSort("unitsSold")}
              >
                Units Sold <SortIcon column="unitsSold" sortColumn={sortColumn} sortDirection={sortDirection} />
              </TableHead>
              <TableHead
                className="hover:text-foreground cursor-pointer text-right"
                onClick={() => handleSort("orders")}
              >
                Orders <SortIcon column="orders" sortColumn={sortColumn} sortDirection={sortDirection} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  No product data available for the selected period
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((product, index) => (
                <TableRow key={product.productId}>
                  <TableCell>
                    <Badge variant={index < 3 ? "default" : "secondary"}>{index + 1}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/products/${product.slug}`} className="font-medium hover:underline">
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(product.revenue)}</TableCell>
                  <TableCell className="text-right">{formatNumber(product.unitsSold)}</TableCell>
                  <TableCell className="text-right">{formatNumber(product.orders)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
