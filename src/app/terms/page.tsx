import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using ChessBuddy.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Terms of Use</h1>
      <p className="mt-2 text-sm text-muted">Last updated: July 2026</p>

      <div className="mt-6 rounded-xl border border-line bg-panel-2 p-4 text-sm text-muted">
        <strong className="text-fg">Note:</strong> This is a plain-language
        draft, not legal advice. Have a lawyer review these terms —
        including the governing-law section below — before relying on them
        with real users.
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">1. What ChessBuddy is</h2>
        <p className="leading-relaxed text-muted">
          ChessBuddy is an independent tool that displays publicly available
          Chess.com data (profiles, ratings, and games) alongside
          engine-assisted game review and puzzles. It is not affiliated
          with, endorsed by, or officially connected to Chess.com in any way.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">2. Acceptable use</h2>
        <p className="leading-relaxed text-muted">
          Please don&apos;t use ChessBuddy to abuse, scrape at scale, or
          circumvent rate limits on this site or on Chess.com&apos;s API.
          Don&apos;t attempt to disrupt the service, reverse-engineer it to
          harm others, or use it for anything unlawful.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">
          3. No warranty — provided &quot;as is&quot;
        </h2>
        <p className="leading-relaxed text-muted">
          ChessBuddy is provided &quot;as is&quot; and &quot;as
          available,&quot; without warranties of any kind. Engine
          evaluations, move classifications, and opening names are
          generated automatically and may occasionally be inaccurate — they
          are meant to help you learn, not as an authoritative or
          professional judgment.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">
          4. Third-party data
        </h2>
        <p className="leading-relaxed text-muted">
          Player data shown here comes from Chess.com&apos;s public API and
          reflects information that is already public on Chess.com. We
          don&apos;t control the accuracy, availability, or completeness of
          that data.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">
          5. Limitation of liability
        </h2>
        <p className="leading-relaxed text-muted">
          To the fullest extent permitted by law, ChessBuddy and its
          creators aren&apos;t liable for any indirect, incidental, or
          consequential damages arising from your use of the site.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">6. Changes</h2>
        <p className="leading-relaxed text-muted">
          These terms may be updated from time to time. Continued use of
          ChessBuddy after changes means you accept the updated terms.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">7. Governing law</h2>
        <p className="leading-relaxed text-muted">
          <span className="text-fg">[Fill in your country/state]</span> —
          this section needs a lawyer&apos;s input based on where you and
          your users are located.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">Contact</h2>
        <p className="leading-relaxed text-muted">
          Questions about these terms? Reach out at{" "}
          <span className="text-fg">[your contact email here]</span>.
        </p>
      </section>

      <div className="mt-12">
        <Link href="/" className="text-sm text-accent underline underline-offset-2">
          ← Back home
        </Link>
      </div>
    </div>
  );
}
