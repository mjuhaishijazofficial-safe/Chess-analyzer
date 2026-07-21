"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

type Platform = "chesscom" | "lichess";

export function JourneyForm({ error }: { error?: string | null }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform>("chesscom");
  const [formError, setFormError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim().toLowerCase();
    if (!clean) {
      setFormError("Enter a username first.");
      return;
    }
    router.push(`/journey?u=${encodeURIComponent(clean)}&platform=${platform}`);
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-4">
      <div className="mb-1 flex justify-center">
        <div className="inline-flex rounded-lg border border-line bg-panel p-0.5">
          {(["chesscom", "lichess"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                platform === p ? "bg-accent text-black" : "text-faint hover:text-fg"
              }`}
            >
              {p === "chesscom" ? "Chess.com" : "Lichess"}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`flex items-center gap-2 rounded-xl border bg-panel px-3 py-2.5 ${
          error || formError ? "border-rose/60" : "border-line focus-within:border-accent/60"
        }`}
      >
        <span className="font-mono text-faint">@</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFormError(null);
          }}
          placeholder="username"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="w-full bg-transparent text-[15px] text-fg placeholder:text-faint outline-none"
        />
        <button
          type="submit"
          className="ring-focus inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
        >
          Generate
        </button>
      </div>
      {(error || formError) && (
        <p className="text-center text-sm text-rose">{error ?? formError}</p>
      )}
    </form>
  );
}
