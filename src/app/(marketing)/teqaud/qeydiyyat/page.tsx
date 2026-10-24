import type { Metadata } from "next";
import { RegisterForm } from "@/components/scholarship/register-form";
import { getCategories } from "@/lib/scholarship/catalog";

export const metadata: Metadata = {
  title: "Təqaüd imtahanına qeydiyyat",
  description: "Saleh Tech School təqaüd imtahanına qeydiyyat: müəllimdən aldığınız kodla qeydiyyatdan keçin və sinfinizə uyğun imtahana başlayın.",
  alternates: { canonical: "/teqaud/qeydiyyat" },
};
export const dynamic = "force-dynamic";

export default async function ScholarshipRegisterPage() {
  const categories = await getCategories();

  return (
    <section className="px-6 py-16 md:px-20">
      <RegisterForm categories={categories.map(({ key, label }) => ({ key, label }))} />
    </section>
  );
}
