import { useEffect, useState } from 'react';

export default function DrummerControl({ onInputUpdate }) {
  const [bpm, setBpm] = useState(120);

  useEffect(() => {
    onInputUpdate({ control: 'bpm', value: bpm });
  }, [bpm, onInputUpdate]);

  return (
    <section className="glass-panel p-4" aria-labelledby="drummer-panel">
      <h3 id="drummer-panel" className="mb-3 text-lg font-bold">Drummer</h3>

      <label htmlFor="bpm-slider" className="control-label">
        BPM: <span className="font-black text-amber-300">{bpm}</span>
      </label>

      <input
        id="bpm-slider"
        aria-label="Beats per minute"
        type="range"
        min="60"
        max="160"
        value={bpm}
        onChange={(event) => setBpm(Number(event.target.value))}
        className="mx-4 w-full accent-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
      />
    </section>
  );
}
