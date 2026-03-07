import { useEffect, useState } from 'react';

const instruments = [
  { name: 'Synth', icon: '🎹' },
  { name: 'Guitar', icon: '🎸' },
  { name: 'Bass', icon: '🪕' },
  { name: 'Strings', icon: '🎻' },
  { name: 'Brass', icon: '🎺' },
  { name: 'Pads', icon: '🎛️' }
];

export default function InstrumentSelector({ onInputUpdate }) {
  const [selected, setSelected] = useState(['Synth']);

  useEffect(() => {
    onInputUpdate({ control: 'instruments', value: selected });
  }, [selected, onInputUpdate]);

  const toggle = (name) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
  };

  return (
    <section className="glass-panel p-4" aria-labelledby="instrument-panel-title">
      <h3 id="instrument-panel-title" className="mb-3 text-lg font-bold">Instrumentalist</h3>

      <fieldset>
        <legend className="sr-only">Instrument selection</legend>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {instruments.map((instrument) => {
            const active = selected.includes(instrument.name);
            return (
              <button
                key={instrument.name}
                type="button"
                aria-label={`Select ${instrument.name}`}
                aria-pressed={active}
                onClick={() => toggle(instrument.name)}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 motion-safe:hover:scale-105 ${
                  active ? 'ring-2 ring-amber-500 bg-amber-500/35 text-white' : 'bg-white/20 text-white/90 hover:bg-white/30'
                }`}
              >
                <span role="img" aria-label={`${instrument.name} icon`} className="mr-1">
                  {instrument.icon}
                </span>
                {instrument.name}
              </button>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
