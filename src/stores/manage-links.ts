"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Account-less "my entries": the manage secret for each entry the visitor has
 * created lives only in their browser, keyed by memory id.
 */
export const useManageLinks = create(
  persist<{
    links: Record<string, string>;
    save: (memoryId: string, secret: string) => void;
    remove: (memoryId: string) => void;
  }>(
    (set) => ({
      links: {},
      save: (memoryId, secret) =>
        set((s) => ({ links: { ...s.links, [memoryId]: secret } })),
      remove: (memoryId) =>
        set((s) => {
          const links = { ...s.links };
          delete links[memoryId];
          return { links };
        }),
    }),
    { name: "wb-manage-links" }
  )
);
