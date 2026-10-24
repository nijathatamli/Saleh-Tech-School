import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/marketing/page-intro";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublicContact } from "@/lib/contact";
import { SEO, SITE_NAME, absoluteUrl, breadcrumbLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("contact");
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const c = await getPublicContact();
  const rows = [
    c.phone && { icon: Phone, label: "Telefon", value: c.phone, href: `tel:${c.phone.replace(/[^\d+]/g, "")}` },
    c.email && { icon: Mail, label: "E-poçt", value: c.email, href: `mailto:${c.email}` },
    c.address && { icon: MapPin, label: "Ünvan", value: c.address, href: undefined },
  ].filter((r): r is { icon: typeof Phone; label: string; value: string; href: string | undefined } => !!r);

  return (
    <div className="px-6 py-20 md:px-20">
      <JsonLd
        data={[
          breadcrumbLd([{ name: "Əlaqə", path: SEO.contact.path }]),
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: `${SITE_NAME} — əlaqə`,
            url: absoluteUrl(SEO.contact.path),
            mainEntity: {
              "@type": "EducationalOrganization",
              "@id": absoluteUrl("/#organization"),
              name: SITE_NAME,
              ...(c.phone ? { telephone: c.phone } : {}),
              ...(c.email ? { email: c.email } : {}),
              ...(c.address ? { address: { "@type": "PostalAddress", streetAddress: c.address, addressCountry: "AZ" } } : {}),
            },
          },
        ]}
      />
      <PageIntro
        eyebrow="Əlaqə"
        title="Bizimlə əlaqə saxlayın: pulsuz konsultasiya"
        lead="IT kursları, uyğun yaş qrupu və dərs cədvəli haqqında suallarınız var? Ödənişsiz konsultasiyaya yazılın, biz sizinlə əlaqə saxlayaq."
      />

      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
        <section aria-labelledby="c-info" className="rounded-3xl border border-grey-100 p-8 dark:border-zinc-800">
          <h2 id="c-info" className="font-display text-xl">Əlaqə məlumatları</h2>
          {rows.length > 0 ? (
            <ul className="mt-6 space-y-5">
              {rows.map((r) => (
                <li key={r.label} className="flex items-start gap-4">
                  <r.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-grey-500 dark:text-zinc-500">{r.label}</p>
                    {r.href ? (
                      <a href={r.href} className="font-medium transition-colors hover:text-primary">{r.value}</a>
                    ) : (
                      <p className="font-medium">{r.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm leading-relaxed text-grey-500 dark:text-zinc-400">
              Telefon və ünvan məlumatları tezliklə burada olacaq. Hələlik konsultasiya üçün sorğu göndərin, sizinlə özümüz əlaqə saxlayacağıq.
            </p>
          )}
        </section>

        <section aria-labelledby="c-trial" className="flex flex-col justify-between gap-6 rounded-3xl bg-primary p-8 text-white">
          <div className="space-y-3">
            <h2 id="c-trial" className="font-display text-xl">Ödənişsiz konsultasiya və demo dərs</h2>
            <p className="text-sm leading-relaxed text-white/85">
              Övladınızın yaşını və maraq dairəsini seçin, sizə uyğun kurs və vaxt təklif edək. Sınaq dərsi ödənişsizdir.
            </p>
          </div>
          <Button asChild size="lg" className="bg-white text-primary shadow-none hover:bg-white">
            <Link href="/sinaq-dersi">Konsultasiyaya yazıl</Link>
          </Button>
        </section>
      </div>

      <section aria-labelledby="c-links" className="mx-auto mt-20 max-w-3xl text-center">
        <h2 id="c-links" className="font-display text-2xl">Kurslarımızla tanış olun</h2>
        <p className="mt-3 text-grey-500 dark:text-zinc-400">
          <Link href="/kurslar" className="text-primary underline-offset-4 hover:underline">Bütün kurslar</Link>,{" "}
          <Link href="/muellimler" className="text-primary underline-offset-4 hover:underline">müəllimlərimiz</Link> və{" "}
          <Link href="/teqaud" className="text-primary underline-offset-4 hover:underline">təqaüd proqramı</Link> haqqında ətraflı məlumat alın.
        </p>
      </section>
    </div>
  );
}
