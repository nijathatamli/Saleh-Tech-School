import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Public marketing pages are crawlable; the sign-in flow, the API and the exam itself are not.
// The panels (/admin, /teacher, ...) are left out on purpose: listing them would advertise them, and they answer 404 to crawlers anyway.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/giris", "/sifre-unutdum", "/sifre-yenile", "/teqaud/imtahan", "/uploads/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
