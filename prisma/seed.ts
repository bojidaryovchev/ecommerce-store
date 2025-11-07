import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});

const EXAMPLE_PRODUCTS = [
  {
    name: "Premium T-Shirt",
    description: "High-quality cotton t-shirt with modern fit",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"],
    unitAmount: 2999, // $29.99
  },
  {
    name: "Classic Hoodie",
    description: "Comfortable hoodie perfect for any season",
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7"],
    unitAmount: 4999, // $49.99
  },
  {
    name: "Designer Sneakers",
    description: "Stylish sneakers with superior comfort",
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772"],
    unitAmount: 8999, // $89.99
  },
  {
    name: "Canvas Backpack",
    description: "Durable backpack with multiple compartments",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62"],
    unitAmount: 5999, // $59.99
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  for (const productData of EXAMPLE_PRODUCTS) {
    console.log(`Creating product: ${productData.name}`);

    // Create product in Stripe
    const stripeProduct = await stripe.products.create({
      name: productData.name,
      description: productData.description,
      images: productData.images,
    });

    console.log(`✓ Created Stripe product: ${stripeProduct.id}`);

    // Create price in Stripe
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: productData.unitAmount,
      currency: "usd",
    });

    console.log(`✓ Created Stripe price: ${stripePrice.id}`);

    // Create product in database
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        images: productData.images,
        stripeProductId: stripeProduct.id,
        active: true,
        prices: {
          create: {
            unitAmount: productData.unitAmount,
            currency: "usd",
            stripePriceId: stripePrice.id,
            type: "ONE_TIME",
            active: true,
          },
        },
      },
      include: {
        prices: true,
      },
    });

    console.log(`✓ Created database product: ${product.id}\n`);
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Error during seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
