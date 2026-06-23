import Link from "next/link";
import { LoginForm } from "@/components/login-form";

const DEMO_PLAYERS = [
  "magnuscarlsen",
  "hikaru",
  "gothamchess",
  "fabianocaruana",
  "anishgiri",
];

export default function HomePage() {
  return (
    <>
      {/* ================================================================ */}
      {/* HERO                                                             */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden">
        {/* animated grid + glows */}
        <div className="pointer-events-none absolute inset-0 bg-grid animate-grid mask-fade-b opacity-60" />
        <div className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(74,222,128,0.18),transparent)]" />
        <div className="pointer-events-none absolute -right-40 top-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.14),transparent)]" />

        {/* floating pieces */}
        <FloatingPieces />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          {/* left */}
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.06] px-3 py-1 font-mono text-xs text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
              ONLINE · CONNECTED TO CHESS.COM
            </div>

            <h1 className="mt-6 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="block text-fg">LEVEL UP</span>
              <span className="block text-gradient text-glow">YOUR CHESS</span>
            </h1>

            <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-muted sm:text-lg">
              Drop your Chess.com username and instantly unlock your stats,
              ratings and full game history — then run a{" "}
              <span className="text-fg">Stockfish game review</span> on any match,
              move by move.
            </p>

            <div className="mt-8">
              <LoginForm />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-faint">
                jump in
              </span>
              {DEMO_PLAYERS.map((p) => (
                <Link
                  key={p}
                  href={`/player/${p}`}
                  className="rounded-full border border-line bg-panel px-3 py-1 text-xs text-muted transition hover:border-accent/50 hover:text-accent"
                >
                  @{p}
                </Link>
              ))}
            </div>
          </div>

          {/* right — HUD player card */}
          <div className="animate-rise [animation-delay:120ms]">
            <PlayerHud />
          </div>
        </div>

        {/* bottom stat strip */}
        <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-panel/60 backdrop-blur">
            <Stat value="4" label="Time controls" />
            <Stat value="∞" label="Games in your archive" />
            <Stat value="D12" label="Engine review depth" />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FEATURES                                                         */}
      {/* ================================================================ */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature
            icon="🎯"
            title="Your profile"
            body="Avatar, title, country, league, followers and join date — your full identity card, straight from Chess.com."
          />
          <Feature
            icon="📊"
            title="Ratings & records"
            body="Bullet, blitz, rapid and daily ratings with peak highs, win/loss/draw records and win-rate per format."
          />
          <Feature
            icon="🧠"
            title="Engine game review"
            body="Step through any game on a live board. Every move graded Best → Blunder with the engine's line and accuracy %."
          />
        </div>
      </section>

      {/* ================================================================ */}
      {/* HOW IT WORKS                                                     */}
      {/* ================================================================ */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden panel rounded-2xl p-8 sm:p-10">
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.12),transparent)]" />
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            // how it works
          </h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            <Step
              n="01"
              title="Enter your username"
              body="No password, no OAuth dance. Chess.com publishes this data openly — your username is the only key."
            />
            <Step
              n="02"
              title="We pull your data"
              body="ChessBuddy calls the official Chess.com public API and assembles your profile, stats and games in seconds."
            />
            <Step
              n="03"
              title="Play it back"
              body="Explore your dashboard and replay any game with full Stockfish analysis. Share it — it's just /player/your-name."
            />
          </div>
          <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">
            Chess.com&apos;s OAuth program is invite-only, so &quot;login&quot;
            here means identifying yourself by your public username — only data
            already visible on your Chess.com profile is ever shown.
          </p>
        </div>
      </section>
    </>
  );
}

/* ============================ sub-views =========================== */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 py-5 text-center">
      <div className="text-2xl font-bold tabular-nums text-fg sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">
        {label}
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="group relative overflow-hidden panel rounded-2xl p-5 transition hover:border-accent/40">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[radial-gradient(closest-side,rgba(74,222,128,0.14),transparent)] opacity-0 transition group-hover:opacity-100" />
      <div className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-panel-2 text-xl">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-bold text-accent/80">{n}</div>
      <h3 className="mt-2 text-base font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function FloatingPieces() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute left-[6%] top-[18%] animate-float text-7xl text-accent/10">
        ♞
      </span>
      <span className="absolute right-[10%] top-[12%] animate-float-slow text-6xl text-cyan/10">
        ♛
      </span>
      <span className="absolute bottom-[14%] left-[14%] animate-float-slow text-6xl text-cyan/10">
        ♚
      </span>
      <span className="absolute bottom-[22%] right-[44%] animate-float text-5xl text-accent/10">
        ♜
      </span>
    </div>
  );
}

/* ---- gamer HUD player card (decorative preview of the dashboard) ---- */
function PlayerHud() {
  return (
    <div className="relative">
      {/* rotating glow */}
      <div className="pointer-events-none absolute -inset-6 animate-glow rounded-[2rem] bg-[conic-gradient(from_0deg,rgba(74,222,128,0.25),transparent_40%,rgba(34,211,238,0.22),transparent_75%)] blur-2xl" />

      <div className="relative overflow-hidden rounded-3xl border border-line bg-[#0b0e13]/90 p-6 neon-ring backdrop-blur">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-30" />

        {/* header */}
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-accent/40 bg-panel-2 text-3xl text-accent">
              ♞
            </div>
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0b0e13] bg-accent" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber">
                GM
              </span>
              <span className="truncate text-lg font-bold text-fg">
                Player One
              </span>
            </div>
            <div className="font-mono text-xs text-muted">
              @your-username · 🇳🇴 online
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="font-mono text-[10px] uppercase tracking-wider text-faint">
              peak
            </div>
            <div className="text-xl font-bold tabular-nums text-accent">
              3300
            </div>
          </div>
        </div>

        {/* rating bars */}
        <div className="relative mt-6 space-y-3">
          <RatingBar icon="⚡" label="Bullet" value={3300} pct={96} delay={0} />
          <RatingBar icon="🔥" label="Blitz" value={3200} pct={90} delay={120} />
          <RatingBar icon="⏱️" label="Rapid" value={2800} pct={74} delay={240} />
        </div>

        {/* record + cta */}
        <div className="relative mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
          <div className="font-mono text-xs text-muted">
            <span className="text-accent">128W</span>{" "}
            <span className="text-faint">14D</span>{" "}
            <span className="text-rose">22L</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
            ▸ analyze
          </span>
        </div>
      </div>
    </div>
  );
}

function RatingBar({
  icon,
  label,
  value,
  pct,
  delay,
}: {
  icon: string;
  label: string;
  value: number;
  pct: number;
  delay: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wider text-muted">
          <span>{icon}</span>
          {label}
        </span>
        <span className="font-bold tabular-nums text-fg">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-panel-2">
        <div
          className="animate-bar h-full rounded-full bg-gradient-to-r from-cyan to-accent"
          style={{ width: `${pct}%`, animationDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}
