// scripts/grid.js
import { CONFIG } from './config.js';

export class Grid {
  constructor(container, cols = CONFIG.cols, rows = CONFIG.rows) {
    this.container = container;
    this.cols = cols;
    this.rows = rows;
    this.tileW = CONFIG.tileWidth;
    this.tileH = CONFIG.tileHeight;
    
    // Origen del mundo (0,0 de la grilla en píxeles)
    // Ajustar si quieres centrar la grilla en otro punto
    this.worldOriginX = 0; 
    this.worldOriginY = 0;

    this.tiles = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ 
        floor: null, wall: null, object: null,
        sprites: { floor: null, wall: null, object: null } 
      }))
    );

    this.innerGraphics = null;
    this.borderGraphics = null;
    
    // Capa de Debug dedicada para no ensuciar el zIndex del mundo
    this.debugContainer = new PIXI.Container();
    this.debugContainer.zIndex = 999999; // Siempre arriba
    this.container.addChild(this.debugContainer);
    
    this.drawDebugGrid();
  }

  // --- TOGGLE ---
  toggleGrid() {
    if (this.innerGraphics) {
      this.innerGraphics.visible = !this.innerGraphics.visible;
      // Limpiamos debugs de anclas si ocultamos grilla
      if (!this.innerGraphics.visible) this.debugContainer.removeChildren();
      return this.innerGraphics.visible;
    }
    return false;
  }

  /**
   * Convierte coordenadas de Grilla (col, row) a Pantalla (x, y).
   * Retorna el CENTRO de la base del rombo en esa celda.
   */
  tileToScreen(col, row) {
    return {
      x: this.worldOriginX + (col - row) * (this.tileW / 2),
      y: this.worldOriginY + (col + row) * (this.tileH / 2)
    };
  }

  screenToTile(sx, sy) {
    // Ajustamos por el origen del mundo
    const adjX = sx - this.worldOriginX;
    const adjY = sy - this.worldOriginY;

    const col = (adjX / (this.tileW / 2) + adjY / (this.tileH / 2)) / 2;
    const row = (adjY / (this.tileH / 2) - adjX / (this.tileW / 2)) / 2;
    
    const tx = Math.floor(col);
    const ty = Math.floor(row);

    if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return null;
    return { x: tx, y: ty };
  }

  setTileSprite(x, y, spriteData) {
    if (!spriteData || !spriteData.category) return;
    const cell = this.tiles[y][x];
    const cat = spriteData.category;

    // Limpieza previa si ya existe algo en esa categoría
    if (cell.sprites[cat]) {
      this.container.removeChild(cell.sprites[cat]);
      cell.sprites[cat] = null;
    }

    cell[cat] = spriteData;

    // 1. Crear Sprite
    const texture = PIXI.Texture.from(spriteData.path);
    const sprite = new PIXI.Sprite(texture);
    
    // 2. Datos dimensionales (parseados o default)
    const depth = spriteData.depth || 0; // La "Z" del nombre (ej: _3)
    
    // 3. Calcular Posición Base (Centro del rombo en el suelo)
    const p = this.tileToScreen(x, y);
    
    // 4. Calcular Elevación Visual
    // screenY se mueve hacia arriba (negativo) según la profundidad
    const elevationY = depth * CONFIG.zUnit;
    const finalX = p.x;
    const finalY = p.y - elevationY;

    sprite.position.set(finalX, finalY);

    // 5. Configurar Anchor/Pivot (REGLA CRÍTICA)
    // El objetivo es que el pixel correspondiente al "centro de la base" del sprite
    // coincida con sprite.position (que es el centro de la celda).
    
    if (cat === 'floor') {
        // Para suelos planos, el centro de la textura suele ser el centro del rombo.
        sprite.anchor.set(0.5, 0.5);
        // Z-Index: Muy bajo, base del tile
        sprite.zIndex = -9999 + p.y; 
    } else {
        // Para paredes/objetos/Sims (Billboards)
        // Asumimos que el sprite "nace" desde abajo hacia arriba.
        // Anchor X: 0.5 (Centrado horizontalmente)
        // Anchor Y: 1.0 (La base de la imagen toca el centro de la celda)
        
        // TODO: Si tienes sprites con "baseline" (espacio vacío abajo), leerlo aquí.
        // const baselineOffset = spriteData.baseline || 0;
        // sprite.anchor.set(0.5, 1.0); // Ajustaríamos pivot.y si hubiera baseline
        
        sprite.anchor.set(0.5, 1.0);
        
        // Corrección Z-Sorting:
        // Usamos la Y original de la celda (p.y) para el ordenamiento, no la visual (finalY).
        // Esto asegura que un objeto alto en (5,5) tape a uno bajo en (4,4) correctamente.
        // Tie-breaker: (x * 0.001) para evitar parpadeo en misma línea.
        sprite.zIndex = p.y + (x * 0.001) + (y * 0.001);
    }

    cell.sprites[cat] = sprite;
    this.container.addChild(sprite);

    // DEBUG: Si la grilla está activa, dibujamos el punto de anclaje para verificar
    if (this.innerGraphics && this.innerGraphics.visible) {
        this.debugDrawAnchor(finalX, finalY, sprite);
    }
  }

  clearTile(x, y, category) {
    const cell = this.tiles[y][x];
    if (category && cell.sprites[category]) {
      this.container.removeChild(cell.sprites[category]);
      cell.sprites[category] = null;
      cell[category] = null;
    }
  }

  /**
   * Dibuja una cruz en el punto exacto de inserción y un borde alrededor del sprite.
   * Útil para verificar si los sprites están bien recortados o centrados.
   */
  debugDrawAnchor(x, y, sprite) {
    const g = new PIXI.Graphics();
    // Cruz Roja en el Pivot (Donde el motor cree que está el "suelo")
    g.lineStyle(2, 0xFF0000, 1);
    g.moveTo(x - 5, y);
    g.lineTo(x + 5, y);
    g.moveTo(x, y - 5);
    g.lineTo(x, y + 5);

    // Caja Amarilla (Bounds visuales)
    const bounds = sprite.getBounds();
    // Convertimos bounds globales a locales si fuera necesario, pero aquí es solo visual
    // Usamos coordenadas locales relativas al container de debug que está en (0,0)
    // Como debugContainer es hijo de worldContainer, comparte transform. 
    // Simplemente dibujamos relativo a la posición dada.
    
    // Nota: getBounds devuelve coordenadas globales. Para dibujar dentro del worldContainer
    // necesitamos locales. Simplificación para debug rápido:
    g.lineStyle(1, 0xFFFF00, 0.5);
    g.drawRect(
        sprite.x - (sprite.width * sprite.anchor.x), 
        sprite.y - (sprite.height * sprite.anchor.y), 
        sprite.width, 
        sprite.height
    );

    this.debugContainer.addChild(g);
    
    // Auto-borrado rápido para no saturar memoria en debug
    setTimeout(() => {
        if (!this.debugContainer.destroyed) {
             this.debugContainer.removeChild(g);
             g.destroy();
        }
    }, 2000); 
  }

  drawDebugGrid() {
    // 1. Grilla Interna (Casilleros)
    this.innerGraphics = new PIXI.Graphics();
    this.innerGraphics.lineStyle(1, 0xFFFFFF, 0.1);
    
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const p = this.tileToScreen(x, y);
        
        // Dibujamos el rombo desde el centro hacia las esquinas
        this.innerGraphics.moveTo(p.x, p.y - this.tileH / 2); // Norte
        this.innerGraphics.lineTo(p.x + this.tileW / 2, p.y); // Este
        this.innerGraphics.lineTo(p.x, p.y + this.tileH / 2); // Sur
        this.innerGraphics.lineTo(p.x - this.tileW / 2, p.y); // Oeste
        this.innerGraphics.closePath();
      }
    }
    this.innerGraphics.zIndex = -1000;
    this.container.addChild(this.innerGraphics);
    this.innerGraphics.visible = false;

    // 2. Borde Exterior
    this.borderGraphics = new PIXI.Graphics();
    this.borderGraphics.lineStyle(2, 0xFFFFFF, 0.3);
    
    // Vértices extremos del mapa completo
    const top = this.tileToScreen(0, 0); // Centro del primer tile (0,0)
    // El mapa isométrico rota.
    // Top: (0,0) -> screenY min
    // Right: (cols-1, 0)
    // Bottom: (cols-1, rows-1)
    // Left: (0, rows-1)
    
    // Ajuste visual: tileToScreen da el CENTRO del tile. El borde debe ir por fuera.
    // Sumamos vectores direccionales (mitad de ancho/alto).
    
    const pTop = this.tileToScreen(0,0);
    const pRight = this.tileToScreen(this.cols-1, 0);
    const pBottom = this.tileToScreen(this.cols-1, this.rows-1);
    const pLeft = this.tileToScreen(0, this.rows-1);

    // Movemos los puntos a los vértices externos de los rombos
    this.borderGraphics.moveTo(pTop.x, pTop.y - this.tileH/2);
    this.borderGraphics.lineTo(pRight.x + this.tileW/2, pRight.y);
    this.borderGraphics.lineTo(pBottom.x, pBottom.y + this.tileH/2);
    this.borderGraphics.lineTo(pLeft.x - this.tileW/2, pLeft.y);
    this.borderGraphics.closePath();

    this.borderGraphics.zIndex = -999;
    this.container.addChild(this.borderGraphics);
  }
}