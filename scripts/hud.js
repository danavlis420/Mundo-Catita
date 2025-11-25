// scripts/hud.js
import { ConstructionTools } from './constructionTools.js';

export class HUD {
  constructor(container, app, tooltipManager) {
    this.container = container;
    this.app = app;
    this.tooltipManager = tooltipManager; 
    
    this.mode = 'camera'; 
    this.cameraLocked = true;
    this.selectedSprite = null;
    this.spritesData = {};
    this.spritesList = []; 

    // Instancia de Herramientas (Popup No Bloqueante)
    // Se añade al contenedor HUD para estar en la capa UI pero es draggable
    this.constructionTools = new ConstructionTools(app, this);
    this.container.addChild(this.constructionTools);

    this.loadSpritesJSON();
  }

  setMode(mode) { this.mode = mode; }
  isCameraMode() { return this.mode === 'camera'; }
  toggleCameraLock() { this.cameraLocked = !this.cameraLocked; }
  isCameraLocked() { return this.cameraLocked; }
  getSelectedSprite() { return this.selectedSprite; }

  toggleConstructionMode(active) {
    if (active) {
        this.setMode('sprite');
        this.constructionTools.open();
    } else {
        this.setMode('camera'); // O lo que corresponda al salir
        this.constructionTools.close();
        this.selectedSprite = null;
    }
  }

  // Wrapper para obtener estado de herramientas
  getConstructionTool() { return this.constructionTools.currentTool; }
  getConstructionLayer() { return this.constructionTools.currentLayer; }

  loadSpritesJSON() {
    fetch('data/sprites.json')
      .then(res => res.json())
      .then(data => {
        this.spritesList = data;
        data.forEach(s => this.spritesData[s.path] = s);
        // ELIMINADO: this.updateSpriteDropdown(); <- Esto causaba el error
      })
      .catch(e => console.error("Error cargando sprites.json:", e));
  }

  getSpritesList() {
    return this.spritesList || [];
  }

  getSpriteData(path) {
    return this.spritesData[path];
  }

  selectSprite(path) {
    if (this.spritesData[path]) {
      this.selectedSprite = path;
      this.setMode('sprite'); // Activa modo construcción
      
      // Abrir herramientas si no están abiertas
      if (!this.constructionTools.visible) {
        this.constructionTools.open();
      }

      // LÓGICA AUTO-CAPA
      const s = this.spritesData[path];
      let targetLayer = this.constructionTools.currentLayer;
      
      // Si es Piso -> Capa 0
      if (s.category === 'Piso' || s.category === 'floor') targetLayer = 0;
      // Si es Pared -> Capa 1
      else if (s.category === 'Pared' || s.category === 'wall') targetLayer = 1;
      
      this.constructionTools.setLayer(targetLayer);
      
      console.log("Sprite seleccionado:", path, "Capa Auto:", targetLayer);
    }
  }

  // --- CARGA DE TEXTURAS SUAVIZADAS ---
  loadSmoothTexture(path) {
    const texture = PIXI.Texture.from(path);
    texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR; 
    return texture;
  }

  // --- MÉTODOS DE DIBUJO ---
  addBackground(imagePath) {
    const texture = this.loadSmoothTexture(imagePath);
    const bg = new PIXI.Sprite(texture);
    bg.zIndex = -100; 
    this.container.addChild(bg);
    this.container.sortChildren(); 
  }
  
  addSprite(imagePath, x, y, scale = 1.0) {
    const texture = this.loadSmoothTexture(imagePath);
    const sprite = new PIXI.Sprite(texture);
    sprite.x = x; sprite.y = y;
    sprite.scale.set(scale);
    this.container.addChild(sprite);
    return sprite;
  }

  addButton({ id, image, x, y, action, tooltip, scale = 1.0 }) {
    const texture = this.loadSmoothTexture(image);
    const btn = new PIXI.Sprite(texture);
    btn.x = x; btn.y = y; btn.scale.set(scale);
    btn.eventMode = 'static'; 
    btn.cursor = 'pointer';

    btn.on('pointerdown', (e) => {
      // Evitar propagación para que no interactúe con el mundo si hay superposición
      e.stopPropagation();
      btn.tint = 0xAAAAAA; 
      if (action) action();
    });
    btn.on('pointerup', () => { btn.tint = 0xFFFFFF; });
    btn.on('pointerout', () => { 
      btn.tint = 0xFFFFFF; 
      this.tooltipManager.hide(); 
    });
    if(tooltip) {
      btn.on('pointerover', () => { this.tooltipManager.show(tooltip); });
    }
    this.container.addChild(btn);
  }
}