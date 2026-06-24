import type { NextConfig } from "next";

/**
 * Cross-origin isolation headers.
 *
 * Multi-threaded Stockfish (WASM + SharedArrayBuffer) only works when the page
 * is cross-origin isolated. We enable that with COOP + COEP. We use
 * `credentialless` for COEP so cross-origin images that we render without
 * credentials (e.g. Chess.com avatars on images.chesscomfiles.com) still load
 * without needing CORP headers. Browsers that don't support isolation simply
 * fall back to the single-threaded engine build.
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
      {
        // engine assets: long cache + correct type for the wasm
        source: "/engine/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
