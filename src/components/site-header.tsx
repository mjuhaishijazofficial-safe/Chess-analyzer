"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { LanguageSwitcherV2 } from "./language-switcher-v2";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [value, setValue] = useState("");
  const onHome = pathname === "/";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const u = value.trim().toLowerCase();
    if (u) router.push(`/player/${encodeURIComponent(u)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <MobileNav />
        <Logo compact className="md:hidden" />

        <div className="ml-auto flex items-center gap-3">
          {!onHome && (
            <form onSubmit={submit} className="hidden sm:block">
              <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-1.5 focus-within:border-line-strong">
                <span className="text-faint">🔎</span>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Search a player…"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  className="w-40 bg-transparent text-sm text-fg placeholder:text-faint outline-none"
                />
              </div>
            </form>
          )}
          <LanguageSwitcherV2 />
        </div>
      </div>
    </header>
  );
}