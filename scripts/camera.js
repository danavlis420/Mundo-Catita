// scripts/camera.js
import { lerp, clamp, CONFIG } from './config.js';

export class Camera {
  constructor(player, offsetX = 0, offsetY = 0) {
    this.player = player;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;

    // Zoom
    this.zoomLevel = 0; 
    this.currentScale = 1.0; 

    // Estados
    this.dragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.startPos = { x: 0, y: 0 };
    
    // NUEVO: Bandera para forzar centrado inmediato
    this.forceSnap = false;
  }

  changeZoom(direction) {
    this.zoomLevel += direction;
    this.zoomLevel = clamp(this.zoomLevel, -CONFIG.maxZoomSteps, CONFIG.maxZoomSteps);
    this.currentScale = 1.0 + (this.zoomLevel * CONFIG.zoomStep);
  }

  // RESET TOTAL (Llamado por Tecla R)
  reset() {
    this.zoomLevel = 0;
    this.currentScale = 1.0;
    this.dragging = false;
    
    // Activamos la bandera: "En el próximo frame, ignora el suavizado y vete directo al jugador"
    this.forceSnap = true;
  }

  startDrag(x, y) {
    this.dragging = true;
    this.dragStart = { x, y };
    this.startPos = { x: this.x, y: this.y };
  }

  drag(x, y) {
    if (!this.dragging) return;
    const dx = (x - this.dragStart.x) / this.currentScale;
    const dy = (y - this.dragStart.y) / this.currentScale;
    this.x = this.startPos.x - dx;
    this.y = this.startPos.y - dy;
  }

  endDrag() {
    this.dragging = false;
  }

  update(dt, grid, cameraLag, isLocked) {
    const p = grid.tileToScreen(this.player.x, this.player.y);
    this.targetX = p.x + this.offsetX;
    this.targetY = p.y + this.offsetY;

    // 1. Si estamos arrastrando, ignoramos al jugador
    if (this.dragging) return;

    // 2. Si se pidió un RESET (Tecla R), teletransportamos inmediatamente
    if (this.forceSnap) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.forceSnap = false; // Apagamos la bandera para volver al comportamiento normal
        return;
    }

    // 3. Comportamiento normal (Seguimiento suave)
    if (isLocked) {
      this.x = lerp(this.x, this.targetX, cameraLag);
      this.y = lerp(this.y, this.targetY, cameraLag);
    }
  }
}