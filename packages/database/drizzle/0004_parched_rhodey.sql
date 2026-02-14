ALTER TABLE "product" ADD COLUMN "track_inventory" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "stock_quantity" integer;