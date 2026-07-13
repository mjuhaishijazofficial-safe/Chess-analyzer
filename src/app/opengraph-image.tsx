import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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

        {/* logo mark */}
        <div
          style={{
            display: "flex",
            width: 84,
            height: 84,
            borderRadius: 22,
            background: "#0e1116",
            border: "2px solid #1c222b",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 46,
            marginBottom: 28,
          }}
        >
          ♞
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: -2,
            color: "#e9edf1",
          }}
        >
          chess
          <span style={{ color: "#4ade80" }}>buddy</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 28,
            color: "#9aa4b2",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          Chess.com profile, ratings, and engine-powered game review
        </div>
      </div>
    ),
    { ...size },
  );
}
