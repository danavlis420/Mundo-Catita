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

    this.loadSpritesJSON();
  }

  // ... (Mantener setMode, isCameraMode, etc. igual que antes) ...
  setMode(mode) { this.mode = mode; }
  isCameraMode() { return this.mode === 'camera'; }
  toggleCameraLock() { this.cameraLocked = !this.cameraLocked; }
  isCameraLocked() { return this.cameraLocked; }
  getSelectedSprite() { return this.selectedSprite; }
  
  loadSpritesJSON() {
    fetch('data/sprites.json')
      .then(res => res.json())
      .then(data => {
        data.forEach(s => this.spritesData[s.path] = s);
        this.updateSpriteDropdown();
      });
  }
  getSpriteData(path) { return this.spritesData[path]; }
  updateSpriteDropdown() {
    const keys = Object.keys(this.spritesData);
    if (keys.length > 0) this.selectedSprite = keys[0];
  }
  setOffset(x, y) {
    this.container.position.set(x, y);
  }

  // --- NUEVO: CARGA DE TEXTURAS SUAVIZADAS ---
  // Esto arregla los bordes extraños en el HUD manteniendo el juego pixelado
  loadSmoothTexture(path) {
    const texture = PIXI.Texture.from(path);
    // Forzamos el modo LINEAR solo para esta textura
    texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR; 
    return texture;
  }

  // --- MÉTODOS DE DIBUJO ---

  // Nuevo método para el fondo del HUD
  addBackground(imagePath) {
    const texture = this.loadSmoothTexture(imagePath);
    const bg = new PIXI.Sprite(texture);
    bg.x = 0;
    bg.y = 0;
    // Aseguramos que vaya al fondo del contenedor del HUD
    bg.zIndex = -100; 
    // Opcional: Si quieres que el fondo se estire automáticamente al ancho de la pantalla lógica
    // bg.width = 800 / this.container.scale.x; 
    this.container.addChild(bg);
    
    // Reordenar hijos para que el zIndex funcione inmediatamente
    this.container.sortChildren(); 
  }
  
  addSprite(imagePath, x, y, scale = 1.0) {
    const texture = this.loadSmoothTexture(imagePath);
    const sprite = new PIXI.Sprite(texture);
    sprite.x = x;
    sprite.y = y;
    sprite.scale.set(scale); // Aplicar escala individual
    this.container.addChild(sprite);
    return sprite;
  }

  // Actualizado para recibir parámetro 'scale'
  addButton({ id, image, x, y, action, tooltip, scale = 1.0 }) {
    const texture = this.loadSmoothTexture(image);
    const btn = new PIXI.Sprite(texture);
    
    btn.x = x;
    btn.y = y;
    btn.scale.set(scale); // Escala individual
    
    btn.eventMode = 'static'; 
    btn.cursor = 'pointer';

    btn.on('pointerdown', () => {
      btn.tint = 0xAAAAAA; 
      if (action) action();
    });

    btn.on('pointerup', () => { btn.tint = 0xFFFFFF; });
    btn.on('pointerout', () => { 
      btn.tint = 0xFFFFFF; 
      this.tooltipManager.hide(); 
    });
    
    if(tooltip) {
      btn.on('pointerover', () => {
        // Ajustamos la posición del tooltip considerando la escala del botón y del contenedor
        // Usamos getGlobalPosition para ser precisos
        this.tooltipManager.show(tooltip);
      });
    }

    this.container.addChild(btn);
  }
}