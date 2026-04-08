'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import socketService from '@/services/socket';
import { 
  Users, 
  Clock, 
  X, 
  Copy, 
  Check, 
  Play, 
  LogOut,
  Shield,
  Zap,
  Brain,
  Swords,
  AlertCircle,
  Plus,
  LogIn,
  ArrowLeft
} from 'lucide-react';

const DURATION_OPTIONS = [15, 30, 45, 60];
const QUESTION_OPTIONS = [1, 3, 5, 10];

const DIFFICULTY_CONFIG = {
  easy: { icon: Zap, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  medium: { icon: Brain, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  hard: { icon: Swords, color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

export default function PrivateRoomModal({ playerCount, playerCountType, difficulty, onClose }) {
  const [mode, setMode] = useState('select'); // 'select', 'joinPrompt', 'room'
  const [roomContext, setRoomContext] = useState(null); // { type: 'create' } or { type: 'join', code: 'A1B2C3' }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {mode === 'select' && (
          <SelectionView 
            onSelect={(type) => {
              if (type === 'create') {
                setRoomContext({ type: 'create' });
                setMode('room');
              } else {
                setMode('joinPrompt');
              }
            }} 
            onClose={onClose} 
          />
        )}
        {mode === 'joinPrompt' && (
          <JoinPromptView 
            onJoin={(code) => {
              setRoomContext({ type: 'join', code });
              setMode('room');
            }}
            onBack={() => setMode('select')}
            onClose={onClose}
          />
        )}
        {mode === 'room' && (
          <UnifiedRoomView 
            context={roomContext}
            defaultPlayerCount={playerCount}
            defaultPlayerCountType={playerCountType}
            defaultDifficulty={difficulty}
            onClose={onClose} 
            onBack={() => setMode('select')} 
          />
        )}
      </div>
    </div>
  );
}

function SelectionView({ onSelect, onClose }) {
  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-white">Private Room</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="p-8 space-y-8 flex flex-col items-center">
        <h3 className="text-xl text-slate-300 font-medium text-center">
          Would you like to create a new room or join an existing one?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button 
            onClick={() => onSelect('create')}
            className="flex flex-col items-center justify-center p-8 bg-slate-900 border-2 border-slate-700 rounded-2xl hover:border-orange-500 hover:bg-slate-800 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-orange-500" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Create Room</h4>
            <p className="text-slate-400 text-center text-sm">Host a new battle and invite your friends</p>
          </button>
          
          <button 
            onClick={() => onSelect('join')}
            className="flex flex-col items-center justify-center p-8 bg-slate-900 border-2 border-slate-700 rounded-2xl hover:border-green-500 hover:bg-slate-800 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <LogIn className="w-8 h-8 text-green-500" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Join Room</h4>
            <p className="text-slate-400 text-center text-sm">Enter a room code to join an existing battle</p>
          </button>
        </div>
      </div>
    </>
  );
}

function JoinPromptView({ onJoin, onBack, onClose }) {
  const [codeInput, setCodeInput] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (code.length === 6) {
      onJoin(code);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-700 rounded-lg transition-colors mr-2">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <Shield className="w-6 h-6 text-green-500" />
          <h2 className="text-2xl font-bold text-white">Join Room</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="p-6">
        <form onSubmit={handleJoin} className="bg-slate-900 rounded-xl p-8 border border-slate-700 max-w-md mx-auto my-4">
          <h3 className="text-xl font-bold text-white mb-6 text-center">Enter Room Code</h3>
          <div className="space-y-6">
            <input 
              type="text" 
              value={codeInput} 
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="A1B2C3"
              maxLength={6}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-4 text-white text-center text-3xl tracking-[0.25em] font-bold focus:border-green-500 focus:outline-none transition-colors"
            />
            <button 
              type="submit"
              disabled={codeInput.length !== 6}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg shadow-green-500/20"
            >
              <LogIn className="w-5 h-5" />
              <span>Join Room</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function UnifiedRoomView({ context, defaultPlayerCount, defaultPlayerCountType, defaultDifficulty, onClose, onBack }) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [roomCode, setRoomCode] = useState(context.code || '');
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(context.type === 'create');
  const [copied, setCopied] = useState(false);
  
  // Real-time metadata variables
  const [roomSettings, setRoomSettings] = useState({ duration: 30, numQuestions: 3 });
  const [activeDifficulty, setActiveDifficulty] = useState(defaultDifficulty);
  const [maxPlayersAllowed, setMaxPlayersAllowed] = useState(defaultPlayerCount);
  const [isFlexibleType, setIsFlexibleType] = useState(defaultPlayerCountType === 'flexible');
  
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(null);
  const initialized = useRef(false);

  useEffect(() => {
    socketService.connect();

    // Attach all error/success Listeners upfront!
    const handleError = (data) => setError(data.message || 'Failed connecting to room');

    const handleRoomCreated = (data) => {
      setRoomCode(data.room.code);
      setPlayers(data.room.players);
      setActiveDifficulty(data.room.difficulty);
      setRoomSettings(data.room.settings || { duration: 30, numQuestions: 3 });
      setMaxPlayersAllowed(data.room.maxPlayers);
      setError('');
    };

    const handlePlayerListUpdate = (playersPayload) => {
      console.log("Players updated:", playersPayload);
      setPlayers([...playersPayload]);
      const me = playersPayload.find(p => String(p.username) === String(user?.username));
      if (me) setIsHost(me.isHost);
      setError('');
    };

    const handleBattleCountdown = ({ roomCode: matchRoomCode }) => {
      let time = 5;
      setCountdown(time);

      const interval = setInterval(() => {
        time--;

        if (time === 0) {
          clearInterval(interval);
          
          console.log("Navigating to:", `/battle/${matchRoomCode}`);
          router.push(`/battle/${matchRoomCode}`);
        } else {
          setCountdown(time);
        }
      }, 1000);
    };

    const handleHostChanged = (data) => {
      setIsHost(String(data.newHostId) === String(user?.id));
      setPlayers(data.players);
    };

    socketService.on('room_error', handleError);
    socketService.on('room_not_found', () => setError('Room not found. Please check the code.'));
    socketService.on('room_created', handleRoomCreated);
    socketService.on('player_list_update', handlePlayerListUpdate);
    socketService.on('battle_countdown_start', handleBattleCountdown);
    socketService.on('host_changed', handleHostChanged);

    // Bootstrap!
    if (!initialized.current) {
      initialized.current = true;
      if (context.type === 'create' && user) {
        const gennedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomCode(gennedCode);
        setPlayers([{ id: user.id, username: user.username, isHost: true }]);

        socketService.emit('create_room', {
          roomCode: gennedCode,
          hostId: user.id,
          username: user.username, // Send explicit username
          difficulty: defaultDifficulty,
          maxPlayers: defaultPlayerCountType === 'flexible' ? defaultPlayerCount : defaultPlayerCount,
          settings: roomSettings,
        });
      } else if (context.type === 'join' && user) {
        socketService.emit('join_room', { roomCode: context.code, username: user.username });
      }
    }

    return () => {
      socketService.off('room_error', handleError);
      socketService.off('room_not_found');
      socketService.off('room_created', handleRoomCreated);
      socketService.off('player_list_update', handlePlayerListUpdate);
      socketService.off('battle_countdown_start', handleBattleCountdown);
      socketService.off('host_changed', handleHostChanged);
      
      // Removed leave_room from cleanup to prevent React 18 Strict Mode from deleting the room instantly
    };
  }, [user, context, defaultDifficulty, defaultPlayerCount, defaultPlayerCountType]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartBattle = () => {
    console.log("Start battle clicked");
    
    if (socketService.socket?.connected === false) {
      socketService.connect();
    }

    socketService.emit('start_battle', { 
      roomCode, 
      settings: roomSettings,
      difficulty: activeDifficulty
    });
  };

  const handleLeaveRoom = () => {
    socketService.emit('leave_room', { roomCode });
    onClose();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-white text-xl font-bold text-center">{error}</p>
        <div className="flex space-x-4 mt-4">
          <button onClick={onBack} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">Go Back</button>
          <button onClick={onClose} className="px-6 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white">Close</button>
        </div>
      </div>
    );
  }

  const canStart = players.length >= 2;
  const diffConfig = DIFFICULTY_CONFIG[activeDifficulty] || DIFFICULTY_CONFIG['easy'];
  const DifficultyIcon = diffConfig.icon;

  return (
    <>
      {countdown !== null && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 rounded-2xl">
          <h2 className="text-4xl font-bold text-white mb-6 tracking-widest uppercase">Match Found!</h2>
          <div className="w-32 h-32 rounded-full border-4 border-orange-500 flex items-center justify-center animate-[pulse_1s_ease-in-out_infinite]">
            <span className="text-6xl font-black text-orange-500">{countdown}</span>
          </div>
          <p className="text-slate-400 mt-8 animate-pulse">Launching Battle Arena...</p>
        </div>
      )}

      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-white">Waiting Room</h2>
        </div>
        <button onClick={handleLeaveRoom} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
          <p className="text-slate-400 text-sm mb-3">Room Code (Share with friends)</p>
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-slate-800 rounded-lg px-6 py-4 border border-slate-700">
              <span className="text-3xl font-bold text-white tracking-widest">{roomCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-2 px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-orange-500" />
              <span>Players</span>
            </h3>
            <span className="text-sm text-slate-400">
              {players.length} / {isFlexibleType ? '≤' : ''}{maxPlayersAllowed}
            </span>
          </div>
          
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left text-slate-400 font-medium py-3 px-6 w-16">Slot</th>
                <th className="text-left text-slate-400 font-medium py-3 px-6">Username</th>
                <th className="text-center text-slate-400 font-medium py-3 px-6">Role</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={index} className="border-b border-slate-700 last:border-0 hover:bg-slate-800/50">
                  <td className="py-4 px-6 text-slate-400 font-bold">{index + 1}</td>
                  <td className="py-4 px-6 text-white font-medium">{player.username}</td>
                  <td className="py-4 px-6 text-center">
                    {player.isHost ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-400">
                        Host
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span>Match Settings {isHost ? '(Host Only)' : '(Read Only)'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Duration (minutes)</label>
              <div className="grid grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((duration) => (
                  <button
                    key={duration}
                    onClick={() => isHost && setRoomSettings({ ...roomSettings, duration })}
                    disabled={!isHost}
                    className={`py-2 px-1 rounded-lg font-medium text-sm transition-all ${
                      roomSettings.duration === duration
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Questions</label>
              <div className="grid grid-cols-4 gap-2">
                {QUESTION_OPTIONS.map((num) => (
                  <button
                    key={num}
                    onClick={() => isHost && setRoomSettings({ ...roomSettings, numQuestions: num })}
                    disabled={!isHost}
                    className={`py-2 px-1 rounded-lg font-medium text-sm transition-all ${
                      roomSettings.numQuestions === num
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Difficulty</label>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${diffConfig.bgColor} border border-slate-700`}>
                <DifficultyIcon className={`w-5 h-5 ${diffConfig.color}`} />
                <span className={`font-medium capitalize ${diffConfig.color}`}>{activeDifficulty}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {isHost ? (
            <button
              onClick={handleStartBattle}
              disabled={!canStart}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg shadow-orange-500/50"
            >
              <Play className="w-5 h-5" />
              <span>Start Battle</span>
              {!canStart && (
                <span className="text-sm opacity-75">(Need at least 2 players)</span>
              )}
            </button>
          ) : (
             <div className="flex-1 flex items-center justify-center px-6 py-4 bg-slate-800 border border-slate-700 text-slate-400 font-semibold rounded-lg">
                <Clock className="w-5 h-5 mr-3" /> Waiting for Host...
             </div>
          )}
          
          <button
            onClick={handleLeaveRoom}
            className="flex items-center justify-center space-x-2 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Leave Room</span>
          </button>
        </div>
      </div>
    </>
  );
}
