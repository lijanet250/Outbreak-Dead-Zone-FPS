import React from 'react';
import { GameSettings } from '../game/types';
import { Play, RotateCcw, Volume2, Eye, ShieldAlert, Sparkles, X } from 'lucide-react';

interface PauseMenuProps {
  isOpen: boolean;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onResume: () => void;
  onRestart: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onResume,
  onRestart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85 backdrop-blur-md p-4 font-chakra select-none">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold tracking-wider text-neutral-100 uppercase">TACTICAL PAUSE</h2>
          </div>
          <button
            onClick={onResume}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Controls Overview */}
          <div className="bg-neutral-950/60 border border-neutral-800 p-3.5 rounded-lg">
            <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400 mb-2 font-mono-gaming">
              OPERATIONAL CONTROLS
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div className="flex justify-between py-0.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Move:</span>
                <span className="font-mono-gaming font-semibold text-neutral-200">[W][A][S][D]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Aim / Look:</span>
                <span className="font-mono-gaming font-semibold text-neutral-200">Mouse</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Shoot / Fire:</span>
                <span className="font-mono-gaming font-semibold text-neutral-200">Left Click</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Aim Down Sights:</span>
                <span className="font-mono-gaming font-semibold text-neutral-200">Right Click</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Sprint:</span>
                <span className="font-mono-gaming font-semibold text-neutral-200">[Shift]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Jump:</span>
                <span className="font-mono-gaming font-semibold text-neutral-200">[Space]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Reload:</span>
                <span className="font-mono-gaming font-semibold text-neutral-200">[R]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Switch Weapon:</span>
                <span className="font-mono-gaming font-semibold text-neutral-200">[1] [2] [3] [4] [5]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">All Weapons Auto-Shot:</span>
                <span className="font-mono-gaming font-semibold text-emerald-400">Target Lock Auto-Fire & Auto-Reload</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Frag Grenade:</span>
                <span className="font-mono-gaming font-semibold text-neutral-200">[G] / [Q]</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Combat Knife:</span>
                <span className="font-mono-gaming font-semibold text-neutral-200">[F]</span>
              </div>
            </div>
          </div>

          {/* Settings Sliders */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400 font-mono-gaming">
              SETTINGS & SENSITIVITY
            </h3>

            {/* Mouse Sensitivity */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-neutral-300">Aim & Look Sensitivity</span>
                <span className="font-mono-gaming text-amber-400">{settings.mouseSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="6.0"
                step="0.1"
                value={settings.mouseSensitivity}
                onChange={(e) => onUpdateSettings({ ...settings, mouseSensitivity: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono-gaming mt-0.5">
                <span>Precise (0.5x)</span>
                <span>Normal (1.5x)</span>
                <span>Ultra-Fast (6.0x)</span>
              </div>
            </div>

            {/* All-Weapons Auto-Shot Toggle */}
            <div className="bg-neutral-950/80 border border-neutral-800 p-3 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-200 block">All Weapons Auto-Shot & Auto-Reload</span>
                <span className="text-[11px] text-neutral-400">
                  Automatically discharges any equipped weapon when reticle locks onto a zombie or barrel, and auto-reloads
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoShoot !== false && settings.sniperAutoShot !== false}
                  onChange={(e) => onUpdateSettings({ ...settings, autoShoot: e.target.checked, sniperAutoShot: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Audio Volume */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
                  Master Sound Volume
                </span>
                <span className="font-mono-gaming text-amber-400">{Math.round(settings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.volume}
                onChange={(e) => onUpdateSettings({ ...settings, volume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Field of View */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <Eye className="w-3.5 h-3.5 text-neutral-400" />
                  Field of View (FOV)
                </span>
                <span className="font-mono-gaming text-amber-400">{settings.fov}°</span>
              </div>
              <input
                type="range"
                min="65"
                max="105"
                step="5"
                value={settings.fov}
                onChange={(e) => onUpdateSettings({ ...settings, fov: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Invert Y & Shadows Toggles */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.invertY}
                  onChange={(e) => onUpdateSettings({ ...settings, invertY: e.target.checked })}
                  className="rounded accent-amber-500 cursor-pointer"
                />
                Invert Pitch (Y-Axis)
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.shadows}
                  onChange={(e) => onUpdateSettings({ ...settings, shadows: e.target.checked })}
                  className="rounded accent-amber-500 cursor-pointer"
                />
                Real-Time Shadows
              </label>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between gap-3">
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold font-mono-gaming transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART MISSION
          </button>
          <button
            onClick={onResume}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold font-mono-gaming transition-colors cursor-pointer shadow-lg"
          >
            <Play className="w-4 h-4 fill-current" />
            RESUME COMBAT
          </button>
        </div>
      </div>
    </div>
  );
};
