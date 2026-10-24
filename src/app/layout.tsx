import type { Metadata } from "next";
import { Inter, Unbounded } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/seo/json-ld";
import { OG_IMAGE, SEO, SITE_NAME, SITE_URL, organizationLd, websiteLd } from "@/lib/seo";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-unbounded",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SEO.home.title, template: `%s | ${SITE_NAME}` },
  description: SEO.home.description,
  keywords: SEO.home.keywords,
  applicationName: SITE_NAME,
  openGraph: { type: "website", locale: "az_AZ", siteName: SITE_NAME, title: SEO.home.title, description: SEO.home.description, url: "/", images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title: SEO.home.title, description: SEO.home.description, images: [OG_IMAGE.url] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="az"
      className={`${inter.variable} ${unbounded.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function () {
            try {
              var stored = localStorage.getItem('theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (stored ? stored === 'dark' : prefersDark) {
                document.documentElement.classList.add('dark');
              }
            } catch (e) {}
          })();`}
        </Script>
      </head>
      <body className="bg-white text-secondary dark:bg-black dark:text-white font-sans antialiased transition-colors duration-300">
        <JsonLd data={[organizationLd(), websiteLd()]} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
