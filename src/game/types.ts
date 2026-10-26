export type WeaponId = 'pistol' | 'sniper' | 'rifle' | 'shotgun' | 'plasma';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  category: string;
  damage: number;
  fireRate: number; // shots per second
  maxAmmo: number;
  reloadTime: number; // seconds
  bulletsPerShot: number;
  spread: number; // radians
  recoil: {
    rotX: number;
    posZ: number;
  };
  range: number;
  unlocked: boolean;
  cost: number;
  description: string;
}

export type ZombieType = 'walker' | 'runner' | 'brute' | 'spitter';

export interface ZombieDef {
  type: ZombieType;
  name: string;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  attackInterval: number; // seconds
  points: number;
  color: string;
  scale: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  score: number;
  cash: number;
  kills: number;
  headshots: number;
  shotsFired: number;
  shotsHit: number;
  wave: number;
  isAlive: boolean;
  activeWeapon: WeaponId;
  ammo: Record<WeaponId, number>; // current clip
  reserveAmmo: Record<WeaponId, number>; // total ammo reserve
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  isAiming: boolean;
  grenades: number;
  sniperLockedTarget: boolean; // backward-compat alias for targetLocked
  targetLocked: boolean; // true when any weapon's target-acquisition sensor locks on
  killStreak: number;
  maxKillStreak: number;
  streakTimer: number; // seconds remaining in current kill streak window
  maxStreakTimer: number; // base duration (e.g. 4.5s)
  activeBuffs: {
    speedMultiplier: number;
    damageMultiplier: number;
    buffTier: number; // 0: None, 1: Adrenaline, 2: Overcharge, 3: Apocalypse
    buffName: string;
  };
}

export interface GameSettings {
  mouseSensitivity: number;
  volume: number;
  fov: number;
  shadows: boolean;
  invertY: boolean;
  crosshairStyle: 'dot' | 'cross' | 'circle';
  showDamageNumbers: boolean;
  sniperAutoShot: boolean; // Auto-trigger shot when crosshair aligns with zombie
  autoShoot: boolean; // Auto-trigger fire on target lock for ALL weapons
}

export interface HitFeedback {
  type: 'hit' | 'headshot' | 'kill';
  damage: number;
  x?: number;
  y?: number;
  z?: number;
}

export interface KillFeedItem {
  id: string;
  weapon: string;
  zombieType: string;
  isHeadshot: boolean;
  time: number;
}

export interface DropItem {
  id: string;
  type: 'health' | 'ammo' | 'armor' | 'nuke';
  x: number;
  z: number;
}
