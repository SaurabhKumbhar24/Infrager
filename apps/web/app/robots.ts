import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // App surfaces are per-user and behind auth; keep crawlers out.
        disallow: ["/dashboard", "/editor/"],
      },
    ],
    sitemap: "https://infrager.getfluiq.com/sitemap.xml",
  };
}
