"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MemoryFormValues } from "@/lib/validation";

export const emptyDraft: MemoryFormValues = {
  direction: "someone_helped_me",
  year: "",
  month: "",
  day: "",
  jobTitle: "",
  company: "",
  workLocation: "",
  personFirstName: "",
  personLastInitial: "",
  personCity: "",
  personRegion: "",
  authorEmail: "",
  personEmail: "",
  personPhone: "",
  thankYouMessage: "",
  visibility: "only_me",
  turnstileToken: "",
};

/** Autosaves the in-progress add-memory form so a refresh loses nothing. */
export const useDraft = create(
  persist<{
    draft: MemoryFormValues;
    setDraft: (d: MemoryFormValues) => void;
    clear: () => void;
  }>(
    (set) => ({
      draft: emptyDraft,
      setDraft: (draft) => set({ draft }),
      clear: () => set({ draft: emptyDraft }),
    }),
    { name: "wb-add-draft" }
  )
);
