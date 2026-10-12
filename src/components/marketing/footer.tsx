import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/app/logo";
import { Facebook, Instagram, Linkedin } from "lucide-react";

// Real profile links come from the environment (NEXT_PUBLIC_SOCIAL_FACEBOOK / _INSTAGRAM / _LINKEDIN). An icon without
// a URL is not rendered: the old placeholders pointed at "#" and had no accessible name.
const social = [
  { label: "Facebook", Icon: Facebook, href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK },
  { label: "Instagram", Icon: Instagram, href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM },
  { label: "LinkedIn", Icon: Linkedin, href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN },
].filter((x): x is { label: string; Icon: typeof Facebook; href: string } => !!x.href && /^https:\/\//.test(x.href));

export function Footer() {
  return (
    <footer className="border-t border-grey-100 bg-white px-6 py-20 dark:border-zinc-800 dark:bg-black md:px-20">
      <div className="mx-auto grid max-w-7xl gap-12 pb-20 md:grid-cols-4">
        <div className="space-y-6">
          <Link href="/" className="flex items-center">
            <Logo size={20} />
          </Link>
          <p className="text-sm leading-relaxed text-grey-500 dark:text-zinc-400">
            6-18 yaş arası uşaqlar üçün texnologiya və proqramlaşdırma məktəbi.
          </p>
        </div>
        <div>
          <h4 className="mb-6 text-sm font-bold uppercase tracking-widest">Kurslar</h4>
          <ul className="space-y-4 text-sm text-grey-500 dark:text-zinc-400">
            <li><Link href="/kurslar" className="hover:text-primary transition-colors">Kiber Təhlükəsizlik</Link></li>
            <li><Link href="/kurslar" className="hover:text-primary transition-colors">Proqramlaşdırma</Link></li>
            <li><Link href="/kurslar" className="hover:text-primary transition-colors">Robototexnika</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-6 text-sm font-bold uppercase tracking-widest">Şirkət</h4>
          <ul className="space-y-4 text-sm text-grey-500 dark:text-zinc-400">
            <li><Link href="/" className="hover:text-primary transition-colors">Haqqımızda</Link></li>
            <li><Link href="/" className="hover:text-primary transition-colors">Vakansiyalar</Link></li>
            <li><Link href="/" className="hover:text-primary transition-colors">Əlaqə</Link></li>
          </ul>
        </div>
        {social.length > 0 && (
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-widest">Bizi İzləyin</h4>
            <div className="flex space-x-4">
              {social.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-grey-100 text-grey-500 transition-all hover:border-primary hover:bg-primary hover:text-white dark:border-zinc-800 dark:text-zinc-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-grey-100 pt-10 text-xs text-grey-500 dark:border-zinc-800 dark:text-zinc-500 md:flex-row">
        <p>© 2026 Saleh Tech School. Bütün hüquqlar qorunur.</p>
        <a
          href="https://tezsayt.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-full border border-grey-100 bg-grey-50 py-2 pl-5 pr-5 text-xs normal-case tracking-normal transition-colors hover:border-primary dark:border-zinc-800 dark:bg-zinc-900/60"
          aria-label="Bu sayt tezsayt.dev tərəfindən yaradılıb"
        >
          <span>Bu sayt</span>
          <span className="rounded-full bg-white px-4 py-1.5 shadow-sm ring-1 ring-grey-100 dark:ring-0">
            <Image src="/images/tezsayt-logo.png" alt="tezsayt.dev" width={384} height={61} className="h-5 w-auto" />
          </span>
          <span>tərəfindən yaradılıb</span>
        </a>
        <div className="flex space-x-6 font-bold uppercase tracking-widest">
          <Link href="/" className="hover:text-primary transition-colors">Məxfilik</Link>
          <Link href="/" className="hover:text-primary transition-colors">Şərtlər</Link>
        </div>
      </div>
    </footer>
  );
}
