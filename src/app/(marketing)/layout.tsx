import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-hidden bg-white dark:bg-black">
      <Navbar />
      <main className="pt-20">{children}</main>
      <Footer />
    </div>
  );
}
