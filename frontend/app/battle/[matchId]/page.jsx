'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';
import { Heart, Clock, Trophy, Zap, Play, AlertCircle, CheckCircle, XCircle, Users, PlayCircle, Send, ChevronDown, GripHorizontal, GripVertical } from 'lucide-react';
import { matchAPI, executeAPI } from '@/services/api';
import socketService from '@/services/socket';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
  { id: 'c', name: 'C', extension: 'c', monacoLanguage: 'c' },
  { id: 'cpp', name: 'C++', extension: 'cpp', monacoLanguage: 'cpp' },
  { id: 'java', name: 'Java', extension: 'java', monacoLanguage: 'java' },
  { id: 'python', name: 'Python', extension: 'py', monacoLanguage: 'python' },
];

export default function BattlePage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [playerHP, setPlayerHP] = useState(100);
  const [otherPlayers, setOtherPlayers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(900);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [matchEnded, setMatchEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [resultPanelHeight, setResultPanelHeight] = useState(200);
  const [problemPanelWidth, setProblemPanelWidth] = useState(33);
  const [isResizingResults, setIsResizingResults] = useState(false);
  const [isResizingProblem, setIsResizingProblem] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  const roomCode = params.matchId;
  const isRoomCode = /^[A-Z0-9]{6}$/.test(roomCode || '');
  
  // Get current language config
  const currentLanguage = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    async function fetchMatchFromAPI() {
      try {
        const data = await matchAPI.getMatch(roomCode);
        console.log('📊 Match data received:', { 
          status: data.status, 
          timeLimit: data.timeLimit,
          winnerId: data.winnerId
        });
        
        if (data.status === 'completed') {
          setMatchEnded(true);
          setWinner({ id: data.winnerId });
          setMatch(data);
          setLoading(false);
          return;
        }

        const MIN_MATCH_DURATION = 60;
        setTimeLeft(Math.max(data.timeLimit || 900, MIN_MATCH_DURATION));
        setMatch(data);
        setCode('');
        
        const currentPlayer = data.players?.[0];
        setPlayerHP(currentPlayer?.hp || 100);

        if (data.players && data.players.length > 1) {
          const others = data.players
            .filter(p => p.id !== user.id)
            .map((p) => ({
              id: p.id,
              username: p.username,
              rating: p.rating,
              hp: p.hp || 100,
              eliminated: (p.hp || 100) <= 0,
            }));
          setOtherPlayers(others);
        }
      } catch (error) {
        console.error('Failed to fetch match:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!roomCode) return;
    
    console.log("Room Code:", roomCode);
    console.log("Is Room:", isRoomCode);

    if (isRoomCode) {
      console.log("Private Room Mode");
      setLoading(true);
      // Wait for socket Data handling
    } else {
      console.log("Quick Match Mode");
      fetchMatchFromAPI();
    }
  }, [authLoading, user, roomCode, router]);

  useEffect(() => {
    if (!roomCode) return;

    socketService.connect();

    if (isRoomCode) {
      socketService.emit('join_battle_room', { roomCode });
    } else {
      socketService.emit('join_match', { matchId: roomCode });
    }

    const handleBattleData = (data) => {
      console.log('Socket Battle Data:', data);
      const match = data.match;
      
      if (!match) return; // Wait for full hydration

      console.log("Hydrated Match:", match);
      console.log("Problem Loaded:", match.problem);
      console.log("Players:", match.players);

      const me = match.players?.find(p => String(p.id) === String(user?.id)) || match.players?.[0];
      setPlayerHP(me?.hp ?? 100);
      
      const others = (match.players || [])
        .filter(p => p.id !== user?.id)
        .map(p => ({
           id: p.id,
           username: p.username,
           hp: p.hp ?? 100,
           eliminated: false
        }));
      setOtherPlayers(others);

      // Single Source of Truth
      setMatch(match);
      setLoading(false);
    };

    const handleHPUpdate = (data) => {
      if (data.selfHP !== undefined) {
        setPlayerHP(data.selfHP);
      }
      
      if (data.playersHP) {
        setOtherPlayers(prev => prev.map(player => ({
          ...player,
          hp: data.playersHP[player.id] || player.hp,
          eliminated: (data.playersHP[player.id] || player.hp) <= 0
        })));
      }
      
      if (data.opponentHP !== undefined && otherPlayers.length > 0) {
        setOtherPlayers(prev => prev.map((p, idx) => 
          idx === 0 ? { ...p, hp: data.opponentHP, eliminated: data.opponentHP <= 0 } : p
        ));
      }
    };

    const handlePlayerEliminated = (data) => {
      setOtherPlayers(prev => prev.map(player => 
        player.id === data.playerId 
          ? { ...player, hp: 0, eliminated: true }
          : player
      ));
    };

    const handleMatchEnd = (data) => {
      console.log('🏁 Match end received:', data);
      
      // Validate winner data
      if (!data || !data.winner || !data.winner.id) {
        console.error('❌ Invalid match_end data:', data);
        return;
      }
      
      console.log('🏁 Setting match ended. Winner:', data.winner.id, 'Current user:', user?.id);
      setMatchEnded(true);
      setWinner(data.winner);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    const handleSubmissionResult = (data) => {
      setLastSubmission({
        verdict: data.verdict,
        testCasesPassed: data.testCasesPassed,
        totalTestCases: data.totalTestCases,
        executionTime: data.executionTime,
        memory: data.memory ?? 0,
        error: data.errorMessage || null,
        isSubmission: true,
      });
      setSubmitting(false);
      setShowResults(true);
    };

    const handleRunResult = (data) => {
      setLastSubmission({
        verdict: data.verdict,
        testCasesPassed: data.testCasesPassed,
        totalTestCases: data.totalTestCases,
        executionTime: data.executionTime,
        memory: data.memory ?? 0,
        error: data.errorMessage || null,
        output: data.output,
        isSubmission: false,
      });
      setRunning(false);
      setShowResults(true);
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
      setWinner({ id: null, ratingChange: 0 });
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    socketService.on('battle_data', handleBattleData);

    const handlePrivateHPUpdate = ({ players }) => {
      const me = players.find(p => String(p.id) === String(user?.id));
      if (me && me.hp !== undefined) {
        setPlayerHP(me.hp);
      }

      const others = players
        .filter(p => String(p.id) !== String(user?.id))
        .map(p => ({
          ...p,
          eliminated: p.hp <= 0
        }));
      setOtherPlayers(others);

      setMatch(prev => ({
        ...prev,
        players
      }));
    };

    const handlePrivateGameOver = ({ reason, winner: winnerId }) => {
      console.log("Game Over triggered by:", reason, "Winner:", winnerId);

      // 1. Set the winner state so the modal correctly shows Victory/Defeat
      setWinner({ id: winnerId });
      
      // 2. Mark match as ended to show the results modal
      setMatchEnded(true);
      setTimeLeft(0);
      if (timerRef.current) clearInterval(timerRef.current);

      // 3. Return to dashboard after allowing time to see the results
      setTimeout(() => {
        router.push("/dashboard");
      }, 5000); 
    };

    const handleMatchResult = ({ players, winner }) => {
      // Assuming a setUser context update is available, we sync to the active user context
      // The redirect to dashboard natively forces a clean reload regardless
      console.log("Match Results received:", { players, winner });
    };

    if (isRoomCode) {
      socketService.on('hp_update', handlePrivateHPUpdate);
      socketService.on('game_over', handlePrivateGameOver);
      socketService.on('match_result', handleMatchResult);
    } else {
      socketService.on('hp_update', handleHPUpdate);
      socketService.on('game_over', handleMatchEnd); // Route to matchEnd
    }
    socketService.on('player_eliminated', handlePlayerEliminated);
    socketService.on('match_end', handleMatchEnd);
    socketService.on('submission_result', handleSubmissionResult);
    socketService.on('run_result', handleRunResult);
    socketService.on('victory_popup', handleVictoryPopup);
    socketService.on('defeat_popup', handleDefeatPopup);

    return () => {
      socketService.off('battle_data', handleBattleData);
      socketService.off('hp_update', handleHPUpdate);
      socketService.off('player_eliminated', handlePlayerEliminated);
      socketService.off('match_end', handleMatchEnd);
      socketService.off('submission_result', handleSubmissionResult);
      socketService.off('run_result', handleRunResult);
      socketService.off('victory_popup', handleVictoryPopup);
      socketService.off('defeat_popup', handleDefeatPopup);
      socketService.off('hp_update');
      socketService.off('game_over');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [user, match, params.matchId, otherPlayers.length]);

  useEffect(() => {
    if (!match) return;
    
    // We calculate current remaining time based strictly on server start timestamp
    const now = Date.now();
    const elapsed = Math.floor((now - (match.startTime || now)) / 1000);
    const remaining = (match.duration || 900) - elapsed;
    
    setTimeLeft(remaining > 0 ? remaining : 0);
  }, [match]);

  useEffect(() => {
    if (match && !matchEnded && match.startTime) {
      console.log('⏱️ Starting synchronized server timer');
      
      const startTime = match.startTime;
      const duration = match.duration || 900;
      
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = duration - elapsed;
        
        setTimeLeft(remaining > 0 ? remaining : 0);

        if (remaining <= 0) {
          console.log('🏁 Timer reached 0, ending match');
          setMatchEnded(true);
          clearInterval(timerRef.current);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [match, matchEnded, isRoomCode, roomCode]);

  // Handle results panel resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingResults || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      
      const maxHeight = containerRect.height * 0.6;
      const constrainedHeight = Math.max(120, Math.min(newHeight, maxHeight));
      
      setResultPanelHeight(constrainedHeight);
    };

    const handleMouseUp = () => {
      setIsResizingResults(false);
      setIsResizingProblem(false);
    };

    if (isResizingResults || isResizingProblem) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizingResults ? 'ns-resize' : 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingResults, isResizingProblem]);

  // Handle problem panel resizing
  const handleProblemResize = (e) => {
    if (!isResizingProblem || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    const constrainedWidth = Math.max(20, Math.min(50, newWidth));
    setProblemPanelWidth(constrainedWidth);
  };

  useEffect(() => {
    if (isResizingProblem) {
      document.addEventListener('mousemove', handleProblemResize);
      return () => document.removeEventListener('mousemove', handleProblemResize);
    }
  }, [isResizingProblem]);

  const handleRun = async () => {
    if (!code.trim() || running) return;

    setRunning(true);

    try {
      if (isRoomCode) {
        const input = match.problem?.sampleTestCases?.[0]?.input || '';
        console.log("Code:", code);
        console.log("Input:", input);
        
        const data = await executeAPI.run({ code, language, input });
        console.log("RUN RESPONSE:", data);
        
        setLastSubmission({ 
          isSubmission: false, 
          verdict: data.success ? 'Run Complete' : 'Runtime Error', 
          output: data.output || "No Output"
        });
        setShowResults(true);
        setRunning(false);
      } else {
        socketService.emit('run_code', {
          matchId: params.matchId,
          code,
          language,
        });
      }
    } catch (err) {
      setRunning(false);
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim() || submitting || matchEnded) return;

    setSubmitting(true);

    try {
      if (isRoomCode) {
        const data = await executeAPI.submit({ 
          code, 
          language, 
          problemId: match.problem?.id 
        });
        console.log("SUBMIT RESPONSE:", data);
        
        setLastSubmission({ 
          isSubmission: true, 
          verdict: data.correct ? 'AC' : 'WA', 
          testCasesPassed: data.passed || 0, 
          totalTestCases: data.total || 0,
          error: data.error || null,
          testCases: data.testCases || []
        });
        setShowResults(true);
        setSubmitting(false);

        if (data.correct) {
          socketService.emit("attack", {
            roomCode,
            damage: 20,
            type: "correct"
          });
        } else {
          socketService.emit("attack", {
            roomCode,
            damage: 10,
            type: "wrong"
          });
        }
      } else {
        socketService.emit('submit_code', {
          matchId: params.matchId,
          code,
          language,
        });
      }
    } catch (error) {
      setSubmitting(false);
      console.error(error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getHPBarColor = (hp, isCurrentUser = false) => {
    if (isCurrentUser) {
      return 'from-red-500 to-pink-500';
    }
    if (hp > 60) return 'from-green-500 to-emerald-500';
    if (hp > 30) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-700';
  };

  const alivePlayers = otherPlayers.filter(p => !p.eliminated);
  const eliminatedPlayers = otherPlayers.filter(p => p.eliminated);

  // 5. STRICT RENDER GUARD
  if (!match || !match.problem || !match.players) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading battle...
      </div>
    );
  }

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
      {/* Match End Modal */}
      {matchEnded && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 max-w-md text-center">
            {winner?.id === user.id ? (
              <>
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-white mb-4">Victory!</h2>
                <p className="text-slate-400 mb-2">You dominated the battlefield!</p>
                <p className="text-green-400 text-2xl font-bold mb-8">+{winner.ratingChange || '+25'}</p>
              </>
            ) : (
              <>
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-white mb-4">Defeat</h2>
                <p className="text-slate-400 mb-8">Better luck next time, warrior!</p>
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

      {/* Header Bar */}
      <div className="border-b border-slate-700 bg-slate-800 shadow-xl">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Current User */}
            <div className="flex items-center space-x-4 w-1/3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="text-white font-bold">{user.username}</span>
                  <span className="text-slate-400 text-sm">({match.players?.[0]?.rating || user.rating})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <div className="flex-1 bg-slate-900 rounded-full h-4 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${getHPBarColor(playerHP, true)} h-full transition-all duration-500`}
                      style={{ width: `${Math.max(0, playerHP)}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-bold text-sm w-12">{Math.max(0, playerHP)} HP</span>
                </div>
              </div>
            </div>

            {/* Center: Timer */}
            <div className="text-center w-1/3">
              <div className="inline-flex items-center space-x-2 bg-slate-900 px-6 py-2 rounded-lg border border-slate-700">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-2xl font-bold text-white">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Right: Toggle Leaderboard */}
            <div className="w-1/3 flex justify-end">
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-slate-300" />
                <span className="text-slate-300 text-sm">
                  {showLeaderboard ? 'Hide' : 'Show'} Players
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div ref={containerRef} className="flex h-[calc(100vh-120px)] relative">
        {/* Left Panel: Problem Description */}
        <div 
          className="border-r border-slate-700 bg-slate-800 overflow-auto flex flex-col"
          style={{ width: `${problemPanelWidth}%` }}
        >
          <div className="p-6 flex-1">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">{match.problem?.title}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    match.problem?.difficulty === 'easy'
                      ? 'bg-green-500/20 text-green-400'
                      : match.problem?.difficulty === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {match.problem?.difficulty}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{match.problem?.description}</p>
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
        </div>

        {/* Draggable Splitter */}
        <div
          className="w-1 bg-slate-600 hover:bg-orange-500 cursor-ew-resize flex items-center justify-center transition-colors z-20"
          onMouseDown={() => setIsResizingProblem(true)}
          style={{ cursor: isResizingProblem ? 'ew-resize' : 'col-resize' }}
        >
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>

        {/* Middle Panel: Code Editor */}
        <div className="flex-1 flex flex-col bg-slate-900 min-w-0 relative">
          {/* Toolbar with Language and Buttons */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-sm">Language:</span>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="appearance-none bg-slate-700 text-white text-sm px-4 py-1.5 pr-8 rounded-lg border border-slate-600 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Run & Submit Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRun}
                disabled={running || matchEnded || !code.trim()}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {running ? (
                  <PlayCircle className="w-4 h-4 animate-pulse" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>Run</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={submitting || matchEnded || !code.trim()}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/50"
              >
                {submitting ? (
                  <Zap className="w-4 h-4 animate-pulse" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Submit</span>
              </button>
            </div>
          </div>

          {/* Editor Area with Results Overlay */}
          <div className="flex-1 relative overflow-hidden">
            <MonacoEditor
              height="100%"
              language={currentLanguage.monacoLanguage}
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

            {/* Resizable Results Panel */}
            {showResults && lastSubmission && (
              <div 
                className="absolute left-0 right-0 bottom-0 bg-slate-800 border-t border-slate-600 shadow-2xl z-10 flex flex-col"
                style={{ height: `${resultPanelHeight}px` }}
              >
                {/* Resize Handle */}
                <div
                  className="h-6 bg-slate-700 border-b border-slate-600 flex items-center justify-center cursor-ns-resize hover:bg-slate-600 transition-colors"
                  onMouseDown={() => setIsResizingResults(true)}
                >
                  <GripHorizontal className="w-5 h-5 text-slate-400" />
                </div>

                {/* Results Content */}
                <div className="flex-1 overflow-auto p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {lastSubmission.verdict === 'AC' && (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-green-400 font-semibold">Accepted</span>
                        </>
                      )}
                      {lastSubmission.verdict === 'WA' && (
                        <>
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span className="text-red-400 font-semibold">Wrong Answer</span>
                        </>
                      )}
                      {lastSubmission.verdict === 'RTE' && (
                        <>
                          <AlertCircle className="w-5 h-5 text-orange-500" />
                          <span className="text-orange-400 font-semibold">Runtime Error</span>
                        </>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        lastSubmission.isSubmission 
                          ? 'bg-orange-500/20 text-orange-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {lastSubmission.isSubmission ? 'Submission' : 'Run'}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowResults(false)}
                      className="text-slate-400 hover:text-white text-sm"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div className="bg-slate-900 rounded px-3 py-2">
                      <span className="text-slate-500">Test Cases: </span>
                      <span className="text-white">{lastSubmission.testCasesPassed}/{lastSubmission.totalTestCases}</span>
                    </div>
                    <div className="bg-slate-900 rounded px-3 py-2">
                      <span className="text-slate-500">Time: </span>
                      <span className="text-white">{lastSubmission.executionTime} ms</span>
                    </div>
                    <div className="bg-slate-900 rounded px-3 py-2">
                      <span className="text-slate-500">Memory: </span>
                      <span className="text-white">{lastSubmission.memory} KB</span>
                    </div>
                  </div>

                  {/* Detailed Output string vs Array Mappings */}
                  {lastSubmission.isSubmission ? (
                    lastSubmission.testCases && lastSubmission.testCases.length > 0 && (
                      <div className="mt-4 space-y-4">
                        {lastSubmission.testCases.map((tc, index) => (
                          <div key={index} className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-slate-300 font-bold">Test Case {index + 1}:</span>
                              {tc.passed ? (
                                <span className="text-green-500 font-bold flex items-center">✅ Passed</span>
                              ) : (
                                <span className="text-red-500 font-bold flex items-center">❌ Failed</span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <span className="text-slate-500 text-xs">Input:</span>
                                <pre className="text-slate-300 bg-slate-800 p-2 rounded text-xs mt-1">{tc.input}</pre>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs">Your Output:</span>
                                <pre className="text-slate-300 bg-slate-800 p-2 rounded text-xs mt-1">{tc.output}</pre>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs">Expected:</span>
                                <pre className="text-slate-300 bg-slate-800 p-2 rounded text-xs mt-1">{tc.expected}</pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    lastSubmission.output && (
                      <div className="mb-3">
                        <span className="text-slate-400 text-sm">Output:</span>
                        <pre className="mt-1 text-sm text-slate-300 whitespace-pre-wrap bg-slate-900 p-3 rounded border border-slate-700 font-mono">
                          {lastSubmission.output}
                        </pre>
                      </div>
                    )
                  )}

                  {lastSubmission.error && (
                    <div>
                      <span className="text-slate-400 text-sm">Error:</span>
                      <pre className="mt-1 text-sm text-red-300 whitespace-pre-wrap bg-slate-900 p-3 rounded border border-red-900/50 font-mono">
                        {lastSubmission.error}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Players Leaderboard (Only when enabled) */}
        {showLeaderboard && (
          <div className="w-64 border-l border-slate-700 bg-slate-800/50 p-4 overflow-auto">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">
              Players Status
            </h3>
            
            <div className="space-y-3">
              {/* Alive Players */}
              {alivePlayers.map((player) => (
                <div key={player.id} className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm truncate">{player.username}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${getHPBarColor(player.hp)} h-full transition-all duration-500`}
                        style={{ width: `${Math.max(0, player.hp)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right">{Math.max(0, player.hp)}%</span>
                  </div>
                </div>
              ))}

              {/* Eliminated Players */}
              {eliminatedPlayers.length > 0 && (
                <>
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <span className="text-xs text-slate-500 uppercase">Eliminated</span>
                  </div>
                  {eliminatedPlayers.map((player) => (
                    <div key={player.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 opacity-60">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium text-sm line-through">{player.username}</span>
                        <span className="text-red-500 text-xs">❌</span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {otherPlayers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No other players</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 p-3 bg-slate-900 rounded-lg border border-slate-700">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Alive:</span>
                <span className="text-green-400">{alivePlayers.length}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Eliminated:</span>
                <span className="text-red-400">{eliminatedPlayers.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
