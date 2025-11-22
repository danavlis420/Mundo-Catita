// scripts/main.js
import { CONFIG, lerp } from './config.js';
import { Grid } from './grid.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { initInput } from './input.js';
import { HUD } from './hud.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ----------------------------------------------------------------------
// 🔧 CONFIGURACIÓN DE RESOLUCIÓN Y ESCALADO (SOLUCIÓN ROBUSTA)
// ----------------------------------------------------------------------
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ASPECT_RATIO = GAME_WIDTH / GAME_HEIGHT;

// Fijamos la resolución interna una única vez.
// El juego "vive" en 800x600. El navegador lo estira.
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

function resizeCanvas() {
  const windowW = window.innerWidth;
  const windowH = window.innerHeight;
  
  // Altura objetivo: 90% del alto de la ventana
  const targetHeight = windowH * 0.90;
  const targetWidth = targetHeight * ASPECT_RATIO;

  // Verificamos si el ancho resultante se sale de la pantalla
  if (targetWidth > windowW) {
    // Si es muy ancho, limitamos por ancho
    const newWidth = windowW * 0.95; // Margen pequeño lateral
    const newHeight = newWidth / ASPECT_RATIO;
    
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
  } else {
    // Si cabe bien, usamos el cálculo basado en altura
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;
  }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Llamada inicial

// ----------------------------------------------------------------------
// GESTIÓN DE INPUT (CORREGIDA)
// ----------------------------------------------------------------------
// Función maestra para traducir coordenadas de pantalla a coordenadas de juego (800x600)
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  
  // Factor de escala: cuántos píxeles internos hay por cada píxel visual
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

// --- Instancias ---
const grid = new Grid(CONFIG.cols, CONFIG.rows);
const player = new Player(grid);
const camera = new Camera(player, 0, -150); // Offset vertical para centrar al jugador visualmente
initInput(player);

// Pasamos el canvas y ctx al HUD
const hud = new HUD(ctx, canvas);
hud.setScale(0.18);
hud.setOffset(-20, 380);

// --- Configuración HUD (Igual que antes) ---
const HUD_POS = {
  dial: { x: 0, y: -8, scale: 1},
  panel: { x: 232, y: -3, scale: 1},
  pj: { x: 147, y: 68, scale: 1 },
  smallpanel: { x: 0, y: 0, scale: 1 },
  layer: { x: 0, y: 30, scale: 1 },
  ball: { x: 40, y: 40, scale: 1},
  btnPersonas: { x: 15, y: 110, scale: 1 },
  btnConstruccion: { x: 70, y: 105, scale: 1 },
  btnObjetos: { x: 550, y: 380, scale: 1 },
  btnOpciones: { x: 2750, y: 280, scale: 1 },
  btnScreenshot: { x: 2780, y: 680, scale: 1 },
  btnAyuda: { x: 2750, y: 440, scale: 1 },
  btnCamara: { x: 165, y: 15, scale: 1 },
};

// Visuales
hud.addButton({ id: 'dial', image: 'data/hud/dial.png', pressable: false, ...HUD_POS.dial });
hud.addButton({ id: 'panel', image: 'data/hud/panel.png', pressable: false, ...HUD_POS.panel });
hud.addButton({ id: 'pj', image: 'data/hud/pj.png', pressable: false, ...HUD_POS.pj });
hud.addButton({ id: 'smallpanel', image: 'data/hud/smallpanel.png', pressable: false, ...HUD_POS.smallpanel });

// Interactivos
hud.addButton({
  id: 'btnPersonas',
  image: 'data/hud/btn_personas.png',
  pressable: true,
  tooltip: 'Personas',
  ...HUD_POS.btnPersonas,
  action: () => console.log('Abrir menú Personas')
});
hud.addButton({
  id: 'btnOpciones',
  image: 'data/hud/btn_opciones.png',
  pressable: true,
  tooltip: 'Opciones',
  ...HUD_POS.btnOpciones,
  action: () => console.log('Abrir opciones')
});
hud.addButton({
  id: 'btnConstruccion',
  image: 'data/hud/btn_construccion.png',
  pressable: true,
  tooltip: 'Construcción',
  ...HUD_POS.btnConstruccion,
  action: () => {
    const nuevoModo = hud.isCameraMode() ? 'sprite' : 'camera';
    hud.setMode(nuevoModo);
    console.log(`Modo cambiado a: ${nuevoModo}`);
  }
});
hud.addButton({
  id: 'btnObjetos',
  image: 'data/hud/btn_objetos.png',
  pressable: true,
  tooltip: 'Objetos',
  ...HUD_POS.btnObjetos,
  action: () => console.log('Ver objetos')
});
hud.addButton({
  id: 'btnScreenshot',
  image: 'data/hud/btn_screenshot.png',
  pressable: true,
  tooltip: 'Captura de pantalla',
  ...HUD_POS.btnScreenshot,
  action: () => console.log('Tomar screenshot')
});
hud.addButton({
  id: 'btnAyuda',
  image: 'data/hud/btn_ayuda.png',
  pressable: true,
  tooltip: 'Ayuda',
  ...HUD_POS.btnAyuda,
  action: () => console.log('Mostrar ayuda')
});
hud.addButton({ id: 'ball', image: 'data/hud/ball.png', pressable: false, ...HUD_POS.ball });
hud.addButton({
  id: 'btnCamara',
  image: 'data/hud/btn_camara.png',
  pressable: true,
  tooltip: 'Modo cámara',
  ...HUD_POS.btnCamara,
  action: () => {
    hud.cameraLocked = !hud.cameraLocked;
    console.log(`Bloqueo de cámara: ${hud.cameraLocked ? 'Activado' : 'Desactivado'}`);
  }
});

// Fondo
const bgImage = new Image();
bgImage.src = 'assets/backgrounds/bg.png';
let bgLoaded = false;
bgImage.onload = () => (bgLoaded = true);

// Estado del mouse global
let isMouseDown = false;
let mouseButton = 0;
let mousePos = { x: 0, y: 0 };

// ------------------- Utils de Tile -------------------
function getBaseTileUnderCursor(posCanvas) {
  // CORRECCIÓN: Ajustar matemática para coincidir con el offset visual (height/2)
  const localX = posCanvas.x + camera.x - canvas.width / 2;
  const localY = posCanvas.y + camera.y - canvas.height / 2; 
  
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

// ------------------- Eventos de mouse (Usando getMousePos corregido) -------------------
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('click', () => canvas.focus());

canvas.addEventListener('mousedown', e => {
  mousePos = getMousePos(e);
  isMouseDown = true;
  mouseButton = e.button;

  // IMPORTANTE: El HUD ahora maneja su propio click internamente en hud.js,
  // pero si queremos bloquear la interacción con el mundo si se hizo click en HUD:
  // (Requiere que HUD tenga un método 'isHoveringButton', por ahora lo dejamos simple)

  if (hud.isCameraMode()) {
     camera.startDrag(mousePos.x, mousePos.y);
  } else {
     placeSpriteAtCursor(mousePos, mouseButton);
  }
});

canvas.addEventListener('mousemove', e => {
  mousePos = getMousePos(e);
  
  if (!isMouseDown) return;
  
  if (hud.isCameraMode()) {
    camera.drag(mousePos.x, mousePos.y);
  } else {
    placeSpriteAtCursor(mousePos, mouseButton);
  }
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
  // Reconstruir grid
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
      // Si el sprite ya está cargado en memoria, usamos su referencia de imagen
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

// ------------------- Loop principal (ACTUALIZADO) -------------------
let lastTime = performance.now();

function loop(ts) {
  const dt = (ts - lastTime) / 1000;
  lastTime = ts;

  camera.update(dt, grid, CONFIG.cameraLag, hud.isCameraLocked());
  player.update(dt);

  // Limpiar
  ctx.save();
  ctx.fillStyle = CONFIG.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (bgLoaded) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  grid.draw(ctx, camera);

  // PREVIEW DE SPRITE (ACTUALIZADO)
  if (hud.mode === 'sprite' && hud.getSelectedSprite() && mousePos) {
    const spritePath = hud.getSelectedSprite();
    const spriteData = hud.getSpriteData(spritePath);
    
    if (spriteData && spriteData.loaded) {
      const baseTile = getBaseTileUnderCursor(mousePos);
      if (baseTile) {
        const p = grid.tileToScreen(baseTile.x, baseTile.y);
        const depth = spriteData.depth || 1;
        const width = spriteData.width || 1;
        
        ctx.save();
        // CORRECCIÓN: Usar height / 2 para alinearse perfectamente con la grilla
        ctx.translate(
          canvas.width / 2 - camera.x,
          canvas.height / 2 - camera.y
        );
        
        const drawX = p.x - (grid.tileW * width) / 2;
        const drawY = p.y - grid.tileH * (depth - 1); 

        ctx.globalAlpha = 0.6;
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
  hud.draw(ctx); 

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