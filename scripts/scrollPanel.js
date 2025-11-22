// scripts/scrollPanel.js

// --- CLASE AUXILIAR DROPDOWN ---
class Dropdown extends PIXI.Container {
  constructor(width, height, label, options, onSelect, overlayLayer) {
    super();
    this.w = width;
    this.h = height;
    this.label = label;
    this.options = options;
    this.onSelect = onSelect;
    this.overlayLayer = overlayLayer; 
    
    this.isOpen = false;
    this.selectedText = options.length > 0 ? options[0] : "";
    
    // Estilos CSS
    const css = getComputedStyle(document.documentElement);
    this.colors = {
      bg: css.getPropertyValue('--in-fill').trim() || '#95A6DE',
      border: css.getPropertyValue('--btn-border').trim() || '#000D60',
      text: css.getPropertyValue('--txt-color').trim() || '#162C88',
    };

    this.baseGroup = new PIXI.Container();
    this.addChild(this.baseGroup);

    this.menuGroup = new PIXI.Container();
    this.menuGroup.visible = false;

    this.drawBase();
    this.buildMenu();

    this.baseGroup.eventMode = 'static';
    this.baseGroup.cursor = 'pointer';
    this.baseGroup.on('pointerdown', (e) => {
      e.stopPropagation();
      this.toggle();
    });
  }

  drawBase() {
    this.baseGroup.removeChildren();
    const g = new PIXI.Graphics();
    g.beginFill(this.colors.bg);
    g.lineStyle(1, this.colors.border);
    g.drawRoundedRect(0, 0, this.w, this.h, 4);
    g.endFill();

    // Flecha decorativa
    g.beginFill(this.colors.border);
    g.moveTo(this.w - 20, this.h / 2 - 3);
    g.lineTo(this.w - 10, this.h / 2 - 3);
    g.lineTo(this.w - 15, this.h / 2 + 3);
    g.endFill();
    this.baseGroup.addChild(g);

    const txt = new PIXI.Text(this.selectedText, {
      fontFamily: 'sims-regular',
      fontSize: 14, 
      fill: this.colors.text
    });
    txt.anchor.set(0, 0.5);
    txt.x = 8; txt.y = this.h / 2;
    this.baseGroup.addChild(txt);

    const labelTxt = new PIXI.Text(this.label, {
      fontFamily: 'sims-bold', fontSize: 12, fill: this.colors.text
    });
    labelTxt.y = -18;
    this.addChild(labelTxt);
  }

  buildMenu() {
    this.menuGroup.removeChildren();
    const itemHeight = this.h;
    const totalHeight = this.options.length * itemHeight;

    const bg = new PIXI.Graphics();
    bg.beginFill(this.colors.bg);
    bg.lineStyle(1, this.colors.border);
    bg.drawRoundedRect(0, 0, this.w, totalHeight, 4);
    bg.endFill();
    this.menuGroup.addChild(bg);

    this.options.forEach((opt, i) => {
      const item = new PIXI.Container();
      item.y = i * itemHeight;
      
      const hit = new PIXI.Graphics();
      hit.beginFill(0xFFFFFF, 0.001);
      hit.drawRect(0, 0, this.w, itemHeight);
      hit.endFill();
      item.addChild(hit);

      const txt = new PIXI.Text(opt, {
        fontFamily: 'sims-regular', fontSize: 14, fill: this.colors.text
      });
      txt.x = 8; txt.y = itemHeight/2 - txt.height/2;
      item.addChild(txt);

      item.eventMode = 'static';
      item.cursor = 'pointer';
      item.on('pointerover', () => { txt.style.fontWeight = 'bold'; });
      item.on('pointerout', () => { txt.style.fontWeight = 'normal'; });
      item.on('pointerdown', (e) => {
        e.stopPropagation();
        this.select(opt);
      });
      this.menuGroup.addChild(item);
    });
  }

  toggle() { this.isOpen ? this.close() : this.open(); }

  open() {
    this.isOpen = true;
    const globalPos = this.baseGroup.getGlobalPosition();
    // Usamos toLocal sobre el overlayLayer (UI Container) para posicionar correctamente
    const localPos = this.overlayLayer.toLocal(globalPos);
    
    this.menuGroup.position.set(localPos.x, localPos.y + this.h + 2);
    this.menuGroup.zIndex = 9999;
    this.menuGroup.visible = true;
    this.overlayLayer.addChild(this.menuGroup);
  }

  close() {
    this.isOpen = false;
    this.menuGroup.visible = false;
    if (this.menuGroup.parent) this.menuGroup.parent.removeChild(this.menuGroup);
  }

  select(val) {
    this.selectedText = val;
    this.drawBase();
    this.close();
    if (this.onSelect) this.onSelect(val);
  }
}

// --- CLASE PRINCIPAL SCROLLPANEL ---
export class ScrollPanel extends PIXI.Container {
  constructor(width, height, baseFontSize = 14, overlayLayer) {
    super();
    this.w = width;
    this.h = height;
    this.baseFontSize = baseFontSize;
    this.overlayLayer = overlayLayer; 
    this.padding = 10;
    
    const css = getComputedStyle(document.documentElement);
    this.colors = {
      bg: css.getPropertyValue('--in-fill').trim() || '#95A6DE',
      border: css.getPropertyValue('--in-border').trim() || '#151D59',
      text: css.getPropertyValue('--txt-color').trim() || '#162C88'
    };

    // --- ESCUDO DE EVENTOS ---
    this.eventMode = 'static';
    // Definimos el área exacta del panel (Hit Area)
    // Esto asegura que el panel capture eventos en toda su superficie, incluso donde no hay hijos.
    this.hitArea = new PIXI.Rectangle(0, 0, width, height);

    // Listener de rueda EXCLUSIVO del panel
    this.on('wheel', (e) => {
      // ESTA LÍNEA ES LA CLAVE:
      // Detiene el evento aquí. No llegará al listener de main.js (evitando el zoom de cámara)
      if (e.data.originalEvent) {
          e.data.originalEvent.stopPropagation();
      }
      
      // Lógica de scroll interno
      const step = 30;
      const dir = e.deltaY > 0 ? -1 : 1;
      this.scroll(step * dir);
    });
    
    // 1. Fondo
    this.bg = new PIXI.Graphics();
    this.bg.beginFill(this.colors.bg, 0.9); 
    this.bg.lineStyle(2, this.colors.border);
    this.bg.drawRoundedRect(0, 0, width, height, 8);
    this.bg.endFill();
    // IMPORTANTE: El fondo es solo visual, la interactividad está en el contenedor padre (this)
    this.addChild(this.bg);

    // 2. Contenedor de Contenido
    this.content = new PIXI.Container();
    this.content.x = this.padding;
    this.content.y = this.padding;
    this.addChild(this.content);

    // 3. Máscara de recorte
    const mask = new PIXI.Graphics();
    mask.beginFill(0xFFFFFF);
    mask.drawRoundedRect(0, 0, width, height, 8);
    mask.endFill();
    this.addChild(mask);
    this.mask = mask;
    
    // Lógica de arrastre (Drag Scroll)
    this.dragging = false;
    this.lastY = 0;
    this.cursorY = 0;
    this.dropdowns = [];

    this.on('pointerdown', (e) => { 
        this.dragging = true; 
        this.lastY = e.global.y; 
    });
    
    // Listeners globales para drag suave
    window.addEventListener('pointermove', (e) => {
      if(!this.dragging) return;
      this.scroll(e.y - this.lastY);
      this.lastY = e.y;
    });
    window.addEventListener('pointerup', () => this.dragging = false);
  }

  // --- MÉTODOS DE GESTIÓN DE CONTENIDO ---

  scroll(dy) {
    // Cerramos dropdowns al hacer scroll para evitar artefactos visuales
    this.dropdowns.forEach(d => d.close());
    
    this.content.y += dy;
    const minY = this.h - this.content.height - this.padding;
    const maxY = this.padding;

    // Si el contenido es más chico que el panel, se queda arriba
    if (this.content.height < this.h) {
      this.content.y = this.padding;
    } else {
      // Clamp para no pasarse de los bordes
      if (this.content.y > maxY) this.content.y = maxY;
      if (this.content.y < minY) this.content.y = minY;
    }
  }

  clear() {
    this.content.removeChildren();
    this.cursorY = 0;
    this.dropdowns = [];
    this.content.y = this.padding; // Reset scroll position
  }

  addText(textString, sizeOverride = null, bold = false) {
    const fontSize = sizeOverride || this.baseFontSize;
    const style = {
        fontFamily: bold ? 'sims-bold' : 'sims-regular',
        fontSize: fontSize, 
        fill: this.colors.text,
        wordWrap: true,
        wordWrapWidth: this.w - (this.padding * 2)
    };
    const text = new PIXI.Text(textString, style);
    text.y = this.cursorY;
    this.content.addChild(text);
    this.cursorY += text.height + 10;
  }

  addGridItems(items) {
    const cols = 4;
    const gap = 8;
    const availableWidth = this.w - (this.padding * 2);
    const cellSize = (availableWidth - (gap * (cols - 1))) / cols;

    items.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * (cellSize + gap);
      const y = this.cursorY + row * (cellSize + gap + 20); 
      
      const box = new PIXI.Graphics();
      box.beginFill(0xFFFFFF, 0.3);
      box.lineStyle(1, this.colors.border, 0.5);
      box.drawRoundedRect(0, 0, cellSize, cellSize, 4);
      box.endFill();
      
      // Interactividad de los ítems
      box.eventMode = 'static';
      box.cursor = 'pointer';
      box.on('pointerdown', () => { if (item.callback) item.callback(); });
      box.on('pointerover', () => box.alpha = 0.7);
      box.on('pointerout', () => box.alpha = 1);
      box.x = x; box.y = y;
      this.content.addChild(box);

      if (item.texture) {
        const spr = PIXI.Sprite.from(item.texture);
        // Ajustar imagen dentro de la caja manteniendo proporción
        const scale = Math.min((cellSize-4)/spr.width, (cellSize-4)/spr.height);
        spr.scale.set(scale);
        spr.anchor.set(0.5);
        spr.x = cellSize / 2; spr.y = cellSize / 2;
        box.addChild(spr);
      }
      if (item.label) {
        const lbl = new PIXI.Text(item.label, {
            fontFamily: 'sims-regular',
            fontSize: 10,
            fill: this.colors.text,
            align: 'center'
        });
        lbl.anchor.set(0.5, 0);
        lbl.x = x + cellSize / 2;
        lbl.y = y + cellSize + 2;
        this.content.addChild(lbl);
      }
    });
    const totalRows = Math.ceil(items.length / cols);
    this.cursorY += totalRows * (cellSize + gap + 20) + 10;
  }

  addDropdown(label, options, onSelect) {
    const ddHeight = 30; 
    const dd = new Dropdown(this.w - (this.padding*2), ddHeight, label, options, onSelect, this.overlayLayer);
    dd.y = this.cursorY + 20; 
    dd.x = 0;
    this.content.addChild(dd);
    this.dropdowns.push(dd);
    this.cursorY += ddHeight + 30;
  }
}