import { useEffect, useState } from 'react';

const genres = ['EDM', 'Lo-fi', 'Hip-Hop', 'Pop', 'House', 'Afrobeats', 'Drum & Bass', 'Ambient'];

export default function GenreSelector({ onInputUpdate }) {
  const [selected, setSelected] = useState(['EDM']);

  useEffect(() => {
    onInputUpdate({ control: 'genres', value: selected });
  }, [selected, onInputUpdate]);

  const toggle = (genre) => {
    setSelected((prev) => (prev.includes(genre) ? prev.filter((item) => item !== genre) : [...prev, genre]));
  };

  return (
    <section className="glass-panel p-4" aria-labelledby="genre-panel-title">
      <h3 id="genre-panel-title" className="mb-3 text-lg font-bold">Genre DJ</h3>

      <nav aria-label="Genre selection" className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {genres.map((genre) => {
          const active = selected.includes(genre);
          return (
            <button
              key={genre}
              type="button"
              aria-label={`Select ${genre}`}
              aria-pressed={active}
              onClick={() => toggle(genre)}
              className={`rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 motion-safe:hover:scale-105 ${
                active ? 'ring-2 ring-indigo-500 bg-indigo-500/40 text-white' : 'bg-white/20 text-white/90 hover:bg-white/30'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </nav>
    </section>
  );
}
