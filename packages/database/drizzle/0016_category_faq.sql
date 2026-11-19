CREATE TABLE "category_faq" (
	"category_id" text PRIMARY KEY NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"draft" jsonb,
	"status" text NOT NULL,
	"notes" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'generated' NOT NULL,
	"model" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_faq" ADD CONSTRAINT "category_faq_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;