// scripts/hud.js
export class HUD {
  constructor(containerId = 'hud') {
    this.container = document.getElementById(containerId);

    // --- Configuración general ---
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1.0;
    this.maxHeightRatio = 0.25; // Máx 1/4 del alto de ventana

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
  }

  // --- Inicialización general del HUD ---
  initHUD() {
    // Contenedor raíz
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

    // Fondo
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

    // Contenedor de botones
    this.buttonContainer = document.createElement('div');
    Object.assign(this.buttonContainer.style, {
      position: 'absolute',
      left: '0',
      bottom: '0',
      pointerEvents: 'auto'
    });
    this.hudRoot.appendChild(this.buttonContainer);

    // Controles internos
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

    this.initModeControls();
  }

  // --- Controles internos ---
  initModeControls() {
    // Botón de modo
    this.modeBtn = document.createElement('button');
    this.modeBtn.textContent = 'Modo: Cámara';
    this.modeBtn.classList.add('hud-btn');
    this.uiContainer.appendChild(this.modeBtn);
    this.modeBtn.addEventListener('click', () => {
      this.setMode(this.mode === 'camera' ? 'sprite' : 'camera');
    });

    // Checkbox de bloqueo de cámara
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

    // Selector de categoría
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

    // Dropdown de sprites
    this.spriteDropdown = document.createElement('select');
    this.uiContainer.appendChild(this.spriteDropdown);
    this.spriteDropdown.addEventListener('change', e => {
      this.selectedSprite = e.target.value;
    });

    this.updateHUDVisibility();
  }

  // --- Layout y escala ---
  updateHUDLayout() {
    const maxHeight = window.innerHeight * this.maxHeightRatio;
    const naturalH = this.bgImg.naturalHeight || 1;
    const naturalW = this.bgImg.naturalWidth || 1;
    const aspect = naturalW / naturalH;
    const scaledH = Math.min(naturalH * this.scale, maxHeight);
    const scaledW = scaledH * aspect;

    this.bgImg.style.width = `${scaledW}px`;
    this.bgImg.style.height = `${scaledH}px`;
    this.hudRoot.style.transform = `translate(${this.offsetX}px, -${this.offsetY}px) scale(${this.scale})`;
  }

  // --- Modificadores de posición/escala ---
  setOffset(x, y) {
    this.offsetX = x;
    this.offsetY = y;
    this.updateHUDLayout();
  }

  setScale(scale) {
    this.scale = scale;
    this.updateHUDLayout();
  }

  // --- Botones modulares ---
  addButton({ id, x = 0, y = 0, pressable = true, image, imageHover, action, scale = 1.0, tooltip }) {
    const btn = document.createElement('img');
    btn.id = id || `hudBtn_${this.buttons.length}`;
    btn.src = image;
    btn.draggable = false;

    Object.assign(btn.style, {
      position: 'absolute',
      left: `${x}px`,
      bottom: `${y}px`,
      transform: `scale(${scale})`,
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
  }

  // --- Control de modo ---
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

  isCameraMode() { return this.mode === 'camera'; }
  isCameraLocked() { return this.cameraLocked; }
  getSelectedSprite() { return this.selectedSprite; }

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

  isSpriteLoaded(path) {
    return path && this.sprites[path] && this.sprites[path].loaded;
  }

  getSpriteData(path) {
    return this.sprites[path] || null;
  }
}
