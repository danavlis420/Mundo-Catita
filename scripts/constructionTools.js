// scripts/constructionTools.js

const TOOLS_CONFIG = {
  width: 250,
  height: 200,
  radius: 12,
  headerHeight: 35,
  padding: 15,
  defaultX: 20,
  defaultY: 80,
  titleText: "Herramientas",
  labelLayer: "Capa Activa:"
};

export class ConstructionTools extends PIXI.Container {
  /**
   * @param {PIXI.Application} app 
   * @param {function} onCloseCallback Función a ejecutar al cerrar la ventana
   */
  constructor(app, onCloseCallback) {
    super();
    this.app = app;
    this.onCloseCallback = onCloseCallback; // Guardamos el callback
    
    this.w = TOOLS_CONFIG.width;
    this.h = TOOLS_CONFIG.height;
    
    this.dragging = false;
    this.dragData = null;

    this.currentTool = 'brush'; 
    this.currentLayer = 0;      
    
    const css = getComputedStyle(document.documentElement);
    this.colors = {
      bg: css.getPropertyValue('--box-fill').trim() || '#5173BD',
      innerFill: css.getPropertyValue('--in-fill').trim() || '#95A6DE',
      border: css.getPropertyValue('--box-border').trim() || '#121B61',
      active: 0xFFD700,
      activeText: 0x000000,
      inactive: 0xFFFFFF,
      text: css.getPropertyValue('--txt-color').trim() || '#162C88'
    };

    this.setupUI();
    this.visible = false;
    
    // Importante: Habilitar interactividad en el contenedor raíz
    this.eventMode = 'static';
  }

  resetPosition() {
    // Posición relativa a la pantalla completa (ya no relativa al HUD)
    this.x = this.app.screen.width - this.w - TOOLS_CONFIG.defaultX;
    this.y = TOOLS_CONFIG.defaultY;
  }

  setupUI() {
    this.removeChildren();

    // --- 1. FONDO ---
    this.bg = new PIXI.Graphics();
    this.bg.lineStyle(3, this.colors.border, 1);
    this.bg.beginFill(this.colors.bg, 0.95);
    this.bg.drawRoundedRect(0, 0, this.w, this.h, TOOLS_CONFIG.radius);
    this.bg.endFill();
    
    // Dragging en el fondo
    this.bg.eventMode = 'static';
    this.bg.cursor = 'move';
    this.bg.on('pointerdown', this.onDragStart.bind(this));
    this.bg.on('pointerup', this.onDragEnd.bind(this));
    this.bg.on('pointerupoutside', this.onDragEnd.bind(this));
    this.bg.on('pointermove', this.onDragMove.bind(this));
    
    this.addChild(this.bg);

    // --- 2. TÍTULO ---
    const title = new PIXI.Text(TOOLS_CONFIG.titleText, { 
        fontFamily: 'sims-bold', fontSize: 16, fill: this.colors.text 
    });
    title.x = TOOLS_CONFIG.padding; 
    title.y = 10;
    // Ignorar eventos en el texto para que el drag del fondo funcione
    title.eventMode = 'none'; 
    this.addChild(title);

    // --- 3. BOTÓN CERRAR (X) ---
    const closeSize = 20;
    const closeBtn = new PIXI.Graphics();
    closeBtn.beginFill(0xD32F2F); // Rojo
    closeBtn.lineStyle(2, this.colors.border);
    closeBtn.drawRoundedRect(0, 0, closeSize, closeSize, 4);
    closeBtn.endFill();
    // La X
    closeBtn.lineStyle(2, 0xFFFFFF);
    closeBtn.moveTo(5, 5); closeBtn.lineTo(closeSize-5, closeSize-5);
    closeBtn.moveTo(closeSize-5, 5); closeBtn.lineTo(5, closeSize-5);

    closeBtn.x = this.w - closeSize - 10;
    closeBtn.y = 8;
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    
    // Al hacer click, ejecutamos el método close que a su vez llama al callback
    closeBtn.on('pointerdown', (e) => {
        e.stopPropagation();
        this.close();
    });

    this.addChild(closeBtn);

    // --- 4. PANEL INTERIOR ---
    const innerY = TOOLS_CONFIG.headerHeight;
    const innerH = this.h - innerY - TOOLS_CONFIG.padding;
    const innerW = this.w - (TOOLS_CONFIG.padding * 2);
    
    const innerBox = new PIXI.Graphics();
    innerBox.lineStyle(2, this.colors.border, 0.8);
    innerBox.beginFill(this.colors.innerFill, 1);
    innerBox.drawRoundedRect(0, 0, innerW, innerH, 8);
    innerBox.endFill();
    innerBox.x = TOOLS_CONFIG.padding;
    innerBox.y = innerY;
    
    // Detener propagación para no arrastrar ventana desde el área de trabajo
    innerBox.eventMode = 'static';
    innerBox.on('pointerdown', (e) => e.stopPropagation());
    
    this.addChild(innerBox);
    this.innerGroup = new PIXI.Container();
    this.innerGroup.x = innerBox.x;
    this.innerGroup.y = innerBox.y;
    this.addChild(this.innerGroup);

    // --- 5. CONTROLES ---
    const btnW = (innerW - 10) / 2;
    this.btnBrush = this.createToolButton("Pincel", 0, 10, btnW, () => this.setTool('brush'));
    this.btnEraser = this.createToolButton("Borrador", btnW + 10, 10, btnW, () => this.setTool('eraser'));
    
    const lblLayer = new PIXI.Text(TOOLS_CONFIG.labelLayer, { 
        fontFamily: 'sims-bold', fontSize: 14, fill: this.colors.text 
    });
    lblLayer.x = 5; lblLayer.y = 60;
    this.innerGroup.addChild(lblLayer);

    this.layerButtons = [];
    const layerGap = 10;
    const layerSize = 35;
    
    for(let i=0; i<4; i++) {
        const lx = 5 + (i * (layerSize + layerGap));
        const ly = 85;
        const btn = this.createLayerButton(i, lx, ly, layerSize);
        this.layerButtons.push(btn);
    }

    this.refreshVisuals();
  }

  createToolButton(label, x, y, w, callback) {
    const container = new PIXI.Container();
    container.x = x; container.y = y;
    
    const bg = new PIXI.Graphics();
    const txt = new PIXI.Text(label, { fontFamily: 'sims-regular', fontSize: 14, fill: this.colors.text });
    txt.anchor.set(0.5);
    txt.x = w / 2; txt.y = 15;

    container.addChild(bg);
    container.addChild(txt);

    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', (e) => { e.stopPropagation(); callback(); });
    container.on('pointerover', () => { container.alpha = 0.9; });
    container.on('pointerout', () => { container.alpha = 1; });

    container.bgGraphic = bg;
    container.txtObj = txt;
    container.btnWidth = w;
    this.innerGroup.addChild(container);
    return container;
  }

  createLayerButton(num, x, y, size) {
    const container = new PIXI.Container();
    container.x = x; container.y = y;
    const bg = new PIXI.Graphics();
    const txt = new PIXI.Text(num.toString(), { fontFamily: 'sims-bold', fontSize: 16, fill: this.colors.text });
    txt.anchor.set(0.5);
    txt.x = size / 2; txt.y = size / 2;

    container.addChild(bg);
    container.addChild(txt);

    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', (e) => { e.stopPropagation(); this.setLayer(num); });
    
    container.bgGraphic = bg;
    container.txtObj = txt;
    container.btnSize = size;
    this.innerGroup.addChild(container);
    return container;
  }

  setTool(toolName) {
    this.currentTool = toolName;
    this.refreshVisuals();
  }

  setLayer(num) {
    this.currentLayer = num;
    this.refreshVisuals();
  }

  refreshVisuals() {
    const updateToolBtn = (btn, isActive) => {
        btn.bgGraphic.clear();
        const color = isActive ? this.colors.active : 0xFFFFFF;
        const fontColor = isActive ? this.colors.activeText : this.colors.text;
        btn.bgGraphic.lineStyle(1, this.colors.border);
        btn.bgGraphic.beginFill(color);
        btn.bgGraphic.drawRoundedRect(0, 0, btn.btnWidth, 30, 6);
        btn.bgGraphic.endFill();
        btn.txtObj.style.fill = fontColor;
        btn.txtObj.style.fontFamily = isActive ? 'sims-bold' : 'sims-regular';
    };

    updateToolBtn(this.btnBrush, this.currentTool === 'brush');
    updateToolBtn(this.btnEraser, this.currentTool === 'eraser');

    this.layerButtons.forEach((btn, idx) => {
        const isActive = (idx === this.currentLayer);
        btn.bgGraphic.clear();
        const color = isActive ? this.colors.active : 0xFFFFFF;
        btn.bgGraphic.lineStyle(1, this.colors.border);
        btn.bgGraphic.beginFill(color);
        btn.bgGraphic.drawRoundedRect(0, 0, btn.btnSize, btn.btnSize, 8);
        btn.bgGraphic.endFill();
        btn.txtObj.style.fill = isActive ? this.colors.activeText : this.colors.text;
    });
  }

  // --- DRAGGING MEJORADO ---
  onDragStart(event) {
    this.dragData = event.data;
    this.alpha = 0.9;
    this.dragging = true;
    this.dragOffset = event.data.getLocalPosition(this);
  }

  onDragEnd() {
    this.alpha = 1;
    this.dragging = false;
    this.dragData = null;
  }

  onDragMove() {
    if (this.dragging) {
        // Obtenemos la posición local relativa al PADRE (uiContainer)
        // Esto asegura que el drag funcione sin importar el escalado del padre
        const newPos = this.dragData.getLocalPosition(this.parent);
        
        this.x = newPos.x - this.dragOffset.x;
        this.y = newPos.y - this.dragOffset.y;
        
        // Clamp a la pantalla
        const screenW = this.app.screen.width;
        const screenH = this.app.screen.height;
        
        if(this.x < 0) this.x = 0;
        if(this.y < 0) this.y = 0;
        if(this.x > screenW - this.w) this.x = screenW - this.w;
        if(this.y > screenH - this.h) this.y = screenH - this.h;
    }
  }

  open() {
    this.visible = true;
    this.resetPosition();
    this.setTool('brush'); 
  }

  close() {
    // Si hay callback configurado (para salir del modo construcción), lo llamamos
    if (this.onCloseCallback) {
        this.onCloseCallback();
    }
    // La visibilidad se gestionará externamente a través del toggle del menú,
    // pero por seguridad lo ocultamos aquí también.
    this.visible = false;
  }
}