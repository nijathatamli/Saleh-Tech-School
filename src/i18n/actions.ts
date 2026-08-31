"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale } from "./locales";
import { LOCALE_COOKIE_NAME } from "./server";

export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  cookies().set(LOCALE_COOKIE_NAME, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/parent", "layout");
  revalidatePath("/student", "layout");
}
