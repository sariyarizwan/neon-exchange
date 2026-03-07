import { useEffect, useState } from 'react';

export default function EnergyControls({ onInputUpdate }) {
  const [density, setDensity] = useState(0.5);
  const [brightness, setBrightness] = useState(0.5);

  useEffect(() => {
    onInputUpdate({ control: 'energy', value: { density, brightness } });
  }, [density, brightness, onInputUpdate]);

  return (
    <section className="glass-panel p-4" aria-labelledby="energy-panel-title">
      <h3 id="energy-panel-title" className="mb-3 text-lg font-bold">Energy Controller</h3>

      <fieldset className="space-y-4">
        <legend className="sr-only">Energy controls</legend>

        <div className="mx-auto w-3/4">
          <label htmlFor="density-slider" className="control-label">Density: {density.toFixed(2)}</label>
          <input
            id="density-slider"
            aria-label="Density"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={density}
            onChange={(event) => setDensity(Number(event.target.value))}
            className="w-full rounded-md bg-gray-200 accent-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          />
        </div>

        <div className="mx-auto w-3/4">
          <label htmlFor="brightness-slider" className="control-label">Brightness: {brightness.toFixed(2)}</label>
          <input
            id="brightness-slider"
            aria-label="Brightness"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={brightness}
            onChange={(event) => setBrightness(Number(event.target.value))}
            className="w-full rounded-md bg-gray-200 accent-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          />
        </div>
      </fieldset>
    </section>
  );
}
