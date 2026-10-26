import React from 'react';
import { PlayerStats, WeaponId } from '../game/types';
import { WEAPON_DEFINITIONS } from '../game/weapons';
import { ShoppingBag, Shield, Heart, Crosshair, Check, Lock, X } from 'lucide-react';

interface ArmoryModalProps {
  stats: PlayerStats;
  isOpen: boolean;
  onClose: () => void;
  onUpgradeWeapon: (id: WeaponId) => void;
  onBuyAmmo: (id: WeaponId) => void;
  onBuyArmor: () => void;
  onBuyHealth: () => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({
  stats,
  isOpen,
  onClose,
  onUpgradeWeapon,
  onBuyAmmo,
  onBuyArmor,
  onBuyHealth,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm p-4 font-chakra select-none">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide text-neutral-100 uppercase">Field Armory & Resupply</h2>
              <p className="text-xs text-neutral-400 font-mono-gaming">Upgrade arsenal and purchase critical survival munitions</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="text-xs text-neutral-400 uppercase font-semibold">Available Funds:</span>
              <span className="text-lg font-bold text-emerald-400 font-mono-gaming">${stats.cash}</span>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Resupply section */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-3 font-mono-gaming">
              Emergency Survival Supplies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Medical Refill */}
              <div className="bg-neutral-950/70 border border-neutral-800 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-950/60 border border-red-800/80 rounded text-red-400">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-100">Military Medikit</h4>
                    <p className="text-xs text-neutral-400">Restores Vitality to 100%</p>
                  </div>
                </div>
                <button
                  disabled={stats.cash < 100 || stats.health >= stats.maxHealth}
                  onClick={onBuyHealth}
                  className={`px-3 py-1.5 rounded text-xs font-bold font-mono-gaming transition-colors cursor-pointer ${
                    stats.health >= stats.maxHealth
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : stats.cash < 100
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                  }`}
                >
                  {stats.health >= stats.maxHealth ? 'FULL' : 'BUY $100'}
                </button>
              </div>

              {/* Nano Armor Repair */}
              <div className="bg-neutral-950/70 border border-neutral-800 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-950/60 border border-blue-800/80 rounded text-blue-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-100">Kevlar Plate Insert</h4>
                    <p className="text-xs text-neutral-400">Restores Shield to 100%</p>
                  </div>
                </div>
                <button
                  disabled={stats.cash < 120 || stats.armor >= stats.maxArmor}
                  onClick={onBuyArmor}
                  className={`px-3 py-1.5 rounded text-xs font-bold font-mono-gaming transition-colors cursor-pointer ${
                    stats.armor >= stats.maxArmor
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : stats.cash < 120
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                  }`}
                >
                  {stats.armor >= stats.maxArmor ? 'FULL' : 'BUY $120'}
                </button>
              </div>
            </div>
          </div>

          {/* Weapon Roster */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-3 font-mono-gaming">
              Weapon Arsenal & Caliber Ammo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['pistol', 'sniper', 'shotgun', 'rifle', 'plasma'] as const).map((wId) => {
                const w = WEAPON_DEFINITIONS[wId];
                const isUnlocked = w.unlocked;

                return (
                  <div
                    key={wId}
                    className={`border rounded-lg p-4 flex flex-col justify-between transition-all ${
                      isUnlocked
                        ? 'bg-neutral-950/80 border-neutral-800'
                        : 'bg-neutral-950/40 border-neutral-800/60 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                            {w.category}
                          </span>
                          <span className="text-neutral-500">•</span>
                          <span className="text-sm font-bold text-neutral-100">{w.name}</span>
                        </div>
                        {isUnlocked ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono-gaming font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                            <Check className="w-3 h-3" />
                            UNLOCKED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-mono-gaming font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
                            <Lock className="w-3 h-3" />
                            ${w.cost}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-400 mb-3">{w.description}</p>

                      {/* Weapon Specs */}
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono-gaming bg-neutral-900/60 p-2 rounded mb-3">
                        <div>
                          <span className="text-neutral-500 block">DAMAGE</span>
                          <span className="font-bold text-neutral-200">{w.damage}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">RATE</span>
                          <span className="font-bold text-neutral-200">{w.fireRate}/s</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">MAG CAP</span>
                          <span className="font-bold text-neutral-200">{w.maxAmmo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                      {isUnlocked ? (
                        <button
                          disabled={stats.cash < 80}
                          onClick={() => onBuyAmmo(wId)}
                          className={`flex-1 py-1.5 rounded text-xs font-bold font-mono-gaming transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                            stats.cash < 80
                              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
                          }`}
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                          +AMMO (+$80)
                        </button>
                      ) : (
                        <button
                          disabled={stats.cash < w.cost}
                          onClick={() => onUpgradeWeapon(wId)}
                          className={`flex-1 py-1.5 rounded text-xs font-bold font-mono-gaming transition-colors cursor-pointer ${
                            stats.cash < w.cost
                              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                          }`}
                        >
                          PURCHASE WEAPON [${w.cost}]
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400 font-mono-gaming">
          <span>HINT: Resupply between waves to survive higher hordes!</span>
          <button
            onClick={onClose}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-1.5 rounded font-bold cursor-pointer transition-colors"
          >
            RETURN TO BATTLE [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
