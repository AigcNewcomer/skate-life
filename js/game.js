const LANE_COUNT = { easy: 3, medium: 4, hard: 5 };
const LEVELS = [
  // 第1关：粉色浪漫
  {
    name: '第 1 关 粉色浪漫',
    bg: 0x1a0a15,
    ground: 0xff69b4,
    accent: 0xff1493,
    fog: 0x1a0a15,
    sky: 0xff69b4,
    decor: 0xff69b4,
    obstacle: 0xff1493,
    particle: 0xff69b4,
  },
  // 第2关：热带夏日
  {
    name: '第 2 关 热带夏日',
    bg: 0x1a1005,
    ground: 0xff6347,
    accent: 0xffd700,
    fog: 0x1a1005,
    sky: 0xff8c00,
    decor: 0x228b22,
    obstacle: 0xff6347,
    particle: 0xffd700,
  },
  // 第3关：森林氧吧
  {
    name: '第 3 关 森林氧吧',
    bg: 0x051005,
    ground: 0x228b22,
    accent: 0x90ee90,
    fog: 0x051005,
    sky: 0x228b22,
    decor: 0x006400,
    obstacle: 0x32cd32,
    particle: 0x90ee90,
  },
  // 第4关：极简黑白
  {
    name: '第 4 关 极简黑白',
    bg: 0x0a0a0a,
    ground: 0x444444,
    accent: 0xaaaaaa,
    fog: 0x0a0a0a,
    sky: 0x222222,
    decor: 0x666666,
    obstacle: 0xffffff,
    particle: 0xcccccc,
  },
  // 第5关：星空宇宙
  {
    name: '第 5 关 星空宇宙',
    bg: 0x000020,
    ground: 0x4444ff,
    accent: 0xff00ff,
    fog: 0x000020,
    sky: 0x000040,
    decor: 0x4444ff,
    obstacle: 0xff00ff,
    particle: 0xffffff,
  },
  // 第6关：冰雪奇缘
  {
    name: '第 6 关 冰雪奇缘',
    bg: 0x051520,
    ground: 0x88ddff,
    accent: 0x00ffff,
    fog: 0x051520,
    sky: 0xaaddff,
    decor: 0xffffff,
    obstacle: 0x00ced1,
    particle: 0xe0ffff,
  },
  // 第7关：沙漠黄昏
  {
    name: '第 7 关 沙漠黄昏',
    bg: 0x1a1000,
    ground: 0xff6600,
    accent: 0xff3300,
    fog: 0x1a1000,
    sky: 0xff4500,
    decor: 0xdaa520,
    obstacle: 0xff8c00,
    particle: 0xffd700,
  },
  // 第8关：赛博朋克
  {
    name: '第 8 关 赛博朋克',
    bg: 0x0a0020,
    ground: 0x00ffff,
    accent: 0xff00ff,
    fog: 0x0a0020,
    sky: 0x0a0020,
    decor: 0xff00ff,
    obstacle: 0x00ffff,
    particle: 0xff00ff,
  },
];
const GAME_SPEED = { easy: 0.15, medium: 0.28, hard: 0.45 };

// ========== 障碍物生成系统优化 ==========
const OBSTACLE_PATTERNS = {
  easy_3: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
  ],
  medium_4: [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
    [1, 1, 0, 0],
    [0, 0, 1, 1],
    [1, 0, 0, 1],
  ],
  hard_5: [
    [1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1],
    [1, 1, 0, 0, 0],
    [0, 0, 1, 1, 0],
    [0, 0, 0, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
  ],
};
const Z_GAP_CONFIG = {
  easy: { min: 30, max: 45 },
  medium: { min: 22, max: 35 },
  hard: { min: 15, max: 28 },
};
const DIFFICULTY_CONFIG = {
  easy: { maxBlock: 1, coinChance: 0.65 },
  medium: { maxBlock: 2, coinChance: 0.55 },
  hard: { maxBlock: 3, coinChance: 0.45 },
};
let distanceSinceLastSpawn = 0,
  lastSpawnZ = -80;

function getRequiredGap() {
  const config = Z_GAP_CONFIG[difficulty];
  const progress = Math.min(score / 5000, 1);
  return (
    config.min +
    (config.max - config.min) * (1 - progress * 0.5) +
    Math.random() * (config.max - config.min)
  );
}
function selectPattern() {
  const lanes = LANE_COUNT[difficulty];
  const patternKey = difficulty + '_' + lanes;
  const patterns = OBSTACLE_PATTERNS[patternKey] || OBSTACLE_PATTERNS.easy_3;
  return patterns[Math.floor(Math.random() * patterns.length)];
}
function getObstacleTypes() {
  return ['cone', 'laser'];
}

// ========== 障碍物对象池（优化性能） ==========
const POOL_CONFIG = { maxSize: 20, cone: [], laser: [] };

function getObstacleFromPool(type) {
  const pool = POOL_CONFIG[type];
  if (pool && pool.length > 0) {
    return pool.pop();
  }
  // 池为空或类型不存在，创建新对象
  if (type === 'cone') {
    const coneGeo = new THREE.ConeGeometry(0.5, 1.5, 8);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0xff0000,
      emissiveIntensity: 0.3,
    });
    return new THREE.Mesh(coneGeo, coneMat);
  } else if (type === 'laser') {
    const group = new THREE.Group();
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 2, 0.15),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    beam.position.y = 1;
    group.add(beam);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 })
    );
    glow.position.y = 1;
    group.add(glow);
    return group;
  }
  return new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
}

function returnObstacleToPool(obs) {
  if (!obs || !obs.userData || !obs.userData.type) return;
  const type = obs.userData.type;
  if (POOL_CONFIG[type].length < POOL_CONFIG.maxSize) {
    scene.remove(obs);
    POOL_CONFIG[type].push(obs);
  } else {
    // 池已满，直接 dispose
    disposeDecoration(obs);
  }
}

function createObstacle(type) {
  return getObstacleFromPool(type);
}
// =========================================
function adjustPatternForSafeLane(pattern, safeLanes) {
  const adjusted = [...pattern];
  const safeIndices = safeLanes
    .map((l) => Math.round(l))
    .filter((v, i, a) => a.indexOf(v) === i);
  for (const safeIdx of safeIndices) {
    if (adjusted[safeIdx] === 1) {
      for (let i = 0; i < adjusted.length; i++) {
        if (adjusted[i] === 0 && !safeIndices.includes(i)) {
          adjusted[safeIdx] = 0;
          adjusted[i] = 1;
          break;
        }
      }
    }
  }
  return adjusted;
}
function getSafeLanes() {
  return [Math.round(playerLane), targetLane];
}
function createObstacleAt(lane, type, z) {
  const obs = createObstacle(type);
  obs.position.set(getLaneX(lane), type === 'laser' ? 0.3 : 0.9, z);
  obs.castShadow = true;
  obs.userData.lane = lane;
  obs.userData.type = type;
  scene.add(obs);
  obstacles.push(obs);
  return obs;
}
function createCoinAt(lane, z) {
  const coin = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.14, 8, 24),
    new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.7,
      metalness: 1,
      roughness: 0.1,
    })
  );
  coin.position.set(getLaneX(lane), 1.2, z);
  coin.userData.collected = false;
  scene.add(coin);
  coinItems.push(coin);
}
// =========================================

let soundOn = true,
  audioCtx = null,
  bgmGain = null,
  bgmOsc = null,
  bgmPlaying = false;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // 背景音乐音量控制
    bgmGain = audioCtx.createGain();
    bgmGain.gain.value = 0.08;
    bgmGain.connect(audioCtx.destination);
  }
}

// 背景音乐 - 合成赛博朋克风格节拍
function startBGM() {
  if (!soundOn || !audioCtx || bgmPlaying) return;
  bgmPlaying = true;
  const bpm = 128;
  const beatLen = 60 / bpm;
  let beatCount = 0;

  function playBeat() {
    if (!bgmPlaying || !soundOn) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g);
    g.connect(bgmGain);

    // 4/4 拍节奏
    if (beatCount % 4 === 0) {
      // 强拍 - 低音
      osc.frequency.value = 55;
      g.gain.setValueAtTime(0.3, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + beatLen * 0.8);
    } else if (beatCount % 4 === 2) {
      // 弱拍
      osc.frequency.value = 73.42;
      g.gain.setValueAtTime(0.2, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + beatLen * 0.5);
    } else {
      // 其他拍子 - 高音
      osc.frequency.value = 110;
      g.gain.setValueAtTime(0.1, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + beatLen * 0.3);
    }

    osc.start();
    osc.stop(audioCtx.currentTime + beatLen);
    beatCount++;
    setTimeout(playBeat, beatLen * 1000);
  }
  playBeat();
}

function stopBGM() {
  bgmPlaying = false;
}

function tone(freq, dur, type = 'sine', vol = 0.1) {
  if (!soundOn || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}
function playCoinSound() {
  tone(880, 0.05);
  setTimeout(() => tone(1100, 0.08), 30);
}
function playHitSound() {
  tone(80, 0.4, 'sawtooth', 0.08);
  tone(60, 0.5, 'sawtooth', 0.05);
}
function playUpSound() {
  tone(523, 0.08);
  setTimeout(() => tone(659, 0.08), 60);
  setTimeout(() => tone(784, 0.15), 120);
}
function playClickSound() {
  tone(440, 0.02, 'sine', 0.03);
}
// 滑行音效
function playSlideSound() {
  if (!soundOn || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 200 + Math.random() * 100;
  g.gain.setValueAtTime(0.02, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(g);
  g.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}
// 关卡通过音效
function playLevelUpSound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => setTimeout(() => tone(n, 0.15, 'sine', 0.12), i * 100));
}
// 加速音效
function playSpeedSound() {
  if (!soundOn || !audioCtx) return;
  for (let i = 0; i < 3; i++) {
    setTimeout(() => tone(300 + i * 150, 0.08, 'sawtooth', 0.03), i * 40);
  }
}
function toggleSound() {
  soundOn = !soundOn;
  document.querySelector('.soundBtn').textContent = soundOn ? '🔊' : '🔇';
  if (soundOn) {
    initAudio();
    startBGM();
  } else {
    stopBGM();
  }
}
function togglePause() {
  if (!gameRunning) return;
  paused = !paused;
  document.getElementById('pauseBtn').textContent = paused ? '▶' : '⏸';
  if (paused) {
    stopBGM();
  } else {
    if (soundOn) startBGM();
  }
}
function virtualLeft() {
  if (!gameRunning || paused) return;
  const max = LANE_COUNT[difficulty] - 1;
  targetLane = Math.max(0, targetLane - 1);
  playSlideSound();
}
function virtualRight() {
  if (!gameRunning || paused) return;
  const max = LANE_COUNT[difficulty] - 1;
  targetLane = Math.min(max, targetLane + 1);
  playSlideSound();
}

let gameMode = 'story',
  difficulty = 'medium',
  currentLevel = 0,
  gameRunning = false,
  paused = false,
  frameId = null;
let score = 0,
  coins = 0,
  distance = 0,
  levelScore = 0,
  lastLevelScore = 0;
let playerLane = 1,
  targetLane = 1;
let obstacles = [],
  coinItems = [],
  decorations = [];
// ========== 增强存档系统 ==========
const SAVE_KEYS = {
  highScore: 'sl_hs',
  maxLevel: 'sl_lv',
  totalCoins: 'sl_tc',
  totalTime: 'sl_tt',
  sound: 'sl_sd',
  difficultyBest: 'sl_db',
};
function loadSave(key, def = 0) {
  try {
    return JSON.parse(localStorage.getItem(key)) || def;
  } catch {
    return def;
  }
}
function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
let highScore = loadSave(SAVE_KEYS.highScore, 0);
let maxLevel = loadSave(SAVE_KEYS.maxLevel, 0);
let totalCoins = loadSave(SAVE_KEYS.totalCoins, 0);
let totalTime = loadSave(SAVE_KEYS.totalTime, 0);
// 每个难度的最佳分数
let difficultyBest = loadSave(SAVE_KEYS.difficultyBest, { easy: 0, medium: 0, hard: 0 });

function updateStats() {
  // 更新界面显示
  document.getElementById('highScoreDisplay').textContent = highScore;
  document.getElementById('levelProgressDisplay').textContent = maxLevel;
  // 解锁极限模式
  if (maxLevel >= 7) document.getElementById('modeEndless').classList.remove('locked');
}

const canvas = document.getElementById('game');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x1a0a15, 30, 150);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 6, 14);
camera.lookAt(0, 1, -20);

// 摄像机摇晃效果
let cameraShake = 0;
function updateCameraShake() {
  if (cameraShake > 0) {
    camera.position.x = (Math.random() - 0.5) * cameraShake * 0.3;
    camera.position.y = 6 + (Math.random() - 0.5) * cameraShake * 0.2;
    cameraShake *= 0.9;
    if (cameraShake < 0.01) {
      cameraShake = 0;
      camera.position.x = 0;
      camera.position.y = 6;
    }
  }
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
// 增强阴影设置
const sun = new THREE.DirectionalLight(0xffffff, 1.8);
sun.position.set(15, 30, 20);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 100;
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
sun.shadow.bias = -0.001;
scene.add(sun);

const neonL1 = new THREE.PointLight(0x00ffff, 3, 80);
neonL1.position.set(-15, 15, -10);
scene.add(neonL1);
const neonL2 = new THREE.PointLight(0xff00ff, 3, 80);
neonL2.position.set(15, 15, -10);
scene.add(neonL2);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 400),
  new THREE.MeshStandardMaterial({ color: 0xff69b4, metalness: 0.6, roughness: 0.4 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -150;
ground.receiveShadow = true;
scene.add(ground);

const track = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 400),
  new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 })
);
track.rotation.x = -Math.PI / 2;
track.position.y = 0.01;
track.position.z = -150;
track.receiveShadow = true;
scene.add(track);

const edgeGeo = new THREE.BoxGeometry(0.15, 0.3, 400);
const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const leftEdge = new THREE.Mesh(edgeGeo, edgeMat);
leftEdge.position.set(-6, 0.15, -150);
scene.add(leftEdge);
const rightEdge = new THREE.Mesh(edgeGeo, edgeMat);
rightEdge.position.set(6, 0.15, -150);
scene.add(rightEdge);

const grid = new THREE.GridHelper(400, 160, 0x00ffff, 0x111144);
grid.position.z = -150;
grid.position.y = 0.02;
scene.add(grid);

const player = new THREE.Group();

const board = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 0.15, 3),
  new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.95, roughness: 0.05 })
);
board.position.y = 0.3;
board.castShadow = true;
player.add(board);
const boardGlow = new THREE.Mesh(
  new THREE.BoxGeometry(1.7, 0.02, 3.1),
  new THREE.MeshBasicMaterial({ color: 0x00ffff })
);
boardGlow.position.y = 0.38;
player.add(boardGlow);

const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 20);
const wheelMat = new THREE.MeshStandardMaterial({
  color: 0x111111,
  metalness: 0.9,
  roughness: 0.1,
});
[
  [-0.6, 0.18, 1.1],
  [0.6, 0.18, 1.1],
  [-0.6, 0.18, -1.1],
  [0.6, 0.18, -1.1],
].forEach((p) => {
  const w = new THREE.Mesh(wheelGeo, wheelMat);
  w.rotation.z = Math.PI / 2;
  w.position.set(...p);
  player.add(w);
});

const body = new THREE.Mesh(
  new THREE.CylinderGeometry(0.32, 0.36, 1, 16),
  new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.5, roughness: 0.5 })
);
body.position.y = 1.1;
body.castShadow = true;
player.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.32, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0xffdbac })
);
head.position.y = 1.95;
head.castShadow = true;
player.add(head);

const hair = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0x1a0a0a })
);
hair.position.y = 2.1;
player.add(hair);

const glasses = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.14, 0.16),
  new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 1, roughness: 0 })
);
glasses.position.set(0, 1.98, 0.3);
player.add(glasses);
const glint = new THREE.Mesh(
  new THREE.BoxGeometry(0.52, 0.02, 0.02),
  new THREE.MeshBasicMaterial({ color: 0x00ffff })
);
glint.position.set(0, 1.96, 0.38);
player.add(glint);

const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.55, 8);
const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
const leftArm = new THREE.Mesh(armGeo, skinMat);
leftArm.position.set(-0.55, 1.2, 0);
leftArm.rotation.z = 0.5;
player.add(leftArm);
const rightArm = new THREE.Mesh(armGeo, skinMat);
rightArm.position.set(0.55, 1.2, 0);
rightArm.rotation.z = -0.5;
player.add(rightArm);

const legGeo = new THREE.CylinderGeometry(0.11, 0.1, 0.65, 8);
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
const leftLeg = new THREE.Mesh(legGeo, pantsMat);
leftLeg.position.set(-0.28, 0.55, 0);
player.add(leftLeg);
const rightLeg = new THREE.Mesh(legGeo, pantsMat);
rightLeg.position.set(0.28, 0.55, 0);
player.add(rightLeg);

player.position.y = 0;
scene.add(player);

// 释放装饰物 GPU 资源（防止内存泄漏）
function disposeDecoration(d) {
  if (!d) return;
  d.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    }
  });
  scene.remove(d);
}
function createDecorations() {
  decorations.forEach((d) => disposeDecoration(d));
  decorations = [];

  const sides = [-10, 10];
  sides.forEach((side) => {
    for (let i = 0; i < 15; i++) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a3728 })
      );
      trunk.position.y = 1;
      trunk.castShadow = true;
      tree.add(trunk);
      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0x228b22 })
      );
      leaves.position.y = 3.5;
      leaves.castShadow = true;
      tree.add(leaves);
      tree.position.set(side + (Math.random() - 0.5) * 3, 0, -i * 25 - Math.random() * 10);
      scene.add(tree);
      decorations.push(tree);

      if (i % 4 === 0) {
        const lamp = new THREE.Group();
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.1, 5, 8),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        pole.position.y = 2.5;
        lamp.add(pole);
        const light = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xffffaa })
        );
        light.position.y = 5.2;
        lamp.add(light);
        const lampLight = new THREE.PointLight(0xffffaa, 1, 15);
        lampLight.position.y = 5.2;
        lamp.add(lampLight);
        lamp.position.set(side > 0 ? side + 2 : side - 2, 0, -i * 25 - 8);
        scene.add(lamp);
        decorations.push(lamp);
      }
    }
  });

  for (let i = 0; i < 6; i++) {
    const mountain = new THREE.Mesh(
      new THREE.ConeGeometry(15 + Math.random() * 10, 25 + Math.random() * 15, 6),
      new THREE.MeshStandardMaterial({ color: 0x2a2a3a, flatShading: true })
    );
    mountain.position.set((Math.random() - 0.5) * 150, 10, -180 - i * 30);
    scene.add(mountain);
    decorations.push(mountain);
  }

  for (let i = 0; i < 10; i++) {
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(3 + Math.random() * 4, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
    );
    cloud.position.set((Math.random() - 0.5) * 100, 25 + Math.random() * 10, -50 - i * 25);
    scene.add(cloud);
    decorations.push(cloud);
  }
}

const particleCount = 1500;
const particleGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(particleCount * 3);
const pCol = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  pPos[i * 3] = (Math.random() - 0.5) * 60;
  pPos[i * 3 + 1] = Math.random() * 35;
  pPos[i * 3 + 2] = -Math.random() * 250;
  pCol[i * 3] = Math.random() * 0.4;
  pCol[i * 3 + 1] = 0.8 + Math.random() * 0.2;
  pCol[i * 3 + 2] = 1;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
particleGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const particleMat = new THREE.PointsMaterial({
  size: 0.25,
  vertexColors: true,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending,
});
const particleSystem = new THREE.Points(particleGeo, particleMat);
scene.add(particleSystem);

function setMode(m) {
  gameMode = m;
  playClickSound();
  document.querySelectorAll('.modeBtn').forEach((b) => b.classList.remove('selected'));
  document
    .getElementById('mode' + (m === 'story' ? 'Story' : 'Endless'))
    .classList.add('selected');
}
function setDifficulty(d) {
  difficulty = d;
  playClickSound();
  document.querySelectorAll('.diffBtn').forEach((b) => b.classList.remove('selected'));
  document.querySelector('.diffBtn.' + d).classList.add('selected');
}

function getLaneX(lane) {
  const lanes = LANE_COUNT[difficulty];
  const width = 10;
  return (lane - (lanes - 1) / 2) * (width / lanes);
}

function setLevel(n) {
  currentLevel = Math.min(n, LEVELS.length - 1);
  const lv = LEVELS[currentLevel];
  scene.background = new THREE.Color(lv.bg);
  scene.fog.color = new THREE.Color(lv.fog);
  ground.material.color.setHex(lv.ground);
  ground.material.emissive.setHex(lv.accent);
  ground.material.emissiveIntensity = 0.25;
  // 更新霓虹灯光颜色
  neonL1.color.setHex(lv.accent);
  neonL2.color.setHex(lv.obstacle || lv.accent);
  // 更新地面边缘颜色
  edgeMat.color.setHex(lv.accent);
  document.getElementById('levelDisplay').textContent =
    gameMode === 'endless' ? '⚡ 极限模式' : lv.name;
}

function spawnObstacles() {
  const lanes = LANE_COUNT[difficulty];
  let pattern = selectPattern();
  const safeLanes = getSafeLanes();
  pattern = adjustPatternForSafeLane(pattern, safeLanes);
  const obsTypes = getObstacleTypes();
  const config = DIFFICULTY_CONFIG[difficulty];
  const z = -80 - Math.random() * 15;

  for (let i = 0; i < lanes; i++) {
    if (pattern[i] === 1) {
      const type = obsTypes[Math.floor(Math.random() * obsTypes.length)];
      createObstacleAt(i, type, z);
    }
  }

  if (Math.random() < config.coinChance) {
    const freeLanes = [];
    for (let i = 0; i < lanes; i++) {
      if (pattern[i] === 0) freeLanes.push(i);
    }
    let coinLane;
    const safeFreeLanes = freeLanes.filter((l) => safeLanes.includes(Math.round(l)));
    if (safeFreeLanes.length > 0) {
      coinLane = safeFreeLanes[Math.floor(Math.random() * safeFreeLanes.length)];
    } else if (freeLanes.length > 0) {
      coinLane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
    }
    if (coinLane !== undefined) {
      createCoinAt(coinLane, z + 8 + Math.random() * 5);
    }
  }
  lastSpawnZ = z;
}

function startGame() {
  playClickSound();
  initAudio();
  startBGM();
  score = 0;
  coins = 0;
  distance = 0;
  levelScore = 0;
  lastLevelScore = 0;
  distanceSinceLastSpawn = 0;
  lastSpawnZ = -80;
  playerLane = Math.floor(LANE_COUNT[difficulty] / 2);
  targetLane = playerLane;

  // 归还障碍物到对象池复用
  obstacles.forEach((o) => returnObstacleToPool(o));
  obstacles = [];
  coinItems.forEach((c) => scene.remove(c));
  coinItems = [];

  createDecorations();

  if (gameMode === 'story') setLevel(0);
  else setLevel(Math.floor(Math.random() * LEVELS.length));

  for (let i = 0; i < 8; i++) {
    spawnObstacles();
    const offset = i * 30 + Math.random() * 15;
    obstacles.forEach((o) => {
      o.position.z -= offset;
    });
    coinItems.forEach((c) => {
      c.position.z -= offset;
    });
  }

  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('gameUI').classList.add('show');
  document.getElementById('pauseBtn').classList.add('show');
  document.getElementById('leftBtn').classList.add('show');
  document.getElementById('rightBtn').classList.add('show');
  gameRunning = true;
}

function gameOver() {
  gameRunning = false;
  stopBGM();
  if (frameId) {
    cancelAnimationFrame(frameId);
    frameId = null;
  }
  playHitSound();
  document.getElementById('gameUI').classList.remove('show');
  document.getElementById('pauseBtn').classList.remove('show');
  document.getElementById('leftBtn').classList.remove('show');
  document.getElementById('rightBtn').classList.remove('show');
  document.getElementById('startScreen').classList.remove('hidden');
  // 保存最高分
  if (score > highScore) {
    highScore = score;
    saveData(SAVE_KEYS.highScore, highScore);
  }
  // 保存各难度最佳分数
  if (score > difficultyBest[difficulty]) {
    difficultyBest[difficulty] = score;
    saveData(SAVE_KEYS.difficultyBest, difficultyBest);
  }
  // 保存关卡进度
  if (gameMode === 'story' && currentLevel > maxLevel) {
    maxLevel = currentLevel;
    saveData(SAVE_KEYS.maxLevel, maxLevel);
  }
  // 累计金币
  totalCoins += coins;
  saveData(SAVE_KEYS.totalCoins, totalCoins);
  // 更新显示
  updateStats();
}

// ========== 碰撞检测系统（基于圆形碰撞体） ==========
// 玩家滑板碰撞半径：滑板宽1.6，取宽度一半更精确
const PLAYER_SKATE_RADIUS = 0.85;
// 障碍物碰撞半径配置
const OBSTACLE_COLLIDER = {
  cone: { radius: 0.55, height: 1.5 }, // 锥形体
  laser: { radius: 0.35, beamY: 1.0, beamHeight: 2.0 }, // 激光束
};

/**
 * 圆形碰撞检测
 * @param {number} x1 - 对象1 x坐标
 * @param {number} z1 - 对象1 z坐标
 * @param {number} r1 - 对象1 碰撞半径
 * @param {number} x2 - 对象2 x坐标
 * @param {number} z2 - 对象2 z坐标
 * @param {number} r2 - 对象2 碰撞半径
 * @returns {boolean} 是否碰撞
 */
function circleCollision(x1, z1, r1, x2, z2, r2) {
  const dx = x1 - x2;
  const dz = z1 - z2;
  const distSq = dx * dx + dz * dz;
  const radiusSum = r1 + r2;
  return distSq < radiusSum * radiusSum;
}

/**
 * 激光碰撞检测（考虑激光高度）
 * 激光束在玩家腿部高度，玩家站立即受伤
 */
function checkLaserCollision(playerX, laserX, laserZ, laserRadius) {
  const horizontalDist = Math.sqrt((playerX - laserX) ** 2 + (0 - laserZ) ** 2);
  // 玩家在激光束水平范围内即碰撞（激光会照射腿部）
  return horizontalDist < PLAYER_SKATE_RADIUS + laserRadius;
}

function checkCollision() {
  const playerX = player.position.x;
  const playerZ = 0;

  for (const obs of obstacles) {
    const type = obs.userData.type;
    const obsX = obs.position.x;
    const obsZ = obs.position.z;

    if (type === 'cone') {
      // 锥形障碍物：使用圆形碰撞
      const collider = OBSTACLE_COLLIDER.cone;
      if (
        circleCollision(playerX, playerZ, PLAYER_SKATE_RADIUS, obsX, obsZ, collider.radius)
      ) {
        return true;
      }
    } else if (type === 'laser') {
      // 激光障碍物：圆形碰撞 + 高度检测
      const collider = OBSTACLE_COLLIDER.laser;
      if (
        circleCollision(playerX, playerZ, PLAYER_SKATE_RADIUS, obsX, obsZ, collider.radius)
      ) {
        // 激光束在玩家腿部高度（y < 1.5）时碰撞
        if (collider.beamY < 1.5) {
          return true;
        }
      }
    } else {
      // 默认障碍物：简化圆形检测
      if (circleCollision(playerX, playerZ, PLAYER_SKATE_RADIUS, obsX, obsZ, 0.5)) {
        return true;
      }
    }
  }
  return false;
}

// 释放金币 GPU 资源
function disposeCoin(coin) {
  if (!coin) return;
  if (coin.geometry) coin.geometry.dispose();
  if (coin.material) {
    if (Array.isArray(coin.material)) coin.material.forEach((m) => m.dispose());
    else coin.material.dispose();
  }
  scene.remove(coin);
}

function checkCoinCollection() {
  const playerZ = 0;
  for (let i = coinItems.length - 1; i >= 0; i--) {
    const coin = coinItems[i];
    if (coin.userData.collected) continue;
    const dz = Math.abs(coin.position.z - playerZ);
    if (dz < 2.5) {
      coin.userData.collected = true;
      disposeCoin(coin); // 释放 GPU 资源
      coinItems.splice(i, 1);
      coins++;
      score += 10;
      playCoinSound();
    }
  }
}

document.addEventListener('keydown', (e) => {
  if (!gameRunning) return;
  // ESC 暂停游戏
  if (e.key === 'Escape') {
    togglePause();
    return;
  }
  const max = LANE_COUNT[difficulty] - 1;
  if (e.key === 'ArrowLeft' || e.key === 'a') {
    targetLane = Math.max(0, targetLane - 1);
    if (!paused) playSlideSound();
  }
  if (e.key === 'ArrowRight' || e.key === 'd') {
    targetLane = Math.min(max, targetLane + 1);
    if (!paused) playSlideSound();
  }
});

document.addEventListener('mousemove', (e) => {
  if (!gameRunning) return;
  const max = LANE_COUNT[difficulty] - 1;
  targetLane = Math.floor((e.clientX / window.innerWidth) * (max + 1));
  targetLane = Math.max(0, Math.min(max, targetLane));
});

document.addEventListener('touchstart', (e) => {
  if (!gameRunning) return;
  let startX = e.touches[0].clientX;
  const move = (ev) => {
    const diff = ev.touches[0].clientX - startX;
    if (Math.abs(diff) > 45) {
      const max = LANE_COUNT[difficulty] - 1;
      if (diff > 0) targetLane = Math.min(max, targetLane + 1);
      else targetLane = Math.max(0, targetLane - 1);
      startX = ev.touches[0].clientX;
    }
  };
  const end = () => {
    document.removeEventListener('touchmove', move);
    document.removeEventListener('touchend', end);
  };
  document.addEventListener('touchmove', move);
  document.addEventListener('touchend', end);
});

// 帧率控制
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;
let lastFrameTime = 0;

function animate(timestamp) {
  frameId = requestAnimationFrame(animate);

  // 帧率锁定：只在达到目标帧率时才渲染
  const deltaTime = timestamp - lastFrameTime;
  if (deltaTime < FRAME_TIME) return;
  lastFrameTime = timestamp - (deltaTime % FRAME_TIME);

  // 暂停时只渲染不更新游戏逻辑
  if (paused) {
    renderer.render(scene, camera);
    return;
  }

  if (gameRunning) {
    const speed = GAME_SPEED[difficulty] + (gameMode === 'endless' ? score * 0.00005 : 0);

    playerLane += (targetLane - playerLane) * 0.12;
    player.position.x = getLaneX(Math.round(playerLane));
    player.rotation.z = (targetLane - playerLane) * 0.45;
    player.position.y = Math.sin(Date.now() * 0.003) * 0.1;

    obstacles.forEach((o) => {
      o.position.z += speed;
      o.rotation.y +=
        o.userData.type === 'cone' ? 0.04 : o.userData.type === 'laser' ? 0.08 : 0.025;
    });
    obstacles.forEach((o) => {
      if (o.position.z > 30) {
        const lanes = LANE_COUNT[difficulty];
        const otherObstacles = obstacles.filter((obs) => obs !== o && obs.position.z > -80);
        const safeLanes = getSafeLanes();
        const occupied = otherObstacles.map((obs) => obs.userData.lane);
        const availableLanes = [];
        for (let l = 0; l < lanes; l++) {
          if (!occupied.includes(l)) availableLanes.push(l);
        }
        let newLane;
        const safeAvailable = availableLanes.filter((l) => safeLanes.includes(Math.round(l)));
        if (safeAvailable.length > 0) {
          newLane = safeAvailable[Math.floor(Math.random() * safeAvailable.length)];
        } else if (availableLanes.length > 0) {
          newLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
        }
        if (newLane !== undefined) {
          o.userData.lane = newLane;
          o.position.x = getLaneX(newLane);
        }
        o.position.z = -80 - Math.random() * 15;
      }
    });

    coinItems.forEach((c) => {
      c.position.z += speed;
      c.rotation.z += 0.12;
    });
    coinItems = coinItems.filter((c) => {
      if (c.position.z > 30) {
        scene.remove(c);
        return false;
      }
      return true;
    });

    // 距离追踪控制生成
    distanceSinceLastSpawn += speed;
    if (distanceSinceLastSpawn >= getRequiredGap()) {
      spawnObstacles();
      distanceSinceLastSpawn = 0;
    }

    if (checkCollision()) {
      cameraShake = 1;
      gameOver();
      return;
    }
    checkCoinCollection();

    distance += speed;
    score += Math.floor(speed * 2);
    levelScore += Math.floor(speed * 2);

    if (gameMode === 'story' && levelScore > 500 && lastLevelScore <= 500) {
      playLevelUpSound();
      if (currentLevel < LEVELS.length - 1) {
        currentLevel++;
        setLevel(currentLevel);
      }
      levelScore = 0;
    } else if (gameMode === 'endless' && levelScore > 200 && lastLevelScore <= 200) {
      playLevelUpSound();
      setLevel(Math.floor(Math.random() * LEVELS.length));
      levelScore = 0;
    }
    lastLevelScore = levelScore;

    document.getElementById('scoreDisplay').textContent = score;
    document.getElementById('coinDisplay').textContent = coins;
    document.getElementById('distDisplay').textContent = Math.floor(distance);
    const progress = (gameMode === 'endless' ? levelScore / 200 : levelScore / 500) * 100;
    document.getElementById('progressBar').style.width = Math.min(progress, 100) + '%';

    const pos = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] += speed * 0.6;
      if (pos[i + 2] > 15) pos[i + 2] = -250;
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  updateCameraShake();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

updateStats();
setLevel(0);
initAudio();
animate();
console.log('滑板人生 3D 已加载');
