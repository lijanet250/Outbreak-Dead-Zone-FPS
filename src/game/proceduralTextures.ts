import * as THREE from 'three';

/**
 * Creates procedural canvas textures with zero external file dependencies
 */

// Helper to configure textures properly
function configureTexture(texture: THREE.CanvasTexture, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;
  return texture;
}

export function createFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base dark asphalt / concrete
  ctx.fillStyle = '#1e2124';
  ctx.fillRect(0, 0, 512, 512);

  // Concrete slabs & grid seams
  ctx.strokeStyle = '#121416';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 256, 256);
  ctx.strokeRect(256, 0, 256, 256);
  ctx.strokeRect(0, 256, 256, 256);
  ctx.strokeRect(256, 256, 256, 256);

  // Noise / grunge speckles
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 2 + 1;
    const shade = Math.floor(Math.random() * 30 + 15);
    ctx.fillStyle = `rgb(${shade}, ${shade + 3}, ${shade + 5})`;
    ctx.fillRect(x, y, size, size);
  }

  // Weathering streaks
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 25 + 10;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(10, 10, 10, 0.4)');
    grad.addColorStop(1, 'rgba(10, 10, 10, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture, 16, 16);
}

export function createWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Bunker reinforced concrete
  ctx.fillStyle = '#2d333b';
  ctx.fillRect(0, 0, 512, 512);

  // Panel seams
  ctx.strokeStyle = '#1c2128';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  // Steel rivets along seams
  ctx.fillStyle = '#444c56';
  const rivetPositions = [32, 96, 160, 224, 288, 352, 416, 480];
  for (const pos of rivetPositions) {
    ctx.beginPath();
    ctx.arc(pos, 256, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(256, pos, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grimy wash
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = Math.floor(Math.random() * 25 + 25);
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.2)`;
    ctx.fillRect(x, y, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture, 4, 2);
}

export function createContainerTexture(colorHex = '#1e3a5f'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 512, 512);

  // Corrugation ridges
  const stripeWidth = 32;
  for (let x = 0; x < 512; x += stripeWidth) {
    // shadow side
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x, 0, stripeWidth * 0.45, 512);
    // highlight side
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(x + stripeWidth * 0.45, 0, stripeWidth * 0.55, 512);
  }

  // Rust patches
  for (let i = 0; i < 8; i++) {
    const rx = Math.random() * 450 + 20;
    const ry = Math.random() * 450 + 20;
    const rr = Math.random() * 30 + 15;
    const rGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
    rGrad.addColorStop(0, 'rgba(120, 50, 20, 0.7)');
    rGrad.addColorStop(0.6, 'rgba(80, 30, 10, 0.4)');
    rGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rGrad;
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture, 1, 1);
}

export function createBarrelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Bright Hazard Red
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, 512, 256);

  // Metal barrel bands
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 45, 512, 16);
  ctx.fillRect(0, 195, 512, 16);

  // Yellow warning stripe
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 110, 512, 45);

  // Hazard symbol & "EXPLOSIVE" stencil
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚠ DANGER: EXPLOSIVE', 256, 142);

  // Flame icon simplified
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(100, 132, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(412, 132, 14, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture, 1, 1);
}

export function createSupplyCrateTexture(type: 'ammo' | 'health'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Military Olive or White Medical
  if (type === 'health') {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 244, 244);

    // Red Cross
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(108, 50, 40, 156);
    ctx.fillRect(50, 108, 156, 40);
  } else {
    ctx.fillStyle = '#365314'; // Dark olive
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#1a2e05';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 244, 244);

    // Stencil text AMMO
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AMMO', 128, 120);
    ctx.font = 'bold 20px monospace';
    ctx.fillText('7.62 NATO', 128, 160);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture, 1, 1);
}
