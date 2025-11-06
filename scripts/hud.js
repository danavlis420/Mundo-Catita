// scripts/hud.js
export class HUD {
  constructor(containerId = 'hud') {
    this.container = document.getElementById(containerId);
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1.0;
    this.maxHeightRatio = 0.25;

    this.backgroundPath = 'data/hud/hud_bg.png';
    this.buttons = [];

    this.mode = 'camera';
    this.cameraLocked = true;
    this.selectedCategory = 'floor';
    this.selectedSprite = null;
    this.sprites = {};

    this.initHUD();
    this.loadSpritesJSON();
    window.addEventListener('resize', () => this.updateHUDLayout());
    new ResizeObserver(() => this.updateHUDLayout()).observe(document.querySelector('canvas'));

  }

  // --- Inicialización general ---
  initHUD() {
    this.hudRoot = document.createElement('div');
    this.hudRoot.classList.add('hud-root');
    Object.assign(this.hudRoot.style, {
      position: 'fixed',
      left: '0',
      bottom: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
      transformOrigin: 'bottom left',
      pointerEvents: 'none'
    });
    this.container.appendChild(this.hudRoot);

    this.bgImg = document.createElement('img');
    this.bgImg.src = this.backgroundPath;
    this.bgImg.draggable = false;
    Object.assign(this.bgImg.style, {
      objectFit: 'contain',
      width: 'auto',
      height: 'auto',
      pointerEvents: 'none'
    });
    this.bgImg.onload = () => this.updateHUDLayout();
    this.hudRoot.appendChild(this.bgImg);

    this.buttonContainer = document.createElement('div');
    Object.assign(this.buttonContainer.style, {
      position: 'absolute',
      left: '0',
      bottom: '0',
      pointerEvents: 'auto'
    });
    this.hudRoot.appendChild(this.buttonContainer);

    this.uiContainer = document.createElement('div');
    Object.assign(this.uiContainer.style, {
      position: 'absolute',
      left: '10px',
      bottom: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      pointerEvents: 'auto'
    });
    this.hudRoot.appendChild(this.uiContainer);

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    document.body.appendChild(this.tooltip);

    this.initModeControls();
  }

  // --- Enganchar HUD al canvas ---
  // --- Enganchar HUD al canvas ---
attachHUDToCanvas(canvas) {
  const syncHUD = () => {
    const rect = canvas.getBoundingClientRect();
    this.canvasRect = rect;

    // Mantiene el HUD dentro del área visible del canvas
    const hudX = Math.min(
      Math.max(rect.left + this.offsetX, rect.left),
      rect.right - this.hudRoot.offsetWidth
    );
    const hudY = Math.min(
      Math.max(rect.bottom - this.offsetY - this.hudRoot.offsetHeight, rect.top),
      rect.bottom - this.hudRoot.offsetHeight
    );

    Object.assign(this.hudRoot.style, {
      position: 'absolute',
      left: `${hudX}px`,
      top: `${hudY}px`,
      zIndex: 1000,
      transform: `scale(${this.scale})`,
      transformOrigin: 'bottom left',
      pointerEvents: 'none'
    });
  };

  syncHUD();
  window.addEventListener('resize', syncHUD);
}


  // --- Controles internos ---
  initModeControls() {
    this.modeBtn = document.createElement('button');
    this.modeBtn.textContent = 'Modo: Cámara';
    this.modeBtn.classList.add('hud-btn');
    this.uiContainer.appendChild(this.modeBtn);
    this.modeBtn.addEventListener('click', () => {
      this.setMode(this.mode === 'camera' ? 'sprite' : 'camera');
    });

    this.lockCheckbox = document.createElement('input');
    this.lockCheckbox.type = 'checkbox';
    this.lockCheckbox.checked = true;
    this.lockLabel = document.createElement('label');
    this.lockLabel.textContent = ' Bloquear cámara';
    this.lockLabel.prepend(this.lockCheckbox);
    this.uiContainer.appendChild(this.lockLabel);
    this.lockCheckbox.addEventListener('change', () => {
      this.cameraLocked = this.lockCheckbox.checked;
    });

    this.categorySelect = document.createElement('select');
    ['floor', 'wall', 'object'].forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
      this.categorySelect.appendChild(opt);
    });
    this.uiContainer.appendChild(this.categorySelect);
    this.categorySelect.addEventListener('change', e => {
      this.selectedCategory = e.target.value;
      this.updateSpriteDropdown();
    });

    this.spriteDropdown = document.createElement('select');
    this.uiContainer.appendChild(this.spriteDropdown);
    this.spriteDropdown.addEventListener('change', e => {
      this.selectedSprite = e.target.value;
    });

    this.updateHUDVisibility();
  }

  // --- Layout ---
updateHUDLayout() {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / canvas.width;
  const scaleY = rect.height / canvas.height;
  const pixelScale = Math.min(scaleX, scaleY);

  // Tamaño base
  const naturalW = this.bgImg.naturalWidth || 1;
  const naturalH = this.bgImg.naturalHeight || 1;
  const aspect = naturalW / naturalH;
  const maxHeight = rect.height * this.maxHeightRatio;
  const scaledH = Math.min(naturalH * this.scale * pixelScale, maxHeight);
  const scaledW = scaledH * aspect;

  // Posición relativa dentro del canvas
  const hudX = rect.left + this.offsetX * pixelScale;
  const hudY = rect.bottom - this.offsetY * pixelScale;

  Object.assign(this.hudRoot.style, {
    position: 'absolute',
    left: `${hudX}px`,
    top: `${hudY - scaledH}px`,
    transform: `scale(${pixelScale})`,
    transformOrigin: 'bottom left',
    pointerEvents: 'none',
    zIndex: 1000
  });

  this.bgImg.style.width = `${scaledW}px`;
  this.bgImg.style.height = `${scaledH}px`;

  this.buttons.forEach(btn => {
    const bx = btn._base.x * (scaledW / naturalW);
    const by = btn._base.y * (scaledH / naturalH);
    const bscale = btn._base.scale * (scaledH / naturalH);
    Object.assign(btn.style, {
      left: `${bx}px`,
      bottom: `${by}px`,
      transform: `scale(${bscale})`
    });
  });
}






  // --- Offset y Escala ---
  setOffset(x, y) {
    this.offsetX = x;
    this.offsetY = y;
    this.updateHUDLayout();
  }
  setScale(scale) {
    this.scale = scale;
    this.updateHUDLayout();
  }

  // --- Botones ---
  addButton({ id, x = 0, y = 0, pressable = true, image, imageHover, action, scale = 1.0, tooltip }) {
  const btn = document.createElement('img');
  btn.id = id || `hudBtn_${this.buttons.length}`;
  btn.src = image;
  btn.draggable = false;

  // Guardar datos base relativos
  btn._base = { x, y, scale };

  Object.assign(btn.style, {
    position: 'absolute',
    transformOrigin: 'bottom left',
    cursor: pressable ? 'pointer' : 'default',
    pointerEvents: 'auto'
  });

  if (pressable && imageHover) {
    btn.addEventListener('mouseenter', () => (btn.src = imageHover));
    btn.addEventListener('mouseleave', () => (btn.src = image));
  }

  if (pressable && action) btn.addEventListener('click', () => action());
  if (tooltip) btn.title = tooltip;

  this.buttonContainer.appendChild(btn);
  this.buttons.push(btn);

  // Actualizar layout después de agregar
  this.updateHUDLayout();
}


  // --- Modo ---
  setMode(mode) {
    this.mode = mode;
    this.modeBtn.textContent = mode === 'camera' ? 'Modo: Cámara' : 'Modo: Sprite';
    this.updateHUDVisibility();
  }

  updateHUDVisibility() {
    if (this.mode === 'camera') {
      this.lockLabel.style.display = 'inline-block';
      this.categorySelect.style.display = 'none';
      this.spriteDropdown.style.display = 'none';
    } else {
      this.lockLabel.style.display = 'none';
      this.categorySelect.style.display = 'inline-block';
      this.spriteDropdown.style.display = 'inline-block';
      this.updateSpriteDropdown();
    }
  }

  // --- Sprites ---
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
          img.onerror = () => console.warn('No se pudo cargar:', obj.path);
          img.src = obj.path;
          this.sprites[obj.path] = spriteObj;
        });
        this.updateSpriteDropdown();
      })
      .catch(err => console.error('Error cargando sprites.json:', err));
  }

  updateSpriteDropdown() {
    this.spriteDropdown.innerHTML = '';
    Object.entries(this.sprites).forEach(([path, data]) => {
      if (data.category === this.selectedCategory) {
        const opt = document.createElement('option');
        opt.value = path;
        opt.textContent = `${data.name} (${data.width}x${data.height})`;
        this.spriteDropdown.appendChild(opt);
      }
    });
    this.selectedSprite = this.spriteDropdown.value || null;
  }

  isSpriteLoaded(path) { return path && this.sprites[path] && this.sprites[path].loaded; }
  getSpriteData(path) { return this.sprites[path] || null; }

  // --- Métodos usados por main.js ---
  isCameraMode() { return this.mode === 'camera'; }
  isCameraLocked() { return this.cameraLocked; }
  getSelectedSprite() { return this.selectedSprite; }
}
