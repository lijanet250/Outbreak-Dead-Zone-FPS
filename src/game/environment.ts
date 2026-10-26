import * as THREE from 'three';
import {
  createFloorTexture,
  createWallTexture,
  createContainerTexture,
  createBarrelTexture,
  createSupplyCrateTexture,
} from './proceduralTextures';

export interface Obstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
}

export interface ExplosiveBarrel {
  id: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  health: number;
  isExploded: boolean;
}

export interface EnvironmentData {
  sceneGroup: THREE.Group;
  obstacles: Obstacle[];
  explosiveBarrels: ExplosiveBarrel[];
  spawnPoints: THREE.Vector3[];
}

export function buildEnvironment(): EnvironmentData {
  const sceneGroup = new THREE.Group();
  const obstacles: Obstacle[] = [];
  const explosiveBarrels: ExplosiveBarrel[] = [];
  const spawnPoints: THREE.Vector3[] = [];

  const arenaSize = 64; // -32 to +32
  const wallHeight = 5.5;

  // 1. Ground Plane
  const floorGeo = new THREE.PlaneGeometry(arenaSize + 20, arenaSize + 20);
  const floorMat = new THREE.MeshStandardMaterial({
    map: createFloorTexture(),
    roughness: 0.85,
    metalness: 0.2,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  sceneGroup.add(floor);

  // 2. Perimeter Reinforced Walls
  const wallMat = new THREE.MeshStandardMaterial({
    map: createWallTexture(),
    roughness: 0.9,
    metalness: 0.3,
  });

  const wallThickness = 1.5;
  const half = arenaSize / 2;

  // North & South walls
  const nsWallGeo = new THREE.BoxGeometry(arenaSize, wallHeight, wallThickness);
  const northWall = new THREE.Mesh(nsWallGeo, wallMat);
  northWall.position.set(0, wallHeight / 2, -half);
  northWall.castShadow = true;
  northWall.receiveShadow = true;
  sceneGroup.add(northWall);
  obstacles.push({ minX: -half, maxX: half, minZ: -half - wallThickness / 2, maxZ: -half + wallThickness / 2, height: wallHeight });

  const southWall = new THREE.Mesh(nsWallGeo, wallMat);
  southWall.position.set(0, wallHeight / 2, half);
  southWall.castShadow = true;
  southWall.receiveShadow = true;
  sceneGroup.add(southWall);
  obstacles.push({ minX: -half, maxX: half, minZ: half - wallThickness / 2, maxZ: half + wallThickness / 2, height: wallHeight });

  // East & West walls
  const ewWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, arenaSize);
  const eastWall = new THREE.Mesh(ewWallGeo, wallMat);
  eastWall.position.set(half, wallHeight / 2, 0);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  sceneGroup.add(eastWall);
  obstacles.push({ minX: half - wallThickness / 2, maxX: half + wallThickness / 2, minZ: -half, maxZ: half, height: wallHeight });

  const westWall = new THREE.Mesh(ewWallGeo, wallMat);
  westWall.position.set(-half, wallHeight / 2, 0);
  westWall.castShadow = true;
  westWall.receiveShadow = true;
  sceneGroup.add(westWall);
  obstacles.push({ minX: -half - wallThickness / 2, maxX: -half + wallThickness / 2, minZ: -half, maxZ: half, height: wallHeight });

  // 3. Shipping Containers (Industrial cover)
  const containerBlueMat = new THREE.MeshStandardMaterial({
    map: createContainerTexture('#1e3a5f'),
    roughness: 0.65,
    metalness: 0.4,
  });
  const containerRustMat = new THREE.MeshStandardMaterial({
    map: createContainerTexture('#7c2d12'),
    roughness: 0.75,
    metalness: 0.35,
  });
  const containerGreenMat = new THREE.MeshStandardMaterial({
    map: createContainerTexture('#14532d'),
    roughness: 0.7,
    metalness: 0.4,
  });

  const containerConfigs = [
    { x: -12, z: -10, rotY: 0, w: 3, h: 2.8, d: 7, mat: containerBlueMat },
    { x: 14, z: -12, rotY: Math.PI / 4, w: 3, h: 2.8, d: 7, mat: containerRustMat },
    { x: -14, z: 12, rotY: -Math.PI / 6, w: 3, h: 2.8, d: 7, mat: containerGreenMat },
    { x: 12, z: 14, rotY: Math.PI / 2, w: 3, h: 2.8, d: 7, mat: containerBlueMat },
    { x: 0, z: -18, rotY: Math.PI / 2, w: 3, h: 2.8, d: 7, mat: containerRustMat },
  ];

  containerConfigs.forEach((c) => {
    const geo = new THREE.BoxGeometry(c.w, c.h, c.d);
    const mesh = new THREE.Mesh(geo, c.mat);
    mesh.position.set(c.x, c.h / 2, c.z);
    mesh.rotation.y = c.rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sceneGroup.add(mesh);

    // Approximate AABB for obstacle
    const maxDim = Math.max(c.w, c.d) * 0.6;
    obstacles.push({
      minX: c.x - maxDim,
      maxX: c.x + maxDim,
      minZ: c.z - maxDim,
      maxZ: c.z + maxDim,
      height: c.h,
    });
  });

  // 4. Concrete Roadblock Barriers & Sandbags
  const barrierMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.9,
    metalness: 0.1,
  });

  const barriers = [
    { x: -4, z: -4, w: 4, h: 1.1, d: 0.8 },
    { x: 5, z: 4, w: 4, h: 1.1, d: 0.8 },
    { x: -6, z: 6, w: 0.8, h: 1.1, d: 4 },
    { x: 6, z: -6, w: 0.8, h: 1.1, d: 4 },
  ];

  barriers.forEach((b) => {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const mesh = new THREE.Mesh(geo, barrierMat);
    mesh.position.set(b.x, b.h / 2, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sceneGroup.add(mesh);
    obstacles.push({
      minX: b.x - b.w / 2,
      maxX: b.x + b.w / 2,
      minZ: b.z - b.d / 2,
      maxZ: b.z + b.d / 2,
      height: b.h,
    });
  });

  // 5. Explosive Red Barrels
  const barrelMat = new THREE.MeshStandardMaterial({
    map: createBarrelTexture(),
    roughness: 0.45,
    metalness: 0.6,
  });

  const barrelPositions = [
    new THREE.Vector3(-10, 0, -6),
    new THREE.Vector3(-10.8, 0, -6),
    new THREE.Vector3(10, 0, -8),
    new THREE.Vector3(8, 0, 10),
    new THREE.Vector3(-8, 0, 10),
    new THREE.Vector3(0, 0, -14),
    new THREE.Vector3(16, 0, 2),
    new THREE.Vector3(-18, 0, -2),
  ];

  barrelPositions.forEach((pos, idx) => {
    const barrelGroup = new THREE.Group();
    barrelGroup.position.copy(pos);

    const barrelGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.1, 16);
    const barrelMesh = new THREE.Mesh(barrelGeo, barrelMat);
    barrelMesh.position.y = 0.55;
    barrelMesh.castShadow = true;
    barrelMesh.receiveShadow = true;
    barrelGroup.add(barrelMesh);

    // Rim top
    const rimGeo = new THREE.TorusGeometry(0.38, 0.03, 8, 16);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, metalness: 0.8, roughness: 0.3 });
    const topRim = new THREE.Mesh(rimGeo, rimMat);
    topRim.rotation.x = Math.PI / 2;
    topRim.position.y = 1.1;
    barrelGroup.add(topRim);

    // Tag for bullet hits
    const barrelId = `barrel_${idx}`;
    barrelMesh.userData = { isBarrel: true, barrelId };

    sceneGroup.add(barrelGroup);

    explosiveBarrels.push({
      id: barrelId,
      mesh: barrelGroup,
      position: pos.clone(),
      health: 30,
      isExploded: false,
    });

    obstacles.push({
      minX: pos.x - 0.4,
      maxX: pos.x + 0.4,
      minZ: pos.z - 0.4,
      maxZ: pos.z + 0.4,
      height: 1.1,
    });
  });

  // 6. Corner Floodlight Towers
  const towerPositions = [
    { x: -28, z: -28 },
    { x: 28, z: -28 },
    { x: -28, z: 28 },
    { x: 28, z: 28 },
  ];

  const towerMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8, roughness: 0.4 });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfffae6 });

  towerPositions.forEach((tp) => {
    const tower = new THREE.Group();
    tower.position.set(tp.x, 0, tp.z);

    // Mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 9, 8), towerMat);
    mast.position.y = 4.5;
    mast.castShadow = true;
    tower.add(mast);

    // Platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(2, 0.25, 2), towerMat);
    platform.position.y = 9;
    tower.add(platform);

    // Floodlight housing
    const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.7, 8), towerMat);
    lamp.rotation.x = Math.PI / 3;
    lamp.position.set(0, 9.3, 0);
    tower.add(lamp);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), lampMat);
    bulb.position.set(0, 9.1, 0.3);
    tower.add(bulb);

    // SpotLight shining down into arena
    const spotLight = new THREE.SpotLight(0xfffae6, 2.5, 45, Math.PI / 4, 0.4, 1.2);
    spotLight.position.set(tp.x, 9.5, tp.z);
    spotLight.target.position.set(tp.x * 0.4, 0, tp.z * 0.4);
    sceneGroup.add(spotLight.target);
    spotLight.castShadow = true;
    spotLight.shadow.bias = -0.0005;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    sceneGroup.add(spotLight);

    sceneGroup.add(tower);

    obstacles.push({
      minX: tp.x - 1,
      maxX: tp.x + 1,
      minZ: tp.z - 1,
      maxZ: tp.z + 1,
      height: 9,
    });
  });

  // 7. Zombie Spawn Portals / Infiltration Points along perimeter edges
  spawnPoints.push(
    new THREE.Vector3(-26, 0, -26),
    new THREE.Vector3(0, 0, -28),
    new THREE.Vector3(26, 0, -26),
    new THREE.Vector3(-28, 0, 0),
    new THREE.Vector3(28, 0, 0),
    new THREE.Vector3(-26, 0, 26),
    new THREE.Vector3(0, 0, 28),
    new THREE.Vector3(26, 0, 26),
    new THREE.Vector3(-18, 0, -18),
    new THREE.Vector3(18, 0, 18)
  );

  return {
    sceneGroup,
    obstacles,
    explosiveBarrels,
    spawnPoints,
  };
}

/**
 * Creates visual 3D supply drop crate mesh
 */
export function createSupplyDropMesh(type: 'ammo' | 'health'): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    map: createSupplyCrateTexture(type),
    roughness: 0.5,
    metalness: 0.2,
  });

  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), mat);
  crate.position.y = 0.3;
  crate.castShadow = true;
  group.add(crate);

  // Beacon pillar light
  const beaconColor = type === 'health' ? 0x22c55e : 0xeab308;
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 3, 8),
    new THREE.MeshBasicMaterial({ color: beaconColor, transparent: true, opacity: 0.4 })
  );
  beacon.position.y = 1.5;
  group.add(beacon);

  const light = new THREE.PointLight(beaconColor, 1.2, 6);
  light.position.y = 0.8;
  group.add(light);

  return group;
}
