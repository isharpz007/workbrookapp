import { Banknote, Briefcase, Building2, MapPin, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const REVIEWS = [
  {
    rating: 5,
    title: "Supportive team, real growth",
    text: "Managers actually invest in juniors. I moved from intern to mid-level in two years.",
    role: "Software Engineer",
  },
  {
    rating: 4,
    title: "Good pay, busy seasons",
    text: "Compensation is above market, though release weeks get intense.",
    role: "Product Designer",
  },
];

const JOBS = [
  { title: "Frontend Engineer", location: "Lagos · Hybrid", pay: "₦8–11m / yr" },
  { title: "Data Analyst", location: "Remote", pay: "₦6–9m / yr" },
  { title: "Customer Success Lead", location: "Abuja · On-site", pay: "₦5–7m / yr" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-gold" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn("size-4", i < rating && "fill-current")}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function CompanyProfile() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-2xl font-bold text-brand">
            T
          </span>
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-semibold">TechNova</h1>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden /> Lagos, Nigeria · Technology
            </p>
            <div className="flex items-center gap-2">
              <Stars rating={4} />
              <span className="text-sm text-muted-foreground">
                4.2 · 128 reviews
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className="gap-1 bg-confirmed text-confirmed-foreground hover:bg-confirmed">
              <Building2 className="size-3.5" aria-hidden /> Verified employer
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3">
            <Star className="size-5 text-gold" aria-hidden />
            <div>
              <p className="text-lg font-semibold">4.2 / 5</p>
              <p className="text-xs text-muted-foreground">Overall rating</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Users className="size-5 text-brand" aria-hidden />
            <div>
              <p className="text-lg font-semibold">200–500</p>
              <p className="text-xs text-muted-foreground">Employees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Banknote className="size-5 text-confirmed" aria-hidden />
            <div>
              <p className="text-lg font-semibold">Above market</p>
              <p className="text-xs text-muted-foreground">Salary insight</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-2">
          <h2 className="text-lg font-semibold">About</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            TechNova builds payments and logistics software for businesses across
            West Africa. Known for a strong engineering culture, internal
            mobility and pay bands published per role.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {REVIEWS.map((r) => (
            <Card key={r.title}>
              <CardContent className="space-y-2">
                <Stars rating={r.rating} />
                <p className="font-medium leading-snug">{r.title}</p>
                <p className="text-sm text-muted-foreground">{r.text}</p>
                <p className="text-xs text-muted-foreground">{r.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Open roles</h2>
        <div className="space-y-2">
          {JOBS.map((j) => (
            <Card key={j.title} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Briefcase className="size-5" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="font-medium">{j.title}</p>
                  <p className="text-sm text-muted-foreground">{j.location}</p>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {j.pay}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
