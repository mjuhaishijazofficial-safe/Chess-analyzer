import type { Metadata } from "next";
import { getPlayerBundle as getChesscomBundle } from "@/lib/chesscom";
import { getPlayerBundle as getLichessBundle } from "@/lib/lichess";
import { toChesscomBundle } from "@/lib/lichess-adapter";
import { toRow } from "@/lib/format";
import { CompareForm } from "@/components/compare-form";
import { ComparePanel, type ComparePlayer } from "@/components/compare-panel";

export const metadata: Metadata = {
  title: "Compare players",
  description: "Compare ratings and recent form between two Chess.com or Lichess players.",
};

interface PageProps {
  searchParams: Promise<{
    a?: string;
    aPlatform?: string;
    b?: string;
    bPlatform?: string;
  }>;
}

async function loadPlayer(
  username: string,
  platform: string,
): Promise<ComparePlayer | null> {
  const isLichess = platform === "lichess";
  const bundle = isLichess
    ? await getLichessBundle(username.toLowerCase()).then((b) =>
        b ? toChesscomBundle(b) : null,
      )
    : await getChesscomBundle(username.toLowerCase());
  if (!bundle) return null;

  const rows = bundle.games.map((g) => toRow(g, bundle.profile.username));
  return {
    profile: bundle.profile,
    stats: bundle.stats,
    rows,
    platform: isLichess ? "lichess" : "chesscom",
  };
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { a, aPlatform, b, bPlatform } = await searchParams;

  if (!a || !b) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          Compare players
        </h1>
        <p className="mt-2 text-sm text-muted">
          Pick any two Chess.com or Lichess players — mixing platforms is
          fine — and see their ratings and recent form side by side.
        </p>
        <div className="mt-8">
          <CompareForm />
        </div>
      </div>
    );
  }

  const [playerA, playerB] = await Promise.all([
    loadPlayer(a, aPlatform ?? "chesscom"),
    loadPlayer(b, bPlatform ?? "chesscom"),
  ]);

  if (!playerA || !playerB) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          Compare players
        </h1>
        <p className="mt-2 text-sm text-rose">
          {!playerA && `Couldn't find "${a}" on ${aPlatform === "lichess" ? "Lichess" : "Chess.com"}.`}
          {!playerA && !playerB && " "}
          {!playerB && `Couldn't find "${b}" on ${bPlatform === "lichess" ? "Lichess" : "Chess.com"}.`}
        </p>
        <div className="mt-8">
          <CompareForm
            defaultA={a}
            defaultAPlatform={aPlatform === "lichess" ? "lichess" : "chesscom"}
            defaultB={b}
            defaultBPlatform={bPlatform === "lichess" ? "lichess" : "chesscom"}
            errorA={!playerA ? "Not found" : null}
            errorB={!playerB ? "Not found" : null}
          />
        </div>
      </div>
    );
  }

  return <ComparePanel a={playerA} b={playerB} />;
}
