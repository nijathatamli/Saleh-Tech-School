import { Hero } from "@/components/marketing/hero";
import { Marquee } from "@/components/marketing/marquee";
import { Stats } from "@/components/marketing/stats";
import { WhyUs } from "@/components/marketing/why-us";
import { AgeGroups } from "@/components/marketing/age-groups";
import { CoursesSection } from "@/components/marketing/courses-section";
import { TeachersSection } from "@/components/marketing/teachers-section";
import { ParentPanelPreview } from "@/components/marketing/parent-panel-preview";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { CtaSection } from "@/components/marketing/cta-section";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <Stats />
      <WhyUs />
      <AgeGroups />
      <CoursesSection />
      <TeachersSection />
      <ParentPanelPreview />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
