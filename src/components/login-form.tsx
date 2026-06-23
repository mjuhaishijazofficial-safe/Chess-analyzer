"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RECENT_KEY = "chessbuddy:recent";

export function LoginForm({ autoFocus = true }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  async function connect(rawUsername: string) {
    const username = rawUsername.trim().toLowerCase();
    setError(null);
    if (!username) {
      setError("Enter your Chess.com username.");
      return;
    }
    if (!/^[a-z0-9_-]{2,30}$/.test(username)) {
      setError("Usernames are 2–30 letters, numbers, _ or -.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/verify/${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not find that player.");
        setLoading(false);
        return;
      }
      // persist to recent
      try {
        const next = [
          data.username,
          ...recent.filter((r) => r !== data.username),
        ].slice(0, 5);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      router.push(`/player/${encodeURIComponent(data.username)}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
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
            placeholder="your-chess-com-username"
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
              key={r}
              onClick={() => connect(r)}
              disabled={loading}
              className="rounded-full border border-line bg-panel px-3 py-1 text-xs text-muted transition hover:border-line-strong hover:text-fg disabled:opacity-60"
            >
              @{r}
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
