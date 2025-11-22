// scripts/config.js
export const CONFIG = {
  cols: 30,
  rows: 30,
  tileWidth: 64,
  tileHeight: 32,
  scale: 1.0,
  backgroundColor: '#2b3440',
  playerSpritePath: 'assets/sprites/player.png',
  initialPlayer: { x: 10, y: 10 },
  cameraLag: 0.12,
  playerSpeed: 5,
  snapSpeed: 10,
  
  // --- NUEVA CONFIGURACIÓN DE ZOOM ---
  zoomStep: 0.25,    // Cuánto aumenta/disminuye la escala por paso (25%)
  maxZoomSteps: 3    // Cuántos pasos hacia arriba/abajo permitimos
};

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }