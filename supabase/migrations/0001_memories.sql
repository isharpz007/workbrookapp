CREATE TABLE "memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"direction" "direction" NOT NULL,
	"person_first_name" text,
	"person_last_initial" text,
	"person_city" text,
	"person_region" text,
	"job_title" text,
	"year" smallint NOT NULL,
	"status" "status" DEFAULT 'private' NOT NULL,
	"author_email" text,
	"person_email" text,
	"thanks_count" integer DEFAULT 0 NOT NULL,
	"manage_secret_hash" text NOT NULL,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "memories_status_idx" ON "memories" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "memories_year_idx" ON "memories" USING btree ("year");
--> statement-breakpoint
CREATE INDEX "memories_person_name_idx" ON "memories" USING btree ("person_first_name","person_city");
