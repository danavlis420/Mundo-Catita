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

    // NUEVA ESTRUCTURA: Cada celda tiene un array de 4 capas
    // layers[0]..layers[3] contienen los datos del sprite o null
    this.tiles = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ 
        layers: [null, null, null, null],
        sprites: [null, null, null, null] // Referencias a objetos PIXI para acceso rápido
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
   * Obtiene posición visual ajustada.
   * AHORA INCLUYE LÓGICA DE CAPAS PARA Z-INDEX
   */
  getSpriteScreenPosition(targetX, targetY, spriteData, layerIndex = 0) {
    const ax = spriteData.anchor ? spriteData.anchor.x : 0;
    const ay = spriteData.anchor ? spriteData.anchor.y : 0;
    const w = spriteData.width || 1;
    const h = spriteData.height || 1;
    
    const p = this.tileToScreen(targetX, targetY);
    const internalCat = this.catMap[spriteData.category] || 'object';
    const isFloor = (internalCat === 'floor');
    
    let finalX = p.x;
    let finalY = p.y;
    
    // Base Z-Index calculado por posición isométrica
    // (targetY + dGridY) asegura que objetos "mas abajo" en pantalla pinten después.
    // Multiplicador 10 da espacio.
    // Sumar layerIndex * 2 asegura que en la MISMA fila, Layer 1 pinte sobre Layer 0.
    
    let zIndexBase = 0;

    if (isFloor) {
        const centerTX = (w - 1) / 2;
        const centerTY = (h - 1) / 2;
        const dGridX = centerTX - ax;
        const dGridY = centerTY - ay;
        
        finalX += (dGridX - dGridY) * (this.tileW / 2);
        finalY += (dGridX + dGridY) * (this.tileH / 2);
        
        // Los pisos siempre al fondo, pero ordenados por capa
        zIndexBase = -90000 + (targetY * 10) + (layerIndex * 2);

    } else {
        const dGridX = (w - 1) - ax;
        const dGridY = (h - 1) - ay;
        
        finalX += (dGridX - dGridY) * (this.tileW / 2);
        finalY += (dGridX + dGridY) * (this.tileH / 2);
        finalY += this.tileH / 2; 

        // Objetos y paredes
        // La "profundidad isométrica" viene de Y + X (en diagonal)
        // Usamos una fórmula robusta para isometric sorting
        zIndexBase = (targetY + dGridY) * 100 + (targetX + dGridX) + (layerIndex * 5) + (spriteData.depth || 0);
    }

    return { x: finalX, y: finalY, zIndex: zIndexBase };
  }

  /**
   * NUEVO: Añadir tile a una capa específica
   */
  setTileSprite(x, y, spriteData, layer = 0) {
    if (!spriteData || x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    if (layer < 0 || layer > 3) return;

    const cell = this.tiles[y][x];

    // Limpiar si ya existe algo en esa capa
    if (cell.sprites[layer]) {
      this.removeTileFromLayer(x, y, layer);
    }

    // Guardar datos lógicos
    cell.layers[layer] = spriteData;

    // Crear Sprite
    const texture = PIXI.Texture.from(spriteData.path);
    const sprite = new PIXI.Sprite(texture);
    
    // Calcular posición usando la capa
    const pos = this.getSpriteScreenPosition(x, y, spriteData, layer);
    
    sprite.position.set(pos.x, pos.y);
    sprite.zIndex = pos.zIndex;

    const internalCat = this.catMap[spriteData.category] || 'object';
    if (internalCat === 'floor') {
        sprite.anchor.set(0.5, 0.5);
    } else {
        sprite.anchor.set(0.5, 1.0);
    }

    // METADATOS PARA EL SISTEMA DE BORRADO Y HOVER
    sprite.gridLocation = { x, y, layer };
    sprite.isInteractiveTile = true; 

    cell.sprites[layer] = sprite;
    this.container.addChild(sprite);

    // Debug opcional
    if (this.innerGraphics && this.innerGraphics.visible) {
      this.debugDrawAnchor(pos.x, pos.y);
    }
  }

  /**
   * NUEVO: Borrar tile de una capa específica
   */
  removeTileFromLayer(x, y, layer) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    const cell = this.tiles[y][x];

    if (cell.sprites[layer]) {
        const spr = cell.sprites[layer];
        if (spr.parent) spr.parent.removeChild(spr);
        spr.destroy();
        cell.sprites[layer] = null;
        cell.layers[layer] = null;
    }
  }

  /**
   * Método legacy wrapper (opcional, para compatibilidad si algo llama a clearTile viejo)
   */
  clearTile(x, y, layerOrCat) {
     // Si pasan numero es layer, si pasan string intentamos deducir (fallback)
     let layer = typeof layerOrCat === 'number' ? layerOrCat : 0; 
     this.removeTileFromLayer(x, y, layer);
  }

  getTileDataAt(x, y, layer) {
      if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return null;
      return this.tiles[y][x].layers[layer];
  }

  debugDrawAnchor(x, y) {
    const g = new PIXI.Graphics();
    g.beginFill(0x00FF00);
    g.drawCircle(0,0, 3); 
    g.endFill();
    g.position.set(x,y);
    this.debugContainer.addChild(g);
    setTimeout(() => { if(!this.debugContainer.destroyed) g.destroy(); }, 2000);
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