import QRCode from 'react-qr-code';

function StatusBadge({ status }) {
  const map = {
    connected: 'bg-emerald-500',
    connecting: 'bg-amber-500',
    disconnected: 'bg-red-500',
    error: 'bg-orange-500'
  };

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold">
      <span className={`h-2.5 w-2.5 rounded-full ${map[status] || 'bg-zinc-500'} pulse-feedback motion-safe:animate-pulse`} />
      {status}
    </span>
  );
}

export default function RoomCreator({ roomId, joinLink, wsStatus, onCreateRoom, onStartMusic }) {
  return (
    <section className="glass-panel grid gap-4 p-4 sm:p-6 md:grid-cols-[1fr_auto]" aria-labelledby="room-setup-title">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 id="room-setup-title" className="text-xl font-bold text-white">Room Setup</h2>
          <StatusBadge status={wsStatus} />
        </div>

        <p className="text-sm text-white/80">Create a room, share the QR code, and start synchronized playback.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCreateRoom}
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 ease-out hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            Create Room
          </button>

          <button
            type="button"
            onClick={onStartMusic}
            disabled={!roomId}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-300 ease-out hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
          >
            Start Music
          </button>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <p>
            Room ID: <span className="font-bold tracking-wider">{roomId || 'Pending'}</span>
          </p>
          {joinLink && (
            <p className="break-all rounded-md bg-black/25 px-3 py-2 text-white/90">
              Join link: {joinLink}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center rounded-2xl bg-white p-4">
        {joinLink ? (
          <QRCode value={joinLink} size={130} aria-label="Room QR code" />
        ) : (
          <p className="w-36 text-center text-xs text-slate-700">QR code appears after room creation</p>
        )}
      </div>
    </section>
  );
}
