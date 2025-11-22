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

  screenToTile(sx, sy) {
    const x = (sx / (this.tileW / 2) + sy / (this.tileH / 2)) / 2;
    const y = (sy / (this.tileH / 2) - sx / (this.tileW / 2)) / 2;
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return null;
    return { x: tx, y: ty };
  }

  setTileSprite(x, y, spriteData) {
    if (!spriteData || !spriteData.category) return;
    const cell = this.tiles[y][x];
    const cat = spriteData.category;

    if (cell.sprites[cat]) this.container.removeChild(cell.sprites[cat]);

    cell[cat] = spriteData;

    const texture = PIXI.Texture.from(spriteData.path);
    const sprite = new PIXI.Sprite(texture);
    const p = this.tileToScreen(x, y);

    // --- CORRECCIÓN DE ANCLAJE DINÁMICO ---
    // Si es piso ('floor'), centramos la imagen en el tile (0.5, 0.5).
    // Si es pared/objeto, lo anclamos a los pies (0.5, 1.0).
    const isFloor = (cat === 'floor');
    const anchorY = isFloor ? 0.5 : 1.0;
    
    sprite.anchor.set(0.5, anchorY);
    
    sprite.x = p.x;
    sprite.y = p.y + (this.tileH / 2);
    
    // Z-Index:
    // Usamos la coordenada Y de pantalla para el ordenamiento básico.
    // Restamos un pequeño valor si es piso para asegurar que quede DEBAJO 
    // de un objeto que esté en el mismo tile.
    sprite.zIndex = sprite.y + (isFloor ? -1 : 1); 

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
    g.lineStyle(1, 0xFFFFFF, 0.3); 
    
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