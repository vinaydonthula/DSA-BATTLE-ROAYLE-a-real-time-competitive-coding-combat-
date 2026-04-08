'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import socketService from '@/services/socket';
import { Loader2, Clock, X, RefreshCw, Bug } from 'lucide-react';

export default function QuickMatchModal({ playerCount, playerCountType, difficulty, onClose }) {
  const router = useRouter();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [queueStatus, setQueueStatus] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    socketService.connect();

    // Join matchmaking queue - only send difficulty
    socketService.emit('join_queue', {
      difficulty,
    });

    // Listen for match found (primary)
    const handleMatchFound = (data) => {
      console.log('✅ Match found!', data);
      // Redirect immediately - no state update needed
      router.push(`/battle/${data.matchId}`);
    };

    // Listen for match created (backup broadcast)
    const handleMatchCreated = (data) => {
      console.log('✅ Match created (broadcast):', data);
      // Only redirect if I'm one of the players
      // Note: In real app, you'd check user ID here
      router.push(`/battle/${data.matchId}`);
    };

    // Listen for debug results
    const handleDebugResult = (data) => {
      console.log('🔍 Debug result:', data);
      setQueueStatus(data);
    };

    socketService.on('match_found', handleMatchFound);
    socketService.on('match_created', handleMatchCreated);
    socketService.on('debug_queue_result', handleDebugResult);

    // Check queue status periodically
    const checkInterval = setInterval(() => {
      socketService.emit('debug_queue_status', { difficulty });
    }, 2000);

    return () => {
      socketService.off('match_found', handleMatchFound);
      socketService.off('match_created', handleMatchCreated);
      socketService.off('debug_queue_result', handleDebugResult);
      clearInterval(checkInterval);
      socketService.emit('leave_queue');
    };
  }, [difficulty, router]);

  // Timer effect - just tracks time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCancel = () => {
    socketService.emit('leave_queue');
    onClose();
  };

  const handleForceCheck = () => {
    console.log('🔧 Force matchmaking check');
    socketService.emit('debug_force_matchmaking', { difficulty });
  };

  const handleCheckQueue = () => {
    socketService.emit('debug_queue_status', { difficulty });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-full animate-ping opacity-20"></div>
          <div className="relative w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/50">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">Finding Opponent</h2>
        <p className="text-slate-400 text-center text-sm mb-6">
          Searching for a worthy challenger at <span className="text-orange-400 font-semibold capitalize">{difficulty}</span> difficulty
        </p>

        {/* Stats */}
        <div className="bg-slate-900 rounded-lg p-4 text-center border border-slate-700 mb-6">
          <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-slate-400 text-xs mb-1">Time Searching</p>
          <p className="text-xl font-bold text-white">{formatTime(elapsedTime)}</p>
        </div>

        {/* Queue Status */}
        {queueStatus && (
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 mb-4">
            <p className="text-slate-400 text-xs mb-2">Queue Status:</p>
            <p className="text-white text-sm">
              Players in queue: <span className="text-orange-400 font-bold">{queueStatus.queue?.length || 0}</span>
            </p>
            {queueStatus.queue?.length > 0 && (
              <div className="mt-2 space-y-1">
                {queueStatus.queue.map((player, idx) => (
                  <p key={idx} className="text-xs text-slate-400">
                    User {player.user_id} (joined: {new Date(player.joined_at).toLocaleTimeString()})
                  </p>
                ))}
              </div>
            )}
            <p className="text-slate-500 text-xs mt-2">
              Active monitors: {queueStatus.activeMonitors?.join(', ') || 'None'}
            </p>
          </div>
        )}

        <p className="text-slate-500 text-center text-sm mb-6">
          Match will start automatically when an opponent joins
        </p>

        <button
          onClick={handleCancel}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all mb-3"
        >
          <X className="w-5 h-5" />
          <span>Cancel Search</span>
        </button>

        {/* Debug Section */}
        <div className="border-t border-slate-700 pt-4">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center justify-center space-x-1 text-xs text-slate-500 hover:text-slate-400 mx-auto"
          >
            <Bug className="w-3 h-3" />
            <span>{showDebug ? 'Hide Debug' : 'Show Debug'}</span>
          </button>

          {showDebug && (
            <div className="mt-3 space-y-2">
              <button
                onClick={handleCheckQueue}
                className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Check Queue Status</span>
              </button>
              <button
                onClick={handleForceCheck}
                className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-orange-900/30 hover:bg-orange-900/50 text-orange-400 text-xs rounded transition-all"
              >
                <Bug className="w-3 h-3" />
                <span>Force Matchmaking</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
