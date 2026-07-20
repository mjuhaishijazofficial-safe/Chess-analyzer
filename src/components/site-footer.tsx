import { Logo } from "./logo";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  return (
    <footer className="border-t border-line bg-bg-soft">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-md text-sm leading-relaxed text-muted">
            {t("description")}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted">
          <a
            href="https://www.chess.com/news/view/published-data-api"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-fg"
          >
            {t("publishedDataApi")} ↗
          </a>
          <a
            href="https://www.chess.com"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-fg"
          >
            {t("chessComLink")} ↗
          </a>
          <Link href="/privacy" className="transition hover:text-fg">
            {t("privacyPolicy")}
          </Link>
          <Link href="/terms" className="transition hover:text-fg">
            {t("termsOfUse")}
          </Link>
          <span className="text-faint">
            © {new Date().getFullYear()} ChessDeeper
          </span>
        </div>
      </div>
    </footer>
  );
}