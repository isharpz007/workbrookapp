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

export const memoryInputSchema = z.object({
  direction: directionSchema,
  // The plan: only the year is required.
  year: z.coerce
    .number({ error: "Year is required" })
    .int("Year must be a whole number")
    .min(MIN_YEAR, `Year can't be before ${MIN_YEAR}`)
    .max(MAX_YEAR, "Year can't be in the future"),
  jobTitle: optText(LIMITS.jobTitle),
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
  visibility: visibilitySchema.default("only_me"),
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
  jobTitle: string;
  personFirstName: string;
  personLastInitial: string;
  personCity: string;
  personRegion: string;
  authorEmail: string;
  personEmail: string;
  visibility: Visibility;
  turnstileToken: string;
};
