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
            marginBottom: 28,
          }}
        >
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 22H5v-2h14v2zM17.5 20l-.5-4.5c-1.5-1-2.5-2.7-2.5-4.5 0-.9.3-1.7.7-2.4-.5-.3-1-.6-1.2-1.1-.3-.6-.2-1.3.2-1.9.6-.9.4-1.9-.4-2.5-.5-.4-1.2-.4-1.7 0L10.5 5c-.3.2-.5.6-.5 1v1.3c-1.2.5-2 1.7-2 3 0 .5.1 1 .3 1.4-.8.7-1.3 1.8-1.3 2.9 0 1.8 1 3.5 2.5 4.5l-.5 4.5"
              stroke="#4ade80"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
          <span style={{ color: "#4ade80" }}>deeper
</span>
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