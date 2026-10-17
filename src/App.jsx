import React, { useState, useEffect } from 'react';
import { BarChart3, ChevronRight, CircleHelp, RotateCcw, CheckCircle, Flame, Clock, Flag } from 'lucide-react';

const STORAGE_KEY = 'numerologyStats';
const MAX_RESETS = 2;
const MAX_UNDOS = 5;
const DIFFICULTIES = [1, 2, 3];

const RULES = {
  add5: { name: '+5', apply: (n) => n + 5, difficulty: 1 },
  add7: { name: '+7', apply: (n) => n + 7, difficulty: 1 },
  subtract3: { name: '−3', apply: (n) => n - 3, difficulty: 1 },
  double: { name: '×2', apply: (n) => n * 2, difficulty: 1 },
  halve: { name: '÷2', apply: (n) => Math.floor(n / 2), difficulty: 2 },
  sumDigits: {
    name: 'Σ digits',
    apply: (n) => String(Math.abs(n)).split('').reduce((sum, d) => sum + parseInt(d, 10), 0),
    difficulty: 2,
  },
  reverseDigits: {
    name: 'Reverse',
    apply: (n) => parseInt(String(Math.abs(n)).split('').reverse().join(''), 10),
    difficulty: 2,
  },
  modulo10: { name: 'mod 10', apply: (n) => n % 10, difficulty: 2 },
  triple: { name: '×3', apply: (n) => n * 3, difficulty: 2 },
  subtract7: { name: '−7', apply: (n) => n - 7, difficulty: 1 },
  add10: { name: '+10', apply: (n) => n + 10, difficulty: 2 },
  digitCount: { name: '# digits', apply: (n) => String(Math.abs(n)).length, difficulty: 3 },
};

const RULE_KEYS = Object.keys(RULES);

const BADGES = [
  {
    id: 'on_fire',
    name: '🔥 On Fire',
    description: 'Reach 10 consecutive wins',
    earned: (s, d) => (s.longestStreaks?.[d] ?? 0) >= 10,
  },
  {
    id: 'speed_runner',
    name: '⚡ Speed Runner',
    description: 'Solve a puzzle in under 30 seconds',
    earned: (s, d) => (s.bestTimes?.[d] ?? Infinity) < 30,
  },
  {
    id: 'perfect',
    name: '✨ Perfect',
    description: 'Solve without using reset',
    earned: (s) => (s.perfectWins ?? 0) >= 1,
  },
  {
    id: 'unstoppable',
    name: '💥 Unstoppable',
    description: 'Reach 25 consecutive wins',
    earned: (s, d) => (s.longestStreaks?.[d] ?? 0) >= 25,
  },
  {
    id: 'master',
    name: '👑 Master',
    description: 'Beat your best time 3 times',
    earned: (s, d) => (s.timesBeaten?.[d] ?? 0) >= 3,
  },
];

const COLLECTOR = {
  id: 'collector',
  name: '🏆 Collector',
  description: 'Earn 5 different badges',
  earned: (s, d) => BADGES.filter((b) => b.earned(s, d)).length >= 5,
};

const ALL_BADGES = [...BADGES, COLLECTOR];

const createEmptyStats = () => ({
  bestTimes: {},
  streaks: {},
  longestStreaks: {},
  totalWins: 0,
  perfectWins: 0,
  timesBeaten: {},
});

const loadStats = () => {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...createEmptyStats(), ...data };
  } catch (error) {
    console.error('Could not load saved stats, starting fresh:', error);
    return createEmptyStats();
  }
};

const saveStats = (stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Could not save stats:', error);
  }
};

const formatTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const generatePuzzle = (difficulty = 1) => {
  const start = Math.floor(Math.random() * 90) + 10;
  const numSteps = Math.min(2 + difficulty, 5);
  const availableRules = RULE_KEYS.filter((key) => RULES[key].difficulty <= difficulty);

  let current = start;
  const solution = [];
  for (let i = 0; i < numSteps; i++) {
    const ruleKey = availableRules[Math.floor(Math.random() * availableRules.length)];
    solution.push(ruleKey);
    current = RULES[ruleKey].apply(current);
  }

  return {
    start,
    target: current,
    solution,
    availableRules: [...availableRules].sort(() => Math.random() - 0.5),
  };
};

const shareScore = async ({ difficulty, streak, seconds }) => {
  const text =
    `🎮 I'm playing Numaze Paths!\n\n` +
    `📊 Level ${difficulty}\n` +
    `🔥 Streak: ${streak}\n` +
    `⏱️ Time: ${formatTime(seconds)}\n\n` +
    `🏆 Can you beat my score?`;
  const url = window.location.origin;

  try {
    if (navigator.share) {
      await navigator.share({ title: 'Numaze Paths', text, url });
    } else {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      alert('Score copied to clipboard! 📋');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Share failed:', error);
    }
  }
};

function StatsPanel({ stats, difficulty, onClose, onClearAll }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold text-slate-800">Your Stats</h2>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700 text-lg font-bold"
          aria-label="Close stats"
        >
          ✕
        </button>
      </div>

      <div className="mb-5 pb-5 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold">Overall</p>
        <p className="text-sm text-slate-600">Total wins</p>
        <p className="text-3xl font-bold text-slate-800">{stats.totalWins}</p>
      </div>

      <div className="mb-5 pb-5 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold">
          Badges (Level {difficulty})
        </p>
        <div className="grid grid-cols-2 gap-3">
          {ALL_BADGES.map((badge) => {
            const earned = badge.earned(stats, difficulty);
            return (
              <div
                key={badge.id}
                className={`p-3 rounded-lg border ${
                  earned ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-200 opacity-50'
                }`}
              >
                <p className={`text-sm font-medium ${earned ? 'text-yellow-800' : 'text-slate-600'}`}>
                  {badge.name}
                </p>
                <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-bold">By Level</p>
        {DIFFICULTIES.map((level) => (
          <div key={level} className="mb-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-bold text-slate-800 mb-3">Level {level}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-600 text-xs">Current streak</p>
                <p className="font-bold text-slate-800">{stats.streaks?.[level] ?? 0}</p>
              </div>
              <div>
                <p className="text-slate-600 text-xs">Longest streak</p>
                <p className="font-bold text-orange-600">{stats.longestStreaks?.[level] ?? 0}</p>
              </div>
              <div>
                <p className="text-slate-600 text-xs">Best time</p>
                <p className="font-bold text-green-600">
                  {stats.bestTimes?.[level] !== undefined ? formatTime(stats.bestTimes[level]) : '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-600 text-xs">Times beaten best</p>
                <p className="font-bold text-blue-600">{stats.timesBeaten?.[level] ?? 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onClearAll}
        className="w-full mt-5 px-4 py-2 text-slate-600 hover:text-red-600 text-sm transition border border-slate-200 rounded"
      >
        Clear All Stats
      </button>
    </div>
  );
}
function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.8 + Math.random() * 1.2,
    color: ['#22c55e', '#84cc16', '#eab308', '#3b82f6', '#ec4899', '#f97316'][i % 6],
    rotate: Math.random() * 360,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function HowToPlay({ onClose }) {
  const steps = [
    'You get a start number and a target number.',
    'Tap rules to transform the start number, one step at a time.',
    'Reach the target in exactly the number of steps shown in the puzzle to win.',
    'Finish the puzzle, then tap Next Puzzle to keep going.',
  ];

  const controls = [
    ['Undo', 'Removes the last step. You get 5 per puzzle.'],
    ['Reset', 'Clears the path and starts over. You get 2 per puzzle.'],
    ['Give Up', 'Shows the solution and resets your current win streak.'],
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold text-slate-800">How to Play</h2>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700 text-lg font-bold"
          aria-label="Close how to play"
        >
          ✕
        </button>
      </div>

      <div className="mb-5 pb-5 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-bold">Goal</p>
        <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="mb-5 pb-5 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-bold">Controls</p>
        <dl className="space-y-2 text-sm">
          {controls.map(([name, description]) => (
            <div key={name}>
              <dt className="font-bold text-slate-800">{name}</dt>
              <dd className="text-slate-600">{description}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-bold">Rules</p>
        <p className="text-sm text-slate-600 mb-3">
          Each rule changes the current number. Rules marked with a level unlock as you progress.
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {RULE_KEYS.map((key) => (
            <div key={key} className="flex justify-between bg-slate-50 border border-slate-200 rounded px-3 py-2">
              <span className="font-medium text-slate-800">{RULES[key].name}</span>
              <span className="text-slate-400 text-xs self-center">Lvl {RULES[key].difficulty}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NumerologyPaths() {
  const [difficulty] = useState(1);
  const [puzzle, setPuzzle] = useState(() => generatePuzzle(1));
  const [playerPath, setPlayerPath] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [solved, setSolved] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [resetsRemaining, setResetsRemaining] = useState(MAX_RESETS);
  const [undosRemaining, setUndosRemaining] = useState(MAX_UNDOS);
  const [usedResetThisPuzzle, setUsedResetThisPuzzle] = useState(false);
  const [stats, setStats] = useState(loadStats);
  const [showStats, setShowStats] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  useEffect(() => {
    if (solved) return undefined;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [solved]);

  const pathValues = [];
  let running = puzzle.start;
  for (const ruleKey of playerPath) {
    running = RULES[ruleKey].apply(running);
    pathValues.push(running);
  }
  const currentNum = pathValues.length ? pathValues[pathValues.length - 1] : puzzle.start;
  const isCorrect = currentNum === puzzle.target && playerPath.length === puzzle.solution.length;
  const currentStreak = stats.streaks?.[difficulty] ?? 0;
  const bestTime = stats.bestTimes?.[difficulty];

  const startNewPuzzle = () => {
    setPuzzle(generatePuzzle(difficulty));
    setPlayerPath([]);
    setFeedback('');
    setSolved(false);
    setSeconds(0);
    setResetsRemaining(MAX_RESETS);
    setUndosRemaining(MAX_UNDOS);
    setUsedResetThisPuzzle(false);
  };

  const recordWin = () => {
    const previousBest = stats.bestTimes?.[difficulty];
    const streak = (stats.streaks?.[difficulty] ?? 0) + 1;
    const beatBest = previousBest !== undefined && seconds < previousBest;

    const next = {
      ...stats,
      totalWins: (stats.totalWins ?? 0) + 1,
      perfectWins: (stats.perfectWins ?? 0) + (usedResetThisPuzzle ? 0 : 1),
      streaks: { ...stats.streaks, [difficulty]: streak },
      longestStreaks: {
        ...stats.longestStreaks,
        [difficulty]: Math.max(stats.longestStreaks?.[difficulty] ?? 0, streak),
      },
      bestTimes: {
        ...stats.bestTimes,
        [difficulty]: previousBest === undefined || beatBest ? seconds : previousBest,
      },
      timesBeaten: beatBest
        ? { ...stats.timesBeaten, [difficulty]: (stats.timesBeaten?.[difficulty] ?? 0) + 1 }
        : stats.timesBeaten,
    };

    setStats(next);
    saveStats(next);
  };

  const addRule = (ruleKey) => {
    if (solved) return;

    const newPath = [...playerPath, ruleKey];
    const newValue = RULES[ruleKey].apply(currentNum);
    setPlayerPath(newPath);

    if (newValue === puzzle.target && newPath.length === puzzle.solution.length) {
      setSolved(true);
      setFeedback('✓ Perfect! You found the path!');
      recordWin();
    } else if (newValue === puzzle.target) {
      setFeedback('🎯 Hit target, but wrong number of steps');
    } else if (newPath.length >= puzzle.solution.length + 2) {
      setFeedback('❌ Too many steps. Undo or reset.');
    } else {
      setFeedback('');
    }
  };

  const undoRule = () => {
    if (undosRemaining === 0 || playerPath.length === 0 || solved) return;
    setPlayerPath((path) => path.slice(0, -1));
    setUndosRemaining((u) => u - 1);
    setFeedback('');
  };

  const resetPuzzle = () => {
    if (resetsRemaining === 0 || solved) return;
    setPlayerPath([]);
    setResetsRemaining((r) => r - 1);
    setUsedResetThisPuzzle(true);
    setFeedback('🔄 Puzzle reset. Starting over!');
  };

  const giveUp = () => {
    if (solved) return;
    setSolved(true);
    setFeedback(`Solution: ${puzzle.solution.map((r) => RULES[r].name).join(' → ')}`);

    const next = { ...stats, streaks: { ...stats.streaks, [difficulty]: 0 } };
    setStats(next);
    saveStats(next);
  };

  const clearAllStats = () => {
    const fresh = createEmptyStats();
    setStats(fresh);
    saveStats(fresh);
    setShowStats(false);
    startNewPuzzle();
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans">
      <div className="mx-auto w-full max-w-md px-3 py-2 sm:py-3">
        {showHowTo ? (
          <HowToPlay onClose={() => setShowHowTo(false)} />
        ) : showStats ? (
          <StatsPanel
            stats={stats}
            difficulty={difficulty}
            onClose={() => setShowStats(false)}
            onClearAll={clearAllStats}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-slate-800">Numaze</h1>
                <p className="text-xs sm:text-sm text-slate-500">Find the path. Transform the number.</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-2">
                <button
                  onClick={() => setShowStats(true)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                  aria-label="View statistics"
                  title="View statistics"
                >
                  <BarChart3 size={18} />
                </button>
                <button
                  onClick={() => setShowHowTo(true)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                  aria-label="How to play"
                  title="How to play"
                >
                  <CircleHelp size={18} />
                </button>
              </div>
            </div>

            {/* Stats Row: icon + value only */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="flex flex-col items-center justify-center gap-1 bg-white rounded-lg py-2 border border-slate-200">
                  <Clock size={14} className="text-blue-600" />
                  <p className="text-sm font-bold text-slate-800">{formatTime(seconds)}</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 bg-white rounded-lg py-2 border border-slate-200">
                  <Flame size={14} className="text-orange-600" />
                  <p className="text-sm font-bold text-slate-800">{currentStreak}</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 bg-white rounded-lg py-2 border border-slate-200">
                  <RotateCcw size={14} className="text-slate-600" />
                  <p className="text-sm font-bold text-slate-800">{resetsRemaining}</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 bg-white rounded-lg py-2 border border-slate-200">
                  <Flag size={14} className="text-slate-600" />
                  <p className="text-sm font-bold text-slate-800">{difficulty}</p>
                </div>
              </div>

            {/* Best Time: single line */}
            {bestTime !== undefined && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center gap-2">
                <p className="text-xs text-green-700 uppercase font-bold">Best time (Level {difficulty})</p>
                <p className="text-sm font-bold text-green-800">{formatTime(bestTime)}</p>
              </div>
            )}
            {solved && isCorrect && <Confetti />}
            {/* Puzzle Card */}
            <div
              className={`rounded-xl shadow-sm border p-4 sm:p-6 mb-3 transition-colors duration-500 ${
                solved && isCorrect ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
              }`}
            >
              <div className="text-center mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Start</p>
                <p className="font-mono text-4xl sm:text-5xl font-bold text-slate-800">{puzzle.start}</p>
              </div>

              {/* Path: one horizontal row, fixed height */}
              <div className="h-12 mb-4 flex items-center justify-center gap-2 overflow-x-auto whitespace-nowrap">
                {playerPath.length === 0 && (
                  <span className="text-sm text-slate-400">Pick a rule to begin</span>
                )}
                {playerPath.map((ruleKey, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-3 py-1"
                  >
                    <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-bold text-slate-500">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-blue-700">{RULES[ruleKey].name}</span>
                    <ChevronRight size={12} className="text-slate-400" />
                    <span className="font-mono font-bold text-slate-700">{pathValues[idx]}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 text-center">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Current</p>
                  <p
                    className={`font-mono text-3xl sm:text-4xl font-bold ${
                      isCorrect ? 'text-green-600' : 'text-slate-800'
                    }`}
                  >
                    {currentNum}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Target</p>
                  <p className="font-mono text-3xl sm:text-4xl font-bold text-slate-400">{puzzle.target}</p>
                </div>
              </div>
            </div>



            {/* Rules */}
            <div className="mb-3">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold">Rules</p>
              <div className="grid grid-cols-3 gap-2">
                {puzzle.availableRules.map((ruleKey) => (
                  <button
                    key={ruleKey}
                    onClick={() => addRule(ruleKey)}
                    disabled={solved || playerPath.length >= puzzle.solution.length}
                    className="px-2 py-2 rounded font-medium text-sm border transition bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200 disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {RULES[ruleKey].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={undoRule}
                disabled={playerPath.length === 0 || solved || undosRemaining === 0}
                className="px-3 py-2 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-blue-700 rounded font-medium text-sm transition"
                title="Remove last step (unlimited)"
              >
                ← Undo ({undosRemaining})
              </button>
              <button
                onClick={resetPuzzle}
                disabled={solved || resetsRemaining === 0}
                className="px-3 py-2 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed text-amber-700 rounded font-medium text-sm transition"
                title={resetsRemaining === 0 ? 'No resets remaining' : 'Start puzzle over'}
              >
                ⟳ Reset ({resetsRemaining})
              </button>
              <button
                onClick={giveUp}
                disabled={solved}
                className="px-3 py-2 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-red-700 rounded font-medium text-sm transition"
              >
                Give Up
              </button>
            </div>

            {solved && (
              <div className="space-y-2">
                <button
                  onClick={startNewPuzzle}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-sm transition flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Next Puzzle
                </button>
                <button
                  onClick={() => shareScore({ difficulty, streak: currentStreak, seconds })}
                  className="w-full px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium text-sm transition"
                >
                  📤 Share Score
                </button>
              </div>
            )}

            <button
              onClick={clearAllStats}
              className="w-full mt-3 px-4 py-2 text-slate-600 hover:text-slate-800 text-xs transition"
            >
              Reset All Progress
            </button>
          </>
        )}
      </div>
    </div>
  );
}