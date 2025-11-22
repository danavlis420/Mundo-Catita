// scripts/input.js
export function initInput(player, camera, hud) {
  // Movimiento
  window.addEventListener('keydown', (e) => {
    player.handleKeyDown(e.key);
    
    // TECLA R: REESTABLECER CÁMARA
    if (e.key.toLowerCase() === 'r') {
      console.log("🔄 Reset: Zoom 0, Centrar y Bloquear.");
      
      // 1. Resetear variables de cámara (Zoom y activar forceSnap)
      camera.reset(); 
      
      // 2. Forzar bloqueo en el HUD si estaba desbloqueado
      // (Si ya estaba bloqueado, no hacemos nada para no desbloquearlo)
      if (!hud.isCameraLocked()) {
        hud.toggleCameraLock(); 
      }
    }
  });

  window.addEventListener('keyup', (e) => player.handleKeyUp(e.key));
}