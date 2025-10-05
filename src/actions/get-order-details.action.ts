"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type OrderDetails = Prisma.OrderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
      };
    };
    items: {
      include: {
        product: {
          select: {
            id: true;
            name: true;
            slug: true;
            price: true;
            images: {
              take: 1;
              orderBy: {
                position: "asc";
              };
            };
          };
        };
        variant: {
          select: {
            id: true;
            name: true;
            sku: true;
          };
        };
      };
    };
    shippingAddress: true;
    billingAddress: true;
    statusHistory: {
      orderBy: {
        createdAt: "desc";
      };
    };
  };
}>;

export async function getOrderDetails(orderId: string): Promise<OrderDetails | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: {
                  take: 1,
                  orderBy: {
                    position: "asc",
                  },
                },
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        statusHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return order;
  } catch (error) {
    console.error("Failed to fetch order details:", error);
    throw new Error("Failed to fetch order details");
  }
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string): Promise<OrderDetails | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: {
                  take: 1,
                  orderBy: {
                    position: "asc",
                  },
                },
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        statusHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return order;
  } catch (error) {
    console.error("Failed to fetch order by number:", error);
    throw new Error("Failed to fetch order by number");
  }
}
