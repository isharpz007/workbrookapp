import {
  pgTable,
  pgEnum,
  uuid,
  text,
  smallint,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const directionEnum = pgEnum("direction", [
  "someone_helped_me",
  "i_helped_someone",
]);

export const statusEnum = pgEnum("status", [
  "private", // author chose "Only me"
  "pending_consent", // shared; named person hasn't responded
  "confirmed", // named person confirmed
  "hidden", // auto-hidden by a report, awaiting review
  "removed", // removed by named person or author
]);

export const memories = pgTable(
  "memories",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    direction: directionEnum("direction").notNull(),

    // Only a first name + last initial are ever stored — no surnames exist.
    personFirstName: text("person_first_name"),
    personLastInitial: text("person_last_initial"),
    personCity: text("person_city"),
    personRegion: text("person_region"),

    jobTitle: text("job_title"),
    company: text("company"), // employer, client or person who held the work
    workLocation: text("work_location"), // where the work happened
    year: smallint("year").notNull(),
    month: smallint("month"),
    day: smallint("day"),

    status: statusEnum("status").notNull().default("private"),

    // Private contact data — never selected into public queries.
    authorEmail: text("author_email"),
    personEmail: text("person_email"),
    personPhone: text("person_phone"),

    // Optional thank-you note written by the author (max 500 chars).
    thankYouMessage: text("thank_you_message"),

    thanksCount: integer("thanks_count").notNull().default(0),

    // The raw secret lives only in the author's manage link.
    manageSecretHash: text("manage_secret_hash").notNull(),

    confirmedAt: timestamp("confirmed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("memories_status_idx").on(t.status),
    index("memories_year_idx").on(t.year),
    index("memories_person_name_idx").on(t.personFirstName, t.personCity),
  ]
);

// One-time links: consent response, manage-link recovery, export download.
export const actionTokens = pgTable(
  "action_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memoryId: uuid("memory_id").references(() => memories.id, {
      onDelete: "cascade",
    }),
    purpose: text("purpose").notNull(), // consent | recover | export
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("tokens_memory_idx").on(t.memoryId)]
);

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  memoryId: uuid("memory_id")
    .references(() => memories.id, { onDelete: "cascade" })
    .notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("open"), // open | resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Thank-you messages left on public entries by visitors.
export const thankYouMessages = pgTable(
  "thank_you_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memoryId: uuid("memory_id")
      .references(() => memories.id, { onDelete: "cascade" })
      .notNull(),
    message: text("message").notNull(),
    deliveryStatus: text("delivery_status").notNull(), // sent | failed | not_sent
    sentAt: timestamp("sent_at").defaultNow().notNull(),
  },
  (t) => [index("thanks_memory_idx").on(t.memoryId)]
);

export const stopEmails = pgTable("stop_emails", {
  emailHash: text("email_hash").primaryKey(), // sha256(lowercased email)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(), // e.g. "add:1.2.3.4:2026-11-03"
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start").defaultNow().notNull(),
});

export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
export type ActionToken = typeof actionTokens.$inferSelect;
