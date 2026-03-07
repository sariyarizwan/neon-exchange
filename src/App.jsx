import { useEffect, useMemo, useRef, useState } from 'react';
import CoroBackdrop from './components/CoroBackdrop';
import HostDashboard from './components/HostDashboard';
import EntryScreen from './components/EntryScreen';
import OpeningScene from './components/OpeningScene';
import RoomCreator from './components/RoomCreator';
import RoleSelectionPage from './components/RoleSelectionPage';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

const roleOptions = [
  { id: 'drummer', name: 'Drummer', icon: '🥁' },
  { id: 'vibe_setter', name: 'Vibe Setter', icon: '✨' },
  { id: 'genre_dj', name: 'Genre DJ', icon: '🎚️' },
  { id: 'instrumentalist', name: 'Instrumentalist', icon: '🎹' },
  { id: 'energy_controller', name: 'Energy Controller', icon: '⚡' }
];

const defaultHostState = {
  roomId: '',
  prompts: ['synthwave', 'uplifting', 'warm bass'],
  influencePercent: 35,
  wsStatus: 'disconnected',
  isMusicStarted: false
};

const defaultGuestState = {
  roomId: '',
  selectedRole: '',
  connected: false
};

function App() {
  const [hasEntered, setHasEntered] = useState(() => sessionStorage.getItem('coroEntered') === '1');
  const [showEntry, setShowEntry] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [viewMode, setViewMode] = useState('host');
  const [hostState, setHostState] = useState(defaultHostState);
  const [guestState, setGuestState] = useState(defaultGuestState);
  const [audioUrl, setAudioUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('Waiting for connection.');

  const wsRef = useRef(null);
  const audioRef = useRef(null);

  const joinLink = useMemo(() => {
    if (!hostState.roomId) return '';
    const origin = window.location.origin;
    return `${origin}/?room=${hostState.roomId}&mode=guest`;
  }, [hostState.roomId]);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;
    setHostState((prev) => ({ ...prev, wsStatus: 'connecting' }));

    socket.onopen = () => {
      setHostState((prev) => ({ ...prev, wsStatus: 'connected' }));
      setGuestState((prev) => ({ ...prev, connected: true }));
      setStatusMessage('Connected to CORO server.');
      if (!hasEntered) setShowEntry(true);
    };

    socket.onclose = () => {
      setHostState((prev) => ({ ...prev, wsStatus: 'disconnected' }));
      setGuestState((prev) => ({ ...prev, connected: false }));
      setStatusMessage('Disconnected. Trying to reconnect soon.');
    };

    socket.onerror = () => {
      setHostState((prev) => ({ ...prev, wsStatus: 'error' }));
      setStatusMessage('Connection issue detected.');
    };

    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        const blobUrl = URL.createObjectURL(event.data);
        setAudioUrl(blobUrl);
        return;
      }

      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'room_created') {
          setHostState((prev) => ({ ...prev, roomId: payload.roomId }));
        }

        if (payload.type === 'state_tick') {
          setHostState((prev) => ({
            ...prev,
            prompts: payload.prompts || prev.prompts,
            influencePercent: payload.influencePercent ?? prev.influencePercent
          }));
        }

        if (payload.type === 'status') {
          setStatusMessage(payload.message || 'Status updated.');
        }
      } catch {
        setStatusMessage('Received non-JSON message.');
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (!hostState.isMusicStarted) return undefined;

    const interval = setInterval(() => {
      sendMessage({ type: 'request_tick', roomId: hostState.roomId });
    }, 4000);

    return () => clearInterval(interval);
  }, [hostState.isMusicStarted, hostState.roomId]);

  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    audioRef.current.src = audioUrl;
    audioRef.current.play().catch(() => {
      setStatusMessage('Audio stream ready. Tap play to start audio.');
    });
  }, [audioUrl]);

  const sendMessage = (message) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify(message));
  };

  const handleCreateRoom = () => {
    sendMessage({ type: 'create_room' });
  };

  const handleJoinRoom = (roomId, role) => {
    setGuestState((prev) => ({ ...prev, roomId, selectedRole: role }));
    sendMessage({ type: 'join_room', roomId, role });
  };

  const handleStartMusic = () => {
    if (!hostState.roomId) return;
    setHostState((prev) => ({ ...prev, isMusicStarted: true }));
    sendMessage({ type: 'start_music', roomId: hostState.roomId });
  };

  const handleInputUpdate = (payload) => {
    sendMessage({
      type: 'input_update',
      roomId: viewMode === 'host' ? hostState.roomId : guestState.roomId,
      role: guestState.selectedRole,
      ...payload
    });
  };

  const handleEnterDashboard = () => {
    setHasEntered(true);
    setShowEntry(false);
    sessionStorage.setItem('coroEntered', '1');
  };

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-10">
      {showIntro && <OpeningScene onComplete={() => setShowIntro(false)} />}
      {showEntry && (
        <EntryScreen onEnter={handleEnterDashboard} audioElementRef={audioRef} />
      )}
      {!showIntro && <CoroBackdrop />}

      <header className="relative z-10 mx-auto mb-6 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">CORO</p>
          <h1 className="text-2xl font-black sm:text-3xl">Real-Time Crowd Music Studio</h1>
        </div>

        <nav aria-label="Application mode" className="glass-panel flex gap-2 p-2">
          <button
            type="button"
            onClick={() => setViewMode('host')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
              viewMode === 'host' ? 'bg-indigo-500 text-white' : 'bg-white/20 text-white/90 hover:bg-white/30'
            }`}
          >
            Host View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('guest')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
              viewMode === 'guest' ? 'bg-indigo-500 text-white' : 'bg-white/20 text-white/90 hover:bg-white/30'
            }`}
          >
            Guest View
          </button>
        </nav>
      </header>

      <p aria-live="polite" className="sr-only">
        {statusMessage}
      </p>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl xl:max-w-7xl gap-4 md:gap-6 px-4 sm:px-6 lg:px-8">
        {viewMode === 'host' ? (
          <>
            <RoomCreator
              roomId={hostState.roomId}
              joinLink={joinLink}
              wsStatus={hostState.wsStatus}
              onCreateRoom={handleCreateRoom}
              onStartMusic={handleStartMusic}
            />

            <HostDashboard
              prompts={hostState.prompts}
              influencePercent={hostState.influencePercent}
              wsStatus={hostState.wsStatus}
              audioElementRef={audioRef}
            />
          </>
        ) : (
          <RoleSelectionPage
            roomId={guestState.roomId || hostState.roomId}
            selectedRole={guestState.selectedRole}
            roleOptions={roleOptions}
            onJoinRoom={handleJoinRoom}
            onInputUpdate={handleInputUpdate}
          />
        )}
      </main>
    </div>
  );
}

export default App;
