import type { Metadata } from "next";
import { AddMemoryForm } from "@/components/add-memory-form";

export const metadata: Metadata = {
  title: "Add a memory",
  robots: { index: false },
};

export default function AddPage() {
  return <AddMemoryForm />;
}
