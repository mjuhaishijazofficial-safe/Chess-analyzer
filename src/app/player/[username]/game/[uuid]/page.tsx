import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findGameByUuid } from "@/lib/chesscom";
import {
  formatDate,
  outcomeFromResult,
  resultLabel,
  TIME_CLASS_META,
  timeControlLabel,
} from "@/lib/format";
import { GameReview } from "@/components/game-review";

interface PageProps {
  params: Promise<{ username: string; uuid: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `Review · @${username.toLowerCase()}` };
}

export default async function GameReviewPage({ params }: PageProps) {
  const { username, uuid } = await params;
  const user = username.toLowerCase();
  const game = await findGameByUuid(user, uuid);
  if (!game) notFound();

  const meta = TIME_CLASS_META[game.time_class];
  const whiteWon = outcomeFromResult(game.white.result) === "win";
  const blackWon = outcomeFromResult(game.black.result) === "win";
  const resultText = whiteWon ? "1–0" : blackWon ? "0–1" : "½–½";

  const playerColor: "white" | "black" =
    game.white.username.toLowerCase() === user ? "white" : "black";

  const canReview = game.rules === "chess" && !!game.pgn;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* breadcrumb + meta */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/player/${encodeURIComponent(user)}`}
            className="font-mono text-xs text-muted transition hover:text-fg"
          >
            ← @{user}
          </Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xl font-semibold tracking-tight sm:text-2xl">
            <PlayerInline
              name={game.white.username}
              rating={game.white.rating}
              won={whiteWon}
            />
            <span className="font-mono text-muted">{resultText}</span>
            <PlayerInline
              name={game.black.username}
              rating={game.black.rating}
              won={blackWon}
            />
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
            <span>
              {meta.icon} {meta.label}
            </span>
            <span className="text-faint">·</span>
            <span className="font-mono">
              {timeControlLabel(game.time_control)}
            </span>
            <span className="text-faint">·</span>
            <span>{formatDate(game.end_time)}</span>
            <span className="text-faint">·</span>
            <span>
              {resultLabel(game.white.result)} /{" "}
              {resultLabel(game.black.result)}
            </span>
          </div>
        </div>

        <a
          href={game.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-line bg-panel px-3 py-2 text-sm text-fg transition hover:border-line-strong"
        >
          Open on Chess.com ↗
        </a>
      </div>

      {canReview ? (
        <GameReview
          pgn={game.pgn!}
          whiteName={game.white.username}
          blackName={game.black.username}
          playerColor={playerColor}
        />
      ) : (
        <div className="panel rounded-2xl p-6 text-sm text-muted">
          This game can&apos;t be reviewed — engine review is only available for
          standard chess games with recorded moves.
        </div>
      )}
    </div>
  );
}

function PlayerInline({
  name,
  rating,
  won,
}: {
  name: string;
  rating: number;
  won: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {won && <span className="text-accent">♚</span>}
      <span className="text-fg">{name}</span>
      <span className="font-mono text-sm text-faint">({rating})</span>
    </span>
  );
}
