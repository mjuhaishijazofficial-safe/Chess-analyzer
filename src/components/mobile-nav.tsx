"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NAV_ITEMS } from "./site-sidebar";
import { Logo } from "./logo";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close the drawer automatically whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent the page behind the drawer from scrolling while it's open.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const drawer = (
    <div className="fixed inset-0 z-[100] flex">
      <div
        className="absolute inset-0 bg-black/80"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <nav className="relative z-10 flex h-full w-[78vw] max-w-72 flex-col gap-0.5 border-r border-line bg-[#0d1015] px-3 py-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between px-1.5">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-panel-2 hover:text-fg"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
              <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[15px] transition ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-panel-2 hover:text-fg"
              }`}
            >
              <span className={active ? "text-accent" : "text-faint"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col gap-0.5 border-t border-line pt-3">
          <Link
            href="/compare"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[15px] text-muted transition hover:bg-panel-2 hover:text-fg"
          >
            ⚖️ Compare players
          </Link>
          <Link
            href="/journey"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[15px] text-muted transition hover:bg-panel-2 hover:text-fg"
          >
            📜 My Chess Journey
          </Link>
        </div>
      </nav>
    </div>
  );

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-panel text-fg transition hover:border-line-strong"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
          <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {mounted && open ? createPortal(drawer, document.body) : null}
    </div>
  );
}
