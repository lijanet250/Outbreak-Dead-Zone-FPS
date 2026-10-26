import React from 'react';
import { PlayerStats } from '../game/types';
import { Skull, RotateCcw, Trophy, Target, Zap } from 'lucide-react';

interface GameOverModalProps {
  stats: PlayerStats;
  isOpen: boolean;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, isOpen, onRestart }) => {
  if (!isOpen) return null;

  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
  const headshotRate = stats.kills > 0 ? Math.round((stats.headshots / stats.kills) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-chakra select-none">
      <div className="bg-neutral-900 border border-red-900/80 w-full max-w-lg rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.3)] overflow-hidden flex flex-col">
        {/* Banner */}
        <div className="bg-gradient-to-b from-red-950/80 to-neutral-950 p-6 border-b border-red-900/50 flex flex-col items-center text-center">
          <div className="p-3 bg-red-600/10 border border-red-600/30 rounded-full text-red-500 mb-2">
            <Skull className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-red-500 tracking-wider uppercase font-mono-gaming">
            M.I.A. // SURVIVOR OVERRUN
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Biohazard containment failed. Your vital signs ceased on Wave {stats.wave}.
          </p>
        </div>

        {/* Stats grid */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-950/80 border border-neutral-800 p-3 rounded-lg flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Final Score</span>
              <span className="text-2xl font-black font-mono-gaming text-neutral-100">
                {stats.score.toLocaleString()}
              </span>
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800 p-3 rounded-lg flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Wave Reached</span>
              <span className="text-2xl font-black font-mono-gaming text-red-400">
                WAVE {stats.wave}
              </span>
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800 p-3 rounded-lg flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Zombies Neutralized</span>
              <span className="text-2xl font-black font-mono-gaming text-neutral-100">
                {stats.kills}
              </span>
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800 p-3 rounded-lg flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Headshots</span>
              <span className="text-2xl font-black font-mono-gaming text-amber-400">
                {stats.headshots} ({headshotRate}%)
              </span>
            </div>

            <div className="col-span-2 bg-gradient-to-r from-amber-950/40 via-red-950/40 to-amber-950/40 border border-amber-600/40 p-3 rounded-lg flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-xs uppercase font-bold tracking-widest text-neutral-200">Best Kill Streak</span>
              </div>
              <span className="text-2xl font-black font-mono-gaming text-amber-400">
                x{stats.maxKillStreak} COMBO
              </span>
            </div>
          </div>

          {/* Accuracy report */}
          <div className="bg-neutral-950/60 border border-neutral-800 p-3.5 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Ballistic Accuracy:</span>
            </div>
            <span className="font-mono-gaming font-bold text-neutral-100">
              {accuracy}% ({stats.shotsHit} / {stats.shotsFired} rounds)
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 py-4 bg-neutral-950/80 border-t border-neutral-800 flex items-center justify-center">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-neutral-100 text-sm font-bold font-mono-gaming transition-colors cursor-pointer shadow-lg tracking-wider"
          >
            <RotateCcw className="w-4 h-4" />
            DEPLOY AGAIN [SPACE / ENTER]
          </button>
        </div>
      </div>
    </div>
  );
};
