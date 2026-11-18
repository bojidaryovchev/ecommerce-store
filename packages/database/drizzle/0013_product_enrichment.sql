CREATE TYPE "public"."enrichment_stage" AS ENUM('extract', 'validate', 'classify', 'rewrite', 'publish');--> statement-breakpoint
CREATE TYPE "public"."enrichment_status" AS ENUM('succeeded', 'flagged', 'failed', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."image_kind" AS ENUM('photo', 'icon', 'badge', 'energy_label', 'spec_table', 'diagram', 'logo', 'other');--> statement-breakpoint
ALTER TYPE "public"."attribute_value_source" ADD VALUE 'enrichment' BEFORE 'manual';--> statement-breakpoint
ALTER TYPE "public"."sync_change_type" ADD VALUE 'enrichment_flagged';--> statement-breakpoint
CREATE TABLE "image_asset" (
	"url" text PRIMARY KEY NOT NULL,
	"kind" "image_kind" NOT NULL,
	"label" text,
	"width" integer,
	"height" integer,
	"source" text NOT NULL,
	"model" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_enrichment" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"stage" "enrichment_stage" NOT NULL,
	"status" "enrichment_status" NOT NULL,
	"inputs_hash" text NOT NULL,
	"output" jsonb,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"model" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"started_at" timestamp,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_enrichment" ADD CONSTRAINT "product_enrichment_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_enrichment" ADD CONSTRAINT "product_enrichment_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_enrichment_product_stage_idx" ON "product_enrichment" USING btree ("product_id","stage");--> statement-breakpoint
CREATE INDEX "product_enrichment_stage_status_idx" ON "product_enrichment" USING btree ("stage","status");