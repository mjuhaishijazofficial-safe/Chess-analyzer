"use client";

import Link from "next/link";

export default function PuzzlesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-rose/30 bg-rose/10 text-3xl">
        ⚠
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        Puzzle couldn&apos;t load
      </h1>
      <p className="mt-2 text-pretty text-muted">
        Something went wrong loading or analyzing this puzzle — usually a
        temporary hiccup with the engine or puzzle data. Try again, or
        grab a fresh puzzle.
      </p>

      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
        >
          Try again
        </button>
        <Link
          href="/puzzles"
          className="rounded-lg border border-line bg-panel px-5 py-2.5 text-sm text-fg transition hover:border-line-strong"
        >
          New puzzle
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-line bg-panel px-5 py-2.5 text-sm text-fg transition hover:border-line-strong"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
