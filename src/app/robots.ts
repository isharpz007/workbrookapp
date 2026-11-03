import type { MetadataRoute } from "next";

// Browsable but not indexed — per the plan.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/$", "/add", "/privacy"],
      disallow: ["/memories", "/named", "/manage", "/my-entries", "/admin"],
    },
  };
}
