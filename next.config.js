/** Baseline browser protections. A Content-Security-Policy is deliberately not set yet: the dashboards ship inline
 *  styles/scripts and a nonce-based policy needs a dedicated pass (see docs/SECURITY_REVIEW.md). */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" }, // ignored by browsers over plain http
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // the QA tooling builds into .next-qa (NEXT_DIST_DIR) so a production build never overwrites a running `next dev`
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  images: {
    // The optimizer only fetches from the one bucket the site's images live in (not from any bucket on storage.googleapis.com),
    // and only produces WebP: AVIF/HEIC decoding (libheif) is the surface of the Next.js image-optimizer advisories.
    formats: ["image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com", pathname: "/uxpilot-auth.appspot.com/**" },
    ],
  },
  async redirects() {
    // public self-registration is closed: new families request a trial lesson and the school's admins create the accounts
    return [{ source: "/qeydiyyat", destination: "/sinaq-dersi", permanent: false }];
  },
  async rewrites() {
    // pictures uploaded while the server is running are not static files for `next start`: serve them through a route
    return { beforeFiles: [{ source: "/uploads/:name", destination: "/api/uploads/:name" }] };
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
