// scripts/popup.js
export class PopupManager {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.container.zIndex = 99999; // Encima de todo, incluso tooltips
    this.container.visible = false;
    
    // Añadimos al stage directamente
    this.app.stage.addChild(this.container);

    // Leer estilos CSS
    const css = getComputedStyle(document.documentElement);
    this.colors = {
      bg: css.getPropertyValue('--box-fill').trim() || '#5173BD',
      border: css.getPropertyValue('--box-border').trim() || '#121B61',
      innerFill: css.getPropertyValue('--in-fill').trim() || '#95A6DE',
      text: css.getPropertyValue('--txt-color').trim() || '#162C88'
    };

    // Fondo oscuro (Bloqueador de clicks)
    this.overlay = new PIXI.Graphics();
    this.overlay.beginFill(0x000000, 0.5);
    this.overlay.drawRect(0, 0, app.screen.width, app.screen.height);
    this.overlay.endFill();
    this.overlay.eventMode = 'static'; // Captura todos los clicks
    this.container.addChild(this.overlay);

    // Grupo de la ventana
    this.windowGroup = new PIXI.Container();
    this.container.addChild(this.windowGroup);

    // Reajustar si cambia el tamaño de ventana
    window.addEventListener('resize', () => this.resize());
  }

  show(title, contentText) {
    this.windowGroup.removeChildren();
    
    const w = 400;
    const h = 250;
    const padding = 20;

    // 1. Caja Principal
    const box = new PIXI.Graphics();
    // Sombra
    box.beginFill(0x000000, 0.4);
    box.drawRoundedRect(5, 5, w, h, 12);
    box.endFill();
    // Fondo
    box.lineStyle(3, this.colors.border, 1);
    box.beginFill(this.colors.bg, 0.95);
    box.drawRoundedRect(0, 0, w, h, 12);
    box.endFill();
    this.windowGroup.addChild(box);

    // 2. Título
    const titleTxt = new PIXI.Text(title, {
      fontFamily: 'sims-bold',
      fontSize: 20,
      fill: this.colors.text
    });
    titleTxt.x = padding;
    titleTxt.y = 15;
    this.windowGroup.addChild(titleTxt);

    // 3. Botón Cerrar (X)
    const closeBtn = new PIXI.Graphics();
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    const btnSize = 24;
    
    const drawClose = (color) => {
      closeBtn.clear();
      closeBtn.beginFill(color);
      closeBtn.lineStyle(2, this.colors.border);
      closeBtn.drawRoundedRect(0, 0, btnSize, btnSize, 4);
      closeBtn.endFill();
      // La X
      closeBtn.lineStyle(3, 0xFFFFFF);
      closeBtn.moveTo(6, 6); closeBtn.lineTo(btnSize-6, btnSize-6);
      closeBtn.moveTo(btnSize-6, 6); closeBtn.lineTo(6, btnSize-6);
    };
    
    drawClose(0xD32F2F); // Rojo base
    closeBtn.x = w - btnSize - 10;
    closeBtn.y = 10;
    
    closeBtn.on('pointerover', () => drawClose(0xFF5252));
    closeBtn.on('pointerout', () => drawClose(0xD32F2F));
    closeBtn.on('pointerdown', () => this.hide());
    
    this.windowGroup.addChild(closeBtn);

    // 4. Caja Interna (Contenido)
    const innerH = h - 60 - padding;
    const innerBox = new PIXI.Graphics();
    innerBox.beginFill(this.colors.innerFill);
    innerBox.lineStyle(2, this.colors.border);
    innerBox.drawRoundedRect(0, 0, w - (padding*2), innerH, 8);
    innerBox.endFill();
    innerBox.x = padding;
    innerBox.y = 50;
    this.windowGroup.addChild(innerBox);

    // 5. Texto de contenido
    const msg = new PIXI.Text(contentText, {
      fontFamily: 'sims-regular',
      fontSize: 16,
      fill: this.colors.text,
      wordWrap: true,
      wordWrapWidth: w - (padding * 3)
    });
    msg.x = padding + 10;
    msg.y = 60;
    this.windowGroup.addChild(msg);

    // Centrar ventana
    this.resize();
    this.container.visible = true;
  }

  hide() {
    this.container.visible = false;
  }

  resize() {
    if (!this.container.visible) return;
    
    this.overlay.width = this.app.screen.width;
    this.overlay.height = this.app.screen.height;

    const bounds = this.windowGroup.getLocalBounds();
    this.windowGroup.x = (this.app.screen.width - bounds.width) / 2;
    this.windowGroup.y = (this.app.screen.height - bounds.height) / 2;
  }
}