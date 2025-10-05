import type { ExportOrder } from "@/actions/export-orders.action";
import { format } from "date-fns";

/**
 * Convert orders to CSV format
 */
export function ordersToCSV(orders: ExportOrder[]): string {
  // Define CSV headers
  const headers = [
    "Order Number",
    "Order Date",
    "Customer Name",
    "Customer Email",
    "Items Count",
    "Total Amount",
    "Order Status",
    "Payment Status",
    "Shipping City",
    "Shipping State",
    "Shipping Country",
    "Tracking Number",
  ];

  // Convert orders to CSV rows
  const rows = orders.map((order) => {
    const customerName = order.user?.name || order.customerName || "Guest";
    const customerEmail = order.user?.email || order.customerEmail || "N/A";
    const shippingCity = order.shippingAddress?.city || "N/A";
    const shippingState = order.shippingAddress?.state || "N/A";
    const shippingCountry = order.shippingAddress?.country || "N/A";
    const trackingNumber = order.trackingNumber || "N/A";
    const orderDate = format(new Date(order.createdAt), "yyyy-MM-dd HH:mm:ss");

    return [
      order.orderNumber,
      orderDate,
      customerName,
      customerEmail,
      order._count.items.toString(),
      `$${Number(order.total).toFixed(2)}`,
      order.status,
      order.paymentStatus,
      shippingCity,
      shippingState,
      shippingCountry,
      trackingNumber,
    ];
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const cellStr = String(cell);
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(","),
    )
    .join("\n");

  return csvContent;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Create blob with UTF-8 BOM for proper Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  // Create download link and trigger download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Generate filename for CSV export
 */
export function generateCSVFilename(prefix: string = "orders"): string {
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
  return `${prefix}_${timestamp}.csv`;
}
