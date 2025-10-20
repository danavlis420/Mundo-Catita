import { CONFIG } from './config.js';

export class Grid {
  constructor(cols = CONFIG.cols, rows = CONFIG.rows, tileW = CONFIG.tileWidth, tileH = CONFIG.tileHeight) {
    this.cols = cols;
    this.rows = rows;
    this.tileW = tileW;
    this.tileH = tileH;
    this.tiles = Array.from({ length: rows }, () => Array(cols).fill(null));
  }

  tileToScreen(x, y) {
    return { x: (x - y) * (this.tileW / 2), y: (x + y) * (this.tileH / 2) };
  }

  screenToTile(sx, sy) {
    const x = (sx / (this.tileW/2) + sy/(this.tileH/2)) / 2;
    const y = (sy/(this.tileH/2) - sx/(this.tileW/2)) / 2;
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return null;
    return { x: tx, y: ty };
  }

  setTileSprite(x, y, sprite) {
    this.tiles[y][x] = sprite;
  }

  clearTile(x, y) {
    this.tiles[y][x] = null;
  }

  draw(ctx, camera) {
    ctx.save();
    ctx.translate(ctx.canvas.width / 2 - camera.x, ctx.canvas.height / 4 - camera.y);

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const p = this.tileToScreen(x, y);
        const tile = this.tiles[y][x];
        if (!tile) {
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + this.tileW/2, p.y + this.tileH/2);
          ctx.lineTo(p.x, p.y + this.tileH);
          ctx.lineTo(p.x - this.tileW/2, p.y + this.tileH/2);
          ctx.closePath();
          ctx.stroke();
        } else if (tile.img && tile.loaded) {
          ctx.drawImage(tile.img, p.x - this.tileW/2, p.y, this.tileW * tile.width, this.tileH * tile.height);
        } else if (tile.name === 'sueloBase') {
          ctx.fillStyle = 'white';
          ctx.fillRect(p.x - this.tileW/2, p.y, this.tileW, this.tileH);
        } else if (tile.name === 'paredBase') {
          ctx.fillStyle = 'gray';
          ctx.fillRect(p.x - this.tileW/2, p.y - this.tileH*2, this.tileW, this.tileH*3);
        }
      }
    }

    ctx.restore();
  }
}
