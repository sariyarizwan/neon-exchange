"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { avatarOptions } from "@/mock/cityWorld";
import { readStoredAuth, writeStoredAuth } from "@/lib/mockAuth";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarId, setAvatarId] = useState(avatarOptions[0]?.id ?? "runner");

  useEffect(() => {
    if (readStoredAuth()?.isAuthed) {
      router.replace("/");
    }
  }, [router]);

  const createAccount = (guest = false) => {
    writeStoredAuth({
      displayName: guest ? "Guest Runner" : displayName || "Night Trader",
      avatarId,
      email: guest ? "guest@neon.exchange" : email || "guest@neon.exchange",
      guest
    });
    router.replace("/");
  };

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base-950 px-4 py-8 text-slate-100">
      <div className="noise-overlay absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="scanline-overlay absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(51,245,255,0.12),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(255,61,242,0.12),transparent_22%)]" aria-hidden="true" />

      <div className="glass-panel panel-frame relative z-10 w-full max-w-[1040px] overflow-hidden">
        <div className="grid md:grid-cols-[0.95fr_1.05fr]">
          <section className="flex flex-col justify-between border-b border-white/5 p-8 md:border-b-0 md:border-r">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-neon-magenta">Create Account</div>
              <h1 className="mt-3 text-4xl font-semibold text-white neon-text">Join The Exchange</h1>
              <p className="mt-4 max-w-[28rem] text-sm text-slate-400">
                Build a mock profile, choose your avatar, and enter the city. No backend, no real auth, only local state scaffolding.
              </p>
            </div>
            <div className="rounded-3xl border border-neon-cyan/20 bg-neon-cyan/8 p-4 text-sm text-slate-300">
              Future Gemini Live and agent features can attach to this user shell later without changing the frontend flow.
            </div>
          </section>

          <section className="p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Display Name</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-neon-cyan/40 focus:shadow-neon-cyan"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-neon-cyan/40 focus:shadow-neon-cyan"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-neon-cyan/40 focus:shadow-neon-cyan"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Confirm Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition ${mismatch ? "border-red-500/60" : "border-slate-800 focus:border-neon-cyan/40 focus:shadow-neon-cyan"}`}
                />
              </label>
            </div>

            <div className="mt-8">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Avatar Selection</div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {avatarOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAvatarId(option.id)}
                    className={`rounded-2xl border px-3 py-3 transition ${avatarId === option.id ? "border-neon-cyan/40 bg-neon-cyan/10 shadow-neon-cyan" : "border-slate-800 bg-slate-950/70 hover:border-slate-700"}`}
                  >
                    <span className="relative mx-auto block h-10 w-10 rounded-full border border-slate-800 bg-slate-950/90">
                      <span className="absolute left-2 top-1.5 h-1.5 w-6 rounded-sm" style={{ backgroundColor: option.trim }} />
                      <span className="absolute left-2 top-3.5 h-3 w-6 rounded-sm" style={{ backgroundColor: option.body }} />
                      <span className="absolute left-3 top-5 h-1 w-4 rounded-sm" style={{ backgroundColor: option.visor }} />
                    </span>
                    <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white">{option.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                disabled={mismatch}
                onClick={() => createAccount(false)}
                className="w-full rounded-2xl border border-neon-cyan/40 bg-neon-cyan/12 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-neon-cyan/18 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => createAccount(true)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-100 transition hover:border-slate-600"
              >
                Continue as Guest
              </button>
            </div>

            <div className="mt-5 text-sm text-slate-400">
              Already have access?{" "}
              <Link href="/login" className="text-neon-cyan underline-offset-4 hover:underline">
                Sign In
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
