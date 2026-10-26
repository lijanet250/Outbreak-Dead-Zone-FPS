import * as THREE from 'three';
import { WeaponDef, WeaponId } from './types';

export const WEAPON_DEFINITIONS: Record<WeaponId, WeaponDef> = {
  pistol: {
    id: 'pistol',
    name: 'Tactical 9mm',
    category: 'Sidearm',
    damage: 34, // 3 shots body kill on walker, 1-shot headshot
    fireRate: 4.5,
    maxAmmo: 12,
    reloadTime: 1.2,
    bulletsPerShot: 1,
    spread: 0.015,
    recoil: { rotX: 0.12, posZ: 0.06 },
    range: 60,
    unlocked: true,
    cost: 0,
    description: 'Accurate semi-auto sidearm with high headshot multiplier.',
  },
  sniper: {
    id: 'sniper',
    name: 'Viper .50 Auto-Sniper',
    category: 'Sniper Rifle',
    damage: 175,
    fireRate: 3.0,
    maxAmmo: 10,
    reloadTime: 2.0,
    bulletsPerShot: 1,
    spread: 0.001, // surgical pinpoint
    recoil: { rotX: 0.35, posZ: 0.2 },
    range: 180,
    unlocked: true, // Unlocked right away so user can test the auto-shot immediately!
    cost: 0,
    description: 'High-caliber anti-material rifle with AI Auto-Shot: automatically fires the instant target enters reticle.',
  },
  shotgun: {
    id: 'shotgun',
    name: '12G Breacher',
    category: 'Shotgun',
    damage: 22, // 8 pellets = 176 total point blank!
    fireRate: 1.1,
    maxAmmo: 8,
    reloadTime: 2.2,
    bulletsPerShot: 8,
    spread: 0.075,
    recoil: { rotX: 0.32, posZ: 0.16 },
    range: 35,
    unlocked: false,
    cost: 800,
    description: 'Devastating close-range crowd control. Pulverizes zombies.',
  },
  rifle: {
    id: 'rifle',
    name: 'AR-74 Combat',
    category: 'Assault Rifle',
    damage: 42,
    fireRate: 8.5,
    maxAmmo: 30,
    reloadTime: 1.8,
    bulletsPerShot: 1,
    spread: 0.025,
    recoil: { rotX: 0.08, posZ: 0.04 },
    range: 90,
    unlocked: false,
    cost: 1500,
    description: 'Fully automatic battle rifle with high rate of fire and penetrating rounds.',
  },
  plasma: {
    id: 'plasma',
    name: 'Vortex Cannon',
    category: 'Heavy Energy',
    damage: 180, // Heavy AoE punch
    fireRate: 0.9,
    maxAmmo: 5,
    reloadTime: 2.8,
    bulletsPerShot: 1,
    spread: 0.01,
    recoil: { rotX: 0.45, posZ: 0.22 },
    range: 120,
    unlocked: false,
    cost: 3200,
    description: 'Experimental plasma launcher firing explosive concussive energy orbs.',
  },
};

// Reusable PBR Materials for weapons
const matBlackPolymer = new THREE.MeshStandardMaterial({
  color: 0x1f2326,
  roughness: 0.8,
  metalness: 0.2,
});

const matSteel = new THREE.MeshStandardMaterial({
  color: 0x4a525d,
  roughness: 0.28,
  metalness: 0.88,
});

const matDarkMetal = new THREE.MeshStandardMaterial({
  color: 0x181a1c,
  roughness: 0.45,
  metalness: 0.75,
});

const matGrip = new THREE.MeshStandardMaterial({
  color: 0x111214,
  roughness: 0.92,
  metalness: 0.05,
});

const matTritium = new THREE.MeshBasicMaterial({
  color: 0x22c55e, // Glowing green sight dot
});

const matPlasmaCyan = new THREE.MeshStandardMaterial({
  color: 0x06b6d4,
  emissive: 0x0891b2,
  emissiveIntensity: 0.9,
  roughness: 0.2,
  metalness: 0.5,
});

const matPlasmaCore = new THREE.MeshBasicMaterial({
  color: 0x67e8f9,
});

export interface WeaponModelMesh extends THREE.Group {
  muzzleFlash: THREE.Mesh;
  muzzleLight: THREE.PointLight;
  muzzleOffset: THREE.Vector3;
}

/**
 * Creates 3D composite Tactical Pistol (9 parts)
 */
export function createPistolModel(): WeaponModelMesh {
  const group = new THREE.Group() as WeaponModelMesh;

  // 1. Lower Receiver Frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.16), matBlackPolymer);
  frame.position.set(0, -0.02, 0);
  group.add(frame);

  // 2. Slide (top moving assembly)
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.055, 0.22), matSteel);
  slide.position.set(0, 0.025, -0.02);
  group.add(slide);

  // 3. Barrel & Chamber
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 12), matDarkMetal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.025, -0.12);
  group.add(barrel);

  // 4. Ergonomic Angled Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.12, 0.055), matGrip);
  grip.rotation.x = 0.22;
  grip.position.set(0, -0.08, 0.04);
  group.add(grip);

  // 5. Trigger & Guard
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.004, 6, 12, Math.PI), matSteel);
  guard.rotation.y = Math.PI / 2;
  guard.position.set(0, -0.045, -0.01);
  group.add(guard);

  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.018, 0.008), matSteel);
  trigger.rotation.x = 0.2;
  trigger.position.set(0, -0.042, -0.005);
  group.add(trigger);

  // 6. Tactical Rail (under barrel)
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.015, 0.08), matDarkMetal);
  rail.position.set(0, -0.025, -0.08);
  group.add(rail);

  // 7. Iron Sights (rear notch + front post with glowing tritium)
  const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.008), matTritium);
  frontSight.position.set(0, 0.058, -0.12);
  group.add(frontSight);

  const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.012, 0.008), matDarkMetal);
  rearSight.position.set(0, 0.058, 0.075);
  group.add(rearSight);

  // Muzzle Flash
  const flashGeo = new THREE.ConeGeometry(0.06, 0.18, 6);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffe066,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlash.rotation.x = -Math.PI / 2;
  muzzleFlash.position.set(0, 0.025, -0.28);
  muzzleFlash.visible = false;
  group.add(muzzleFlash);
  group.muzzleFlash = muzzleFlash;

  const muzzleLight = new THREE.PointLight(0xffa500, 0, 8);
  muzzleLight.position.set(0, 0.025, -0.28);
  group.add(muzzleLight);
  group.muzzleLight = muzzleLight;
  group.muzzleOffset = new THREE.Vector3(0, 0.025, -0.28);

  return group;
}

/**
 * Creates 3D composite Assault Rifle (11 parts)
 */
export function createRifleModel(): WeaponModelMesh {
  const group = new THREE.Group() as WeaponModelMesh;

  // 1. Upper & Lower Receiver
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.085, 0.28), matSteel);
  receiver.position.set(0, 0, 0);
  group.add(receiver);

  // 2. Quad Rail Handguard
  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.065, 0.32), matDarkMetal);
  handguard.position.set(0, 0.005, -0.28);
  group.add(handguard);

  // 3. Barrel & Birdcage Flash Hider
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.35, 12), matSteel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.01, -0.52);
  group.add(barrel);

  const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.06, 8), matDarkMetal);
  flashHider.rotation.x = Math.PI / 2;
  flashHider.position.set(0, 0.01, -0.71);
  group.add(flashHider);

  // 4. Curved 30-Round Magazine
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.18, 0.09), matDarkMetal);
  mag.rotation.x = -0.25;
  mag.position.set(0, -0.11, -0.06);
  group.add(mag);

  // 5. Pistol Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.06), matGrip);
  grip.rotation.x = 0.26;
  grip.position.set(0, -0.09, 0.1);
  group.add(grip);

  // 6. Tactical Stock
  const stockBuffer = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.18, 8), matSteel);
  stockBuffer.rotation.x = Math.PI / 2;
  stockBuffer.position.set(0, 0.015, 0.22);
  group.add(stockBuffer);

  const stockShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.13, 0.07), matBlackPolymer);
  stockShoulder.position.set(0, -0.01, 0.32);
  group.add(stockShoulder);

  // 7. Holographic Optic Sight
  const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.035, 0.11), matDarkMetal);
  sightBase.position.set(0, 0.06, -0.02);
  group.add(sightBase);

  const sightLens = new THREE.Mesh(
    new THREE.RingGeometry(0.01, 0.018, 12),
    new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
  );
  sightLens.position.set(0, 0.075, 0.02);
  group.add(sightLens);

  // 8. Foregrip
  const foregrip = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.1, 8), matGrip);
  foregrip.position.set(0, -0.065, -0.26);
  group.add(foregrip);

  // Muzzle Flash
  const flashGeo = new THREE.ConeGeometry(0.09, 0.26, 6);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlash.rotation.x = -Math.PI / 2;
  muzzleFlash.position.set(0, 0.01, -0.84);
  muzzleFlash.visible = false;
  group.add(muzzleFlash);
  group.muzzleFlash = muzzleFlash;

  const muzzleLight = new THREE.PointLight(0xffb703, 0, 10);
  muzzleLight.position.set(0, 0.01, -0.84);
  group.add(muzzleLight);
  group.muzzleLight = muzzleLight;
  group.muzzleOffset = new THREE.Vector3(0, 0.01, -0.84);

  return group;
}

/**
 * Creates 3D composite Combat Shotgun (9 parts)
 */
export function createShotgunModel(): WeaponModelMesh {
  const group = new THREE.Group() as WeaponModelMesh;

  // 1. Heavy Combat Receiver
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.32), matSteel);
  receiver.position.set(0, 0, 0);
  group.add(receiver);

  // 2. Heavy 12-Gauge Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.48, 12), matDarkMetal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.025, -0.38);
  group.add(barrel);

  // 3. Tubular Magazine underneath
  const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 12), matSteel);
  magTube.rotation.x = Math.PI / 2;
  magTube.position.set(0, -0.018, -0.36);
  group.add(magTube);

  // 4. Grooved Pump Slide Forend
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.18, 10), matGrip);
  pump.rotation.x = Math.PI / 2;
  pump.position.set(0, -0.018, -0.32);
  group.add(pump);

  // 5. Solid Tactical Stock
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.28), matBlackPolymer);
  stock.position.set(0, -0.03, 0.28);
  group.add(stock);

  // 6. Pistol Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.13, 0.06), matGrip);
  grip.rotation.x = 0.28;
  grip.position.set(0, -0.09, 0.12);
  group.add(grip);

  // 7. Top Heat Shield / Vented Rib
  const rib = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.012, 0.42), matSteel);
  rib.position.set(0, 0.05, -0.35);
  group.add(rib);

  // Muzzle Flash (wider blast)
  const flashGeo = new THREE.ConeGeometry(0.14, 0.32, 8);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xff9900,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlash.rotation.x = -Math.PI / 2;
  muzzleFlash.position.set(0, 0.025, -0.66);
  muzzleFlash.visible = false;
  group.add(muzzleFlash);
  group.muzzleFlash = muzzleFlash;

  const muzzleLight = new THREE.PointLight(0xff7700, 0, 12);
  muzzleLight.position.set(0, 0.025, -0.66);
  group.add(muzzleLight);
  group.muzzleLight = muzzleLight;
  group.muzzleOffset = new THREE.Vector3(0, 0.025, -0.66);

  return group;
}

/**
 * Creates 3D composite Vortex Plasma Cannon (10 parts)
 */
export function createPlasmaModel(): WeaponModelMesh {
  const group = new THREE.Group() as WeaponModelMesh;

  // 1. Cybernetic Core Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.38), matDarkMetal);
  body.position.set(0, 0, 0);
  group.add(body);

  // 2. Accelerator Rings
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.012, 8, 16), matPlasmaCyan);
    ring.position.set(0, 0.01, -0.2 - i * 0.1);
    group.add(ring);
  }

  // 3. Central Core Plasma Tube
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.36, 12), matPlasmaCore);
  tube.rotation.x = Math.PI / 2;
  tube.position.set(0, 0.01, -0.3);
  group.add(tube);

  // 4. Power Cell / Battery Pack
  const cell = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.12), matPlasmaCyan);
  cell.position.set(0, 0.07, 0.06);
  group.add(cell);

  // 5. Heavy Twin Stock
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.22), matBlackPolymer);
  stock.position.set(0, -0.02, 0.26);
  group.add(stock);

  // 6. Dual Ergonomic Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.06), matGrip);
  grip.rotation.x = 0.24;
  grip.position.set(0, -0.1, 0.08);
  group.add(grip);

  // Muzzle Flash (Cyan vortex)
  const flashGeo = new THREE.SphereGeometry(0.16, 8, 8);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlash.position.set(0, 0.01, -0.56);
  muzzleFlash.visible = false;
  group.add(muzzleFlash);
  group.muzzleFlash = muzzleFlash;

  const muzzleLight = new THREE.PointLight(0x06b6d4, 0, 14);
  muzzleLight.position.set(0, 0.01, -0.56);
  group.add(muzzleLight);
  group.muzzleLight = muzzleLight;
  group.muzzleOffset = new THREE.Vector3(0, 0.01, -0.56);

  return group;
}

/**
 * Creates 3D composite Viper .50 Auto-Sniper (12 parts)
 */
export function createSniperModel(): WeaponModelMesh {
  const group = new THREE.Group() as WeaponModelMesh;

  // 1. Heavy CNC Machined Receiver
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.082, 0.36), matDarkMetal);
  receiver.position.set(0, 0, 0);
  group.add(receiver);

  // 2. Heavy Fluted Free-Floating Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.65, 12), matSteel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.015, -0.48);
  group.add(barrel);

  // 3. Massive Dual-Baffle Muzzle Brake
  const brake = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.035, 0.09), matDarkMetal);
  brake.position.set(0, 0.015, -0.83);
  group.add(brake);

  // 4. M-LOK Handguard / Chassis
  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.06, 0.34), matBlackPolymer);
  handguard.position.set(0, 0.005, -0.26);
  group.add(handguard);

  // 5. High-Power Optical Scope Assembly
  // Main scope tube
  const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.32, 12), matDarkMetal);
  scopeTube.rotation.x = Math.PI / 2;
  scopeTube.position.set(0, 0.075, -0.04);
  group.add(scopeTube);

  // Objective bell (front wide lens housing)
  const objBell = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.018, 0.08, 12), matSteel);
  objBell.rotation.x = Math.PI / 2;
  objBell.position.set(0, 0.075, -0.22);
  group.add(objBell);

  // Emerald anti-reflective coated objective lens
  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(0.022, 12),
    new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
  );
  lens.position.set(0, 0.075, -0.261);
  group.add(lens);

  // Ocular bell (rear eyepiece)
  const ocularBell = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.07, 12), matSteel);
  ocularBell.rotation.x = Math.PI / 2;
  ocularBell.position.set(0, 0.075, 0.14);
  group.add(ocularBell);

  // Elevation turret on top
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.025, 8), matSteel);
  turret.position.set(0, 0.096, -0.04);
  group.add(turret);

  // 6. Extended 10-Round .50 BMG Box Magazine
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.16, 0.095), matDarkMetal);
  mag.position.set(0, -0.1, -0.04);
  group.add(mag);

  // 7. Ergonomic Precision Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.13, 0.055), matGrip);
  grip.rotation.x = 0.22;
  grip.position.set(0, -0.09, 0.12);
  group.add(grip);

  // 8. Skeletonized Precision Sniper Stock
  const stockBar = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.04, 0.26), matSteel);
  stockBar.position.set(0, 0.01, 0.3);
  group.add(stockBar);

  const cheekRest = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.055, 0.14), matBlackPolymer);
  cheekRest.position.set(0, 0.045, 0.26);
  group.add(cheekRest);

  const buttpad = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.15, 0.04), matGrip);
  buttpad.position.set(0, -0.02, 0.42);
  group.add(buttpad);

  // 9. Folded Tactical Bipod Legs under forend
  const bipodMount = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.04), matDarkMetal);
  bipodMount.position.set(0, -0.03, -0.4);
  group.add(bipodMount);

  const bipodLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 6), matSteel);
  bipodLeft.rotation.x = Math.PI / 2;
  bipodLeft.position.set(-0.022, -0.04, -0.48);
  group.add(bipodLeft);

  const bipodRight = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 6), matSteel);
  bipodRight.rotation.x = Math.PI / 2;
  bipodRight.position.set(0.022, -0.04, -0.48);
  group.add(bipodRight);

  // Muzzle Flash
  const flashGeo = new THREE.ConeGeometry(0.11, 0.38, 8);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xfff080,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlash.rotation.x = -Math.PI / 2;
  muzzleFlash.position.set(0, 0.015, -0.98);
  muzzleFlash.visible = false;
  group.add(muzzleFlash);
  group.muzzleFlash = muzzleFlash;

  const muzzleLight = new THREE.PointLight(0xffdf40, 0, 14);
  muzzleLight.position.set(0, 0.015, -0.98);
  group.add(muzzleLight);
  group.muzzleLight = muzzleLight;
  group.muzzleOffset = new THREE.Vector3(0, 0.015, -0.98);

  return group;
}
