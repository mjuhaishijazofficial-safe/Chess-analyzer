import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/i18n/request";

function buildAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = `${SITE_URL}/${locale}${path}`;
  }
  languages["x-default"] = `${SITE_URL}/${DEFAULT_LOCALE}${path}`;
  return languages;
}

function entriesForPath(
  path: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap {
  return SUPPORTED_LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: buildAlternates(path),
    },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    ...entriesForPath("", now, "weekly", 1),
    ...entriesForPath("/games", now, "weekly", 0.8),
    ...entriesForPath("/openings", now, "weekly", 0.8),
    ...entriesForPath("/puzzles", now, "weekly", 0.8),
    ...entriesForPath("/journey", now, "weekly", 0.7),
    ...entriesForPath("/compare", now, "weekly", 0.7),
    ...entriesForPath("/stats", now, "weekly", 0.6),
    ...entriesForPath("/play", now, "weekly", 0.7),
    ...entriesForPath("/position", now, "weekly", 0.7),
    ...entriesForPath("/review", now, "weekly", 0.7),
    ...entriesForPath("/blog", now, "weekly", 0.7),
    ...BLOG_POSTS.flatMap((post) =>
      entriesForPath(`/blog/${post.slug}`, new Date(post.date), "monthly", 0.6),
    ),
    ...entriesForPath("/settings", now, "monthly", 0.3),
    ...entriesForPath("/privacy", now, "yearly", 0.1),
    ...entriesForPath("/terms", now, "yearly", 0.1),
  ];
}
