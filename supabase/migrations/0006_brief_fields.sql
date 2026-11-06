ALTER TABLE "memories" ADD COLUMN "company" text;
--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "work_location" text;
--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "month" smallint;
--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "day" smallint;
--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "person_phone" text;
--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "thank_you_message" text;
--> statement-breakpoint
CREATE TABLE "thank_you_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_id" uuid NOT NULL,
	"message" text NOT NULL,
	"delivery_status" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "thank_you_messages" ADD CONSTRAINT "thank_you_messages_memory_id_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "thanks_memory_idx" ON "thank_you_messages" USING btree ("memory_id");
