import type { NextConfig } from "next";

/**
 * Content-Security-Policy.
 *
 * - script/style 'unsafe-inline' are needed because the app renders many
 *   inline `style={{ ... }}` attributes (board squares, theme swatches,
 *   dynamic gradients) and Next.js itself injects some inline scripts.
 * - img-src allows any https: source because player avatars come back as
 *   arbitrary URLs from the Chess.com API, and piece art is fetched from
 *   lichess1.org's public asset CDN.
 * - frame-ancestors 'none' stops the site from being embedded in an
 *   iframe elsewhere (clickjacking protection) — stronger than the older
 *   X-Frame-Options header, which we also set for older browsers.
 */
const isDev = process.env.NODE_ENV !== "production";

const CSP = [
  "default-src 'self'",
  // React's dev-mode debugging features (call-stack reconstruction, Fast
  // Refresh) need eval() — never used by React in production builds.
  // 'wasm-unsafe-eval' lets WebAssembly.instantiate/instantiateStreaming
  // compile modules (needed for Stockfish's .wasm) without opening up full
  // JS eval() in production. 'unsafe-eval' is dev-only (React Fast Refresh).
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

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
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
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
