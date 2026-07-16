/**
 * Single source of truth for the site's public URL, used by metadata,
 * robots.txt, and the sitemap. Set NEXT_PUBLIC_SITE_URL in your
 * deployment environment once you have a real domain — until then this
 * falls back to a placeholder so local dev still works.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chessdeeper.local";
