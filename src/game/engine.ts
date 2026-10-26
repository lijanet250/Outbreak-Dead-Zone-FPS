import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  WeaponId,
  PlayerStats,
  GameSettings,
  HitFeedback,
  KillFeedItem,
  ZombieType,
} from './types';
import { WEAPON_DEFINITIONS, createPistolModel, createSniperModel, createRifleModel, createShotgunModel, createPlasmaModel, WeaponModelMesh } from './weapons';
import { createZombie, updateZombieAnimation, ZombieInstance, ZOMBIE_DEFINITIONS } from './zombies';
import { buildEnvironment, EnvironmentData, createSupplyDropMesh } from './environment';
import { ParticleManager } from './particles';
import { sounds } from './audio';

export class FPSEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private particleManager: ParticleManager;
  private isSoftwareGl: boolean = false;

  // Environment & physics
  private envData: EnvironmentData;
  private clock: THREE.Clock;
  private animationFrameId: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Player state
  private playerPos = new THREE.Vector3(0, 1.7, 0);
  private playerVel = new THREE.Vector3(0, 0, 0);
  private playerYaw = 0;
  private playerPitch = 0;
  private isGrounded = true;

  // Stats
  private stats: PlayerStats;
  private settings: GameSettings;

  // Weapon Rigs & Mesh
  private weaponRig: THREE.Group;
  private weaponMeshes: Record<WeaponId, WeaponModelMesh>;
  private currentWeaponMesh: WeaponModelMesh;
  private isAiming = false;
  private isFiring = false;
  private lastFireTime = 0;
  private reloadTimer = 0;
  private weaponRecoilOffset = new THREE.Vector3();
  private weaponRecoilRot = new THREE.Vector3();
  private weaponSwitchProgress = 1;
  private pendingWeaponId: WeaponId | null = null;
  private walkBobTimer = 0;

  // Zombies & Spawning
  private zombies: ZombieInstance[] = [];
  private wave: number = 1;
  private zombiesToSpawn: ZombieType[] = [];
  private spawnCooldown: number = 0;
  private isWaveIntermission: boolean = false;
  private intermissionTimer: number = 0;

  // Pickups
  private pickups: { mesh: THREE.Group; type: 'ammo' | 'health'; position: THREE.Vector3; id: string }[] = [];

  // Input state
  private keys: Record<string, boolean> = {};
  private mouseDelta = { x: 0, y: 0 };
  public isPointerLocked = false;

  // Grenade & Melee
  private grenadesInFlight: { mesh: THREE.Mesh; pos: THREE.Vector3; vel: THREE.Vector3; timer: number }[] = [];

  // Callbacks
  private onStatsUpdate: (stats: PlayerStats) => void;
  private onHit: (feedback: HitFeedback) => void;
  private onKillFeed: (item: KillFeedItem) => void;
  private onWaveChange: (wave: number, isIntermission: boolean, intermissionSec: number) => void;
  private onGameOver: () => void;

  constructor(
    container: HTMLElement,
    callbacks: {
      onStatsUpdate: (stats: PlayerStats) => void;
      onHit: (feedback: HitFeedback) => void;
      onKillFeed: (item: KillFeedItem) => void;
      onWaveChange: (wave: number, isIntermission: boolean, intermissionSec: number) => void;
      onGameOver: () => void;
    },
    settings: GameSettings
  ) {
    this.container = container;
    this.onStatsUpdate = callbacks.onStatsUpdate;
    this.onHit = callbacks.onHit;
    this.onKillFeed = callbacks.onKillFeed;
    this.onWaveChange = callbacks.onWaveChange;
    this.onGameOver = callbacks.onGameOver;
    this.settings = settings;

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Initial player stats
    this.stats = {
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
      activeWeapon: 'sniper', // Start or equip sniper so user immediately sees auto-shot!
      ammo: {
        pistol: WEAPON_DEFINITIONS.pistol.maxAmmo,
        sniper: WEAPON_DEFINITIONS.sniper.maxAmmo,
        shotgun: WEAPON_DEFINITIONS.shotgun.maxAmmo,
        rifle: WEAPON_DEFINITIONS.rifle.maxAmmo,
        plasma: WEAPON_DEFINITIONS.plasma.maxAmmo,
      },
      reserveAmmo: {
        pistol: Infinity,
        sniper: Infinity,
        shotgun: Infinity,
        rifle: Infinity,
        plasma: Infinity,
      },
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
    };

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090b10);
    this.scene.fog = new THREE.FogExp2(0x090b10, 0.022);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(
      settings.fov,
      container.clientWidth / container.clientHeight,
      0.05,
      250
    );
    this.camera.position.copy(this.playerPos);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && settings.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Procedural Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Rig (Key moonlight + Fill hemisphere)
    const moonKeyLight = new THREE.DirectionalLight(0x94a3b8, 1.4);
    moonKeyLight.position.set(20, 30, -20);
    moonKeyLight.castShadow = !this.isSoftwareGl && settings.shadows;
    moonKeyLight.shadow.mapSize.width = 2048;
    moonKeyLight.shadow.mapSize.height = 2048;
    moonKeyLight.shadow.camera.near = 0.5;
    moonKeyLight.shadow.camera.far = 120;
    const d = 35;
    moonKeyLight.shadow.camera.left = -d;
    moonKeyLight.shadow.camera.right = d;
    moonKeyLight.shadow.camera.top = d;
    moonKeyLight.shadow.camera.bottom = -d;
    moonKeyLight.shadow.bias = -0.0005;
    moonKeyLight.shadow.normalBias = 0.02;
    this.scene.add(moonKeyLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.6);
    this.scene.add(hemiLight);

    // Red alert beacon in center
    const centerAlert = new THREE.PointLight(0xef4444, 1.2, 18);
    centerAlert.position.set(0, 3.5, 0);
    this.scene.add(centerAlert);

    // 6. Build Environment
    this.envData = buildEnvironment();
    this.scene.add(this.envData.sceneGroup);

    // 7. Particle Manager
    this.particleManager = new ParticleManager(this.scene);

    // 8. Weapon Rig (Child of camera for first-person view)
    this.weaponRig = new THREE.Group();
    this.camera.add(this.weaponRig);
    this.scene.add(this.camera);

    this.weaponMeshes = {
      pistol: createPistolModel(),
      sniper: createSniperModel(),
      rifle: createRifleModel(),
      shotgun: createShotgunModel(),
      plasma: createPlasmaModel(),
    };

    Object.values(this.weaponMeshes).forEach((m) => {
      this.weaponRig.add(m);
      m.visible = false;
    });

    this.currentWeaponMesh = this.weaponMeshes.sniper;
    this.currentWeaponMesh.visible = true;

    // Clock
    this.clock = new THREE.Clock();

    // Bind event listeners
    this.bindEvents();

    // Start wave 1
    this.initWave(1);
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);

    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    document.addEventListener('pointerlockerror', this.handlePointerLockError);
  }

  public unbindEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    document.removeEventListener('pointerlockerror', this.handlePointerLockError);
  }

  private lastPointerLockExitTime = 0;
  private pointerLockPendingTimeout: number | null = null;

  public requestPointerLock() {
    if (this.isPointerLocked) return;

    // Check browser rate-limiting cooldown (~1200ms after exit)
    const timeSinceExit = performance.now() - this.lastPointerLockExitTime;
    if (timeSinceExit < 1200) {
      if (this.pointerLockPendingTimeout === null) {
        const remaining = Math.max(100, Math.ceil(1200 - timeSinceExit) + 50);
        this.pointerLockPendingTimeout = window.setTimeout(() => {
          this.pointerLockPendingTimeout = null;
          if (!this.isPointerLocked && !this.isPaused && this.stats.isAlive) {
            this.executePointerLock();
          }
        }, remaining);
      }
      return;
    }

    this.executePointerLock();
  }

  private executePointerLock() {
    if (this.isPointerLocked || this.isPaused) return;
    try {
      const res = this.container.requestPointerLock() as unknown;
      if (res && typeof (res as Promise<void>).catch === 'function') {
        (res as Promise<void>).catch(() => {
          // Gracefully handle browser security rate-limiting without throwing
          this.lastPointerLockExitTime = performance.now();
        });
      }
    } catch {
      // Gracefully handle synchronous DOMException on rapid re-entry
      this.lastPointerLockExitTime = performance.now();
    }
  }

  private handlePointerLockChange = () => {
    const wasLocked = this.isPointerLocked;
    this.isPointerLocked = document.pointerLockElement === this.container;
    if (wasLocked && !this.isPointerLocked) {
      this.lastPointerLockExitTime = performance.now();
    }
  };

  private handlePointerLockError = () => {
    // Record timestamp so cooldown is respected
    this.lastPointerLockExitTime = performance.now();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    if (e.code === 'KeyR') {
      this.startReload();
    } else if (e.code === 'Digit1') {
      this.switchWeapon('pistol');
    } else if (e.code === 'Digit2') {
      this.switchWeapon('sniper');
    } else if (e.code === 'Digit3') {
      if (WEAPON_DEFINITIONS.shotgun.unlocked) this.switchWeapon('shotgun');
    } else if (e.code === 'Digit4') {
      if (WEAPON_DEFINITIONS.rifle.unlocked) this.switchWeapon('rifle');
    } else if (e.code === 'Digit5') {
      if (WEAPON_DEFINITIONS.plasma.unlocked) this.switchWeapon('plasma');
    } else if (e.code === 'KeyG' || e.code === 'KeyQ') {
      this.throwGrenade();
    } else if (e.code === 'KeyF') {
      this.meleeAttack();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (!this.isPointerLocked) {
      this.requestPointerLock();
      return;
    }
    if (e.button === 0) {
      this.isFiring = true;
    } else if (e.button === 2) {
      e.preventDefault();
      this.isAiming = true;
      this.stats.isAiming = true;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isFiring = false;
    } else if (e.button === 2) {
      e.preventDefault();
      this.isAiming = false;
      this.stats.isAiming = false;
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;
    // High-sensitivity mouse response
    const sens = this.settings.mouseSensitivity * (this.isAiming ? 0.0035 : 0.0048);
    this.playerYaw -= e.movementX * sens;
    const invert = this.settings.invertY ? -1 : 1;
    this.playerPitch -= e.movementY * sens * invert;
    this.playerPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.playerPitch));
  };

  private handleResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public applySettings(settings: GameSettings) {
    this.settings = settings;
    this.camera.fov = settings.fov;
    this.camera.updateProjectionMatrix();
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && settings.shadows;
    sounds.setVolume(settings.volume);
  }

  public getStats(): PlayerStats {
    return this.stats;
  }

  // Upgrade player in Armory
  public upgradeWeapon(id: WeaponId) {
    const w = WEAPON_DEFINITIONS[id];
    if (this.stats.cash >= w.cost && !w.unlocked) {
      this.stats.cash -= w.cost;
      w.unlocked = true;
      this.switchWeapon(id);
      this.onStatsUpdate({ ...this.stats });
      sounds.playPickup();
    }
  }

  public buyAmmo(id: WeaponId) {
    // Ammo is unlimited! Refresh clip instantly and play confirmation audio
    this.stats.ammo[id] = WEAPON_DEFINITIONS[id].maxAmmo;
    this.onStatsUpdate({ ...this.stats });
    sounds.playPickup();
  }

  public buyArmor() {
    const cost = 120;
    if (this.stats.cash >= cost && this.stats.armor < this.stats.maxArmor) {
      this.stats.cash -= cost;
      this.stats.armor = this.stats.maxArmor;
      this.onStatsUpdate({ ...this.stats });
      sounds.playPickup();
    }
  }

  public buyHealth() {
    const cost = 100;
    if (this.stats.cash >= cost && this.stats.health < this.stats.maxHealth) {
      this.stats.cash -= cost;
      this.stats.health = this.stats.maxHealth;
      this.onStatsUpdate({ ...this.stats });
      sounds.playPickup();
    }
  }

  public switchWeapon(id: WeaponId) {
    if (this.stats.activeWeapon === id || !WEAPON_DEFINITIONS[id].unlocked) return;
    this.pendingWeaponId = id;
    this.weaponSwitchProgress = 0; // Trigger drop animation
  }

  private completeWeaponSwitch(id: WeaponId) {
    this.currentWeaponMesh.visible = false;
    this.stats.activeWeapon = id;
    this.currentWeaponMesh = this.weaponMeshes[id];
    this.currentWeaponMesh.visible = true;
    this.stats.isReloading = false;
    this.reloadTimer = 0;
    this.onStatsUpdate({ ...this.stats });
  }

  private startReload() {
    const active = this.stats.activeWeapon;
    const def = WEAPON_DEFINITIONS[active];
    // Unlimited reload: reload anytime clip is not completely full
    if (this.stats.isReloading || this.stats.ammo[active] >= def.maxAmmo) {
      return;
    }
    this.stats.isReloading = true;
    this.reloadTimer = def.reloadTime;
    sounds.playReload();
    this.onStatsUpdate({ ...this.stats });
  }

  private updateReload(delta: number) {
    if (!this.stats.isReloading) return;
    // Buffed reload speed when Frenzy/Apocalypse streak is active
    const reloadSpeedMult = this.stats.activeBuffs.buffTier >= 2 ? 1.4 : 1.0;
    this.reloadTimer -= delta * reloadSpeedMult;
    const active = this.stats.activeWeapon;
    const def = WEAPON_DEFINITIONS[active];
    this.stats.reloadProgress = 1 - Math.max(0, this.reloadTimer / def.reloadTime);

    if (this.reloadTimer <= 0) {
      // Unlimited reload: fully refill weapon to maximum clip capacity
      this.stats.ammo[active] = def.maxAmmo;
      this.stats.isReloading = false;
      this.stats.reloadProgress = 0;
      this.onStatsUpdate({ ...this.stats });
    }
  }

  // Shoot weapon
  private shoot() {
    const now = performance.now() / 1000;
    const activeId = this.stats.activeWeapon;
    const def = WEAPON_DEFINITIONS[activeId];

    if (now - this.lastFireTime < 1 / def.fireRate) return;
    if (this.stats.isReloading) return;

    if (this.stats.ammo[activeId] <= 0) {
      this.startReload();
      this.lastFireTime = now;
      return;
    }

    this.lastFireTime = now;
    this.stats.ammo[activeId]--;
    this.stats.shotsFired += def.bulletsPerShot;
    this.onStatsUpdate({ ...this.stats });

    // UNLIMITED AUTO-RELOAD: When clip empties, immediately start reload with zero manual input!
    if (this.stats.ammo[activeId] <= 0) {
      setTimeout(() => {
        if (!this.stats.isReloading && this.stats.isAlive && this.stats.activeWeapon === activeId) {
          this.startReload();
        }
      }, activeId === 'sniper' ? 80 : 120);
    }

    // Audio
    sounds.playGunshot(activeId);

    // Weapon recoil
    this.weaponRecoilRot.x += def.recoil.rotX * (this.isAiming ? 0.4 : 1.0);
    this.weaponRecoilOffset.z += def.recoil.posZ * (this.isAiming ? 0.5 : 1.0);

    // Dynamic Muzzle Flash Effect (Punchy illumination & starburst geometry)
    const flashMesh = this.currentWeaponMesh.muzzleFlash;
    const flashLight = this.currentWeaponMesh.muzzleLight;
    if (flashMesh && flashLight) {
      flashMesh.visible = true;
      flashMesh.rotation.z = Math.random() * Math.PI * 2;
      flashMesh.scale.setScalar(0.9 + Math.random() * 0.4);
      const intensity =
        activeId === 'sniper' ? 5.5 :
        activeId === 'plasma' ? 5.0 :
        activeId === 'shotgun' ? 4.5 :
        activeId === 'rifle' ? 3.8 : 3.0;
      flashLight.intensity = intensity;
      setTimeout(() => {
        if (this.currentWeaponMesh) {
          flashMesh.visible = false;
          flashLight.intensity = 0;
        }
      }, 50);
    }

    // Shoot raycasts
    const muzzleWorld = new THREE.Vector3();
    this.currentWeaponMesh.muzzleFlash.getWorldPosition(muzzleWorld);

    for (let i = 0; i < def.bulletsPerShot; i++) {
      this.fireBullet(muzzleWorld, def);
    }
  }

  private fireBullet(muzzleWorld: THREE.Vector3, def: typeof WEAPON_DEFINITIONS[WeaponId]) {
    const spreadAngle = this.isAiming ? def.spread * 0.4 : def.spread;
    const spreadX = (Math.random() - 0.5) * spreadAngle;
    const spreadY = (Math.random() - 0.5) * spreadAngle;

    const raycaster = new THREE.Raycaster();
    // Center of screen + spread
    raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), this.camera);
    raycaster.far = def.range;

    // Collect raycast targets: zombie meshes & environment obstacles & barrels
    const targets: THREE.Object3D[] = [];
    this.zombies.forEach((z) => {
      if (z.state !== 'dead' && z.state !== 'dying') {
        targets.push(z.headMesh, z.bodyMesh);
      }
    });

    this.envData.explosiveBarrels.forEach((b) => {
      if (!b.isExploded) {
        targets.push(b.mesh);
      }
    });

    targets.push(this.envData.sceneGroup);

    const intersects = raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitPoint = hit.point;
      const normal = hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0);

      // Bullet tracer
      this.particleManager.addTracer(muzzleWorld, hitPoint, def.id === 'plasma');

      // Check what was hit
      let obj: THREE.Object3D | null = hit.object;
      let hitZombieId: string | null = null;
      let isHead = false;
      let hitBarrelId: string | null = null;

      while (obj && obj !== this.scene) {
        if (obj.userData?.zombieId) {
          hitZombieId = obj.userData.zombieId;
          isHead = !!obj.userData.isHead;
          break;
        }
        if (obj.userData?.barrelId) {
          hitBarrelId = obj.userData.barrelId;
          break;
        }
        obj = obj.parent;
      }

      if (hitZombieId) {
        this.stats.shotsHit++;
        const zombie = this.zombies.find((z) => z.id === hitZombieId);
        if (zombie && zombie.state !== 'dead' && zombie.state !== 'dying') {
          let dmg = def.damage;
          if (isHead) {
            // 1-SHOT HEADSHOT KILL: Instantly lethal cranial trauma!
            dmg = Math.max(zombie.health, 9999);
            this.stats.headshots++;
          }
          this.damageZombie(zombie, dmg, isHead, hitPoint, normal);
        }
      } else if (hitBarrelId) {
        const barrel = this.envData.explosiveBarrels.find((b) => b.id === hitBarrelId);
        if (barrel && !barrel.isExploded) {
          barrel.health -= def.damage;
          this.particleManager.spawnSparks(hitPoint, normal, 8);
          if (barrel.health <= 0) {
            this.detonateBarrel(barrel);
          }
        }
      } else {
        // Hit wall or ground
        this.particleManager.spawnSparks(hitPoint, normal, 6);
      }

      // If plasma weapon, deal AoE splash damage at hit point
      if (def.id === 'plasma') {
        this.dealAreaDamage(hitPoint, 5.0, 140);
        this.particleManager.spawnExplosion(hitPoint, 3);
        sounds.playExplosion();
      }
    } else {
      // Bullet tracer to max range
      const endPoint = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(def.range));
      this.particleManager.addTracer(muzzleWorld, endPoint, def.id === 'plasma');
    }
  }

  // Detonate explosive barrel
  private detonateBarrel(barrel: typeof this.envData.explosiveBarrels[0]) {
    barrel.isExploded = true;
    barrel.mesh.visible = false;
    this.particleManager.spawnExplosion(barrel.position, 5);
    sounds.playExplosion();
    this.dealAreaDamage(barrel.position, 7.5, 280);
  }

  // Area of effect damage
  private dealAreaDamage(center: THREE.Vector3, radius: number, damage: number) {
    this.zombies.forEach((z) => {
      if (z.state === 'dead' || z.state === 'dying') return;
      const dist = z.mesh.position.distanceTo(center);
      if (dist <= radius) {
        const falloff = 1 - dist / radius;
        const dmg = Math.round(damage * falloff);
        this.damageZombie(z, dmg, false, z.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), new THREE.Vector3(0, 1, 0));
      }
    });

    // Also damage other barrels in radius (chain reaction)
    this.envData.explosiveBarrels.forEach((b) => {
      if (!b.isExploded && b.position.distanceTo(center) <= radius) {
        this.detonateBarrel(b);
      }
    });
  }

  // Damage zombie
  private damageZombie(
    z: ZombieInstance,
    damage: number,
    isHeadshot: boolean,
    hitPoint: THREE.Vector3,
    normal: THREE.Vector3
  ) {
    if (isHeadshot) {
      // 1-HEADSHOT KILL: Instant death!
      z.health = 0;
      // Visceral cranial pop / decapitation
      if (z.headGroup) {
        z.headGroup.visible = false;
      }
      // Massive cranial blood burst
      this.particleManager.spawnBlood(hitPoint, normal, 28);
    } else {
      // Apply active damage streak buff (1.0x, 1.5x, 2.0x)
      const buffedDamage = Math.round(damage * this.stats.activeBuffs.damageMultiplier);
      z.health -= buffedDamage;
      this.particleManager.spawnBlood(hitPoint, normal, 10);
    }

    z.staggerTimer = 0.15;

    // Audio hit marker
    sounds.playHitMarker(isHeadshot);

    // UI Feedback
    this.onHit({
      type: isHeadshot ? 'headshot' : 'hit',
      damage: isHeadshot ? 999 : Math.round(damage * this.stats.activeBuffs.damageMultiplier),
    });

    if (z.health <= 0) {
      this.killZombie(z, isHeadshot);
    } else {
      sounds.playZombieGroan(z.type);
    }
  }

  // Kill zombie
  private killZombie(z: ZombieInstance, isHeadshot: boolean) {
    z.state = 'dying';
    this.stats.kills++;
    const def = ZOMBIE_DEFINITIONS[z.type];
    const points = def.points * (isHeadshot ? 2 : 1);
    this.stats.score += points;
    this.stats.cash += Math.round(points * 0.4);

    sounds.playZombieDie();

    // Kill Streak System (Successive kills refresh combo window)
    this.stats.killStreak++;
    this.stats.streakTimer = 4.5; // 4.5s combo timer window
    this.stats.maxKillStreak = Math.max(this.stats.maxKillStreak, this.stats.killStreak);

    const prevTier = this.stats.activeBuffs.buffTier;
    let newTier = 0;
    let buffName = '';
    let speedMultiplier = 1.0;
    let damageMultiplier = 1.0;

    if (this.stats.killStreak >= 8) {
      newTier = 3;
      buffName = 'APOCALYPSE // GODLIKE';
      speedMultiplier = 1.6; // +60% movement speed!
      damageMultiplier = 2.0; // DOUBLE DAMAGE!
    } else if (this.stats.killStreak >= 5) {
      newTier = 2;
      buffName = 'FRENZY // OVERCHARGE';
      speedMultiplier = 1.45; // +45% movement speed
      damageMultiplier = 1.5; // +50% weapon damage
    } else if (this.stats.killStreak >= 3) {
      newTier = 1;
      buffName = 'RAMPAGE // ADRENALINE';
      speedMultiplier = 1.3; // +30% movement speed
      damageMultiplier = 1.0;
    }

    this.stats.activeBuffs = {
      buffTier: newTier,
      buffName,
      speedMultiplier,
      damageMultiplier,
    };

    if (newTier > prevTier) {
      sounds.playStreakTierUp(newTier);
    }

    this.onKillFeed({
      id: Math.random().toString(),
      weapon: WEAPON_DEFINITIONS[this.stats.activeWeapon].name,
      zombieType: def.name,
      isHeadshot,
      time: Date.now(),
    });

    // Supply drop chance (12%)
    if (Math.random() < 0.12) {
      this.spawnPickup(z.mesh.position.clone());
    }

    this.onStatsUpdate({ ...this.stats });
    this.checkWaveProgress();
  }

  // Throw Grenade
  public throwGrenade() {
    if (this.stats.grenades <= 0) return;
    this.stats.grenades--;
    this.onStatsUpdate({ ...this.stats });

    const geo = new THREE.SphereGeometry(0.12, 8, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.5, metalness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(this.camera.position);
    this.scene.add(mesh);

    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const vel = dir.clone().multiplyScalar(18);
    vel.y += 3.5;

    this.grenadesInFlight.push({
      mesh,
      pos: mesh.position,
      vel,
      timer: 1.5,
    });
  }

  // Melee Knife slash
  public meleeAttack() {
    sounds.playMeleeSwing();
    // Hit close zombies
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const reach = 2.4;

    this.zombies.forEach((z) => {
      if (z.state === 'dead' || z.state === 'dying') return;
      const toZombie = z.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)).sub(this.camera.position);
      if (toZombie.length() < reach && toZombie.normalize().dot(dir) > 0.6) {
        this.damageZombie(z, 140, false, z.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)), new THREE.Vector3(0, 1, 0));
      }
    });
  }

  // Pickups
  private spawnPickup(pos: THREE.Vector3) {
    const type = Math.random() < 0.5 ? 'health' : 'ammo';
    const mesh = createSupplyDropMesh(type);
    mesh.position.set(pos.x, 0, pos.z);
    this.scene.add(mesh);

    this.pickups.push({
      mesh,
      type,
      position: mesh.position,
      id: Math.random().toString(),
    });
  }

  // Wave Manager
  private initWave(waveNumber: number) {
    this.wave = waveNumber;
    this.stats.wave = waveNumber;
    this.zombiesToSpawn = [];

    // Scale zombie horde composition - reduced for better tactical flow
    const count = Math.max(3, 3 + waveNumber * 2);
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      if (waveNumber >= 4 && rand < 0.15) {
        this.zombiesToSpawn.push('brute');
      } else if (waveNumber >= 3 && rand < 0.3) {
        this.zombiesToSpawn.push('spitter');
      } else if (waveNumber >= 2 && rand < 0.55) {
        this.zombiesToSpawn.push('runner');
      } else {
        this.zombiesToSpawn.push('walker');
      }
    }

    sounds.playWaveAlarm();
    this.onWaveChange(this.wave, false, 0);
    this.onStatsUpdate({ ...this.stats });
  }

  private checkWaveProgress() {
    const activeZombies = this.zombies.filter((z) => z.state !== 'dead' && z.state !== 'dying');
    if (this.zombiesToSpawn.length === 0 && activeZombies.length === 0 && !this.isWaveIntermission) {
      this.isWaveIntermission = true;
      this.intermissionTimer = 9.0;
      this.stats.score += 500;
      this.stats.cash += 250;
      sounds.playPickup();
      this.onWaveChange(this.wave, true, Math.ceil(this.intermissionTimer));
      this.onStatsUpdate({ ...this.stats });
    }
  }

  // Touch look / move inputs for mobile
  public applyTouchLook(dx: number, dy: number) {
    const sens = this.settings.mouseSensitivity * 0.0065;
    this.playerYaw -= dx * sens;
    const invert = this.settings.invertY ? -1 : 1;
    this.playerPitch -= dy * sens * invert;
    this.playerPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.playerPitch));
  }

  public setTouchMove(x: number, y: number) {
    this.touchMoveVector.set(x, 0, y);
  }
  private touchMoveVector = new THREE.Vector3();

  public setTouchAim(aiming: boolean) {
    this.isAiming = aiming;
    this.stats.isAiming = aiming;
  }

  public setTouchFire(firing: boolean) {
    this.isFiring = firing;
  }

  // Update Game Loop
  private update(delta: number) {
    if (this.isPaused || !this.stats.isAlive) return;

    // 0. Update Kill Streak Timer & Temporary Buffs
    if (this.stats.streakTimer > 0) {
      this.stats.streakTimer -= delta;

      // Tier 3: Apocalypse Vital Regeneration (+6 HP/sec)
      if (this.stats.activeBuffs.buffTier >= 3 && this.stats.health < this.stats.maxHealth) {
        this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + 6 * delta);
      }

      // Combo window expired
      if (this.stats.streakTimer <= 0) {
        this.stats.streakTimer = 0;
        if (this.stats.killStreak >= 3) {
          sounds.playStreakExpired();
        }
        this.stats.killStreak = 0;
        this.stats.activeBuffs = {
          speedMultiplier: 1.0,
          damageMultiplier: 1.0,
          buffTier: 0,
          buffName: '',
        };
        this.onStatsUpdate({ ...this.stats });
      }
    }

    // Auto-reload active weapon when magazine is depleted (Unlimited Reload)
    const activeWep = this.stats.activeWeapon;
    if (
      this.stats.ammo[activeWep] <= 0 &&
      !this.stats.isReloading
    ) {
      this.startReload();
    }

    // 1. Player Movement & Physics
    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.x += 1;

    // Apply touch joystick input if active
    if (this.touchMoveVector.lengthSq() > 0.01) {
      moveDir.add(this.touchMoveVector);
    }

    const isMoving = moveDir.lengthSq() > 0.01;
    const isSprinting = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && isMoving && !this.isAiming;
    // Apply temporary speed buff from active kill streak (1.0x, 1.3x, 1.45x, 1.6x)
    const baseSpeed = (isSprinting ? 9.2 : 5.4) * this.stats.activeBuffs.speedMultiplier;

    if (isMoving) {
      moveDir.normalize();
      // Rotate movement relative to player yaw
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerYaw);
      this.playerPos.x += moveDir.x * baseSpeed * delta;
      this.playerPos.z += moveDir.z * baseSpeed * delta;

      // Weapon walk bobbing
      this.walkBobTimer += delta * (isSprinting ? 14 : 9);
    } else {
      this.walkBobTimer += delta * 2;
    }

    // Jump & Gravity
    if (this.keys['Space'] && this.isGrounded) {
      this.playerVel.y = 5.2;
      this.isGrounded = false;
    }

    this.playerVel.y -= 16 * delta; // Gravity
    this.playerPos.y += this.playerVel.y * delta;

    if (this.playerPos.y <= 1.7) {
      this.playerPos.y = 1.7;
      this.playerVel.y = 0;
      this.isGrounded = true;
    }

    // Collision with Arena Obstacles
    const playerRadius = 0.45;
    this.envData.obstacles.forEach((obs) => {
      if (
        this.playerPos.x + playerRadius > obs.minX &&
        this.playerPos.x - playerRadius < obs.maxX &&
        this.playerPos.z + playerRadius > obs.minZ &&
        this.playerPos.z - playerRadius < obs.maxZ
      ) {
        // Resolve penetration along smallest axis
        const dx1 = obs.maxX - (this.playerPos.x - playerRadius);
        const dx2 = this.playerPos.x + playerRadius - obs.minX;
        const dz1 = obs.maxZ - (this.playerPos.z - playerRadius);
        const dz2 = this.playerPos.z + playerRadius - obs.minZ;

        const minOverlap = Math.min(dx1, dx2, dz1, dz2);
        if (minOverlap === dx1) this.playerPos.x = obs.maxX + playerRadius;
        else if (minOverlap === dx2) this.playerPos.x = obs.minX - playerRadius;
        else if (minOverlap === dz1) this.playerPos.z = obs.maxZ + playerRadius;
        else if (minOverlap === dz2) this.playerPos.z = obs.minZ - playerRadius;
      }
    });

    // Update Camera Transform
    this.camera.position.copy(this.playerPos);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.playerYaw;
    this.camera.rotation.x = this.playerPitch;

    // Smooth FOV zoom (magnified sniper scope when aiming)
    const targetFov = this.stats.activeWeapon === 'sniper' && this.isAiming ? 26 : this.settings.fov;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 18, delta);
      this.camera.updateProjectionMatrix();
    }

    // 2. Weapon Rig Animation & ADS Smoothing
    const hipPos = new THREE.Vector3(0.2, -0.22, -0.42);
    const adsPos = new THREE.Vector3(0, -0.155, -0.32);
    const targetPos = this.isAiming ? adsPos : hipPos;

    // Bobbing offset
    const bobX = isMoving && !this.isAiming ? Math.sin(this.walkBobTimer * 0.5) * 0.015 : Math.sin(this.walkBobTimer) * 0.002;
    const bobY = isMoving && !this.isAiming ? Math.abs(Math.sin(this.walkBobTimer)) * 0.02 : Math.cos(this.walkBobTimer * 0.8) * 0.003;

    // Smooth weapon switch drop
    if (this.weaponSwitchProgress < 1) {
      this.weaponSwitchProgress += delta * 4;
      if (this.weaponSwitchProgress >= 0.5 && this.pendingWeaponId) {
        this.completeWeaponSwitch(this.pendingWeaponId);
        this.pendingWeaponId = null;
      }
    }
    const switchDropY = Math.sin(this.weaponSwitchProgress * Math.PI) * -0.35;

    // Damping weapon recoil
    this.weaponRecoilRot.x = THREE.MathUtils.damp(this.weaponRecoilRot.x, 0, 16, delta);
    this.weaponRecoilOffset.z = THREE.MathUtils.damp(this.weaponRecoilOffset.z, 0, 16, delta);

    this.weaponRig.position.x = THREE.MathUtils.damp(this.weaponRig.position.x, targetPos.x + bobX, 18, delta);
    this.weaponRig.position.y = THREE.MathUtils.damp(this.weaponRig.position.y, targetPos.y + bobY + switchDropY, 18, delta);
    this.weaponRig.position.z = THREE.MathUtils.damp(this.weaponRig.position.z, targetPos.z + this.weaponRecoilOffset.z, 18, delta);

    this.weaponRig.rotation.x = this.weaponRecoilRot.x;

    // All Weapons Auto-Shot Target Acquisition & Auto-Trigger
    const activeId = this.stats.activeWeapon;
    const activeDef = WEAPON_DEFINITIONS[activeId];
    const isAutoShootEnabled = this.settings.autoShoot !== false && this.settings.sniperAutoShot !== false;
    let isTargetLocked = false;

    if (
      isAutoShootEnabled &&
      !this.stats.isReloading &&
      this.stats.ammo[activeId] > 0
    ) {
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      const camPos = this.camera.position;

      // Effective range and sensitivity cone tailored per weapon
      const maxRange = activeDef.range;
      let lockThreshold = 0.985;
      if (activeId === 'sniper') {
        lockThreshold = this.isAiming ? 0.993 : 0.988;
      } else if (activeId === 'shotgun') {
        lockThreshold = this.isAiming ? 0.970 : 0.955;
      } else if (activeId === 'rifle') {
        lockThreshold = this.isAiming ? 0.988 : 0.980;
      } else {
        lockThreshold = this.isAiming ? 0.988 : 0.980;
      }

      // Scan all active zombies with generous high-sensitivity detection cone
      for (const z of this.zombies) {
        if (z.state === 'dead' || z.state === 'dying') continue;

        // Head check
        const headPos = new THREE.Vector3();
        z.headMesh.getWorldPosition(headPos);
        const toHead = headPos.clone().sub(camPos);
        const distHead = toHead.length();

        // Body check
        const bodyPos = new THREE.Vector3();
        z.bodyMesh.getWorldPosition(bodyPos);
        const toBody = bodyPos.clone().sub(camPos);
        const distBody = toBody.length();

        if (distHead < maxRange || distBody < maxRange) {
          toHead.normalize();
          toBody.normalize();

          const dotHead = camDir.dot(toHead);
          const dotBody = camDir.dot(toBody);

          if (dotHead >= lockThreshold || dotBody >= lockThreshold) {
            isTargetLocked = true;
            break;
          }
        }
      }

      // Check explosive barrels
      if (!isTargetLocked) {
        for (const b of this.envData.explosiveBarrels) {
          if (b.isExploded) continue;
          const barrelPos = b.position.clone().add(new THREE.Vector3(0, 0.55, 0));
          const toBarrel = barrelPos.sub(camPos);
          const dist = toBarrel.length();
          if (dist < maxRange) {
            toBarrel.normalize();
            if (camDir.dot(toBarrel) >= lockThreshold) {
              isTargetLocked = true;
              break;
            }
          }
        }
      }

      if (isTargetLocked && !this.stats.targetLocked) {
        sounds.playTargetLock();
      }

      if (this.stats.targetLocked !== isTargetLocked || this.stats.sniperLockedTarget !== isTargetLocked) {
        this.stats.targetLocked = isTargetLocked;
        this.stats.sniperLockedTarget = isTargetLocked;
        this.onStatsUpdate({ ...this.stats });
      }

      // INSTANT HIGH-SENSITIVITY AUTO-SHOT FOR ALL WEAPONS
      if (isTargetLocked) {
        const now = performance.now() / 1000;
        if (now - this.lastFireTime >= 1 / activeDef.fireRate) {
          this.shoot();
        }
      }
    } else {
      if (this.stats.targetLocked || this.stats.sniperLockedTarget) {
        this.stats.targetLocked = false;
        this.stats.sniperLockedTarget = false;
        this.onStatsUpdate({ ...this.stats });
      }
    }

    // 3. Manual Shooting (Holding trigger)
    if (this.isFiring) {
      this.shoot();
    }

    // Reload progress
    this.updateReload(delta);

    // 4. Wave Intermission Countdown
    if (this.isWaveIntermission) {
      this.intermissionTimer -= delta;
      this.onWaveChange(this.wave, true, Math.ceil(this.intermissionTimer));
      if (this.intermissionTimer <= 0) {
        this.isWaveIntermission = false;
        this.initWave(this.wave + 1);
      }
    }

    // 5. Zombie Spawning (paced and capped to reduce zombie overcrowding)
    const activeZombiesCount = this.zombies.filter((z) => z.state !== 'dead' && z.state !== 'dying').length;
    const maxConcurrentZombies = Math.min(5, 3 + Math.floor(this.wave * 0.5));
    this.spawnCooldown -= delta;
    if (this.spawnCooldown <= 0 && this.zombiesToSpawn.length > 0 && activeZombiesCount < maxConcurrentZombies) {
      const type = this.zombiesToSpawn.shift()!;
      const spawnPt = this.envData.spawnPoints[Math.floor(Math.random() * this.envData.spawnPoints.length)];
      const zombie = createZombie(type, spawnPt, Math.random().toString());
      this.scene.add(zombie.mesh);
      this.zombies.push(zombie);
      this.spawnCooldown = 2.0 + Math.random() * 1.5;
    }

    // 6. Zombie AI & Navigation
    const now = performance.now() / 1000;
    const playerXZ = new THREE.Vector2(this.playerPos.x, this.playerPos.z);

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];

      if (z.state === 'dead' || z.state === 'dying') {
        updateZombieAnimation(z, delta, false);
        if (z.deathTime > 6) {
          this.scene.remove(z.mesh);
          this.zombies.splice(i, 1);
        }
        continue;
      }

      const zXZ = new THREE.Vector2(z.mesh.position.x, z.mesh.position.z);
      const toPlayer = playerXZ.clone().sub(zXZ);
      const dist = toPlayer.length();

      // Look at player
      z.mesh.lookAt(this.playerPos.x, z.mesh.position.y, this.playerPos.z);

      // Spitter special: halt at 14m and lob acid
      if (z.type === 'spitter' && dist < 16 && dist > 5) {
        z.spitCooldown -= delta;
        if (z.spitCooldown <= 0) {
          z.spitCooldown = 2.8;
          sounds.playZombieGroan('spitter');
          const mouthPos = z.mesh.position.clone().add(new THREE.Vector3(0, 1.6, 0));
          this.particleManager.spawnAcidProjectile(mouthPos, this.playerPos.clone(), z.damage);
        }
        updateZombieAnimation(z, delta, false);
        continue;
      }

      // Chase player
      if (dist > 1.5) {
        toPlayer.normalize();
        z.mesh.position.x += toPlayer.x * z.speed * delta;
        z.mesh.position.z += toPlayer.y * z.speed * delta;
        updateZombieAnimation(z, delta, true);
      } else {
        // Attack range!
        updateZombieAnimation(z, delta, false);
        if (now - z.lastAttackTime >= z.attackInterval) {
          z.lastAttackTime = now;
          this.damagePlayer(z.damage);
          sounds.playZombieAttack();
        }
      }

      // Zombie-Zombie separation avoidance
      for (let j = 0; j < this.zombies.length; j++) {
        if (i === j) continue;
        const other = this.zombies[j];
        if (other.state === 'dead' || other.state === 'dying') continue;
        const diff = z.mesh.position.clone().sub(other.mesh.position);
        diff.y = 0;
        const len = diff.length();
        if (len < 0.9 && len > 0.001) {
          diff.normalize().multiplyScalar((0.9 - len) * 0.5);
          z.mesh.position.add(diff);
        }
      }
    }

    // 7. Update Acid Projectiles vs Player
    const acidList = this.particleManager.getAcidProjectiles();
    for (let i = acidList.length - 1; i >= 0; i--) {
      const p = acidList[i];
      if (p.position.distanceTo(this.playerPos) < 1.4) {
        this.damagePlayer(p.damage);
        this.particleManager.removeAcidProjectile(p);
      }
    }

    // 8. Update Grenades
    for (let i = this.grenadesInFlight.length - 1; i >= 0; i--) {
      const g = this.grenadesInFlight[i];
      g.timer -= delta;
      g.vel.y -= 16 * delta;
      g.pos.addScaledVector(g.vel, delta);
      if (g.pos.y <= 0.12) {
        g.pos.y = 0.12;
        g.vel.y *= -0.4;
        g.vel.x *= 0.7;
        g.vel.z *= 0.7;
      }
      g.mesh.position.copy(g.pos);

      if (g.timer <= 0) {
        this.particleManager.spawnExplosion(g.pos, 5);
        sounds.playExplosion();
        this.dealAreaDamage(g.pos, 8.5, 320);
        this.scene.remove(g.mesh);
        g.mesh.geometry.dispose();
        this.grenadesInFlight.splice(i, 1);
      }
    }

    // 9. Update Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.mesh.rotation.y += delta * 1.5;
      if (p.position.distanceTo(this.playerPos) < 1.8) {
        // Collect pickup
        if (p.type === 'health') {
          this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + 40);
        } else {
          const act = this.stats.activeWeapon;
          this.stats.reserveAmmo[act] += WEAPON_DEFINITIONS[act].maxAmmo * 2;
        }
        sounds.playPickup();
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
        this.onStatsUpdate({ ...this.stats });
      }
    }

    // 10. Update Particles
    this.particleManager.update(delta);

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  private damagePlayer(amount: number) {
    if (!this.stats.isAlive) return;

    // Armor absorbs 70% of damage
    if (this.stats.armor > 0) {
      const absorbed = Math.min(this.stats.armor, Math.round(amount * 0.7));
      this.stats.armor -= absorbed;
      amount -= absorbed;
    }

    this.stats.health -= amount;
    sounds.playPlayerHurt();

    if (this.stats.health <= 25) {
      sounds.playHeartbeat();
    }

    if (this.stats.health <= 0) {
      this.stats.health = 0;
      this.stats.isAlive = false;
      this.onGameOver();
    }

    this.onStatsUpdate({ ...this.stats });
  }

  // Animation Loop with Software-WebGL Pacing
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();

    const tick = () => {
      if (!this.isRunning) return;
      const delta = Math.min(this.clock.getDelta(), 0.1);
      this.update(delta);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.animationFrameId = requestAnimationFrame(tick);
    }
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused && document.pointerLockElement) {
      this.lastPointerLockExitTime = performance.now();
      try {
        document.exitPointerLock();
      } catch {
        // ignore
      }
    }
  }

  public restart() {
    // Reset stats
    this.stats = {
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
      ammo: {
        pistol: WEAPON_DEFINITIONS.pistol.maxAmmo,
        sniper: WEAPON_DEFINITIONS.sniper.maxAmmo,
        shotgun: WEAPON_DEFINITIONS.shotgun.maxAmmo,
        rifle: WEAPON_DEFINITIONS.rifle.maxAmmo,
        plasma: WEAPON_DEFINITIONS.plasma.maxAmmo,
      },
      reserveAmmo: {
        pistol: 60,
        sniper: 30,
        shotgun: 24,
        rifle: 120,
        plasma: 10,
      },
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
    };

    // Reset player position
    this.playerPos.set(0, 1.7, 0);
    this.playerYaw = 0;
    this.playerPitch = 0;

    // Clear zombies
    this.zombies.forEach((z) => this.scene.remove(z.mesh));
    this.zombies = [];

    // Clear pickups
    this.pickups.forEach((p) => this.scene.remove(p.mesh));
    this.pickups = [];

    // Reset barrels
    this.envData.explosiveBarrels.forEach((b) => {
      b.health = 30;
      b.isExploded = false;
      b.mesh.visible = true;
    });

    this.switchWeapon('sniper');
    this.initWave(1);
    this.onStatsUpdate({ ...this.stats });
    // Safe pointer lock request that obeys browser cooldown
    this.requestPointerLock();
  }

  public getZombiesForRadar(): { x: number; z: number; type: ZombieType }[] {
    return this.zombies
      .filter((z) => z.state !== 'dead')
      .map((z) => ({
        x: z.mesh.position.x - this.playerPos.x,
        z: z.mesh.position.z - this.playerPos.z,
        type: z.type,
      }));
  }

  public getPlayerYaw(): number {
    return this.playerYaw;
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        window.setTimeout(cb, 80);
      }
    };
    window.setTimeout(poll, 5);
  }

  public dispose() {
    this.stop();
    this.unbindEvents();
    this.particleManager.dispose();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
