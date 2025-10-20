// scripts/Config.js
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
  playerSpeed: 5,   // tiles por segundo
  snapSpeed: 10     // velocidad de snap a grilla
};

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
