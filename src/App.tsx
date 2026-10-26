import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FPSEngine } from './game/engine';
import { PlayerStats, GameSettings, HitFeedback, KillFeedItem, WeaponId, ZombieType } from './game/types';
import { HUD } from './components/HUD';
import { ArmoryModal } from './components/ArmoryModal';
import { PauseMenu } from './components/PauseMenu';
import { GameOverModal } from './components/GameOverModal';
import { StartScreen } from './components/StartScreen';
import { TouchControls } from './components/TouchControls';
import { sounds } from './game/audio';

const DEFAULT_SETTINGS: GameSettings = {
  mouseSensitivity: 1.5,
  volume: 0.7,
  fov: 75,
  shadows: true,
  invertY: false,
  crosshairStyle: 'cross',
  showDamageNumbers: true,
  sniperAutoShot: true,
  autoShoot: true,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<FPSEngine | null>(null);

  // Game UI State
  const [isStarted, setIsStarted] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  const [stats, setStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 100,
    score: 0,
    cash: 100,
    kills: 0,
    headshots: 0,
    shotsFired: 0,
    shotsHit: 0,
    wave: 1,
    isAlive: true,
    activeWeapon: 'sniper',
    ammo: { pistol: 12, sniper: 10, shotgun: 8, rifle: 30, plasma: 5 },
    reserveAmmo: { pistol: 60, sniper: 30, shotgun: 24, rifle: 120, plasma: 10 },
    isReloading: false,
    reloadProgress: 0,
    isAiming: false,
    grenades: 2,
    sniperLockedTarget: false,
    targetLocked: false,
    killStreak: 0,
    maxKillStreak: 0,
    streakTimer: 0,
    maxStreakTimer: 4.5,
    activeBuffs: {
      speedMultiplier: 1.0,
      damageMultiplier: 1.0,
      buffTier: 0,
      buffName: '',
    },
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('outbreak_fps_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [hitFeedback, setHitFeedback] = useState<HitFeedback | null>(null);
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);
  const [waveIntermission, setWaveIntermission] = useState<{ active: boolean; seconds: number }>({
    active: false,
    seconds: 0,
  });
  const [zombiesOnRadar, setZombiesOnRadar] = useState<{ x: number; z: number; type: ZombieType }[]>([]);
  const [playerYaw, setPlayerYaw] = useState<number>(0);

  // Initialize engine
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new FPSEngine(
      canvasMountRef.current,
      {
        onStatsUpdate: (newStats) => setStats(newStats),
        onHit: (feedback) => setHitFeedback(feedback),
        onKillFeed: (item) => {
          setKillFeed((prev) => [...prev.slice(-5), item]);
        },
        onWaveChange: (waveNum, isIntermission, intermissionSec) => {
          setWaveIntermission({ active: isIntermission, seconds: intermissionSec });
        },
        onGameOver: () => {
          setIsGameOver(true);
          if (document.pointerLockElement) {
            try {
              document.exitPointerLock();
            } catch {
              // ignore
            }
          }
        },
      },
      settings
    );

    engineRef.current = engine;
    engine.start();

    const handleLockUpdate = () => {
      setIsPointerLocked(document.pointerLockElement !== null);
    };
    document.addEventListener('pointerlockchange', handleLockUpdate);

    // Radar interval updates (4 times a second for smooth performance)
    const radarInterval = window.setInterval(() => {
      if (engineRef.current) {
        setZombiesOnRadar(engineRef.current.getZombiesForRadar());
        setPlayerYaw(engineRef.current.getPlayerYaw());
      }
    }, 250);

    return () => {
      document.removeEventListener('pointerlockchange', handleLockUpdate);
      window.clearInterval(radarInterval);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update engine settings when settings change
  const handleUpdateSettings = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('outbreak_fps_settings', JSON.stringify(newSettings));
    } catch {
      // ignore
    }
    if (engineRef.current) {
      engineRef.current.applySettings(newSettings);
    }
  }, []);

  // Global key bindings for Pause [ESC] and Armory [B]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (isArmoryOpen) {
          setIsArmoryOpen(false);
          if (engineRef.current) engineRef.current.setPaused(false);
        } else if (!isGameOver && isStarted) {
          setIsPauseOpen((prev) => {
            const next = !prev;
            if (engineRef.current) engineRef.current.setPaused(next);
            return next;
          });
        }
      } else if (e.code === 'KeyB') {
        if (!isGameOver && isStarted && !isPauseOpen) {
          setIsArmoryOpen((prev) => {
            const next = !prev;
            if (engineRef.current) engineRef.current.setPaused(next);
            return next;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isArmoryOpen, isPauseOpen, isGameOver, isStarted]);

  // Start mission handler
  const handleStartMission = () => {
    setIsStarted(true);
    sounds.playGunshot('pistol'); // warms audio context
    if (engineRef.current) {
      engineRef.current.requestPointerLock();
    }
  };

  // Resume game handler
  const handleResume = () => {
    setIsPauseOpen(false);
    setIsArmoryOpen(false);
    if (engineRef.current) {
      engineRef.current.setPaused(false);
      engineRef.current.requestPointerLock();
    }
  };

  // Restart game handler
  const handleRestart = () => {
    setIsGameOver(false);
    setIsPauseOpen(false);
    setIsArmoryOpen(false);
    if (engineRef.current) {
      engineRef.current.setPaused(false);
      engineRef.current.restart();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-chakra">
      {/* 3D WebGL Canvas Mount (Isolated dedicated ref container per Three.js guidelines) */}
      <div
        ref={canvasMountRef}
        onClick={() => {
          if (isStarted && !isPauseOpen && !isArmoryOpen && !isGameOver && engineRef.current) {
            engineRef.current.requestPointerLock();
          }
        }}
        className="w-full h-full cursor-crosshair"
      />

      {/* Start Screen Briefing */}
      {!isStarted && <StartScreen onStart={handleStartMission} />}

      {/* Active Game HUD */}
      {isStarted && (
        <HUD
          stats={stats}
          settings={settings}
          hitFeedback={hitFeedback}
          killFeed={killFeed}
          waveIntermission={waveIntermission}
          zombiesOnRadar={zombiesOnRadar}
          playerYaw={playerYaw}
          isPointerLocked={isPointerLocked}
          onOpenArmory={() => {
            setIsArmoryOpen(true);
            if (engineRef.current) engineRef.current.setPaused(true);
          }}
          onOpenPause={() => {
            setIsPauseOpen(true);
            if (engineRef.current) engineRef.current.setPaused(true);
          }}
          onSwitchWeapon={(id: WeaponId) => engineRef.current?.switchWeapon(id)}
          onThrowGrenade={() => engineRef.current?.throwGrenade()}
          onMelee={() => engineRef.current?.meleeAttack()}
        />
      )}

      {/* Touch Controls for mobile/tablets */}
      {isStarted && !isPauseOpen && !isArmoryOpen && !isGameOver && (
        <TouchControls
          onMove={(x, y) => engineRef.current?.setTouchMove(x, y)}
          onLook={(dx, dy) => engineRef.current?.applyTouchLook(dx, dy)}
          onFire={(firing) => engineRef.current?.setTouchFire(firing)}
          onAim={(aiming) => engineRef.current?.setTouchAim(aiming)}
          onJump={() => {
            if (engineRef.current) {
              const event = new KeyboardEvent('keydown', { code: 'Space' });
              window.dispatchEvent(event);
            }
          }}
          onReload={() => {
            if (engineRef.current) {
              const event = new KeyboardEvent('keydown', { code: 'KeyR' });
              window.dispatchEvent(event);
            }
          }}
        />
      )}

      {/* Armory Modal */}
      <ArmoryModal
        stats={stats}
        isOpen={isArmoryOpen}
        onClose={handleResume}
        onUpgradeWeapon={(id: WeaponId) => engineRef.current?.upgradeWeapon(id)}
        onBuyAmmo={(id: WeaponId) => engineRef.current?.buyAmmo(id)}
        onBuyArmor={() => engineRef.current?.buyArmor()}
        onBuyHealth={() => engineRef.current?.buyHealth()}
      />

      {/* Pause & Settings Modal */}
      <PauseMenu
        isOpen={isPauseOpen}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResume={handleResume}
        onRestart={handleRestart}
      />

      {/* Game Over Modal */}
      <GameOverModal
        stats={stats}
        isOpen={isGameOver}
        onRestart={handleRestart}
      />
    </div>
  );
}
