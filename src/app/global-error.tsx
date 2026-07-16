"use client";

import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-bg text-fg">
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-rose/30 bg-rose/10 text-3xl">
            ⚠
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            ChessDeeper hit a snag
          </h1>
          <p className="mt-2 text-pretty text-muted">
            Something went wrong loading the app itself. Please try
            reloading — if this keeps happening, let us know.
          </p>

          <div className="mt-8 flex gap-3">
            <button
              onClick={reset}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Reload
            </button>
            <a
              href="/"
              className="rounded-lg border border-line bg-panel px-5 py-2.5 text-sm text-fg transition hover:border-line-strong"
            >
              Back home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
