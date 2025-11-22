// scripts/player.js
import { CONFIG, clamp, lerp } from './config.js';

export class Player {
  constructor(grid, container) {
    this.grid = grid;
    this.x = CONFIG.initialPlayer.x;
    this.y = CONFIG.initialPlayer.y;
    
    this.keys = {}; // Estado de teclas
    
    // CREAR SPRITE
    this.sprite = PIXI.Sprite.from(CONFIG.playerSpritePath);
    this.sprite.anchor.set(0.5, 1.0); // Pies en el suelo
    
    // Manejo de error si el sprite del jugador no carga
    this.sprite.texture.baseTexture.on('error', () => {
        console.error(`❌ Error cargando sprite del jugador: ${CONFIG.playerSpritePath}`);
    });

    container.addChild(this.sprite);

    // NOTA: Hemos quitado los window.addEventListener de aquí
    // porque input.js ya se encarga de llamar a handleKeyDown/Up
  }

  // --- ESTAS SON LAS FUNCIONES QUE FALTABAN ---
  handleKeyDown(key) { 
    this.keys[key.toLowerCase()] = true; 
  }
  
  handleKeyUp(key) { 
    this.keys[key.toLowerCase()] = false; 
  }

  update(dt) {
    let dx = 0, dy = 0;
    // Usamos this.keys que ahora sí se actualiza vía input.js
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

    // Render Pixi
    const p = this.grid.tileToScreen(this.x, this.y);
    this.sprite.x = p.x;
    this.sprite.y = p.y + (this.grid.tileH / 2);
    this.sprite.zIndex = this.sprite.y; 
  }
}