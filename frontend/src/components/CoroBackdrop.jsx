export default function CoroBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="coro-dash-orb-wrap motion-reduce:hidden">
        <div className="coro-sphere-shade" />
        <div className="coro-earth-texture" />
        <div className="coro-depth-glow" />
        <div className="coro-orb-grid" />
        <div className="legacy-wave-stack">
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={`dash-legacy-ring-${index}`} className="legacy-wave" style={{ '--i': index }} />
          ))}
        </div>
        <div className="coro-particles" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/35 to-slate-950/60" />
    </div>
  );
}
