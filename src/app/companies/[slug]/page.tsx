import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyProfile } from "@/components/company-profile";

export const metadata: Metadata = {
  title: "TechNova",
  description: "Explore TechNova's workplace profile, reviews, jobs and salary insights.",
};

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== "technova") notFound();

  return <CompanyProfile />;
}
