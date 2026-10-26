import React, { useEffect, useState } from 'react';
import { PlayerStats, HitFeedback, KillFeedItem, GameSettings, ZombieType, WeaponId } from '../game/types';
import { WEAPON_DEFINITIONS } from '../game/weapons';
import { Shield, Heart, Crosshair, Bomb, ShoppingBag, Pause, Zap } from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  settings: GameSettings;
  hitFeedback: HitFeedback | null;
  killFeed: KillFeedItem[];
  waveIntermission: { active: boolean; seconds: number };
  zombiesOnRadar: { x: number; z: number; type: ZombieType }[];
  playerYaw: number;
  isPointerLocked?: boolean;
  onOpenArmory: () => void;
  onOpenPause: () => void;
  onSwitchWeapon: (id: WeaponId) => void;
  onThrowGrenade: () => void;
  onMelee: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  settings,
  hitFeedback,
  killFeed,
  waveIntermission,
  zombiesOnRadar,
  playerYaw,
  isPointerLocked = true,
  onOpenArmory,
  onOpenPause,
  onSwitchWeapon,
  onThrowGrenade,
  onMelee,
}) => {
  const [hitAnim, setHitAnim] = useState<HitFeedback | null>(null);

  useEffect(() => {
    if (hitFeedback) {
      setHitAnim(hitFeedback);
      const timer = setTimeout(() => setHitAnim(null), 250);
      return () => clearTimeout(timer);
    }
  }, [hitFeedback]);

  const activeDef = WEAPON_DEFINITIONS[stats.activeWeapon];
  const isLowHealth = stats.health <= 30;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-chakra">
      {/* Low Health Vignette Overlay */}
      {isLowHealth && <div className="absolute inset-0 low-health-vignette pointer-events-none" />}

      {/* Kill Streak Edge Aura Overlay */}
      {stats.activeBuffs.buffTier >= 1 && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            stats.activeBuffs.buffTier === 3
              ? 'shadow-[inset_0_0_80px_rgba(168,85,247,0.35)] ring-2 ring-inset ring-purple-500/40'
              : stats.activeBuffs.buffTier === 2
              ? 'shadow-[inset_0_0_60px_rgba(239,68,68,0.28)] ring-1 ring-inset ring-red-500/30'
              : 'shadow-[inset_0_0_40px_rgba(245,158,11,0.2)]'
          }`}
        />
      )}

      {/* Kill Streak & Active Buffs Widget */}
      {stats.killStreak > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
          <div
            className={`px-4 py-1.5 rounded-lg border flex items-center gap-3 shadow-2xl backdrop-blur-md ${
              stats.activeBuffs.buffTier === 3
                ? 'bg-purple-950/90 border-purple-500/80 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                : stats.activeBuffs.buffTier === 2
                ? 'bg-red-950/90 border-red-500/80 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : stats.activeBuffs.buffTier === 1
                ? 'bg-amber-950/90 border-amber-500/80 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-neutral-900/90 border-neutral-700/80 text-neutral-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Zap
                className={`w-4 h-4 ${
                  stats.activeBuffs.buffTier >= 2 ? 'text-yellow-400 animate-pulse' : 'text-amber-400'
                }`}
              />
              <span className="font-mono-gaming font-black text-lg tracking-wider">
                STREAK x{stats.killStreak}
              </span>
            </div>

            {stats.activeBuffs.buffName && (
              <>
                <div className="w-[1px] h-5 bg-white/20" />
                <span className="text-xs font-mono-gaming font-extrabold tracking-widest uppercase">
                  {stats.activeBuffs.buffName}
                </span>
              </>
            )}

            {/* Active Buff Badges */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono-gaming font-bold">
              {stats.activeBuffs.speedMultiplier > 1 && (
                <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/40">
                  +{Math.round((stats.activeBuffs.speedMultiplier - 1) * 100)}% SPEED
                </span>
              )}
              {stats.activeBuffs.damageMultiplier > 1 && (
                <span className="bg-red-500/25 text-red-300 px-1.5 py-0.5 rounded border border-red-500/40">
                  +{Math.round((stats.activeBuffs.damageMultiplier - 1) * 100)}% DMG
                </span>
              )}
              {stats.activeBuffs.buffTier >= 3 && (
                <span className="bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-400/40">
                  +6 HP/s REGEN
                </span>
              )}
            </div>
          </div>

          {/* Depleting Streak Timer Bar */}
          <div className="w-48 h-1.5 bg-neutral-950/80 rounded-full mt-1 overflow-hidden p-[1px] border border-neutral-800">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                stats.activeBuffs.buffTier === 3
                  ? 'bg-purple-500'
                  : stats.activeBuffs.buffTier === 2
                  ? 'bg-red-500'
                  : 'bg-amber-400'
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, (stats.streakTimer / stats.maxStreakTimer) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        {/* Left: Wave & Status */}
        <div className="flex items-center gap-3">
          <div className="bg-neutral-900/90 border border-neutral-700/80 px-4 py-2 rounded-md shadow-lg flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Protocol</span>
              <span className="text-xl font-bold tracking-wider text-red-500 font-mono-gaming">
                WAVE {stats.wave.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="w-[1px] h-8 bg-neutral-800" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Kills</span>
              <span className="text-lg font-bold text-neutral-100 font-mono-gaming">{stats.kills}</span>
            </div>
          </div>

          {/* Intermission Alert & Armory Button */}
          {waveIntermission.active && (
            <div className="bg-amber-950/85 border border-amber-500/80 px-4 py-2 rounded-md shadow-lg flex items-center gap-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-300">
                <Zap className="w-4 h-4" />
                <span className="text-xs uppercase font-bold tracking-wider">
                  SAFE REGROUP // RESUPPLY {waveIntermission.seconds}s
                </span>
              </div>
              <button
                onClick={onOpenArmory}
                className="pointer-events-auto bg-amber-500 hover:bg-amber-400 text-neutral-950 px-3 py-1 rounded text-xs font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                OPEN ARMORY [B]
              </button>
            </div>
          )}
        </div>

        {/* Center / Right: Score, Cash & Menu Buttons */}
        <div className="flex items-center gap-3">
          <div className="bg-neutral-900/90 border border-neutral-700/80 px-4 py-2 rounded-md shadow-lg flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Cash Fund</span>
              <span className="text-lg font-bold text-emerald-400 font-mono-gaming">${stats.cash}</span>
            </div>
            <div className="w-[1px] h-8 bg-neutral-800" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Combat Score</span>
              <span className="text-lg font-bold text-neutral-100 font-mono-gaming">{stats.score.toLocaleString()}</span>
            </div>
          </div>

          {/* Pause / Settings Button */}
          <button
            onClick={onOpenPause}
            className="pointer-events-auto bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-200 p-2.5 rounded-md shadow-lg cursor-pointer transition-colors"
            title="Pause & Settings [ESC]"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Kill Feed (Top-Left under header) */}
      <div className="absolute top-20 left-4 flex flex-col gap-1.5 max-w-xs z-10">
        {killFeed.slice(-4).map((kf) => (
          <div
            key={kf.id}
            className="bg-neutral-950/80 border border-neutral-800 text-neutral-200 px-3 py-1 rounded text-xs flex items-center gap-2 backdrop-blur-sm shadow"
          >
            <span className="text-neutral-400 font-mono-gaming text-[11px]">{kf.weapon}</span>
            <span className="text-red-500 font-bold">➔</span>
            <span className="font-semibold text-neutral-100">{kf.zombieType}</span>
            {kf.isHeadshot && (
              <span className="bg-red-950 text-red-400 border border-red-800 text-[10px] px-1.5 rounded font-mono-gaming font-bold">
                HEADSHOT
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Mini Radar (Top-Right under header) */}
      <div className="absolute top-20 right-4 z-10 flex flex-col items-center">
        <div className="relative w-28 h-28 rounded-full border border-emerald-500/40 bg-neutral-950/85 shadow-lg overflow-hidden flex items-center justify-center">
          {/* Radar grid circles */}
          <div className="absolute inset-2 rounded-full border border-emerald-500/20" />
          <div className="absolute inset-7 rounded-full border border-emerald-500/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-[1px] bg-emerald-500/20" />
            <div className="h-full w-[1px] bg-emerald-500/20 absolute" />
          </div>

          {/* Radar Sweep Line */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500/25 to-transparent radar-sweep-line rounded-tl-full" />
          </div>

          {/* Player Center Blip */}
          <div
            className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399] z-10"
            style={{ transform: `rotate(${-playerYaw}rad)` }}
          />

          {/* Zombie Blips relative to player distance (max 30m) */}
          {zombiesOnRadar.map((z, idx) => {
            // Rotate coordinate relative to player yaw
            const cos = Math.cos(playerYaw);
            const sin = Math.sin(playerYaw);
            const rx = z.x * cos - z.z * sin;
            const rz = z.x * sin + z.z * cos;

            const maxDist = 28;
            const normX = (rx / maxDist) * 44;
            const normY = (rz / maxDist) * 44;

            // Clamp inside radar circle
            const distSq = normX * normX + normY * normY;
            if (distSq > 46 * 46) return null;

            const isBoss = z.type === 'brute';
            return (
              <div
                key={idx}
                className={`absolute rounded-full ${
                  isBoss
                    ? 'w-2 h-2 bg-purple-500 shadow-[0_0_6px_#a855f7]'
                    : z.type === 'spitter'
                    ? 'w-1.5 h-1.5 bg-green-400 shadow-[0_0_4px_#4ade80]'
                    : 'w-1.5 h-1.5 bg-red-500 shadow-[0_0_4px_#ef4444]'
                }`}
                style={{
                  left: `calc(50% + ${normX}px - 3px)`,
                  top: `calc(50% + ${normY}px - 3px)`,
                }}
              />
            );
          })}
        </div>
        <span className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1 font-mono-gaming font-semibold">
          ZONE RADAR
        </span>
      </div>

      {/* Click-to-lock aim prompt when cursor released */}
      {!isPointerLocked && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-neutral-900/95 border border-amber-500/70 text-amber-300 px-4 py-1.5 rounded-full text-xs font-mono-gaming font-bold tracking-wider shadow-2xl flex items-center gap-2 pointer-events-none z-30">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>CLICK ANYWHERE TO LOCK MOUSE AIM</span>
        </div>
      )}

      {/* Center Reticle & Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Dynamic Hit Marker */}
        {hitAnim && (
          <div className="absolute hit-marker-anim pointer-events-none">
            {hitAnim.type === 'headshot' ? (
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 text-red-500 font-mono-gaming font-black text-3xl flex items-center justify-center drop-shadow-[0_0_12px_rgba(239,68,68,1)]">
                  ✕
                </div>
                <span className="text-[11px] font-black text-red-400 font-mono-gaming tracking-widest uppercase -mt-1 bg-red-950/90 px-2 py-0.5 rounded border border-red-700 shadow-lg whitespace-nowrap">
                  ☠ 1-SHOT HEADSHOT!
                </span>
              </div>
            ) : (
              <div className="w-6 h-6 border-2 border-neutral-100 rotate-45 opacity-80" />
            )}
          </div>
        )}

        {/* Crosshair & Sniper Scope */}
        {stats.activeWeapon === 'sniper' && stats.isAiming ? (
          /* Full Military Sniper Scope Overlay */
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            {/* Dark peripheral scope vignette */}
            <div
              className="absolute inset-0 bg-neutral-950/80"
              style={{
                maskImage: 'radial-gradient(circle at center, transparent 320px, black 340px)',
                WebkitMaskImage: 'radial-gradient(circle at center, transparent 320px, black 340px)',
              }}
            />

            {/* Scope Outer Circular Reticle Frame */}
            <div className="relative w-[620px] h-[620px] rounded-full border-2 border-emerald-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.15)]">
              {/* Scope Lens Tint */}
              <div className="absolute inset-0 rounded-full bg-emerald-950/15" />

              {/* Crosshair Main Lines */}
              <div className="absolute w-full h-[1px] bg-emerald-400/70" />
              <div className="absolute h-full w-[1px] bg-emerald-400/70" />

              {/* Mil-dot Range Ticks */}
              {[-160, -110, -60, 60, 110, 160].map((offset) => (
                <React.Fragment key={offset}>
                  <div className="absolute w-4 h-[1px] bg-emerald-400/80" style={{ transform: `translateY(${offset}px)` }} />
                  <div className="absolute h-4 w-[1px] bg-emerald-400/80" style={{ transform: `translateX(${offset}px)` }} />
                </React.Fragment>
              ))}

              {/* Center Precision Aim Point */}
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-75 ${
                  (stats.targetLocked || stats.sniperLockedTarget)
                    ? 'bg-red-500 scale-125 shadow-[0_0_12px_#ef4444]'
                    : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                }`}
              />

              {/* Target Lock Reticle Brackets */}
              {(stats.targetLocked || stats.sniperLockedTarget) && (
                <div className="absolute flex flex-col items-center">
                  <div className="w-24 h-24 border-2 border-red-500 rounded-sm animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                  <span className="text-[11px] font-mono-gaming font-extrabold tracking-widest text-red-400 bg-red-950/90 px-2 py-0.5 mt-2 rounded border border-red-800 uppercase">
                    AUTO-DISCHARGE ACTIVE
                  </span>
                </div>
              )}

              {/* Scope Ballistics HUD Text */}
              <div className="absolute top-12 left-16 text-[11px] font-mono-gaming font-bold text-emerald-400/90 space-y-0.5">
                <div>OPTIC: 8.0x TACTICAL</div>
                <div>AUTO-SHOT: {settings.autoShoot !== false ? 'ENGAGED' : 'MANUAL'}</div>
                <div>SENSITIVITY: HIGH</div>
              </div>
              <div className="absolute bottom-12 right-16 text-[11px] font-mono-gaming font-bold text-emerald-400/90 text-right space-y-0.5">
                <div>ELEV: 0.00 MIL</div>
                <div>WIND: 0.00 MPH</div>
                <div>LOCK CONE: ACTIVE</div>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Crosshair & Hipfire Auto-Shot Indicator */
          (!stats.isAiming || stats.activeWeapon === 'shotgun') && (
            <div className="relative flex items-center justify-center">
              {/* Center dot */}
              <div
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  (stats.targetLocked || stats.sniperLockedTarget) ? 'bg-red-500 scale-150 shadow-[0_0_10px_#ef4444]' : 'bg-neutral-100/90'
                }`}
              />
              {/* Crosshair lines with spread gap */}
              <div className="absolute w-[2px] h-3 bg-neutral-200/80 -top-4 rounded-full" />
              <div className="absolute w-[2px] h-3 bg-neutral-200/80 -bottom-4 rounded-full" />
              <div className="absolute h-[2px] w-3 bg-neutral-200/80 -left-4 rounded-full" />
              <div className="absolute h-[2px] w-3 bg-neutral-200/80 -right-4 rounded-full" />

              {/* Target Lock Brackets in Hipfire for ANY weapon */}
              {(stats.targetLocked || stats.sniperLockedTarget) && (
                <div className="absolute w-16 h-16 border-2 border-red-500/90 rounded-md animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.7)] flex items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-mono-gaming font-black text-red-400 bg-black/80 px-1 py-0.2 rounded uppercase absolute -top-5">
                    AUTO-FIRE
                  </span>
                </div>
              )}
            </div>
          )
        )}

        {/* All Weapons Auto-Shot Status Banner above reticle */}
        {!stats.isAiming && (
          <div className="absolute -top-12 flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-neutral-950/80 border border-emerald-500/50 text-[10px] font-mono-gaming font-bold text-emerald-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            ALL-WEAPONS AUTO-SHOT & UNLIMITED RELOAD [ACTIVE]
          </div>
        )}
      </div>

      {/* Bottom HUD Dock */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-20">
        {/* Bottom Left: Vitals (HP & Armor) */}
        <div className="flex flex-col gap-2 bg-neutral-900/90 border border-neutral-700/80 p-3.5 rounded-lg shadow-xl min-w-[240px]">
          {/* Health Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5 text-red-400">
                <Heart className="w-3.5 h-3.5 fill-current" />
                VITALITY
              </span>
              <span className="font-mono-gaming text-neutral-100">{Math.round(stats.health)} / {stats.maxHealth}</span>
            </div>
            <div className="w-full h-3 bg-neutral-950 rounded overflow-hidden p-[1px] border border-neutral-800">
              <div
                className={`h-full rounded-sm transition-all duration-150 ${
                  isLowHealth ? 'bg-red-600' : 'bg-red-500'
                }`}
                style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
              />
            </div>
          </div>

          {/* Armor Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5 text-blue-400">
                <Shield className="w-3.5 h-3.5 fill-current" />
                NANO-ARMOR
              </span>
              <span className="font-mono-gaming text-neutral-100">{Math.round(stats.armor)} / {stats.maxArmor}</span>
            </div>
            <div className="w-full h-2.5 bg-neutral-950 rounded overflow-hidden p-[1px] border border-neutral-800">
              <div
                className="h-full bg-blue-500 rounded-sm transition-all duration-150"
                style={{ width: `${(stats.armor / stats.maxArmor) * 100}%` }}
              />
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 pt-1 border-t border-neutral-800 text-[11px] text-neutral-300 font-bold">
            <button
              onClick={onThrowGrenade}
              className="pointer-events-auto flex items-center gap-1 hover:text-white transition-colors bg-neutral-800/60 px-2 py-0.5 rounded cursor-pointer"
              title="Throw Frag Grenade [G/Q]"
            >
              <Bomb className="w-3 h-3 text-amber-400" />
              <span>FRAG [G]: {stats.grenades}</span>
            </button>
            <button
              onClick={onMelee}
              className="pointer-events-auto flex items-center gap-1 hover:text-white transition-colors bg-neutral-800/60 px-2 py-0.5 rounded cursor-pointer"
              title="Combat Knife Slash [F]"
            >
              <Crosshair className="w-3 h-3 text-red-400" />
              <span>MELEE [F]</span>
            </button>
          </div>
        </div>

        {/* Center Bottom: Weapon Hotbar (All 5 weapons with keys 1-5) */}
        <div className="bg-neutral-900/90 border border-neutral-700/80 p-1.5 rounded-lg shadow-xl flex items-center gap-1.5 pointer-events-auto">
          {(['pistol', 'sniper', 'shotgun', 'rifle', 'plasma'] as const).map((wId, idx) => {
            const wDef = WEAPON_DEFINITIONS[wId];
            const isActive = stats.activeWeapon === wId;
            const isUnlocked = wDef.unlocked;
            const reserveDisplay = !isFinite(stats.reserveAmmo[wId]) || stats.reserveAmmo[wId] >= 9999 ? '∞' : stats.reserveAmmo[wId];

            return (
              <button
                key={wId}
                disabled={!isUnlocked}
                onClick={() => onSwitchWeapon(wId)}
                className={`flex flex-col items-center justify-center px-3 py-1.5 rounded transition-all cursor-pointer ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-950 font-bold shadow-md'
                    : isUnlocked
                    ? 'bg-neutral-800/70 hover:bg-neutral-800 text-neutral-300'
                    : 'bg-neutral-950/40 text-neutral-600 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-mono-gaming font-semibold">
                  <span>[{idx + 1}]</span>
                  <span className="uppercase">{wDef.name.split(' ')[0]}</span>
                </div>
                {isUnlocked ? (
                  <span className={`text-[10px] font-mono-gaming ${isActive ? 'text-neutral-700' : 'text-neutral-400'}`}>
                    {stats.ammo[wId]}/{reserveDisplay}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold text-amber-500/80">${wDef.cost}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Right: Active Weapon Ammo & Status */}
        <div className="flex flex-col items-end bg-neutral-900/90 border border-neutral-700/80 p-3.5 rounded-lg shadow-xl min-w-[210px]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
            {activeDef.category}
          </span>
          <span className="text-sm font-bold text-neutral-200">{activeDef.name}</span>

          {/* Large Ammo Readout */}
          <div className="flex items-baseline gap-2 my-1">
            <span
              className={`text-4xl font-black font-mono-gaming tracking-tight ${
                stats.ammo[stats.activeWeapon] <= Math.ceil(activeDef.maxAmmo * 0.25)
                  ? 'text-red-500'
                  : 'text-neutral-100'
              }`}
            >
              {stats.ammo[stats.activeWeapon]}
            </span>
            <span className="text-2xl font-black font-mono-gaming text-amber-400">
              / {!isFinite(stats.reserveAmmo[stats.activeWeapon]) || stats.reserveAmmo[stats.activeWeapon] >= 9999 ? '∞' : stats.reserveAmmo[stats.activeWeapon]}
            </span>
          </div>

          {/* Reload Bar / Status */}
          {stats.isReloading ? (
            <div className="w-full">
              <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold font-mono-gaming uppercase mb-0.5">
                <span>RELOADING...</span>
                <span>{Math.round(stats.reloadProgress * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-950 rounded overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${stats.reloadProgress * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-[10px] text-neutral-400 font-mono-gaming font-semibold">
              PRESS [R] TO RELOAD
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
