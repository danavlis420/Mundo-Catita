// scripts/Input.js
export function initInput(player) {
  window.addEventListener('keydown', (e) => player.handleKeyDown(e.key));
  window.addEventListener('keyup', (e) => player.handleKeyUp(e.key));
}
