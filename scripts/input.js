// scripts/input.js
// Recibimos grid y fpsText para controlarlos
export function initInput(player, camera, hud, grid, fpsText) {
  
  window.addEventListener('keydown', (e) => {
    player.handleKeyDown(e.key);
    
    const k = e.key.toLowerCase();

    // R: Reset Cámara
    if (k === 'r') {
      camera.reset(); 
      if (!hud.isCameraLocked()) hud.toggleCameraLock(); 
    }

    // G: Toggle Grilla Interna y FPS
    if (k === 'g') {
      const isGridVisible = grid.toggleGrid(); // Retorna true/false
      if (fpsText) {
        fpsText.visible = isGridVisible;
      }
    }
  });

  window.addEventListener('keyup', (e) => player.handleKeyUp(e.key));
}