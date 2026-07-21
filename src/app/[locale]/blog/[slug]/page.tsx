import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getBlogPost } from "@/lib/blog-posts";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/blog" className="text-sm text-accent underline underline-offset-2">
        ← All posts
      </Link>

      <div className="mt-4 font-mono text-xs text-faint">
        {formatDate(post.date)}
      </div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg">
        {post.title}
      </h1>

      <div className="mt-6 space-y-4">
        {post.content.map((paragraph, i) => (
          <p key={i} className="leading-relaxed text-muted">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-12">
        <Link href="/blog" className="text-sm text-accent underline underline-offset-2">
          ← All posts
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