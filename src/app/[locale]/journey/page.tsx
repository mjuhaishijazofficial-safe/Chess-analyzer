import type { Metadata } from "next";
import { getPlayerBundle as getChesscomBundle } from "@/lib/chesscom";
import { getPlayerBundle as getLichessBundle } from "@/lib/lichess";
import { toChesscomBundle } from "@/lib/lichess-adapter";
import { toRow, formatMonthYear } from "@/lib/format";
import {
  computeBiggestWin,
  computeBestStreak,
  computeNextGoal,
  tallyOutcomes,
} from "@/lib/journey";
import { computeOpeningBreakdown } from "@/lib/opening-breakdown";
import { JourneyForm } from "@/components/journey-form";
import { JourneyTimeline } from "@/components/journey-timeline";

export const metadata: Metadata = {
  title: "Your Chess Journey",
  description: "A shareable timeline of your chess history — ratings, best wins, streaks, and more.",
};

interface PageProps {
  searchParams: Promise<{ u?: string; platform?: string }>;
}

export default async function JourneyPage({ searchParams }: PageProps) {
  const { u, platform } = await searchParams;

  if (!u) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          Your Chess Journey
        </h1>
        <p className="mt-2 text-sm text-muted">
          A shareable timeline of your ratings, biggest win, best streak,
          favorite opening, and more — generated from your public game
          history.
        </p>
        <div className="mt-8">
          <JourneyForm />
        </div>
      </div>
    );
  }

  const isLichess = platform === "lichess";
  const username = u.toLowerCase();

  const bundle = isLichess
    ? await getLichessBundle(username).then((b) => (b ? toChesscomBundle(b) : null))
    : await getChesscomBundle(username);

  if (!bundle) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          Your Chess Journey
        </h1>
        <p className="mt-2 text-sm text-rose">
          Couldn&apos;t find &quot;{u}&quot; on {isLichess ? "Lichess" : "Chess.com"}.
        </p>
        <div className="mt-8">
          <JourneyForm error="Try a different username or platform." />
        </div>
      </div>
    );
  }

  const { profile, stats, games } = bundle;
  const rows = games.map((g) => toRow(g, profile.username));

  const biggestWin = computeBiggestWin(games, profile.username);
  const bestStreak = computeBestStreak(games, profile.username);
  const tally = tallyOutcomes(games, profile.username);
  const openingStats = computeOpeningBreakdown(games, profile.username, 1);
  const favoriteOpening = openingStats[0] ?? null;

  const ratings = {
    bullet: stats?.chess_bullet?.last?.rating,
    blitz: stats?.chess_blitz?.last?.rating,
    rapid: stats?.chess_rapid?.last?.rating,
    daily: stats?.chess_daily?.last?.rating,
  };
  const currentRating =
    ratings.blitz ?? ratings.rapid ?? ratings.bullet ?? ratings.daily ?? null;
  const nextGoal = currentRating != null ? computeNextGoal(currentRating) : null;

  return (
    <JourneyTimeline
      username={profile.username}
      platform={isLichess ? "lichess" : "chesscom"}
      title={profile.title}
      startedPlaying={formatMonthYear(profile.joined)}
      ratings={ratings}
      biggestWin={biggestWin}
      bestStreak={bestStreak}
      tally={tally}
      favoriteOpening={favoriteOpening}
      nextGoal={nextGoal}
      currentRating={currentRating}
      rows={rows}
      games={games}
    />
  );
}
