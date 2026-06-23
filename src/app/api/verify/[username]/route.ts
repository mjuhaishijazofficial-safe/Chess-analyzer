import { NextResponse } from "next/server";
import { getProfile, ChessApiError } from "@/lib/chesscom";

export async function GET(
  _req: Request,
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

  try {
    const profile = await getProfile(clean);
    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "No Chess.com player with that username." },
        { status: 404 },
      );
    }
    return NextResponse.json({
      ok: true,
      username: profile.username,
      name: profile.name ?? null,
      avatar: profile.avatar ?? null,
      title: profile.title ?? null,
    });
  } catch (err) {
    const status = err instanceof ChessApiError ? err.status : 500;
    return NextResponse.json(
      { ok: false, error: "Could not reach Chess.com. Try again in a moment." },
      { status },
    );
  }
}
