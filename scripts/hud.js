// scripts/hud.js
export class HUD {
  constructor(containerId = 'hud') {
    this.container = document.getElementById(containerId);
    this.mode = 'camera'; // 'camera' o 'sprite'
    this.cameraLocked = true;
    this.selectedCategory = 'floor';
    this.selectedSprite = null;
    this.sprites = {}; // path -> { img, loaded, width, height, name, category }

    this.initHUD();
    this.loadSpritesJSON();
  }

  initHUD() {
    // --- Botón de modo ---
    this.modeBtn = document.createElement('button');
    this.modeBtn.textContent = 'Modo: Cámara';
    this.container.appendChild(this.modeBtn);
    this.modeBtn.addEventListener('click', () => {
      this.setMode(this.mode === 'camera' ? 'sprite' : 'camera');
    });

    // --- Checkbox de bloqueo de cámara ---
    this.lockCheckbox = document.createElement('input');
    this.lockCheckbox.type = 'checkbox';
    this.lockCheckbox.checked = true;
    this.lockLabel = document.createElement('label');
    this.lockLabel.textContent = 'Bloquear cámara';
    this.lockLabel.prepend(this.lockCheckbox);
    this.container.appendChild(this.lockLabel);

    this.lockCheckbox.addEventListener('change', () => {
      this.cameraLocked = this.lockCheckbox.checked;
    });

    // --- Selector de categoría (Piso, Pared, Objeto) ---
    this.categorySelect = document.createElement('select');
    ['floor', 'wall', 'object'].forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
      this.categorySelect.appendChild(opt);
    });
    this.container.appendChild(this.categorySelect);

    this.categorySelect.addEventListener('change', e => {
      this.selectedCategory = e.target.value;
      this.updateSpriteDropdown();
    });

    // --- Dropdown de sprites ---
    this.spriteDropdown = document.createElement('select');
    this.container.appendChild(this.spriteDropdown);
    this.spriteDropdown.addEventListener('change', e => {
      this.selectedSprite = e.target.value;
    });

    // --- Inicializamos visibilidad ---
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

  // --- Cargar sprites desde JSON ---
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
          img.onload = () => spriteObj.loaded = true;
          img.onerror = () => console.warn('No se pudo cargar:', obj.path);
          img.src = obj.path;
          this.sprites[obj.path] = spriteObj;
        });
        // Actualizar dropdown de sprites al final
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
        opt.textContent = data.name + ` (${data.width}x${data.height})`;
        this.spriteDropdown.appendChild(opt);
      }
    });
    this.selectedSprite = this.spriteDropdown.value || null;
  }

  isSpriteLoaded(path) {
    return path && this.sprites[path] && this.sprites[path].loaded;
  }

  getSpriteData(path) {
    if (this.sprites[path]) return this.sprites[path];
    return null;
  }
}
