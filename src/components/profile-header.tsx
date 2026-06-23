import type { PlayerProfile } from "@/lib/chesscom";
import {
  compactNumber,
  countryCode,
  flagEmoji,
  formatMonthYear,
  timeAgo,
} from "@/lib/format";

export function ProfileHeader({ profile }: { profile: PlayerProfile }) {
  const code = countryCode(profile);
  const online =
    profile.last_online && Date.now() / 1000 - profile.last_online < 600;

  return (
    <section className="relative overflow-hidden panel rounded-2xl">
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-40" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(74,222,128,0.12),transparent_70%)]" />

      <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
        <Avatar profile={profile} online={!!online} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {profile.title && (
              <span className="rounded-md bg-amber/15 px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-amber">
                {profile.title}
              </span>
            )}
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
              {profile.name ?? profile.username}
            </h1>
            {profile.verified && (
              <span title="Verified" className="text-cyan">
                ✔
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span className="font-mono">@{profile.username}</span>
            {code && (
              <>
                <Dot />
                <span>
                  {flagEmoji(code)} {profile.location ?? code}
                </span>
              </>
            )}
            {profile.league && (
              <>
                <Dot />
                <span>🏆 {profile.league} league</span>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Meta label="Followers" value={compactNumber(profile.followers)} />
            <Meta label="Joined" value={formatMonthYear(profile.joined)} />
            <Meta
              label="Last online"
              value={online ? "online now" : timeAgo(profile.last_online)}
            />
            {profile.is_streamer && <Meta label="Streamer" value="yes" />}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {profile.twitch_url && (
            <a
              href={profile.twitch_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-fg transition hover:border-line-strong"
            >
              Twitch ↗
            </a>
          )}
          <a
            href={profile.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-fg transition hover:border-line-strong"
          >
            View on Chess.com ↗
          </a>
        </div>
      </div>
    </section>
  );
}

function Avatar({
  profile,
  online,
}: {
  profile: PlayerProfile;
  online: boolean;
}) {
  const initials = (profile.name ?? profile.username)
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative shrink-0">
      <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-line bg-panel-2 sm:h-24 sm:w-24">
        {profile.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar}
            alt={profile.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-mono text-2xl font-semibold text-accent">
            {initials || "?"}
          </span>
        )}
      </div>
      <span
        title={online ? "Online now" : "Offline"}
        className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-bg ${
          online ? "bg-accent" : "bg-faint"
        }`}
      />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wider text-faint">
        {label}
      </div>
      <div className="text-fg">{value}</div>
    </div>
  );
}

function Dot() {
  return <span className="text-faint">·</span>;
}
