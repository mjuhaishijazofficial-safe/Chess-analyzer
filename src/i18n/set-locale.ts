"use server";

import { cookies } from "next/headers";
import { SUPPORTED_LOCALES, type Locale } from "./request";

export async function setLocale(locale: Locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}