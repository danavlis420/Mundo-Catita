// scripts/hud.js
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

    this.loadSpritesJSON();
  }

  setMode(mode) { this.mode = mode; }
  isCameraMode() { return this.mode === 'camera'; }
  toggleCameraLock() { this.cameraLocked = !this.cameraLocked; }
  isCameraLocked() { return this.cameraLocked; }
  getSelectedSprite() { return this.selectedSprite; }

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
      this.setMode('sprite'); 
      console.log("Sprite seleccionado:", path);
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