import { createNavigation } from "next-intl/navigation";
import { SUPPORTED_LOCALES } from "./request";

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales: SUPPORTED_LOCALES,
});