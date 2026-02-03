CREATE TYPE "public"."upload_status" AS ENUM('pending', 'linked', 'deleted');--> statement-breakpoint
CREATE TABLE "upload" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"public_url" text NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer,
	"folder" text NOT NULL,
	"status" "upload_status" DEFAULT 'pending' NOT NULL,
	"linked_entity_id" text,
	"linked_entity_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"linked_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "upload_key_unique" UNIQUE("key")
);
