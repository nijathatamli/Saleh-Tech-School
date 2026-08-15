import type { Metadata } from "next";
import { Inter, Unbounded, Manrope } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-unbounded",
  display: "swap",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Saleh Tech School | Gələcəyin Texnologiyaları",
    template: "%s | Saleh Tech School",
  },
  description:
    "6-18 yaş arası uşaqlar üçün proqramlaşdırma, kibertəhlükəsizlik, robototexnika və digər texnologiya istiqamətləri.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="az"
      className={`${inter.variable} ${unbounded.variable} ${manrope.variable}`}
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
