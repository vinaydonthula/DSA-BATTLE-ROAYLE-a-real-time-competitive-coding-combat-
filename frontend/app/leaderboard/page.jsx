'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { Trophy, Crown, Medal, Award } from 'lucide-react';
import { leaderboardAPI } from '@/services/api';

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [loadingRankings, setLoadingRankings] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function fetchRankings() {
      try {
        const data = await leaderboardAPI.getGlobal();
        setRankings(data);
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
      } finally {
        setLoadingRankings(false);
      }
    }

    if (user) fetchRankings();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return <span className="text-slate-400 font-bold">#{rank}</span>;
  };

  const getRankBg = (rank) => {
    if (rank === 1)
      return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50';
    if (rank === 2)
      return 'bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-slate-400/50';
    if (rank === 3)
      return 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600/50';
    return 'bg-slate-800 border-slate-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>

            {/* Text */}
            <div className="flex flex-col items-center">
              <h1 className="text-3xl font-bold text-white leading-tight">
                Leaderboard
              </h1>
              <p className="text-sm text-slate-400 text-center">
                Players ranked by competitive rating
              </p>
            </div>
          </div>
        </div>



        {/* Leaderboard */}
        {loadingRankings ? (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {rankings.map((player, index) => {
              const rank = index + 1;
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-5 rounded-xl border transition-all hover:scale-[1.02]
                    ${player.id === user.id ? 'ring-2 ring-orange-500' : ''}
                    ${getRankBg(rank)}`}
                >
                  {/* Rank */}
                  <div className="w-12 flex justify-center">
                    {getRankIcon(rank)}
                  </div>

                  {/* Avatar */}
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {player.username[0].toUpperCase()}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">
                        {player.username}
                      </h3>
                      {player.id === user.id && (
                        <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">
                      {player.wins}W • {player.losses}L • {player.totalMatches} matches
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {player.rating}
                    </p>
                    <p className="text-xs text-slate-400">Rating</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
