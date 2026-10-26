import * as THREE from 'three';

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  gravity?: number;
  rotSpeed?: THREE.Vector3;
}

export interface BulletTracer {
  mesh: THREE.Line;
  life: number;
  maxLife: number;
}

export interface AcidProjectile {
  mesh: THREE.Mesh;
  light: THREE.PointLight;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  life: number;
}

export class ParticleManager {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private tracers: BulletTracer[] = [];
  private acidProjectiles: AcidProjectile[] = [];

  // Reusable materials
  private matBlood: THREE.MeshBasicMaterial;
  private matSpark: THREE.MeshBasicMaterial;
  private matFire: THREE.MeshBasicMaterial;
  private matSmoke: THREE.MeshBasicMaterial;
  private matAcid: THREE.MeshBasicMaterial;
  private geoBlood: THREE.SphereGeometry;
  private geoSpark: THREE.SphereGeometry;
  private geoFire: THREE.SphereGeometry;
  private geoSmoke: THREE.SphereGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.matBlood = new THREE.MeshBasicMaterial({ color: 0x880808 });
    this.matSpark = new THREE.MeshBasicMaterial({ color: 0xffe600 });
    this.matFire = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.9 });
    this.matSmoke = new THREE.MeshBasicMaterial({ color: 0x3f3f46, transparent: true, opacity: 0.6 });
    this.matAcid = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    this.geoBlood = new THREE.SphereGeometry(0.04, 4, 4);
    this.geoSpark = new THREE.SphereGeometry(0.03, 4, 4);
    this.geoFire = new THREE.SphereGeometry(0.2, 6, 6);
    this.geoSmoke = new THREE.SphereGeometry(0.35, 6, 6);
  }

  // Bullet tracer from muzzle to hit position
  public addTracer(start: THREE.Vector3, end: THREE.Vector3, isPlasma = false) {
    const points = [start.clone(), end.clone()];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: isPlasma ? 0x22d3ee : 0xffea00,
      linewidth: isPlasma ? 4 : 2,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.tracers.push({
      mesh: line,
      life: 0,
      maxLife: 0.08,
    });
  }

  // Blood burst when a zombie is hit
  public spawnBlood(pos: THREE.Vector3, normal: THREE.Vector3, count = 12) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.geoBlood, this.matBlood.clone());
      mesh.position.copy(pos);

      // Eject outwards
      const vel = normal.clone().multiplyScalar(2.5 + Math.random() * 2);
      vel.x += (Math.random() - 0.5) * 3;
      vel.y += (Math.random() - 0.2) * 3;
      vel.z += (Math.random() - 0.5) * 3;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        gravity: 9.8,
      });
    }
  }

  // Sparks when hitting metal/wall
  public spawnSparks(pos: THREE.Vector3, normal: THREE.Vector3, count = 8) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.geoSpark, this.matSpark.clone());
      mesh.position.copy(pos);

      const vel = normal.clone().multiplyScalar(3.0 + Math.random() * 3);
      vel.x += (Math.random() - 0.5) * 4;
      vel.y += Math.random() * 3;
      vel.z += (Math.random() - 0.5) * 4;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
        gravity: 12,
      });
    }
  }

  // Explosion for barrels or plasma impacts
  public spawnExplosion(pos: THREE.Vector3, radius = 4) {
    // Fire burst
    for (let i = 0; i < 28; i++) {
      const mesh = new THREE.Mesh(this.geoFire, this.matFire.clone());
      mesh.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * radius * 2.5,
        Math.random() * radius * 2.5 + 1,
        (Math.random() - 0.5) * radius * 2.5
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
        gravity: -1.5, // rise up
      });
    }

    // Smoke clouds
    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(this.geoSmoke, this.matSmoke.clone());
      mesh.position.set(pos.x + (Math.random() - 0.5) * 2, pos.y + Math.random() * 2, pos.z + (Math.random() - 0.5) * 2);
      const vel = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 3 + 1, (Math.random() - 0.5) * 2);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.6,
        gravity: -1.0,
      });
    }
  }

  // Acid spitter projectile
  public spawnAcidProjectile(startPos: THREE.Vector3, targetPos: THREE.Vector3, damage: number) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), this.matAcid);
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    const light = new THREE.PointLight(0x22c55e, 1.5, 6);
    light.position.copy(startPos);
    this.scene.add(light);

    const dir = new THREE.Vector3().subVectors(targetPos, startPos);
    const dist = dir.length();
    dir.normalize();

    // Lob arc
    const speed = 14;
    const vel = dir.clone().multiplyScalar(speed);
    vel.y += dist * 0.12; // arc upward

    this.acidProjectiles.push({
      mesh,
      light,
      position: startPos.clone(),
      velocity: vel,
      damage,
      life: 0,
    });
  }

  public getAcidProjectiles() {
    return this.acidProjectiles;
  }

  public removeAcidProjectile(proj: AcidProjectile) {
    this.scene.remove(proj.mesh);
    this.scene.remove(proj.light);
    proj.mesh.geometry.dispose();
    const idx = this.acidProjectiles.indexOf(proj);
    if (idx !== -1) {
      this.acidProjectiles.splice(idx, 1);
    }
  }

  public update(delta: number) {
    // 1. Update tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life += delta;
      if (t.life >= t.maxLife) {
        this.scene.remove(t.mesh);
        t.mesh.geometry.dispose();
        (t.mesh.material as THREE.Material).dispose();
        this.tracers.splice(i, 1);
      }
    }

    // 2. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.mesh.position.addScaledVector(p.velocity, delta);
      if (p.gravity) {
        p.velocity.y -= p.gravity * delta;
      }

      // Stop on ground
      if (p.mesh.position.y < 0.02) {
        p.mesh.position.y = 0.02;
        p.velocity.set(0, 0, 0);
      }

      // Fade out
      const progress = p.life / p.maxLife;
      const mat = p.mesh.material as THREE.Material & { opacity?: number; transparent?: boolean };
      if (mat.transparent && mat.opacity !== undefined) {
        mat.opacity = 1.0 - progress;
      }
    }

    // 3. Update acid projectiles
    for (let i = this.acidProjectiles.length - 1; i >= 0; i--) {
      const proj = this.acidProjectiles[i];
      proj.life += delta;
      proj.velocity.y -= 9.8 * delta; // gravity
      proj.position.addScaledVector(proj.velocity, delta);
      proj.mesh.position.copy(proj.position);
      proj.light.position.copy(proj.position);

      if (proj.position.y <= 0 || proj.life > 4) {
        // Hit ground
        this.spawnBlood(proj.position, new THREE.Vector3(0, 1, 0), 8);
        this.removeAcidProjectile(proj);
      }
    }
  }

  public dispose() {
    this.particles.forEach((p) => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    });
    this.tracers.forEach((t) => {
      this.scene.remove(t.mesh);
      t.mesh.geometry.dispose();
      (t.mesh.material as THREE.Material).dispose();
    });
    this.acidProjectiles.forEach((a) => {
      this.scene.remove(a.mesh);
      this.scene.remove(a.light);
      a.mesh.geometry.dispose();
    });
    this.particles = [];
    this.tracers = [];
    this.acidProjectiles = [];
  }
}
