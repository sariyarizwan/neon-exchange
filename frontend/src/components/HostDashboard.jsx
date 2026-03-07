import { useEffect, useMemo, useRef, useState } from 'react';
import AudioMotionAnalyzer from 'audiomotion-analyzer';

function InfluenceMeter({ influencePercent }) {
  return (
    <div className="glass-panel p-4" aria-labelledby="influence-meter-title">
      <div className="mb-2 flex items-center justify-between">
        <h3 id="influence-meter-title" className="text-lg font-bold">Influence Meter</h3>
        <span className="text-sm font-semibold text-amber-200">{influencePercent}% crowd</span>
      </div>

      <div className="h-4 overflow-hidden rounded-full bg-gray-200/40">
        <div
          className="h-full bg-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, influencePercent))}%` }}
        />
      </div>
    </div>
  );
}

function VisualizerPanel({ audioElementRef }) {
  const canvasHostRef = useRef(null);
  const analyzerRef = useRef(null);
  const [visualizerError, setVisualizerError] = useState('');

  useEffect(() => {
    if (!canvasHostRef.current || !audioElementRef.current || analyzerRef.current) return;
    try {
      analyzerRef.current = new AudioMotionAnalyzer(canvasHostRef.current, {
        source: audioElementRef.current,
        mode: 3,
        gradient: 'rainbow',
        showBgColor: true,
        overlay: true,
        reflexRatio: 0.2
      });
      setVisualizerError('');
    } catch (error) {
      setVisualizerError(error instanceof Error ? error.message : 'Visualizer unavailable.');
    }

    return () => {
      analyzerRef.current?.destroy();
      analyzerRef.current = null;
    };
  }, [audioElementRef]);

  return (
    <section className="glass-panel p-4" aria-labelledby="audio-visualizer-title">
      <div className="mb-3 flex items-center justify-between">
        <h3 id="audio-visualizer-title" className="text-lg font-bold">Live Audio Visualizer</h3>
        <span className="rounded-full bg-black/35 px-2 py-1 text-xs text-white/80">Lyria Realtime</span>
      </div>

      <div
        ref={canvasHostRef}
        role="img"
        aria-label="Audio visualizer showing currently playing stream"
        className="h-56 w-full overflow-hidden rounded-xl border border-white/20 bg-black/30"
      >
        {visualizerError && (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-white/80">
            Visualizer unavailable in this browser context. Audio playback controls are still active.
          </div>
        )}
      </div>

      <audio
        ref={audioElementRef}
        controls
        className="mt-3 w-full"
        aria-label="Synchronized stream playback"
      >
        <track kind="captions" />
      </audio>
    </section>
  );
}

function PromptWordCloud({ prompts }) {
  const words = useMemo(() => {
    const palette = ['#f59e0b', '#818cf8', '#a5b4fc', '#fde68a', '#f8fafc'];
    return prompts.map((text, index) => ({
      text,
      color: palette[index % palette.length],
      top: 14 + ((index * 17) % 66),
      left: 10 + ((index * 23) % 74),
      size: 16 + (index % 4) * 6,
      rotate: index % 2 === 0 ? -10 : 8
    }));
  }, [prompts]);

  return (
    <section className="glass-panel p-4" aria-labelledby="word-cloud-title">
      <div className="mb-2 flex items-center justify-between">
        <h3 id="word-cloud-title" className="text-lg font-bold">Active Prompt Cloud</h3>
        <span aria-live="polite" className="text-xs text-white/80">Refreshes every 4s</span>
      </div>

      <div className="h-56 rounded-xl bg-black/25 p-2">
        <div className="relative h-full w-full overflow-hidden rounded-lg">
          {words.map((word) => (
            <span
              key={word.text}
              className="absolute font-black uppercase tracking-wide motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out"
              style={{
                color: word.color,
                top: `${word.top}%`,
                left: `${word.left}%`,
                fontSize: `${word.size}px`,
                transform: `translate(-50%, -50%) rotate(${word.rotate}deg)`
              }}
            >
              {word.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function statusText(status) {
  if (status === 'connected') return 'Connected';
  if (status === 'connecting') return 'Reconnecting';
  if (status === 'error') return 'Error';
  return 'Disconnected';
}

export default function HostDashboard({ prompts, influencePercent, wsStatus, audioElementRef }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]" aria-labelledby="host-dashboard-title">
      <h2 id="host-dashboard-title" className="sr-only">Host dashboard</h2>

      <div className="space-y-4">
        <VisualizerPanel audioElementRef={audioElementRef} />
        <InfluenceMeter influencePercent={influencePercent} />
      </div>

      <div className="space-y-4">
        <div className="glass-panel flex items-center justify-between p-4" aria-live="polite">
          <h3 className="text-lg font-bold">WebSocket Status</h3>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              wsStatus === 'connected'
                ? 'bg-emerald-500/90'
                : wsStatus === 'connecting'
                ? 'bg-amber-500/90'
                : 'bg-red-500/90'
            }`}
          >
            {statusText(wsStatus)}
          </span>
        </div>

        <PromptWordCloud prompts={prompts} />
      </div>
    </section>
  );
}
