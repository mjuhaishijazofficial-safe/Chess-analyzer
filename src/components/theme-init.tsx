"use client";

import { useEffect } from "react";
import { applyTheme, getTheme } from "@/lib/theme";

/** Mounted once near the root — applies the saved theme (data-theme attribute) as soon as the app hydrates. */
export function ThemeInit() {
  useEffect(() => {
    applyTheme(getTheme());
  }, []);
  return null;
}
