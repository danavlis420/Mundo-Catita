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

    // Configuración visual
    this.itemHeight = this.h;
    this.maxVisibleItems = 5;
    
    // Estilos CSS
    const css = getComputedStyle(document.documentElement);
    this.colors = {
      bg: css.getPropertyValue('--in-fill').trim() || '#95A6DE',
      border: css.getPropertyValue('--btn-border').trim() || '#000D60',
      text: css.getPropertyValue('--txt-color').trim() || '#162C88',
    };

    // 1. Grupo base (el botón que se ve siempre)
    this.baseGroup = new PIXI.Container();
    this.addChild(this.baseGroup);

    // 2. Grupo del menú desplegable (se añade al overlayLayer cuando se abre)
    this.menuGroup = new PIXI.Container();
    this.menuContent = new PIXI.Container(); // Contenedor interno para scrollear
    
    // Máscara para el menú
    this.menuMask = new PIXI.Graphics();
    this.menuGroup.addChild(this.menuMask);
    this.menuGroup.addChild(this.menuContent);
    this.menuContent.mask = this.menuMask;

    this.drawBase();
    this.buildMenu();

    // Evento para abrir/cerrar
    this.baseGroup.eventMode = 'static';
    this.baseGroup.cursor = 'pointer';
    this.baseGroup.on('pointerdown', (e) => {
      e.stopPropagation(); // Detener para no activar el mundo
      this.toggle();
    });

    // Blocker: Rectángulo invisible pantalla completa para detectar clicks fuera
    this.blocker = new PIXI.Graphics();
    this.blocker.eventMode = 'static';
    this.blocker.on('pointerdown', (e) => {
        e.stopPropagation();
        this.close();
    });
    // Scroll dentro del blocker también detiene el zoom del mundo
    this.blocker.on('wheel', (e) => e.stopPropagation());
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
    this.menuContent.removeChildren();
    
    // Fondo general del menú
    const totalHeight = this.options.length * this.itemHeight;
    const visibleHeight = Math.min(totalHeight, this.itemHeight * this.maxVisibleItems);
    this.menuVisibleHeight = visibleHeight;

    // Dibujar fondo en el content para que scrollee
    const bg = new PIXI.Graphics();
    bg.beginFill(this.colors.bg);
    bg.lineStyle(1, this.colors.border);
    // Dibujamos el fondo del tamaño total para que exista visualmente al hacer scroll
    bg.drawRoundedRect(0, 0, this.w, totalHeight, 4);
    bg.endFill();
    this.menuContent.addChild(bg);

    this.options.forEach((opt, i) => {
      const item = new PIXI.Container();
      item.y = i * this.itemHeight;
      
      const hit = new PIXI.Graphics();
      hit.beginFill(0xFFFFFF, 0.001); // Casi transparente para hit area
      hit.drawRect(0, 0, this.w, this.itemHeight);
      hit.endFill();
      item.addChild(hit);

      const txt = new PIXI.Text(opt, {
        fontFamily: 'sims-regular', fontSize: 14, fill: this.colors.text
      });
      txt.x = 8; txt.y = this.itemHeight/2 - txt.height/2;
      item.addChild(txt);

      item.eventMode = 'static';
      item.cursor = 'pointer';
      item.on('pointerover', () => { txt.style.fontWeight = 'bold'; });
      item.on('pointerout', () => { txt.style.fontWeight = 'normal'; });
      item.on('pointerdown', (e) => {
        e.stopPropagation();
        this.select(opt);
      });
      this.menuContent.addChild(item);
    });

    // Definir la máscara según la altura visible
    this.menuMask.clear();
    this.menuMask.beginFill(0xFFFFFF);
    this.menuMask.drawRoundedRect(0, 0, this.w, visibleHeight, 4);
    this.menuMask.endFill();

    // Habilitar interactividad para scroll en el GRUPO (el contenedor enmascarado)
    this.menuGroup.eventMode = 'static';
    this.menuGroup.hitArea = new PIXI.Rectangle(0, 0, this.w, visibleHeight);
    
    // Listener de rueda EXCLUSIVO para el menú
    this.menuGroup.on('wheel', (e) => {
        e.stopPropagation(); // IMPORTANTE: No hacer zoom en el mapa
        const step = 20;
        const dir = e.deltaY > 0 ? -1 : 1;
        
        this.menuContent.y += step * dir;
        
        // Clamping del scroll
        const minScroll = -(totalHeight - visibleHeight);
        const maxScroll = 0;
        
        if (this.menuContent.y > maxScroll) this.menuContent.y = maxScroll;
        if (this.menuContent.y < minScroll && totalHeight > visibleHeight) this.menuContent.y = minScroll;
        // Si no hay overflow, forzar a 0
        if (totalHeight <= visibleHeight) this.menuContent.y = 0;
    });
  }

  toggle() { this.isOpen ? this.close() : this.open(); }

  open() {
    if(this.isOpen) return;
    this.isOpen = true;
    
    // 1. Calcular posición global para colocarlo en el OverlayLayer
    const globalPos = this.baseGroup.getGlobalPosition();
    const localPos = this.overlayLayer.toLocal(globalPos);
    
    // Render hacia ARRIBA
    const finalY = localPos.y - this.menuVisibleHeight - 2;
    
    this.menuGroup.position.set(localPos.x, finalY);
    this.menuContent.y = 0; // Reset scroll
    
    // 2. Configurar y añadir el Blocker (pantalla completa)
    // Asumimos un tamaño grande para cubrir todo
    this.blocker.clear();
    this.blocker.beginFill(0x000000, 0.001); // Transparente pero interactive
    this.blocker.drawRect(-10000, -10000, 20000, 20000);
    this.blocker.endFill();
    
    this.overlayLayer.addChild(this.blocker);
    this.overlayLayer.addChild(this.menuGroup);
  }

  close() {
    this.isOpen = false;
    // Remover del overlay
    if (this.menuGroup.parent) this.menuGroup.parent.removeChild(this.menuGroup);
    if (this.blocker.parent) this.blocker.parent.removeChild(this.blocker);
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
    this.hitArea = new PIXI.Rectangle(0, 0, width, height);

    // Listener de rueda EXCLUSIVO del panel
    this.on('wheel', (e) => {
      // Detiene el evento aquí para evitar el zoom de cámara
      if (e.data.originalEvent) {
          e.data.originalEvent.stopPropagation();
      }
      e.stopPropagation(); 
      
      const step = 30;
      const dir = e.deltaY > 0 ? -1 : 1;
      this.scroll(step * dir);
    });

    // Detener clicks para que no construyan/muevan pj debajo del panel
    this.on('pointerdown', (e) => e.stopPropagation());
    
    // 1. Fondo
    this.bg = new PIXI.Graphics();
    this.bg.beginFill(this.colors.bg, 0.9); 
    this.bg.lineStyle(2, this.colors.border);
    this.bg.drawRoundedRect(0, 0, width, height, 8);
    this.bg.endFill();
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
    // Cerramos dropdowns al hacer scroll para evitar que queden flotando desconectados
    this.dropdowns.forEach(d => {
        if(d.isOpen) d.close();
    });
    
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
    // Cerrar cualquier dropdown abierto antes de limpiar referencias
    this.dropdowns.forEach(d => d.close());
    this.dropdowns = [];
    this.content.y = this.padding; 
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
      box.beginFill(0xFFFFFF, 0.2);
      box.lineStyle(1, this.colors.border, 0.5);
      box.drawRoundedRect(0, 0, cellSize, cellSize, 4);
      box.endFill();
      
      box.eventMode = 'static';
      box.cursor = 'pointer';
      box.on('pointerdown', (e) => { 
          e.stopPropagation();
          if (item.callback) item.callback(); 
      });
      box.on('pointerover', () => box.alpha = 0.7);
      box.on('pointerout', () => box.alpha = 1);
      box.x = x; box.y = y;
      this.content.addChild(box);

      if (item.texture) {
        const spr = PIXI.Sprite.from(item.texture);
        spr.anchor.set(0.5);
        spr.x = cellSize / 2; 
        spr.y = cellSize / 2;

        const resizeSprite = () => {
             const padding = 8;
             const maxSide = cellSize - padding;
             const texW = spr.texture.width;
             const texH = spr.texture.height;
             if (texW > 0 && texH > 0) {
                 const scale = Math.min(maxSide / texW, maxSide / texH);
                 spr.scale.set(scale);
             }
        };

        if (spr.texture.valid) {
            resizeSprite();
        } else {
            spr.texture.once('update', resizeSprite);
        }
        
        box.addChild(spr);
      }

      if (item.label) {
        const lbl = new PIXI.Text(item.label, {
            fontFamily: 'sims-regular',
            fontSize: 10,
            fill: this.colors.text,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: cellSize
        });
        lbl.anchor.set(0.5, 0);
        lbl.x = cellSize / 2;
        lbl.y = cellSize + 2;
        box.addChild(lbl); 
      }
    });
    
    const totalRows = Math.ceil(items.length / cols);
    this.cursorY += totalRows * (cellSize + gap + 25) + 10;
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