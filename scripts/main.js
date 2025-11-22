// scripts/main.js
import { CONFIG } from './config.js';
import { Grid } from './grid.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { initInput } from './input.js';
import { HUD } from './hud.js';
import { TooltipManager } from './tooltip.js'; 

// 1. INICIALIZAR PIXIJS
const app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0x2b3440,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: false 
});

document.getElementById('game-container').appendChild(app.view);

// IMPORTANTE: Mantenemos NEAREST por defecto para el juego (Pixel Art)
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

// 2. CAPAS
const fixedBackgroundContainer = new PIXI.Container();
const worldContainer = new PIXI.Container();
const hudContainer = new PIXI.Container();

worldContainer.sortableChildren = true; 
hudContainer.sortableChildren = true; // Necesario para que el fondo del HUD quede atrás

app.stage.addChild(fixedBackgroundContainer);
app.stage.addChild(worldContainer);
app.stage.addChild(hudContainer);

// 3. TOOLTIPS
const tooltipManager = new TooltipManager(app);

// 4. FONDO JUEGO (Wallpaper)
const bgTexture = PIXI.Texture.from('assets/backgrounds/bg.png');
// Forzamos Nearest para el fondo del juego si es pixel art, o Linear si es HD
bgTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST; 
const bgSprite = new PIXI.Sprite(bgTexture);
bgSprite.width = 800;
bgSprite.height = 600;
fixedBackgroundContainer.addChild(bgSprite);


// 5. ENTIDADES
const grid = new Grid(worldContainer, CONFIG.cols, CONFIG.rows);
const player = new Player(grid, worldContainer);
const camera = new Camera(player, 0, -100);
const hud = new HUD(hudContainer, app, tooltipManager);

initInput(player);


// 6. CONFIGURACIÓN DEL HUD
// ---------------------------------------------------------
const HUD_SCALE_GLOBAL = 0.23; // Escala general del contenedor
const HUD_ORIGINAL_HEIGHT = 850; // Asumimos que el PNG del fondo mide aprox esto de alto
const SCREEN_HEIGHT = 600;

const HUD_REAL_HEIGHT = HUD_ORIGINAL_HEIGHT * HUD_SCALE_GLOBAL;
const HUD_START_Y = SCREEN_HEIGHT - HUD_REAL_HEIGHT;

hudContainer.scale.set(HUD_SCALE_GLOBAL);
hudContainer.position.set(0, HUD_START_Y);

// --- FONDO DEL HUD ---
// Cargamos la imagen base del HUD
hud.addBackground('data/hud/hud_bg.png');


// --- POSICIONES Y ESCALAS INDIVIDUALES ---
// Ahora cada objeto tiene { x, y, scale }
const HUD_POS = {
  // Elementos decorativos o info
  dial: { x: 20, y: 100, scale: 1 },
  pj: { x: 773, y: 300, scale: 1 }, // Ejemplo: Personaje más grande
  smallpanel: { x: 730, y: 580, scale: 1 },

  // Botones Izquierda
  btnConstruccion: { x: 600, y: 120, scale: 1 }, // Botón grande
  btnPersonas: { x: 90, y: 30, scale: 1 },
  btnObjetos: { x: 900, y: 120, scale: 1 }, // Botón pequeño
  
  // Botones Derecha (Cálculo relativo al ancho lógico)
  // Ancho lógico aprox = 800 / 0.25 = 3200px (Si el contenedor es muy ancho)
  // Ajusta estos valores X según el ancho real de tu imagen 'hud_bg.png'
  btnCamara: { x: 900, y: 600, scale: 1.0 }, 
  btnScreenshot: { x: 450, y: 120, scale: 1.0 },
  btnAyuda: { x: 400, y: 120, scale: 1.0 },
  btnOpciones: { x: 400, y: 250, scale: 1.0 } 
};

// AGREGAR ELEMENTOS (Usando el parámetro de escala)
// Nota: addSprite y addButton ahora leen .scale del objeto config

hud.addSprite('data/hud/dial.png', HUD_POS.dial.x, HUD_POS.dial.y, HUD_POS.dial.scale);
hud.addSprite('data/hud/pj.png', HUD_POS.pj.x, HUD_POS.pj.y, HUD_POS.pj.scale);
hud.addSprite('data/hud/smallpanel.png', HUD_POS.smallpanel.x, HUD_POS.smallpanel.y, HUD_POS.smallpanel.scale);

hud.addButton({
  id: 'btnConstruccion',
  image: 'data/hud/btn_construccion.png',
  x: HUD_POS.btnConstruccion.x,
  y: HUD_POS.btnConstruccion.y,
  scale: HUD_POS.btnConstruccion.scale, // <--- Pasamos la escala
  tooltip: 'Modo Construir',
  action: () => {
    const nuevo = hud.isCameraMode() ? 'sprite' : 'camera';
    hud.setMode(nuevo);
  }
});

hud.addButton({
  id: 'btnCamara',
  image: 'data/hud/btn_camara.png',
  x: HUD_POS.btnCamara.x,
  y: HUD_POS.btnCamara.y,
  scale: HUD_POS.btnCamara.scale,
  tooltip: 'Bloquear Cámara',
  action: () => hud.toggleCameraLock()
});

hud.addButton({
  id: 'btnPersonas',
  image: 'data/hud/btn_personas.png',
  x: HUD_POS.btnPersonas.x,
  y: HUD_POS.btnPersonas.y,
  scale: HUD_POS.btnPersonas.scale,
  tooltip: 'Menu Personas',
  action: () => console.log("Personas")
});

// 7. INTERACCIÓN Y LOOP (Igual que antes)
app.stage.eventMode = 'static';
app.stage.hitArea = app.screen;

function getBaseTileUnderCursor(globalPos) {
  const localPos = worldContainer.toLocal(globalPos);
  return grid.screenToTile(localPos.x, localPos.y);
}

app.stage.on('pointerdown', (e) => {
  if (e.global.y >= HUD_START_Y) return; // Bloqueo HUD

  if (hud.isCameraMode()) {
    camera.startDrag(e.global.x, e.global.y);
  } else {
    const tile = getBaseTileUnderCursor(e.global);
    if (!tile) return;

    const spritePath = hud.getSelectedSprite();
    const spriteData = hud.getSpriteData(spritePath);
    
    if (e.button === 0 && spriteData) {
       grid.setTileSprite(tile.x, tile.y, spriteData);
    } else if (e.button === 2) {
       grid.clearTile(tile.x, tile.y, spriteData?.category || 'object');
    }
  }
});

app.stage.on('pointermove', (e) => {
  if (hud.isCameraMode()) camera.drag(e.global.x, e.global.y);
});
app.stage.on('pointerup', () => camera.endDrag());
app.stage.on('pointerupoutside', () => camera.endDrag());

app.ticker.add((delta) => {
  const dt = delta / 60;
  player.update(dt);
  camera.update(dt, grid, CONFIG.cameraLag, hud.isCameraLocked());
  worldContainer.position.set(400 - camera.x, 300 - camera.y);
  updateGhostSprite();
});

let ghostSprite = null;
function updateGhostSprite() {
  const globalMouse = app.renderer.events.pointer.global;
  if (globalMouse.y >= HUD_START_Y) {
      if (ghostSprite) ghostSprite.visible = false;
      return;
  }

  if (hud.mode === 'sprite' && hud.getSelectedSprite()) {
    const tile = getBaseTileUnderCursor(globalMouse);
    if (tile) {
      const spriteData = hud.getSpriteData(hud.getSelectedSprite());
      if (!ghostSprite) {
        ghostSprite = new PIXI.Sprite();
        ghostSprite.alpha = 0.5; 
        ghostSprite.tint = 0xAAFFAA; 
        worldContainer.addChild(ghostSprite);
      }
      
      if (spriteData && spriteData.path) {
          const tex = PIXI.Texture.from(spriteData.path);
          ghostSprite.texture = tex;
          ghostSprite.anchor.set(0.5, 1.0);
          const p = grid.tileToScreen(tile.x, tile.y);
          ghostSprite.x = p.x;
          ghostSprite.y = p.y + grid.tileH / 2;
          ghostSprite.zIndex = 99999; 
          ghostSprite.visible = true;
      }
    } else {
      if (ghostSprite) ghostSprite.visible = false;
    }
  } else {
    if (ghostSprite) ghostSprite.visible = false;
  }
}

window.Mundo = { app, worldContainer, grid, player, hud, tooltipManager };