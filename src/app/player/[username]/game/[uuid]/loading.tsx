export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 space-y-2">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-7 w-72 rounded-md" />
        <div className="skeleton h-4 w-56 rounded" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex gap-3">
          <div className="skeleton h-auto w-7 rounded-md" />
          <div className="skeleton aspect-square w-full flex-1 rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="skeleton h-20 rounded-2xl" />
          <div className="skeleton h-40 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
      <p className="mt-6 text-center font-mono text-xs text-faint">
        <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent align-middle" />
        LOADING GAME…
      </p>
    </div>
  );
}
