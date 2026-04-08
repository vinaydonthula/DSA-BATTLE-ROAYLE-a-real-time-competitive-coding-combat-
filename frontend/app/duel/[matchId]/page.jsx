'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';
import { Heart, Clock, Trophy, Zap, Play, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { matchAPI, submissionAPI } from '@/services/api';
import socketService from '@/services/socket';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function DuelPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [playerHP, setPlayerHP] = useState(100);
  const [opponentHP, setOpponentHP] = useState(100);
  const [timeLeft, setTimeLeft] = useState(900);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [matchEnded, setMatchEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    async function fetchMatch() {
      try {
        const data = await matchAPI.getMatch(params.matchId);

        // Check if match is already completed
        if (data.status === 'completed') {
          setMatchEnded(true);
          setWinner({ id: data.winnerId });
          setMatch(data);
          setLoading(false);
          return;
        }

        // Enforce minimum match duration of 60 seconds as safety
        const MIN_MATCH_DURATION = 60;
        const initialTimeLeft = Math.max(data.timeLimit || 900, MIN_MATCH_DURATION);
        setTimeLeft(initialTimeLeft);
        setMatch(data);
        setCode('');

        // Set HP from match data or default to 100
        if (data.players && data.players.length >= 2) {
          const isPlayer1 = data.players[0].id === user.id;
          setPlayerHP(data.players[0]?.hp || 100);
          setOpponentHP(data.players[1]?.hp || 100);
        }

      } catch (error) {
        console.error('Failed to fetch match:', error);
      } finally {
        setLoading(false);
      }
    }


    if (user && params.matchId) {
      fetchMatch();
    }
  }, [authLoading, user, params.matchId, router]);



  useEffect(() => {
    socketService.connect();

    socketService.emit('join_match', { matchId: params.matchId });

    const handleHPUpdate = (data) => {
      setPlayerHP(data.selfHP);
      setOpponentHP(data.opponentHP);
    };

    const handleMatchEnd = (data) => {
      setMatchEnded(true);
      setWinner(data.winner);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    const handleVictoryPopup = (data) => {
      console.log('🎉 Victory!', data);
      setSubmitting(false);
      setMatchEnded(true);
      setWinner({ id: user.id, ratingChange: data.ratingGain || 0 });
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    const handleDefeatPopup = (data) => {
      console.log('💀 Defeat:', data);
      setSubmitting(false);
      setMatchEnded(true);
      // Don't set winner to user.id when defeated - this is handled by match_end event
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    socketService.on('hp_update', handleHPUpdate);
    socketService.on('match_end', handleMatchEnd);
    socketService.on('victory_popup', handleVictoryPopup);
    socketService.on('defeat_popup', handleDefeatPopup);
    socketService.on("submission_result", (data) => {
      setLastSubmission({
        verdict: data.verdict, // "AC" | "WA" | "RTE"
        testCasesPassed: data.testCasesPassed,
        totalTestCases: data.totalTestCases,
        executionTime: data.executionTime,
        memory: data.memory ?? 0,
        error: data.errorMessage || null,
      });
    });


    return () => {
      socketService.off('hp_update', handleHPUpdate);
      socketService.off('match_end', handleMatchEnd);
      socketService.off('victory_popup', handleVictoryPopup);
      socketService.off('defeat_popup', handleDefeatPopup);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [user, match, params.matchId]);

  useEffect(() => {
    // Only start timer if match exists, hasn't ended, and timeLeft is positive
    if (match && !matchEnded && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setMatchEnded(true);
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [match, matchEnded, timeLeft]);


  const handleSubmit = async () => {
    if (!code.trim() || submitting || matchEnded) return;

    console.log("📤 SUBMIT CLICKED", {
      matchId: params.matchId,
      userId: user.id,
    });

    setSubmitting(true);

    socketService.emit("submit_code", {
      matchId: params.matchId,
      code,
      language: "javascript",
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading battle arena...</p>
        </div>
      </div>
    );
  }

  if (!user || !match) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      {matchEnded && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 max-w-md text-center">
            {winner?.id === user.id ? (
              <>
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-white mb-4">Victory!</h2>
                <p className="text-slate-400 mb-2">You defeated {match.players[1].username}</p>
                <p className="text-green-400 text-2xl font-bold mb-8">+{winner.ratingChange || '+25'}</p>
              </>
            ) : (
              <>
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-white mb-4">Defeat</h2>
                <p className="text-slate-400 mb-8">Better luck next time!</p>
              </>
            )}
            <button
              onClick={() => {
                router.push('/dashboard');
                
              }}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-slate-700 bg-slate-800 shadow-xl">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="text-white font-bold">{user.username}</span>
                  <span className="text-slate-400 text-sm">({match.players[0].rating})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <div className="flex-1 bg-slate-900 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-500 to-pink-500 h-full transition-all duration-500"
                      style={{ width: `${playerHP}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-bold text-sm w-12">{playerHP} HP</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-slate-900 px-6 py-2 rounded-lg border border-slate-700">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-2xl font-bold text-white">{formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4">
              <div className="flex-1 text-right">
                <div className="flex items-center justify-end space-x-2 mb-2">
                  <span className="text-slate-400 text-sm">({match.players[1].rating})</span>
                  <span className="text-white font-bold">{match.players[1].username}</span>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {match.players[1].username[0].toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-bold text-sm w-12">{opponentHP} HP</span>
                  <div className="flex-1 bg-slate-900 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-500"
                      style={{ width: `${opponentHP}%` }}
                    ></div>
                  </div>
                  <Heart className="w-4 h-4 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 h-[calc(100vh-120px)]">
        <div className="border-r border-slate-700 bg-slate-800 p-6 overflow-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">{match.problem.title}</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  match.problem.difficulty === 'easy'
                    ? 'bg-green-500/20 text-green-400'
                    : match.problem.difficulty === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {match.problem.difficulty}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">{match.problem.description}</p>
          </div>

          {/* Input Format */}
          {match.problem?.inputFormat && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Input Format</h3>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-300 whitespace-pre-wrap text-sm">{match.problem.inputFormat}</p>
              </div>
            </div>
          )}

          {/* Output Format */}
          {match.problem?.outputFormat && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Output Format</h3>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-300 whitespace-pre-wrap text-sm">{match.problem.outputFormat}</p>
              </div>
            </div>
          )}

          {/* Constraints */}
          {match.problem?.constraints && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Constraints</h3>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <ul className="text-slate-300 text-sm space-y-1">
                  {match.problem.constraints.split('\n').map((constraint, idx) => (
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
          {match.problem?.sampleTestCases && match.problem.sampleTestCases.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Sample Test Cases</h3>
              <div className="space-y-4">
                {match.problem.sampleTestCases.map((testCase, index) => (
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

        <div className="flex flex-col bg-slate-900">
          <div className="flex-1 relative">
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
          {/* ================= VERDICT PANEL ================= */}
          {lastSubmission && (
            <div className="border-t border-slate-700 bg-slate-800 p-4 max-h-[200px] overflow-y-auto">
              <div
                className={`p-4 rounded-lg border ${
                  lastSubmission.verdict === 'AC'
                    ? 'bg-green-500/10 border-green-500/50'
                    : lastSubmission.verdict === 'RTE'
                    ? 'bg-orange-500/10 border-orange-500/50'
                    : 'bg-red-500/10 border-red-500/50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {lastSubmission.verdict === 'AC' && (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  )}
                  {lastSubmission.verdict === 'WA' && (
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  )}
                  {lastSubmission.verdict === 'RTE' && (
                    <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                  )}

                  <div className="flex-1">
                    <p className="font-semibold mb-1">
                      {lastSubmission.verdict === 'AC' && (
                        <span className="text-green-400">Accepted</span>
                      )}
                      {lastSubmission.verdict === 'WA' && (
                        <span className="text-red-400">Wrong Answer</span>
                      )}
                      {lastSubmission.verdict === 'RTE' && (
                        <span className="text-orange-400">Runtime Error</span>
                      )}
                    </p>

                    <p className="text-slate-400 text-sm">
                      {lastSubmission.testCasesPassed}/{lastSubmission.totalTestCases} test cases passed
                    </p>

                    <p className="text-slate-400 text-sm">
                      Execution: {lastSubmission.executionTime} ms | Memory: {lastSubmission.memory} KB
                    </p>

              {lastSubmission.error && (
                <pre className="mt-2 text-xs text-orange-300 whitespace-pre-wrap">
                  {lastSubmission.error}
                </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


          <div className="border-t border-slate-700 bg-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <span>JavaScript</span>
                <span>•</span>
                <span>Press Ctrl+Enter to submit</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || matchEnded}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/50"
              >
                {submitting ? (
                  <>
                    <Zap className="w-5 h-5 animate-pulse" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Submit Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
