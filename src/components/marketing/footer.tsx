import Link from "next/link";
import { Facebook, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-grey-100 bg-white px-6 py-20 dark:border-zinc-800 dark:bg-black md:px-20">
      <div className="mx-auto grid max-w-7xl gap-12 pb-20 md:grid-cols-4">
        <div className="space-y-6">
          <Link href="/" className="flex items-center font-display text-xl">
            <span className="mr-2 text-primary">🦊</span>
            Saleh<span className="text-primary">.</span>Tech
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
        <div>
          <h4 className="mb-6 text-sm font-bold uppercase tracking-widest">Bizi İzləyin</h4>
          <div className="flex space-x-4">
            {[Facebook, Instagram, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-grey-100 text-grey-500 transition-all hover:border-primary hover:bg-primary hover:text-white dark:border-zinc-800 dark:text-zinc-400"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-grey-100 pt-10 text-xs text-grey-500 dark:border-zinc-800 dark:text-zinc-500 md:flex-row">
        <p>© 2026 Saleh Tech School. Bütün hüquqlar qorunur.</p>
        <div className="flex space-x-6 font-bold uppercase tracking-widest">
          <Link href="/" className="hover:text-primary transition-colors">Məxfilik</Link>
          <Link href="/" className="hover:text-primary transition-colors">Şərtlər</Link>
        </div>
      </div>
    </footer>
  );
}
