CREATE TABLE "stop_emails" (
	"email_hash" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
