import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findGameByUuid } from "@/lib/chesscom";
import { findGameById } from "@/lib/lichess";
import { toChesscomGame } from "@/lib/lichess-adapter";
import {
  formatDate,
  outcomeFromResult,
  resultLabel,
  TIME_CLASS_META,
  timeControlLabel,
} from "@/lib/format";
import { GameReview } from "@/components/game-review";
import { buildLanguageAlternates } from "@/lib/seo";

interface PageProps {
  params: Promise<{ locale: string; username: string; uuid: string }>;
  searchParams: Promise<{ platform?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username, uuid } = await params;
  return {
    title: `Review . @${username.toLowerCase()}`,
    alternates: {
      languages: buildLanguageAlternates(`/player/${username.toLowerCase()}/game/${uuid}`),
    },
  };
}

export default async function GameReviewPage({ params, searchParams }: PageProps) {
  const { username, uuid } = await params;
  const { platform } = await searchParams;
  const isLichess = platform === "lichess";
  const user = username.toLowerCase();

  const game = isLichess
    ? await findGameById(uuid).then((g) => (g ? toChesscomGame(g) : null))
    : await findGameByUuid(user, uuid);
  if (!game) notFound();

  const meta = TIME_CLASS_META[game.time_class];
  const whiteWon = outcomeFromResult(game.white.result) === "win";
  const blackWon = outcomeFromResult(game.black.result) === "win";
  const resultText = whiteWon ? "1-0" : blackWon ? "0-1" : "1/2-1/2";

  const playerColor: "white" | "black" =
    game.white.username.toLowerCase() === user ? "white" : "black";

  const canReview = game.rules === "chess" && !!game.pgn;

  const backHref = `/player/${encodeURIComponent(user)}${
    isLichess ? "?platform=lichess" : ""
  }`;
  const siteName = isLichess ? "Lichess" : "Chess.com";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* breadcrumb + meta */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={backHref}
            className="font-mono text-xs text-muted transition hover:text-fg"
          >
            {String.fromCharCode(8592)} @{user}
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
            <span className="text-faint">{String.fromCharCode(183)}</span>
            <span className="font-mono">
              {timeControlLabel(game.time_control)}
            </span>
            <span className="text-faint">{String.fromCharCode(183)}</span>
            <span>{formatDate(game.end_time)}</span>
            <span className="text-faint">{String.fromCharCode(183)}</span>
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
          Open on {siteName} {String.fromCharCode(8599)}
        </a>
      </div>

      {canReview ? (
        <GameReview
          pgn={game.pgn!}
          whiteName={game.white.username}
          blackName={game.black.username}
          playerColor={playerColor}
          result={whiteWon ? "1-0" : blackWon ? "0-1" : "1/2-1/2"}
          platform={isLichess ? "lichess" : "chesscom"}
        />
      ) : (
        <div className="panel rounded-2xl p-6 text-sm text-muted">
          This game can&apos;t be reviewed {String.fromCharCode(8212)} engine review is only available for
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
      {won && <span className="text-accent">{String.fromCharCode(9819)}</span>}
      <span className="text-fg">{name}</span>
      <span className="font-mono text-sm text-faint">({rating})</span>
    </span>
  );
}