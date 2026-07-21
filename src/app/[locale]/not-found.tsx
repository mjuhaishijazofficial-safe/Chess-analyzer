import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-panel-2 text-3xl">
        ♟
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        404 — this square is empty
      </h1>
      <p className="mt-2 text-pretty text-muted">
        The page you&apos;re looking for doesn&apos;t exist, or the link may
        be out of date.
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
        >
          Back home
        </Link>
        <Link
          href="/puzzles"
          className="rounded-lg border border-line bg-panel px-5 py-2.5 text-sm text-fg transition hover:border-line-strong"
        >
          Try a puzzle instead
        </Link>
      </div>
    </div>
  );
}
