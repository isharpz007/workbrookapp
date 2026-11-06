import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Privacy" };

const POINTS = [
  {
    title: "Private by default",
    body: "Nothing is public until the author chooses to share it. Entries marked \u201cOnly me\u201d never appear on the public wall.",
  },
  {
    title: "Consent first",
    body: "A named person can confirm a memory, keep it private, or have it removed entirely. No account needed.",
  },
  {
    title: "Contact details never appear",
    body: "Email addresses are used only to send consent and recovery links. They are never shown publicly or returned by the API.",
  },
  {
    title: "Initials until confirmed",
    body: "Until a named person confirms, only their initials are shown, never a full first name.",
  },
  {
    title: "Request removal",
    body: "Every public entry carries a way to request removal. Reports hide an entry immediately while it is reviewed.",
  },
  {
    title: "No accounts, no passwords",
    body: "You manage your entries with a private link. Keep it safe; it is the only key.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">Privacy</h1>
      <div className="space-y-4">
        {POINTS.map((p) => (
          <Card key={p.title}>
            <CardHeader>
              <CardTitle className="text-base">{p.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{p.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
