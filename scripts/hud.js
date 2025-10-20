export class HUD {
  constructor(containerId = 'hud') {
    this.container = document.getElementById(containerId);
    this.mode = 'camera'; // 'camera' o 'sprite'
    this.cameraLocked = true;
    this.selectedCategory = 'floor';
    this.selectedSprite = null;
    this.sprites = {}; // path -> { img, loaded, width, height, name, category }
    this.initHUD();
    this.loadSpritesAuto();
  }

  initHUD() {
    // Botón de modo
    this.modeBtn = document.createElement('button');
    this.modeBtn.textContent = 'Modo: Cámara';
    this.container.appendChild(this.modeBtn);

    this.modeBtn.addEventListener('click', () => {
      this.setMode(this.mode === 'camera' ? 'sprite' : 'camera');
    });

    // Checkbox de bloqueo de cámara
    this.lockCheckbox = document.createElement('input');
    this.lockCheckbox.type = 'checkbox';
    this.lockCheckbox.checked = true;
    this.cameraLocked = true;
    this.lockCheckbox.addEventListener('change', () => {
      this.cameraLocked = this.lockCheckbox.checked;
    });
    this.lockLabel = document.createElement('label');
    this.lockLabel.textContent = 'Bloquear cámara';
    this.lockLabel.prepend(this.lockCheckbox);
    this.container.appendChild(this.lockLabel);

    // Selector de categoría
    this.categorySelect = document.createElement('select');
    ['floor','wall','object'].forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      this.categorySelect.appendChild(opt);
    });
    this.categorySelect.addEventListener('change', e => {
      this.selectedCategory = e.target.value;
      this.updateSpriteDropdown();
    });
    this.container.appendChild(this.categorySelect);

    // Dropdown de sprites
    this.spriteDropdown = document.createElement('select');
    this.spriteDropdown.addEventListener('change', e => {
      this.selectedSprite = e.target.value;
    });
    this.container.appendChild(this.spriteDropdown);

    // Inicializamos visibilidad
    this.updateHUDVisibility();
  }

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

  getSpriteData(path) { return this.sprites[path] || null; }

  // Carga automática de carpetas y reconocimiento WxH
  loadSpritesAuto() {
    const categories = { floor:'assets/sprites/floor', wall:'assets/sprites/wall', object:'assets/sprites/object' };

    for (const [cat, folder] of Object.entries(categories)) {
      // NOTA: fetch de carpetas requiere servidor; si es local usar manualmente o un JSON de assets
      // Aquí dejamos manualmente algunos ejemplos:
      const exampleFiles = cat === 'floor'
        ? ['floor1_1x1_1.png','floor2_2x2_1.png']
        : cat === 'wall'
        ? ['paredBase_1x3_1.png','paredAlta_2x3_1.png']
        : ['chair_1x2_1.png','table_2x2_1.png'];

      exampleFiles.forEach(file => {
        const path = folder + '/' + file;
        const match = file.match(/(.+)_([0-9]+)x([0-9]+)_.*\.(png|jpg|jpeg|webp)$/i);
        let name='sprite', width=1, height=1;
        if (match) {
          name = match[1];
          width = parseInt(match[2]);
          height = parseInt(match[3]);
        }
        const img = new Image();
        const spriteObj = { img, loaded:false, width, height, name, category:cat };
        img.onload = () => spriteObj.loaded = true;
        img.onerror = () => console.warn('No se pudo cargar:', path);
        img.src = path;
        this.sprites[path] = spriteObj;
      });
    }
  }

  updateSpriteDropdown() {
    this.spriteDropdown.innerHTML = '';
    Object.entries(this.sprites).forEach(([path,data]) => {
      if (data.category === this.selectedCategory) {
        const opt = document.createElement('option');
        opt.value = path;
        opt.textContent = data.name;
        this.spriteDropdown.appendChild(opt);
      }
    });
    this.selectedSprite = this.spriteDropdown.value;
  }
}
