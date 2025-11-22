// scripts/grid.js
import { CONFIG } from './config.js';

export class Grid {
  constructor(container, cols = CONFIG.cols, rows = CONFIG.rows) {
    this.container = container;
    this.cols = cols;
    this.rows = rows;
    this.tileW = CONFIG.tileWidth;
    this.tileH = CONFIG.tileHeight;

    this.tiles = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ 
        floor: null, wall: null, object: null,
        sprites: { floor: null, wall: null, object: null } 
      }))
    );

    this.drawDebugGrid();
  }

  tileToScreen(x, y) {
    return {
      x: (x - y) * (this.tileW / 2),
      y: (x + y) * (this.tileH / 2)
    };
  }

  // --- CORRECCIÓN MATEMÁTICA AQUÍ ---
  screenToTile(sx, sy) {
    // 1. Eliminamos 'adjY'. Usamos la coordenada cruda 'sy'.
    // 2. Fórmula de inversión isométrica estándar.
    const x = (sx / (this.tileW / 2) + sy / (this.tileH / 2)) / 2;
    const y = (sy / (this.tileH / 2) - sx / (this.tileW / 2)) / 2;
    
    // 3. Usamos Math.floor puro (sin +0.5) para detectar el volumen del tile, no el vértice.
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    
    if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return null;
    return { x: tx, y: ty };
  }

  setTileSprite(x, y, spriteData) {
    if (!spriteData || !spriteData.category) return;
    const cell = this.tiles[y][x];
    const cat = spriteData.category;

    if (cell.sprites[cat]) {
      this.container.removeChild(cell.sprites[cat]);
    }

    cell[cat] = spriteData;

    const texture = PIXI.Texture.from(spriteData.path);
    const sprite = new PIXI.Sprite(texture);

    const p = this.tileToScreen(x, y);
    
    // ANCLAJE:
    // (0.5, 1.0) pone los "pies" del sprite en la coordenada Y dada.
    // Sumamos (this.tileH / 2) para que los pies pisen el CENTRO del rombo, no el vértice superior.
    sprite.anchor.set(0.5, 1.0);
    sprite.x = p.x;
    sprite.y = p.y + (this.tileH / 2);
    
    // Profundidad Z basada en Y
    sprite.zIndex = sprite.y; 

    cell.sprites[cat] = sprite;
    this.container.addChild(sprite);
  }

  clearTile(x, y, category) {
    const cell = this.tiles[y][x];
    if (category && cell.sprites[category]) {
      this.container.removeChild(cell.sprites[category]);
      cell.sprites[category] = null;
      cell[category] = null;
    }
  }

  drawDebugGrid() {
    const g = new PIXI.Graphics();
    g.lineStyle(1, 0xFFFFFF, 0.15); 
    
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const p = this.tileToScreen(x, y);
        g.moveTo(p.x, p.y);
        g.lineTo(p.x + this.tileW / 2, p.y + this.tileH / 2);
        g.lineTo(p.x, p.y + this.tileH);
        g.lineTo(p.x - this.tileW / 2, p.y + this.tileH / 2);
        g.closePath();
      }
    }
    
    g.zIndex = -1000; 
    this.container.addChild(g);
  }
}