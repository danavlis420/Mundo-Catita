// scripts/grid.js
import { CONFIG } from './config.js';

export class Grid {
  constructor(container, cols = CONFIG.cols, rows = CONFIG.rows) {
    this.container = container;
    this.cols = cols;
    this.rows = rows;
    this.tileW = CONFIG.tileWidth;
    this.tileH = CONFIG.tileHeight;
    this.worldOriginX = 0; 
    this.worldOriginY = 0;

    this.catMap = {
      'Piso': 'floor', 'floor': 'floor',
      'Pared': 'wall', 'wall': 'wall',
      'Objeto': 'object', 'object': 'object',
      'Personaje': 'sims', 'sims': 'sims'
    };

    this.tiles = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ 
        floor: null, wall: null, object: null, sims: null,
        sprites: { floor: null, wall: null, object: null, sims: null } 
      }))
    );

    this.innerGraphics = null;
    this.borderGraphics = null;
    this.debugContainer = new PIXI.Container();
    this.debugContainer.zIndex = 999999;
    this.container.addChild(this.debugContainer);
    this.drawDebugGrid();
  }

  toggleGrid() {
    if (this.innerGraphics) {
      this.innerGraphics.visible = !this.innerGraphics.visible;
      if (!this.innerGraphics.visible) this.debugContainer.removeChildren();
      return this.innerGraphics.visible;
    }
    return false;
  }

  tileToScreen(col, row) {
    return {
      x: this.worldOriginX + (col - row) * (this.tileW / 2),
      y: this.worldOriginY + (col + row) * (this.tileH / 2)
    };
  }

  screenToTile(sx, sy) {
    const adjX = sx - this.worldOriginX;
    const adjY = sy - this.worldOriginY;
    const col = (adjX / (this.tileW / 2) + adjY / (this.tileH / 2)) / 2;
    const row = (adjY / (this.tileH / 2) - adjX / (this.tileW / 2)) / 2;
    const tx = Math.floor(col);
    const ty = Math.floor(row);
    if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return null;
    return { x: tx, y: ty };
  }

  /**
   * CÁLCULO MAESTRO DE POSICIÓN
   * Corrige la alineación visual para que los objetos pisen el suelo correctamente.
   */
  getSpriteScreenPosition(targetX, targetY, spriteData) {
    const ax = spriteData.anchor ? spriteData.anchor.x : 0;
    const ay = spriteData.anchor ? spriteData.anchor.y : 0;
    const w = spriteData.width || 1;
    const h = spriteData.height || 1;
    
    // 1. Centro del tile donde hicimos click
    const p = this.tileToScreen(targetX, targetY);
    
    const internalCat = this.catMap[spriteData.category] || 'object';
    const isFloor = (internalCat === 'floor');
    
    let finalX = p.x;
    let finalY = p.y;
    let zIndex = 0;

    if (isFloor) {
        // --- LÓGICA SUELO (Flat) ---
        // El suelo se centra geométricamente.
        const centerTX = (w - 1) / 2;
        const centerTY = (h - 1) / 2;
        
        // Delta desde el anchor hasta el centro
        const dGridX = centerTX - ax;
        const dGridY = centerTY - ay;
        
        // Offset en píxeles
        finalX += (dGridX - dGridY) * (this.tileW / 2);
        finalY += (dGridX + dGridY) * (this.tileH / 2);
        
        zIndex = -9999 + targetY; // Siempre al fondo
        
    } else {
        // --- LÓGICA OBJETOS/PAREDES (Verticales) ---
        // Usamos anchor (0.5, 1.0) en Pixi (pies del objeto).
        
        // Calculamos distancia desde el Anchor(ax,ay) hasta la Esquina Sur(w-1, h-1)
        const dGridX = (w - 1) - ax;
        const dGridY = (h - 1) - ay;
        
        // Aplicamos offset isométrico
        finalX += (dGridX - dGridY) * (this.tileW / 2);
        finalY += (dGridX + dGridY) * (this.tileH / 2);
        
        // CORRECCIÓN FINAL VERTICAL: Alineamos con la punta inferior del rombo
        finalY += this.tileH / 2; 

        // Z-Index basado en la posición Y del tile más "al frente"
        zIndex = (targetY + dGridY) * 10 + (targetX + dGridX) + (spriteData.depth || 0);
    }

    return { x: finalX, y: finalY, zIndex };
  }

  setTileSprite(x, y, spriteData) {
    if (!spriteData || !spriteData.category) return;
    
    const internalCat = this.catMap[spriteData.category] || 'object';
    const cell = this.tiles[y][x];

    if (cell.sprites[internalCat]) {
      this.container.removeChild(cell.sprites[internalCat]);
      cell.sprites[internalCat] = null;
    }
    cell[internalCat] = spriteData;

    const texture = PIXI.Texture.from(spriteData.path);
    const sprite = new PIXI.Sprite(texture);
    
    // Usamos la nueva función centralizada para obtener posición
    const pos = this.getSpriteScreenPosition(x, y, spriteData);
    
    sprite.position.set(pos.x, pos.y);
    sprite.zIndex = pos.zIndex;

    // Configurar Anchor de Pixi
    if (internalCat === 'floor') {
        sprite.anchor.set(0.5, 0.5);
    } else {
        sprite.anchor.set(0.5, 1.0);
    }

    cell.sprites[internalCat] = sprite;
    this.container.addChild(sprite);

    if (this.innerGraphics && this.innerGraphics.visible) {
      this.debugDrawAnchor(pos.x, pos.y, sprite);
    }
  }

  clearTile(x, y, category) {
    const internalCat = this.catMap[category] || category;
    const cell = this.tiles[y][x];
    if (cell && cell.sprites[internalCat]) {
      this.container.removeChild(cell.sprites[internalCat]);
      cell.sprites[internalCat] = null;
      cell[internalCat] = null;
    }
  }

  debugDrawAnchor(x, y, sprite) {
    const g = new PIXI.Graphics();
    
    // Solo dibujamos el punto verde
    g.beginFill(0x00FF00);
    g.drawCircle(0,0, 3); // Un poco más visible (radio 3)
    g.endFill();
    
    g.position.set(x,y);

    this.debugContainer.addChild(g);
    setTimeout(() => { 
        if(!this.debugContainer.destroyed) { 
            g.clear(); g.destroy(); this.debugContainer.removeChild(g);
        } 
    }, 2000);
  }

  drawDebugGrid() {
    this.innerGraphics = new PIXI.Graphics();
    this.innerGraphics.lineStyle(1, 0xFFFFFF, 0.1);
    
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const p = this.tileToScreen(x, y);
        this.innerGraphics.moveTo(p.x, p.y - this.tileH / 2);
        this.innerGraphics.lineTo(p.x + this.tileW / 2, p.y);
        this.innerGraphics.lineTo(p.x, p.y + this.tileH / 2);
        this.innerGraphics.lineTo(p.x - this.tileW / 2, p.y);
        this.innerGraphics.closePath();
      }
    }
    this.innerGraphics.zIndex = -1000;
    this.container.addChild(this.innerGraphics);
    this.innerGraphics.visible = false;

    this.borderGraphics = new PIXI.Graphics();
    this.borderGraphics.lineStyle(2, 0xFFFFFF, 0.3);
    const pTop = this.tileToScreen(0,0);
    const pRight = this.tileToScreen(this.cols-1, 0);
    const pBottom = this.tileToScreen(this.cols-1, this.rows-1);
    const pLeft = this.tileToScreen(0, this.rows-1);

    this.borderGraphics.moveTo(pTop.x, pTop.y - this.tileH/2);
    this.borderGraphics.lineTo(pRight.x + this.tileW/2, pRight.y);
    this.borderGraphics.lineTo(pBottom.x, pBottom.y + this.tileH/2);
    this.borderGraphics.lineTo(pLeft.x - this.tileW/2, pLeft.y);
    this.borderGraphics.closePath();
    this.borderGraphics.zIndex = -999;
    this.container.addChild(this.borderGraphics);
  }
}