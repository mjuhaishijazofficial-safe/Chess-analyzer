import { Logo } from "./logo";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-soft">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-md text-sm leading-relaxed text-muted">
            A reader for the Chess.com public API. ChessBuddy is an independent
            project and is not affiliated with or endorsed by Chess.com.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted">
          <a
            href="https://www.chess.com/news/view/published-data-api"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-fg"
          >
            Published-Data API ↗
          </a>
          <a
            href="https://www.chess.com"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-fg"
          >
            Chess.com ↗
          </a>
          <Link href="/privacy" className="transition hover:text-fg">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition hover:text-fg">
            Terms of Use
          </Link>
          <span className="text-faint">
            © {new Date().getFullYear()} ChessBuddy
          </span>
        </div>
      </div>
    </footer>
  );
}
