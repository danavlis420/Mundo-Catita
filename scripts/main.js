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
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

// 2. CAPAS
const fixedBackgroundContainer = new PIXI.Container();
const worldContainer = new PIXI.Container();
const hudContainer = new PIXI.Container();

worldContainer.sortableChildren = true; 
hudContainer.sortableChildren = true;

app.stage.addChild(fixedBackgroundContainer);
app.stage.addChild(worldContainer);
app.stage.addChild(hudContainer);

// 3. TOOLTIPS
const tooltipManager = new TooltipManager(app);

// 4. FONDO JUEGO
const bgTexture = PIXI.Texture.from('assets/backgrounds/bg.png');
bgTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST; 
const bgSprite = new PIXI.Sprite(bgTexture);
bgSprite.width = 800;
bgSprite.height = 600;
fixedBackgroundContainer.addChild(bgSprite);

// 5. ENTIDADES
const grid = new Grid(worldContainer, CONFIG.cols, CONFIG.rows);
const player = new Player(grid, worldContainer);
const camera = new Camera(player, 0, 0);
const hud = new HUD(hudContainer, app, tooltipManager);

// --- ACTUALIZACIÓN INPUT: Pasamos camera y hud también ---
initInput(player, camera, hud);

// 6. EVENTO DE RUEDA DEL RATÓN (ZOOM)
// ---------------------------------------------------------
window.addEventListener('wheel', (e) => {
  // e.deltaY > 0 es scroll hacia abajo (Zoom Out)
  // e.deltaY < 0 es scroll hacia arriba (Zoom In)
  const direction = e.deltaY > 0 ? -1 : 1;
  camera.changeZoom(direction);
}, { passive: true });


// 7. CONFIGURACIÓN HUD (Se mantiene igual que antes)
const HUD_SCALE_GLOBAL = 0.23;
const HUD_ORIGINAL_HEIGHT = 850;
const SCREEN_HEIGHT = 600;
const HUD_REAL_HEIGHT = HUD_ORIGINAL_HEIGHT * HUD_SCALE_GLOBAL;
const HUD_START_Y = SCREEN_HEIGHT - HUD_REAL_HEIGHT;

hudContainer.scale.set(HUD_SCALE_GLOBAL);
hudContainer.position.set(0, HUD_START_Y);

hud.addBackground('data/hud/hud_bg.png');

const HUD_POS = {
  dial: { x: 20, y: 100, scale: 1 },
  pj: { x: 773, y: 300, scale: 1 },
  smallpanel: { x: 730, y: 580, scale: 1 },
  btnConstruccion: { x: 600, y: 120, scale: 1 },
  btnPersonas: { x: 90, y: 30, scale: 1 },
  btnObjetos: { x: 900, y: 120, scale: 1 },
  btnCamara: { x: 900, y: 600, scale: 1.0 }, 
  btnScreenshot: { x: 450, y: 120, scale: 1.0 },
  btnAyuda: { x: 400, y: 120, scale: 1.0 },
  btnOpciones: { x: 400, y: 250, scale: 1.0 } 
};

hud.addSprite('data/hud/dial.png', HUD_POS.dial.x, HUD_POS.dial.y, HUD_POS.dial.scale);
hud.addSprite('data/hud/pj.png', HUD_POS.pj.x, HUD_POS.pj.y, HUD_POS.pj.scale);
hud.addSprite('data/hud/smallpanel.png', HUD_POS.smallpanel.x, HUD_POS.smallpanel.y, HUD_POS.smallpanel.scale);

hud.addButton({
  id: 'btnConstruccion',
  image: 'data/hud/btn_construccion.png',
  x: HUD_POS.btnConstruccion.x,
  y: HUD_POS.btnConstruccion.y,
  scale: HUD_POS.btnConstruccion.scale,
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

// 8. INTERACCIÓN Y LOOP
app.stage.eventMode = 'static';
app.stage.hitArea = app.screen;

function getBaseTileUnderCursor(globalPos) {
  // IMPORTANTE: Ahora toLocal tiene en cuenta la escala del worldContainer
  const localPos = worldContainer.toLocal(globalPos);
  return grid.screenToTile(localPos.x, localPos.y);
}

app.stage.on('pointerdown', (e) => {
  if (e.global.y >= HUD_START_Y) return;

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
  
  // --- APLICAR ZOOM AL MUNDO ---
  // 1. Aplicamos la escala calculada en camera
  worldContainer.scale.set(camera.currentScale);
  
  // 2. Calculamos la posición para mantener el centro
  // Fórmula: CentroPantalla - (PosicionCamara * Escala)
  worldContainer.position.set(
      400 - (camera.x * camera.currentScale), 
      300 - (camera.y * camera.currentScale)
  );
  
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
        ghostSprite.alpha = 0.6; 
        ghostSprite.tint = 0xAAFFAA; 
        worldContainer.addChild(ghostSprite);
      }
      if (spriteData && spriteData.path) {
          const tex = PIXI.Texture.from(spriteData.path);
          if (ghostSprite.texture !== tex) ghostSprite.texture = tex;
          const isFloor = (spriteData.category === 'floor');
          const anchorY = isFloor ? 0.5 : 1.0;
          ghostSprite.anchor.set(0.5, anchorY);
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