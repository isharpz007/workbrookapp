import { z } from "zod";
import { LIMITS, MAX_YEAR, MIN_YEAR } from "./constants";

const hasLink = (v: string) => /https?:\/\/|www\./i.test(v);

const emptyToUndef = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

/** Optional free-text field: trims, length-caps, rejects links, "" → undefined. */
const optText = (max: number) =>
  z.preprocess(
    emptyToUndef,
    z
      .string()
      .trim()
      .max(max, `Keep it under ${max} characters`)
      .refine((v) => !hasLink(v), "Links aren't allowed")
      .optional()
  );

const optEmail = z.preprocess(
  emptyToUndef,
  z.email("Enter a valid email").optional()
);

export const directionSchema = z.enum([
  "someone_helped_me",
  "i_helped_someone",
]);

export const visibilitySchema = z.enum(["only_me", "public"]);

export const memoryInputSchema = z
  .object({
    direction: directionSchema,
    // The plan: only the year is required.
    year: z.coerce
      .number({ error: "Year is required" })
      .int("Year must be a whole number")
      .min(MIN_YEAR, `Year can't be before ${MIN_YEAR}`)
      .max(MAX_YEAR, "Year can't be in the future"),
    month: z.preprocess(
      emptyToUndef,
      z.coerce.number().int().min(1).max(12).optional()
    ),
    day: z.preprocess(
      emptyToUndef,
      z.coerce.number().int().min(1).max(31).optional()
    ),
    jobTitle: optText(LIMITS.jobTitle),
    company: optText(LIMITS.company),
    workLocation: optText(LIMITS.workLocation),
    personFirstName: optText(LIMITS.firstName),
    personLastInitial: z.preprocess(
      (v) => {
        if (typeof v !== "string") return v;
        const c = v.trim().charAt(0);
        return c === "" ? undefined : c.toUpperCase();
      },
      z
        .string()
        .regex(/^[A-Za-z]$/, "One letter only")
        .optional()
    ),
    personCity: optText(LIMITS.city),
    personRegion: optText(LIMITS.region),
    authorEmail: optEmail,
    personEmail: optEmail,
    personPhone: optText(LIMITS.phone),
    thankYouMessage: optText(LIMITS.thankYouMessage),
    visibility: visibilitySchema.default("only_me"),
    turnstileToken: z.string().optional(),
  })
  .refine((d) => d.day === undefined || d.month !== undefined, {
    message: "Add the month before the day",
    path: ["day"],
  });

export const REPORT_REASONS = [
  "about_me",
  "false_info",
  "abuse",
  "other",
] as const;

export const thankYouInputSchema = z.object({
  memoryId: z.uuid(),
  message: z
    .string()
    .trim()
    .min(1, "Write a short message")
    .max(LIMITS.thankYouMessage),
  turnstileToken: z.string().optional(),
});

export const reportInputSchema = z.object({
  memoryId: z.uuid(),
  reason: z.enum(REPORT_REASONS),
  details: optText(LIMITS.reportDetails),
  turnstileToken: z.string().optional(),
});

export type ThankYouInput = z.infer<typeof thankYouInputSchema>;
export type ReportInput = z.infer<typeof reportInputSchema>;

export const recoverInputSchema = z.object({
  email: z.email("Enter a valid email"),
  turnstileToken: z.string().optional(),
});

export type MemoryInput = z.infer<typeof memoryInputSchema>;
export type MemoryInputRaw = z.input<typeof memoryInputSchema>;
export type Direction = z.infer<typeof directionSchema>;
export type Visibility = z.infer<typeof visibilitySchema>;

/** The shape the add-memory form works with — strings, pre-validation. */
export type MemoryFormValues = {
  direction: Direction;
  year: number | "";
  month: string;
  day: string;
  jobTitle: string;
  company: string;
  workLocation: string;
  personFirstName: string;
  personLastInitial: string;
  personCity: string;
  personRegion: string;
  authorEmail: string;
  personEmail: string;
  personPhone: string;
  thankYouMessage: string;
  visibility: Visibility;
  turnstileToken: string;
};
