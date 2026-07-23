import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Thrown only when a Duel page actually tries to connect — every other
  // page on the site works fine without these env vars set.
  console.warn(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set — Duel mode won't connect.",
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");
