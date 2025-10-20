import { CONFIG, lerp } from './config.js';
import { Grid } from './grid.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { initInput } from './input.js';
import { HUD } from './hud.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let DPR = window.devicePixelRatio || 1;

const grid = new Grid();
const player = new Player(grid);
const camera = new Camera(player, 0, -150);
initInput(player);
const hud = new HUD();

const bgImage = new Image();
bgImage.src = 'assets/backgrounds/bg.png';
let bgLoaded = false;
bgImage.onload = () => bgLoaded = true;

function resizeCanvas() {
  DPR = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.style.width = w+'px';
  canvas.style.height = h+'px';
  canvas.width = Math.round(w*DPR);
  canvas.height = Math.round(h*DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);

  const p = grid.tileToScreen(player.x, player.y);
  camera.x = p.x + camera.offsetX;
  camera.y = p.y + camera.offsetY;
}

window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('click', ()=>canvas.focus());
resizeCanvas();

let isMouseDown = false;
let mouseButton = 0;

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left)*(canvas.width/rect.width),
    y: (e.clientY - rect.top)*(canvas.height/rect.height)
  };
}

function handlePaint(pos, button) {
  const tile = grid.screenToTile(pos.x + camera.x - canvas.width/2, pos.y + camera.y - canvas.height/4);
  if (!tile) return;

  if (button===0) {
    const spritePath = hud.getSelectedSprite();
    const spriteData = hud.getSpriteData(spritePath);
    if (spriteData && spriteData.loaded) {
      grid.setTileSprite(tile.x, tile.y, spriteData);
    }
  } else if (button===2) {
    grid.clearTile(tile.x, tile.y);
  }
}

canvas.addEventListener('mousedown', e => {
  const pos = getMousePos(e);
  isMouseDown = true;
  mouseButton = e.button;

  if (hud.isCameraMode()) camera.startDrag(pos.x, pos.y);
  else handlePaint(pos, e.button);
});

canvas.addEventListener('mousemove', e => {
  if (!isMouseDown) return;
  const pos = getMousePos(e);

  if (hud.isCameraMode()) camera.drag(pos.x,pos.y);
  else handlePaint(pos, mouseButton);
});

canvas.addEventListener('mouseup', ()=>{
  isMouseDown = false;
  if (hud.isCameraMode()) camera.endDrag();
});

canvas.addEventListener('mouseleave', ()=>{
  if (isMouseDown){
    isMouseDown = false;
    if (hud.isCameraMode()) camera.endDrag();
  }
});

let lastTime = 0;
function loop(ts){
  const dt = (ts-lastTime)/1000;
  lastTime = ts;

  player.update(dt);
  camera.update(dt, grid, CONFIG.cameraLag, hud.isCameraLocked());

  ctx.fillStyle = CONFIG.backgroundColor;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  if (bgLoaded) ctx.drawImage(bgImage,0,0,canvas.width,canvas.height);

  grid.draw(ctx,camera);
  player.draw(ctx,grid,camera);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
