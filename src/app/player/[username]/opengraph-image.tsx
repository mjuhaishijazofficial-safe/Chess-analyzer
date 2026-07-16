import { ImageResponse } from "next/og";
import { getPlayerBundle as getChesscomBundle } from "@/lib/chesscom";
import { getPlayerBundle as getLichessBundle } from "@/lib/lichess";
import { toChesscomBundle } from "@/lib/lichess-adapter";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PlayerOpengraphImage({ params }: Props) {
  const { username } = await params;
  const clean = username.toLowerCase();

  // This special file doesn't receive the page's ?platform= query param, so
  // we try Chess.com first (the default) and fall back to Lichess.
  let profile: { username: string; title?: string } | null = null;
  let rating: number | null = null;
  let siteName = "Chess.com";

  const ccBundle = await getChesscomBundle(clean).catch(() => null);
  if (ccBundle) {
    profile = ccBundle.profile;
    rating =
      ccBundle.stats?.chess_blitz?.last?.rating ??
      ccBundle.stats?.chess_rapid?.last?.rating ??
      ccBundle.stats?.chess_bullet?.last?.rating ??
      null;
  } else {
    const lb = await getLichessBundle(clean).catch(() => null);
    if (lb) {
      const adapted = toChesscomBundle(lb);
      profile = adapted.profile;
      rating =
        adapted.stats?.chess_blitz?.last?.rating ??
        adapted.stats?.chess_rapid?.last?.rating ??
        adapted.stats?.chess_bullet?.last?.rating ??
        null;
      siteName = "Lichess";
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#07080a",
          position: "relative",
        }}
      >
        {/* soft glow accents */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -80,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background:
              "radial-gradient(closest-side, rgba(74,222,128,0.25), transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -140,
            right: -100,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background:
              "radial-gradient(closest-side, rgba(34,211,238,0.18), transparent)",
          }}
        />

        {/* brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#0e1116",
              border: "2px solid #1c222b",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
            }}
          >
            ♞
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: "#e9edf1" }}>
            chess<span style={{ color: "#4ade80" }}>buddy</span>
          </div>
        </div>

        {/* player identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {profile?.title && (
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 800,
                color: "#f5c451",
                background: "rgba(245,196,81,0.12)",
                borderRadius: 10,
                padding: "6px 14px",
              }}
            >
              {profile.title}
            </div>
          )}
          <div style={{ display: "flex", fontSize: 72, fontWeight: 800, color: "#e9edf1" }}>
            @{profile?.username ?? clean}
          </div>
        </div>

        {rating != null ? (
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 36,
              color: "#4ade80",
              fontWeight: 700,
            }}
          >
            {rating} rating
          </div>
        ) : (
          <div style={{ display: "flex", marginTop: 20, fontSize: 28, color: "#9aa4b2" }}>
            Ratings, games, and Stockfish game review
          </div>
        )}

        <div style={{ display: "flex", marginTop: 28, fontSize: 24, color: "#9aa4b2" }}>
          {siteName} · chessdeeper
        </div>
      </div>
    ),
    { ...size },
  );
}
