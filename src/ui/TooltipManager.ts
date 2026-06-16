

export class TooltipManager {
  private static element: HTMLDivElement | null = null;

  private static ensureElement() {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = 'glass-panel';
    this.element.style.position = 'absolute';
    this.element.style.display = 'none';
    this.element.style.zIndex = '99999';
    this.element.style.pointerEvents = 'none';
    this.element.style.padding = '10px 14px';
    this.element.style.width = '240px';
    this.element.style.fontSize = '12px';
    this.element.style.fontFamily = 'var(--font-body)';
    this.element.style.lineHeight = '1.4';
    this.element.style.color = '#fff';
    this.element.style.background = 'rgba(15, 17, 12, 0.95)';
    this.element.style.border = '2px solid var(--panel-border)';
    this.element.style.boxShadow = '5px 5px 0px rgba(0, 0, 0, 0.8)';
    
    // Evitar textura de peligro hazard-stripe para mejor lectura
    this.element.style.backgroundImage = 'none';

    document.body.appendChild(this.element);
  }

  /**
   * Muestra el tooltip de una reliquia en coordenadas absolutas de pantalla.
   */
  static show(x: number, y: number, data: { name: string; description: string; rarity: string; flavor?: string }) {
    this.ensureElement();
    if (!this.element) return;

    // Color según la rareza
    let rarityColor = '#ffffff'; // common
    if (data.rarity === 'rare') {
      rarityColor = '#3b82f6'; // Azul / Rara
    } else if (data.rarity === 'epic') {
      rarityColor = '#a855f7'; // Violeta / Épica
    }

    const rarityText = data.rarity === 'common' ? 'COMÚN' : data.rarity === 'rare' ? 'RARA' : 'ÉPICA';

    this.element.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.15); padding-bottom:4px;">
        <span style="font-family:var(--font-title); font-size:13px; font-weight:bold; color:#fff; letter-spacing:0.5px;">${data.name.toUpperCase()}</span>
        <span style="font-family:var(--font-ui); font-size:9px; font-weight:bold; color:${rarityColor}; border:1px solid ${rarityColor}; padding:1px 4px; border-radius:2px;">${rarityText}</span>
      </div>
      <div style="font-size:11px; color:#e5e7eb; margin-bottom:6px;">${data.description}</div>
      ${data.flavor ? `<div style="font-size:10px; color:#9ca3af; font-style:italic; border-top:1px dashed rgba(255,255,255,0.1); padding-top:4px;">"${data.flavor}"</div>` : ''}
    `;

    this.element.style.display = 'block';

    // Ajustar posicionamiento para que no se salga de la pantalla
    const w = this.element.offsetWidth || 240;
    const h = this.element.offsetHeight || 100;

    let posX = x + 15;
    let posY = y + 15;

    if (posX + w > window.innerWidth) {
      posX = x - w - 15;
    }
    if (posY + h > window.innerHeight) {
      posY = window.innerHeight - h - 15;
    }

    this.element.style.left = `${posX}px`;
    this.element.style.top = `${posY}px`;
  }

  /**
   * Oculta el tooltip.
   */
  static hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  /**
   * Destruye el elemento del DOM al cambiar de escena o limpiar.
   */
  static destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }
}
