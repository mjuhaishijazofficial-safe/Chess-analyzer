import Link from "next/link";

export default function GameNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-panel text-3xl">
        🔍
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        Game not found
      </h1>
      <p className="mt-2 text-pretty text-muted">
        We couldn&apos;t locate this game in the player&apos;s recent archives.
        It may be older than the last few months, or the link may be incorrect.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
      >
        Back home
      </Link>
    </div>
  );
}
