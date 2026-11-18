CREATE TYPE "public"."mail_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."mail_thread_status" AS ENUM('open', 'done');--> statement-breakpoint
CREATE TABLE "mail_message" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"direction" "mail_direction" NOT NULL,
	"from_address" text NOT NULL,
	"from_name" text,
	"to_addresses" text NOT NULL,
	"cc_addresses" text,
	"subject" text NOT NULL,
	"body_text" text,
	"body_html" text,
	"message_id" text,
	"in_reply_to" text,
	"attachments" jsonb,
	"sender_verified" boolean,
	"sent_by" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_thread" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"correspondent" text NOT NULL,
	"correspondent_name" text,
	"status" "mail_thread_status" DEFAULT 'open' NOT NULL,
	"order_id" text,
	"last_message_at" timestamp NOT NULL,
	"last_message_direction" "mail_direction" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mail_message" ADD CONSTRAINT "mail_message_thread_id_mail_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."mail_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_message" ADD CONSTRAINT "mail_message_sent_by_user_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_thread" ADD CONSTRAINT "mail_thread_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mail_message_thread_created_idx" ON "mail_message" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "mail_message_message_id_idx" ON "mail_message" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "mail_thread_last_message_at_idx" ON "mail_thread" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "mail_thread_correspondent_idx" ON "mail_thread" USING btree ("correspondent");--> statement-breakpoint
CREATE INDEX "mail_thread_order_idx" ON "mail_thread" USING btree ("order_id");