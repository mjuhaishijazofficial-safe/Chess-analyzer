import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

import { getProfile, getStats } from "@/lib/chesscom";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid animate-grid mask-fade-b opacity-60" />
        <div className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(74,222,128,0.18),transparent)]" />
        <div className="pointer-events-none absolute -right-40 top-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.14),transparent)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.06] px-3 py-1 font-mono text-xs text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
              ONLINE - CHESS.COM + LICHESS
            </div>
            <h1 className="mt-6 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="block text-fg">LEVEL UP</span>
              <span className="block text-gradient text-glow">YOUR CHESS</span>
            </h1>
            <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-muted sm:text-lg">
              Drop your Chess.com or Lichess username and instantly unlock
              your stats, ratings and full game history - then run a{" "}
              <span className="text-fg">Stockfish game review</span> on any match,
              move by move.
            </p>
            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
          <div className="animate-rise [animation-delay:120ms]">
            <div className="mb-3 flex flex-wrap justify-end gap-2">
              <a href="/journey" className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/80 px-4 py-2.5 text-sm font-semibold text-fg backdrop-blur transition hover:border-accent/50 hover:text-accent">
                My Chess Journey
                <span aria-hidden>-</span>
              </a>
              <a href="/compare" className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/80 px-4 py-2.5 text-sm font-semibold text-fg backdrop-blur transition hover:border-accent/50 hover:text-accent">
                Compare two players
                <span aria-hidden>-</span>
              </a>
            </div>
            <Suspense fallback={<PlayerHudSkeleton />}>
              <PlayerHud />
            </Suspense>
          </div>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-panel/60 backdrop-blur">
            <Stat value="4" label="Time controls" />
            <Stat value="8" label="Games in your archive" />
            <Stat value="D12" label="Engine review depth" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature icon="P" title="Your profile" body="Avatar, title, country, league, followers and join date." />
          <Feature icon="R" title="Ratings and records" body="Bullet, blitz, rapid and daily ratings with peak highs." />
          <Feature icon="E" title="Engine game review" body="Step through any game. Every move graded Best to Blunder." />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden panel rounded-2xl p-8 sm:p-10">
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.12),transparent)]" />
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-accent">// how it works</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            <Step n="01" title="Enter your username" body="No password, no OAuth dance." />
            <Step n="02" title="We pull your data" body="ChessDeeper calls the official public API." />
            <Step n="03" title="Play it back" body="Explore your dashboard and replay any game." />
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 py-5 text-center">
      <div className="text-2xl font-bold tabular-nums text-fg sm:text-3xl">{value}</div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">{label}</div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="group relative overflow-hidden panel rounded-2xl p-5 transition hover:border-accent/40">
      <div className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-panel-2 text-xl">{icon}</div>
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

async function fetchPlayerRatings(username: string) {
  const [profile, stats] = await Promise.all([
    getProfile(username).catch(() => null),
    getStats(username).catch(() => null),
  ]);
  if (!profile) return null;
  return {
    username: profile.username,
    title: profile.title,
    bullet: stats?.chess_bullet?.last?.rating,
    blitz: stats?.chess_blitz?.last?.rating,
    rapid: stats?.chess_rapid?.last?.rating,
  };
}

async function PlayerHud() {
  const [magnus, hikaru] = await Promise.all([
    fetchPlayerRatings("magnuscarlsen"),
    fetchPlayerRatings("hikaru"),
  ]);
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-[#0b0e13]/90 p-6 neon-ring backdrop-blur">
        <div className="relative flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-accent/40 bg-panel-2 text-2xl text-accent">N</div>
          <div>
            <div className="text-sm font-bold text-fg">Best of this era</div>
            <div className="font-mono text-[11px] text-muted">live ratings, straight from Chess.com</div>
          </div>
        </div>
        <div className="relative mt-6 space-y-6">
          {magnus && <PlayerRankBlock rank={1} player={magnus} />}
          {hikaru && <PlayerRankBlock rank={2} player={hikaru} />}
        </div>
      </div>
    </div>
  );
}

function PlayerRankBlock({ rank, player }: { rank: number; player: { username: string; title?: string; bullet?: number; blitz?: number; rapid?: number } }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-accent/15 font-mono text-[10px] font-bold text-accent">{rank}</span>
        {player.title && <span className="rounded-md bg-amber/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber">{player.title}</span>}
        <span className="truncate text-sm font-bold text-fg">@{player.username}</span>
      </div>
      <div className="space-y-2.5">
        {player.bullet != null && <RatingBar label="Bullet" value={player.bullet} delay={0} />}
        {player.blitz != null && <RatingBar label="Blitz" value={player.blitz} delay={80} />}
        {player.rapid != null && <RatingBar label="Rapid" value={player.rapid} delay={160} />}
      </div>
    </div>
  );
}

function PlayerHudSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-[#0b0e13]/90 p-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-panel-2" />
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-panel-2" />
          <div className="h-2.5 w-32 animate-pulse rounded bg-panel-2" />
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <div className="h-2 w-full animate-pulse rounded-full bg-panel-2" />
        <div className="h-2 w-full animate-pulse rounded-full bg-panel-2" />
        <div className="h-2 w-full animate-pulse rounded-full bg-panel-2" />
      </div>
    </div>
  );
}

function RatingBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const pct = Math.max(4, Math.min(100, Math.round((value / 3400) * 100)));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-mono uppercase tracking-wider text-muted">{label}</span>
        <span className="font-bold tabular-nums text-fg">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className="animate-bar h-full rounded-full bg-accent/70" style={{ width: `${pct}%`, animationDelay: `${delay}ms` }} />
      </div>
    </div>
  );
}
