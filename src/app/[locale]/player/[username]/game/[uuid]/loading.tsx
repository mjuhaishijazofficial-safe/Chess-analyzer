export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* prominent loading banner */}
      <div className="relative mx-auto mb-8 max-w-md overflow-hidden rounded-2xl border border-line bg-panel p-6 text-center">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-30" />
        <div className="relative">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-accent/40 bg-panel-2">
            <span className="animate-float text-3xl text-accent">♞</span>
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-fg">
            Loading your game…
          </h2>
          <p className="mt-1 text-sm text-muted">
            Fetching the game from Chess.com
          </p>

          {/* indeterminate loading bar */}
          <div className="relative mt-5 h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
            <span className="animate-indeterminate bg-gradient-to-r from-cyan to-accent" />
          </div>

          <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-faint">
            <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent align-middle" />
            preparing board &amp; engine
          </p>
        </div>
      </div>

      {/* faint skeleton underneath so the layout doesn't jump when ready */}
      <div className="grid gap-6 opacity-40 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex gap-3">
          <div className="skeleton h-auto w-7 rounded-md" />
          <div className="skeleton aspect-square w-full flex-1 rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-40 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
