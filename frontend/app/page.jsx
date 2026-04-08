'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Swords, Trophy, Users, Zap, Code, Crown, ArrowRight, Shield } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg">
                <Swords className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                DSA Battle Royale
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-orange-500/50"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2 mb-8">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="text-orange-400 text-sm font-medium">Real-Time Competitive Coding Combat</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Battle Your Way to
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Coding Mastery
            </span>
          </h1>

          <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Challenge opponents in intense 1v1 duels or compete in massive battle royale contests.
            Solve DSA problems faster, deal damage, and climb the global leaderboard.
          </p>

          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/register"
              className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg font-bold rounded-xl shadow-2xl shadow-orange-500/50 transition-all hover:scale-105"
            >
              <span>Start Fighting</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center space-x-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white text-lg font-bold rounded-xl border border-slate-700 transition-all"
            >
              <Trophy className="w-5 h-5" />
              <span>View Leaderboard</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 hover:border-orange-500/50 transition-all group">
            <div className="inline-flex p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl mb-6 group-hover:scale-110 transition-transform">
              <Swords className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">1v1 Duels</h3>
            <p className="text-slate-400 leading-relaxed">
              Face off against a single opponent in intense coding battles. Wrong answers cost HP. First to solve wins!
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all group">
            <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Battle Royale</h3>
            <p className="text-slate-400 leading-relaxed">
              Compete against dozens of players simultaneously. Solve multiple problems and dominate the scoreboard.
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all group">
            <div className="inline-flex p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl mb-6 group-hover:scale-110 transition-transform">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Global Rankings</h3>
            <p className="text-slate-400 leading-relaxed">
              Climb the leaderboard with every victory. Track your progress and compete for the top spot.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-500/30 rounded-3xl p-12 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400 text-lg">Master the art of competitive coding in 4 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl text-white text-2xl font-bold mb-4">
                1
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Choose Mode</h4>
              <p className="text-slate-400">Pick 1v1 duel or battle royale contest</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl text-white text-2xl font-bold mb-4">
                2
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Get Matched</h4>
              <p className="text-slate-400">Find opponents at your skill level</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl text-white text-2xl font-bold mb-4">
                3
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Code Fast</h4>
              <p className="text-slate-400">Solve DSA problems under pressure</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl text-white text-2xl font-bold mb-4">
                4
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Claim Victory</h4>
              <p className="text-slate-400">Win matches and gain rating points</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <Code className="w-12 h-12 text-orange-500 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">Live Code Editor</h3>
            <p className="text-slate-400 leading-relaxed mb-4">
              Write and test your code in a professional Monaco editor with syntax highlighting and autocomplete.
            </p>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span>Real-time code execution</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span>Multiple test cases validation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span>Performance metrics tracking</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <Shield className="w-12 h-12 text-blue-500 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">Fair Matchmaking</h3>
            <p className="text-slate-400 leading-relaxed mb-4">
              Our intelligent system matches you with opponents of similar skill level for balanced competition.
            </p>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>ELO-based rating system</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Difficulty-based problem pools</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Anti-cheat protection</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-12 shadow-2xl shadow-orange-500/50">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Dominate?</h2>
          <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of developers competing daily. Sharpen your skills, climb the ranks, and become a coding legend.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center space-x-2 px-10 py-4 bg-white hover:bg-slate-100 text-orange-600 text-lg font-bold rounded-xl shadow-xl transition-all hover:scale-105"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <footer className="border-t border-slate-700 bg-slate-900/50 backdrop-blur-xl mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg">
                <Swords className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">DSA Battle Royale</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2024 DSA Battle Royale. Built with Next.js & Mock APIs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
