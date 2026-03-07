"use client";

import { useRouter } from "next/navigation";
import { avatarOptions } from "@/mock/cityWorld";
import { clearStoredAuth } from "@/lib/mockAuth";
import type { MockUser } from "@/types/auth";

type TopHeaderProps = {
  user: MockUser;
};

export function TopHeader({ user }: TopHeaderProps) {
  const router = useRouter();
  const avatar = avatarOptions.find((option) => option.id === user.avatarId) ?? avatarOptions[0];

  return (
    <header className="pointer-events-none relative z-30 px-4 pt-4">
      <div className="glass-panel panel-frame pointer-events-none flex items-center justify-between gap-4 px-5 py-4">
        <div className="pointer-events-none min-w-0">
          <div className="text-[11px] uppercase tracking-[0.22em] text-neon-cyan">NEON EXCHANGE</div>
          <div className="mt-1 text-sm text-slate-300">Cyberpunk pixel-market city</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-800 bg-slate-950/75 px-3 py-2">
            <span className="relative block h-9 w-9 rounded-full border border-slate-800 bg-slate-950/90">
              <span className="absolute left-2 top-1.5 h-1.5 w-5 rounded-sm" style={{ backgroundColor: avatar.trim }} />
              <span className="absolute left-1.5 top-3 h-2.5 w-6 rounded-sm" style={{ backgroundColor: avatar.body }} />
              <span className="absolute left-2.5 top-4 h-1 w-4 rounded-sm" style={{ backgroundColor: avatar.visor }} />
            </span>
            <span className="min-w-0">
              <span className="block max-w-[140px] truncate text-xs font-semibold uppercase tracking-[0.14em] text-white">{user.displayName}</span>
              <span className="block max-w-[160px] truncate text-[11px] text-slate-400">{user.guest ? "Guest Session" : user.email}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              clearStoredAuth();
              router.replace("/login");
            }}
            className="pointer-events-auto rounded-full border border-neon-magenta/35 bg-neon-magenta/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-100 transition hover:bg-neon-magenta/16"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
