import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-panel text-3xl">
        ♟️
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        Player not found
      </h1>
      <p className="mt-2 text-pretty text-muted">
        We couldn&apos;t find that username on Chess.com. Check the spelling and
        try again — usernames are case-insensitive.
      </p>

      <div className="mt-8 w-full">
        <LoginForm autoFocus={false} />
      </div>

      <Link
        href="/"
        className="mt-6 text-sm text-muted transition hover:text-fg"
      >
        ← Back home
      </Link>
    </div>
  );
}
