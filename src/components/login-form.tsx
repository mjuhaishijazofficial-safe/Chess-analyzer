"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RECENT_KEY = "chessbuddy:recent";

type Platform = "chesscom" | "lichess";

interface RecentEntry {
  username: string;
  platform: Platform;
}

/** Reads the old string[] format (chess.com only) or the new RecentEntry[] format. */
function parseRecent(raw: string): RecentEntry[] {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) =>
    typeof item === "string"
      ? { username: item, platform: "chesscom" as const }
      : (item as RecentEntry),
  );
}

export function LoginForm({ autoFocus = true }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>("chesscom");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(parseRecent(raw));
    } catch {
      /* ignore */
    }
  }, []);

  async function connect(rawUsername: string, targetPlatform: Platform = platform) {
    const username = rawUsername.trim().toLowerCase();
    setError(null);
    if (!username) {
      setError(
        targetPlatform === "chesscom"
          ? "Enter your Chess.com username."
          : "Enter your Lichess username.",
      );
      return;
    }
    if (!/^[a-z0-9_-]{2,30}$/.test(username)) {
      setError("Usernames are 2–30 letters, numbers, _ or -.");
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        targetPlatform === "chesscom"
          ? `/api/verify/${encodeURIComponent(username)}`
          : `/api/verify-lichess/${encodeURIComponent(username)}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (!data.ok) {
        setError(
          data.error ??
            `Could not find that player on ${targetPlatform === "chesscom" ? "Chess.com" : "Lichess"}.`,
        );
        setLoading(false);
        return;
      }
      // persist to recent
      try {
        const next = [
          { username: data.username, platform: targetPlatform },
          ...recent.filter(
            (r) => !(r.username === data.username && r.platform === targetPlatform),
          ),
        ].slice(0, 5);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      const query = targetPlatform === "lichess" ? "?platform=lichess" : "";
      router.push(`/player/${encodeURIComponent(data.username)}${query}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Platform toggle */}
      <div className="mb-3 inline-flex rounded-lg border border-line bg-panel p-1">
        {(["chesscom", "lichess"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setPlatform(p);
              if (error) setError(null);
            }}
            disabled={loading}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition disabled:opacity-60 ${
              platform === p
                ? "bg-accent text-black"
                : "text-faint hover:text-fg"
            }`}
          >
            {p === "chesscom" ? "Chess.com" : "Lichess"}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          connect(value);
        }}
        className="space-y-3"
      >
        <div
          className={`group flex items-center gap-2 rounded-xl border bg-panel px-3 py-2.5 transition ${
            error ? "border-rose/60" : "border-line focus-within:border-accent/60"
          }`}
        >
          <span className="select-none font-mono text-faint">@</span>
          <input
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            disabled={loading}
            placeholder={
              platform === "chesscom"
                ? "your-chess-com-username"
                : "your-lichess-username"
            }
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="w-full bg-transparent text-[15px] text-fg placeholder:text-faint outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading}
            className="ring-focus inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Spinner /> Connecting
              </>
            ) : (
              <>Connect</>
            )}
          </button>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-rose">
            <span>⚠</span>
            {error}
          </p>
        )}
      </form>

      {recent.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-faint">
            recent
          </span>
          {recent.map((r) => (
            <button
              key={`${r.platform}:${r.username}`}
              onClick={() => connect(r.username, r.platform)}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-panel px-3 py-1 text-xs text-muted transition hover:border-line-strong hover:text-fg disabled:opacity-60"
            >
              @{r.username}
              <span className="text-faint">
                · {r.platform === "chesscom" ? "cc" : "li"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
  );
}
