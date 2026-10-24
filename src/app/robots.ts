import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Public marketing pages are crawlable; the four portals, the sign-in flow, the API and the exam itself are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/blogger", "/parent", "/student", "/teacher", "/api/", "/giris", "/sifre-unutdum", "/sifre-yenile", "/teqaud/imtahan", "/uploads/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
