import React from 'react';
import { Play, ShieldAlert, Crosshair, Sparkles, Skull } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-neutral-950/90 backdrop-blur-md p-4 font-chakra select-none">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Banner */}
        <div className="p-8 border-b border-neutral-800 bg-gradient-to-b from-red-950/60 to-neutral-950 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-950/80 border border-red-800 rounded-full text-red-400 text-xs font-mono-gaming font-bold tracking-widest uppercase mb-4">
            <ShieldAlert className="w-3.5 h-3.5" />
            CLASS-4 BIOHAZARD PROTOCOL ACTIVE
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-neutral-100 tracking-wider font-mono-gaming uppercase drop-shadow-lg">
            OUTBREAK <span className="text-red-500">: DEAD ZONE</span>
          </h1>

          <p className="text-sm text-neutral-400 max-w-lg mt-3 leading-relaxed">
            Sector-7 military compound has been overrun. Waves of mutated infected are breaching the perimeter. Eliminate hostiles, upgrade your arsenal, and survive.
          </p>
        </div>

        {/* Tactical Features & Controls */}
        <div className="p-6 space-y-5 bg-neutral-900/90">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-lg flex flex-col items-center text-center">
              <Crosshair className="w-5 h-5 text-emerald-400 mb-1" />
              <span className="text-xs font-bold text-neutral-200">Viper .50 Auto-Sniper</span>
              <span className="text-[11px] text-neutral-400 mt-0.5">High-sensitivity target lock: auto-fires instantly when target aligns</span>
            </div>

            <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-lg flex flex-col items-center text-center">
              <Sparkles className="w-5 h-5 text-amber-400 mb-1" />
              <span className="text-xs font-bold text-neutral-200">Explosive Hazard</span>
              <span className="text-[11px] text-neutral-400 mt-0.5">Shoot red fuel barrels to incinerate zombie clusters</span>
            </div>

            <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-lg flex flex-col items-center text-center">
              <Skull className="w-5 h-5 text-purple-400 mb-1" />
              <span className="text-xs font-bold text-neutral-200">Dynamic Arsenal</span>
              <span className="text-[11px] text-neutral-400 mt-0.5">Tactical 9mm, Viper .50, 12G Breacher, AR-74, and Plasma</span>
            </div>
          </div>

          {/* Controls Quick Ref */}
          <div className="bg-neutral-950/80 border border-neutral-800 p-3.5 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 text-neutral-300 font-mono-gaming">
            <span>[W][A][S][D] Move</span>
            <span>•</span>
            <span>[Mouse] Aim & Shoot</span>
            <span>•</span>
            <span>[Right-Click] Tactical ADS Scope</span>
            <span>•</span>
            <span>[1]-[5] Weapons</span>
            <span>•</span>
            <span>[R] Reload</span>
            <span>•</span>
            <span>[G] Frag</span>
            <span>•</span>
            <span>[F] Knife</span>
          </div>
        </div>

        {/* Mission Launch Button */}
        <div className="p-6 bg-neutral-950 border-t border-neutral-800 flex flex-col items-center gap-3">
          <button
            onClick={onStart}
            className="w-full py-4 rounded-lg bg-red-600 hover:bg-red-500 text-neutral-100 text-base font-bold font-mono-gaming transition-all cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.5)] flex items-center justify-center gap-3 tracking-widest uppercase hover:scale-[1.01] active:scale-[0.99]"
          >
            <Play className="w-5 h-5 fill-current" />
            COMMENCE MISSION [CLICK TO ENTER]
          </button>
          <span className="text-[11px] text-neutral-400 font-mono-gaming">
            Clicking enters pointer lock for full 3D FPS mouse control. Press [ESC] at any time to pause.
          </span>
        </div>
      </div>
    </div>
  );
};
