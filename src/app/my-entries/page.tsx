import type { Metadata } from "next";
import { MyEntriesClient } from "@/components/my-entries-client";

export const metadata: Metadata = {
  title: "My entries",
  robots: { index: false },
};

export default function MyEntriesPage() {
  return <MyEntriesClient />;
}
