"use client";

import { useRouter } from "next/navigation";

export default function DuelLandingPage() {
  const router = useRouter();

  function createGame() {
    const roomId = crypto.randomUUID().slice(0, 8);
    router.push(`/duel/${roomId}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="mb-3 text-2xl font-semibold text-fg">Play a Friend</h1>
      <p className="mb-8 text-sm text-muted">
        Create a game and send the link to a friend — no account needed. You'll each see your
        own instant move analysis in your own browser as you play.
      </p>
      <button
        onClick={createGame}
        className="rounded bg-fg px-6 py-3 text-sm font-medium text-bg"
      >
        Create a game
      </button>
    </div>
  );
}
