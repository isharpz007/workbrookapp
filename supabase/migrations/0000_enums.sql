CREATE TYPE "public"."direction" AS ENUM('someone_helped_me', 'i_helped_someone');
--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('private', 'pending_consent', 'confirmed', 'hidden', 'removed');
