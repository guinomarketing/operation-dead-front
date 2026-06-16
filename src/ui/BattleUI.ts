import Phaser from 'phaser';
import { UNIT_INDEX } from '../data/units';
import { GAME_WIDTH, GAME_HEIGHT, LAYOUT } from '../utils/constants';

const UI = '/assets/ui';

interface CardRef { el: HTMLElement; costEl: HTMLElement; cdOverlay: HTMLElement; nameEl: HTMLElement; chargeFill: HTMLElement; }
interface AbilityRef { el: HTMLElement; costEl: HTMLElement; cdOverlay: HTMLElement; chargeFill: HTMLElement; }

const ABILITY_DEFS = [
  { id: 'airstrike', label: 'A. AÉREO', icon: `${UI}/ability-airstrike.png`, cost: 50, cd: 45000 },
  { id: 'medkit', label: 'BOTIQUÍN', icon: `${UI}/ability-medkit.png`, cost: 30, cd: 25000 },
];

export class BattleUI {
  private container: HTMLElement;
  private suppliesEl!: HTMLElement;
  private killsEl!: HTMLElement;
  private allyFill!: HTMLElement;
  private allyVal!: HTMLElement;
  private enemyFill!: HTMLElement;
  private enemyVal!: HTMLElement;
  private moraleRing!: HTMLElement;
  private moraleText!: HTMLElement;
  private wavePipsEl!: HTMLElement;
  private lastWaveKey = '';

  private cards: Record<string, CardRef> = {};
  private abilityButtons: Record<string, AbilityRef> = {};

  private selectedUnitId: string | null = null;
  private selectedAbilityId: string | null = null;
  private deployCatcher!: HTMLElement;

  constructor(
    private scene: Phaser.Scene,
    private onSelectCard: (unitId: string) => void,
    private onSelectAbility: (abilityId: string) => void,
    private nodeType: string = 'battle',
    private deployable: string[] = ['rifleman'],
    private onFieldTap: (logicalX: number, logicalY: number) => void = () => {}
  ) {
    this.container = document.getElementById('ui-layer')!;
    this.build();
  }

  // ─────────────────────────────────────────────────────────
  private build() {
    this.container.innerHTML = '';

    // ===== DEPLOY CATCHER =====
    // Capa transparente sobre la banda del battlefield. Resuelve el toque de
    // despliegue/habilidad de forma confiable, sin depender de que el toque
    // llegue al canvas por debajo del DOM (bug de carriles inferiores tapados
    // por la barra de cartas en pantallas chicas). Solo activa cuando hay algo
    // seleccionado; por debajo de las cartas/HUD en orden de DOM.
    const bandTop = LAYOUT.UI_TOP_HEIGHT;
    const bandBottom = GAME_HEIGHT - LAYOUT.UI_BOTTOM_HEIGHT;
    const catcher = document.createElement('div');
    Object.assign(catcher.style, {
      position: 'absolute', left: '0', right: '0',
      top: `${(bandTop / GAME_HEIGHT) * 100}%`,
      height: `${((bandBottom - bandTop) / GAME_HEIGHT) * 100}%`,
      pointerEvents: 'none', zIndex: '1', cursor: 'crosshair',
    } as CSSStyleDeclaration);
    catcher.addEventListener('pointerdown', (e: PointerEvent) => {
      e.stopPropagation();
      const rect = catcher.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const lx = ((e.clientX - rect.left) / rect.width) * GAME_WIDTH;
      const ly = bandTop + ((e.clientY - rect.top) / rect.height) * (bandBottom - bandTop);
      this.onFieldTap(lx, ly);
    });
    this.deployCatcher = catcher;
    this.container.appendChild(catcher);

    // ===== TOP HUD =====
    const top = document.createElement('div');
    Object.assign(top.style, {
      position: 'absolute', top: '8px', left: '10px', right: '10px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: '10px', pointerEvents: 'none',
    } as CSSStyleDeclaration);

    // ── LEFT: Base Argentina ──
    const left = document.createElement('div');
    left.className = 'mil-panel';
    Object.assign(left.style, { padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px', width: '34%', maxWidth: '300px', boxSizing: 'border-box' } as CSSStyleDeclaration);
    left.appendChild(this.emblem(`${UI}/emblem-flag.png`, 34));
    {
      const col = document.createElement('div'); col.style.flex = '1';
      col.appendChild(this.label('BASE ARGENTINA', '#7db4ff'));
      const bar = this.bar('fill-ally');
      this.allyFill = bar.fill; this.allyVal = bar.val;
      col.appendChild(bar.el);
      left.appendChild(col);
    }

    // ── CENTER: Moral + Oleada + Suministros ──
    const center = document.createElement('div');
    Object.assign(center.style, { display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '2px' } as CSSStyleDeclaration);

    // Medallón de moral
    const med = document.createElement('div'); med.className = 'mil-medallion';
    this.moraleRing = document.createElement('div'); this.moraleRing.className = 'ring';
    const mlabel = document.createElement('div'); mlabel.innerText = 'MORAL'; Object.assign(mlabel.style, { fontSize: '7px', fontWeight: '700', letterSpacing: '1px', color: '#cdb46a' } as CSSStyleDeclaration);
    this.moraleText = document.createElement('div'); this.moraleText.innerText = '70%'; Object.assign(this.moraleText.style, { fontFamily: 'var(--font-title)', fontSize: '17px', color: '#fff', lineHeight: '1', textShadow: '0 1px 2px #000' } as CSSStyleDeclaration);
    med.appendChild(this.moraleRing); med.appendChild(mlabel); med.appendChild(this.moraleText);
    center.appendChild(med);

    // Oleada + pips
    const waveCol = document.createElement('div');
    Object.assign(waveCol.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' } as CSSStyleDeclaration);
    waveCol.appendChild(this.label('OLEADA', '#cdb46a', 'center'));
    this.wavePipsEl = document.createElement('div'); this.wavePipsEl.className = 'wave-pips';
    waveCol.appendChild(this.wavePipsEl);
    center.appendChild(waveCol);

    // Suministros chip
    const sup = document.createElement('div'); sup.className = 'res-chip';
    sup.appendChild(this.img(`${UI}/icon-sun.png`, 26));
    this.suppliesEl = document.createElement('span'); this.suppliesEl.className = 'num'; this.suppliesEl.innerText = '0';
    sup.appendChild(this.suppliesEl);
    center.appendChild(sup);

    // Bajas chip (chico)
    const kills = document.createElement('div'); kills.className = 'res-chip';
    const ks = this.img(`${UI}/icon-skull.png`, 20); ks.style.opacity = '0.85'; kills.appendChild(ks);
    this.killsEl = document.createElement('span'); this.killsEl.className = 'num'; this.killsEl.style.color = '#cbd5c0'; this.killsEl.style.fontSize = '16px'; this.killsEl.innerText = '0';
    kills.appendChild(this.killsEl);
    center.appendChild(kills);

    // ── RIGHT: Búnker enemigo ──
    const right = document.createElement('div');
    right.className = 'mil-panel';
    Object.assign(right.style, { padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px', width: '34%', maxWidth: '300px', boxSizing: 'border-box' } as CSSStyleDeclaration);
    {
      const col = document.createElement('div'); col.style.flex = '1';
      let enemyLabel = 'BÚNKER ENEMIGO';
      if (this.nodeType === 'boss') {
        const rs = this.scene.game.registry.get('runState');
        enemyLabel = rs && rs.operationId === 'op-hollow-town' ? 'TOTENKOPF' : rs && rs.operationId === 'op-iron-grave' ? 'LOCOMOTORA' : 'EL CORONEL';
      }
      col.appendChild(this.label(enemyLabel, '#ff8a7a', 'right'));
      const bar = this.bar('fill-enemy');
      this.enemyFill = bar.fill; this.enemyVal = bar.val;
      col.appendChild(bar.el);
      right.appendChild(col);
    }
    right.appendChild(this.emblem(`${UI}/icon-skull.png`, 34));

    top.appendChild(left);
    top.appendChild(center);
    top.appendChild(right);

    // ===== BOTTOM BAR =====
    const bottom = document.createElement('div');
    Object.assign(bottom.style, {
      position: 'absolute', bottom: '8px', left: '12px', right: '12px',
      display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '10px',
      boxSizing: 'border-box', pointerEvents: 'none',
    } as CSSStyleDeclaration);

    // Cartas (scroll horizontal)
    const deployRow = document.createElement('div');
    Object.assign(deployRow.style, { display: 'flex', gap: '6px', flex: '1 1 auto', minWidth: '0', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '4px', pointerEvents: 'auto' } as CSSStyleDeclaration);
    (deployRow.style as any).scrollbarWidth = 'thin';

    for (const unitId of this.deployable) {
      const def = UNIT_INDEX[unitId as keyof typeof UNIT_INDEX];
      if (!def) continue;
      this.cards[unitId] = this.buildCard(unitId, def, deployRow);
    }

    // Habilidades
    const abilRow = document.createElement('div');
    Object.assign(abilRow.style, { display: 'flex', gap: '10px', alignItems: 'flex-end', flexShrink: '0', pointerEvents: 'auto' } as CSSStyleDeclaration);
    for (const ab of ABILITY_DEFS) {
      this.abilityButtons[ab.id] = this.buildAbility(ab, abilRow);
    }

    bottom.appendChild(deployRow);
    bottom.appendChild(abilRow);

    this.container.appendChild(top);
    this.container.appendChild(bottom);
  }

  // ── builders ──
  private label(text: string, color: string, align: 'left' | 'right' | 'center' = 'left'): HTMLElement {
    const d = document.createElement('div'); d.innerText = text;
    Object.assign(d.style, { fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px', color, marginBottom: '3px', textAlign: align } as CSSStyleDeclaration);
    return d;
  }
  private img(src: string, size: number): HTMLImageElement {
    const i = document.createElement('img'); i.src = src; i.draggable = false;
    Object.assign(i.style, { width: `${size}px`, height: `${size}px`, objectFit: 'contain' } as CSSStyleDeclaration);
    i.onerror = () => { i.style.display = 'none'; };
    return i;
  }
  private emblem(src: string, size: number): HTMLImageElement {
    const i = this.img(src, size); i.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))'; i.style.flexShrink = '0';
    return i;
  }
  private bar(fillClass: string): { el: HTMLElement, fill: HTMLElement, val: HTMLElement } {
    const el = document.createElement('div'); el.className = 'mil-bar';
    const fill = document.createElement('div'); fill.className = `fill ${fillClass}`;
    const val = document.createElement('div'); val.className = 'val'; val.innerText = '0/0';
    el.appendChild(fill); el.appendChild(val);
    return { el, fill, val };
  }

  private buildCard(unitId: string, def: any, parent: HTMLElement): CardRef {
    const card = document.createElement('div'); card.className = 'glass-panel unit-card';
    Object.assign(card.style, {
      width: '80px', height: '106px', flexShrink: '0', position: 'relative', cursor: 'pointer',
      overflow: 'hidden', borderRadius: '5px', border: '2px solid #07090d',
      background: 'linear-gradient(180deg, #33402a 0%, #161c12 100%)',
      transition: 'transform 0.1s, box-shadow 0.1s', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 6px rgba(0,0,0,0.6)',
    } as CSSStyleDeclaration);
    card.onmousedown = () => card.style.transform = 'scale(0.95)';
    card.onmouseup = () => { card.style.transform = 'scale(1)'; this.onSelectCard(unitId); };
    card.onmouseleave = () => card.style.transform = 'scale(1)';

    const icon = document.createElement('img');
    const key = `unit-${unitId}`;
    try { icon.src = this.scene.textures.exists(key) ? this.scene.textures.getBase64(key) : `/assets/sprites/unit-${unitId}.png`; }
    catch (e) { icon.src = `/assets/sprites/unit-${unitId}.png`; }
    icon.draggable = false;
    Object.assign(icon.style, { position: 'absolute', top: '3px', left: '50%', transform: 'translateX(-50%)', height: '84px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))' } as CSSStyleDeclaration);

    // Coste (sol + número)
    const cost = document.createElement('div');
    Object.assign(cost.style, { position: 'absolute', top: '2px', left: '2px', display: 'flex', alignItems: 'center', gap: '2px', padding: '1px 4px 1px 2px', background: 'rgba(0,0,0,0.6)', borderRadius: '3px', zIndex: '3' } as CSSStyleDeclaration);
    const coin = this.img(`${UI}/icon-sun.png`, 13);
    const costEl = document.createElement('span'); costEl.innerText = String(def.cost);
    Object.assign(costEl.style, { fontFamily: 'var(--font-title)', fontSize: '12px', color: 'var(--primary)' } as CSSStyleDeclaration);
    cost.appendChild(coin); cost.appendChild(costEl);

    // Nombre
    const name = document.createElement('div'); name.innerText = def.name;
    Object.assign(name.style, { position: 'absolute', bottom: '5px', left: '0', width: '100%', boxSizing: 'border-box', padding: '2px', fontSize: '9px', fontWeight: '700', textAlign: 'center', color: '#fff', lineHeight: '1.05', background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 30%, rgba(0,0,0,0) 100%)', zIndex: '3' } as CSSStyleDeclaration);

    // Barra de carga (cooldown) abajo
    const chargeTrack = document.createElement('div');
    Object.assign(chargeTrack.style, { position: 'absolute', bottom: '0', left: '0', width: '100%', height: '4px', background: '#0a0c08', zIndex: '4' } as CSSStyleDeclaration);
    const chargeFill = document.createElement('div');
    Object.assign(chargeFill.style, { height: '100%', width: '100%', background: 'linear-gradient(90deg,#3b82f6,#7db4ff)', transition: 'width 0.1s linear' } as CSSStyleDeclaration);
    chargeTrack.appendChild(chargeFill);

    const cdOverlay = document.createElement('div');
    Object.assign(cdOverlay.style, { position: 'absolute', bottom: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(4,6,3,0.72)', transformOrigin: 'bottom', transform: 'scaleY(0)', pointerEvents: 'none', zIndex: '2' } as CSSStyleDeclaration);

    card.appendChild(icon); card.appendChild(cdOverlay); card.appendChild(cost); card.appendChild(name); card.appendChild(chargeTrack);
    parent.appendChild(card);
    return { el: card, costEl, cdOverlay, nameEl: name, chargeFill };
  }

  private buildAbility(ab: { id: string, label: string, icon: string, cost: number }, parent: HTMLElement): AbilityRef {
    const btn = document.createElement('div'); btn.className = 'glass-panel';
    Object.assign(btn.style, {
      width: '88px', height: '78px', position: 'relative', cursor: 'pointer', overflow: 'hidden',
      borderRadius: '5px', border: '2px solid #07090d', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start', paddingTop: '4px', gap: '2px',
      background: 'linear-gradient(180deg, #3a3326 0%, #16140d 100%)',
      transition: 'transform 0.1s, box-shadow 0.1s', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 6px rgba(0,0,0,0.6)',
    } as CSSStyleDeclaration);
    btn.onmousedown = () => btn.style.transform = 'scale(0.95)';
    btn.onmouseup = () => { btn.style.transform = 'scale(1)'; this.onSelectAbility(ab.id); };
    btn.onmouseleave = () => btn.style.transform = 'scale(1)';

    btn.appendChild(this.img(ab.icon, 38));
    const lab = document.createElement('div'); lab.innerText = ab.label;
    Object.assign(lab.style, { fontSize: '9px', fontWeight: '700', color: '#fff', textAlign: 'center' } as CSSStyleDeclaration);
    btn.appendChild(lab);
    const cost = document.createElement('div');
    Object.assign(cost.style, { display: 'flex', alignItems: 'center', gap: '2px' } as CSSStyleDeclaration);
    cost.appendChild(this.img(`${UI}/icon-sun.png`, 12));
    const costEl = document.createElement('span'); costEl.innerText = String(ab.cost);
    Object.assign(costEl.style, { fontFamily: 'var(--font-title)', fontSize: '12px', color: 'var(--primary)' } as CSSStyleDeclaration);
    cost.appendChild(costEl); btn.appendChild(cost);

    const chargeTrack = document.createElement('div');
    Object.assign(chargeTrack.style, { position: 'absolute', bottom: '0', left: '0', width: '100%', height: '4px', background: '#0a0c08', zIndex: '4' } as CSSStyleDeclaration);
    const chargeFill = document.createElement('div');
    Object.assign(chargeFill.style, { height: '100%', width: '100%', background: 'linear-gradient(90deg,#d97706,#fbbf24)', transition: 'width 0.1s linear' } as CSSStyleDeclaration);
    chargeTrack.appendChild(chargeFill);

    const cdOverlay = document.createElement('div');
    Object.assign(cdOverlay.style, { position: 'absolute', bottom: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(4,6,3,0.72)', transformOrigin: 'bottom', transform: 'scaleY(0)', pointerEvents: 'none', zIndex: '2' } as CSSStyleDeclaration);

    btn.appendChild(cdOverlay); btn.appendChild(chargeTrack);
    parent.appendChild(btn);
    return { el: btn, costEl, cdOverlay, chargeFill };
  }

  // ─────────────────────────────────────────────────────────
  public update(state: {
    supplies: number; killCount: number;
    allyHp: number; allyMaxHp: number; enemyHp: number; enemyMaxHp: number;
    cooldowns: Map<string, number>; morale: number;
    roster?: any[]; deployedSoldierIds?: Set<string>;
    unitCosts?: Map<string, number>; deployCooldowns?: Map<string, number>;
    wave?: { current: number; total: number };
  }) {
    this.suppliesEl.innerText = Math.floor(state.supplies).toString();
    this.killsEl.innerText = state.killCount.toString();

    // Moral (medallón con anillo)
    const m = Math.max(0, Math.min(100, Math.ceil(state.morale)));
    const mcol = m > 50 ? '#fbbf24' : m > 25 ? '#f97316' : '#ef4444';
    this.moraleText.innerText = `${m}%`;
    this.moraleText.style.color = mcol;
    this.moraleRing.style.background = `conic-gradient(${mcol} ${m * 3.6}deg, rgba(0,0,0,0.5) 0)`;

    // HP barras
    const aPct = Math.max(0, state.allyHp / state.allyMaxHp);
    this.allyFill.style.width = `${aPct * 100}%`;
    this.allyVal.innerText = `${Math.ceil(state.allyHp)}/${state.allyMaxHp}`;
    const ePct = Math.max(0, state.enemyHp / state.enemyMaxHp);
    this.enemyFill.style.width = `${ePct * 100}%`;
    this.enemyVal.innerText = `${Math.ceil(state.enemyHp)}/${state.enemyMaxHp}`;

    // Oleada pips
    this.updateWavePips(state.wave);

    // Cartas
    for (const [unitId, card] of Object.entries(this.cards)) {
      const def = UNIT_INDEX[unitId as keyof typeof UNIT_INDEX];
      let available = 0, total = 0;
      if (state.roster && state.deployedSoldierIds) {
        const cls = state.roster.filter(s => s.unitId === unitId && s.status === 'ready');
        total = cls.length;
        available = total - cls.filter(s => state.deployedSoldierIds!.has(s.id)).length;
      }
      card.nameEl.innerText = `${def.name} (${available})`;
      const cost = state.unitCosts?.get(unitId) ?? def.cost;
      card.costEl.innerText = String(cost);
      const affordable = state.supplies >= cost && available > 0;
      card.costEl.style.color = affordable ? 'var(--primary)' : '#ef4444';

      const cd = state.cooldowns.get(unitId) ?? 0;
      const cooldownMax = state.deployCooldowns?.get(unitId) ?? def.deployCooldown;
      const pct = cd > 0 ? Math.min(1, cd / cooldownMax) : 0;
      card.cdOverlay.style.transform = `scaleY(${pct})`;
      card.chargeFill.style.width = `${(1 - pct) * 100}%`;
      card.chargeFill.style.background = cd > 0 ? 'linear-gradient(90deg,#475569,#94a3b8)' : 'linear-gradient(90deg,#3b82f6,#7db4ff)';
      if (this.selectedUnitId !== unitId) card.el.style.opacity = (cd > 0 || !affordable) ? '0.62' : '1';
    }

    // Habilidades
    for (const ab of ABILITY_DEFS) {
      const ref = this.abilityButtons[ab.id];
      const affordable = state.supplies >= ab.cost;
      ref.costEl.style.color = affordable ? 'var(--primary)' : '#ef4444';
      const cd = state.cooldowns.get(ab.id) ?? 0;
      const pct = cd > 0 ? cd / ab.cd : 0;
      ref.cdOverlay.style.transform = `scaleY(${pct})`;
      ref.chargeFill.style.width = `${(1 - pct) * 100}%`;
      if (this.selectedAbilityId !== ab.id) ref.el.style.opacity = (cd > 0 || !affordable) ? '0.62' : '1';
    }
  }

  private updateWavePips(wave?: { current: number; total: number }) {
    let key: string;
    if (this.nodeType === 'boss') key = 'boss';
    else if (!wave) key = 'none';
    else key = `${wave.current}/${wave.total}`;
    if (key === this.lastWaveKey) return;
    this.lastWaveKey = key;
    this.wavePipsEl.innerHTML = '';
    if (this.nodeType === 'boss') {
      const p = document.createElement('div'); p.className = 'pip boss on'; this.wavePipsEl.appendChild(p);
      return;
    }
    const total = wave ? Math.max(1, wave.total) : 5;
    const cur = wave ? wave.current : 0;
    for (let i = 1; i <= total; i++) {
      const p = document.createElement('div');
      p.className = 'pip' + (i <= cur ? ' on' : '');
      this.wavePipsEl.appendChild(p);
    }
  }

  public setSelectedUnit(unitId: string | null) {
    this.selectedUnitId = unitId;
    this.selectedAbilityId = null;
    this.deployCatcher.style.pointerEvents = unitId ? 'auto' : 'none';
    for (const b of Object.values(this.abilityButtons)) { b.el.style.outline = 'none'; b.el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 6px rgba(0,0,0,0.6)'; }
    for (const [id, c] of Object.entries(this.cards)) {
      if (id === unitId) { c.el.style.outline = '2px solid #fbbf24'; c.el.style.boxShadow = '0 0 14px rgba(251,191,36,0.9)'; c.el.style.opacity = '1'; }
      else { c.el.style.outline = 'none'; c.el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 6px rgba(0,0,0,0.6)'; }
    }
  }

  public setSelectedAbility(abilityId: string | null) {
    this.selectedAbilityId = abilityId;
    this.selectedUnitId = null;
    this.deployCatcher.style.pointerEvents = abilityId ? 'auto' : 'none';
    for (const c of Object.values(this.cards)) { c.el.style.outline = 'none'; c.el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 6px rgba(0,0,0,0.6)'; }
    for (const [id, b] of Object.entries(this.abilityButtons)) {
      if (id === abilityId) { b.el.style.outline = '2px solid #ef4444'; b.el.style.boxShadow = '0 0 14px rgba(239,68,68,0.9)'; b.el.style.opacity = '1'; }
      else { b.el.style.outline = 'none'; b.el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 6px rgba(0,0,0,0.6)'; }
    }
  }

  public clearSelection() { this.setSelectedUnit(null); this.setSelectedAbility(null); }

  public flashSupplies() {
    this.suppliesEl.style.color = '#ef4444';
    this.scene.tweens.add({ targets: this.suppliesEl, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true,
      onComplete: () => { this.suppliesEl.style.color = 'var(--primary)'; this.suppliesEl.style.scale = '1'; } });
  }

  public destroy() { this.container.innerHTML = ''; }
}
