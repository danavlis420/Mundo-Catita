// scripts/constructionTools.js

// --- CONFIGURACIÓN VISUAL Y DE POSICIÓN ---
const TOOLS_CONFIG = {
  width: 250,        // Ancho total de la ventana
  height: 200,       // Alto total
  radius: 12,        // Redondeo de las esquinas
  headerHeight: 35,  // Altura de la barra de título (zona de arrastre principal)
  padding: 15,       // Margen interno
  
  // Posición inicial (relativa a la pantalla)
  defaultX: 20,      // Margen derecho
  defaultY: 80,      // Margen superior
  
  // Textos
  titleText: "Herramientas",
  labelLayer: "Capa Activa:"
};

export class ConstructionTools extends PIXI.Container {
  constructor(app, hud) {
    super();
    this.app = app;
    this.hud = hud;
    
    // Aplicar dimensiones de la config
    this.w = TOOLS_CONFIG.width;
    this.h = TOOLS_CONFIG.height;
    
    this.dragging = false;
    this.dragData = null;

    // Estado interno
    this.currentTool = 'brush'; // 'brush' | 'eraser'
    this.currentLayer = 0;      // 0, 1, 2, 3
    
    // 1. LEER ESTILOS CSS (Igual que Popup/ScrollPanel)
    const css = getComputedStyle(document.documentElement);
    this.colors = {
      bg: css.getPropertyValue('--box-fill').trim() || '#5173BD',
      innerFill: css.getPropertyValue('--in-fill').trim() || '#95A6DE', // Color interior más claro
      border: css.getPropertyValue('--box-border').trim() || '#121B61',
      active: 0xFFD700, // Dorado para selección
      activeText: 0x000000,
      inactive: 0xFFFFFF,
      text: css.getPropertyValue('--txt-color').trim() || '#162C88'
    };

    this.setupUI();
    
    // Inicialmente oculto y posicionado
    this.visible = false;
    this.zIndex = 9999; 
    this.resetPosition();
  }

  resetPosition() {
    this.x = this.app.screen.width - this.w - TOOLS_CONFIG.defaultX;
    this.y = TOOLS_CONFIG.defaultY;
  }

  setupUI() {
    this.removeChildren();

    // --- 1. FONDO (Marco Exterior) ---
    this.bg = new PIXI.Graphics();
    // Dibujamos el fondo (Frame)
    this.bg.lineStyle(3, this.colors.border, 1);
    this.bg.beginFill(this.colors.bg, 0.95);
    this.bg.drawRoundedRect(0, 0, this.w, this.h, TOOLS_CONFIG.radius);
    this.bg.endFill();
    
    // Habilitar Dragging en todo el fondo
    this.bg.eventMode = 'static';
    this.bg.cursor = 'move';
    this.bg.on('pointerdown', this.onDragStart.bind(this));
    this.bg.on('pointerup', this.onDragEnd.bind(this));
    this.bg.on('pointerupoutside', this.onDragEnd.bind(this));
    this.bg.on('pointermove', this.onDragMove.bind(this));
    
    this.addChild(this.bg);

    // --- 2. TÍTULO ---
    const title = new PIXI.Text(TOOLS_CONFIG.titleText, { 
        fontFamily: 'sims-bold', 
        fontSize: 16, 
        fill: this.colors.text 
    });
    title.x = TOOLS_CONFIG.padding; 
    title.y = 10;
    this.addChild(title);

    // --- 3. PANEL INTERIOR (Zona de controles) ---
    // Usamos un rectángulo interior más claro, como en los popups
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
    
    // Detener propagación de drag en el panel interior para evitar mover la ventana al clicar botones
    innerBox.eventMode = 'static';
    innerBox.on('pointerdown', (e) => e.stopPropagation());
    
    this.addChild(innerBox);
    this.innerGroup = new PIXI.Container();
    this.innerGroup.x = innerBox.x;
    this.innerGroup.y = innerBox.y;
    this.addChild(this.innerGroup);

    // --- 4. CONTROLES (Dentro del Panel Interior) ---
    
    // A. Botones de Herramienta
    const btnW = (innerW - 10) / 2; // Dos columnas
    this.btnBrush = this.createToolButton("Pincel", 0, 10, btnW, () => this.setTool('brush'));
    this.btnEraser = this.createToolButton("Borrador", btnW + 10, 10, btnW, () => this.setTool('eraser'));
    
    // B. Sección de Capas
    const lblLayer = new PIXI.Text(TOOLS_CONFIG.labelLayer, { 
        fontFamily: 'sims-bold', fontSize: 14, fill: this.colors.text 
    });
    lblLayer.x = 5; 
    lblLayer.y = 60;
    this.innerGroup.addChild(lblLayer);

    // Generar botones de capa (0, 1, 2, 3)
    this.layerButtons = [];
    const layerGap = 10;
    const layerSize = 35; // Botones cuadrados/redondos grandes
    
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
    const txt = new PIXI.Text(label, { 
        fontFamily: 'sims-regular', fontSize: 14, fill: this.colors.text 
    });
    txt.anchor.set(0.5);
    txt.x = w / 2; txt.y = 15; // Altura fija 30px

    container.addChild(bg);
    container.addChild(txt);

    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', (e) => { 
        e.stopPropagation(); 
        callback(); 
    });
    
    // Hover effect simple
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
    const txt = new PIXI.Text(num.toString(), { 
        fontFamily: 'sims-bold', fontSize: 16, fill: this.colors.text 
    });
    txt.anchor.set(0.5);
    txt.x = size / 2; txt.y = size / 2;

    container.addChild(bg);
    container.addChild(txt);

    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', (e) => { 
        e.stopPropagation(); 
        this.setLayer(num); 
    });
    
    container.bgGraphic = bg;
    container.txtObj = txt;
    container.btnSize = size;
    
    this.innerGroup.addChild(container);
    return container;
  }

  // --- LÓGICA DE ESTADO ---

  setTool(toolName) {
    this.currentTool = toolName;
    this.refreshVisuals();
  }

  setLayer(num) {
    this.currentLayer = num;
    this.refreshVisuals();
  }

  refreshVisuals() {
    // 1. Refrescar Herramientas
    const updateToolBtn = (btn, isActive) => {
        btn.bgGraphic.clear();
        const color = isActive ? this.colors.active : 0xFFFFFF;
        const lineColor = this.colors.border;
        const fontColor = isActive ? this.colors.activeText : this.colors.text;

        btn.bgGraphic.lineStyle(1, lineColor);
        btn.bgGraphic.beginFill(color);
        btn.bgGraphic.drawRoundedRect(0, 0, btn.btnWidth, 30, 6);
        btn.bgGraphic.endFill();
        
        btn.txtObj.style.fill = fontColor;
        btn.txtObj.style.fontFamily = isActive ? 'sims-bold' : 'sims-regular';
    };

    updateToolBtn(this.btnBrush, this.currentTool === 'brush');
    updateToolBtn(this.btnEraser, this.currentTool === 'eraser');

    // 2. Refrescar Capas
    this.layerButtons.forEach((btn, idx) => {
        const isActive = (idx === this.currentLayer);
        btn.bgGraphic.clear();
        
        const color = isActive ? this.colors.active : 0xFFFFFF;
        
        btn.bgGraphic.lineStyle(1, this.colors.border);
        btn.bgGraphic.beginFill(color);
        // Dibujamos círculo o cuadrado redondeado
        btn.bgGraphic.drawRoundedRect(0, 0, btn.btnSize, btn.btnSize, 8);
        btn.bgGraphic.endFill();

        btn.txtObj.style.fill = isActive ? this.colors.activeText : this.colors.text;
    });
  }

  // --- DRAGGING ---
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
        const newPos = this.dragData.getLocalPosition(this.parent);
        this.x = newPos.x - this.dragOffset.x;
        this.y = newPos.y - this.dragOffset.y;
        
        // Clamp pantalla (evitar que se salga)
        if(this.x < 0) this.x = 0;
        if(this.y < 0) this.y = 0;
        if(this.x > this.app.screen.width - this.w) this.x = this.app.screen.width - this.w;
        if(this.y > this.app.screen.height - this.h) this.y = this.app.screen.height - this.h;
    }
  }

  open() {
    this.visible = true;
    this.resetPosition();
    this.setTool('brush'); 
  }

  close() {
    this.visible = false;
  }
}