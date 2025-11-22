// scripts/tooltip.js
export class TooltipManager {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    
    // ALTA PRIORIDAD: Z-Index máximo y capa separada
    this.container.zIndex = 99999; 
    this.container.visible = false; // Oculto por defecto
    
    // Agregamos directamente al stage de la app para evitar capas intermedias
    this.app.stage.addChild(this.container);

    // 1. LEER ESTILOS CSS (Integración visual)
    // Obtenemos los valores de tus variables CSS root
    const cssStyles = getComputedStyle(document.documentElement);
    
    // Convertimos a valores usables (Strings hexadecimales)
    this.styleConfig = {
      textColor: cssStyles.getPropertyValue('--txt-color').trim() || '#162C88',
      bgColor: cssStyles.getPropertyValue('--in-fill').trim() || '#95A6DE',
      borderColor: cssStyles.getPropertyValue('--btn-border').trim() || '#000D60',
      fontFamily: 'sims-italic' // Nombre definido en tu @font-face
    };

    // 2. CONSTRUIR ELEMENTOS GRÁFICOS
    this.bg = new PIXI.Graphics();
    this.container.addChild(this.bg);

    this.text = new PIXI.Text('', {
      fontFamily: this.styleConfig.fontFamily, 
      fontSize: 16, // Tamaño base
      fill: this.styleConfig.textColor, // Usamos variable --txt-color
      align: 'left',
      dropShadow: false
    });
    
    // Pequeño margen interno para el texto
    this.text.x = 8;
    this.text.y = 4;
    
    this.container.addChild(this.text);
    
    // Listener global para mover el tooltip con el mouse
    this.app.stage.eventMode = 'static';
    this.app.stage.on('pointermove', (e) => this.updatePosition(e));
  }

  show(text, x, y) {
    // Si nos pasan x/y, lo usamos. Si no, se actualizará con el mouse move
    if (x !== undefined && y !== undefined) {
        this.container.position.set(x + 15, y - 30);
    }

    this.text.text = text;
    this.drawBackground();
    this.container.visible = true;
    
    // Traer al frente explícitamente
    this.app.stage.setChildIndex(this.container, this.app.stage.children.length - 1);
  }

  hide() {
    this.container.visible = false;
  }

  updatePosition(e) {
    if (!this.container.visible) return;
    
    // Mover el tooltip junto al cursor (con un pequeño offset)
    const pos = e.global;
    this.container.x = pos.x + 15; 
    this.container.y = pos.y - 35; // Un poco arriba del mouse

    // CLAMP: Evitar que se salga de la pantalla
    const bounds = this.container.getBounds();
    if (this.container.x + bounds.width > this.app.screen.width) {
        this.container.x = pos.x - bounds.width - 10; // Voltear a la izquierda
    }
    if (this.container.y < 0) {
        this.container.y = pos.y + 20; // Voltear hacia abajo
    }
  }

  drawBackground() {
    const w = this.text.width + 16;
    const h = this.text.height + 8;
    
    this.bg.clear();
    // Sombra simple simulada (opcional, estilo "box-shadow")
    this.bg.beginFill(0x000000, 0.2);
    this.bg.drawRoundedRect(3, 3, w, h, 6);
    this.bg.endFill();
    // Relleno usando variable --in-fill
    // Pixi acepta strings hex CSS como '#95A6DE'
    this.bg.beginFill(this.styleConfig.bgColor, 0.95); 
    
    // Borde usando variable --btn-border
    this.bg.lineStyle(2, this.styleConfig.borderColor, 1);
    
    this.bg.drawRoundedRect(0, 0, w, h, 6); // Bordes redondeados
    this.bg.endFill();
    
    
  }
}