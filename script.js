/*
Mundo Catita - script.js (vista isométrica frontal)
- Grilla isométrica como suelo
- Personaje y objetos dibujados de frente
- Movimiento libre diagonal con snap suavizado a la grilla
*/

const CONFIG = {
  cols: 20,
  rows: 20,
  tileWidth: 64,
  tileHeight: 32,
  scale: 1.0,
  backgroundColor: '#2b3440',
  playerSpritePath: 'assets/sprites/player.png',
  initialPlayer: { x: 10, y: 10 },
  cameraLag: 0.12,
  playerSpeed: 5,     // tiles por segundo
  snapSpeed: 10       // velocidad de snap a grilla
};

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let DPR = window.devicePixelRatio || 1;

const state = {
  cols: CONFIG.cols,
  rows: CONFIG.rows,
  tileW: CONFIG.tileWidth,
  tileH: CONFIG.tileHeight,
  scale: CONFIG.scale,
  camera: { x: 0, y: 0 },
  cameraTarget: { x: 0, y: 0 },
  player: { x: CONFIG.initialPlayer.x, y: CONFIG.initialPlayer.y, targetX: CONFIG.initialPlayer.x, targetY: CONFIG.initialPlayer.y },
  keys: {},
  sprite: null,
  spriteLoaded: false
};

const playerImage = new Image();
playerImage.src = CONFIG.playerSpritePath;
playerImage.onload = () => state.spriteLoaded = true;

// ----------------- DIBUJO -----------------
function clear() {
  ctx.fillStyle = CONFIG.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function tileToScreen(x, y) {
  const screenX = (x - y) * (state.tileW / 2);
  const screenY = (x + y) * (state.tileH / 2);
  return { x: screenX, y: screenY };
}

function drawIsometricGrid() {
  ctx.save();
  ctx.translate(canvas.width / 2 - state.camera.x, canvas.height / 4 - state.camera.y);
  ctx.scale(state.scale, state.scale);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;

  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      const p = tileToScreen(x, y);
      drawTile(p.x, p.y);
    }
  }

  drawPlayer();

  ctx.restore();
}

function drawTile(x, y) {
  const w = state.tileW;
  const h = state.tileH;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - w / 2, y + h / 2);
  ctx.closePath();
  ctx.stroke();
}

function drawPlayer() {
  const p = tileToScreen(state.player.x, state.player.y);
  const img = playerImage;

  if (state.spriteLoaded) {
    const px = p.x - img.width / 2;
    const py = p.y - img.height + state.tileH / 2;
    ctx.drawImage(img, px, py);
  } else {
    ctx.fillStyle = '#ff6';
    ctx.beginPath();
    ctx.arc(p.x, p.y - 20, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ----------------- MOVIMIENTO LIBRE DIAGONAL -----------------
window.addEventListener('keydown', (e) => { state.keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { state.keys[e.key.toLowerCase()] = false; });

function updatePlayerMovement(dt) {
  let dx = 0, dy = 0;

  // Movimiento diagonal mapeado a la grilla
  if (state.keys['arrowup'] || state.keys['w']) { dx -= 1; dy -= 1; }    // arriba
  if (state.keys['arrowdown'] || state.keys['s']) { dx += 1; dy += 1; }  // abajo
  if (state.keys['arrowleft'] || state.keys['a']) { dx -= 1; dy += 1; }  // izquierda
  if (state.keys['arrowright'] || state.keys['d']) { dx += 1; dy -= 1; } // derecha

  // Normalizar movimiento diagonal
  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }

  // Aplicar velocidad
  state.player.x += dx * CONFIG.playerSpeed * dt;
  state.player.y += dy * CONFIG.playerSpeed * dt;

  // Limites
  state.player.x = clamp(state.player.x, 0, state.cols - 1);
  state.player.y = clamp(state.player.y, 0, state.rows - 1);

  // Snap suave a la grilla si no hay teclas presionadas
  if (dx === 0 && dy === 0) {
    state.player.x = lerp(state.player.x, Math.round(state.player.x), CONFIG.snapSpeed * dt);
    state.player.y = lerp(state.player.y, Math.round(state.player.y), CONFIG.snapSpeed * dt);
  }
}

// ----------------- CÁMARA -----------------
function updateCameraTarget() {
  const p = tileToScreen(state.player.x, state.player.y);
  state.cameraTarget.x = p.x;
  state.cameraTarget.y = p.y;
}

// ----------------- LOOP -----------------
let lastTime = 0;
function loop(ts) {
  const dt = (ts - lastTime) / 1000; // delta en segundos
  lastTime = ts;

  updatePlayerMovement(dt);

  state.camera.x = lerp(state.camera.x, state.cameraTarget.x, CONFIG.cameraLag);
  state.camera.y = lerp(state.camera.y, state.cameraTarget.y, CONFIG.cameraLag);

  clear();
  drawIsometricGrid();

  requestAnimationFrame(loop);
}

// ----------------- REDIMENSIÓN -----------------
function resizeCanvas() {
  DPR = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.width = Math.round(w * DPR);
  canvas.height = Math.round(h * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

// ----------------- INICIALIZACIÓN -----------------
function init() {
  resizeCanvas();
  updateCameraTarget();
  state.camera.x = state.cameraTarget.x;
  state.camera.y = state.cameraTarget.y;

  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('click', () => canvas.focus());

  requestAnimationFrame(loop);
}

init();
