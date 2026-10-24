import { getSettings } from "@/lib/settings";

/** Public contact details from the admin's Settings page. Empty strings when not filled in (or the database is unreachable). */
export async function getPublicContact() {
  try {
    const s = await getSettings();
    return { phone: s["school.phone"], email: s["school.email"], address: s["school.address"] };
  } catch {
    return { phone: "", email: "", address: "" };
  }
}
