"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/login-form";

const RECENT_KEY = "chessbuddy:recent";

type Platform = "chesscom" | "lichess";
interface RecentEntry {
  username: string;
  platform: Platform;
}

function parseRecent(raw: string): RecentEntry[] {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) =>
    typeof item === "string"
      ? { username: item, platform: "chesscom" as const }
      : (item as RecentEntry),
  );
}

export default function GamesPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [hasRecent, setHasRecent] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const recent = raw ? parseRecent(raw) : [];
      const latest = recent[0];
      if (latest) {
        setHasRecent(true);
        const query = latest.platform === "lichess" ? "?platform=lichess" : "";
        router.replace(
          `/player/${encodeURIComponent(latest.username)}${query}#recent-games`,
        );
        return;
      }
    } catch {
      /* ignore */
    }
    setChecked(true);
  }, [router]);

  if (!checked || hasRecent) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-faint/30 border-t-accent" />
          Taking you to your games…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-2 grid h-14 w-14 place-items-center rounded-2xl border border-line bg-panel-2 text-2xl">
        🎮
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        No player connected yet
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Connect a Chess.com or Lichess username to see your recent games,
        results and engine reviews here.
      </p>
      <div className="mt-6 w-full">
        <LoginForm autoFocus={false} />
      </div>
    </div>
  );
}
