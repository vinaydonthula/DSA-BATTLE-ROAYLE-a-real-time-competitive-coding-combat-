'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { BarChart3, TrendingUp, Target, Flame, Calendar, Award, CheckCircle, XCircle } from 'lucide-react';
import { analyticsAPI } from '@/services/api';

export default function AnalyticsPage() {
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
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!user || !stats) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-2">
            <BarChart3 className="w-8 h-8 text-orange-500" />
            <h1 className="text-4xl font-bold text-white">Performance Analytics</h1>
          </div>
          <p className="text-slate-400 text-lg">Deep dive into your coding battle stats</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.wins}</span>
            </div>
            <p className="text-slate-400 text-sm mb-1">Total Victories</p>
            <div className="w-full bg-slate-900 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                style={{ width: `${(stats.wins / stats.totalMatches) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.losses}</span>
            </div>
            <p className="text-slate-400 text-sm mb-1">Total Defeats</p>
            <div className="w-full bg-slate-900 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full"
                style={{ width: `${(stats.losses / stats.totalMatches) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Target className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.winRate.toFixed(1)}%</span>
            </div>
            <p className="text-slate-400 text-sm mb-1">Win Rate</p>
            <div className="w-full bg-slate-900 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                style={{ width: `${stats.winRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">Rating History</h2>
            </div>

            <div className="relative h-64">
              <div className="absolute inset-0 flex items-end justify-between space-x-2">
                {stats.ratingHistory.map((entry, index) => {
                  const maxRating = Math.max(...stats.ratingHistory.map(e => e.rating));
                  const height = (entry.rating / maxRating) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center justify-end h-full">
                        <span className="text-xs text-white font-semibold mb-2">{entry.rating}</span>
                        <div
                          className="w-full bg-gradient-to-t from-orange-500 to-red-500 rounded-t-lg transition-all hover:opacity-80"
                          style={{ height: `${height}%`, minHeight: '20px' }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Flame className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">Problems Solved by Difficulty</h2>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-white font-medium">Easy</span>
                  </div>
                  <span className="text-white font-bold">{stats.problemsSolved.easy}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${(stats.problemsSolved.easy / 50) * 100}%` }}
                  >
                    <span className="text-xs text-white font-bold">{((stats.problemsSolved.easy / 50) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-white font-medium">Medium</span>
                  </div>
                  <span className="text-white font-bold">{stats.problemsSolved.medium}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-4 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${(stats.problemsSolved.medium / 50) * 100}%` }}
                  >
                    <span className="text-xs text-white font-bold">{((stats.problemsSolved.medium / 50) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-white font-medium">Hard</span>
                  </div>
                  <span className="text-white font-bold">{stats.problemsSolved.hard}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-red-500 to-pink-500 h-4 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${(stats.problemsSolved.hard / 50) * 100}%` }}
                  >
                    <span className="text-xs text-white font-bold">{((stats.problemsSolved.hard / 50) * 100).toFixed(0)}%</span>
                  </div>
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
            <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              +{stats.rating - 1500}
            </h3>
            <p className="text-slate-300">Rating Gained</p>
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
