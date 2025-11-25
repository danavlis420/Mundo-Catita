// scripts/main.js
import { CONFIG } from './config.js';
import { Grid } from './grid.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { initInput } from './input.js';
import { HUD } from './hud.js';
import { TooltipManager } from './tooltip.js';
import { PopupManager } from './popup.js';
import { ScrollPanel } from './scrollPanel.js'; 

// 1. INICIALIZAR PIXIJS
const app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0x2b3440,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: true
});

const containerDOM = document.getElementById('game-container');
containerDOM.appendChild(app.view);

app.view.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.LINEAR;

// 2. CAPAS
const fixedBackgroundContainer = new PIXI.Container();
const worldContainer = new PIXI.Container();
const hudContainer = new PIXI.Container();
const uiContainer = new PIXI.Container(); 
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
bgTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
const bgSprite = new PIXI.Sprite(bgTexture);
bgSprite.width = 800;
bgSprite.height = 600;
fixedBackgroundContainer.addChild(bgSprite);

// 5. FILTROS
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
  fontFamily: 'Arial', fontSize: 12, fill: 0x68FF8F, 
  fontWeight: 'bold', stroke: 0x142210, strokeThickness: 2
});
fpsText.x = 10; fpsText.y = 10;
debugLayer.addChild(fpsText);
fpsText.visible = false; 

// 8. INPUT
initInput(player, camera, hud, grid, fpsText);

// --- CONFIGURACIÓN PANEL PRINCIPAL ---
const mainPanel = new ScrollPanel(410, 125, 14, uiContainer);
mainPanel.x = 365; 
mainPanel.y = 465; 
mainPanel.visible = false; 
uiContainer.addChild(mainPanel);

// --- SISTEMA DE MENÚS ---
const MenuSystem = {
  toggle: (menuName) => {
    // Lógica extendida para conectar con HUD Construction Mode
    // Si cerramos construcción, avisar al HUD
    if (mainPanel.visible && mainPanel.currentMenu === 'CONSTRUCCION' && menuName !== 'CONSTRUCCION') {
        hud.toggleConstructionMode(false);
    }

    // Lógica base de toggle
    if (mainPanel.visible && mainPanel.currentMenu === menuName) {
      mainPanel.visible = false;
      mainPanel.currentMenu = null;
      mainPanel.clear();
      
      // Si cerramos el menú y era construcción
      if (menuName === 'CONSTRUCCION') hud.toggleConstructionMode(false);
      return;
    }
    
    mainPanel.clear();
    mainPanel.visible = true;
    mainPanel.currentMenu = menuName;
    
    // Si abrimos construcción
    if (menuName === 'CONSTRUCCION') {
        hud.toggleConstructionMode(true);
        MenuSystem.buildConstructionMenu();
    } else {
        // Asegurar que cerramos herramientas si cambiamos a otro menú
        hud.toggleConstructionMode(false);
        switch(menuName) {
            case 'PERSONAJE': MenuSystem.buildCharacterMenu(); break;
            case 'OPCIONES': MenuSystem.buildOptionsMenu(); break;
            case 'AYUDA': MenuSystem.buildHelpMenu(); break;
        }
    }
  },

  buildConstructionMenu: () => {
    mainPanel.clear();
    mainPanel.addText("Construcción", 18, true);

    const categories = ["Todo", "Suelo", "Pared", "Obj/Mueble", "Personaje"];
    
    const getCategoryFromFolder = (folder) => {
        if (folder === 'floor') return 'Suelo';
        if (folder === 'wall') return 'Pared';
        if (folder === 'sims') return 'Personaje';
        return 'Obj/Mueble'; 
    };

    const renderItems = (filter) => {
        const allSprites = hud.getSpritesList();
        
        let filtered = allSprites;
        if (filter !== "Todo") {
            filtered = allSprites.filter(s => getCategoryFromFolder(s.category) === filter);
        }

        filtered.sort((a, b) => {
            const areaA = a.width * a.height;
            const areaB = b.width * b.height;
            if (areaA !== areaB) return areaA - areaB; 
            return a.name.localeCompare(b.name);
        });

        const gridItems = filtered.map(s => ({
            texture: s.path,
            label: `${s.name.split('_')[0]} (${s.width}x${s.height})`, 
            callback: () => hud.selectSprite(s.path)
        }));

        mainPanel.addGridItems(gridItems);
    };

    mainPanel.addDropdown("Filtrar por:", categories, (selectedFilter) => {
        MenuSystem.buildConstructionMenuRefreshed(selectedFilter);
    });

    renderItems("Todo");
  },

  buildConstructionMenuRefreshed: (filterVal) => {
      mainPanel.clear();
      mainPanel.addText("Construcción", 18, true);
      
      const categories = ["Todo", "Suelo", "Pared", "Obj/Mueble", "Personaje"];
      
      mainPanel.addDropdown("Filtrar por:", categories, (val) => MenuSystem.buildConstructionMenuRefreshed(val));
      
      const lastDd = mainPanel.dropdowns[mainPanel.dropdowns.length-1];
      if(lastDd) { lastDd.selectedText = filterVal; lastDd.drawBase(); }

      const allSprites = hud.getSpritesList();
      const getCategoryFromFolder = (f) => {
          if (f === 'floor') return 'Suelo';
          if (f === 'wall') return 'Pared';
          if (f === 'sims') return 'Personaje';
          return 'Obj/Mueble';
      };

      let filtered = allSprites;
      if (filterVal !== "Todo") filtered = allSprites.filter(s => getCategoryFromFolder(s.category) === filterVal);
      
      filtered.sort((a, b) => (a.width * a.height) - (b.width * b.height));

      const gridItems = filtered.map(s => ({
          texture: s.path,
          label: `${s.name.split('_')[0]} (${s.width}x${s.height})`,
          callback: () => hud.selectSprite(s.path)
      }));
      mainPanel.addGridItems(gridItems);
  },

  buildCharacterMenu: () => {
    mainPanel.addText("Mi Personaje", 18, true);
    mainPanel.addText("Estado: Saludable");
    mainPanel.addText("Nivel: 5");
    mainPanel.addText("Inventario:", 14, true);
    const items = [
      { texture: 'assets/sprites/obj/bush_1x1_1.png', label: 'Bayas', callback: () => {} }, // Ejemplo ajustado
      { texture: 'assets/sprites/obj/table_1x1_1.png', label: 'Mapa', callback: () => {} },
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
  }
};

// 9. ZOOM MOUSE
app.view.addEventListener('wheel', (e) => {
  e.preventDefault();
}, { passive: false });

app.stage.on('wheel', (e) => {
  if (e.target && (e.target === mainPanel || mainPanel.contains(e.target))) return; 
  const direction = Math.sign(e.deltaY) * -1; 
  if (direction !== 0) {
    camera.changeZoom(direction);
  }
});

// --- SCREENSHOT ---
async function takeScreenshot() {
  const wasHudVisible = hudContainer.visible;
  const wasDebugVisible = debugLayer.visible;
  const wasUiVisible = uiContainer.visible; 
  const wasInnerGridVisible = grid.innerGraphics ? grid.innerGraphics.visible : false;
  const wasBorderGridVisible = grid.borderGraphics ? grid.borderGraphics.visible : false;
  const wasGhostVisible = ghostSprite ? ghostSprite.visible : false;
  
  hudContainer.visible = false;
  debugLayer.visible = false;
  uiContainer.visible = false; 
  
  if (grid.innerGraphics) grid.innerGraphics.visible = false;
  if (grid.borderGraphics) grid.borderGraphics.visible = false;
  if (ghostSprite) ghostSprite.visible = false;
  
  tooltipManager.hide(); 
  popupManager.hide(); 
  
  // Ocultar ventana herramientas temporalmente si es parte del HUD container
  const toolsWasVisible = hud.constructionTools.visible;
  hud.constructionTools.visible = false;

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

  hudContainer.visible = wasHudVisible;
  debugLayer.visible = wasDebugVisible;
  uiContainer.visible = wasUiVisible;
  if (grid.innerGraphics) grid.innerGraphics.visible = wasInnerGridVisible;
  if (grid.borderGraphics) grid.borderGraphics.visible = wasBorderGridVisible;
  if (ghostSprite) ghostSprite.visible = wasGhostVisible;
  hud.constructionTools.visible = toolsWasVisible;
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
  btnPersonas: { x: 90, y: 30, scale: 1 },
  btnPj: { x: 370, y: 90, scale: 1 },
  btnConstruccion: { x: 550, y: 260, scale: 1 },
  btnGrid: { x: 540, y: 510, scale: 1 },
  btnCamara: { x: 900, y: 600, scale: 1.0 },
  btnAyuda: { x: 1265, y: 270, scale: .9},
  btnOpciones: { x: 1270, y: 465, scale: .9 },
  btnScreenshot: { x: 1255, y: 660, scale: .9 },
};

hud.addSprite('data/hud/dial.png', HUD_POS.dial.x, HUD_POS.dial.y, HUD_POS.dial.scale);
hud.addSprite('data/hud/pj.png', HUD_POS.pj.x, HUD_POS.pj.y, HUD_POS.pj.scale);
hud.addSprite('data/hud/smallpanel.png', HUD_POS.smallpanel.x, HUD_POS.smallpanel.y, HUD_POS.smallpanel.scale);
hud.addSprite('data/hud/panel.png', HUD_POS.panel.x, HUD_POS.panel.y, HUD_POS.panel.scale);
hud.addSprite('data/hud/ball.png', HUD_POS.ball.x, HUD_POS.ball.y, HUD_POS.ball.scale);

// --- BOTONES HUD ---

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

// 11. INTERACCIÓN (SISTEMA DE EVENTOS CENTRAL)
app.stage.eventMode = 'static';
app.stage.hitArea = app.screen;

function getBaseTileUnderCursor(globalPos) {
  const localPos = worldContainer.toLocal(globalPos);
  return grid.screenToTile(localPos.x, localPos.y);
}

// Variable para el estado del borrador
let hoveredEraserSprite = null;

// --- POINTER DOWN ---
app.stage.on('pointerdown', (e) => {
  if (e.global.y >= HUD_START_Y) return;

  // Bloquear si click en ventana de herramientas (si está visible)
  if (hud.constructionTools && hud.constructionTools.visible) {
      const toolBounds = hud.constructionTools.getBounds();
      // Verificación simple de bounds globales (teniendo en cuenta que tool está en hudContainer)
      const globalToolPos = hud.constructionTools.getGlobalPosition();
      // Como toolBounds es local, mejor usar containsPoint con lógica global directa si es posible,
      // o simplificar: si el target es parte de las herramientas, el evento ya se detuvo ahí (stopPropagation en botones).
      // Pero si clickeamos el fondo del panel herramientas:
      if (e.target && (e.target === hud.constructionTools || hud.constructionTools.children.includes(e.target))) return;
  }
  
  // Bloquear si click en Main Panel
  if (mainPanel.visible) {
      const b = mainPanel.getBounds();
      if (e.global.x >= b.x && e.global.x <= b.x + b.width && e.global.y >= b.y && e.global.y <= b.y + b.height) return;
  }

  if (hud.isCameraMode()) {
    camera.startDrag(e.global.x, e.global.y);
  } else {
    // --- MODO CONSTRUCCION ---
    const tool = hud.getConstructionTool();
    const layer = hud.getConstructionLayer();

    if (e.button === 0) { // Click Izquierdo
        if (tool === 'brush') {
            const tile = getBaseTileUnderCursor(e.global);
            const spritePath = hud.getSelectedSprite();
            if (tile && spritePath) {
                const spriteData = hud.getSpriteData(spritePath);
                if (spriteData) {
                    grid.setTileSprite(tile.x, tile.y, spriteData, layer);
                }
            }
        } else if (tool === 'eraser') {
            // Borrado por click izquierdo sobre el sprite resaltado
            if (hoveredEraserSprite) {
                const { x, y, layer } = hoveredEraserSprite.gridLocation;
                grid.removeTileFromLayer(x, y, layer);
                hoveredEraserSprite = null; 
            }
        }
    } 
    // Click derecho: Cancelar selección o cerrar menú
    else if (e.button === 2) {
       hud.toggleConstructionMode(false);
       if(mainPanel.currentMenu === 'CONSTRUCCION') MenuSystem.toggle('CONSTRUCCION');
    }
  }
});

// --- POINTER MOVE ---
app.stage.on('pointermove', (e) => {
  if (hud.isCameraMode()) {
      camera.drag(e.global.x, e.global.y);
  } else {
      // LOGICA HOVER BORRADOR
      if (hud.mode === 'sprite' && hud.getConstructionTool() === 'eraser') {
          updateEraserHover(e.global);
      } else {
          // Limpiar tinte si cambiamos de herramienta
          if (hoveredEraserSprite) {
              hoveredEraserSprite.tint = 0xFFFFFF;
              hoveredEraserSprite = null;
          }
      }
  }
});

app.stage.on('pointerup', () => camera.endDrag());
app.stage.on('pointerupoutside', () => camera.endDrag());

// --- FUNCIÓN DE HOVER BORRADOR ---
function updateEraserHover(globalPos) {
    const activeLayer = hud.getConstructionLayer();
    let found = null;
    
    // Iteramos en reverso (de arriba a abajo visualmente)
    for (let i = worldContainer.children.length - 1; i >= 0; i--) {
        const obj = worldContainer.children[i];
        
        // Solo nos interesan los tiles interactivos de la capa activa
        if (obj.isInteractiveTile && obj.gridLocation && obj.gridLocation.layer === activeLayer) {
            if (obj.containsPoint(globalPos)) {
                found = obj;
                break;
            }
        }
    }

    if (hoveredEraserSprite && hoveredEraserSprite !== found) {
        hoveredEraserSprite.tint = 0xFFFFFF; // Restaurar anterior
    }

    if (found) {
        found.tint = 0xFF0000; // Rojo
        hoveredEraserSprite = found;
    } else {
        hoveredEraserSprite = null;
    }
}

// 12. LOOP PRINCIPAL
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

// --- GHOST SPRITE ---
let ghostSprite = null;
function updateGhostSprite() {
  const globalMouse = app.renderer.events.pointer.global;
  
  // Validaciones UI
  if (globalMouse.y >= HUD_START_Y) { 
      if(ghostSprite) ghostSprite.visible=false; 
      return; 
  }
  
  if (mainPanel.visible) {
      const b = mainPanel.getBounds();
      if (globalMouse.x >= b.x && globalMouse.x <= b.x + b.width &&
          globalMouse.y >= b.y && globalMouse.y <= b.y + b.height) {
           if (ghostSprite) ghostSprite.visible = false;
           return;
      }
  }

  if (hud.constructionTools && hud.constructionTools.visible) {
      const tb = hud.constructionTools.getBounds();
      // Ojo: getBounds del contenedor tools devuelve coordenadas locales al parent (hudContainer) si no se transforma
      // Usamos posiciones globales aproximadas
      const gp = hud.constructionTools.getGlobalPosition();
      if (globalMouse.x >= gp.x && globalMouse.x <= gp.x + hud.constructionTools.width &&
          globalMouse.y >= gp.y && globalMouse.y <= gp.y + hud.constructionTools.height) {
          if (ghostSprite) ghostSprite.visible = false;
          return;
      }
  }

  // Solo mostrar ghost si estamos en modo PINCEL
  if (hud.mode === 'sprite' && hud.getConstructionTool() === 'brush' && hud.getSelectedSprite()) {
    const tile = getBaseTileUnderCursor(globalMouse);
    if (tile) {
      const spriteData = hud.getSpriteData(hud.getSelectedSprite());
      const layer = hud.getConstructionLayer();
      
      if (!ghostSprite) {
        ghostSprite = new PIXI.Sprite();
        ghostSprite.alpha = 0.6; 
        ghostSprite.tint = 0xAAFFAA;
        worldContainer.addChild(ghostSprite);
      }
      
      if (spriteData && spriteData.path) {
        const tex = PIXI.Texture.from(spriteData.path);
        if (ghostSprite.texture !== tex) ghostSprite.texture = tex;
        
        const internalCat = grid.catMap[spriteData.category] || 'object';
        const isFloor = (internalCat === 'floor');
        
        if (isFloor) ghostSprite.anchor.set(0.5, 0.5);
        else ghostSprite.anchor.set(0.5, 1.0);

        // Usar la capa seleccionada para el preview
        const pos = grid.getSpriteScreenPosition(tile.x, tile.y, spriteData, layer);
        
        ghostSprite.x = pos.x;
        ghostSprite.y = pos.y;
        ghostSprite.zIndex = 999999; 
        ghostSprite.visible = true;
        ghostSprite.tint = 0xAAFFAA; // Verde
      }
    } else { if (ghostSprite) ghostSprite.visible = false; }
  } else { if (ghostSprite) ghostSprite.visible = false; }
}

window.Mundo = { app, worldContainer, grid, player, hud, tooltipManager, popupManager };