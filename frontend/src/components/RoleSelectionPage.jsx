import { useMemo, useState } from 'react';
import DrummerControl from './DrummerControl';
import EnergyControls from './EnergyControls';
import GenreSelector from './GenreSelector';
import InstrumentSelector from './InstrumentSelector';
import MoodInput from './MoodInput';

export default function RoleSelectionPage({ roomId, selectedRole, roleOptions, onJoinRoom, onInputUpdate }) {
  const [roomInput, setRoomInput] = useState(roomId || '');
  const [showChat, setShowChat] = useState(false);

  const roleComponent = useMemo(() => {
    switch (selectedRole) {
      case 'drummer':
        return <DrummerControl onInputUpdate={onInputUpdate} />;
      case 'vibe_setter':
        return <MoodInput onInputUpdate={onInputUpdate} />;
      case 'genre_dj':
        return <GenreSelector onInputUpdate={onInputUpdate} />;
      case 'instrumentalist':
        return <InstrumentSelector onInputUpdate={onInputUpdate} />;
      case 'energy_controller':
        return <EnergyControls onInputUpdate={onInputUpdate} />;
      default:
        return null;
    }
  }, [selectedRole, onInputUpdate]);

  return (
    <section className="grid gap-4 md:gap-6" aria-labelledby="role-selection-title">
      <div className="glass-panel p-4 sm:p-6">
        <h2 id="role-selection-title" className="text-xl font-bold">Join CORO Room</h2>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="room-id" className="sr-only">Room ID</label>
          <input
            id="room-id"
            value={roomInput}
            onChange={(event) => setRoomInput(event.target.value)}
            placeholder="Enter room ID"
            aria-label="Room ID"
            className="w-full rounded-lg border border-white/40 bg-white/90 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          />
        </div>

        <fieldset className="mt-5">
          <legend className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/80">Select your role</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {roleOptions.map((role) => {
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  aria-label={`Choose ${role.name}`}
                  aria-pressed={isSelected}
                  onClick={() => onJoinRoom(roomInput || roomId, role.id)}
                  className={`rounded-xl px-4 py-3 text-left transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 motion-safe:hover:scale-[1.02] ${
                    isSelected
                      ? 'bg-indigo-500/60 ring-2 ring-indigo-400'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <span className="mb-1 block text-xl" aria-hidden="true">{role.icon}</span>
                  <span className="block font-semibold">{role.name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <section className="glass-panel p-4 sm:p-6 w-full" aria-labelledby="quick-actions-title">
        <div className="mb-3 flex items-center justify-between">
          <h3 id="quick-actions-title" className="text-lg font-bold">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <button type="button" className="quick-tile" onClick={() => setShowChat(true)} aria-haspopup="dialog">
            Chat AI
          </button>
          <button type="button" className="quick-tile">How it works</button>
          <button type="button" className="quick-tile">Demo</button>
          <button type="button" className="quick-tile" onClick={() => onJoinRoom(roomInput || roomId, selectedRole || 'drummer')}>
            Create Room
          </button>
          <button type="button" className="quick-tile">Settings</button>
        </div>
      </section>

      {roleComponent && (
        <div className="motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out">{roleComponent}</div>
      )}

      {showChat && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chat AI"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowChat(false);
          }}
        >
          <div className="glass-panel w-full max-w-lg p-5 relative">
            <h4 className="text-lg font-bold mb-2">Chat AI</h4>
            <p className="text-sm text-white/80">
              Ask CORO for help choosing roles, vibe, and prompts.
            </p>
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md bg-white/15 px-2 py-1 text-xs font-semibold hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              onClick={() => setShowChat(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
