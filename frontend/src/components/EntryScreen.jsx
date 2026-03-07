import { useEffect, useMemo, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function EntryScreen({ onEnter, audioElementRef }) {
  const [amp, setAmp] = useState(0.12);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!audioElementRef?.current || prefersReducedMotion()) return undefined;

    const audioEl = audioElementRef.current;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaElementSource(audioEl);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;
    const buffer = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(buffer);
      const avg = buffer.reduce((sum, v) => sum + v, 0) / buffer.length || 0;
      setAmp(Math.min(1, Math.max(0.05, avg / 180)));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      analyser.disconnect();
      source.disconnect();
      ctx.close();
    };
  }, [audioElementRef]);

  const ringScales = useMemo(
    () => [1, 1.35, 1.7],
    []
  );

  const spikes = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        base: 0.4 + (i % 7) * 0.07 + Math.random() * 0.15
      })),
    []
  );

  const motionReduced = prefersReducedMotion();

  return (
    <section className="entry-screen">
      <div className="entry-overlay" />

      <div
        className="entry-globe"
        role="presentation"
        onClick={onEnter}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onEnter();
          }
        }}
        tabIndex={0}
        aria-label="Enter dashboard"
      >
        <div className="globe-core">
          <div className="globe-ambient" />
          <div className="globe-dots" />
          <div className={`globe-earth ${motionReduced ? 'reduced' : ''}`} />
          <div className="globe-shine" />
          <div className="globe-halo" />
          <div className="coro-orb-grid" />
          <div className="legacy-wave-stack">
            {Array.from({ length: 3 }).map((_, index) => (
              <span key={`legacy-ring-${index}`} className="legacy-wave" style={{ '--i': index }} />
            ))}
          </div>
          <div className="torus">
            <div className="torus-inner" />
          </div>
          <div className="spike-field" aria-hidden="true">
            {spikes.map((s, idx) => (
              <span
                key={s.id}
                className="spike"
                style={{
                  '--offset': `${(idx / spikes.length) * 100}%`,
                  height: `${55 + (motionReduced ? 12 : 120 * amp * s.base)}px`
                }}
              />
            ))}
          </div>
        </div>

        {ringScales.map((scale, idx) => (
          <div
            key={scale}
            className="globe-ring"
            style={{
              transform: `translate(-50%, -50%) scale(${scale + amp * 0.4})`,
              animationDelay: `${idx * 0.35}s`
            }}
          />
        ))}
      </div>

      <div className="entry-cta glass-panel">
        <p className="entry-kicker">CORO</p>
        <h2 className="entry-title">Enter the collaborative audio sphere</h2>
        <p className="entry-sub">Click to enter the dashboard and start orchestrating.</p>
        <button
          type="button"
          onClick={onEnter}
          className="entry-button"
        >
          Enter Dashboard
        </button>
      </div>
    </section>
  );
}
