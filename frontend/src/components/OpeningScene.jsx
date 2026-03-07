import { useState } from 'react';

export default function OpeningScene({ onComplete }) {
  const [isLeaving, setIsLeaving] = useState(false);

  return (
    <section
      aria-label="CORO opening animation"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 px-6 transition-opacity duration-500 ${
        isLeaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex w-full max-w-5xl flex-col items-center gap-6 text-center">
        <div className="coro-orb-wrap motion-reduce:hidden" aria-hidden="true">
          <div className="coro-sphere-shade" />
          <div className="coro-earth-texture" />
          <div className="coro-depth-glow" />
          <div className="coro-particles" />
        </div>

        <div className="glass-panel max-w-xl px-6 py-4">
          <p className="coro-wordmark text-xs uppercase tracking-[0.35em] text-indigo-200">CORO</p>
          <h2
            className="hero-mirror mt-2 text-xl font-black leading-tight sm:text-3xl"
            data-text="Crowd Orchestrated Realtime Output"
          >
            Crowd Orchestrated Realtime Output
          </h2>
          <p className="mt-2 text-xs text-white/80 sm:text-sm">
            Live crowd signals converging into one evolving musical sphere.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsLeaving(true);
            setTimeout(onComplete, 260);
          }}
          className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-out hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          Enter CORO Studio
        </button>
      </div>
    </section>
  );
}
