'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { Trophy, Users, Clock, Copy, Check, Play, Hash, Crown, Target, Zap, XCircle } from 'lucide-react';
import { contestAPI, submissionAPI } from '@/services/api';
import socketService from '@/services/socket';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function ContestPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [submitting, setSubmitting] = useState(false);
  const [scoreboard, setScoreboard] = useState([]);
  const [matchEnded, setMatchEnded] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    async function fetchContest() {
      try {
        const data = await contestAPI.get(params.contestId);
        setContest(data);
        if (data.problems && data.problems.length > 0) {
          setCode('');
        }
        if (data.scoreboard) {
          setScoreboard(data.scoreboard);
        }
      } catch (error) {
        console.error('Failed to fetch contest:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user && params.contestId) {
      fetchContest();
    }
  }, [authLoading, user, params.contestId, router]);

  useEffect(() => {
    socketService.connect();

    const handlePlayerJoined = (data) => {
      setContest((prev) => ({
        ...prev,
        players: [...(prev?.players || []), data.player],
      }));
    };

    const handleContestStarted = (data) => {
      setContest((prev) => ({ ...prev, status: 'active', startedAt: data.startedAt }));
    };

    const handleLeaderboardUpdate = (data) => {
      setScoreboard(data.scoreboard);
    };

    socketService.on('contest_player_joined', handlePlayerJoined);
    socketService.on('contest_started', handleContestStarted);
    socketService.on('leaderboard_update', handleLeaderboardUpdate);

    if (contest) {
      socketService.emit('join_contest', { contestId: params.contestId });
      if (contest.status === 'active') {
        socketService.simulateContest(params.contestId);
      }
    }

    return () => {
      socketService.off('contest_player_joined', handlePlayerJoined);
      socketService.off('contest_started', handleContestStarted);
      socketService.off('leaderboard_update', handleLeaderboardUpdate);
    };
  }, [contest, params.contestId]);

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(contest.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartContest = async () => {
    try {
      await contestAPI.start(params.contestId);
      socketService.emit('start_contest', { contestId: params.contestId });
    } catch (error) {
      console.error('Failed to start contest:', error);
    }
  };

  const handleVictoryPopup = (data) => {
    console.log('🎉 Victory!', data);
    setSubmitting(false);
    setMatchEnded(true);
    setWinner({ id: user.id, isVictory: true, ratingGain: data.ratingGain || 0 });
  };

  const handleDefeatPopup = (data) => {
    console.log('💀 Defeat:', data);
    setSubmitting(false);
    setMatchEnded(true);
    setWinner({ id: user.id, isVictory: false, ratingChange: data.ratingChange || 0 });
  };

  const handleContestEnded = (data) => {
    console.log('🏁 Contest ended:', data);
    setContest((prev) => ({ ...prev, status: 'completed' }));
  };

  const [lastResult, setLastResult] = useState(null);

  const handleSubmissionResult = (data) => {
    console.log('📝 Submission result:', data);
    setLastResult({
      verdict: data.verdict,
      testCasesPassed: data.testCasesPassed,
      totalTestCases: data.totalTestCases,
      executionTime: data.executionTime,
    });
    setSubmitting(false);
  };

  const handleRunResult = (data) => {
    console.log('🏃 Run result:', data);
    setLastResult({
      verdict: data.verdict,
      testCasesPassed: data.testCasesPassed,
      totalTestCases: data.totalTestCases,
      executionTime: data.executionTime,
      output: data.output,
    });
  };

  useEffect(() => {
    // Connect socket first
    socketService.connect();
    
    // Give socket time to connect, then set up listeners
    const timer = setTimeout(() => {
      socketService.on('victory_popup', handleVictoryPopup);
      socketService.on('defeat_popup', handleDefeatPopup);
      socketService.on('contest_ended', handleContestEnded);
      socketService.on('submission_result', handleSubmissionResult);
      socketService.on('run_result', handleRunResult);
    }, 100);

    return () => {
      clearTimeout(timer);
      socketService.off('victory_popup', handleVictoryPopup);
      socketService.off('defeat_popup', handleDefeatPopup);
      socketService.off('contest_ended', handleContestEnded);
      socketService.off('submission_result', handleSubmissionResult);
      socketService.off('run_result', handleRunResult);
    };
  }, []);

  const handleSubmit = async () => {
    if (!code.trim() || submitting) return;

    setSubmitting(true);

    try {
      socketService.emit('battle_royale_submit', {
        contestId: params.contestId,
        code,
        language,
      });
    } catch (error) {
      console.error('Submission failed:', error);
      setSubmitting(false);
    }
  };

  const handleRun = () => {
    if (!code.trim()) return;

    socketService.emit('battle_royale_run', {
      contestId: params.contestId,
      code,
      language,
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (!user || !contest) return null;

  if (contest.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl mb-4 shadow-2xl shadow-blue-500/50">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{contest.name}</h1>
            <p className="text-slate-400 text-lg">Contest Lobby</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 mb-8">
            <div className="text-center mb-8">
              <p className="text-slate-400 mb-3">Share this room code with players:</p>
              <div className="inline-flex items-center space-x-3 bg-slate-900 px-8 py-4 rounded-xl border border-slate-700">
                <Hash className="w-6 h-6 text-blue-500" />
                <span className="text-4xl font-bold text-white tracking-widest">{contest.roomCode}</span>
                <button
                  onClick={handleCopyRoomCode}
                  className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Copy className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 text-center">
                <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm mb-1">Players</p>
                <p className="text-2xl font-bold text-white">
                  {contest.players.length}/{contest.maxPlayers}
                </p>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 text-center">
                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm mb-1">Duration</p>
                <p className="text-2xl font-bold text-white">{contest.duration} min</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 text-center">
                <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm mb-1">Difficulty</p>
                <p className="text-2xl font-bold text-white capitalize">{contest.difficulty}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Players in Lobby</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {contest.players.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center space-x-3 bg-slate-900 rounded-lg p-3 border border-slate-700"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                      {player.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{player.username}</p>
                      <p className="text-slate-400 text-sm">{player.rating}</p>
                    </div>
                    {player.id === user.id && (
                      <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {contest.createdBy === user.username && (
            <button
              onClick={handleStartContest}
              disabled={contest.players.length < 2}
              className="w-full py-4 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Start Contest</span>
            </button>
          )}

          {contest.createdBy !== user.username && (
            <div className="text-center p-4 bg-slate-900 rounded-lg border border-slate-700">
              <p className="text-slate-400">Waiting for host to start the contest...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      {matchEnded && winner && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 max-w-md text-center">
            {winner.isVictory ? (
              <>
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-white mb-4">Victory!</h2>
                <p className="text-green-400 text-2xl font-bold mb-8">+{winner.ratingGain} Rating</p>
              </>
            ) : (
              <>
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-white mb-4">Defeat</h2>
                <p className="text-slate-400 mb-8">Better luck next time!</p>
              </>
            )}
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 h-[calc(100vh-64px)]">
        <div className="col-span-3 bg-slate-800 border-r border-slate-700 overflow-auto">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Leaderboard</h2>
            <div className="space-y-2">
              {scoreboard.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50'
                      : 'bg-slate-900 border border-slate-700'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                        : 'bg-slate-700'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{player.username}</p>
                    <p className="text-slate-400 text-sm">{player.solved} solved</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{player.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-9 flex flex-col">
          <div className="border-b border-slate-700 bg-slate-800 p-4">
            <div className="flex items-center space-x-2">
              {contest.problems.map((problem, index) => (
                <button
                  key={problem.id}
                  onClick={() => {
                    setSelectedProblem(index);
                    setCode('');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedProblem === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {index + 1}. {problem.title}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 flex-1 overflow-hidden">
            <div className="border-r border-slate-700 bg-slate-800 p-6 overflow-auto">
              <h3 className="text-2xl font-bold text-white mb-4">
                {contest.problems[selectedProblem].title}
              </h3>
              <p className="text-slate-300 leading-relaxed mb-6">
                {contest.problems[selectedProblem].description}
              </p>

              {/* Input Format */}
              {contest.problems[selectedProblem]?.inputFormat && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Input Format</h4>
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-300 whitespace-pre-wrap text-sm">{contest.problems[selectedProblem].inputFormat}</p>
                  </div>
                </div>
              )}

              {/* Output Format */}
              {contest.problems[selectedProblem]?.outputFormat && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Output Format</h4>
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-300 whitespace-pre-wrap text-sm">{contest.problems[selectedProblem].outputFormat}</p>
                  </div>
                </div>
              )}

              {/* Constraints */}
              {contest.problems[selectedProblem]?.constraints && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Constraints</h4>
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <ul className="text-slate-300 text-sm space-y-1">
                      {contest.problems[selectedProblem].constraints.split('\n').map((constraint, idx) => (
                        constraint.trim() && (
                          <li key={idx} className="flex items-start">
                            <span className="text-orange-500 mr-2">•</span>
                            <span>{constraint.replace(/^-\s*/, '')}</span>
                          </li>
                        )
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Sample Test Cases */}
              {contest.problems[selectedProblem]?.sampleTestCases && contest.problems[selectedProblem].sampleTestCases.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Sample Test Cases</h4>
                  <div className="space-y-4">
                    {contest.problems[selectedProblem].sampleTestCases.map((testCase, index) => (
                      <div key={index} className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
                          <span className="text-orange-400 font-medium text-sm">Sample {index + 1}</span>
                        </div>
                        <div className="p-4">
                          <div className="mb-3">
                            <span className="text-slate-400 text-xs uppercase tracking-wide">Input:</span>
                            <pre className="mt-1 text-green-400 font-mono text-sm bg-slate-950 p-3 rounded border border-slate-800 whitespace-pre-wrap">
                              {testCase.input}
                            </pre>
                          </div>
                          <div className="mb-3">
                            <span className="text-slate-400 text-xs uppercase tracking-wide">Output:</span>
                            <pre className="mt-1 text-blue-400 font-mono text-sm bg-slate-950 p-3 rounded border border-slate-800 whitespace-pre-wrap">
                              {testCase.output}
                            </pre>
                          </div>
                          {testCase.explanation && (
                            <div>
                              <span className="text-slate-400 text-xs uppercase tracking-wide">Explanation:</span>
                              <p className="mt-1 text-slate-400 text-sm italic">{testCase.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex-1">
                <MonacoEditor
                  height="100%"
                  defaultLanguage="javascript"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </div>

              <div className="border-t border-slate-700 bg-slate-800 p-4">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/50"
                >
                  {submitting ? (
                    <>
                      <Zap className="w-5 h-5 animate-pulse" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Submit Solution</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
