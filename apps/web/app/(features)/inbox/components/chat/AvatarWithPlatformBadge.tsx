import { PlatformIcon } from "./PlatformIcon";

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-rose-400",
  "bg-amber-400",
  "bg-cyan-400",
  "bg-pink-400",
  "bg-indigo-400",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// ── Size map ──────────────────────────────────────────────────────────────────

type AvatarSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<AvatarSize, { avatar: string; text: string; badge: string; icon: string }> = {
  sm: { avatar: "w-8 h-8",   text: "text-xs",  badge: "w-3.5 h-3.5", icon: "w-2.5 h-2.5" },
  md: { avatar: "w-10 h-10", text: "text-xs",  badge: "w-4 h-4",     icon: "w-3 h-3"     },
  lg: { avatar: "w-12 h-12", text: "text-sm",  badge: "w-5 h-5",     icon: "w-3.5 h-3.5" },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface AvatarWithPlatformBadgeProps {
  name: string;
  avatar?: string | null;
  platform: string;
  size?: AvatarSize;
}

export function AvatarWithPlatformBadge({
  name,
  avatar,
  platform,
  size = "md",
}: AvatarWithPlatformBadgeProps) {
  const s = SIZE_MAP[size];
  const color = getAvatarColor(name);

  return (
    <div className={`relative flex-shrink-0 ${s.avatar}`}>
      {/* Avatar or initials */}
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className={`${s.avatar} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${s.avatar} rounded-full ${color} flex items-center justify-center`}
        >
          <span className={`${s.text} font-semibold text-white leading-none`}>
            {getInitials(name)}
          </span>
        </div>
      )}

      {/* Platform badge */}
      <div
        className={`absolute -bottom-0.5 -right-0.5 ${s.badge} rounded-full bg-[var(--bg-surface)] ring-2 ring-[var(--bg-surface)] flex items-center justify-center`}
      >
        <PlatformIcon platform={platform} className={s.icon} />
      </div>
    </div>
  );
}
