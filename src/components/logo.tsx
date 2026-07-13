import Link from "next/link";

export function Logo({
  href = "/",
  compact = false,
  className = "",
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-lg border border-line bg-panel text-accent">
        <span className="text-lg leading-none">♞</span>
        <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-accent/0 transition group-hover:ring-accent/40" />
      </span>
      {!compact && (
        <span className="font-mono text-[15px] font-semibold tracking-tight text-fg">
          chess<span className="text-accent">buddy</span>
        </span>
      )}
    </Link>
  );
}
