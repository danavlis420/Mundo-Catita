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

    // Separamos los gráficos
    this.innerGraphics = null;  // Las líneas de los casilleros
    this.borderGraphics = null; // El recuadro exterior
    
    this.drawDebugGrid();
  }

  // --- TOGGLE ---
  // Retorna el nuevo estado (true/false) para sincronizar con FPS
  toggleGrid() {
    if (this.innerGraphics) {
      this.innerGraphics.visible = !this.innerGraphics.visible;
      return this.innerGraphics.visible;
    }
    return false;
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

    const isFloor = (cat === 'floor');
    const anchorY = isFloor ? 0.5 : 1.0;
    
    sprite.anchor.set(0.5, anchorY);
    sprite.x = p.x;
    sprite.y = p.y + (this.tileH / 2);
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
    // 1. Grilla Interna (Casilleros)
    this.innerGraphics = new PIXI.Graphics();
    this.innerGraphics.lineStyle(1, 0xFFFFFF, 0.05); // Muy sutil
    
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const p = this.tileToScreen(x, y);
        this.innerGraphics.moveTo(p.x, p.y);
        this.innerGraphics.lineTo(p.x + this.tileW / 2, p.y + this.tileH / 2);
        this.innerGraphics.lineTo(p.x, p.y + this.tileH);
        this.innerGraphics.lineTo(p.x - this.tileW / 2, p.y + this.tileH / 2);
        this.innerGraphics.closePath();
      }
    }
    this.innerGraphics.zIndex = -1000;
    this.container.addChild(this.innerGraphics);
    this.innerGraphics.visible = false;

    // 2. Borde Exterior (Límites) - Siempre Visible
    this.borderGraphics = new PIXI.Graphics();
    this.borderGraphics.lineStyle(1, 0xFFFFFF, 0.05); // Más grueso y visible
    
    // Calculamos las 4 esquinas del rombo gigante
    const top = this.tileToScreen(0, 0);
    const right = this.tileToScreen(this.cols, 0);
    const bottom = this.tileToScreen(this.cols, this.rows);
    const left = this.tileToScreen(0, this.rows);

    this.borderGraphics.moveTo(top.x, top.y);
    this.borderGraphics.lineTo(right.x, right.y + (this.tileH/2)); // Ajuste visual vértice
    // Nota: tileToScreen devuelve la esquina superior del tile. 
    // Para el borde exterior perfecto, trazamos de vértice a vértice.
    
    // Redibujamos usando vértices limpios para el contorno total:
    this.borderGraphics.clear();
    this.borderGraphics.lineStyle(1, 0xFFFFFF, 0.05);
    
    // Vértice Superior (0,0)
    const vTop = this.tileToScreen(0,0); 
    // Vértice Derecho (cols, 0) -> La X crece hacia la derecha-abajo en iso
    // Ajuste: tileToScreen da el top-left del rombo.
    // El extremo derecho del mapa es tileToScreen(cols-1, 0) + mitad ancho.
    // Simplificación: Dibujamos un path conectando los extremos exteriores.
    
    const pTop = { x: vTop.x, y: vTop.y }; // 0,0
    const pRight = this.tileToScreen(this.cols, 0); // Fuera del array, marca el límite
    const pBottom = this.tileToScreen(this.cols, this.rows);
    const pLeft = this.tileToScreen(0, this.rows);

    // Dibujamos el contorno
    this.borderGraphics.moveTo(pTop.x, pTop.y);
    this.borderGraphics.lineTo(pRight.x, pRight.y);
    this.borderGraphics.lineTo(pBottom.x, pBottom.y);
    this.borderGraphics.lineTo(pLeft.x, pLeft.y);
    this.borderGraphics.closePath();

    this.borderGraphics.zIndex = -999; // Apenas encima de la grilla interna
    this.container.addChild(this.borderGraphics);
  }
}