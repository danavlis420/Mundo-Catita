// scripts/main.js
// Entry point modular para Mundo Catita

import { CONFIG, lerp } from './config.js';
import { Grid } from './grid.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { initInput } from './input.js';
import { HUD } from './hud.js';

// Canvas y contexto
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
let DPR = window.devicePixelRatio || 1;

// Instancias principales
const grid = new Grid(CONFIG.cols, CONFIG.rows);
const player = new Player(grid);
const camera = new Camera(player, 0, -150);
initInput(player);
const hud = new HUD('hud');

// Fondo opcional
const bgImage = new Image();
bgImage.src = 'assets/backgrounds/bg.png';
let bgLoaded = false;
bgImage.onload = () => (bgLoaded = true);

// Estado del mouse
let isMouseDown = false;
let mouseButton = 0;
let mousePos = null;

// ------------------- 🔧 RESIZE SEGURO DPI-INDEPENDIENTE -------------------
function resizeCanvas() {
  DPR = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.width = Math.round(w * DPR);
  canvas.height = Math.round(h * DPR);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(DPR, DPR);

  const p = grid.tileToScreen(player.x, player.y);
  camera.x = p.x + camera.offsetX;
  camera.y = p.y + camera.offsetY;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ------------------- Mouse y Cámara -------------------
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('click', () => canvas.focus());

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width) / DPR,
    y: (e.clientY - rect.top) * (canvas.height / rect.height) / DPR
  };
}

function getBaseTileUnderCursor(posCanvas) {
  const localX = posCanvas.x + camera.x - canvas.width / (2 * DPR);
  const localY = posCanvas.y + camera.y - canvas.height / (4 * DPR);
  const t = grid.screenToTile(localX, localY);
  if (!t) return null;
  return { x: t.x, y: t.y };
}

function placeSpriteAtCursor(posCanvas, button) {
  const spritePath = hud.getSelectedSprite();
  if (!spritePath) return;
  const spriteData = hud.getSpriteData(spritePath);
  if (!spriteData || !spriteData.loaded) return;

  const baseTile = getBaseTileUnderCursor(posCanvas);
  if (!baseTile) return;

  const tileSprite = {
    img: spriteData.img,
    loaded: spriteData.loaded,
    width: spriteData.width,
    height: spriteData.height,
    depth: spriteData.depth || 1,
    name: spriteData.name,
    category: spriteData.category,
    path: spritePath
  };

  if (button === 0) grid.setTileSprite(baseTile.x, baseTile.y, tileSprite);
  else if (button === 2) grid.clearTile(baseTile.x, baseTile.y, tileSprite.category);
}

// ------------------- Eventos de mouse -------------------
canvas.addEventListener('mousedown', e => {
  mousePos = getMousePos(e);
  isMouseDown = true;
  mouseButton = e.button;

  if (hud.isCameraMode()) camera.startDrag(mousePos.x, mousePos.y);
  else placeSpriteAtCursor(mousePos, mouseButton);
});

canvas.addEventListener('mousemove', e => {
  mousePos = getMousePos(e);
  if (!isMouseDown) return;
  if (hud.isCameraMode()) camera.drag(mousePos.x, mousePos.y);
  else placeSpriteAtCursor(mousePos, mouseButton);
});

canvas.addEventListener('mouseup', () => {
  isMouseDown = false;
  if (hud.isCameraMode()) camera.endDrag();
});
canvas.addEventListener('mouseleave', () => {
  if (isMouseDown) {
    isMouseDown = false;
    if (hud.isCameraMode()) camera.endDrag();
  }
});

// ------------------- Export / Import -------------------
function worldToJSON() {
  const out = {
    cols: grid.cols,
    rows: grid.rows,
    tileW: grid.tileW,
    tileH: grid.tileH,
    tiles: []
  };

  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const cell = grid.tiles[y][x];
      if (cell.floor || cell.wall || cell.object) {
        const cellEntry = { x, y, layers: {} };
        ['floor', 'wall', 'object'].forEach(layer => {
          const t = cell[layer];
          if (t) {
            cellEntry.layers[layer] = {
              path: t.path || null,
              name: t.name || null,
              width: t.width || 1,
              height: t.height || 1,
              depth: t.depth || 1,
              category: t.category || layer
            };
          }
        });
        out.tiles.push(cellEntry);
      }
    }
  }
  return JSON.stringify(out, null, 2);
}

function downloadJSON(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportWorld() {
  const json = worldToJSON();
  downloadJSON('mundo_catita.json', json);
}

function importWorldFile(file) {
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const data = JSON.parse(evt.target.result);
      applyWorldData(data);
    } catch (err) {
      console.error('Archivo inválido', err);
      alert('No se pudo cargar el archivo: JSON inválido.');
    }
  };
  reader.readAsText(file);
}

function applyWorldData(data) {
  grid.tiles = Array.from({ length: data.rows || grid.rows }, () =>
    Array.from({ length: data.cols || grid.cols }, () => ({ floor: null, wall: null, object: null }))
  );

  (data.tiles || []).forEach(entry => {
    const x = entry.x,
      y = entry.y;
    if (x == null || y == null || !grid.tiles[y] || !grid.tiles[y][x]) return;
    Object.entries(entry.layers || {}).forEach(([layer, info]) => {
      if (!info.path) return;
      const spriteData = hud.getSpriteData(info.path);
      const tileSprite = spriteData
        ? {
            img: spriteData.img,
            loaded: spriteData.loaded,
            width: spriteData.width,
            height: spriteData.height,
            depth: spriteData.depth || 1,
            name: spriteData.name,
            category: spriteData.category,
            path: info.path
          }
        : {
            img: null,
            loaded: false,
            width: info.width || 1,
            height: info.height || 1,
            depth: info.depth || 1,
            name: info.name || info.path,
            category: info.category || layer,
            path: info.path
          };
      grid.tiles[y][x][layer] = tileSprite;
    });
  });
  console.log('Mundo importado');
}

// ------------------- Keyboard shortcuts -------------------
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'e') exportWorld();
  if (k === 'l') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      if (input.files && input.files[0]) importWorldFile(input.files[0]);
    };
    input.click();
  }
  if (k === 'm') hud.setMode(hud.isCameraMode() ? 'sprite' : 'camera');
});

// ------------------- Loop principal -------------------
let lastTime = performance.now();

function loop(ts) {
  const dt = (ts - lastTime) / 1000;
  lastTime = ts;

  camera.update(dt, grid, CONFIG.cameraLag, hud.isCameraLocked());
  player.update(dt);

  ctx.save();
  ctx.fillStyle = CONFIG.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (bgLoaded) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  grid.draw(ctx, camera);

  // ------------------- PREVIEW DE SPRITE -------------------
  if (hud.mode === 'sprite' && hud.getSelectedSprite() && mousePos) {
    const spritePath = hud.getSelectedSprite();
    const spriteData = hud.getSpriteData(spritePath);
    if (spriteData && spriteData.loaded) {
      const baseTile = getBaseTileUnderCursor(mousePos);
      if (baseTile) {
        const p = grid.tileToScreen(baseTile.x, baseTile.y);
        const depth = spriteData.depth || 1;
        const width = spriteData.width || 1;

        const drawX = p.x - (grid.tileW * width) / 2;
        const drawY = p.y - grid.tileH * (depth - 1);
        const spritePixelHeight = grid.tileH * depth;

        ctx.save();
        ctx.translate(
          canvas.width / (2 * DPR) - camera.x,
          canvas.height / (4 * DPR) - camera.y
        );
        ctx.globalAlpha = 0.5;
        ctx.drawImage(
          spriteData.img,
          drawX,
          drawY - (spriteData.img.height - grid.tileH),
          grid.tileW * width,
          spriteData.img.height
        );

        ctx.restore();
      }
    }
  }

  player.draw(ctx, grid, camera);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// ------------------- Export global helpers -------------------
window.MundoCatita = {
  exportWorld,
  importWorldFile,
  getGrid: () => grid,
  getHUD: () => hud,
  getPlayer: () => player,
  getCamera: () => camera
};
