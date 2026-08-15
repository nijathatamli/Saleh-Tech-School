"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CtaSection() {
  const router = useRouter();
  const [phone, setPhone] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/sinaq-dersi${phone ? `?phone=${encodeURIComponent(phone)}` : ""}`);
  }

  return (
    <section id="contact" className="relative overflow-hidden bg-primary px-6 py-32 text-center md:px-20">
      <div className="absolute -left-10 bottom-0 rotate-12 text-[16rem] opacity-20">🦊</div>
      <div className="relative z-10 mx-auto max-w-3xl space-y-8">
        <h2 className="font-display text-4xl leading-tight text-white md:text-6xl">
          Uşağınızın gələcəyi bu gündən başlasın!
        </h2>
        <p className="text-lg text-white/80">Ödənişsiz sınaq dərsi üçün qeydiyyatdan keçin və bizimlə tanış olun.</p>
        <form onSubmit={handleSubmit} className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefon nömrəniz"
            className="w-full rounded-full border border-white/20 bg-white/10 px-8 py-5 text-sm text-white placeholder-white/60 transition-all focus:bg-white focus:text-secondary focus:outline-none sm:w-64"
          />
          <button
            type="submit"
            className="rounded-full bg-white px-12 py-5 text-xs font-bold uppercase tracking-widest text-primary shadow-2xl transition-all hover:scale-105"
          >
            Zəng Sifariş Et
          </button>
        </form>
      </div>
    </section>
  );
}
