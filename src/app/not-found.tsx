import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center dark:bg-black">
      <span className="text-8xl">🦊</span>
      <h1 className="mt-6 font-display text-4xl md:text-6xl">404</h1>
      <p className="mt-4 max-w-sm text-grey-500 dark:text-zinc-400">
        Axtardığınız səhifə tapılmadı. Bəlkə tülkümüz onu haradasa gizlədib.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/">Ana səhifəyə qayıt</Link>
      </Button>
    </div>
  );
}
