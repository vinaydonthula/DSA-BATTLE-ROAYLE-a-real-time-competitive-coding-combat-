'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import QuickMatchModal from '@/components/QuickMatchModal';
import PrivateRoomModal from '@/components/PrivateRoomModal';
import { Swords, Users, Zap, Brain, Shield, ChevronRight, Info } from 'lucide-react';

const EXACT_COUNT_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9];
const FLEXIBLE_POOL_OPTIONS = [10, 20, 30, 50, 100];

const DIFFICULTIES = [
  {
    value: 'easy',
    label: 'Easy',
    icon: Zap,
    description: 'Perfect for warming up',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500',
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: Brain,
    description: 'Challenge your skills',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500',
  },
  {
    value: 'hard',
    label: 'Hard',
    icon: Swords,
    description: 'For true warriors',
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500',
  },
];

const MATCH_TYPES = [
  {
    id: 'quick',
    label: '⚡ Quick Match',
    description: 'Automatically finds players using your selected settings. Best for instant play.',
    icon: Zap,
  },
  {
    id: 'private',
    label: '🛡️ Private Room',
    description: 'Create a room and invite players manually. You become the host.',
    icon: Shield,
  },
];

export default function BattleArenaPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [playerCountType, setPlayerCountType] = useState('exact');
  const [playerCount, setPlayerCount] = useState(2);
  const [difficulty, setDifficulty] = useState(null);
  const [matchType, setMatchType] = useState(null);
  const [showQuickMatch, setShowQuickMatch] = useState(false);
  const [showPrivateRoom, setShowPrivateRoom] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (matchType === 'quick') {
      setShowQuickMatch(true);
    } else if (matchType === 'private') {
      setShowPrivateRoom(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepComplete = () => {
    switch (step) {
      case 1:
        return playerCount !== null;
      case 2:
        return difficulty !== null;
      case 3:
        return matchType !== null;
      default:
        return false;
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-6 shadow-2xl shadow-orange-500/50">
            <Swords className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Battle Arena</h1>
          <p className="text-slate-400 text-lg">Configure your battle settings</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  s < step
                    ? 'bg-green-500 text-white'
                    : s === step
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-20 h-1 mx-2 transition-all ${
                    s < step ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* STEP 1: Player Count */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Step 1: Number of Players</h2>
                <div className="group relative">
                  <Info className="w-5 h-5 text-slate-400 cursor-help" />
                  <div className="absolute right-0 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Exact count ensures fixed matches. "≤" allows faster matchmaking with up to that many players.
                  </div>
                </div>
              </div>

              {/* Toggle: Exact vs Flexible */}
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => {
                    setPlayerCountType('exact');
                    setPlayerCount(2);
                  }}
                  className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                    playerCountType === 'exact'
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Exact Count
                </button>
                <button
                  onClick={() => {
                    setPlayerCountType('flexible');
                    setPlayerCount(10);
                  }}
                  className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                    playerCountType === 'flexible'
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Flexible Pool
                </button>
              </div>

              {/* Options */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {playerCountType === 'exact' ? (
                  EXACT_COUNT_OPTIONS.map((count) => (
                    <button
                      key={count}
                      onClick={() => setPlayerCount(count)}
                      className={`py-4 px-2 rounded-lg border-2 font-bold transition-all ${
                        playerCount === count
                          ? 'border-orange-500 bg-orange-500/20 text-white'
                          : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      {count}
                    </button>
                  ))
                ) : (
                  FLEXIBLE_POOL_OPTIONS.map((count) => (
                    <button
                      key={count}
                      onClick={() => setPlayerCount(count)}
                      className={`py-4 px-2 rounded-lg border-2 font-bold transition-all ${
                        playerCount === count
                          ? 'border-orange-500 bg-orange-500/20 text-white'
                          : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      ≤{count}
                    </button>
                  ))
                )}
              </div>

              <p className="text-center text-slate-400">
                Selected: <span className="text-orange-400 font-bold">{playerCountType === 'flexible' ? '≤' : ''}{playerCount} players</span>
              </p>
            </div>
          )}

          {/* STEP 2: Difficulty */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Step 2: Game Mode (Difficulty)</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DIFFICULTIES.map((diff) => {
                  const Icon = diff.icon;
                  return (
                    <button
                      key={diff.value}
                      onClick={() => setDifficulty(diff.value)}
                      className={`${diff.bgColor} border-2 ${diff.borderColor} rounded-2xl p-6 hover:scale-105 transition-all duration-300 group ${
                        difficulty === diff.value ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-slate-800' : ''
                      }`}
                    >
                      <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${diff.color} mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{diff.label}</h3>
                      <p className="text-slate-400 text-sm">{diff.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Match Type */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Step 3: Match Type</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MATCH_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setMatchType(type.id)}
                      className={`bg-slate-900 border-2 rounded-2xl p-6 text-left hover:scale-105 transition-all duration-300 ${
                        matchType === type.id
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2">{type.label}</h3>
                          <p className="text-slate-400 text-sm">{type.description}</p>
                        </div>
                        {matchType === type.id && (
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
                <h4 className="text-sm font-medium text-slate-400 mb-3">Battle Configuration</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{playerCountType === 'flexible' ? '≤' : ''}{playerCount}</p>
                    <p className="text-xs text-slate-400">Players</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-400 capitalize">{difficulty}</p>
                    <p className="text-xs text-slate-400">Difficulty</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{matchType === 'quick' ? '⚡' : '🛡️'}</p>
                    <p className="text-xs text-slate-400">{matchType === 'quick' ? 'Quick Match' : 'Private Room'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!isStepComplete()}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg shadow-orange-500/50"
            >
              <span>{step === 3 ? 'Start Battle' : 'Next'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Match Modal */}
      {showQuickMatch && (
        <QuickMatchModal
          playerCount={playerCount}
          playerCountType={playerCountType}
          difficulty={difficulty}
          onClose={() => setShowQuickMatch(false)}
        />
      )}

      {/* Private Room Modal */}
      {showPrivateRoom && (
        <PrivateRoomModal
          playerCount={playerCount}
          playerCountType={playerCountType}
          difficulty={difficulty}
          onClose={() => setShowPrivateRoom(false)}
        />
      )}
    </div>
  );
}
