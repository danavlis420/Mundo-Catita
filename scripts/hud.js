// scripts/hud.js
export class HUD {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;

    // Estado general
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1.0;
    this.maxHeightRatio = 0.25;

    // Fondo e interfaz
    this.backgroundPath = 'data/hud/hud_bg.png';
    this.bgImg = new Image();
    this.bgLoaded = false;
    this.bgImg.onload = () => (this.bgLoaded = true);
    this.bgImg.src = this.backgroundPath;

    // Botones y sprites
    this.buttons = [];
    this.sprites = {};
    this.selectedSprite = null;

    // Controles de modo
    this.mode = 'camera';
    this.cameraLocked = true;
    this.selectedCategory = 'floor';

    // Entrada del mouse
    this.mouse = { x: 0, y: 0, pressed: false };
    this.tooltip = null;

    // Cargar sprites externos
    this.loadSpritesJSON();

    // Eventos
    canvas.addEventListener('mousemove', e => this.onMouseMove(e));
    canvas.addEventListener('mousedown', e => this.onMouseDown(e));
    canvas.addEventListener('mouseup', () => (this.mouse.pressed = false));
    canvas.addEventListener('mouseleave', () => this.onMouseLeave()); // 🧩 nuevo evento

    // Tooltip HTML estilizable por CSS
    this.htmlTooltip = document.createElement('div');
    this.htmlTooltip.className = 'hud-tooltip';
    this.htmlTooltip.style.position = 'fixed';
    this.htmlTooltip.style.display = 'none';
    this.htmlTooltip.style.pointerEvents = 'none';
    document.body.appendChild(this.htmlTooltip);
  }

  // ------------------------------------------------------------
  // Escalado y offset
  // ------------------------------------------------------------
  setOffset(x, y) {
    this.offsetX = x;
    this.offsetY = y;
  }

  setScale(s) {
    this.scale = s;
  }

  // ------------------------------------------------------------
  // Modo y visibilidad
  // ------------------------------------------------------------
  setMode(mode) {
    this.mode = mode;
  }

  toggleMode() {
    this.mode = this.mode === 'camera' ? 'sprite' : 'camera';
  }

  isCameraMode() {
    return this.mode === 'camera';
  }

  isCameraLocked() {
    return this.cameraLocked;
  }

  getSelectedSprite() {
    return this.selectedSprite;
  }

  // ------------------------------------------------------------
  // Botones
  // ------------------------------------------------------------
  addButton({
    id, x = 0, y = 0,
    image,
    imageHover,
    toggle = false,
    toggleImg = null,
    tooltip = '',
    action = null,
    scale = 1.0,
    pressable = true
  }) {
    const img = new Image();
    const btn = {
      id: id || `btn_${this.buttons.length}`,
      x, y, scale,
      image, imageHover,
      toggle, toggleImg,
      tooltip,
      pressable,
      active: false,
      action,
      img,
      hover: false,
      loaded: false
    };
    img.onload = () => (btn.loaded = true);
    img.src = image;
    this.buttons.push(btn);
  }

  // ------------------------------------------------------------
  // Sprites
  // ------------------------------------------------------------
  loadSpritesJSON() {
    fetch('data/sprites.json')
      .then(res => res.json())
      .then(data => {
        data.forEach(obj => {
          const img = new Image();
          const spriteObj = {
            img,
            loaded: false,
            width: obj.width,
            height: obj.height,
            name: obj.name,
            category: obj.category
          };
          img.onload = () => (spriteObj.loaded = true);
          img.src = obj.path;
          this.sprites[obj.path] = spriteObj;
        });
      })
      .catch(err => console.error('Error cargando sprites.json:', err));
  }

  updateSpriteDropdown() {
    const options = Object.entries(this.sprites)
      .filter(([_, d]) => d.category === this.selectedCategory);
    this.selectedSprite = options.length > 0 ? options[0][0] : null;
  }

  isSpriteLoaded(path) {
    return path && this.sprites[path] && this.sprites[path].loaded;
  }

  getSpriteData(path) {
    return this.sprites[path] || null;
  }

  // ------------------------------------------------------------
  // Input (ACTUALIZADO)
  // ------------------------------------------------------------
  getMouseCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    
    // Calculamos la relación entre el tamaño visual y el tamaño interno (800x600)
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  onMouseMove(e) {
    const pos = this.getMouseCanvasPos(e);
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
    this.mouse.hover = false;

    // Verificar si pasa por algún botón
    const mx = (this.mouse.x - this.offsetX) / this.scale;
    const my = (this.mouse.y - this.offsetY) / this.scale;
    let tooltipFound = null;

    for (const b of this.buttons) {
      if (!b.loaded) continue;
      const w = b.img.width * b.scale;
      const h = b.img.height * b.scale;
      if (mx >= b.x && mx <= b.x + w && my >= b.y && my <= b.y + h) {
        b.hover = true;
        this.mouse.hover = true;
        if (b.tooltip) tooltipFound = b.tooltip;
      } else {
        b.hover = false;
      }
    }

    this.tooltip = tooltipFound;

    // 🧩 Mostrar / ocultar tooltip HTML
    if (this.tooltip) {
      this.htmlTooltip.textContent = this.tooltip;
      this.htmlTooltip.style.display = 'block';
      this.htmlTooltip.style.left = `${e.clientX + 12}px`;
      this.htmlTooltip.style.top = `${e.clientY - 28}px`;
    } else {
      this.htmlTooltip.style.display = 'none';
    }
  }

  onMouseLeave() {
    // 🧩 ocultar tooltip al salir del canvas
    this.tooltip = null;
    this.htmlTooltip.style.display = 'none';
    this.buttons.forEach(b => b.hover = false);
  }

  onMouseDown(e) {
    this.mouse.pressed = true;
    const mx = (this.mouse.x - this.offsetX) / this.scale;
    const my = (this.mouse.y - this.offsetY) / this.scale;

    for (const b of this.buttons) {
      if (!b.pressable || !b.loaded) continue;
      const w = b.img.width * b.scale;
      const h = b.img.height * b.scale;
      if (mx >= b.x && mx <= b.x + w && my >= b.y && my <= b.y + h) {
        if (b.toggle) b.active = !b.active;
        if (b.action) b.action(b.active);
        break;
      }
    }
  }

  // ------------------------------------------------------------
  // Dibujo
  // ------------------------------------------------------------
  draw(ctx) {
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Fondo
    if (this.bgLoaded) ctx.drawImage(this.bgImg, 0, 0);

    // Botones
    for (const b of this.buttons) {
      if (!b.loaded) continue;
      const img = b.hover && b.imageHover ? (b.hoverImg || this.preloadHover(b)) : b.img;
      ctx.drawImage(img, b.x, b.y, b.img.width * b.scale, b.img.height * b.scale);
    }

    ctx.restore();
  }

  preloadHover(b) {
    const hoverImg = new Image();
    hoverImg.src = b.imageHover;
    b.hoverImg = hoverImg;
    return hoverImg;
  }
}
