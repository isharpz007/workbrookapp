"use client";

import { AnimatePresence, motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildSentence } from "@/lib/sentence";
import type { MemoryFormValues } from "@/lib/validation";

/** Live preview — re-animates each time the sentence changes. */
export function SentencePreview({ values }: { values: MemoryFormValues }) {
  const sentence = buildSentence({
    direction: values.direction ?? "someone_helped_me",
    personFirstName: values.personFirstName || null,
    personLastInitial: values.personLastInitial || null,
    personCity: values.personCity || null,
  });

  const meta = [values.jobTitle, values.year, values.personRegion]
    .filter(Boolean)
    .join(" · ");

  const isPublic = values.visibility === "public";

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="text-base">Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={sentence}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="text-lg font-medium leading-snug"
            aria-live="polite"
          >
            {sentence}
          </motion.p>
        </AnimatePresence>

        {meta && (
          <p className="text-sm text-muted-foreground">{meta}</p>
        )}

        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
          {isPublic ? (
            <Eye className="size-4 text-confirmed" aria-hidden />
          ) : (
            <EyeOff className="size-4 text-muted-foreground" aria-hidden />
          )}
          <span>
            Visible to:{" "}
            <strong>{isPublic ? "Public (after consent)" : "Only me"}</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
