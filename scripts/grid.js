// scripts/grid.js
import { CONFIG } from './config.js';

export class Grid {
  constructor(cols = CONFIG.cols, rows = CONFIG.rows, sprites = []) {
    this.cols = cols;
    this.rows = rows;
    this.tileW = CONFIG.tileWidth;
    this.tileH = CONFIG.tileHeight;

    this.tiles = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ floor: null, wall: null, object: null }))
    );

    this.spriteMap = {};
    if (Array.isArray(sprites)) {
      sprites.forEach(s => {
        this.spriteMap[s.name] = s;
        const img = new Image();
        img.src = s.path;
        s.img = img;
        s.loaded = false;
        img.onload = () => (s.loaded = true);
      });
    }
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

  setTileSprite(x, y, sprite) {
    if (!sprite || !sprite.category) return;
    this.tiles[y][x][sprite.category] = sprite;
  }

  clearTile(x, y, category = null) {
    if (category) this.tiles[y][x][category] = null;
    else this.tiles[y][x] = { floor: null, wall: null, object: null };
  }

  draw(ctx, camera) {
    ctx.save();

    // CORRECCIÓN CRÍTICA:
    // 1. Eliminado window.devicePixelRatio (ya no es necesario con resolución fija).
    // 2. Cambiado height / 4 a height / 2 para centrado real.
    ctx.translate(
      ctx.canvas.width / 2 - camera.x,
      ctx.canvas.height / 2 - camera.y
    );

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const p = this.tileToScreen(x, y);
        const cell = this.tiles[y][x];

        // Grilla tenue
        if (!cell.floor && !cell.wall && !cell.object) {
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + this.tileW / 2, p.y + this.tileH / 2);
          ctx.lineTo(p.x, p.y + this.tileH);
          ctx.lineTo(p.x - this.tileW / 2, p.y + this.tileH / 2);
          ctx.closePath();
          ctx.stroke();
        }

        ['floor', 'wall', 'object'].forEach(layer => {
          const tile = cell[layer];
          if (tile && tile.img && tile.loaded) {
            this.drawSprite(ctx, tile, p);
          }
        });
      }
    }

    ctx.restore();
  }

  drawSprite(ctx, sprite, tilePos) {
    const width = sprite.width || 1;
    const drawX = tilePos.x - (this.tileW * width) / 2;
    const drawY = tilePos.y - (sprite.img.height - this.tileH); 
    ctx.drawImage(
      sprite.img,
      drawX,
      drawY,
      this.tileW * width,
      sprite.img.height
    );
  }
}