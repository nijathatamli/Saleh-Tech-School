import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section id="contact" className="relative overflow-hidden bg-primary px-6 py-32 text-center md:px-20">
      <div className="absolute -left-10 bottom-0 rotate-12 text-[16rem] opacity-20">🦊</div>
      <div className="relative z-10 mx-auto max-w-3xl space-y-8">
        <h2 className="font-display text-4xl leading-tight text-white md:text-6xl">
          Uşağınızın gələcəyi bu gündən başlasın!
        </h2>
        <p className="text-lg text-white/80">Ödənişsiz sınaq dərsi üçün qeydiyyatdan keçin və bizimlə tanış olun.</p>
        <div className="flex justify-center pt-4">
          <Button asChild size="lg" className="bg-white text-primary hover:scale-105 hover:bg-white">
            <Link href="/sinaq-dersi">Ödənişsiz sınaq dərsinə yazıl</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
