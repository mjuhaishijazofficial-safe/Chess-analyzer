"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Logo } from "./logo";

type NavItem = {
  href: string;
  key: string;
  icon: ReactNode;
};

function IconOverview() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path d="M3 10.5 10 4l7 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9v6.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStats() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path d="M4 16V9M10 16V4M16 16v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconGames() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8.5h14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconPuzzles() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path
        d="M7 4h3v1.6a1.4 1.4 0 1 0 0 2.8V10h-3.6a1.4 1.4 0 1 1 0 3H10v3H7a1 1 0 0 1-1-1v-3.6a1.4 1.4 0 1 0 0-2.8V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconOpenings() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path d="M4 4.5h5.5a1.5 1.5 0 0 1 1.5 1.5v9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4.5h-5.5A1.5 1.5 0 0 0 9 6v9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBlog() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path d="M4 4h9l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6.5 8.5h7M6.5 11.5h7M6.5 14.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 3.5v1.3M10 15.2v1.3M16.5 10h-1.3M4.8 10H3.5M14.6 5.4l-.9.9M6.3 13.7l-.9.9M14.6 14.6l-.9-.9M6.3 6.3l-.9-.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", key: "overview", icon: <IconOverview /> },
  { href: "/stats", key: "stats", icon: <IconStats /> },
  { href: "/games", key: "games", icon: <IconGames /> },
  { href: "/puzzles", key: "puzzles", icon: <IconPuzzles /> },
  { href: "/openings", key: "openings", icon: <IconOpenings /> },
  { href: "/blog", key: "blog", icon: <IconBlog /> },
  { href: "/settings", key: "settings", icon: <IconSettings /> },
];

export function SiteSidebar() {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");

  return (
    <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-line bg-panel px-3 py-4 md:flex">
      <div className="px-1.5 pb-6">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-panel-2 hover:text-fg"
              }`}
            >
              <span className={active ? "text-accent" : "text-faint"}>{item.icon}</span>
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-line pt-3">
        <a
          href="https://www.chess.com/news/view/published-data-api"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted transition hover:bg-panel-2 hover:text-fg"
        >
          API
        </a>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted transition hover:bg-panel-2 hover:text-fg"
        >
          GitHub
        </a>
      </div>
    </aside>
  );
}