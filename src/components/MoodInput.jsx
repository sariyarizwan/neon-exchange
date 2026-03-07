import { useEffect, useState } from 'react';

export default function MoodInput({ onInputUpdate }) {
  const [moodWords, setMoodWords] = useState('uplifting, cinematic');

  useEffect(() => {
    const timeout = setTimeout(() => {
      onInputUpdate({ control: 'mood_words', value: moodWords });
    }, 250);

    return () => clearTimeout(timeout);
  }, [moodWords, onInputUpdate]);

  return (
    <section className="glass-panel p-4" aria-labelledby="mood-input-panel">
      <h3 id="mood-input-panel" className="mb-3 text-lg font-bold">Vibe Setter</h3>

      <label htmlFor="mood-input" className="control-label">Mood words</label>
      <textarea
        id="mood-input"
        aria-label="Enter mood words"
        placeholder="Enter mood words"
        rows={4}
        value={moodWords}
        onChange={(event) => setMoodWords(event.target.value)}
        className="w-full rounded-md border border-white/50 bg-white/90 p-2 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </section>
  );
}
