import { UNIT_INDEX } from '../data/units';
import { DEPLOYABLE } from '../scenes/BattleScene';

export class BattleUI {
  private container: HTMLElement;
  private suppliesEl!: HTMLElement;
  private killsEl!: HTMLElement;
  private allyHpBarInner!: HTMLElement;
  private allyHpText!: HTMLElement;
  private enemyHpBarInner!: HTMLElement;
  private enemyHpText!: HTMLElement;
  private cards: Record<string, { el: HTMLElement, costEl: HTMLElement, cdOverlay: HTMLElement }> = {};

  constructor(private onDeploy: (unitId: string) => void) {
    this.container = document.getElementById('ui-layer')!;
    this.build();
  }

  private build() {
    this.container.innerHTML = '';
    
    // Contenedor del HUD superior (Glassmorphism)
    const topHud = document.createElement('div');
    topHud.className = 'glass-panel';
    topHud.style.position = 'absolute';
    topHud.style.top = '10px';
    topHud.style.left = '50%';
    topHud.style.transform = 'translateX(-50%)';
    topHud.style.width = '96%';
    topHud.style.padding = '10px 20px';
    topHud.style.display = 'flex';
    topHud.style.justifyContent = 'space-between';
    topHud.style.alignItems = 'center';
    topHud.style.boxSizing = 'border-box';
    
    // Izquierda: Suministros y Kills
    const statsDiv = document.createElement('div');
    statsDiv.style.display = 'flex';
    statsDiv.style.gap = '20px';

    const suppliesDiv = document.createElement('div');
    suppliesDiv.innerHTML = `<span style="color:var(--primary); font-size:14px; font-weight:bold;">SUPPLIES</span><br/>`;
    this.suppliesEl = document.createElement('span');
    this.suppliesEl.style.fontSize = '24px';
    this.suppliesEl.style.fontFamily = 'var(--font-title)';
    this.suppliesEl.innerText = '0';
    suppliesDiv.appendChild(this.suppliesEl);

    const killsDiv = document.createElement('div');
    killsDiv.innerHTML = `<span style="color:#aaa; font-size:14px; font-weight:bold;">KILLS</span><br/>`;
    this.killsEl = document.createElement('span');
    this.killsEl.style.fontSize = '24px';
    this.killsEl.style.fontFamily = 'var(--font-title)';
    this.killsEl.innerText = '0';
    killsDiv.appendChild(this.killsEl);

    statsDiv.appendChild(suppliesDiv);
    statsDiv.appendChild(killsDiv);

    // Derecha: Bases HP
    const basesDiv = document.createElement('div');
    basesDiv.style.display = 'flex';
    basesDiv.style.gap = '30px';

    // Ally Base
    const allyDiv = this.createHpBar('HQ', '#10b981');
    this.allyHpBarInner = allyDiv.barInner;
    this.allyHpText = allyDiv.text;
    basesDiv.appendChild(allyDiv.container);

    // Enemy Base
    const enemyDiv = this.createHpBar('BASTION', '#ef4444');
    this.enemyHpBarInner = enemyDiv.barInner;
    this.enemyHpText = enemyDiv.text;
    basesDiv.appendChild(enemyDiv.container);

    topHud.appendChild(statsDiv);
    topHud.appendChild(basesDiv);

    // Contenedor de Botones de Despliegue (Bottom)
    const bottomHud = document.createElement('div');
    bottomHud.style.position = 'absolute';
    bottomHud.style.bottom = '20px';
    bottomHud.style.left = '50%';
    bottomHud.style.transform = 'translateX(-50%)';
    bottomHud.style.display = 'flex';
    bottomHud.style.gap = '15px';

    // Deployable units in MVP 0.2
    for (const unitId of DEPLOYABLE) {
      const def = UNIT_INDEX[unitId as keyof typeof UNIT_INDEX];
      
      const card = document.createElement('div');
      card.className = 'glass-panel';
      card.style.width = '100px';
      card.style.height = '120px';
      card.style.position = 'relative';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'center';
      card.style.justifyContent = 'flex-end';
      card.style.paddingBottom = '10px';
      card.style.cursor = 'pointer';
      card.style.transition = 'transform 0.1s';
      card.style.overflow = 'hidden';

      card.onmousedown = () => card.style.transform = 'scale(0.95)';
      card.onmouseup = () => { card.style.transform = 'scale(1)'; this.onDeploy(unitId); };
      card.onmouseleave = () => card.style.transform = 'scale(1)';

      // Character Icon
      const icon = document.createElement('img');
      icon.src = `/assets/sprites/unit-${unitId}.png`;
      icon.style.width = '64px';
      icon.style.height = '64px';
      icon.style.objectFit = 'contain';
      icon.style.position = 'absolute';
      icon.style.top = '10px';
      icon.style.imageRendering = 'pixelated';

      const name = document.createElement('div');
      name.innerText = def.name;
      name.style.fontSize = '14px';
      name.style.fontWeight = 'bold';
      name.style.marginTop = 'auto';

      const cost = document.createElement('div');
      cost.innerText = `⬢ ${def.cost}`;
      cost.style.fontSize = '14px';
      cost.style.color = 'var(--primary)';
      cost.style.fontFamily = 'var(--font-title)';

      const cdOverlay = document.createElement('div');
      cdOverlay.style.position = 'absolute';
      cdOverlay.style.top = '0';
      cdOverlay.style.left = '0';
      cdOverlay.style.width = '100%';
      cdOverlay.style.height = '100%';
      cdOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
      cdOverlay.style.transformOrigin = 'bottom';
      cdOverlay.style.transform = 'scaleY(0)';
      cdOverlay.style.pointerEvents = 'none';
      cdOverlay.style.transition = 'transform 0.1s linear';

      card.appendChild(cdOverlay);
      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(cost);

      this.cards[unitId] = { el: card, costEl: cost, cdOverlay };
      bottomHud.appendChild(card);
    }

    this.container.appendChild(topHud);
    this.container.appendChild(bottomHud);
  }

  private createHpBar(label: string, color: string) {
    const container = document.createElement('div');
    container.style.width = '150px';

    const title = document.createElement('div');
    title.innerText = label;
    title.style.fontSize = '12px';
    title.style.fontWeight = 'bold';
    title.style.color = color;
    title.style.marginBottom = '4px';

    const barBg = document.createElement('div');
    barBg.style.width = '100%';
    barBg.style.height = '12px';
    barBg.style.backgroundColor = 'rgba(0,0,0,0.5)';
    barBg.style.borderRadius = '6px';
    barBg.style.overflow = 'hidden';
    barBg.style.border = '1px solid rgba(255,255,255,0.2)';
    barBg.style.position = 'relative';

    const barInner = document.createElement('div');
    barInner.style.height = '100%';
    barInner.style.backgroundColor = color;
    barInner.style.width = '100%';
    barInner.style.transition = 'width 0.2s, background-color 0.2s';

    const text = document.createElement('div');
    text.style.position = 'absolute';
    text.style.right = '4px';
    text.style.top = '0';
    text.style.fontSize = '10px';
    text.style.lineHeight = '12px';

    barBg.appendChild(barInner);
    barBg.appendChild(text);

    container.appendChild(title);
    container.appendChild(barBg);

    return { container, barInner, text };
  }

  public update(state: {
    supplies: number;
    killCount: number;
    allyHp: number;
    allyMaxHp: number;
    enemyHp: number;
    enemyMaxHp: number;
    cooldowns: Map<string, number>;
  }) {
    this.suppliesEl.innerText = Math.floor(state.supplies).toString();
    this.killsEl.innerText = state.killCount.toString();

    const allyPct = Math.max(0, state.allyHp / state.allyMaxHp);
    this.allyHpBarInner.style.width = `${allyPct * 100}%`;
    this.allyHpBarInner.style.backgroundColor = allyPct > 0.3 ? '#10b981' : '#ef4444';
    this.allyHpText.innerText = `${Math.ceil(state.allyHp)}/${state.allyMaxHp}`;

    const enemyPct = Math.max(0, state.enemyHp / state.enemyMaxHp);
    this.enemyHpBarInner.style.width = `${enemyPct * 100}%`;
    this.enemyHpText.innerText = `${Math.ceil(state.enemyHp)}/${state.enemyMaxHp}`;

    for (const [unitId, card] of Object.entries(this.cards)) {
      const def = UNIT_INDEX[unitId as keyof typeof UNIT_INDEX];
      const affordable = state.supplies >= def.cost;
      card.costEl.style.color = affordable ? 'var(--primary)' : '#ef4444';

      const cd = state.cooldowns.get(unitId) ?? 0;
      if (cd > 0) {
        const pct = cd / def.deployCooldown;
        card.cdOverlay.style.transform = `scaleY(${pct})`;
      } else {
        card.cdOverlay.style.transform = `scaleY(0)`;
      }
    }
  }

  public destroy() {
    this.container.innerHTML = '';
  }
}
