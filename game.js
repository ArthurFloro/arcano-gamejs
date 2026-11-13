/* Véu Arcano — FPS de magias com modo história. Three.js r128, sem build. */
(() => {
'use strict';
if (!window.THREE) { document.getElementById('loaderr').classList.remove('hidden'); return; }

const $ = id => document.getElementById(id);
const CELL = 4, WALL_H = 5.5, EYE = 1.7;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DIR8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const DIFF = [0.6, 1, 1.5];
const ROMAN = ['I', 'II', 'III', 'IV'];

// =====================================================================
// Dados: magias, inimigos, capítulos
// =====================================================================
const SPELLS = [
  { id: 'fire', name: 'Dardo de Fogo', icon: '🔥', key: '1', color: 0xff7a1a, cost: 6, cd: 0.2, dmg: 14, speed: 42 },
  { id: 'ice', name: 'Lança de Gelo', icon: '❄️', key: '2', color: 0x6fd8ff, cost: 13, cd: 0.5, dmg: 24, speed: 34 },
  { id: 'bolt', name: 'Relâmpago', icon: '⚡', key: '3', color: 0xc9a0ff, cost: 22, cd: 0.75, dmg: 40 },
];
const NOVA = { cost: 45, cd: 8, dmg: 55, radius: 9.5 };

const ETYPES = {
  g: { name: 'Carniçal', hp: 38, speed: 4.7, radius: 0.6, height: 1.95, melee: 10, range: 1.8, atkCd: 1.0, windup: 0.32, res: { fire: 1.35 } },
  a: { name: 'Acólito', hp: 30, speed: 3.1, radius: 0.6, height: 2.3, ranged: 11, atkCd: 2.0, keep: 10, res: { ice: 1.4 } },
  B: { name: 'Golem de Obsidiana', hp: 170, speed: 2.7, radius: 1.0, height: 3.1, melee: 24, range: 2.6, atkCd: 1.5, windup: 0.5, res: { fire: 0.5, bolt: 1.5 } },
  X: { name: 'Malakar', boss: true, hp: 900, speed: 3.3, radius: 1.3, height: 4.0, ranged: 13 },
};

const LEVELS = [
  {
    name: 'A Cripta Sob a Torre', glyph: 'ᚠ', obj: 'kill', yaw: -2.356, spells: ['fire'],
    theme: { wall: '#5d5348', floor: '#3f3a35', fog: 0x0b0a10, fogD: 0.034, light: 0xffb878, accent: 0xff8a3a, amb: 0.42 },
    story: [
      'Por trezentos anos, a Torre de Aldoren guardou o Véu — a barreira entre o mundo dos vivos e o Abismo.',
      'Esta noite, o Véu se rasgou. Malakar, o Devorador de Runas, atravessou a fenda e arrastou a Mestra Ysolde, a última Guardiã, para as profundezas.',
      'Você é só um aprendiz. Sem espada, sem exército. Resta um cajado rachado, o Tomo do Fogo… e nenhuma outra escolha. A descida começa pela cripta.',
    ],
    lines: [[1.5, 'Ysolde', 'Aprendiz… consegue me ouvir? Os mortos da cripta despertaram.'], [7, 'Ysolde', 'Carniçais temem o fogo. Queime todos e o portal se abrirá.']],
    map: [
      '####################',
      '#P...#......#......#',
      '#....#..g...#..g...#',
      '#....#......#......#',
      '#..........##...h..#',
      '#....#......#......#',
      '######..##..###.####',
      '#......g.#.........#',
      '#..m.....#....g....#',
      '#........#.........#',
      '###.######...##.####',
      '#......#.....#.....#',
      '#..g...#..g..#..E..#',
      '#......#.....#.....#',
      '#..h.........#..m..#',
      '####################',
    ],
  },
  {
    name: 'Os Salões Congelados', glyph: 'ᛁ', obj: 'runes', yaw: -2.356, spells: ['fire'], tome: 'ice',
    theme: { wall: '#4f6a80', floor: '#33485a', fog: 0x0b1620, fogD: 0.032, light: 0xbfe4ff, accent: 0x6fd8ff, amb: 0.5 },
    story: [
      'O portal cospe você em salões que nenhum mapa registra. O ar corta como vidro e as paredes choram geada.',
      'Aqui, os primeiros magos selaram a passagem com uma runa partida em três fragmentos. Os acólitos de Malakar já rondam os corredores — e eles atacam de longe.',
      'Dizem que o Tomo do Gelo repousa nestes salões. Encontre-o, reúna os fragmentos e siga descendo.',
    ],
    lines: [[1.5, 'Ysolde', 'O Tomo do Gelo está bem aí. Pegue-o — os acólitos odeiam o frio.'], [8, 'Ysolde', 'Três fragmentos de runa abrem o portal. Eles brilham em dourado no mapa.']],
    map: [
      '######################',
      '#P....#.......#......#',
      '#.....#..a....#..r...#',
      '#..T..........#......#',
      '#.....#.......#..g...#',
      '#.....#..g....##.#####',
      '###.###.......#......#',
      '#.....####.####......#',
      '#..g..#......#...a...#',
      '#.....#..m...#.......#',
      '#.....#......#.......#',
      '#..r.........#####.###',
      '#.....#......#.......#',
      '###.###..a...#..g....#',
      '#.....#..........E...#',
      '#..h..####.###.......#',
      '#.....g......#...r.h.#',
      '######################',
    ],
  },
  {
    name: 'A Forja da Tempestade', glyph: 'ᛉ', obj: 'kill', yaw: -2.356, spells: ['fire', 'ice'], tome: 'bolt',
    theme: { wall: '#6a3a2c', floor: '#3a2622', fog: 0x180a06, fogD: 0.032, light: 0xffa060, accent: 0xff5a2a, amb: 0.46 },
    story: [
      'Sob o gelo, o mundo ferve. Esta é a Forja da Tempestade, onde os antigos acorrentaram o primeiro raio.',
      'Malakar deixou golens de obsidiana de guarda. Fogo mal arranha a pedra deles — você vai precisar de algo mais forte.',
      'A voz de Ysolde está cada vez mais fraca. Não resta muito tempo.',
    ],
    lines: [[1.5, 'Ysolde', 'O Tomo do Relâmpago… está aí na sala. O raio estilhaça obsidiana.'], [8, 'Ysolde', 'Golens são lentos. Não deixe que cheguem perto.']],
    map: [
      '########################',
      '#P.....#.........#.....#',
      '#......#....g....#..a..#',
      '#..T...#.........#.....#',
      '#..........##..........#',
      '#......#...##....#.....#',
      '#......#.........#..B..#',
      '###.####....a....###.###',
      '#......#.........#.....#',
      '#..g...###..####.#..m..#',
      '#......#.....#.........#',
      '#......#..B..#...#..g..#',
      '##.#####.....#...#.....#',
      '#......#..h..#...###.###',
      '#..a.........#.........#',
      '#......#.....#...a...E.#',
      '#..m...#..g..#.........#',
      '########################',
    ],
  },
  {
    name: 'O Trono do Devorador', glyph: 'ᛟ', obj: 'boss', yaw: -1.571, spells: ['fire', 'ice', 'bolt'], nova: true,
    theme: { wall: '#3d2a5c', floor: '#221a33', fog: 0x0c0616, fogD: 0.026, light: 0xd0a8ff, accent: 0xb04dff, amb: 0.5 },
    story: [
      'A última escada termina diante de portas de osso. Atrás delas, o Trono do Devorador.',
      '«Aprendiz…» — a voz de Ysolde é um fio. «Ele usa a minha magia para rasgar o Véu de vez. Meu cajado está aos seus pés. A Nova Arcana agora é sua.»',
      'Fogo, gelo, raio — tudo o que você aprendeu na descida. É hora de usar.',
    ],
    lines: [[1.5, 'Malakar', 'Mais um verme da Torre. Ysolde mandou uma criança para morrer.'], [8, 'Ysolde', 'Tecla Q — a Nova Arcana. Guarde-a para quando ele chamar reforços.']],
    map: [
      '#####################',
      '#.........#.........#',
      '#.P.................#',
      '#.........#.........#',
      '####.###########.####',
      '#...................#',
      '#...##....m....##...#',
      '#...##.........##...#',
      '#...................#',
      '#.h.......X.......h.#',
      '#...................#',
      '#...##.........##...#',
      '#...##....m....##...#',
      '#...................#',
      '#####################',
    ],
  },
];
const ENDING = [
  'Malakar se desfaz em cinzas de runas, e o rasgo no Véu se fecha como uma ferida antiga.',
  'Ysolde, livre das correntes, apoia a mão no seu ombro. «Desceu um aprendiz. Quem sobe comigo é um Guardião do Véu.»',
  'A Torre de Aldoren volta a ter luz na janela mais alta.  — FIM —',
];

// =====================================================================
// Renderizador, cenas, luzes
// =====================================================================
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
// resolução dinâmica: se o FPS cair (placas integradas), a escala de renderização diminui sozinha
const MAX_PR = Math.min(window.devicePixelRatio || 1, 1.5);
let prScale = 1, perfAcc = 0, perfN = 0, perfBad = 0;
renderer.setPixelRatio(MAX_PR);
renderer.autoClear = false;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 160);
camera.rotation.order = 'YXZ';
const viewScene = new THREE.Scene();
const viewCam = new THREE.PerspectiveCamera(55, 1, 0.01, 10);

const ambient = new THREE.AmbientLight(0xffffff, 0.45);
const hemi = new THREE.HemisphereLight(0xffffff, 0x1a1420, 0.3);
const torch = new THREE.PointLight(0xffc890, 1.25, 30, 1.5);
scene.add(ambient, hemi, torch);
const fxLights = [];
for (let i = 0; i < 2; i++) {
  const l = new THREE.PointLight(0xffffff, 0, 16, 2);
  l.userData = { t: 0, max: 1, peak: 0 };
  fxLights.push(l); scene.add(l);
}
function flashLight(x, y, z, color, peak, dur) {
  let best = fxLights[0];
  for (const l of fxLights) if (l.userData.t < best.userData.t) best = l;
  best.position.set(x, y, z); best.color.setHex(color);
  best.userData.t = best.userData.max = dur; best.userData.peak = peak; best.intensity = peak;
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = viewCam.aspect = w / h;
  camera.updateProjectionMatrix(); viewCam.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

// ---------- Texturas procedurais ----------
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)');
  gr.addColorStop(0.6, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const glowMats = {};
function glowMat(color) {
  if (!glowMats[color]) {
    const m = new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    m.userData.shared = true; glowMats[color] = m;
  }
  return glowMats[color];
}
function glow(color, scale, x = 0, y = 0, z = 0) {
  const s = new THREE.Sprite(glowMat(color)); s.scale.set(scale, scale, 1); s.position.set(x, y, z); return s;
}
function makeTex(base, kind) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const v = Math.random() < 0.5 ? 0 : 255, s = 1 + Math.random() * 5;
    g.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.07})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, s, s);
  }
  const block = (x, y, w, h) => {
    const v = Math.random() < 0.5 ? 0 : 255;
    g.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.1})`; g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 5; g.strokeRect(x + 1, y + 1, w - 2, h - 2);
    g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1.5; g.strokeRect(x + 5, y + 5, w - 10, h - 10);
  };
  if (kind === 'brick') { for (let r = 0; r < 4; r++) for (let k = -1; k < 3; k++) block(k * 128 + (r % 2 ? 64 : 0), r * 64, 128, 64); }
  else { for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) block(k * 128, r * 128, 128, 128); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

// ---------- Partículas ----------
const PMAX = 900;
const pPos = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3), pVel = new Float32Array(PMAX * 3), pBase = new Float32Array(PMAX * 3);
const pLife = new Float32Array(PMAX), pMaxL = new Float32Array(PMAX), pGrav = new Float32Array(PMAX);
let pNext = 0;
for (let i = 0; i < PMAX; i++) pPos[i * 3 + 1] = -999;
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const pPoints = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.34, map: glowTex, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
pPoints.frustumCulled = false; scene.add(pPoints);
const _c = new THREE.Color();
function puff(x, y, z, color, n, speed, life, grav = 0) {
  _c.setHex(color);
  for (let k = 0; k < n; k++) {
    const i = pNext, j = i * 3; pNext = (pNext + 1) % PMAX;
    const u = Math.random() * 2 - 1, a = Math.random() * 6.283, r = Math.sqrt(1 - u * u), s = speed * (0.3 + Math.random() * 0.7);
    pPos[j] = x; pPos[j + 1] = y; pPos[j + 2] = z;
    pVel[j] = r * Math.cos(a) * s; pVel[j + 1] = u * s; pVel[j + 2] = r * Math.sin(a) * s;
    pBase[j] = _c.r; pBase[j + 1] = _c.g; pBase[j + 2] = _c.b;
    pLife[i] = pMaxL[i] = life * (0.6 + Math.random() * 0.4); pGrav[i] = grav;
  }
}
function updateParticles(dt) {
  for (let i = 0; i < PMAX; i++) {
    if (pLife[i] <= 0) continue;
    const j = i * 3; pLife[i] -= dt;
    if (pLife[i] <= 0) { pPos[j + 1] = -999; continue; }
    pVel[j + 1] -= pGrav[i] * dt;
    pPos[j] += pVel[j] * dt; pPos[j + 1] += pVel[j + 1] * dt; pPos[j + 2] += pVel[j + 2] * dt;
    const k = pLife[i] / pMaxL[i];
    pCol[j] = pBase[j] * k; pCol[j + 1] = pBase[j + 1] * k; pCol[j + 2] = pBase[j + 2] * k;
  }
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
}
function clearParticles() { for (let i = 0; i < PMAX; i++) { pLife[i] = 0; pPos[i * 3 + 1] = -999; } }

// ---------- Cajado em primeira pessoa ----------
const staff = new THREE.Group();
const gemMat = new THREE.MeshBasicMaterial({ color: 0xff7a1a });
const gemGlowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xff7a1a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
const viewLight = new THREE.PointLight(0xff7a1a, 1.6, 3, 2);
(() => {
  const wood = new THREE.MeshStandardMaterial({ color: 0x6a4526, roughness: 0.9 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.027, 0.95, 8), wood);
  staff.add(shaft);
  for (let i = 0; i < 3; i++) {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.08, 5), wood), a = i * 2.094;
    claw.position.set(Math.cos(a) * 0.034, 0.5, Math.sin(a) * 0.034);
    claw.rotation.set(Math.sin(a) * 0.45, 0, Math.cos(a) * -0.45);
    staff.add(claw);
  }
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.04), gemMat); gem.position.y = 0.6; gem.name = 'gem';
  const gg = new THREE.Sprite(gemGlowMat); gg.scale.set(0.42, 0.42, 1); gg.position.y = 0.6;
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.1), new THREE.MeshStandardMaterial({ color: 0x2c3a78, roughness: 0.8 }));
  sleeve.position.y = -0.18;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd9a47c, roughness: 0.7 }));
  hand.position.y = -0.08;
  viewLight.position.set(0, 0.6, 0.12);
  staff.add(gem, gg, sleeve, hand, viewLight);
  viewScene.add(staff, new THREE.AmbientLight(0xffffff, 0.75));
})();

// =====================================================================
// Áudio (sintetizado, sem arquivos)
// =====================================================================
let actx = null, master = null, muted = false, noiseBuf = null;
function initAudio() {
  if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = 0.5; master.connect(actx.destination);
    noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // zumbido ambiente
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    const dg = actx.createGain(); dg.gain.value = 0.05; lp.connect(dg); dg.connect(master);
    for (const f of [55, 82.6, 110.4]) { const o = actx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(); }
  } catch (e) { actx = null; }
}
function tone(f0, f1, dur, type = 'sine', vol = 0.15, delay = 0) {
  if (!actx || muted) return;
  const t = actx.currentTime + delay, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.03);
}
function noise(dur, vol = 0.2, freq = 1000, delay = 0) {
  if (!actx || muted) return;
  const t = actx.currentTime + delay, s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5, dur + 0.05);
}
const sfx = {
  fire() { noise(0.16, 0.16, 900); tone(520, 130, 0.18, 'sawtooth', 0.07); },
  ice() { tone(1500, 520, 0.24, 'triangle', 0.12); tone(2300, 900, 0.18, 'sine', 0.06); },
  bolt() { noise(0.28, 0.32, 3200); tone(190, 40, 0.3, 'square', 0.11); },
  nova() { tone(95, 28, 0.9, 'sawtooth', 0.26); noise(0.7, 0.3, 380); tone(880, 220, 0.5, 'sine', 0.08); },
  dash() { noise(0.2, 0.14, 1800); tone(300, 900, 0.15, 'sine', 0.06); },
  hit() { tone(320, 120, 0.07, 'square', 0.05); },
  boom() { noise(0.22, 0.2, 320); },
  kill() { tone(230, 45, 0.42, 'sawtooth', 0.12); noise(0.3, 0.12, 500); },
  hurt() { tone(150, 55, 0.26, 'sawtooth', 0.22); noise(0.12, 0.15, 700); },
  slash() { noise(0.12, 0.2, 1500); },
  growl() { tone(90, 60, 0.35, 'sawtooth', 0.07); },
  orb() { tone(260, 420, 0.2, 'triangle', 0.07); },
  pickup() { tone(660, 990, 0.12, 'sine', 0.14); tone(990, 1320, 0.16, 'sine', 0.12, 0.09); },
  tome() { [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.35, 'triangle', 0.12, i * 0.09)); },
  portal() { [330, 440, 554, 660].forEach((f, i) => tone(f, f * 1.01, 0.5, 'sine', 0.12, i * 0.12)); },
  fizzle() { tone(210, 150, 0.08, 'sine', 0.05); },
  tele() { tone(1200, 90, 0.4, 'sine', 0.12); noise(0.3, 0.12, 2400); },
};

// =====================================================================
// Estado
// =====================================================================
const player = {
  x: 0, z: 0, y: 0, vy: 0, yaw: 0, pitch: 0, hp: 100, mana: 100, spell: 0, castCd: 0, novaCd: 0, dashCd: 0, dashT: 0,
  dashX: 0, dashZ: 0, unlocked: { fire: true }, nova: false, walkT: 0, shake: 0, kick: 0, fizzleT: 0, hurtT: 0, cell: -1,
};
let state = 'menu', chapter = 0, diff = 1, L = null;
let totalTime = 0, totalKills = 0, locked = false, mouseDown = false;
const keys = {};

// ---------- Utilidades de grade ----------
function wallCell(cx, cz) { return cx < 0 || cz < 0 || cx >= L.W || cz >= L.H || L.grid[cz * L.W + cx] === 1; }
function isWallAt(x, z) { return wallCell(Math.floor(x / CELL), Math.floor(z / CELL)); }
function blocked(x, z, r) {
  const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL), z0 = Math.floor((z - r) / CELL), z1 = Math.floor((z + r) / CELL);
  for (let cz = z0; cz <= z1; cz++) for (let cx = x0; cx <= x1; cx++) if (wallCell(cx, cz)) return true;
  return false;
}
function moveCircle(o, dx, dz, r) {
  if (!blocked(o.x + dx, o.z, r)) o.x += dx;
  if (!blocked(o.x, o.z + dz, r)) o.z += dz;
}
function los(x0, z0, x1, z1) {
  const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / 0.5);
  for (let i = 1; i < n; i++) { const t = i / n; if (isWallAt(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)) return false; }
  return true;
}
function computeFlow() {
  const { W, H, grid, dist } = L;
  dist.fill(-1);
  const pcx = Math.floor(player.x / CELL), pcz = Math.floor(player.z / CELL);
  if (wallCell(pcx, pcz)) return;
  const q = L.queue; let head = 0, tail = 0;
  q[tail++] = pcz * W + pcx; dist[pcz * W + pcx] = 0;
  while (head < tail) {
    const i = q[head++], x = i % W, z = (i - x) / W, d = dist[i] + 1;
    if (x > 0 && !grid[i - 1] && dist[i - 1] < 0) { dist[i - 1] = d; q[tail++] = i - 1; }
    if (x < W - 1 && !grid[i + 1] && dist[i + 1] < 0) { dist[i + 1] = d; q[tail++] = i + 1; }
    if (z > 0 && !grid[i - W] && dist[i - W] < 0) { dist[i - W] = d; q[tail++] = i - W; }
    if (z < H - 1 && !grid[i + W] && dist[i + W] < 0) { dist[i + W] = d; q[tail++] = i + W; }
  }
}
function flowDir(e) {
  const W = L.W, cx = Math.floor(e.x / CELL), cz = Math.floor(e.z / CELL);
  if (wallCell(cx, cz)) return null;
  const cur = L.dist[cz * W + cx];
  if (cur <= 0) return null;
  let best = cur, bx = -1, bz = -1;
  for (const [ox, oz] of DIR8) {
    const nx = cx + ox, nz = cz + oz;
    if (wallCell(nx, nz)) continue;
    if (ox && oz && (wallCell(cx + ox, cz) || wallCell(cx, cz + oz))) continue;
    const d = L.dist[nz * W + nx];
    if (d >= 0 && d < best) { best = d; bx = nx; bz = nz; }
  }
  if (bx < 0) return null;
  const tx = (bx + 0.5) * CELL - e.x, tz = (bz + 0.5) * CELL - e.z, tl = Math.hypot(tx, tz) || 1;
  return [tx / tl, tz / tl];
}

// =====================================================================
// Construção de malhas
// =====================================================================
function stdMat(color) { return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 }); }
function box(w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; }
function ball(r, m, x, y, z) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); o.position.set(x, y, z); return o; }
function disposeObj(root) {
  root.traverse(o => {
    if (o.isSprite) { if (o.material && !o.material.userData.shared) o.material.dispose(); return; }
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const m = o.material;
      if (m.userData && m.userData.shared) return;
      if (m.map && m.map !== glowTex) m.map.dispose();
      m.dispose();
    }
  });
}

function buildEnemyMesh(k) {
  const g = new THREE.Group(), mats = [], parts = {};
  const M = c => { const m = stdMat(c); mats.push(m); return m; };
  const eye = c => new THREE.MeshBasicMaterial({ color: c });
  if (k === 'g') {
    const skin = M(0x7c9a62), dark = M(0x3d4c35);
    g.add(box(0.75, 0.85, 0.42, skin, 0, 1.15, 0), ball(0.3, skin, 0, 1.82, 0.05));
    parts.armL = box(0.2, 0.75, 0.2, skin, -0.5, 1.25, 0.3); parts.armR = box(0.2, 0.75, 0.2, skin, 0.5, 1.25, 0.3);
    parts.armL.rotation.x = parts.armR.rotation.x = -1.2;
    parts.legL = box(0.26, 0.75, 0.28, dark, -0.2, 0.38, 0); parts.legR = box(0.26, 0.75, 0.28, dark, 0.2, 0.38, 0);
    const em = eye(0xfff36b);
    g.add(parts.armL, parts.armR, parts.legL, parts.legR, ball(0.055, em, -0.12, 1.87, 0.31), ball(0.055, em, 0.12, 1.87, 0.31));
  } else if (k === 'a') {
    const robe = M(0x4a2c66), hood = M(0x2a1845);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.9, 10), robe); cone.position.y = 1.2;
    const em = eye(0xe0a0ff);
    parts.orb = glow(0xb04dff, 0.9, 0.55, 1.6, 0.4);
    g.add(cone, ball(0.29, hood, 0, 2.15, 0), ball(0.05, em, -0.1, 2.18, 0.26), ball(0.05, em, 0.1, 2.18, 0.26), parts.orb);
    parts.hover = 0.25;
  } else if (k === 'B') {
    const rock = M(0x2c2733), rock2 = M(0x3d3646);
    parts.armL = box(0.5, 1.5, 0.5, rock2, -1.1, 1.85, 0.1); parts.armR = box(0.5, 1.5, 0.5, rock2, 1.1, 1.85, 0.1);
    parts.legL = box(0.5, 0.95, 0.55, rock2, -0.38, 0.47, 0); parts.legR = box(0.5, 0.95, 0.55, rock2, 0.38, 0.47, 0);
    const em = eye(0xff7a2a);
    g.add(box(1.6, 1.3, 1.0, rock, 0, 2.0, 0), box(1.1, 0.5, 0.8, rock2, 0, 1.15, 0), box(0.6, 0.55, 0.6, rock, 0, 2.95, 0),
      parts.armL, parts.armR, parts.legL, parts.legR,
      ball(0.26, em, 0, 2.05, 0.46), ball(0.07, em, -0.14, 3.0, 0.31), ball(0.07, em, 0.14, 3.0, 0.31), glow(0xff6a1a, 1.6, 0, 2.05, 0.6));
  } else {
    const robe = M(0x24123a), trim = M(0x5a2380), bone = M(0xd6cdb6);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.35, 3.3, 12), robe); cone.position.y = 1.75;
    g.add(cone, box(2.3, 0.4, 0.85, trim, 0, 3.15, 0), ball(0.42, bone, 0, 3.68, 0));
    for (let i = 0; i < 5; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.55, 5), trim), a = -0.9 + i * 0.45;
      sp.position.set(Math.sin(a) * 0.36, 4.12 - Math.abs(a) * 0.12, Math.cos(a) * 0.1); sp.rotation.z = -a * 0.5; g.add(sp);
    }
    const em = eye(0xff2244);
    parts.handL = glow(0xff3355, 1.3, -1.55, 2.7, 0.5); parts.handR = glow(0xff3355, 1.3, 1.55, 2.7, 0.5);
    g.add(ball(0.07, em, -0.15, 3.72, 0.37), ball(0.07, em, 0.15, 3.72, 0.37), parts.handL, parts.handR, glow(0x7a2cff, 7, 0, 2.2, -0.3));
    parts.hover = 0.3;
  }
  return { g, mats, parts };
}

function spawnEnemy(k, x, z, aggro) {
  const T = ETYPES[k], { g, mats, parts } = buildEnemyMesh(k);
  const root = new THREE.Group(); root.position.set(x, 0, z); root.add(g);
  const e = {
    k, T, x, z, hp: T.hp, maxHp: T.hp, root, mesh: g, mats, parts, aggro: !!aggro, cd: rand(0.4, 1.2), wind: 0, burn: 0, slow: 0, flash: 0,
    barT: 0, walk: rand(0, 6), t: rand(0, 6), strafe: Math.random() < 0.5 ? 1 : -1, dead: false, phase: 1, shots: 0, tp: 0,
  };
  if (!T.boss) {
    const bg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x000000, opacity: 0.6, transparent: true, depthWrite: false }));
    const fg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xff3355, depthWrite: false }));
    bg.scale.set(1.3, 0.14, 1); fg.scale.set(1.24, 0.09, 1);
    bg.position.y = fg.position.y = T.height + 0.45; bg.visible = fg.visible = false; fg.renderOrder = 2; bg.renderOrder = 1;
    root.add(bg, fg); e.bar = fg; e.barBg = bg;
  }
  L.group.add(root); L.enemies.push(e);
  return e;
}

function makePickup(kind, x, z, tomeId) {
  const g = new THREE.Group(); let color, core;
  if (kind === 'h') {
    color = 0xff3355; core = ball(0.27, new THREE.MeshBasicMaterial({ color: 0xff4d68 }), 0, 0, 0);
    g.add(box(0.12, 0.2, 0.12, new THREE.MeshBasicMaterial({ color: 0xd9c9a0 }), 0, 0.32, 0));
  } else if (kind === 'm') {
    color = 0x55b6ff; core = new THREE.Mesh(new THREE.OctahedronGeometry(0.34), new THREE.MeshBasicMaterial({ color: 0x7fd0ff }));
  } else if (kind === 'r') {
    color = 0xffd24a; core = new THREE.Mesh(new THREE.TetrahedronGeometry(0.42), new THREE.MeshBasicMaterial({ color: 0xffe07a }));
  } else {
    color = SPELLS.find(s => s.id === tomeId).color;
    core = box(0.62, 0.82, 0.16, new THREE.MeshBasicMaterial({ color }), 0, 0, 0);
    g.add(box(0.5, 0.7, 0.2, new THREE.MeshBasicMaterial({ color: 0xfff4d6 }), 0.04, 0, 0));
  }
  g.add(core, glow(color, kind === 'T' ? 3 : 1.9));
  g.position.set(x, 1.0, z); L.group.add(g);
  const p = { kind, x, z, mesh: g, color, tomeId, t: rand(0, 6) };
  L.pickups.push(p);
  return p;
}

// =====================================================================
// Níveis
// =====================================================================
function disposeLevel() {
  if (!L) return;
  scene.remove(L.group); disposeObj(L.group);
  clearParticles(); L = null;
}

function buildLevel(idx) {
  disposeLevel();
  const def = LEVELS[idx], th = def.theme, rows = def.map;
  const H = rows.length, W = Math.max(...rows.map(r => r.length));
  const group = new THREE.Group(); scene.add(group);
  L = {
    idx, def, W, H, grid: new Uint8Array(W * H), dist: new Int16Array(W * H), queue: new Int32Array(W * H), group,
    enemies: [], pickups: [], projs: [], fx: [], portal: null, runesTotal: 0, runesGot: 0, killsNeeded: 0, kills: 0,
    done: false, won: false, endT: 0, t: 0, lines: def.lines.slice(), boss: null,
  };
  scene.fog = new THREE.FogExp2(th.fog, th.fogD);
  renderer.setClearColor(th.fog);
  ambient.intensity = th.amb; ambient.color.setHex(th.light);
  torch.color.setHex(th.light);

  const wallCells = [], spawns = [];
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    const ch = rows[z][x] || '#', wx = (x + 0.5) * CELL, wz = (z + 0.5) * CELL;
    if (ch === '#') { L.grid[z * W + x] = 1; wallCells.push([x, z]); continue; }
    if (ch === 'P') { player.x = wx; player.z = wz; }
    else if (ETYPES[ch]) spawns.push([ch, wx, wz]);
    else if (ch === 'E') L.portalPos = [wx, wz];
    else if (ch === 'h' || ch === 'm' || ch === 'r' || ch === 'T') { makePickup(ch, wx, wz, def.tome); if (ch === 'r') L.runesTotal++; }
  }

  // paredes (instanciadas), chão e teto
  const wallTex = makeTex(th.wall, 'brick'); wallTex.repeat.set(1, WALL_H / CELL);
  const floorTex = makeTex(th.floor, 'tile'); floorTex.repeat.set(W, H);
  const visible = wallCells.filter(([x, z]) => {
    for (let oz = -1; oz <= 1; oz++) for (let ox = -1; ox <= 1; ox++) {
      const nx = x + ox, nz = z + oz;
      if (nx >= 0 && nz >= 0 && nx < W && nz < H && !L.grid[nz * W + nx]) return true;
    }
    return false;
  });
  const surf = (map, color = 0xffffff) => new THREE.MeshPhongMaterial({ map, color, shininess: 3, specular: 0x0a0a0a });
  const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL, WALL_H, CELL), surf(wallTex), visible.length);
  const m4 = new THREE.Matrix4();
  visible.forEach(([x, z], i) => { m4.makeTranslation((x + 0.5) * CELL, WALL_H / 2, (z + 0.5) * CELL); walls.setMatrixAt(i, m4); });
  walls.instanceMatrix.needsUpdate = true; walls.frustumCulled = false; group.add(walls);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * CELL, H * CELL), surf(floorTex));
  floor.rotation.x = -Math.PI / 2; floor.position.set(W * CELL / 2, 0, H * CELL / 2); group.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W * CELL, H * CELL), surf(floorTex, 0x777777));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(W * CELL / 2, WALL_H, H * CELL / 2); group.add(ceil);

  // cristais decorativos junto às paredes
  const crystalMat = new THREE.MeshBasicMaterial({ color: th.accent });
  let crystals = 0;
  for (let z = 1; z < H - 1 && crystals < 16; z++) for (let x = 1; x < W - 1 && crystals < 16; x++) {
    if (L.grid[z * W + x] || rows[z][x] !== '.' || Math.random() > 0.085) continue;
    const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([ox, oz]) => L.grid[(z + oz) * W + x + ox]);
    if (!side) continue;
    const cx = (x + 0.5 + side[0] * 0.4) * CELL, cz = (z + 0.5 + side[1] * 0.4) * CELL;
    for (let i = 0; i < 3; i++) {
      const h = rand(0.5, 1.3), c = new THREE.Mesh(new THREE.ConeGeometry(0.13, h, 5), crystalMat);
      c.position.set(cx + rand(-0.25, 0.25), h / 2, cz + rand(-0.25, 0.25)); c.rotation.set(rand(-0.3, 0.3), 0, rand(-0.3, 0.3)); group.add(c);
    }
    group.add(glow(th.accent, 3.2, cx, 0.7, cz)); crystals++;
  }

  // portal
  if (L.portalPos) {
    const pg = new THREE.Group(); pg.position.set(L.portalPos[0], 0, L.portalPos[1]);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.22, 20), stdMat(0x3a3640)); base.position.y = 0.11;
    const spin = new THREE.Group(); spin.position.y = 1.95;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.14, 8, 36), new THREE.MeshBasicMaterial({ color: 0x3a3640 }));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.3, 28), new THREE.MeshBasicMaterial({ color: th.accent, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    const gl = glow(th.accent, 7); disc.visible = gl.visible = false;
    spin.add(ring, disc, gl); pg.add(base, spin); group.add(pg);
    L.portal = { x: L.portalPos[0], z: L.portalPos[1], spin, ring, disc, gl, active: false };
  }

  for (const [k, x, z] of spawns) { const e = spawnEnemy(k, x, z, false); if (e.T.boss) L.boss = e; }
  L.killsNeeded = L.enemies.length;

  // jogador
  Object.assign(player, { y: 0, vy: 0, yaw: def.yaw, pitch: 0, hp: 100, mana: 100, castCd: 0, novaCd: 0, dashCd: 0, dashT: 0, shake: 0, kick: 0, hurtT: 0, cell: -1, spell: 0 });
  player.unlocked = {}; def.spells.forEach(s => player.unlocked[s] = true);
  player.nova = !!def.nova;
  mouseDown = false;
  computeFlow(); setStaffColor();
  $('bossbar').classList.toggle('hidden', !L.boss);
  updateObjectiveText();
}

function updateObjectiveText() {
  const d = L.def; let t;
  if (L.won) t = 'Malakar foi derrotado.';
  else if (L.done) t = 'O portal está aberto — encontre-o no mapa.';
  else if (d.obj === 'kill') t = `Derrote as criaturas: ${Math.min(L.kills, L.killsNeeded)} / ${L.killsNeeded}`;
  else if (d.obj === 'runes') t = `Reúna os fragmentos de runa: ${L.runesGot} / ${L.runesTotal}`;
  else t = 'Derrote Malakar, o Devorador de Runas';
  $('objective').innerHTML = `<small>OBJETIVO</small>${t}`;
}
function checkObjective() {
  if (!L.done && L.def.obj !== 'boss') {
    const ok = L.def.obj === 'kill' ? L.kills >= L.killsNeeded : L.runesGot >= L.runesTotal;
    if (ok) {
      L.done = true;
      const p = L.portal; p.active = true; p.disc.visible = p.gl.visible = true; p.ring.material.color.setHex(L.def.theme.accent);
      say('Ysolde', 'O portal despertou. Vá!'); sfx.portal(); toast('✦ O portal se abriu ✦');
    }
  }
  updateObjectiveText();
}

// =====================================================================
// HUD: legendas, avisos, slots
// =====================================================================
const subQ = []; let subT = 0, toastT = 0, hitT = 0, bannerT = 0;
function say(who, text, dur = 5) { subQ.push({ who, text, dur }); }
function toast(text) { const el = $('toast'); el.textContent = text; el.classList.add('show'); toastT = 2.6; }
function hitmarker(crit) { const el = $('hitmarker'); el.classList.add('show'); el.classList.toggle('crit', !!crit); hitT = 0.09; }
function updateHudTimers(dt) {
  if (subT > 0) { subT -= dt; if (subT <= 0) $('subtitle').classList.remove('show'); }
  else if (subQ.length) {
    const s = subQ.shift(), el = $('subtitle');
    el.innerHTML = `<b class="${s.who === 'Malakar' ? 'evil' : ''}">${s.who}:</b> ${s.text}`; el.classList.add('show'); subT = s.dur;
  }
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.remove('show'); }
  if (hitT > 0) { hitT -= dt; if (hitT <= 0) $('hitmarker').classList.remove('show'); }
  if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('chapterTitle').classList.remove('show'); }
}
const SLOTS = [
  ...SPELLS.map((s, i) => ({ key: s.key, icon: s.icon, name: s.name, spell: i })),
  { key: 'Q', icon: '✴️', name: 'Nova Arcana', nova: true },
  { key: '⇧', icon: '💨', name: 'Passo Etéreo', dash: true },
];
SLOTS.forEach(s => {
  const el = document.createElement('div'); el.className = 'slot';
  el.innerHTML = `<span class="key">${s.key}</span><span class="ico">${s.icon}</span><span class="nm">${s.name}</span><i class="cd"></i>`;
  $('spells').appendChild(el); s.el = el; s.cdEl = el.querySelector('.cd');
});
function updateHud() {
  $('hpfill').style.width = player.hp + '%'; $('hptxt').textContent = 'VIDA  ' + Math.ceil(player.hp);
  $('mpfill').style.width = player.mana + '%'; $('mptxt').textContent = 'MANA  ' + Math.floor(player.mana);
  const low = player.hp < 30 ? 0.25 + Math.sin(L.t * 6) * 0.12 : 0;
  $('vignette').style.opacity = clamp(player.hurtT * 0.9 + low, 0, 1).toFixed(2);
  for (const s of SLOTS) {
    let cls = 'slot', cd = 0;
    if (s.spell !== undefined) { if (!player.unlocked[SPELLS[s.spell].id]) cls += ' locked'; else if (player.spell === s.spell) cls += ' active'; }
    else if (s.nova) { if (!player.nova) cls += ' locked'; else cd = player.novaCd / NOVA.cd; }
    else cd = player.dashCd / 1.3;
    if (s.el.className !== cls) s.el.className = cls;
    s.cdEl.style.height = (clamp(cd, 0, 1) * 100).toFixed(0) + '%';
  }
  if (L.boss) $('bossfill').style.width = clamp(L.boss.hp / L.boss.maxHp * 100, 0, 100) + '%';
}
const mm = $('minimap'), mmCtx = mm.getContext('2d');
function drawMinimap() {
  const g = mmCtx, S = mm.width; g.clearRect(0, 0, S, S);
  const s = Math.floor((S - 16) / Math.max(L.W, L.H)), ox = (S - L.W * s) / 2, oz = (S - L.H * s) / 2;
  g.fillStyle = 'rgba(200,190,230,.2)';
  for (let z = 0; z < L.H; z++) for (let x = 0; x < L.W; x++) if (!L.grid[z * L.W + x]) g.fillRect(ox + x * s, oz + z * s, s + 0.5, s + 0.5);
  const dot = (wx, wz, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(ox + wx / CELL * s, oz + wz / CELL * s, r, 0, 6.283); g.fill(); };
  for (const p of L.pickups) {
    if (p.kind === 'r') dot(p.x, p.z, 5, '#ffd24a'); else if (p.kind === 'T') dot(p.x, p.z, 6, '#d18bff');
    else dot(p.x, p.z, 3, p.kind === 'h' ? 'rgba(255,90,110,.8)' : 'rgba(110,190,255,.8)');
  }
  if (L.portal) dot(L.portal.x, L.portal.z, L.portal.active ? 7 + Math.sin(L.t * 5) * 2 : 5, L.portal.active ? '#7dffb0' : 'rgba(160,160,170,.6)');
  for (const e of L.enemies) if (!e.dead && (e.aggro || Math.hypot(e.x - player.x, e.z - player.z) < 22)) dot(e.x, e.z, e.T.boss ? 8 : 4.5, '#ff3355');
  g.save(); g.translate(ox + player.x / CELL * s, oz + player.z / CELL * s); g.rotate(-player.yaw);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -9); g.lineTo(6.5, 7); g.lineTo(0, 3.5); g.lineTo(-6.5, 7); g.closePath(); g.fill(); g.restore();
}

// =====================================================================
// Magias
// =====================================================================
const _dir = new THREE.Vector3(), _org = new THREE.Vector3(), _tmp = new THREE.Vector3();
function setStaffColor() {
  const c = SPELLS[player.spell].color;
  gemMat.color.setHex(c); gemGlowMat.color.setHex(c); viewLight.color.setHex(c);
}
function selectSpell(i) {
  if (i === player.spell || !SPELLS[i] || !player.unlocked[SPELLS[i].id]) return;
  player.spell = i; setStaffColor(); tone(500 + i * 160, 700 + i * 160, 0.08, 'sine', 0.06);
}
function cycleSpell(d) {
  for (let k = 1; k <= SPELLS.length; k++) {
    const i = (player.spell + d * k + SPELLS.length * 2) % SPELLS.length;
    if (player.unlocked[SPELLS[i].id]) { selectSpell(i); return; }
  }
}
function rayMarch(o, d, max) {
  for (let t = 0.3; t < max; t += 0.2) {
    const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
    if (y < 0 || y > WALL_H || isWallAt(x, z)) return { x, y, z, enemy: null, dist: t };
    for (const e of L.enemies) {
      if (e.dead) continue;
      const dx = x - e.x, dz = z - e.z, rr = e.T.radius + 0.1;
      if (dx * dx + dz * dz < rr * rr && y < e.T.height + 0.4) return { x, y, z, enemy: e, dist: t };
    }
  }
  return { x: o.x + d.x * max, y: o.y + d.y * max, z: o.z + d.z * max, enemy: null, dist: max };
}
function spawnProj(o) {
  const mesh = new THREE.Group();
  mesh.add(glow(o.color, o.size * 4.2), ball(o.size * 0.55, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 0, 0));
  mesh.position.copy(o.pos); L.group.add(mesh);
  L.projs.push({ mesh, pos: o.pos.clone(), vel: o.dir.clone().multiplyScalar(o.speed), dmg: o.dmg, color: o.color, kind: o.kind, enemy: !!o.enemy, life: o.life || 3, hit: new Set() });
}
function drawBolt(ax, ay, az, bx, by, bz, color) {
  const len = Math.hypot(bx - ax, by - ay, bz - az), n = Math.max(4, Math.floor(len / 1.1));
  for (let s = 0; s < 3; s++) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, j = i === 0 || i === n ? 0 : 0.38;
      pts.push(new THREE.Vector3(ax + (bx - ax) * t + rand(-j, j), ay + (by - ay) * t + rand(-j, j), az + (bz - az) * t + rand(-j, j)));
      if (s === 0 && i % 2 === 0) puff(pts[i].x, pts[i].y, pts[i].z, color, 1, 0.4, 0.25);
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: s ? color : 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    L.group.add(line);
    L.fx.push({ obj: line, life: 0.16, max: 0.16, tick: (k, fx) => { fx.obj.material.opacity = k; } });
  }
}
function tryCast() {
  const sp = SPELLS[player.spell];
  if (player.castCd > 0) return;
  if (player.mana < sp.cost) {
    if (player.fizzleT <= 0) { player.fizzleT = 0.4; sfx.fizzle(); const b = $('mpbar'); b.classList.remove('low'); void b.offsetWidth; b.classList.add('low'); }
    return;
  }
  player.mana -= sp.cost; player.castCd = sp.cd; player.kick = 1;
  camera.getWorldDirection(_dir);
  const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
  _org.copy(camera.position).addScaledVector(_dir, 0.4); _org.x += rx * 0.26; _org.z += rz * 0.26; _org.y -= 0.2;
  const hit = rayMarch(camera.position, _dir, 60);
  flashLight(_org.x, _org.y, _org.z, sp.color, 1.6, 0.18);
  if (sp.id === 'bolt') {
    sfx.bolt(); player.shake = Math.max(player.shake, 0.12);
    drawBolt(_org.x, _org.y, _org.z, hit.x, hit.y, hit.z, sp.color);
    puff(hit.x, hit.y, hit.z, sp.color, 16, 6, 0.4); flashLight(hit.x, hit.y, hit.z, sp.color, 2.4, 0.25);
    if (hit.enemy) {
      let from = hit.enemy; const done = new Set([from]);
      damageEnemy(from, sp.dmg, 'bolt');
      for (let c = 0; c < 2; c++) {
        let best = null, bd = 8.5;
        for (const e of L.enemies) {
          if (e.dead || done.has(e)) continue;
          const d = Math.hypot(e.x - from.x, e.z - from.z);
          if (d < bd && los(from.x, from.z, e.x, e.z)) { bd = d; best = e; }
        }
        if (!best) break;
        drawBolt(from.x, from.T.height * 0.6, from.z, best.x, best.T.height * 0.6, best.z, sp.color);
        damageEnemy(best, sp.dmg * 0.6, 'bolt'); done.add(best); from = best;
      }
    }
    return;
  }
  // projétil: mira no ponto sob a retícula para corrigir a paralaxe do cajado
  const d = Math.max(hit.dist, 3);
  _tmp.copy(camera.position).addScaledVector(_dir, d).sub(_org).normalize();
  spawnProj({ pos: _org, dir: _tmp, speed: sp.speed, dmg: sp.dmg, color: sp.color, kind: sp.id, size: sp.id === 'ice' ? 0.16 : 0.13 });
  sfx[sp.id]();
}
function castNova() {
  if (!player.nova || player.novaCd > 0) return;
  if (player.mana < NOVA.cost) { sfx.fizzle(); toast('Mana insuficiente'); return; }
  player.mana -= NOVA.cost; player.novaCd = NOVA.cd; player.kick = 1.5; player.shake = 0.35; sfx.nova();
  const y = 1.1 + player.y;
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 56), new THREE.MeshBasicMaterial({ color: i ? 0xffffff : 0xb98bff, transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(player.x, y - i * 0.6, player.z); L.group.add(ring);
    L.fx.push({ obj: ring, life: 0.45 + i * 0.1, max: 0.45 + i * 0.1, tick: (k, fx) => { const s = 1 + (1 - k) * NOVA.radius; fx.obj.scale.set(s, s, 1); fx.obj.material.opacity = k; } });
  }
  puff(player.x, y, player.z, 0xb98bff, 90, 16, 0.7); flashLight(player.x, y + 0.5, player.z, 0xb98bff, 4, 0.5);
  for (const e of L.enemies) {
    if (e.dead) continue;
    const dx = e.x - player.x, dz = e.z - player.z, d = Math.hypot(dx, dz) || 1;
    if (d > NOVA.radius + e.T.radius) continue;
    if (!e.T.boss) moveCircle(e, dx / d * 3.5, dz / d * 3.5, e.T.radius * 0.8);
    e.slow = Math.max(e.slow, 1.2);
    damageEnemy(e, NOVA.dmg, 'nova');
  }
  for (const p of L.projs) if (p.enemy && Math.hypot(p.pos.x - player.x, p.pos.z - player.z) < NOVA.radius) { p.life = 0; puff(p.pos.x, p.pos.y, p.pos.z, 0xb98bff, 5, 3, 0.3); }
}

function impact(p, e) {
  const { x, y, z } = p.pos;
  if (p.enemy) { puff(x, y, z, p.color, 8, 4, 0.35); return; }
  if (p.kind === 'fire') {
    puff(x, y, z, 0xff7a1a, 16, 7, 0.45, 4); puff(x, y, z, 0xffd27a, 6, 3, 0.3);
    flashLight(x, y, z, 0xff7a1a, 2.2, 0.22); sfx.boom();
    if (e) damageEnemy(e, p.dmg, 'fire');
    for (const o of L.enemies) if (!o.dead && o !== e && Math.hypot(o.x - x, o.z - z) < 2.4 + o.T.radius) damageEnemy(o, p.dmg * 0.4, 'fire');
  } else {
    puff(x, y, z, 0x9fe6ff, 14, 6, 0.5, 6); flashLight(x, y, z, 0x6fd8ff, 1.6, 0.2);
    if (e) damageEnemy(e, p.dmg, 'ice');
  }
}

function damageEnemy(e, dmg, kind) {
  if (e.dead || L.won) return;
  const mult = (e.T.res && e.T.res[kind]) || 1;
  e.hp -= dmg * mult; e.flash = 0.1; e.barT = 4;
  if (kind === 'fire') e.burn = 2.5;
  if (kind === 'ice') e.slow = 3;
  if (!e.aggro) { e.aggro = true; }
  for (const o of L.enemies) if (!o.aggro && Math.hypot(o.x - e.x, o.z - e.z) < 10) o.aggro = true;
  hitmarker(mult > 1.1); sfx.hit();
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  if (e.dead) return;
  e.dead = true; L.group.remove(e.root); disposeObj(e.root);
  const col = e.k === 'g' ? 0x9bd16a : e.k === 'a' ? 0xb04dff : e.k === 'B' ? 0xff7a2a : 0xff3355;
  puff(e.x, e.T.height * 0.55, e.z, col, e.T.boss ? 160 : 34, e.T.boss ? 14 : 7, e.T.boss ? 1.4 : 0.7, 5);
  flashLight(e.x, 1.5, e.z, col, e.T.boss ? 5 : 2, e.T.boss ? 1 : 0.3); sfx.kill();
  L.kills++; totalKills++;
  if (e.T.boss) { bossDeath(); return; }
  const r = Math.random();
  if (e.k === 'B') makePickup(r < 0.5 ? 'h' : 'm', e.x, e.z);
  else if (r < 0.26) makePickup('m', e.x, e.z);
  else if (r < 0.38) makePickup('h', e.x, e.z);
  checkObjective();
}
function bossDeath() {
  L.won = true; L.endT = 4; player.shake = 0.6; sfx.nova();
  for (const o of L.enemies) if (!o.dead) { o.dead = true; L.group.remove(o.root); disposeObj(o.root); puff(o.x, 1.2, o.z, 0xb04dff, 20, 5, 0.6); }
  for (const p of L.projs) p.life = 0;
  subQ.length = 0; subT = 0;
  say('Malakar', 'Impossível… um… aprendiz…', 3.5);
  updateObjectiveText();
}

// =====================================================================
// Inimigos
// =====================================================================
function enemyShoot(e, dmg, speed, angle = 0, flat = false) {
  const oy = flat ? 1.3 : e.T.height * 0.68;
  _org.set(e.x, oy, e.z);
  _tmp.set(player.x - e.x, flat ? 0 : (1.25 + player.y) - oy, player.z - e.z).normalize();
  if (angle) { const c = Math.cos(angle), s = Math.sin(angle), x = _tmp.x * c - _tmp.z * s, z = _tmp.x * s + _tmp.z * c; _tmp.x = x; _tmp.z = z; }
  _org.addScaledVector(_tmp, e.T.radius + 0.3);
  spawnProj({ pos: _org, dir: _tmp, speed, dmg, color: e.T.boss ? 0xff3355 : 0xb04dff, enemy: true, size: e.T.boss ? 0.2 : 0.16, life: 5 });
}
function chaseDir(e, dx, dz, dist, sees) {
  if (sees) {
    const px = -dz / dist * 0.7, pz = dx / dist * 0.7;
    if (los(e.x + px, e.z + pz, player.x + px, player.z + pz) && los(e.x - px, e.z - pz, player.x - px, player.z - pz)) return [dx / dist, dz / dist];
  }
  return flowDir(e) || [dx / dist, dz / dist];
}
function freeCellNear(x, z, minR, maxR, awayFromPlayer) {
  for (let tries = 0; tries < 60; tries++) {
    const a = rand(0, 6.283), r = rand(minR, maxR), nx = x + Math.cos(a) * r, nz = z + Math.sin(a) * r;
    if (blocked(nx, nz, 1.4)) continue;
    if (Math.hypot(nx - player.x, nz - player.z) < awayFromPlayer) continue;
    return [nx, nz];
  }
  return null;
}
function summon(boss, kinds) {
  for (const k of kinds) {
    const p = freeCellNear(boss.x, boss.z, 4, 12, 5); if (!p) continue;
    spawnEnemy(k, p[0], p[1], true);
    puff(p[0], 1.2, p[1], 0xb04dff, 30, 5, 0.8); flashLight(p[0], 1.5, p[1], 0xb04dff, 2, 0.4);
  }
  sfx.tele();
}
function bossBrain(e, dt, dx, dz, dist, sees) {
  const frac = e.hp / e.maxHp;
  if (e.phase === 1 && frac < 0.66) { e.phase = 2; say('Malakar', 'Levantem-se, meus mortos!', 3.5); summon(e, ['g', 'g', 'g']); }
  if (e.phase === 2 && frac < 0.33) { e.phase = 3; e.tp = 2; say('Malakar', 'CHEGA! Devorei runas mais antigas que a sua linhagem!', 4); summon(e, ['g', 'g', 'a']); }
  if (e.phase === 3) {
    e.tp -= dt;
    if (e.tp <= 0) {
      e.tp = 6;
      const p = freeCellNear(player.x, player.z, 11, 24, 10);
      if (p) { puff(e.x, 2, e.z, 0x7a2cff, 40, 6, 0.6); e.x = p[0]; e.z = p[1]; puff(e.x, 2, e.z, 0xff3355, 40, 6, 0.6); sfx.tele(); }
    }
  }
  if (e.cd <= 0 && sees) {
    e.shots++; sfx.orb();
    if (e.phase === 3 && e.shots % 3 === 0) { for (let i = 0; i < 14; i++) enemyShoot(e, e.T.ranged, 12, i * 6.283 / 14, true); }
    else { const n = e.phase === 1 ? 3 : 5; for (let i = 0; i < n; i++) enemyShoot(e, e.T.ranged, 16, (i - (n - 1) / 2) * 0.16); }
    e.cd = e.phase === 1 ? 1.7 : e.phase === 2 ? 1.35 : 1.1;
  }
  if (dist < 9) return [-dx / dist, -dz / dist];
  if (dist > 17 || !sees) return chaseDir(e, dx, dz, dist, sees);
  if (Math.random() < dt * 0.5) e.strafe *= -1;
  return [-dz / dist * e.strafe * 0.7, dx / dist * e.strafe * 0.7];
}

function updateEnemy(e, dt) {
  const T = e.T; e.t += dt;
  if (e.burn > 0) {
    e.burn -= dt; e.hp -= 4 * dt * ((T.res && T.res.fire) || 1);
    if (Math.random() < dt * 14) puff(e.x + rand(-0.3, 0.3), rand(0.5, T.height), e.z + rand(-0.3, 0.3), 0xff7a1a, 1, 1, 0.5, -2.5);
    if (e.hp <= 0) { killEnemy(e); return; }
  }
  if (e.slow > 0) e.slow -= dt;
  if (e.flash > 0) e.flash -= dt;
  if (e.barT > 0) e.barT -= dt;
  const dx = player.x - e.x, dz = player.z - e.z, dist = Math.hypot(dx, dz) || 0.001;
  const sees = dist < 44 && los(e.x, e.z, player.x, player.z);
  if (!e.aggro && dist < 17 && sees) { e.aggro = true; if (!T.boss) sfx.growl(); }
  let mx = 0, mz = 0;
  const slowF = e.slow > 0 ? (T.boss ? 0.75 : 0.45) : 1;
  if (e.aggro) {
    e.cd -= dt;
    if (T.boss) [mx, mz] = bossBrain(e, dt, dx, dz, dist, sees);
    else if (T.ranged) {
      if (sees && dist < T.keep - 3) { mx = -dx / dist; mz = -dz / dist; }
      else if (!sees || dist > T.keep + 4) [mx, mz] = chaseDir(e, dx, dz, dist, sees);
      else { if (Math.random() < dt * 0.5) e.strafe *= -1; mx = -dz / dist * e.strafe * 0.5; mz = dx / dist * e.strafe * 0.5; }
      if (sees && e.cd <= 0 && dist < 32) { enemyShoot(e, T.ranged, 13); sfx.orb(); e.cd = T.atkCd + rand(0, 0.7); }
    } else if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0) { e.cd = T.atkCd; if (dist < T.range + 0.6) { hurtPlayer(T.melee); sfx.slash(); } }
    } else if (dist < T.range && e.cd <= 0 && sees) e.wind = T.windup;
    else if (dist > T.range * 0.75) [mx, mz] = chaseDir(e, dx, dz, dist, sees);
    e.mesh.rotation.y = Math.atan2(dx, dz);
  }
  if (mx || mz) {
    const sp = T.speed * slowF * dt;
    moveCircle(e, mx * sp, mz * sp, Math.min(T.radius, 0.9) * 0.8);
    e.walk += dt * T.speed * slowF * 1.7;
  }
  // mantém distância do jogador
  const minD = T.radius + 0.5;
  if (dist < minD && !T.boss) moveCircle(e, -dx / dist * (minD - dist), -dz / dist * (minD - dist), T.radius * 0.8);

  // animação
  const P = e.parts, sw = Math.sin(e.walk);
  e.root.position.set(e.x, (P.hover || 0) + (P.hover ? Math.sin(e.t * 2.2) * 0.12 : Math.abs(sw) * 0.06), e.z);
  if (P.legL) { P.legL.rotation.x = sw * 0.6; P.legR.rotation.x = -sw * 0.6; }
  if (e.k === 'g') { const a = e.wind > 0 ? -2.3 : -1.2 + sw * 0.15; P.armL.rotation.x = a; P.armR.rotation.x = a + (e.wind > 0 ? 0 : -sw * 0.3); }
  if (e.k === 'B') { const a = e.wind > 0 ? -2.6 : sw * 0.35; P.armL.rotation.x = a; P.armR.rotation.x = e.wind > 0 ? a : -a; }
  if (P.orb) { const s = 0.7 + Math.max(0, 1 - e.cd) * 0.7; P.orb.scale.set(s, s, 1); }
  if (P.handL) { const s = 1.1 + Math.sin(e.t * 5) * 0.2 + Math.max(0, 0.6 - e.cd); P.handL.scale.set(s, s, 1); P.handR.scale.set(s, s, 1); }
  const em = e.flash > 0 ? 0xbbbbbb : e.slow > 0 ? 0x1a4a7a : e.burn > 0 ? 0x4a1800 : 0x000000;
  if (e.em !== em) { e.em = em; for (const m of e.mats) m.emissive.setHex(em); }
  if (e.bar) {
    const show = e.barT > 0; e.bar.visible = e.barBg.visible = show;
    if (show) e.bar.scale.x = Math.max(0.01, 1.24 * e.hp / e.maxHp);
  }
}

// =====================================================================
// Jogador
// =====================================================================
function hurtPlayer(d) {
  if (state !== 'playing' || player.dashT > 0 || L.won) return;
  player.hp -= d * DIFF[diff]; player.hurtT = 1; player.shake = Math.max(player.shake, 0.28); sfx.hurt();
  if (player.hp <= 0) { player.hp = 0; die(); }
}
function updatePlayer(dt) {
  const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
  let mx = -sin * f + cos * s, mz = -cos * f - sin * s;
  const len = Math.hypot(mx, mz);
  if (len > 0) { mx /= len; mz /= len; }
  if ((keys.ShiftLeft || keys.ShiftRight) && player.dashCd <= 0 && player.dashT <= 0) {
    player.dashT = 0.16; player.dashCd = 1.3;
    player.dashX = len > 0 ? mx : -sin; player.dashZ = len > 0 ? mz : -cos;
    sfx.dash(); puff(player.x, 1 + player.y, player.z, 0x9fb8ff, 18, 3, 0.4);
  }
  if (player.dashT > 0) {
    player.dashT -= dt;
    const st = 28 * dt / 3;
    for (let i = 0; i < 3; i++) moveCircle(player, player.dashX * st, player.dashZ * st, 0.45);
  } else if (len > 0) {
    moveCircle(player, mx * 7.6 * dt, mz * 7.6 * dt, 0.45);
    if (player.y === 0) player.walkT += dt * 9;
  }
  if (keys.Space && player.y === 0) player.vy = 7.6;
  if (player.y > 0 || player.vy > 0) {
    player.vy -= 22 * dt; player.y += player.vy * dt;
    if (player.y <= 0) { player.y = 0; player.vy = 0; }
  }
  player.mana = Math.min(100, player.mana + 11 * dt);
  player.castCd -= dt; player.fizzleT -= dt;
  if (player.novaCd > 0) player.novaCd -= dt;
  if (player.dashCd > 0) player.dashCd -= dt;
  if (player.hurtT > 0) player.hurtT -= dt * 1.8;
  if (player.shake > 0) player.shake -= dt;
  if (player.kick > 0) player.kick = Math.max(0, player.kick - dt * 6);
  if (mouseDown) tryCast();

  const cell = Math.floor(player.z / CELL) * L.W + Math.floor(player.x / CELL);
  if (cell !== player.cell) { player.cell = cell; computeFlow(); }
}
function updateCamera(dt) {
  const moving = player.y === 0 ? 1 : 0, sh = Math.max(0, player.shake);
  camera.position.set(player.x, EYE + player.y + Math.sin(player.walkT) * 0.045 * moving, player.z);
  camera.rotation.set(player.pitch + rand(-1, 1) * sh * 0.05, player.yaw + rand(-1, 1) * sh * 0.05, rand(-1, 1) * sh * 0.03);
  const fov = player.dashT > 0 ? 90 : 75;
  if (Math.abs(camera.fov - fov) > 0.1) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 12); camera.updateProjectionMatrix(); }
  torch.position.set(player.x, EYE + player.y + 0.3, player.z);
  staff.position.set(0.4 + Math.cos(player.walkT * 0.5) * 0.008, -0.62 + Math.sin(player.walkT) * 0.012 - player.kick * 0.02, -0.9 + player.kick * 0.07);
  staff.rotation.set(-0.38 + player.kick * 0.22, 0, 0.16);
  const gs = 0.3 + player.kick * 0.4 + Math.sin(performance.now() * 0.006) * 0.025;
  staff.children.forEach(c => { if (c.isSprite) c.scale.set(gs, gs, 1); });
  viewLight.intensity = 1.4 + player.kick * 3;
}

// =====================================================================
// Atualizações do mundo
// =====================================================================
function updateProjectiles(dt) {
  for (let i = L.projs.length - 1; i >= 0; i--) {
    const p = L.projs[i]; p.life -= dt;
    let dead = p.life <= 0;
    for (let s = 0; s < 2 && !dead; s++) {
      p.pos.addScaledVector(p.vel, dt / 2);
      if (p.pos.y < 0.05 || p.pos.y > WALL_H - 0.05 || isWallAt(p.pos.x, p.pos.z)) { impact(p, null); dead = true; break; }
      if (p.enemy) {
        const dx = p.pos.x - player.x, dy = p.pos.y - (1.1 + player.y), dz = p.pos.z - player.z;
        if (dx * dx + dy * dy * 0.6 + dz * dz < 0.62) { hurtPlayer(p.dmg); impact(p, null); dead = true; }
      } else {
        for (const e of L.enemies) {
          if (e.dead || p.hit.has(e)) continue;
          const dx = p.pos.x - e.x, dz = p.pos.z - e.z, rr = e.T.radius + 0.25;
          if (dx * dx + dz * dz < rr * rr && p.pos.y < e.T.height + 0.5) {
            p.hit.add(e); impact(p, e);
            if (!(p.kind === 'ice' && p.hit.size < 3)) { dead = true; break; }
          }
        }
      }
    }
    p.mesh.position.copy(p.pos);
    if (Math.random() < 0.7) puff(p.pos.x, p.pos.y, p.pos.z, p.color, 1, 0.6, 0.3);
    if (dead) { L.group.remove(p.mesh); disposeObj(p.mesh); L.projs.splice(i, 1); }
  }
}
function updateFx(dt) {
  for (let i = L.fx.length - 1; i >= 0; i--) {
    const fx = L.fx[i]; fx.life -= dt;
    if (fx.life <= 0) { L.group.remove(fx.obj); disposeObj(fx.obj); L.fx.splice(i, 1); }
    else fx.tick(fx.life / fx.max, fx);
  }
  for (const l of fxLights) {
    const u = l.userData;
    if (u.t > 0) { u.t -= dt; l.intensity = u.t > 0 ? u.peak * u.t / u.max : 0; }
  }
}
function updatePickups(dt) {
  for (let i = L.pickups.length - 1; i >= 0; i--) {
    const p = L.pickups[i]; p.t += dt;
    p.mesh.position.y = 1 + Math.sin(p.t * 2.4) * 0.15; p.mesh.rotation.y += dt * 1.6;
    if (Math.hypot(p.x - player.x, p.z - player.z) > 1.5) continue;
    if (p.kind === 'h') { if (player.hp >= 100) continue; player.hp = Math.min(100, player.hp + 35); toast('+35 de vida'); sfx.pickup(); }
    else if (p.kind === 'm') { if (player.mana >= 99) continue; player.mana = Math.min(100, player.mana + 55); sfx.pickup(); }
    else if (p.kind === 'r') { L.runesGot++; toast(`Fragmento de runa ${L.runesGot} / ${L.runesTotal}`); sfx.tome(); checkObjective(); }
    else {
      const idx = SPELLS.findIndex(s => s.id === p.tomeId), sp = SPELLS[idx];
      player.unlocked[sp.id] = true; player.spell = idx; setStaffColor(); sfx.tome();
      toast(`Nova magia: ${sp.icon} ${sp.name}  —  tecla ${sp.key}`);
      say('Ysolde', sp.id === 'ice' ? 'A Lança de Gelo atravessa inimigos em fila e os deixa lentos.' : 'O Relâmpago acerta na hora e salta entre inimigos próximos.');
    }
    puff(p.x, 1, p.z, p.color, 24, 5, 0.6); flashLight(p.x, 1.2, p.z, p.color, 2, 0.3);
    L.group.remove(p.mesh); disposeObj(p.mesh); L.pickups.splice(i, 1);
  }
}
function updatePortal(dt) {
  const p = L.portal; if (!p) return;
  p.spin.rotation.y += dt * (p.active ? 1.4 : 0.2);
  if (!p.active) return;
  p.disc.material.opacity = 0.45 + Math.sin(L.t * 4) * 0.15;
  if (Math.random() < dt * 30) puff(p.x + rand(-1.2, 1.2), rand(0.4, 3.2), p.z + rand(-1.2, 1.2), L.def.theme.accent, 1, 0.8, 0.9, -1.5);
  if (Math.hypot(p.x - player.x, p.z - player.z) < 1.6) completeChapter();
}

function update(dt) {
  L.t += dt; totalTime += dt;
  while (L.lines.length && L.t >= L.lines[0][0]) { const l = L.lines.shift(); say(l[1], l[2]); }
  updatePlayer(dt);
  if (state !== 'playing') return;
  for (const e of L.enemies) if (!e.dead) updateEnemy(e, dt);
  // separação entre inimigos
  const es = L.enemies;
  for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
    const a = es[i], b = es[j]; if (a.dead || b.dead) continue;
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 0.01, min = a.T.radius + b.T.radius;
    if (d < min) {
      const push = (min - d) / 2, ux = dx / d, uz = dz / d;
      if (!a.T.boss) moveCircle(a, -ux * push, -uz * push, a.T.radius * 0.8);
      if (!b.T.boss) moveCircle(b, ux * push, uz * push, b.T.radius * 0.8);
    }
  }
  if (es.some(e => e.dead)) L.enemies = es.filter(e => !e.dead);
  updateProjectiles(dt); updateFx(dt); updatePickups(dt);
  if (state !== 'playing') return;
  updatePortal(dt);
  if (state !== 'playing') return;
  if (L.won) {
    L.endT -= dt;
    if (Math.random() < dt * 40) puff(player.x + rand(-9, 9), rand(0.5, 4), player.z + rand(-9, 9), 0xffd24a, 1, 1, 1.2, -1);
    if (L.endT <= 0) { showEnding(); return; }
  }
  updateParticles(dt); updateHudTimers(dt); updateHud();
  if ((frameN & 1) === 0) drawMinimap();
}

// =====================================================================
// Fluxo: menu, história, pausa, morte, final
// =====================================================================
const PANELS = ['menu', 'story', 'pause', 'death'];
function showPanel(id) { $('overlay').classList.remove('hidden'); PANELS.forEach(p => $(p).classList.toggle('hidden', p !== id)); }
function hidePanels() { $('overlay').classList.add('hidden'); }
function lockPointer() { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* sem captura */ } }
function unlockPointer() { if (document.pointerLockElement) document.exitPointerLock(); }
function fmtTime(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return `${m}:${s < 10 ? '0' : ''}${s}`; }

function loadSave() { try { return JSON.parse(localStorage.getItem('veuArcano.save') || 'null'); } catch (e) { return null; } }
function writeSave(v) { try { if (v) localStorage.setItem('veuArcano.save', JSON.stringify(v)); else localStorage.removeItem('veuArcano.save'); } catch (e) { /* armazenamento indisponível */ } }

let story = null, typeTimer = null;
function showStory(o) {
  story = Object.assign({ i: 0 }, o); state = 'story';
  $('hud').classList.add('hidden'); showPanel('story');
  $('storyGlyph').textContent = o.glyph; $('storyChap').textContent = o.chap; $('storyTitle').textContent = o.title; $('storyNote').textContent = o.note || '';
  storyPage();
}
function storyPage() {
  const text = story.pages[story.i], el = $('storyText'); let n = 0;
  $('storyDots').innerHTML = story.pages.map((_, k) => `<span class="${k === story.i ? 'on' : ''}">◆</span>`).join('');
  $('btnStoryNext').textContent = story.i < story.pages.length - 1 ? 'Continuar' : story.last;
  clearInterval(typeTimer); el.textContent = ''; story.typing = true;
  typeTimer = setInterval(() => {
    n += 2; el.textContent = text.slice(0, n);
    if (n >= text.length) { clearInterval(typeTimer); story.typing = false; }
  }, 22);
}
function storyNext() {
  if (!story) return;
  if (story.typing) { clearInterval(typeTimer); story.typing = false; $('storyText').textContent = story.pages[story.i]; return; }
  if (story.i < story.pages.length - 1) { story.i++; storyPage(); return; }
  const done = story.done; story = null; done();
}

function openChapter(i, note) {
  chapter = i; writeSave({ chapter: i, diff });
  const d = LEVELS[i];
  showStory({ glyph: d.glyph, chap: 'CAPÍTULO ' + ROMAN[i], title: d.name, pages: d.story, note, last: 'Começar', done: () => beginLevel(i) });
}
function beginLevel(i) {
  chapter = i; buildLevel(i);
  subQ.length = 0; subT = 0; $('subtitle').classList.remove('show'); $('toast').classList.remove('show');
  state = 'playing'; hidePanels(); $('hud').classList.remove('hidden');
  $('chapterTitle').querySelector('.n').textContent = 'CAPÍTULO ' + ROMAN[i];
  $('chapterTitle').querySelector('.t').textContent = LEVELS[i].name;
  $('chapterTitle').classList.add('show'); bannerT = 3.5;
  if (LEVELS[i].nova) toast('✴️ Nova Arcana desbloqueada — tecla Q');
  initAudio(); lockPointer(); updateCamera(0); updateHud(); drawMinimap();
}
function completeChapter() {
  if (state !== 'playing') return;
  sfx.portal(); state = 'story'; unlockPointer();
  openChapter(chapter + 1, `Capítulo ${ROMAN[chapter]} concluído em ${fmtTime(L.t)}  ·  ${L.kills} criaturas derrotadas`);
}
function die() {
  state = 'dead'; unlockPointer(); mouseDown = false;
  $('deathStat').textContent = `Capítulo ${ROMAN[chapter]} — ${LEVELS[chapter].name}. A Mestra Ysolde ainda espera por você.`;
  showPanel('death');
}
function pause() {
  if (state !== 'playing') return;
  state = 'paused'; mouseDown = false; for (const k in keys) keys[k] = false;
  showPanel('pause'); unlockPointer();
}
function resume() { if (state !== 'paused') return; state = 'playing'; hidePanels(); lockPointer(); }
function showEnding() {
  unlockPointer(); writeSave(null);
  showStory({
    glyph: '✦', chap: 'EPÍLOGO', title: 'O Guardião do Véu', pages: ENDING, last: 'Menu principal',
    note: `Tempo total: ${fmtTime(totalTime)}  ·  ${totalKills} criaturas derrotadas`, done: toMenu,
  });
}
function toMenu() {
  state = 'menu'; unlockPointer(); $('hud').classList.add('hidden');
  buildLevel(0); refreshMenu(); showPanel('menu');
}
function refreshMenu() {
  const sv = loadSave(), b = $('btnContinue');
  if (sv && sv.chapter > 0 && sv.chapter < LEVELS.length) { b.classList.remove('hidden'); b.textContent = `Continuar — Capítulo ${ROMAN[sv.chapter]}`; }
  else b.classList.add('hidden');
  document.querySelectorAll('#diffRow .btn').forEach(el => el.classList.toggle('on', +el.dataset.diff === diff));
}

$('btnNew').onclick = () => { initAudio(); totalTime = 0; totalKills = 0; openChapter(0); };
$('btnContinue').onclick = () => { initAudio(); const sv = loadSave(); totalTime = 0; totalKills = 0; openChapter(sv ? sv.chapter : 0); };
$('btnStoryNext').onclick = storyNext;
$('btnResume').onclick = resume;
$('btnRestart').onclick = () => beginLevel(chapter);
$('btnRetry').onclick = () => beginLevel(chapter);
$('btnQuit').onclick = toMenu;
$('btnDeathQuit').onclick = toMenu;
document.querySelectorAll('#diffRow .btn').forEach(el => el.onclick = () => { diff = +el.dataset.diff; refreshMenu(); });
// tira o foco do botão clicado para Espaço/Enter não o acionarem de novo durante o jogo
document.querySelectorAll('.btn').forEach(el => el.addEventListener('click', () => el.blur()));

// =====================================================================
// Entrada
// =====================================================================
window.addEventListener('keydown', e => {
  if (state === 'story' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); if (!e.repeat) storyNext(); return; }
  if (state === 'paused' && e.code === 'KeyP') { resume(); return; }
  if (state !== 'playing') return;
  keys[e.code] = true;
  if (e.code === 'Space' || e.code.startsWith('Arrow') || e.code === 'Tab') e.preventDefault();
  if (e.repeat) return;
  if (e.code === 'Digit1') selectSpell(0);
  else if (e.code === 'Digit2') selectSpell(1);
  else if (e.code === 'Digit3') selectSpell(2);
  else if (e.code === 'KeyQ') castNova();
  else if (e.code === 'KeyP' || (e.code === 'Escape' && !locked)) pause();
  else if (e.code === 'KeyM') { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.5; toast(muted ? 'Som desligado' : 'Som ligado'); }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseDown = false; });
canvas.addEventListener('mousedown', e => {
  if (state !== 'playing') return;
  if (!locked) { lockPointer(); return; }
  if (e.button === 0) mouseDown = true;
  else if (e.button === 2) castNova();
});
window.addEventListener('mouseup', e => { if (e.button === 0) mouseDown = false; });
window.addEventListener('mousemove', e => {
  if (!locked || state !== 'playing') return;
  player.yaw -= e.movementX * 0.0022;
  player.pitch = clamp(player.pitch - e.movementY * 0.0022, -1.45, 1.45);
});
window.addEventListener('wheel', e => { if (state === 'playing') cycleSpell(e.deltaY > 0 ? 1 : -1); }, { passive: true });
window.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('pointerlockerror', () => { if (state === 'playing') toast('Clique na tela para capturar o mouse'); });
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  if (!locked && state === 'playing') pause();
});

// =====================================================================
// Loop
// =====================================================================
let last = performance.now(), frameN = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now; frameN++;
  if (state === 'playing' && raw < 0.1) {
    perfAcc += raw;
    if (++perfN >= 90) {
      const slow = perfAcc / perfN > 1 / 40; perfAcc = perfN = 0;
      perfBad = slow ? perfBad + 1 : 0;
      if (perfBad >= 2 && prScale > 0.5) { perfBad = 0; prScale = Math.max(0.5, prScale * 0.8); renderer.setPixelRatio(MAX_PR * prScale); resize(); }
    }
  }
  if (state === 'playing') { update(dt); if (L && state === 'playing') updateCamera(dt); }
  else if (state === 'menu' || state === 'story') {
    player.yaw += dt * 0.06; updateCamera(dt); updateParticles(dt);
    if (L && L.portal) L.portal.spin.rotation.y += dt * 0.3;
  }
  renderer.clear();
  renderer.render(scene, camera);
  if (state === 'playing' || state === 'paused') { renderer.clearDepth(); renderer.render(viewScene, viewCam); }
}

buildLevel(0); refreshMenu(); showPanel('menu'); updateCamera(0);
requestAnimationFrame(frame);

// gancho de depuração (útil para testes automatizados)
window.__veu = {
  get state() { return state; }, get level() { return L; }, player, beginLevel, damageEnemy, castNova, tryCast, selectSpell, showEnding,
  step(n = 1, dt = 1 / 60) { for (let i = 0; i < n && state === 'playing'; i++) { update(dt); if (state === 'playing') updateCamera(dt); } },
};
})();
