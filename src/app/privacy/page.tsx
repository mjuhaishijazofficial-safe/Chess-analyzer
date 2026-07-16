import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ChessDeeper handles data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: July 2026</p>

      <div className="mt-6 rounded-xl border border-line bg-panel-2 p-4 text-sm text-muted">
        <strong className="text-fg">Note:</strong> This is a plain-language
        draft describing what this app actually does with data today. It
        isn&apos;t legal advice — before you rely on it publicly, have it
        reviewed by a lawyer, especially if users in the EU/UK (GDPR) or
        California (CCPA) will be using the site.
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">What this app does</h2>
        <p className="leading-relaxed text-muted">
          ChessDeeper is a reader for the public Chess.com API. You type in a
          Chess.com username, and the app fetches that player&apos;s public
          profile, stats, and game history directly from Chess.com to
          display it back to you. There is no account creation, sign-up, or
          login on ChessDeeper itself.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">
          Information sent to Chess.com
        </h2>
        <p className="leading-relaxed text-muted">
          When you look up a username, that username is sent server-side to
          Chess.com&apos;s public{" "}
          <a
            href="https://www.chess.com/news/view/published-data-api"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline underline-offset-2"
          >
            Published-Data API
          </a>{" "}
          to retrieve publicly available profile and game data. ChessDeeper
          does not send your IP address, browser details, or any other
          personal information to Chess.com beyond what a normal API request
          requires. See{" "}
          <a
            href="https://www.chess.com/legal/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline underline-offset-2"
          >
            Chess.com&apos;s own Privacy Policy
          </a>{" "}
          for how they handle that data on their end.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">
          What&apos;s stored on our servers
        </h2>
        <p className="leading-relaxed text-muted">
          Nothing personal. ChessDeeper has no database and no user accounts.
          Chess.com responses are cached briefly (a few minutes) purely to
          reduce repeat requests and speed up the app — this cache isn&apos;t
          tied to you individually and expires automatically.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">
          What&apos;s stored in your browser
        </h2>
        <p className="leading-relaxed text-muted">
          Your preferences — board color, piece style, sound on/off,
          analysis depth, and any puzzles you&apos;ve saved for review — are
          stored only in your browser&apos;s local storage. This data never
          leaves your device and is never sent to us. Clearing your
          browser&apos;s site data removes it completely.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">
          Cookies &amp; analytics
        </h2>
        <p className="leading-relaxed text-muted">
          ChessDeeper does not currently use cookies, tracking pixels, or
          third-party analytics. If that changes in the future, this policy
          will be updated to say so before it happens.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">Children&apos;s privacy</h2>
        <p className="leading-relaxed text-muted">
          ChessDeeper is not directed at children under 13 and does not
          knowingly collect personal information from them.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">Changes to this policy</h2>
        <p className="leading-relaxed text-muted">
          If how we handle data changes, this page will be updated and the
          &quot;last updated&quot; date above will change accordingly.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-fg">Contact</h2>
        <p className="leading-relaxed text-muted">
          Questions about this policy? Reach out at{" "}
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
