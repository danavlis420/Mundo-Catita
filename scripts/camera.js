import { lerp } from './config.js';

export class Camera {
  constructor(player, offsetX=0, offsetY=0) {
    this.player = player;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.dragging = false;
    this.dragStart = {x:0, y:0};
    this.startPos = {x:0, y:0};
  }

  startDrag(x, y) {
    this.dragging = true;
    this.dragStart = {x, y};
    this.startPos = {x: this.x, y: this.y};
  }

  drag(x, y) {
    if (!this.dragging) return;
    const dx = x - this.dragStart.x;
    const dy = y - this.dragStart.y;
    this.x = this.startPos.x - dx;
    this.y = this.startPos.y - dy;
  }

  endDrag() {
    this.dragging = false;
  }

  update(dt, grid, cameraLag, isLocked=true) {
    // Solo seguimos al jugador si está bloqueada o no estamos arrastrando
    if (!this.dragging || isLocked) {
      const p = grid.tileToScreen(this.player.x, this.player.y);
      this.targetX = p.x + this.offsetX;
      this.targetY = p.y + this.offsetY;
      this.x = lerp(this.x, this.targetX, cameraLag);
      this.y = lerp(this.y, this.targetY, cameraLag);
    }
  }
}
