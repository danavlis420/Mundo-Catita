// scripts/Player.js
import { CONFIG, clamp, lerp } from './config.js';

export class Player {
  constructor(grid) {
    this.grid = grid;
    this.x = CONFIG.initialPlayer.x;
    this.y = CONFIG.initialPlayer.y;
    this.keys = {};
    this.sprite = new Image();
    this.sprite.src = CONFIG.playerSpritePath;
    this.spriteLoaded = false;
    this.sprite.onload = () => this.spriteLoaded = true;
  }

  handleKeyDown(key) { this.keys[key.toLowerCase()] = true; }
  handleKeyUp(key) { this.keys[key.toLowerCase()] = false; }

  update(dt) {
    let dx = 0, dy = 0;
    if (this.keys['arrowup'] || this.keys['w']) { dx -= 1; dy -= 1; }
    if (this.keys['arrowdown'] || this.keys['s']) { dx += 1; dy += 1; }
    if (this.keys['arrowleft'] || this.keys['a']) { dx -= 1; dy += 1; }
    if (this.keys['arrowright'] || this.keys['d']) { dx += 1; dy -= 1; }

    if (dx !== 0 && dy !== 0) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }

    this.x += dx * CONFIG.playerSpeed * dt;
    this.y += dy * CONFIG.playerSpeed * dt;

    this.x = clamp(this.x, 0, CONFIG.cols - 1);
    this.y = clamp(this.y, 0, CONFIG.rows - 1);

    if (dx === 0 && dy === 0) {
      this.x = lerp(this.x, Math.round(this.x), CONFIG.snapSpeed * dt);
      this.y = lerp(this.y, Math.round(this.y), CONFIG.snapSpeed * dt);
    }
  }

  draw(ctx, grid, camera) {
    const p = grid.tileToScreen(this.x, this.y);
    ctx.save();
    
    // CORRECCIÓN: Coincidir con grid.js (canvas.height / 2)
    ctx.translate(
        ctx.canvas.width / 2 - camera.x, 
        ctx.canvas.height / 2 - camera.y
    );
    
    ctx.scale(CONFIG.scale, CONFIG.scale);

    if (this.spriteLoaded) {
      const px = p.x - this.sprite.width / 2;
      const py = p.y - this.sprite.height + grid.tileH / 2;
      ctx.drawImage(this.sprite, px, py);
    } else {
      ctx.fillStyle = '#ff6';
      ctx.beginPath();
      ctx.arc(p.x, p.y - 20, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}