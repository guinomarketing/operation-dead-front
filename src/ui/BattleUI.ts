import Phaser from 'phaser';
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
  private moraleBarInner!: HTMLElement;
  private moraleText!: HTMLElement;
  
  private cards: Record<string, { el: HTMLElement, costEl: HTMLElement, cdOverlay: HTMLElement, nameEl: HTMLElement }> = {};
  private abilityButtons: Record<string, { el: HTMLElement, costEl: HTMLElement, cdOverlay: HTMLElement }> = {};
  
  private selectedUnitId: string | null = null;
  private selectedAbilityId: string | null = null;

  constructor(
    private scene: Phaser.Scene,
    private onSelectCard: (unitId: string) => void,
    private onSelectAbility: (abilityId: string) => void,
    private nodeType: string = 'battle'
  ) {
    this.container = document.getElementById('ui-layer')!;
    this.build();
  }

  private build() {
    this.container.innerHTML = '';

    // ─────────────────────────────────────────────────────────
    //  TOP HUD (landscape): Base Argentina · Moral/Suministros · Búnker
    // ─────────────────────────────────────────────────────────
    const topHud = document.createElement('div');
    topHud.className = 'glass-panel';
    topHud.style.position = 'absolute';
    topHud.style.top = '8px';
    topHud.style.left = '50%';
    topHud.style.transform = 'translateX(-50%)';
    topHud.style.width = '97%';
    topHud.style.padding = '6px 14px';
    topHud.style.display = 'flex';
    topHud.style.justifyContent = 'space-between';
    topHud.style.alignItems = 'center';
    topHud.style.boxSizing = 'border-box';

    // ── IZQUIERDA: HP Base Argentina ──
    const leftCluster = document.createElement('div');
    leftCluster.style.display = 'flex';
    leftCluster.style.alignItems = 'center';
    leftCluster.style.gap = '10px';
    leftCluster.style.minWidth = '160px';

    const allyDiv = this.createHpBar('🇦🇷 BASE ARGENTINA', '#3b82f6');
    this.allyHpBarInner = allyDiv.barInner;
    this.allyHpText = allyDiv.text;
    allyDiv.container.style.width = '160px';
    leftCluster.appendChild(allyDiv.container);

    // ── CENTRO: Moral + Suministros + Bajas ──
    const centerCluster = document.createElement('div');
    centerCluster.style.display = 'flex';
    centerCluster.style.alignItems = 'center';
    centerCluster.style.gap = '18px';

    // Moral
    const moraleDiv = document.createElement('div');
    moraleDiv.style.width = '120px';
    moraleDiv.innerHTML = `<span style="color:#eab308; font-size:10px; font-weight:bold; letter-spacing:1px;">MORAL</span>`;

    const moraleBarBg = document.createElement('div');
    moraleBarBg.style.width = '100%';
    moraleBarBg.style.height = '12px';
    moraleBarBg.style.backgroundColor = 'rgba(0,0,0,0.5)';
    moraleBarBg.style.borderRadius = '2px';
    moraleBarBg.style.overflow = 'hidden';
    moraleBarBg.style.border = '1px solid rgba(255,255,255,0.2)';
    moraleBarBg.style.position = 'relative';
    moraleBarBg.style.marginTop = '2px';

    this.moraleBarInner = document.createElement('div');
    this.moraleBarInner.style.height = '100%';
    this.moraleBarInner.style.width = '70%';
    this.moraleBarInner.style.backgroundColor = '#fbbf24';
    this.moraleBarInner.style.transition = 'width 0.3s ease, background-color 0.3s ease';

    this.moraleText = document.createElement('div');
    this.moraleText.style.position = 'absolute';
    this.moraleText.style.width = '100%';
    this.moraleText.style.textAlign = 'center';
    this.moraleText.style.top = '0';
    this.moraleText.style.fontSize = '9px';
    this.moraleText.style.fontWeight = 'bold';
    this.moraleText.style.lineHeight = '12px';
    this.moraleText.style.color = '#fff';
    this.moraleText.innerText = '70/100';

    moraleBarBg.appendChild(this.moraleBarInner);
    moraleBarBg.appendChild(this.moraleText);
    moraleDiv.appendChild(moraleBarBg);

    // Suministros
    const suppliesDiv = document.createElement('div');
    suppliesDiv.style.textAlign = 'center';
    suppliesDiv.innerHTML = `<span style="color:#aaa; font-size:10px; font-weight:bold; letter-spacing:1px;">SUMINISTROS</span><br/>`;
    this.suppliesEl = document.createElement('span');
    this.suppliesEl.style.fontSize = '20px';
    this.suppliesEl.style.fontFamily = 'var(--font-title)';
    this.suppliesEl.style.color = 'var(--primary)';
    this.suppliesEl.innerText = '0';
    suppliesDiv.appendChild(this.suppliesEl);

    // Bajas
    const killsDiv = document.createElement('div');
    killsDiv.style.textAlign = 'center';
    killsDiv.innerHTML = `<span style="color:#aaa; font-size:10px; font-weight:bold; letter-spacing:1px;">BAJAS</span><br/>`;
    this.killsEl = document.createElement('span');
    this.killsEl.style.fontSize = '20px';
    this.killsEl.style.fontFamily = 'var(--font-title)';
    this.killsEl.innerText = '0';
    killsDiv.appendChild(this.killsEl);

    centerCluster.appendChild(moraleDiv);
    centerCluster.appendChild(suppliesDiv);
    centerCluster.appendChild(killsDiv);

    // ── DERECHA: HP Búnker enemigo ──
    const rightCluster = document.createElement('div');
    rightCluster.style.display = 'flex';
    rightCluster.style.alignItems = 'center';
    rightCluster.style.gap = '10px';
    rightCluster.style.minWidth = '160px';
    rightCluster.style.justifyContent = 'flex-end';

    let enemyLabel = 'BÚNKER ENEMIGO';
    if (this.nodeType === 'boss') {
      const runState = this.scene.game.registry.get('runState');
      if (runState && runState.operationId === 'op-hollow-town') {
        enemyLabel = '☠ TOTENKOPF';
      } else if (runState && runState.operationId === 'op-iron-grave') {
        enemyLabel = '☠ LOCOMOTORA';
      } else {
        enemyLabel = '☠ GRÜBER';
      }
    }
    const enemyDiv = this.createHpBar(enemyLabel, '#ef4444', true);
    this.enemyHpBarInner = enemyDiv.barInner;
    this.enemyHpText = enemyDiv.text;
    enemyDiv.container.style.width = '160px';
    rightCluster.appendChild(enemyDiv.container);

    topHud.appendChild(leftCluster);
    topHud.appendChild(centerCluster);
    topHud.appendChild(rightCluster);

    // ─────────────────────────────────────────────────────────
    //  BOTTOM BAR (landscape): cartas de unidad IZQ · habilidades DER
    // ─────────────────────────────────────────────────────────
    const bottomBar = document.createElement('div');
    bottomBar.style.position = 'absolute';
    bottomBar.style.bottom = '8px';
    bottomBar.style.left = '0';
    bottomBar.style.right = '0';
    bottomBar.style.display = 'flex';
    bottomBar.style.justifyContent = 'space-between';
    bottomBar.style.alignItems = 'flex-end';
    bottomBar.style.padding = '0 14px';
    bottomBar.style.boxSizing = 'border-box';
    bottomBar.style.pointerEvents = 'none';

    // ── Cartas de Unidades (izquierda) ──
    const deployRow = document.createElement('div');
    deployRow.style.display = 'flex';
    deployRow.style.gap = '6px';
    deployRow.style.pointerEvents = 'auto';

    for (const unitId of DEPLOYABLE) {
      const def = UNIT_INDEX[unitId as keyof typeof UNIT_INDEX];

      const card = document.createElement('div');
      card.className = 'glass-panel';
      card.style.width = '74px';
      card.style.height = '92px';
      card.style.position = 'relative';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'center';
      card.style.justifyContent = 'flex-end';
      card.style.paddingBottom = '5px';
      card.style.cursor = 'pointer';
      card.style.transition = 'transform 0.1s, border-color 0.1s, box-shadow 0.1s';
      card.style.overflow = 'hidden';

      card.onmousedown = () => card.style.transform = 'scale(0.95)';
      card.onmouseup = () => { card.style.transform = 'scale(1)'; this.onSelectCard(unitId); };
      card.onmouseleave = () => card.style.transform = 'scale(1)';

      const icon = document.createElement('img');
      const textureKey = `unit-${unitId}`;
      if (this.scene.textures.exists(textureKey)) {
        try {
          icon.src = this.scene.textures.getBase64(textureKey);
        } catch (e) {
          icon.src = `/assets/sprites/unit-${unitId}.png`;
        }
      } else {
        icon.src = `/assets/sprites/unit-${unitId}.png`;
      }
      icon.style.width = '44px';
      icon.style.height = '44px';
      icon.style.objectFit = 'contain';
      icon.style.position = 'absolute';
      icon.style.top = '5px';
      icon.style.imageRendering = 'pixelated';

      const name = document.createElement('div');
      name.innerText = def.name;
      name.style.fontSize = '10px';
      name.style.fontWeight = 'bold';
      name.style.marginTop = 'auto';
      name.style.textAlign = 'center';

      const cost = document.createElement('div');
      cost.innerText = `⬢ ${def.cost}`;
      cost.style.fontSize = '11px';
      cost.style.color = 'var(--primary)';
      cost.style.fontFamily = 'var(--font-title)';

      const cdOverlay = document.createElement('div');
      cdOverlay.style.position = 'absolute';
      cdOverlay.style.bottom = '0';
      cdOverlay.style.left = '0';
      cdOverlay.style.width = '100%';
      cdOverlay.style.height = '100%';
      cdOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
      cdOverlay.style.transformOrigin = 'bottom';
      cdOverlay.style.transform = 'scaleY(0)';
      cdOverlay.style.pointerEvents = 'none';

      card.appendChild(cdOverlay);
      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(cost);

      this.cards[unitId] = { el: card, costEl: cost, cdOverlay, nameEl: name };
      deployRow.appendChild(card);
    }

    // ── Habilidades de Comandante (derecha) ──
    const abilitiesRow = document.createElement('div');
    abilitiesRow.style.display = 'flex';
    abilitiesRow.style.gap = '10px';
    abilitiesRow.style.alignItems = 'flex-end';
    abilitiesRow.style.pointerEvents = 'auto';

    const abilityDefs = [
      { id: 'airstrike', label: '💥 A. AÉREO', cost: 50 },
      { id: 'medkit', label: '✚ BOTIQUÍN', cost: 30 }
    ];

    for (const ab of abilityDefs) {
      const btn = document.createElement('div');
      btn.className = 'glass-panel';
      btn.style.width = '92px';
      btn.style.height = '60px';
      btn.style.display = 'flex';
      btn.style.flexDirection = 'column';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.gap = '4px';
      btn.style.cursor = 'pointer';
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.style.border = '2px solid var(--panel-border)';
      btn.style.transition = 'transform 0.1s, border-color 0.1s, box-shadow 0.1s';

      btn.onmousedown = () => btn.style.transform = 'scale(0.95)';
      btn.onmouseup = () => { btn.style.transform = 'scale(1)'; this.onSelectAbility(ab.id); };
      btn.onmouseleave = () => btn.style.transform = 'scale(1)';

      const text = document.createElement('div');
      text.innerText = ab.label;
      text.style.fontSize = '11px';
      text.style.fontWeight = 'bold';
      text.style.color = '#fff';
      text.style.textAlign = 'center';

      const cost = document.createElement('div');
      cost.innerText = `⬢ ${ab.cost}`;
      cost.style.fontSize = '11px';
      cost.style.color = 'var(--primary)';
      cost.style.fontFamily = 'var(--font-title)';

      const cdOverlay = document.createElement('div');
      cdOverlay.style.position = 'absolute';
      cdOverlay.style.bottom = '0';
      cdOverlay.style.left = '0';
      cdOverlay.style.width = '100%';
      cdOverlay.style.height = '100%';
      cdOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
      cdOverlay.style.transformOrigin = 'bottom';
      cdOverlay.style.transform = 'scaleY(0)';
      cdOverlay.style.pointerEvents = 'none';

      btn.appendChild(cdOverlay);
      btn.appendChild(text);
      btn.appendChild(cost);

      this.abilityButtons[ab.id] = { el: btn, costEl: cost, cdOverlay };
      abilitiesRow.appendChild(btn);
    }

    bottomBar.appendChild(deployRow);
    bottomBar.appendChild(abilitiesRow);

    this.container.appendChild(topHud);
    this.container.appendChild(bottomBar);
  }

  private createHpBar(label: string, color: string, rightAlign = false) {
    const container = document.createElement('div');
    container.style.width = '110px';

    const title = document.createElement('div');
    title.innerText = label;
    title.style.fontSize = '10px';
    title.style.fontWeight = 'bold';
    title.style.color = color;
    title.style.marginBottom = '2px';
    title.style.textAlign = rightAlign ? 'right' : 'left';

    const barBg = document.createElement('div');
    barBg.style.width = '100%';
    barBg.style.height = '10px';
    barBg.style.backgroundColor = 'rgba(0,0,0,0.5)';
    barBg.style.borderRadius = '2px';
    barBg.style.overflow = 'hidden';
    barBg.style.border = '1px solid rgba(255,255,255,0.2)';
    barBg.style.position = 'relative';

    const barInner = document.createElement('div');
    barInner.style.height = '100%';
    barInner.style.backgroundColor = color;
    barInner.style.width = '100%';
    barInner.style.transition = 'width 0.2s';

    const text = document.createElement('div');
    text.style.position = 'absolute';
    text.style.width = '100%';
    text.style.textAlign = 'center';
    text.style.top = '0';
    text.style.fontSize = '8px';
    text.style.lineHeight = '10px';
    text.style.color = '#fff';
    text.style.fontWeight = 'bold';

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
    morale: number;
    roster?: any[];
    deployedSoldierIds?: Set<string>;
  }) {
    // Suministros y Bajas
    this.suppliesEl.innerText = Math.floor(state.supplies).toString();
    this.killsEl.innerText = state.killCount.toString();

    // Moral
    const moralePct = Math.max(0, state.morale / 100);
    this.moraleBarInner.style.width = `${moralePct * 100}%`;
    this.moraleText.innerText = `${Math.ceil(state.morale)}/100`;
    if (state.morale > 50) {
      this.moraleBarInner.style.backgroundColor = '#fbbf24';
    } else if (state.morale > 25) {
      this.moraleBarInner.style.backgroundColor = '#f97316'; // orange
    } else {
      this.moraleBarInner.style.backgroundColor = '#ef4444'; // red
    }

    // HQ base HP
    const allyPct = Math.max(0, state.allyHp / state.allyMaxHp);
    this.allyHpBarInner.style.width = `${allyPct * 100}%`;
    this.allyHpText.innerText = `${Math.ceil(state.allyHp)}/${state.allyMaxHp}`;

    // Bastion base HP
    const enemyPct = Math.max(0, state.enemyHp / state.enemyMaxHp);
    this.enemyHpBarInner.style.width = `${enemyPct * 100}%`;
    this.enemyHpText.innerText = `${Math.ceil(state.enemyHp)}/${state.enemyMaxHp}`;

    // Actualizar Cooldown y Economía de Unidades
    for (const [unitId, card] of Object.entries(this.cards)) {
      const def = UNIT_INDEX[unitId as keyof typeof UNIT_INDEX];
      
      // Calcular cuántos soldados de esta clase están disponibles
      let available = 0;
      let total = 0;
      if (state.roster && state.deployedSoldierIds) {
        const classSoldiers = state.roster.filter(s => s.unitId === unitId && s.status === 'ready');
        total = classSoldiers.length;
        const deployed = classSoldiers.filter(s => state.deployedSoldierIds!.has(s.id)).length;
        available = total - deployed;
      }
      
      card.nameEl.innerText = `${def.name} (${available})`;

      const affordable = state.supplies >= def.cost && available > 0;
      card.costEl.style.color = affordable ? 'var(--primary)' : '#ef4444';

      const cd = state.cooldowns.get(unitId) ?? 0;
      if (cd > 0) {
        const pct = cd / def.deployCooldown;
        card.cdOverlay.style.transform = `scaleY(${pct})`;
      } else {
        card.cdOverlay.style.transform = `scaleY(0)`;
      }

      if (this.selectedUnitId !== unitId) {
        card.el.style.opacity = cd > 0 || !affordable || available === 0 ? '0.6' : '1';
      }
    }

    // Actualizar Cooldown y Economía de Habilidades
    const abilityCosts = { airstrike: 50, medkit: 30 };
    const abilityCds = { airstrike: 45000, medkit: 25000 };

    for (const [abId, btn] of Object.entries(this.abilityButtons)) {
      const cost = abilityCosts[abId as keyof typeof abilityCosts];
      const maxCd = abilityCds[abId as keyof typeof abilityCds];
      const affordable = state.supplies >= cost;
      btn.costEl.style.color = affordable ? 'var(--primary)' : '#ef4444';

      const cd = state.cooldowns.get(abId) ?? 0;
      if (cd > 0) {
        const pct = cd / maxCd;
        btn.cdOverlay.style.transform = `scaleY(${pct})`;
      } else {
        btn.cdOverlay.style.transform = `scaleY(0)`;
      }

      if (this.selectedAbilityId !== abId) {
        btn.el.style.opacity = cd > 0 || !affordable ? '0.6' : '1';
      }
    }
  }

  public setSelectedUnit(unitId: string | null) {
    this.selectedUnitId = unitId;
    this.selectedAbilityId = null;

    // Resetear bordes de habilidades
    for (const btn of Object.values(this.abilityButtons)) {
      btn.el.style.borderColor = 'var(--panel-border)';
      btn.el.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.9)';
    }

    // Pintar borde de cartas
    for (const [id, card] of Object.entries(this.cards)) {
      if (id === unitId) {
        card.el.style.borderColor = '#fbbf24';
        card.el.style.boxShadow = '0 0 12px #fbbf24';
        card.el.style.opacity = '1';
      } else {
        card.el.style.borderColor = 'var(--panel-border)';
        card.el.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.9)';
      }
    }
  }

  public setSelectedAbility(abilityId: string | null) {
    this.selectedAbilityId = abilityId;
    this.selectedUnitId = null;

    // Resetear bordes de cartas
    for (const card of Object.values(this.cards)) {
      card.el.style.borderColor = 'var(--panel-border)';
      card.el.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.9)';
    }

    // Pintar borde de habilidades
    for (const [id, btn] of Object.entries(this.abilityButtons)) {
      if (id === abilityId) {
        btn.el.style.borderColor = '#ef4444';
        btn.el.style.boxShadow = '0 0 12px #ef4444';
        btn.el.style.opacity = '1';
      } else {
        btn.el.style.borderColor = 'var(--panel-border)';
        btn.el.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.9)';
      }
    }
  }

  public clearSelection() {
    this.setSelectedUnit(null);
    this.setSelectedAbility(null);
  }

  public flashSupplies() {
    const origColor = this.suppliesEl.style.color;
    this.suppliesEl.style.color = '#ef4444';
    this.scene.tweens.add({
      targets: this.suppliesEl,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.suppliesEl.style.color = origColor;
        this.suppliesEl.style.scale = '1';
      }
    });
  }

  public destroy() {
    this.container.innerHTML = '';
  }
}
