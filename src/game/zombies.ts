import * as THREE from 'three';
import { ZombieDef, ZombieType } from './types';

export const ZOMBIE_DEFINITIONS: Record<ZombieType, ZombieDef> = {
  walker: {
    type: 'walker',
    name: 'Walker',
    health: 90,
    maxHealth: 90,
    speed: 0.55, // Very slow creeping shamble
    damage: 18,
    attackInterval: 1.2,
    points: 75,
    color: '#475569',
    scale: 1.0,
  },
  runner: {
    type: 'runner',
    name: 'Frenzy Runner',
    health: 65,
    maxHealth: 65,
    speed: 0.9, // Slower walk
    damage: 14,
    attackInterval: 0.95,
    points: 120,
    color: '#991b1b',
    scale: 0.95,
  },
  brute: {
    type: 'brute',
    name: 'Armored Brute',
    health: 320,
    maxHealth: 320,
    speed: 0.4, // Lumbering slow-motion footsteps
    damage: 38,
    attackInterval: 1.8,
    points: 300,
    color: '#1e293b',
    scale: 1.35,
  },
  spitter: {
    type: 'spitter',
    name: 'Toxic Spitter',
    health: 110,
    maxHealth: 110,
    speed: 0.45, // Slow creeping stalker walk
    damage: 22,
    attackInterval: 2.2,
    points: 180,
    color: '#14532d',
    scale: 1.05,
  },
};

export interface ZombieInstance {
  id: string;
  type: ZombieType;
  mesh: THREE.Group;
  headMesh: THREE.Mesh;
  headGroup: THREE.Group;
  bodyMesh: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  attackInterval: number;
  lastAttackTime: number;
  state: 'chasing' | 'attacking' | 'stagger' | 'dying' | 'dead';
  animTime: number;
  deathTime: number;
  staggerTimer: number;
  spitCooldown: number;
}

// Materials for zombies
const matFleshWalker = new THREE.MeshStandardMaterial({
  color: 0x475569, // Ashen decaying grey-blue
  roughness: 0.85,
  metalness: 0.1,
});

const matFleshRunner = new THREE.MeshStandardMaterial({
  color: 0x5b21b6, // Deep bruised purple-decay
  roughness: 0.8,
  metalness: 0.15,
});

const matFleshBrute = new THREE.MeshStandardMaterial({
  color: 0x27272a, // Leathery necrotic dark grey
  roughness: 0.9,
  metalness: 0.25,
});

const matFleshSpitter = new THREE.MeshStandardMaterial({
  color: 0x14532d, // Moldy gangrene dark green
  roughness: 0.7,
  metalness: 0.1,
});

const matClothes = new THREE.MeshStandardMaterial({
  color: 0x334155, // Tattered shirt
  roughness: 0.95,
  metalness: 0.05,
});

const matPants = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  roughness: 0.95,
  metalness: 0.05,
});

const matEyesRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
const matEyesYellow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
const matEyesToxic = new THREE.MeshBasicMaterial({ color: 0x22c55e });

const matToxicPustule = new THREE.MeshStandardMaterial({
  color: 0x4ade80,
  emissive: 0x22c55e,
  emissiveIntensity: 0.7,
  roughness: 0.3,
});

const matArmorPlate = new THREE.MeshStandardMaterial({
  color: 0x3f3f46,
  metalness: 0.8,
  roughness: 0.35,
});

/**
 * Creates 3D composite Articulated Zombie (10 parts)
 */
export function createZombie(type: ZombieType, position: THREE.Vector3, id: string): ZombieInstance {
  const def = ZOMBIE_DEFINITIONS[type];
  const root = new THREE.Group();
  root.position.copy(position);
  root.scale.setScalar(def.scale);

  const fleshMat =
    type === 'runner'
      ? matFleshRunner
      : type === 'brute'
      ? matFleshBrute
      : type === 'spitter'
      ? matFleshSpitter
      : matFleshWalker;

  // 1. Torso (Pivot at hips Y=0.9)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.9, 0);
  root.add(torsoGroup);

  const torsoGeo = new THREE.BoxGeometry(0.5, 0.65, 0.3);
  const torso = new THREE.Mesh(torsoGeo, type === 'brute' ? matClothes : matClothes);
  torso.position.set(0, 0.32, 0);
  torso.castShadow = true;
  torsoGroup.add(torso);

  // Add armor plates to Brute
  if (type === 'brute') {
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.08), matArmorPlate);
    chestPlate.position.set(0, 0.34, 0.17);
    torsoGroup.add(chestPlate);
  }

  // Add toxic pustules to Spitter
  if (type === 'spitter') {
    for (let i = 0; i < 4; i++) {
      const pustule = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), matToxicPustule);
      pustule.position.set((Math.random() - 0.5) * 0.3, 0.3 + (Math.random() - 0.5) * 0.25, -0.16);
      torsoGroup.add(pustule);
    }
  }

  // 2. Head & Glowing Eyes (Pivot at neck Y=0.68)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.68, 0.05);
  torsoGroup.add(headGroup);

  const headGeo = new THREE.BoxGeometry(0.32, 0.35, 0.32);
  const head = new THREE.Mesh(headGeo, fleshMat);
  head.position.set(0, 0.18, 0);
  head.castShadow = true;
  head.userData = { isHead: true, zombieId: id };
  headGroup.add(head);

  // Open mouth / jaw
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.16), fleshMat);
  jaw.position.set(0, 0.05, 0.1);
  jaw.userData = { isHead: true, zombieId: id };
  headGroup.add(jaw);

  // Glowing eyes
  const eyeMat = type === 'runner' ? matEyesRed : type === 'spitter' ? matEyesToxic : type === 'brute' ? matEyesYellow : matEyesRed;
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
  leftEye.position.set(-0.08, 0.22, 0.17);
  leftEye.userData = { isHead: true, zombieId: id };
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
  rightEye.position.set(0.08, 0.22, 0.17);
  rightEye.userData = { isHead: true, zombieId: id };
  headGroup.add(rightEye);

  // 3. Left Arm (Pivot at left shoulder)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.32, 0.55, 0);
  torsoGroup.add(leftArm);

  const armGeo = new THREE.BoxGeometry(0.14, 0.65, 0.14);
  const leftArmMesh = new THREE.Mesh(armGeo, fleshMat);
  leftArmMesh.position.set(0, -0.28, 0.15); // reaching forward
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);

  // 4. Right Arm (Pivot at right shoulder)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.32, 0.55, 0);
  torsoGroup.add(rightArm);

  const rightArmMesh = new THREE.Mesh(armGeo, fleshMat);
  rightArmMesh.position.set(0, -0.28, 0.15);
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);

  // Default outstretched zombie reach
  leftArm.rotation.x = -Math.PI / 3;
  rightArm.rotation.x = -Math.PI / 3;

  // 5. Left Leg (Pivot at hip)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0.9, 0);
  root.add(leftLeg);

  const legGeo = new THREE.BoxGeometry(0.18, 0.9, 0.18);
  const leftLegMesh = new THREE.Mesh(legGeo, matPants);
  leftLegMesh.position.set(0, -0.45, 0);
  leftLegMesh.castShadow = true;
  leftLeg.add(leftLegMesh);

  // 6. Right Leg (Pivot at hip)
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0.9, 0);
  root.add(rightLeg);

  const rightLegMesh = new THREE.Mesh(legGeo, matPants);
  rightLegMesh.position.set(0, -0.45, 0);
  rightLegMesh.castShadow = true;
  rightLeg.add(rightLegMesh);

  // Tag meshes for raycasting hit detection
  head.userData = { zombieId: id, isHead: true };
  torso.userData = { zombieId: id, isHead: false };
  leftArmMesh.userData = { zombieId: id, isHead: false };
  rightArmMesh.userData = { zombieId: id, isHead: false };
  leftLegMesh.userData = { zombieId: id, isHead: false };
  rightLegMesh.userData = { zombieId: id, isHead: false };

  return {
    id,
    type,
    mesh: root,
    headMesh: head,
    headGroup,
    bodyMesh: torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    health: def.health,
    maxHealth: def.maxHealth,
    speed: def.speed,
    damage: def.damage,
    attackInterval: def.attackInterval,
    lastAttackTime: 0,
    state: 'chasing',
    animTime: Math.random() * 10,
    deathTime: 0,
    staggerTimer: 0,
    spitCooldown: Math.random() * 2 + 1,
  };
}

/**
 * Updates articulated zombie walk animation, limb swings, and death ragdoll
 */
export function updateZombieAnimation(z: ZombieInstance, delta: number, isMoving: boolean) {
  if (z.state === 'dead' || z.state === 'dying') {
    z.deathTime += delta;
    // Fall backward / collapse
    if (z.mesh.rotation.x > -Math.PI / 2) {
      z.mesh.rotation.x -= delta * 3.5;
    }
    // Sink slightly into ground after a few seconds
    if (z.deathTime > 2.5) {
      z.mesh.position.y -= delta * 0.4;
    }
    return;
  }

  z.animTime += delta * Math.max(0.85, z.speed * 1.8);

  if (z.staggerTimer > 0) {
    z.staggerTimer -= delta;
    z.mesh.position.y = THREE.MathUtils.damp(z.mesh.position.y, 0, 8, delta);
    return;
  }

  if (isMoving) {
    const swing = Math.sin(z.animTime) * 0.6;
    z.leftLeg.rotation.x = swing;
    z.rightLeg.rotation.x = -swing;

    // Outstretched menacing zombie arm claw sway
    z.leftArm.rotation.x = -Math.PI / 3 + Math.sin(z.animTime * 0.8) * 0.25;
    z.rightArm.rotation.x = -Math.PI / 3 - Math.sin(z.animTime * 0.8) * 0.25;

    z.leftArm.rotation.z = Math.sin(z.animTime * 0.5) * 0.15;
    z.rightArm.rotation.z = -Math.sin(z.animTime * 0.5) * 0.15;

    // Head twitch / bob
    z.headMesh.parent!.rotation.y = Math.sin(z.animTime * 0.7) * 0.18;
    z.headMesh.parent!.rotation.x = 0.1 + Math.sin(z.animTime * 1.2) * 0.08;
  } else {
    // Idle menacing stance
    z.leftLeg.rotation.x = THREE.MathUtils.damp(z.leftLeg.rotation.x, 0, 6, delta);
    z.rightLeg.rotation.x = THREE.MathUtils.damp(z.rightLeg.rotation.x, 0, 6, delta);
    z.leftArm.rotation.x = -Math.PI / 3 + Math.sin(z.animTime * 0.5) * 0.1;
    z.rightArm.rotation.x = -Math.PI / 3 + Math.cos(z.animTime * 0.5) * 0.1;
  }
}
