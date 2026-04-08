'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { Swords, Trophy, Target, TrendingUp, TrendingDown, Flame, Star, Crown, Calendar, Award } from 'lucide-react';
import { analyticsAPI } from '@/services/api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await analyticsAPI.getUserStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoadingStats(false);
      }
    }

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your battle stats...</p>
        </div>
      </div>
    );
  }

  if (!user || !stats) return null;

  const statCards = [
    {
      title: 'Total Battles',
      value: stats.totalMatches,
      icon: Swords,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/50',
    },
    {
      title: 'Victories',
      value: stats.wins,
      icon: Trophy,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/50',
    },
    {
      title: 'Win Rate',
      value: `${stats.winRate}%`,
      icon: Target,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/50',
    },
    {
      title: 'Current Rating',
      value: stats.rating,
      icon: Star,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Crown className="w-8 h-8 text-orange-500" />
            <h1 className="text-4xl font-bold text-white">Welcome back, {user.username}!</h1>
          </div>
          <p className="text-slate-400 text-lg">Ready to dominate the battlefield?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className={`${card.bgColor} border ${card.borderColor} rounded-xl p-6 hover:scale-105 transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-white">{card.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">Rating Progress</h2>
            </div>

            <div className="space-y-4">
              {stats.ratingHistory.map((entry, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{new Date(entry.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-bold">{entry.rating}</span>
                    {index > 0 && (
                      <span
                        className={`text-sm ${
                          entry.rating > stats.ratingHistory[index - 1].rating
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}
                      >
                        {entry.rating > stats.ratingHistory[index - 1].rating ? '↑' : '↓'}
                        {Math.abs(entry.rating - stats.ratingHistory[index - 1].rating)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Flame className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">Problems Solved</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400 font-medium">Easy</span>
                  <span className="text-white font-bold">{stats.problemsSolved.easy}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${(stats.problemsSolved.easy / 50) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-yellow-400 font-medium">Medium</span>
                  <span className="text-white font-bold">{stats.problemsSolved.medium}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all"
                    style={{ width: `${(stats.problemsSolved.medium / 50) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-400 font-medium">Hard</span>
                  <span className="text-white font-bold">{stats.problemsSolved.hard}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full transition-all"
                    style={{ width: `${(stats.problemsSolved.hard / 50) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Calendar className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-white">Recent Match History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-400 font-medium py-3 px-4">Date</th>
                  <th className="text-left text-slate-400 font-medium py-3 px-4">Opponent</th>
                  <th className="text-left text-slate-400 font-medium py-3 px-4">Result</th>
                  <th className="text-right text-slate-400 font-medium py-3 px-4">Rating Change</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentMatches.map((match, index) => (
                  <tr key={index} className="border-b border-slate-700 hover:bg-slate-900 transition-colors">
                    <td className="py-4 px-4 text-slate-300">
                      {new Date(match.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-white font-medium">{match.opponent}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          match.result === 'win'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {match.result === 'win' ? 'Victory' : 'Defeat'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-bold ${
                          match.rating.startsWith('+') ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {match.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/50 rounded-xl p-6 text-center">
            <Award className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {stats.problemsSolved.easy + stats.problemsSolved.medium + stats.problemsSolved.hard}
            </h3>
            <p className="text-slate-300">Total Problems Solved</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl p-6 text-center">
            {stats.rating >= 1200 ? (
              <div>
                <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  +{stats.rating - 1200}
                </h3>
                <p className="text-slate-300">Rating Gained</p>
              </div>
            ) : (
              <div>
                <TrendingDown className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  {stats.rating - 1200}
                </h3>
                <p className="text-slate-300">Rating Loss</p>
              </div>
            )}
            
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-xl p-6 text-center">
            <Target className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {Math.floor((stats.wins / stats.totalMatches) * 100)}%
            </h3>
            <p className="text-slate-300">Success Rate</p>
          </div>
        </div>

      </div>
    </div>
  );
}
