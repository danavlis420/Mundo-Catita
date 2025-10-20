// scripts/main.js
import { CONFIG, lerp } from './config.js';
import { Grid } from './grid.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { initInput } from './input.js';
import { HUD } from './hud.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let DPR = window.devicePixelRatio || 1;

// --- Instancias ---
const grid = new Grid();
const player = new Player(grid);
const camera = new Camera(player, 0, -150);
initInput(player);
const hud = new HUD();

// --- Imagen de fondo ---
const bgImage = new Image();
bgImage.src = 'assets/backgrounds/bg.png';
let bgLoaded = false;
bgImage.onload = () => bgLoaded = true;

// --- Resize canvas ---
function resizeCanvas() {
    DPR = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const p = grid.tileToScreen(player.x, player.y);
    camera.x = p.x + camera.offsetX;
    camera.y = p.y + camera.offsetY;
}
window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('click', () => canvas.focus());
resizeCanvas();

// --- Desactivar menú contextual ---
canvas.addEventListener('contextmenu', e => e.preventDefault());

// --- Drag y pintado ---
let isMouseDown = false;
let mouseButton = 0;
let mousePos = null;

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

// --- Helper: tile de base bajo el cursor ---
function getBaseTileUnderCursor(pos) {
    const baseTile = grid.screenToTile(
        pos.x + camera.x - canvas.width / 2,
        pos.y + camera.y - canvas.height / 4
    );
    if (!baseTile) return null;
    return { x: baseTile.x, y: baseTile.y };
}

// --- Helper: posición de dibujado considerando altura del sprite ---
function getDrawPosition(baseTile, sprite) {
    const pos = grid.tileToScreen(baseTile.x, baseTile.y);
    const drawX = pos.x - (grid.tileW * sprite.width) / 2;
    const drawY = pos.y - grid.tileH * (sprite.height - 1); // base sobre el tile
    return { x: drawX, y: drawY };
}

// --- Colocar o borrar sprite ---
function handlePaint(pos, button) {
    const spritePath = hud.getSelectedSprite();
    const spriteData = hud.getSpriteData(spritePath);
    if (!spriteData || !spriteData.loaded) return;

    const baseTile = getBaseTileUnderCursor(pos);
    if (!baseTile) return;

    if (button === 0) {
        grid.setTileSprite(baseTile.x, baseTile.y, spriteData, spriteData.layer);
    } else if (button === 2) {
        grid.clearTile(baseTile.x, baseTile.y, spriteData.layer);
    }
}

canvas.addEventListener('mousedown', (e) => {
    mousePos = getMousePos(e);
    isMouseDown = true;
    mouseButton = e.button;

    if (hud.isCameraMode()) {
        camera.startDrag(mousePos.x, mousePos.y);
    } else {
        handlePaint(mousePos, e.button);
    }
});

canvas.addEventListener('mousemove', (e) => {
    mousePos = getMousePos(e);

    if (!isMouseDown) return;

    if (hud.isCameraMode()) camera.drag(mousePos.x, mousePos.y);
    else handlePaint(mousePos, mouseButton);
});

canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
    if (hud.isCameraMode()) camera.endDrag();
});
canvas.addEventListener('mouseleave', () => {
    if (isMouseDown) {
        isMouseDown = false;
        if (hud.isCameraMode()) camera.endDrag();
    }
});

// --- Loop principal ---
let lastTime = 0;
function loop(ts) {
    const dt = (ts - lastTime) / 1000;
    lastTime = ts;

    camera.update(dt, grid, CONFIG.cameraLag, hud.isCameraLocked());
    player.update(dt);

    ctx.fillStyle = CONFIG.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (bgLoaded) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    grid.draw(ctx, camera);

    // --- Preview transparente del sprite seleccionado ---
    if (hud.mode === 'sprite' && hud.getSelectedSprite() && mousePos) {
        const spriteData = hud.getSpriteData(hud.getSelectedSprite());
        if (spriteData && spriteData.loaded) {
            const baseTile = getBaseTileUnderCursor(mousePos);
            if (baseTile) {
                // Calculamos la posición en pantalla como en Grid.draw
                const p = grid.tileToScreen(baseTile.x, baseTile.y);
                const drawX = p.x - grid.tileW / 2; // centrado horizontal
                const drawY = p.y - grid.tileH * (spriteData.height - 1); // base en el tile

                ctx.save();
                ctx.translate(ctx.canvas.width / 2 - camera.x, ctx.canvas.height / 4 - camera.y);
                ctx.globalAlpha = 0.5;
                ctx.drawImage(spriteData.img, drawX, drawY, grid.tileW * spriteData.width, grid.tileH * spriteData.height);
                ctx.restore();
            }
        }
    }

    player.draw(ctx, grid, camera);

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
