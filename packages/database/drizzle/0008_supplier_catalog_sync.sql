CREATE TYPE "public"."attribute_value_source" AS ENUM('supplier', 'manual');--> statement-breakpoint
CREATE TYPE "public"."supplier_platform" AS ENUM('woocommerce');--> statement-breakpoint
CREATE TYPE "public"."sync_change_status" AS ENUM('pending', 'applied', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."sync_change_type" AS ENUM('new_product', 'price_change', 'removed', 'restored', 'locked_field_changed');--> statement-breakpoint
CREATE TYPE "public"."sync_run_mode" AS ENUM('incremental', 'full');--> statement-breakpoint
CREATE TYPE "public"."sync_run_status" AS ENUM('running', 'succeeded', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."sync_run_trigger" AS ENUM('schedule', 'manual', 'cli');--> statement-breakpoint
CREATE TABLE "attribute" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"unit" text,
	"filterable" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attribute_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_attribute_value" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"attribute_id" text NOT NULL,
	"value" text NOT NULL,
	"numeric_value" double precision,
	"source" "attribute_value_source" DEFAULT 'manual' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_attribute" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"attribute_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_category" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"external_id" integer NOT NULL,
	"parent_external_id" integer,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"product_count" integer DEFAULT 0 NOT NULL,
	"category_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_product" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"external_id" integer NOT NULL,
	"product_id" text,
	"name" text NOT NULL,
	"permalink" text,
	"sku" text,
	"price_amount" integer,
	"regular_price_amount" integer,
	"currency" text DEFAULT 'eur' NOT NULL,
	"in_stock" boolean NOT NULL,
	"on_backorder" boolean DEFAULT false NOT NULL,
	"purchasable" boolean NOT NULL,
	"category_external_ids" integer[] DEFAULT '{}' NOT NULL,
	"data" jsonb NOT NULL,
	"content_hash" text NOT NULL,
	"supplier_modified_at" timestamp,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"missing_count" integer DEFAULT 0 NOT NULL,
	"removed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_product_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "supplier" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"base_url" text NOT NULL,
	"platform" "supplier_platform" DEFAULT 'woocommerce' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp,
	"last_full_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sync_change" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"run_id" text,
	"supplier_product_id" text NOT NULL,
	"product_id" text,
	"type" "sync_change_type" NOT NULL,
	"field" text,
	"previous_value" jsonb,
	"new_value" jsonb,
	"status" "sync_change_status" DEFAULT 'pending' NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_run" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"mode" "sync_run_mode" NOT NULL,
	"trigger" "sync_run_trigger" NOT NULL,
	"status" "sync_run_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"stats" jsonb DEFAULT '{"seen":0,"fetched":0,"created":0,"updated":0,"unchanged":0,"removed":0,"restored":0,"failed":0,"pendingReview":0}'::jsonb NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "brand" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "locked_fields" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_attribute_value" ADD CONSTRAINT "product_attribute_value_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_value" ADD CONSTRAINT "product_attribute_value_attribute_id_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attribute"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_attribute" ADD CONSTRAINT "supplier_attribute_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_attribute" ADD CONSTRAINT "supplier_attribute_attribute_id_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attribute"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_category" ADD CONSTRAINT "supplier_category_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_category" ADD CONSTRAINT "supplier_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_product" ADD CONSTRAINT "supplier_product_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_product" ADD CONSTRAINT "supplier_product_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_change" ADD CONSTRAINT "sync_change_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_change" ADD CONSTRAINT "sync_change_run_id_sync_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."sync_run"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_change" ADD CONSTRAINT "sync_change_supplier_product_id_supplier_product_id_fk" FOREIGN KEY ("supplier_product_id") REFERENCES "public"."supplier_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_change" ADD CONSTRAINT "sync_change_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_change" ADD CONSTRAINT "sync_change_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_run" ADD CONSTRAINT "sync_run_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_attribute_value_unique_idx" ON "product_attribute_value" USING btree ("product_id","attribute_id","value");--> statement-breakpoint
CREATE INDEX "product_attribute_value_attribute_idx" ON "product_attribute_value" USING btree ("attribute_id","numeric_value");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_attribute_supplier_key_idx" ON "supplier_attribute" USING btree ("supplier_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_category_supplier_external_idx" ON "supplier_category" USING btree ("supplier_id","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_product_supplier_external_idx" ON "supplier_product" USING btree ("supplier_id","external_id");--> statement-breakpoint
CREATE INDEX "sync_change_status_created_idx" ON "sync_change" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "sync_change_supplier_product_idx" ON "sync_change" USING btree ("supplier_product_id");--> statement-breakpoint
CREATE INDEX "sync_run_supplier_started_idx" ON "sync_run" USING btree ("supplier_id","started_at");