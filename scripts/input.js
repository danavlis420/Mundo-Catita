// scripts/input.js

export function initInput(player, camera, hud, grid, fpsText) {
  
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return; 
    
    player.handleKeyDown(e.key);
    
    const k = e.key.toLowerCase();

    // R: Lógica de Reset Inteligente
    if (k === 'r') {
      if (!hud.isCameraLocked()) {
        // 1. Si la cámara estaba libre, la bloqueamos al personaje
        hud.toggleCameraLock();
      } else {
        // 2. NUEVO: Si ya estaba bloqueada, reseteamos el Zoom (Nivel 0)
        camera.reset();
      }
    }

    // G: Toggle Grilla Interna y FPS
    if (k === 'g') {
      const isGridVisible = grid.toggleGrid(); 
      if (fpsText) {
        fpsText.visible = isGridVisible;
      }
    }
  });

  window.addEventListener('keyup', (e) => player.handleKeyUp(e.key));
}