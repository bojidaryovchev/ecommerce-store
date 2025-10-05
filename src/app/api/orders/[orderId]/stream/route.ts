import { auth } from "@/lib/auth";
import { orderEvents, type OrderUpdateEvent } from "@/lib/order-events";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { orderId } = params;

    // Verify order exists and user has access
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user owns this order or is admin
    const isAdmin = session.user.roles?.includes("ADMIN") || session.user.roles?.includes("SUPER_ADMIN");
    if (order.userId !== session.user.id && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    let isClosed = false;

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const connectMessage = `data: ${JSON.stringify({
          type: "connected",
          orderId,
          timestamp: new Date().toISOString(),
        })}\n\n`;
        controller.enqueue(encoder.encode(connectMessage));

        // Listen for order updates
        const listener = (event: OrderUpdateEvent) => {
          if (isClosed) return;

          try {
            const message = `data: ${JSON.stringify({
              type: "order-updated",
              ...event,
              timestamp: event.timestamp.toISOString(),
            })}\n\n`;
            controller.enqueue(encoder.encode(message));
          } catch (error) {
            console.error("Error sending SSE message:", error);
          }
        };

        // Subscribe to this specific order's updates
        orderEvents.onOrderUpdate(orderId, listener);

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (isClosed) {
            clearInterval(heartbeatInterval);
            return;
          }

          try {
            const heartbeat = `: heartbeat\n\n`;
            controller.enqueue(encoder.encode(heartbeat));
          } catch (error) {
            console.error("Error sending heartbeat:", error);
            clearInterval(heartbeatInterval);
          }
        }, 30000);

        // Cleanup on connection close
        request.signal.addEventListener("abort", () => {
          isClosed = true;
          clearInterval(heartbeatInterval);
          orderEvents.offOrderUpdate(orderId, listener);
          try {
            controller.close();
          } catch {
            // Controller might already be closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error("Error in SSE endpoint:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
