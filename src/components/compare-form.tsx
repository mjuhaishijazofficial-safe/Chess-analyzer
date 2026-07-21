"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

type Platform = "chesscom" | "lichess";

interface CompareFormProps {
  defaultA?: string;
  defaultAPlatform?: Platform;
  defaultB?: string;
  defaultBPlatform?: Platform;
  errorA?: string | null;
  errorB?: string | null;
}

export function CompareForm({
  defaultA = "",
  defaultAPlatform = "chesscom",
  defaultB = "",
  defaultBPlatform = "chesscom",
  errorA,
  errorB,
}: CompareFormProps) {
  const router = useRouter();
  const [aName, setAName] = useState(defaultA);
  const [aPlatform, setAPlatform] = useState<Platform>(defaultAPlatform);
  const [bName, setBName] = useState(defaultB);
  const [bPlatform, setBPlatform] = useState<Platform>(defaultBPlatform);
  const [formError, setFormError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ca = aName.trim().toLowerCase();
    const cb = bName.trim().toLowerCase();
    if (!ca || !cb) {
      setFormError("Enter both usernames to compare.");
      return;
    }
    const params = new URLSearchParams({
      a: ca,
      aPlatform,
      b: cb,
      bPlatform,
    });
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-4">
      <PlayerField
        label="Player 1"
        name={aName}
        setName={setAName}
        platform={aPlatform}
        setPlatform={setAPlatform}
        error={errorA}
      />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="font-mono text-xs text-faint">VS</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <PlayerField
        label="Player 2"
        name={bName}
        setName={setBName}
        platform={bPlatform}
        setPlatform={setBPlatform}
        error={errorB}
      />

      {formError && <p className="text-sm text-rose">{formError}</p>}

      <button
        type="submit"
        className="ring-focus w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
      >
        Compare
      </button>
    </form>
  );
}

function PlayerField({
  label,
  name,
  setName,
  platform,
  setPlatform,
  error,
}: {
  label: string;
  name: string;
  setName: (v: string) => void;
  platform: Platform;
  setPlatform: (p: Platform) => void;
  error?: string | null;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-faint">
          {label}
        </span>
        <div className="inline-flex rounded-lg border border-line bg-panel p-0.5">
          {(["chesscom", "lichess"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
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
          error ? "border-rose/60" : "border-line focus-within:border-accent/60"
        }`}
      >
        <span className="font-mono text-faint">@</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="username"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="w-full bg-transparent text-[15px] text-fg placeholder:text-faint outline-none"
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose">{error}</p>}
    </div>
  );
}
