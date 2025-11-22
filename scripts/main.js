// scripts/main.js
import { CONFIG } from './config.js';
import { Grid } from './grid.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { initInput } from './input.js';
import { HUD } from './hud.js';
import { TooltipManager } from './tooltip.js';
import { PopupManager } from './popup.js';
import { ScrollPanel } from './scrollPanel.js'; // <--- IMPORTAR NUEVO COMPONENTE

// 1. INICIALIZAR PIXIJS
const app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0x2b3440,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: false
});

const containerDOM = document.getElementById('game-container');
containerDOM.appendChild(app.view);

// DESACTIVAR MENÚ CONTEXTUAL
app.view.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

// 2. CAPAS
// Orden de apilamiento: Fondo -> Mundo -> HUD -> UI (Paneles/Ventanas) -> Debug
const fixedBackgroundContainer = new PIXI.Container();
const worldContainer = new PIXI.Container();
const hudContainer = new PIXI.Container();
const uiContainer = new PIXI.Container(); // <--- NUEVA CAPA INDEPENDIENTE DEL HUD (No se escala)
const debugLayer = new PIXI.Container();

app.stage.addChild(fixedBackgroundContainer);
app.stage.addChild(worldContainer);
app.stage.addChild(hudContainer);
app.stage.addChild(uiContainer); 
app.stage.addChild(debugLayer);

worldContainer.sortableChildren = true;
hudContainer.sortableChildren = true;

// 3. UI MANAGERS
const tooltipManager = new TooltipManager(app);
const popupManager = new PopupManager(app);

// 4. FONDO JUEGO
const bgTexture = PIXI.Texture.from('assets/backgrounds/bg.png');
bgTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
const bgSprite = new PIXI.Sprite(bgTexture);
bgSprite.width = 800;
bgSprite.height = 600;
fixedBackgroundContainer.addChild(bgSprite);

// 5. FILTROS (Bloom + CRT)
const bloomFilter = new PIXI.filters.AdvancedBloomFilter({
  threshold: 0.05, bloomScale: 0.7, blur: 9, quality: 5
});
worldContainer.filters = [bloomFilter];

const crtFilter = new PIXI.filters.CRTFilter({
  curvature: 2.5, lineWidth: 7, lineContrast: 0.02,
  verticalLine: false, noise: 0.05, noiseSize: 1.0,
  vignetting: 0.2, vignettingAlpha: 0.7, time: 0
});
app.stage.filters = [crtFilter];

// 6. ENTIDADES
const grid = new Grid(worldContainer, CONFIG.cols, CONFIG.rows);
const player = new Player(grid, worldContainer);
const camera = new Camera(player, 0, 0);
const hud = new HUD(hudContainer, app, tooltipManager);

// 7. CONTADOR FPS
const fpsText = new PIXI.Text('FPS: 0', {
  fontFamily: 'Arial',
  fontSize: 12,
  fill: 0x00FF00, 
  fontWeight: 'bold',
  stroke: 0x000000,
  strokeThickness: 2
});
fpsText.x = 10;
fpsText.y = 10;
debugLayer.addChild(fpsText);
fpsText.visible = false; // Oculto por defecto

// 8. INPUT
initInput(player, camera, hud, grid, fpsText);

// --- CONFIGURACIÓN PANEL PRINCIPAL (INDEPENDIENTE) ---
// Posición lógica 800x600. Lo pondremos a la derecha, alineado visualmente.
// Pasamos uiContainer como capa para los dropdowns.
const mainPanel = new ScrollPanel(410, 125, 14, uiContainer);
mainPanel.x = 365; 
mainPanel.y = 465; 
mainPanel.visible = false; // Oculto al inicio
uiContainer.addChild(mainPanel);

// --- SISTEMA DE MENÚS ---
const MenuSystem = {
  toggle: (menuName) => {
    // Si ya está visible y es el mismo menú, lo cerramos
    if (mainPanel.visible && mainPanel.currentMenu === menuName) {
      mainPanel.visible = false;
      mainPanel.currentMenu = null;
      return;
    }
    
    // Si no, abrimos y llenamos contenido
    mainPanel.clear();
    mainPanel.visible = true;
    mainPanel.currentMenu = menuName;
    
    switch(menuName) {
      case 'CONSTRUCCION':
        MenuSystem.buildConstructionMenu();
        break;
      case 'PERSONAJE':
        MenuSystem.buildCharacterMenu();
        break;
      case 'OPCIONES':
        MenuSystem.buildOptionsMenu();
        break;
      case 'AYUDA':
        MenuSystem.buildHelpMenu();
        break;
    }
  },

  buildConstructionMenu: () => {
    mainPanel.addText("Construcción", 18, true);
    
    mainPanel.addDropdown("Filtro", ["Todo", "Estructuras", "Naturaleza"], (val) => {
        console.log("Filtrar por:", val);
    });

    mainPanel.addText("Elementos:", 14);
    
    // Items de prueba
    const items = [
      { texture: 'assets/sprites/floor_wood.png', label: 'Piso', callback: () => hud.setMode('sprite') },
      { texture: 'assets/sprites/wall_brick.png', label: 'Pared', callback: () => hud.setMode('sprite') },
      { texture: 'assets/sprites/obj_bush.png', label: 'Arbusto', callback: () => hud.setMode('sprite') },
      { texture: 'assets/sprites/obj_table.png', label: 'Mesa', callback: () => hud.setMode('sprite') },
      { texture: 'assets/sprites/floor_grass.png', label: 'Pasto', callback: () => hud.setMode('sprite') },
    ];
    // Duplicamos para testear el scroll
    mainPanel.addGridItems([...items, ...items]); 
  },

  buildCharacterMenu: () => {
    mainPanel.addText("Mi Personaje", 18, true);
    mainPanel.addText("Estado: Saludable");
    mainPanel.addText("Nivel: 5");
    mainPanel.addText("Inventario:", 14, true);
    
    const items = [
      { texture: 'assets/sprites/obj_bush.png', label: 'Bayas', callback: () => {} },
      { texture: 'assets/sprites/obj_table.png', label: 'Mapa', callback: () => {} },
    ];
    mainPanel.addGridItems(items);
  },

  buildOptionsMenu: () => {
    mainPanel.addText("Configuración", 18, true);
    mainPanel.addDropdown("Calidad", ["Alta", "Media", "Baja"], (v) => console.log(v));
    mainPanel.addDropdown("Idioma", ["Español", "English"], (v) => console.log(v));
    mainPanel.addText("Sonido:", 14);
  },

  buildHelpMenu: () => {
    mainPanel.addText("Ayuda", 18, true);
    mainPanel.addText("Controles Básicos:", 14, true);
    mainPanel.addText("- Click Izq: Mover/Acción\n- Click Der: Borrar/Cancelar\n- Rueda: Zoom\n- G: Grilla\n- R: Reset Cámara");
    mainPanel.addText("Objetivo:", 14, true);
    mainPanel.addText("Construye tu propio mundo usando las herramientas del panel de construcción.");
  }
};

// 9. ZOOM MOUSE
window.addEventListener('wheel', (e) => {
  e.preventDefault(); // Siempre evitar scroll del navegador

  // 1. Mapeo de coordenadas seguro
  const hitObj = app.renderer.events.mapPositionToPoint(new PIXI.Point(), e.clientX, e.clientY);

  // 2. PROTECCIÓN HUD
  // Si el mouse está en la zona inferior (HUD), ignoramos.
  // Usamos una validación de seguridad por si la variable no está lista.
  if (typeof HUD_START_Y !== 'undefined' && hitObj.y >= HUD_START_Y) return;

  // 3. ZOOM
  // Si llegamos aquí, significa que:
  // a) No estamos sobre el HUD.
  // b) No estamos sobre el ScrollPanel (porque él hubiera hecho stopPropagation).
  // Por lo tanto, es seguro hacer zoom.
  const direction = Math.sign(e.deltaY) * -1; 
  
  if (direction !== 0) {
    camera.changeZoom(direction);
  }
}, { passive: false });

// --- LÓGICA DE SCREENSHOT ---
async function takeScreenshot() {
  const wasHudVisible = hudContainer.visible;
  const wasDebugVisible = debugLayer.visible;
  const wasUiVisible = uiContainer.visible; 
  const wasInnerGridVisible = grid.innerGraphics ? grid.innerGraphics.visible : false;
  const wasBorderGridVisible = grid.borderGraphics ? grid.borderGraphics.visible : false;
  const wasGhostVisible = ghostSprite ? ghostSprite.visible : false;
  
  // OCULTAR TODO
  hudContainer.visible = false;
  debugLayer.visible = false;
  uiContainer.visible = false; 
  
  if (grid.innerGraphics) grid.innerGraphics.visible = false;
  if (grid.borderGraphics) grid.borderGraphics.visible = false;

  if (ghostSprite) ghostSprite.visible = false;
  
  tooltipManager.hide(); 
  popupManager.hide(); 

  // Renderizar frame limpio
  app.render();

  try {
    const canvas = app.renderer.extract.canvas(app.stage);
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      document.body.append(a);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `mundo_catita_${timestamp}.png`;
      a.href = URL.createObjectURL(blob);
      a.click();
      a.remove();
    }, 'image/png');

  } catch (err) {
    console.error("Error al generar screenshot:", err);
  }

  // RESTAURAR ESTADO
  hudContainer.visible = wasHudVisible;
  debugLayer.visible = wasDebugVisible;
  uiContainer.visible = wasUiVisible;
  
  if (grid.innerGraphics) grid.innerGraphics.visible = wasInnerGridVisible;
  if (grid.borderGraphics) grid.borderGraphics.visible = wasBorderGridVisible;
  
  if (ghostSprite) ghostSprite.visible = wasGhostVisible;
}

// 10. CONFIGURACIÓN HUD
const HUD_SCALE_GLOBAL = 0.24;
const HUD_ORIGINAL_HEIGHT = 850;
const SCREEN_HEIGHT = 600;
const HUD_REAL_HEIGHT = HUD_ORIGINAL_HEIGHT * HUD_SCALE_GLOBAL;
const HUD_START_Y = SCREEN_HEIGHT - HUD_REAL_HEIGHT;

hudContainer.scale.set(HUD_SCALE_GLOBAL);
hudContainer.position.set(0, HUD_START_Y);
hud.addBackground('data/hud/hud_bg.png');

const HUD_POS = {
  dial: { x: 20, y: 100, scale: 1 },
  ball: { x: 220, y: 320, scale: 1.2 },
  pj: { x: 773, y: 300, scale: 1 },
  smallpanel: { x: 730, y: 580, scale: 1 },
  panel: { x: 1435, y: 265, scale: 1 },
  
  // Botones
  btnPersonas: { x: 90, y: 30, scale: 1 },
  btnPj: { x: 370, y: 90, scale: 1 },
  btnConstruccion: { x: 550, y: 260, scale: 1 },
  btnGrid: { x: 540, y: 510, scale: 1 },
  btnCamara: { x: 900, y: 600, scale: 1.0 },
  btnAyuda: { x: 1265, y: 270, scale: .9},
  btnOpciones: { x: 1270, y: 465, scale: .9 },
  btnScreenshot: { x: 1255, y: 660, scale: .9 },
};

// Sprites decorativos del HUD
hud.addSprite('data/hud/dial.png', HUD_POS.dial.x, HUD_POS.dial.y, HUD_POS.dial.scale);
hud.addSprite('data/hud/pj.png', HUD_POS.pj.x, HUD_POS.pj.y, HUD_POS.pj.scale);
hud.addSprite('data/hud/smallpanel.png', HUD_POS.smallpanel.x, HUD_POS.smallpanel.y, HUD_POS.smallpanel.scale);
hud.addSprite('data/hud/panel.png', HUD_POS.panel.x, HUD_POS.panel.y, HUD_POS.panel.scale);
hud.addSprite('data/hud/ball.png', HUD_POS.ball.x, HUD_POS.ball.y, HUD_POS.ball.scale);


// --- BOTONES CONECTADOS AL MENU SYSTEM ---

hud.addButton({
  id: 'btnConstruccion', image: 'data/hud/btn_construccion.png',
  x: HUD_POS.btnConstruccion.x, y: HUD_POS.btnConstruccion.y, scale: HUD_POS.btnConstruccion.scale,
  tooltip: 'Construcción',
  action: () => MenuSystem.toggle('CONSTRUCCION')
});

hud.addButton({
  id: 'btnPj', image: 'data/hud/btn_pj.png',
  x: HUD_POS.btnPj.x, y: HUD_POS.btnPj.y, scale: HUD_POS.btnPj.scale,
  tooltip: 'Personaje',
  action: () => MenuSystem.toggle('PERSONAJE')
});

hud.addButton({
  id: 'btnCamara', image: 'data/hud/btn_camara.png',
  x: HUD_POS.btnCamara.x, y: HUD_POS.btnCamara.y, scale: HUD_POS.btnCamara.scale,
  tooltip: 'Cámara (Bloquear/Libre)',
  action: () => hud.toggleCameraLock() 
});

hud.addButton({
  id: 'btnPersonas', image: 'data/hud/btn_personas.png',
  x: HUD_POS.btnPersonas.x, y: HUD_POS.btnPersonas.y, scale: HUD_POS.btnPersonas.scale,
  tooltip: 'Partida',
  action: () => console.log("Partida - Sin menú asignado aun")
});

hud.addButton({
  id: 'btnAyuda', image: 'data/hud/btn_ayuda.png',
  x: HUD_POS.btnAyuda.x, y: HUD_POS.btnAyuda.y, scale: HUD_POS.btnAyuda.scale,
  tooltip: 'Ayuda',
  action: () => MenuSystem.toggle('AYUDA')
});

hud.addButton({
  id: 'btnOpciones', image: 'data/hud/btn_opciones.png',
  x: HUD_POS.btnOpciones.x, y: HUD_POS.btnOpciones.y, scale: HUD_POS.btnOpciones.scale,
  tooltip: 'Menú',
  action: () => MenuSystem.toggle('OPCIONES')
});

hud.addButton({
  id: 'btnScreenshot', image: 'data/hud/btn_screenshot.png',
  x: HUD_POS.btnScreenshot.x, y: HUD_POS.btnScreenshot.y, scale: HUD_POS.btnScreenshot.scale,
  tooltip: 'Captura de Pantalla',
  action: () => takeScreenshot()
});

hud.addButton({
  id: 'btnGrid', image: 'data/hud/btn_grid.png',
  x: HUD_POS.btnGrid.x, y: HUD_POS.btnGrid.y, scale: HUD_POS.btnGrid.scale,
  tooltip: 'Mostrar/Ocultar Grilla',
  action: () => { 
    const isVisible = grid.toggleGrid(); 
    fpsText.visible = isVisible; 
  }
});

// 11. INTERACCIÓN
app.stage.eventMode = 'static';
app.stage.hitArea = app.screen;

function getBaseTileUnderCursor(globalPos) {
  const localPos = worldContainer.toLocal(globalPos);
  return grid.screenToTile(localPos.x, localPos.y);
}

app.stage.on('pointerdown', (e) => {
  // Bloqueamos clicks si estamos sobre el HUD o el Panel
  if (e.global.y >= HUD_START_Y) return;
  
  // Si el panel está abierto y clickeamos sobre él, no hacemos nada en el mundo
  if (mainPanel.visible) {
      const b = mainPanel.getBounds();
      if (e.global.x >= b.x && e.global.x <= b.x + b.width &&
          e.global.y >= b.y && e.global.y <= b.y + b.height) {
          return;
      }
  }

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

// 12. LOOP
let time = 0;
app.ticker.add((delta) => {
  const dt = delta / 60;

  if (fpsText.visible) {
    fpsText.text = 'FPS: ' + Math.round(app.ticker.FPS);
  }

  player.update(dt);
  camera.update(dt, grid, CONFIG.cameraLag, hud.isCameraLocked());

  worldContainer.scale.set(camera.currentScale);
  worldContainer.position.set(
    400 - (camera.x * camera.currentScale),
    300 - (camera.y * camera.currentScale)
  );

  updateGhostSprite();

  time += 0.1;
  crtFilter.time = time;
  crtFilter.seed = Math.random();
});

let ghostSprite = null;
function updateGhostSprite() {
  const globalMouse = app.renderer.events.pointer.global;
  
  // Si el mouse está sobre el HUD, ocultamos el fantasma
  if (globalMouse.y >= HUD_START_Y) {
    if (ghostSprite) ghostSprite.visible = false;
    return;
  }

  // Si el panel está abierto y el mouse está encima, ocultamos fantasma
  if (mainPanel.visible) {
      const b = mainPanel.getBounds();
      if (globalMouse.x >= b.x && globalMouse.x <= b.x + b.width &&
          globalMouse.y >= b.y && globalMouse.y <= b.y + b.height) {
           if (ghostSprite) ghostSprite.visible = false;
           return;
      }
  }

  if (hud.mode === 'sprite' && hud.getSelectedSprite()) {
    const tile = getBaseTileUnderCursor(globalMouse);
    if (tile) {
      const spriteData = hud.getSpriteData(hud.getSelectedSprite());
      if (!ghostSprite) {
        ghostSprite = new PIXI.Sprite();
        ghostSprite.alpha = 0.6; ghostSprite.tint = 0xAAFFAA;
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
        ghostSprite.zIndex = 99999; ghostSprite.visible = true;
      }
    } else { if (ghostSprite) ghostSprite.visible = false; }
  } else { if (ghostSprite) ghostSprite.visible = false; }
}

window.Mundo = { app, worldContainer, grid, player, hud, tooltipManager, popupManager };