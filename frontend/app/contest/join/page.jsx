'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { Trophy, Hash, Loader2, AlertCircle } from 'lucide-react';
import { contestAPI } from '@/services/api';

export default function JoinContestPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (roomCode.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }

    setJoining(true);

    try {
      const contest = await contestAPI.join(roomCode.toUpperCase());
      router.push(`/contest/${contest.contestId}`);
    } catch (error) {
      setError('Invalid room code. Please try again.');
      console.error('Failed to join contest:', error);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl mb-4 shadow-2xl shadow-blue-500/50">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Join Contest</h1>
          <p className="text-slate-400 text-lg">Enter a room code to join an existing contest</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Room Code
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full pl-14 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-lg text-white text-2xl font-bold tracking-widest text-center placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
                  placeholder="ABC123"
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-slate-400 text-sm mt-2 text-center">
                Enter the 6-character room code shared by the host
              </p>
            </div>

            <button
              type="submit"
              disabled={joining || roomCode.length !== 6}
              className="w-full py-4 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {joining ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Joining Contest...</span>
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5" />
                  <span>Join Contest</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 mb-4">Want to create your own contest?</p>
          <button
            onClick={() => router.push('/contest/create')}
            className="text-blue-500 hover:text-blue-400 font-semibold"
          >
            Create New Contest →
          </button>
        </div>

        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">How to Join</h3>
          <div className="space-y-3 text-slate-300">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <p>Get the room code from the contest host</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <p>Enter the 6-character code above</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <p>Wait in the lobby for the contest to start</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                4
              </div>
              <p>Compete against all players and climb the leaderboard!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
