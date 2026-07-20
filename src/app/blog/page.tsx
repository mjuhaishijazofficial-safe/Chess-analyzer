import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides and notes on chess analysis, engine reviews, and getting the most out of ChessDeeper.",
};

export default function BlogIndexPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Blog</h1>
      <p className="mt-2 text-sm text-muted">
        Notes on chess analysis, engine reviews, and getting the most out of
        ChessDeeper.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group rounded-2xl border border-line bg-panel p-5 transition hover:border-accent/40"
          >
            <div className="font-mono text-xs text-faint">
              {formatDate(post.date)}
            </div>
            <h2 className="mt-1 text-lg font-semibold text-fg group-hover:text-accent">
              {post.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {post.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <Link href="/" className="text-sm text-accent underline underline-offset-2">
          ← Back home
        </Link>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
