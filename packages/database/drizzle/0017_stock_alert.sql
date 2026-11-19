CREATE TABLE "stock_alert" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"email" text NOT NULL,
	"locale" text DEFAULT 'bg' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock_alert" ADD CONSTRAINT "stock_alert_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stock_alert_product_email_idx" ON "stock_alert" USING btree ("product_id","email");--> statement-breakpoint
CREATE INDEX "stock_alert_email_idx" ON "stock_alert" USING btree ("email");