"use client";

import { cn } from "@/lib/cn";

type LogoProps = {
  variant?: "icon" | "wordmark";
  className?: string;
  labelClassName?: string;
};

export function Logo({ variant = "wordmark", className, labelClassName }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 76 76"
        aria-hidden="true"
        className="h-11 w-11 shrink-0 drop-shadow-[0_0_20px_rgba(51,245,255,0.32)]"
      >
        <defs>
          <linearGradient id="neon-exchange-logo" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#33F5FF" />
            <stop offset="55%" stopColor="#59E0FF" />
            <stop offset="100%" stopColor="#FF4DDC" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="64" height="64" rx="16" fill="rgba(6,9,15,0.88)" stroke="rgba(108,124,160,0.28)" />
        <path d="M18 55V21h10l20 22V21h10v34H48L28 33v22H18Z" fill="url(#neon-exchange-logo)" />
        <path d="M55 19l8 8M13 49l8 8" stroke="#EAFBFF" strokeLinecap="square" strokeWidth="2.4" />
      </svg>
      {variant === "wordmark" ? (
        <div className={cn("min-w-0", labelClassName)}>
          <div className="font-['Orbitron','Rajdhani','Arial_Narrow',sans-serif] text-[11px] uppercase tracking-[0.36em] text-cyan-200/88">
            NEON
          </div>
          <div className="font-['Orbitron','Rajdhani','Arial_Narrow',sans-serif] text-lg font-semibold uppercase tracking-[0.22em] text-white">
            EXCHANGE
          </div>
        </div>
      ) : null}
    </div>
  );
}
