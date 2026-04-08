'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { Swords, Loader2, X, Users, Zap, Brain } from 'lucide-react';
import { matchAPI } from '@/services/api';
import socketService from '@/services/socket';

export default function DuelFindPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [searching, setSearching] = useState(false);
  const [playersInQueue, setPlayersInQueue] = useState(0);
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    let interval;
    if (searching) {
      interval = setInterval(() => {
        setSearchTime((prev) => prev + 1);
        setPlayersInQueue(Math.floor(Math.random() * 10) + 1);
      }, 1000);
    } else {
      setSearchTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [searching]);

  useEffect(() => {
    socketService.connect();

    const handleMatchFound = (data) => {
      console.log('Match found:', data);
      router.push(`/duel/${data.matchId}`);
    };

    socketService.on('match_found', handleMatchFound);

    return () => {
      socketService.off('match_found', handleMatchFound);
    };
  }, [router]);

  const handleFindMatch = (difficulty) => {
    setSelectedDifficulty(difficulty);
    setSearching(true);

    socketService.emit('join_queue', { difficulty });
  };


  const handleCancelSearch = () => {
    socketService.emit('leave_queue');

    setSearching(false);
    setSelectedDifficulty(null);
    setSearchTime(0);
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

  const difficulties = [
    {
      value: 'easy',
      label: 'Easy',
      icon: Zap,
      description: 'Perfect for warming up',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500',
      hoverBorder: 'hover:border-green-400',
    },
    {
      value: 'medium',
      label: 'Medium',
      icon: Brain,
      description: 'Challenge your skills',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500',
      hoverBorder: 'hover:border-yellow-400',
    },
    {
      value: 'hard',
      label: 'Hard',
      icon: Swords,
      description: 'For true warriors',
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500',
      hoverBorder: 'hover:border-red-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!searching ? (
          <div>
            <div className="flex justify-center mb-6 py-6">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                  <Swords className="w-6 h-6 text-white" />
                </div>

                {/* Text */}
                <div className="flex flex-col items-center">
                  <h1 className="text-3xl font-bold text-white leading-tight">
                    Find a Duel
                  </h1>
                  <p className="text-sm text-slate-400 text-center">
                    Choose your difficulty
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {difficulties.map((diff) => {
                const Icon = diff.icon;
                return (
                  <button
                    key={diff.value}
                    onClick={() => handleFindMatch(diff.value)}
                    className={`${diff.bgColor} border-2 ${diff.borderColor} ${diff.hoverBorder} rounded-2xl p-8 hover:scale-105 transition-all duration-300 group`}
                  >
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${diff.color} mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{diff.label}</h3>
                    <p className="text-slate-400">{diff.description}</p>
                  </button>
                );
              })}
            </div>

          
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg mx-auto">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/50">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">Searching for Opponent</h2>
              <p className="text-slate-400 text-xs mb-6">
                Finding a worthy challenger at <span className="text-orange-500 font-semibold">{selectedDifficulty}</span> difficulty
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <Users className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm mb-1">In Queue</p>
                  <p className="text-2xl font-bold text-white">{playersInQueue}</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <Loader2 className="w-6 h-6 text-orange-500 mx-auto mb-2 animate-spin" />
                  <p className="text-slate-400 text-sm mb-1">Searching</p>
                  <p className="text-2xl font-bold text-white">{searchTime}s</p>
                </div>
              </div>

              <button
                onClick={handleCancelSearch}
                className="flex items-center space-x-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all mx-auto"
              >
                <X className="w-5 h-5" />
                <span>Cancel Search</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
