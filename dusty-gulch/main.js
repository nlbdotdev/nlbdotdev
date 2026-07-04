// ============================================================================
// DUSTY GULCH — a lightweight Fallout: New Vegas-like prototype
// Three.js, no build step, no external assets. Everything is procedural.
// ============================================================================
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ui = {
  title: $('title-screen'),
  hpNum: $('hp-num'), hpBar: $('hp-bar'),
  ammoMag: $('ammo-mag'), ammoReserve: $('ammo-reserve'), weaponName: $('weapon-name'),
  caps: $('caps-num'),
  prompt: $('prompt'),
  dialogue: $('dialogue'), dlgName: $('dlg-name'), dlgText: $('dlg-text'),
  toast: $('toast'),
  vignette: $('damage-vignette'),
  death: $('death-screen'),
  hitmarker: $('hitmarker'),
  compassStrip: $('compass-strip'),
};

let toastTimer = 0;
function toast(msg, seconds = 2.5) {
  ui.toast.textContent = msg;
  ui.toast.style.opacity = 1;
  toastTimer = seconds;
}

// ---------------------------------------------------------------------------
// Audio — tiny procedural sound effects, no files
// ---------------------------------------------------------------------------
let actx = null;
function audioInit() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
}
function playNoise({ duration = 0.15, freq = 900, gain = 0.5, type = 'lowpass' }) {
  if (!actx) return;
  const n = actx.sampleRate * duration;
  const buf = actx.createBuffer(1, n, actx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.2);
  const src = actx.createBufferSource();
  src.buffer = buf;
  const filter = actx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  const g = actx.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(actx.destination);
  src.start();
}
function playTone({ freq = 220, duration = 0.1, gain = 0.2, shape = 'square' }) {
  if (!actx) return;
  const o = actx.createOscillator();
  o.type = shape;
  o.frequency.value = freq;
  const g = actx.createGain();
  g.gain.setValueAtTime(gain, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + duration);
  o.connect(g).connect(actx.destination);
  o.start();
  o.stop(actx.currentTime + duration);
}
const sfx = {
  shot: () => { playNoise({ duration: 0.22, freq: 700, gain: 0.55 }); playTone({ freq: 90, duration: 0.12, gain: 0.25, shape: 'triangle' }); },
  distantShot: () => playNoise({ duration: 0.18, freq: 400, gain: 0.18 }),
  reload: () => { playTone({ freq: 500, duration: 0.05, gain: 0.12 }); setTimeout(() => playTone({ freq: 700, duration: 0.05, gain: 0.12 }), 120); },
  dry: () => playTone({ freq: 300, duration: 0.06, gain: 0.15 }),
  hit: () => playTone({ freq: 120, duration: 0.09, gain: 0.3, shape: 'sine' }),
  hurt: () => playTone({ freq: 70, duration: 0.25, gain: 0.4, shape: 'sawtooth' }),
  mount: () => playNoise({ duration: 0.12, freq: 300, gain: 0.2 }),
  talk: () => playTone({ freq: 880, duration: 0.04, gain: 0.08 }),
  caps: () => { playTone({ freq: 1100, duration: 0.06, gain: 0.12 }); setTimeout(() => playTone({ freq: 1500, duration: 0.08, gain: 0.12 }), 70); },
};

// ---------------------------------------------------------------------------
// Renderer / scene / camera / lights
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xd9b585, 70, 420);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 900);
scene.add(camera);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Late-afternoon Mojave sun
const sun = new THREE.DirectionalLight(0xffe0b0, 2.6);
sun.position.set(-120, 140, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
sun.shadow.camera.top = 90; sun.shadow.camera.bottom = -90;
sun.shadow.camera.far = 420;
sun.shadow.bias = -0.0005;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x8a6a45, 0.9));

// Gradient sky dome
{
  const c = document.createElement('canvas');
  c.width = 2; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, '#5a7ea6');
  grad.addColorStop(0.45, '#c9a06a');
  grad.addColorStop(0.75, '#e8b877');
  grad.addColorStop(1.0, '#d9b585');
  g.fillStyle = grad;
  g.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(700, 24, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false })
  );
  scene.add(sky);
  // Sun disc
  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(26, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3c0, fog: false })
  );
  sunDisc.position.set(-460, 320, 230);
  sunDisc.lookAt(0, 0, 0);
  scene.add(sunDisc);
}

// ---------------------------------------------------------------------------
// Shared helpers / registries
// ---------------------------------------------------------------------------
const worldMeshes = [];   // raycast-blocking scenery (bullets stop here)
const colliders = [];     // AABBs the player/horses can't walk through {minX,maxX,minZ,maxZ}
const interactables = []; // { pos: ()=>Vector3, radius, label, action }

const MAT = {
  wood: new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.95 }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x5e452c, roughness: 0.95 }),
  woodPale: new THREE.MeshStandardMaterial({ color: 0xa8845c, roughness: 0.95 }),
  roof: new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 1 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x777770, roughness: 0.6, metalness: 0.7 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x33322f, roughness: 0.5, metalness: 0.8 }),
  rock: new THREE.MeshStandardMaterial({ color: 0x9a8468, roughness: 1 }),
  cactus: new THREE.MeshStandardMaterial({ color: 0x5d7a3a, roughness: 0.9 }),
};

function box(w, h, d, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (shadow) { m.castShadow = true; m.receiveShadow = true; }
  return m;
}
function cylinder(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function rand(a, b) { return a + Math.random() * (b - a); }
function smoothstep(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------
const WORLD_HALF = 290; // hard world bounds

function terrainHeight(x, z) {
  // Rolling dunes far out, flat near town center so buildings sit cleanly.
  const h =
    Math.sin(x * 0.021) * Math.cos(z * 0.018) * 3.2 +
    Math.sin(x * 0.055 + 1.7) * Math.sin(z * 0.047) * 1.3 +
    Math.sin((x + z) * 0.009) * 2.2;
  const d = Math.hypot(x, z);
  return h * smoothstep(52, 110, d);
}

{
  const size = 600, seg = 140;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = terrainHeight(x, z);
    pos.setY(i, y);
    const t = 0.5 + 0.5 * Math.sin(x * 0.11 + z * 0.13) * Math.sin(x * 0.031);
    const shade = 0.86 + 0.14 * t + y * 0.008;
    colors.push(0.80 * shade, 0.66 * shade, 0.47 * shade);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  ground.receiveShadow = true;
  scene.add(ground);
  worldMeshes.push(ground);
}

// Distant mesas for that Mojave horizon
for (let i = 0; i < 9; i++) {
  const a = (i / 9) * Math.PI * 2 + rand(-0.2, 0.2);
  const dist = rand(330, 430);
  const w = rand(60, 150), h = rand(28, 60);
  const mesa = new THREE.Mesh(
    new THREE.CylinderGeometry(w * 0.7, w, h, 7),
    new THREE.MeshStandardMaterial({ color: 0xa87c54, roughness: 1 })
  );
  mesa.position.set(Math.cos(a) * dist, h / 2 - 6, Math.sin(a) * dist);
  mesa.rotation.y = rand(0, Math.PI);
  scene.add(mesa);
}

// Scattered rocks & cacti (outside town)
for (let i = 0; i < 90; i++) {
  const a = rand(0, Math.PI * 2), d = rand(60, 270);
  const x = Math.cos(a) * d, z = Math.sin(a) * d;
  const y = terrainHeight(x, z);
  if (Math.random() < 0.5) {
    const s = rand(0.5, 2.6);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), MAT.rock);
    rock.position.set(x, y + s * 0.4, z);
    rock.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
    rock.castShadow = rock.receiveShadow = true;
    scene.add(rock);
    worldMeshes.push(rock);
    if (s > 1.4) colliders.push({ minX: x - s, maxX: x + s, minZ: z - s, maxZ: z + s });
  } else {
    const h = rand(1.4, 3.2);
    const cac = new THREE.Group();
    cac.add(cylinder(0.22, 0.28, h, MAT.cactus, 0, h / 2, 0, 8));
    if (Math.random() < 0.7) {
      const arm = cylinder(0.14, 0.16, h * 0.5, MAT.cactus, 0.45, h * 0.6, 0, 8);
      arm.rotation.z = -0.5;
      cac.add(arm);
    }
    cac.position.set(x, y, z);
    scene.add(cac);
  }
}

// ---------------------------------------------------------------------------
// Town of Dusty Gulch
// ---------------------------------------------------------------------------
function makeSign(text, w = 3.4, h = 0.8) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = Math.round(256 * h / w);
  const g = c.getContext('2d');
  g.fillStyle = '#4a3826';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#2c2015';
  g.lineWidth = 6;
  g.strokeRect(3, 3, c.width - 6, c.height - 6);
  g.fillStyle = '#e8d9b0';
  g.font = `bold ${Math.floor(c.height * 0.52)}px Georgia, serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, c.width / 2, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), [
    MAT.woodDark, MAT.woodDark, MAT.woodDark, MAT.woodDark,
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), MAT.woodDark,
  ]);
  m.castShadow = true;
  return m;
}

function makeBuilding({ x, z, w = 8, d = 8, h = 4, facing = 0, sign = null, tall = false, mat = MAT.wood }) {
  const g = new THREE.Group();
  // Main body
  const body = box(w, h, d, mat, 0, h / 2, 0);
  g.add(body);
  // Western false-front facade
  const facadeH = tall ? h * 0.8 : h * 0.45;
  g.add(box(w + 0.3, facadeH, 0.3, MAT.woodPale, 0, h + facadeH / 2 - 0.05, d / 2));
  // Roof (slightly sloped slab)
  const roof = box(w + 0.5, 0.25, d + 0.5, MAT.roof, 0, h + 0.1, 0);
  roof.rotation.x = -0.045;
  g.add(roof);
  // Porch: deck + posts + awning
  const porchD = 2.2;
  g.add(box(w, 0.28, porchD, MAT.woodDark, 0, 0.14, d / 2 + porchD / 2));
  for (const px of [-w / 2 + 0.35, w / 2 - 0.35]) {
    g.add(cylinder(0.09, 0.11, 2.6, MAT.woodDark, px, 1.3, d / 2 + porchD - 0.3, 6));
  }
  const awning = box(w + 0.2, 0.14, porchD + 0.6, MAT.roof, 0, 2.7, d / 2 + porchD / 2);
  awning.rotation.x = 0.1;
  g.add(awning);
  // Door + windows (dark inset panels)
  const dark = new THREE.MeshStandardMaterial({ color: 0x1c150d, roughness: 1 });
  g.add(box(1.1, 2.2, 0.12, dark, 0, 1.1, d / 2 + 0.1));
  for (const wx of [-w / 4 - 0.4, w / 4 + 0.4]) g.add(box(1.0, 1.1, 0.12, dark, wx, 1.7, d / 2 + 0.1));
  // Sign
  if (sign) {
    const s = makeSign(sign, Math.min(w * 0.75, 5.5), 0.9);
    s.position.set(0, h + facadeH * 0.55, d / 2 + 0.25);
    g.add(s);
  }
  g.position.set(x, 0, z);
  g.rotation.y = facing;
  scene.add(g);
  g.traverse((o) => { if (o.isMesh) worldMeshes.push(o); });
  // Collider: axis-aligned box around the rotated footprint (buildings only face 0 or PI here)
  const useHalf = Math.abs(Math.sin(facing)) > 0.5 ? { w: d / 2, d: w / 2 } : { w: w / 2, d: d / 2 };
  colliders.push({ minX: x - useHalf.w - 0.2, maxX: x + useHalf.w + 0.2, minZ: z - useHalf.d - 0.2, maxZ: z + useHalf.d + 0.2 });
  return g;
}

// Main street runs along X; buildings face inward (+Z side faces face the street)
makeBuilding({ x: -16, z: -12, w: 12, d: 9, h: 5, sign: 'PROSPECTOR SALOON', tall: true });
makeBuilding({ x: 0, z: -13, w: 8, d: 8, h: 4, sign: 'SHERIFF' });
makeBuilding({ x: 13, z: -12, w: 9, d: 8, h: 4.4, sign: 'GENERAL STORE', tall: true });
makeBuilding({ x: 27, z: -13, w: 8, d: 8, h: 4, sign: 'DOC WHITLEY' });
makeBuilding({ x: -14, z: 14, w: 9, d: 8, h: 4.2, facing: Math.PI, sign: 'DUSTY GULCH BANK', tall: true });
makeBuilding({ x: 0, z: 15, w: 8, d: 9, h: 4, facing: Math.PI, sign: 'HOTEL' });
makeBuilding({ x: 15, z: 15, w: 11, d: 9, h: 4.6, facing: Math.PI, sign: 'LIVERY STABLE', tall: true });
makeBuilding({ x: -30, z: 13, w: 7, d: 9, h: 5.5, facing: Math.PI, sign: 'CHURCH' });

// Water tower
{
  const g = new THREE.Group();
  const tank = cylinder(2.6, 2.6, 3.4, MAT.woodDark, 0, 10.4, 0, 12);
  g.add(tank);
  g.add(cylinder(2.8, 2.9, 0.5, MAT.roof, 0, 12.3, 0, 12));
  for (const [lx, lz] of [[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]]) {
    const leg = cylinder(0.14, 0.18, 9, MAT.wood, lx, 4.5, lz, 6);
    leg.rotation.x = lz * 0.045; leg.rotation.z = -lx * 0.045;
    g.add(leg);
  }
  g.position.set(38, 0, 8);
  scene.add(g);
  g.traverse((o) => { if (o.isMesh) worldMeshes.push(o); });
  colliders.push({ minX: 35.5, maxX: 40.5, minZ: 5.5, maxZ: 10.5 });
}

// Hitching rails, barrels, crates along the street
function hitchingRail(x, z) {
  const g = new THREE.Group();
  g.add(cylinder(0.07, 0.09, 1.1, MAT.woodDark, -1.4, 0.55, 0, 6));
  g.add(cylinder(0.07, 0.09, 1.1, MAT.woodDark, 1.4, 0.55, 0, 6));
  const rail = cylinder(0.06, 0.06, 3.0, MAT.woodDark, 0, 1.05, 0, 6);
  rail.rotation.z = Math.PI / 2;
  g.add(rail);
  g.position.set(x, 0, z);
  scene.add(g);
}
hitchingRail(-16, -6.5); hitchingRail(13, -6.5); hitchingRail(15, 9);
for (let i = 0; i < 10; i++) {
  const x = rand(-34, 40), z = Math.random() < 0.5 ? rand(-9, -7) : rand(7, 9);
  if (Math.random() < 0.5) {
    const b = cylinder(0.45, 0.5, 1.1, MAT.woodDark, x, 0.55, z, 10);
    scene.add(b); worldMeshes.push(b);
  } else {
    const c = box(0.9, 0.9, 0.9, MAT.woodPale, x, 0.45, z);
    c.rotation.y = rand(0, 1.5);
    scene.add(c); worldMeshes.push(c);
  }
}

// ---------------------------------------------------------------------------
// Particles — small pooled puffs for muzzle smoke, impacts, blood
// ---------------------------------------------------------------------------
const particles = [];
const particleGeo = new THREE.SphereGeometry(1, 6, 5);
function spawnPuff(pos, color, size = 0.1, count = 5, speed = 1.6, life = 0.45) {
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
    const m = new THREE.Mesh(particleGeo, mat);
    m.scale.setScalar(size * rand(0.6, 1.4));
    m.position.copy(pos);
    scene.add(m);
    particles.push({
      mesh: m,
      vel: new THREE.Vector3(rand(-1, 1), rand(0.2, 1.2), rand(-1, 1)).multiplyScalar(speed),
      life: life * rand(0.7, 1.3), t: 0,
    });
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += dt;
    if (p.t >= p.life) {
      scene.remove(p.mesh);
      p.mesh.material.dispose();
      particles.splice(i, 1);
      continue;
    }
    p.mesh.position.addScaledVector(p.vel, dt);
    p.vel.y -= 2.5 * dt;
    p.mesh.material.opacity = 0.85 * (1 - p.t / p.life);
  }
}

// Tracer lines (bandit shots / player shots)
const tracers = [];
function spawnTracer(from, to, color = 0xffd890) {
  const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }));
  scene.add(line);
  tracers.push({ line, t: 0 });
}
function updateTracers(dt) {
  for (let i = tracers.length - 1; i >= 0; i--) {
    const tr = tracers[i];
    tr.t += dt;
    tr.line.material.opacity = Math.max(0, 0.9 - tr.t * 7);
    if (tr.t > 0.14) {
      scene.remove(tr.line);
      tr.line.geometry.dispose();
      tr.line.material.dispose();
      tracers.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------------------------
// NPCs
// ---------------------------------------------------------------------------
const npcs = [];
const npcHitMeshes = [];

const SKIN = new THREE.MeshStandardMaterial({ color: 0xc79a6f, roughness: 0.9 });

function makePersonMesh(shirtColor, hatColor) {
  const g = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.9 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.95 });
  const torso = box(0.55, 0.7, 0.32, shirt, 0, 1.15, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), SKIN);
  head.position.y = 1.72; head.castShadow = true;
  const hat = new THREE.Group();
  const brim = cylinder(0.32, 0.32, 0.04, new THREE.MeshStandardMaterial({ color: hatColor, roughness: 1 }), 0, 1.86, 0, 12);
  const top = cylinder(0.16, 0.18, 0.22, brim.material, 0, 1.97, 0, 10);
  hat.add(brim, top);
  const legL = box(0.2, 0.75, 0.22, pants, -0.15, 0.42, 0);
  const legR = box(0.2, 0.75, 0.22, pants, 0.15, 0.42, 0);
  const armL = box(0.14, 0.6, 0.16, shirt, -0.36, 1.15, 0);
  const armR = box(0.14, 0.6, 0.16, shirt, 0.36, 1.15, 0);
  g.add(torso, head, hat, legL, legR, armL, armR);
  g.userData.limbs = { legL, legR, armL, armR };
  return g;
}

class NPC {
  constructor({ name, x, z, shirt, hat = 0x5e452c, hostile = false, lines = [], wanderRadius = 8 }) {
    this.name = name;
    this.hostile = hostile;
    this.lines = lines;
    this.lineIndex = 0;
    this.hp = hostile ? 30 : 25;
    this.dead = false;
    this.home = new THREE.Vector3(x, 0, z);
    this.target = this.home.clone();
    this.wanderRadius = wanderRadius;
    this.pauseT = rand(0, 3);
    this.walkPhase = rand(0, 6);
    this.shootCooldown = rand(0.5, 2);
    this.alerted = false;
    this.deathT = 0;

    this.group = makePersonMesh(shirt, hat);
    this.group.position.set(x, terrainHeight(x, z), z);
    scene.add(this.group);
    this.group.traverse((o) => {
      if (o.isMesh) { o.userData.npc = this; npcHitMeshes.push(o); }
    });

    if (hostile) {
      // Little rifle in hand
      const gun = box(0.08, 0.1, 0.85, MAT.darkMetal, 0.42, 1.1, 0.25);
      gun.rotation.x = -0.15;
      this.group.add(gun);
    } else {
      interactables.push({
        pos: () => this.group.position,
        radius: 2.6,
        label: () => this.dead ? null : `Talk to ${this.name}`,
        action: () => startDialogue(this),
      });
    }
  }

  damage(amount, hitPoint) {
    if (this.dead) return;
    this.hp -= amount;
    spawnPuff(hitPoint, 0x8a1a10, 0.07, 6, 2.2, 0.4);
    if (!this.hostile) this.alerted = true; // civilians flee when shot
    if (this.hostile) this.alerted = true;
    if (this.hp <= 0) this.die();
    else if (this.hostile) alertBandits();
  }

  die() {
    this.dead = true;
    this.deathT = 0;
    if (this.hostile) {
      const reward = 8 + Math.floor(Math.random() * 12);
      player.caps += reward;
      sfx.caps();
      toast(`${this.name} is down. +${reward} caps`);
    } else {
      toast(`${this.name} is dead. The town will remember this.`);
    }
    // stop being shootable/talkable
    this.group.traverse((o) => {
      const i = npcHitMeshes.indexOf(o);
      if (i >= 0) npcHitMeshes.splice(i, 1);
    });
  }

  update(dt) {
    const g = this.group;
    if (this.dead) {
      // Timber.
      this.deathT = Math.min(1, this.deathT + dt * 2.2);
      g.rotation.x = -Math.PI / 2 * this.deathT;
      g.position.y = terrainHeight(g.position.x, g.position.z) + 0.25 * this.deathT;
      return;
    }

    const toPlayer = player.pos.clone().sub(g.position);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();
    let moving = false;
    let speed = 1.3;

    if (this.hostile) {
      if (!this.alerted && distToPlayer < 26) this.alerted = true;
      if (this.alerted && !player.dead) {
        g.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
        if (distToPlayer > 13) {
          const dir = toPlayer.normalize();
          g.position.addScaledVector(dir, 3.4 * dt);
          moving = true; speed = 3.4;
        }
        this.shootCooldown -= dt;
        if (this.shootCooldown <= 0 && distToPlayer < 45) {
          this.shootCooldown = rand(1.3, 2.2);
          this.shootAtPlayer(distToPlayer);
        }
      }
    } else if (this.alerted) {
      // Civilian panic: run away from player
      const flee = g.position.clone().sub(player.pos);
      flee.y = 0;
      if (flee.lengthSq() > 0.01) {
        flee.normalize();
        g.position.addScaledVector(flee, 3 * dt);
        g.rotation.y = Math.atan2(flee.x, flee.z);
        moving = true; speed = 3;
      }
      if (distToPlayer > 40) this.alerted = false;
    } else {
      // Wander around home
      const toTarget = this.target.clone().sub(g.position);
      toTarget.y = 0;
      if (toTarget.length() < 0.4) {
        this.pauseT -= dt;
        if (this.pauseT <= 0) {
          const a = rand(0, Math.PI * 2), r = rand(1, this.wanderRadius);
          this.target.set(this.home.x + Math.cos(a) * r, 0, this.home.z + Math.sin(a) * r);
          this.pauseT = rand(2, 6);
        }
      } else {
        const dir = toTarget.normalize();
        g.position.addScaledVector(dir, 1.3 * dt);
        g.rotation.y = Math.atan2(dir.x, dir.z);
        moving = true;
      }
    }

    resolveCollisions(g.position, 0.4);
    g.position.y = terrainHeight(g.position.x, g.position.z);

    // Walk cycle
    const limbs = g.userData.limbs;
    if (moving) {
      this.walkPhase += dt * 5 * speed;
      const s = Math.sin(this.walkPhase) * 0.5;
      limbs.legL.rotation.x = s; limbs.legR.rotation.x = -s;
      limbs.armL.rotation.x = -s * 0.7; limbs.armR.rotation.x = s * 0.7;
    } else {
      limbs.legL.rotation.x = limbs.legR.rotation.x = 0;
      limbs.armL.rotation.x = limbs.armR.rotation.x = 0;
    }
  }

  shootAtPlayer(dist) {
    const muzzle = this.group.position.clone().add(new THREE.Vector3(0, 1.3, 0));
    const hitChance = Math.max(0.08, 0.3 - dist * 0.005) * (player.mounted ? 0.65 : 1);
    const hit = Math.random() < hitChance;
    sfx.distantShot();
    if (hit && !player.dead) {
      spawnTracer(muzzle, player.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffaa66);
      damagePlayer(5 + Math.floor(Math.random() * 6));
    } else {
      const miss = player.pos.clone().add(new THREE.Vector3(rand(-2, 2), rand(-1, 2), rand(-2, 2)));
      spawnTracer(muzzle, miss, 0xffaa66);
    }
  }
}

function alertBandits() {
  for (const n of npcs) if (n.hostile && !n.dead) n.alerted = true;
}

// Townsfolk
npcs.push(new NPC({
  name: 'Sheriff Mara Vance', x: 2, z: -8, shirt: 0x6b4a2e, hat: 0x2c2015, wanderRadius: 6,
  lines: [
    "New face in Dusty Gulch. Keep that iron holstered on my street and we'll get along fine.",
    "Viper Gang's been camped out east of town, past the water tower. Somebody ought to thin 'em out.",
    "You clear out that camp, there's caps in it for you. Town pays its debts.",
  ],
}));
npcs.push(new NPC({
  name: 'Barkeep Sal', x: -16, z: -5, shirt: 0x8a2f2f, wanderRadius: 4,
  lines: [
    "Welcome to the Prospector. We got whiskey, warm beer, and water that's only a little radioactive.",
    "A courier came through last week. Took two in the head out by the ridge and kept walking. Swear on my still.",
    "Horses out front are stabled with us. Feel free to borrow one — just bring it back fed.",
  ],
}));
npcs.push(new NPC({
  name: 'Doc Whitley', x: 27, z: -7, shirt: 0xd8d2c0, hat: 0x777777, wanderRadius: 5,
  lines: [
    "You look like you've been chewed up by a bighorner. Sit still and let me look at you.",
    "Rest a while and you'll heal up on your own. Clean living, that's my prescription.",
    "The Viper boys put two of my patients in the ground this month. Wouldn't lose sleep if they had an accident.",
  ],
}));
npcs.push(new NPC({
  name: 'Prospector Jeb', x: 15, z: 8, shirt: 0x5a6b4a, wanderRadius: 10,
  lines: [
    "Found me a vein of scrap metal out west. Gonna be rich, I tell you. RICH!",
    "Watch the dunes at night, stranger. Things howl out there that ain't coyotes.",
    "Traded my boots for this hat. Best deal I ever made. My feet disagree.",
  ],
}));
npcs.push(new NPC({
  name: 'Widow Calloway', x: -14, z: 8, shirt: 0x3c3c50, hat: 0x1c1c28, wanderRadius: 6,
  lines: [
    "The bank's been closed since the war. The first one, I mean. Or maybe the third.",
    "My husband rests up by the church. Mind you tip your hat when you pass.",
  ],
}));
npcs.push(new NPC({
  name: 'Stable Boy Pete', x: 20, z: 9, shirt: 0x7a6a3a, wanderRadius: 5,
  lines: [
    "Them horses are the gentlest in the wasteland. Press E when you're beside one and swing on up.",
    "Ride 'em hard as you like — they don't tire. Don't ask me how. Pre-war breeding, I reckon.",
  ],
}));

// Viper Gang camp — east of town
const banditNames = ['Viper Raider', 'Viper Gunslinger', 'Viper Thug', 'Viper Lookout', 'Viper Boss'];
const banditSpots = [[72, 4], [78, 10], [76, -4], [84, 3], [80, 18]];
banditSpots.forEach(([bx, bz], i) => {
  npcs.push(new NPC({
    name: banditNames[i], x: bx, z: bz,
    shirt: 0x3a3a3a, hat: 0x1a1a1a, hostile: true, wanderRadius: 6,
  }));
});
// Their campfire + tents
{
  const camp = new THREE.Group();
  const fire = new THREE.PointLight(0xff8830, 30, 22, 2);
  fire.position.set(78, 1.2, 5);
  scene.add(fire);
  const logs = cylinder(0.1, 0.1, 1.4, MAT.woodDark, 78, 0.2, 5, 6);
  logs.rotation.z = Math.PI / 2;
  camp.add(logs);
  for (const [tx, tz] of [[74, 9], [82, 0]]) {
    const tent = new THREE.Mesh(new THREE.ConeGeometry(2, 2.4, 4), new THREE.MeshStandardMaterial({ color: 0x6b5a40, roughness: 1 }));
    tent.position.set(tx, terrainHeight(tx, tz) + 1.2, tz);
    tent.rotation.y = Math.PI / 4;
    tent.castShadow = true;
    camp.add(tent);
    worldMeshes.push(tent);
  }
  scene.add(camp);
}

// ---------------------------------------------------------------------------
// Horses
// ---------------------------------------------------------------------------
const horses = [];

class Horse {
  constructor(x, z, color = 0x5e452c) {
    this.pos = new THREE.Vector3(x, terrainHeight(x, z), z);
    this.yaw = rand(0, Math.PI * 2);
    this.speed = 0;
    this.walkPhase = 0;
    this.idleT = rand(0, 10);

    const g = new THREE.Group();
    const hide = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
    const maneMat = new THREE.MeshStandardMaterial({ color: 0x2c2015, roughness: 1 });
    // Body
    g.add(box(0.55, 0.62, 1.5, hide, 0, 1.15, 0));
    // Neck + head
    const neck = box(0.28, 0.7, 0.3, hide, 0, 1.62, 0.78);
    neck.rotation.x = 0.5;
    g.add(neck);
    const head = box(0.24, 0.28, 0.55, hide, 0, 1.95, 1.05);
    head.rotation.x = 0.25;
    g.add(head);
    this.head = head;
    // Ears
    g.add(box(0.06, 0.14, 0.06, maneMat, -0.08, 2.14, 0.92));
    g.add(box(0.06, 0.14, 0.06, maneMat, 0.08, 2.14, 0.92));
    // Mane + tail
    g.add(box(0.1, 0.55, 0.24, maneMat, 0, 1.72, 0.62));
    const tail = box(0.1, 0.65, 0.12, maneMat, 0, 1.05, -0.82);
    tail.rotation.x = 0.35;
    g.add(tail);
    // Saddle
    g.add(box(0.5, 0.12, 0.55, new THREE.MeshStandardMaterial({ color: 0x7a3d20, roughness: 0.8 }), 0, 1.5, -0.1));
    // Legs
    this.legs = [];
    for (const [lx, lz] of [[-0.2, 0.55], [0.2, 0.55], [-0.2, -0.55], [0.2, -0.55]]) {
      const leg = cylinder(0.07, 0.06, 0.9, hide, lx, 0.45, lz, 6);
      this.legs.push(leg);
      g.add(leg);
    }
    g.position.copy(this.pos);
    g.rotation.y = this.yaw;
    scene.add(g);
    this.group = g;

    interactables.push({
      pos: () => this.pos,
      radius: 2.8,
      label: () => (player.mounted === this ? null : 'Mount horse'),
      action: () => mountHorse(this),
    });
  }

  update(dt) {
    if (player.mounted === this) {
      // Ridden: position/yaw driven by the player controller
      this.group.position.copy(this.pos);
      this.group.rotation.y = this.yaw;
      this.animateLegs(dt, this.speed);
      return;
    }
    // Idle: stand around, occasionally dip head to graze
    this.idleT += dt;
    this.head.rotation.x = 0.25 + Math.max(0, Math.sin(this.idleT * 0.4)) * 0.8;
    this.animateLegs(dt, 0);
    this.pos.y = terrainHeight(this.pos.x, this.pos.z);
    this.group.position.copy(this.pos);
  }

  animateLegs(dt, speed) {
    if (speed > 0.5) {
      this.walkPhase += dt * (4 + speed * 0.9);
      const s = Math.sin(this.walkPhase);
      this.legs[0].rotation.x = s * 0.7;
      this.legs[1].rotation.x = -s * 0.7;
      this.legs[2].rotation.x = -s * 0.7;
      this.legs[3].rotation.x = s * 0.7;
    } else {
      for (const l of this.legs) l.rotation.x *= 0.85;
    }
  }
}

horses.push(new Horse(18, 5, 0x5e452c));
horses.push(new Horse(22, 6.5, 0x2e2620));
horses.push(new Horse(-16, -5.2, 0x8a6a45));

function mountHorse(horse) {
  if (player.mounted) return;
  player.mounted = horse;
  sfx.mount();
  toast('Riding. [E] to dismount, SHIFT to gallop.');
}
function dismount() {
  const h = player.mounted;
  if (!h) return;
  player.mounted = null;
  h.speed = 0;
  // Step off to the side
  const side = new THREE.Vector3(Math.cos(h.yaw), 0, -Math.sin(h.yaw));
  player.pos.copy(h.pos).addScaledVector(side, 1.2);
  sfx.mount();
}

// ---------------------------------------------------------------------------
// Weapons — viewmodels bolted to the camera
// ---------------------------------------------------------------------------
const gunRoot = new THREE.Group();
camera.add(gunRoot);
gunRoot.position.set(0.32, -0.28, -0.55);

function makeRevolver() {
  const g = new THREE.Group();
  g.add(box(0.05, 0.06, 0.3, MAT.darkMetal, 0, 0.045, -0.12));            // barrel
  g.add(cylinder(0.045, 0.045, 0.09, MAT.metal, 0, 0.03, 0.04, 8));       // cylinder
  g.children[1].rotation.x = Math.PI / 2;
  g.add(box(0.04, 0.1, 0.06, MAT.woodDark, 0, -0.05, 0.1));               // grip
  g.children[2].rotation.x = 0.3;
  g.add(box(0.012, 0.03, 0.012, MAT.darkMetal, 0, 0.085, -0.24));         // sight
  return g;
}
function makeRifle() {
  const g = new THREE.Group();
  g.add(box(0.045, 0.05, 0.75, MAT.darkMetal, 0, 0.05, -0.3));            // barrel
  g.add(box(0.055, 0.09, 0.35, MAT.wood, 0, 0.02, 0.12));                 // stock body
  const butt = box(0.05, 0.12, 0.22, MAT.wood, 0, -0.03, 0.32);
  butt.rotation.x = 0.18;
  g.add(butt);
  g.add(cylinder(0.02, 0.02, 0.3, MAT.metal, 0, -0.01, -0.15, 6));        // mag tube
  g.children[3].rotation.x = Math.PI / 2;
  g.add(box(0.012, 0.035, 0.012, MAT.darkMetal, 0, 0.09, -0.62));         // sight
  return g;
}

const weapons = [
  { name: '.357 REVOLVER', mesh: makeRevolver(), damage: 12, magSize: 6, mag: 6, reserve: 48, fireDelay: 0.45, reloadTime: 1.6, spread: 0.012, auto: false },
  { name: 'COWBOY REPEATER', mesh: makeRifle(), damage: 20, magSize: 7, mag: 7, reserve: 35, fireDelay: 0.8, reloadTime: 2.0, spread: 0.006, auto: false },
];
for (const w of weapons) { w.mesh.visible = false; w.mesh.scale.setScalar(0.8); gunRoot.add(w.mesh); }
let currentWeapon = 0;
weapons[0].mesh.visible = true;

let fireCooldown = 0;
let reloading = 0;
let recoil = 0;
let gunBob = 0;

const muzzleLight = new THREE.PointLight(0xffc060, 0, 8, 2);
gunRoot.add(muzzleLight);
muzzleLight.position.set(0, 0.05, -0.4);

function switchWeapon(i) {
  if (i === currentWeapon || reloading > 0) return;
  weapons[currentWeapon].mesh.visible = false;
  currentWeapon = i;
  weapons[i].mesh.visible = true;
  fireCooldown = 0.3;
  updateAmmoHUD();
}

function updateAmmoHUD() {
  const w = weapons[currentWeapon];
  ui.weaponName.textContent = reloading > 0 ? 'RELOADING...' : w.name;
  ui.ammoMag.textContent = w.mag;
  ui.ammoReserve.textContent = w.reserve;
}

function startReload() {
  const w = weapons[currentWeapon];
  if (reloading > 0 || w.mag >= w.magSize || w.reserve <= 0) return;
  reloading = w.reloadTime;
  sfx.reload();
  updateAmmoHUD();
}

const raycaster = new THREE.Raycaster();
function fire() {
  const w = weapons[currentWeapon];
  if (fireCooldown > 0 || reloading > 0 || player.dead || dialogueNPC) return;
  if (w.mag <= 0) { sfx.dry(); startReload(); return; }
  w.mag--;
  fireCooldown = w.fireDelay;
  recoil = 1;
  muzzleLight.intensity = 40;
  sfx.shot();
  updateAmmoHUD();

  const dir = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(camera.quaternion)
    .add(new THREE.Vector3(rand(-w.spread, w.spread), rand(-w.spread, w.spread), rand(-w.spread, w.spread)))
    .normalize();
  raycaster.set(camera.getWorldPosition(new THREE.Vector3()), dir);
  raycaster.far = 220;

  const hits = raycaster.intersectObjects([...npcHitMeshes, ...worldMeshes], false);
  const muzzleWorld = gunRoot.localToWorld(new THREE.Vector3(0, 0.05, -0.45));
  if (hits.length > 0) {
    const hit = hits[0];
    spawnTracer(muzzleWorld, hit.point);
    const npc = hit.object.userData.npc;
    if (npc) {
      npc.damage(w.damage + Math.floor(rand(0, 5)), hit.point);
      sfx.hit();
      ui.hitmarker.style.opacity = 1;
      setTimeout(() => (ui.hitmarker.style.opacity = 0), 120);
      alertBandits();
    } else {
      spawnPuff(hit.point, 0xbfa980, 0.06, 4, 1.4, 0.35);
    }
  } else {
    spawnTracer(muzzleWorld, muzzleWorld.clone().addScaledVector(dir, 150));
  }
  spawnPuff(muzzleWorld, 0xd8d0c0, 0.04, 3, 0.8, 0.3);
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------
const player = {
  pos: new THREE.Vector3(0, 0, 40), // ride into town from the south
  vel: new THREE.Vector3(),
  yaw: 0, // facing north, toward town
  pitch: 0,
  hp: 100, maxHp: 100,
  caps: 25,
  onGround: true,
  mounted: null,
  dead: false,
  respawnT: 0,
};

const EYE_WALK = 1.68;
const EYE_RIDE = 2.35;
const keys = {};

function resolveCollisions(pos, radius) {
  for (const c of colliders) {
    const cx = Math.max(c.minX, Math.min(pos.x, c.maxX));
    const cz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
    const dx = pos.x - cx, dz = pos.z - cz;
    const distSq = dx * dx + dz * dz;
    if (distSq < radius * radius && distSq > 1e-9) {
      const dist = Math.sqrt(distSq);
      pos.x = cx + (dx / dist) * radius;
      pos.z = cz + (dz / dist) * radius;
    } else if (distSq <= 1e-9) {
      pos.x = c.maxX + radius; // degenerate: standing exactly inside — eject east
    }
  }
  pos.x = Math.max(-WORLD_HALF, Math.min(WORLD_HALF, pos.x));
  pos.z = Math.max(-WORLD_HALF, Math.min(WORLD_HALF, pos.z));
}

function damagePlayer(amount) {
  if (player.dead) return;
  player.hp -= amount;
  sfx.hurt();
  ui.vignette.style.opacity = 1;
  setTimeout(() => { if (player.hp > 25) ui.vignette.style.opacity = 0; }, 350);
  if (player.hp <= 0) {
    player.hp = 0;
    player.dead = true;
    player.respawnT = 3.5;
    if (player.mounted) dismount();
    ui.death.style.display = 'flex';
  }
  updateHUD();
}

function respawn() {
  player.dead = false;
  player.hp = player.maxHp;
  player.pos.set(0, 0, 40);
  player.vel.set(0, 0, 0);
  player.yaw = 0;
  player.pitch = 0;
  ui.death.style.display = 'none';
  ui.vignette.style.opacity = 0;
  for (const n of npcs) if (n.hostile && !n.dead) { n.alerted = false; n.group.position.copy(n.home).setY(terrainHeight(n.home.x, n.home.z)); }
  toast('You wake up outside town, lighter a few caps.');
  player.caps = Math.max(0, player.caps - 10);
  updateHUD();
}

let regenTimer = 0;

function updatePlayer(dt) {
  if (player.dead) {
    player.respawnT -= dt;
    if (player.respawnT <= 0) respawn();
    return;
  }

  // Slow health regen (prototype-friendly)
  regenTimer += dt;
  if (regenTimer > 0.5 && player.hp < player.maxHp) {
    player.hp = Math.min(player.maxHp, player.hp + 1);
    regenTimer = 0;
    if (player.hp > 25) ui.vignette.style.opacity = 0;
    updateHUD();
  }

  const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const right = new THREE.Vector3(-forward.z, 0, forward.x);
  const input = new THREE.Vector3();
  if (keys['KeyW']) input.add(forward);
  if (keys['KeyS']) input.sub(forward);
  if (keys['KeyD']) input.add(right);
  if (keys['KeyA']) input.sub(right);
  if (input.lengthSq() > 0) input.normalize();

  if (player.mounted) {
    const h = player.mounted;
    const gallop = keys['ShiftLeft'] || keys['ShiftRight'];
    const speed = input.lengthSq() > 0 ? (gallop ? 16 : 8) : 0;
    h.speed = THREE.MathUtils.lerp(h.speed, speed, dt * 3);
    if (input.lengthSq() > 0) {
      const targetYaw = Math.atan2(-input.x, -input.z) + Math.PI;
      let dy = targetYaw - h.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      h.yaw += dy * Math.min(1, dt * 4);
    }
    const move = new THREE.Vector3(-Math.sin(h.yaw + Math.PI), 0, -Math.cos(h.yaw + Math.PI));
    h.pos.addScaledVector(move, h.speed * dt);
    resolveCollisions(h.pos, 0.9);
    h.pos.y = terrainHeight(h.pos.x, h.pos.z);
    // Rider follows the horse; gallop bob
    gunBob += dt * h.speed * 1.1;
    const bob = h.speed > 0.5 ? Math.abs(Math.sin(gunBob * 0.9)) * 0.09 : 0;
    player.pos.copy(h.pos);
    camera.position.set(player.pos.x, h.pos.y + EYE_RIDE + bob, player.pos.z);
  } else {
    const sprint = keys['ShiftLeft'] || keys['ShiftRight'];
    const speed = sprint ? 8.5 : 4.8;
    const groundY = terrainHeight(player.pos.x, player.pos.z);

    player.pos.addScaledVector(input, speed * dt);
    resolveCollisions(player.pos, 0.45);

    // Gravity / jump
    if (player.onGround && keys['Space']) {
      player.vel.y = 5.2;
      player.onGround = false;
    }
    if (!player.onGround) {
      player.vel.y -= 14 * dt;
      player.pos.y += player.vel.y * dt;
      if (player.pos.y <= terrainHeight(player.pos.x, player.pos.z)) {
        player.pos.y = terrainHeight(player.pos.x, player.pos.z);
        player.vel.y = 0;
        player.onGround = true;
      }
    } else {
      player.pos.y = groundY;
    }

    // Head bob
    if (input.lengthSq() > 0 && player.onGround) gunBob += dt * speed * 1.4;
    const bob = input.lengthSq() > 0 && player.onGround ? Math.sin(gunBob) * 0.035 : 0;
    camera.position.set(player.pos.x, player.pos.y + EYE_WALK + bob, player.pos.z);
  }

  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  // Gun sway/recoil
  recoil = Math.max(0, recoil - dt * 6);
  const w = weapons[currentWeapon];
  w.mesh.position.z = recoil * 0.08;
  w.mesh.rotation.x = recoil * 0.25;
  gunRoot.position.y = -0.28 + Math.sin(gunBob * 2) * 0.008;
  muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt * 400);

  fireCooldown -= dt;
  if (reloading > 0) {
    reloading -= dt;
    w.mesh.rotation.x = 0.5 * Math.sin(Math.min(1, 1 - reloading / w.reloadTime) * Math.PI);
    if (reloading <= 0) {
      reloading = 0;
      const need = w.magSize - w.mag;
      const take = Math.min(need, w.reserve);
      w.mag += take;
      w.reserve -= take;
      updateAmmoHUD();
    }
  }
}

// ---------------------------------------------------------------------------
// Interaction & dialogue
// ---------------------------------------------------------------------------
let dialogueNPC = null;
let nearestInteractable = null;

function findInteractable() {
  nearestInteractable = null;
  let best = Infinity;
  for (const it of interactables) {
    const label = it.label();
    if (!label) continue;
    const d = it.pos().distanceTo(player.pos);
    if (d < it.radius && d < best) {
      best = d;
      nearestInteractable = it;
    }
  }
  if (nearestInteractable && !dialogueNPC && !player.dead) {
    ui.prompt.textContent = `[E] ${nearestInteractable.label()}`;
    ui.prompt.style.display = 'block';
  } else {
    ui.prompt.style.display = 'none';
  }
}

function startDialogue(npc) {
  if (npc.dead || npc.alerted) return;
  dialogueNPC = npc;
  sfx.talk();
  showDialogueLine();
}
function showDialogueLine() {
  const npc = dialogueNPC;
  ui.dlgName.textContent = npc.name;
  ui.dlgText.textContent = npc.lines[npc.lineIndex % npc.lines.length];
  ui.dialogue.style.display = 'block';
}
function advanceDialogue() {
  const npc = dialogueNPC;
  npc.lineIndex++;
  if (npc.lineIndex % npc.lines.length === 0) {
    endDialogue();
  } else {
    sfx.talk();
    showDialogueLine();
  }
}
function endDialogue() {
  dialogueNPC = null;
  ui.dialogue.style.display = 'none';
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
let locked = false;

ui.title.addEventListener('click', () => {
  audioInit();
  canvas.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  ui.title.style.display = locked ? 'none' : 'flex';
});
document.addEventListener('mousemove', (e) => {
  if (!locked || player.dead) return;
  player.yaw -= e.movementX * 0.0022;
  player.pitch -= e.movementY * 0.0022;
  player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch));
});
document.addEventListener('mousedown', (e) => {
  if (!locked || e.button !== 0) return;
  fire();
});
document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!locked) return;
  if (e.code === 'KeyE') {
    if (dialogueNPC) advanceDialogue();
    else if (player.mounted) dismount();
    else if (nearestInteractable) nearestInteractable.action();
  }
  if (e.code === 'KeyQ' && dialogueNPC) endDialogue();
  if (e.code === 'KeyR') startReload();
  if (e.code === 'Digit1') switchWeapon(0);
  if (e.code === 'Digit2') switchWeapon(1);
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
function updateHUD() {
  ui.hpNum.textContent = Math.ceil(player.hp);
  ui.hpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
  ui.caps.textContent = player.caps;
}

// Compass strip: repeated cardinal marks, offset by yaw
{
  const marks = [];
  for (let r = 0; r < 6; r++) marks.push('N&nbsp;·&nbsp;·&nbsp;E&nbsp;·&nbsp;·&nbsp;S&nbsp;·&nbsp;·&nbsp;W&nbsp;·&nbsp;·&nbsp;');
  ui.compassStrip.innerHTML = marks.join('');
}
function updateCompass() {
  const stripW = ui.compassStrip.offsetWidth / 6; // width of one full 360° cycle
  let frac = (-player.yaw / (Math.PI * 2)) % 1;
  if (frac < 0) frac += 1;
  ui.compassStrip.style.left = `${-frac * stripW - stripW * 2 + 170}px`;
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
updateHUD();
updateAmmoHUD();

const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (locked || player.dead) {
    updatePlayer(dt);
    for (const n of npcs) n.update(dt);
    for (const h of horses) h.update(dt);
    findInteractable();
    updateCompass();
  }
  updateParticles(dt);
  updateTracers(dt);

  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) ui.toast.style.opacity = 0;
  }

  renderer.render(scene, camera);
}

// Debug/testing handle
window.__game = { player, npcs, horses, weapons };

// Aim the camera before the first frame so the title screen has a nice backdrop
camera.position.set(player.pos.x, EYE_WALK, player.pos.z);
camera.rotation.order = 'YXZ';
camera.rotation.y = player.yaw;
tick();
