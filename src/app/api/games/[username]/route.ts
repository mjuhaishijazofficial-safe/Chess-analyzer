import { NextResponse } from "next/server";
import { getRecentGames, ChessApiError } from "@/lib/chesscom";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const clean = username.trim().toLowerCase();

  if (!/^[a-z0-9_-]{2,30}$/.test(clean)) {
    return NextResponse.json(
      { ok: false, error: "Usernames are 2–30 letters, numbers, _ or -." },
      { status: 400 },
    );
  }

  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "12");
  const limit = Math.min(25, Math.max(1, Number.isFinite(limitParam) ? limitParam : 12));

  try {
    const games = await getRecentGames(clean, limit);
    return NextResponse.json({
      ok: true,
   games: games
        .filter((g) => !!g.pgn)
        .map((g) => ({
          uuid: g.uuid ?? null,
          url: g.url,
          pgn: g.pgn,
          time_class: g.time_class,
          end_time: g.end_time,
          white: g.white.username,
          black: g.black.username,
          eco: g.eco ?? null,
        })),
    });
  } catch (err) {
    const status = err instanceof ChessApiError ? err.status : 500;
    return NextResponse.json(
      { ok: false, error: "Could not reach Chess.com. Try again in a moment." },
      { status },
    );
  }
}
