/**
 * BattleScene — Escena principal de combate. Visual overhaul completo.
 * Integra todos los módulos de rendering para producir una experiencia
 * visual de calidad producción mobile.
 */
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FIELD, BASES } from '../utils/constants';
import { COLORS, hex, FONTS } from '../ui/colors';
import { BattleSystem, type BattleEvent, type Combatant } from '../systems/BattleSystem';
import { UNIT_INDEX } from '../data/units';
import { ABILITY_INDEX } from '../data/abilities';
import { SpriteFactory } from '../rendering/SpriteFactory';
import { UnitRenderer } from '../rendering/UnitRenderer';
import { BattleUI } from '../ui/BattleUI';
import { Audio2 } from '../systems/AudioSystem';
import { MetaProgression } from '../systems/MetaProgression';
import { OPERATION_INDEX } from '../data/operations';
import { BOSS_INDEX } from '../data/bosses';

// ── Layout constants ──────────────────────────────────────

/** Unidades desplegables (las 12 unidades argentinas). */
export const DEPLOYABLE = [
  'rifleman', 'heavy-gunner', 'medic', 'engineer', 'sniper', 'flamethrower',
  'bombero', 'cientifica', 'veterano', 'gaucho', 'colectivero', 'electricista',
] as const;

export class BattleScene extends Phaser.Scene {
  private sim!: BattleSystem;
  private renderers = new Map<number, UnitRenderer>();

  private cooldowns = new Map<string, number>();
  private killCount = 0;

  // HUD elements
  private ui!: BattleUI;

  // Ambient
  private ashTimer?: Phaser.Time.TimerEvent;
  private vignette!: Phaser.GameObjects.Graphics;

  private deployedSoldierIds = new Set<string>();
  private uidToSoldierId = new Map<number, string>();

  // Selección y apuntado (MVP 0.2+)
  private selectedUnitId: string | null = null;
  private activeAbilityId: string | null = null;
  private deployIndicators!: Phaser.GameObjects.Graphics;

  // Pausa e interfaz de pausa
  private isPaused = false;
  private pauseOverlay: HTMLElement | null = null;

  constructor() {
    super('Battle');
  }

  create(data?: { nodeType?: string; battleMode?: string }): void {
    const runState = this.game.registry.get('runState');
    const activeUpgrades = runState ? runState.upgradeIds : [];
    const baseHp = runState ? runState.baseHp : BASES.ALLY_HP;

    const nodeType = data?.nodeType || 'battle';
    const battleMode = data?.battleMode || 'assault';
    const operationId = runState?.operationId || 'op-first-light';
    const bossId = OPERATION_INDEX[operationId]?.bossId;
    const battleSeed = `${runState?.seed || 'preview'}:${runState?.currentNodeId || nodeType}`;

    const activeRelics = runState ? (runState.relicIds || []) : [];
    this.sim = new BattleSystem(baseHp, activeUpgrades, nodeType as any, battleMode as any, bossId, operationId, battleSeed, activeRelics);
    this.applyBossPreviewHp(nodeType);

    if (runState) {
      this.sim.morale = this.sim.getBattleStartMorale(runState.morale);
      if (runState.suppliesBonusNextBattle) {
        this.sim.supplies += runState.suppliesBonusNextBattle;
        runState.suppliesBonusNextBattle = 0; // consumir bono
        this.game.registry.set('runState', runState);
      }
    }

    this.renderers.clear();
    this.cooldowns.clear();
    this.killCount = 0;
    this.selectedUnitId = null;
    this.activeAbilityId = null;
    this.deployedSoldierIds.clear();
    this.uidToSoldierId.clear();

    // Generate all textures
    SpriteFactory.ensureTextures(this);

    // Deploy indicators
    this.deployIndicators = this.add.graphics();
    this.deployIndicators.setDepth(450);

    // Build the scene layers (order matters for depth)
    this.drawBattlefieldBackground();
    this.drawBases();
    this.startAmbientParticles();
    const deployable: string[] = (runState && runState.unlockedUnitIds && runState.unlockedUnitIds.length)
      ? runState.unlockedUnitIds
      : [...DEPLOYABLE];
    this.ui = new BattleUI(
      this,
      (unitId) => this.selectUnit(unitId),
      (abilityId) => this.selectAbility(abilityId),
      nodeType,
      deployable,
      (lx, ly) => this.handleBattlefieldClick(lx, ly),
      () => this.togglePause()
    );
    this.drawVignette();

    // Tecla ESC para pausar/reanudar
    this.input.keyboard?.on('keydown-ESC', () => {
      this.togglePause();
    });

    // Limpiar el overlay de pausa si la escena se destruye externamente
    this.events.once('shutdown', () => {
      if (this.pauseOverlay) {
        this.pauseOverlay.remove();
        this.pauseOverlay = null;
      }
    });

    // Clics en el campo de batalla
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleBattlefieldClick(pointer.x, pointer.y);
    });

    // Camera fade in
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // Música de combate
    Audio2.unlock();
    Audio2.playMusic('combat');

    // ── Dev demo (solo pruebas): ?demo=1 despliega un escuadrón inicial ──
    const isDemo = new URLSearchParams(window.location.search).get('demo') === '1';
    if (isDemo) {
      this.time.delayedCall(300, () => this.devDemoDeploy());
    }

    // ── Tutorial: solo en el primer combate normal, una vez ──
    if (!isDemo && nodeType === 'battle' && !MetaProgression.isTutorialDone()) {
      this.time.delayedCall(650, () => this.showTutorial());
    }

    if (nodeType === 'boss') {
      const bossDef = BOSS_INDEX[bossId || 'general-eisenfaust'] || BOSS_INDEX['general-eisenfaust'];
      this.time.delayedCall(800, () => {
        this.cameras.main.flash(400, 150, 0, 0);
        this.cameras.main.shake(400, 0.01);
        const splash = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, bossDef.name.toUpperCase(), {
          fontFamily: FONTS.title,
          fontSize: '32px',
          color: '#ef4444',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 5
        }).setOrigin(0.5).setDepth(880);

        const sub = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, bossDef.title, {
          fontFamily: FONTS.body,
          fontSize: '16px',
          color: '#ffffff',
          fontStyle: 'italic',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(880);

        this.tweens.add({
          targets: [splash, sub],
          alpha: 0,
          delay: 2000,
          duration: 800,
          onComplete: () => {
            splash.destroy();
            sub.destroy();
          }
        });
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  BACKGROUND LAYERS
  // ═══════════════════════════════════════════════════════════

  private drawBattlefieldBackground(): void {
    // Color base por si el asset no cubre / mientras carga
    this.cameras.main.setBackgroundColor('#0d100c');

    const runState = this.game.registry.get('runState');
    const backgroundKey = runState?.operationId === 'op-hollow-town'
      ? 'battlefield-town'
      : runState?.operationId === 'op-iron-grave'
        ? 'battlefield-ironworks'
        : 'battlefield';
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, backgroundKey);
    bg.setDepth(-100);
    // Cover-scale: cubre la pantalla sin deformar (recorta el excedente).
    const cover = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
    bg.setScale(cover);

    // Oscurecer apenas la zona de combate para que las unidades resalten,
    // sin tapar la ilustración del fondo. (Sin líneas de carril fijas: el suelo
    // plano + el escalado por profundidad ya comunican los carriles; el resaltado
    // de carril aparece solo al desplegar.)
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0d0a, 0.12);
    dim.setDepth(-95);
  }

  // ═══════════════════════════════════════════════════════════
  //  BASES
  // ═══════════════════════════════════════════════════════════

  private drawBases(): void {
    // El fondo 16:9 (battlefield.jpg) ya trae la trinchera argentina a la izquierda
    // y el búnker enemigo a la derecha pintados como parte de la ilustración.
    // Las "bases" son zonas de daño numéricas en FIELD (ALLY_BASE_X / ENEMY_BASE_X),
    // no necesitan sprites encima. Reforzamos con un sutil resplandor de zona.
    const allyGlow = this.add.ellipse(FIELD.ALLY_BASE_X, FIELD.CENTER_Y, 90, 280, 0x6bd0ff, 0.05);
    allyGlow.setDepth(-80);
    const enemyGlow = this.add.ellipse(FIELD.ENEMY_BASE_X, FIELD.CENTER_Y, 110, 300, 0x5ee03a, 0.06);
    enemyGlow.setDepth(-80);
  }

  // ═══════════════════════════════════════════════════════════
  //  AMBIENT PARTICLES
  // ═══════════════════════════════════════════════════════════

  private startAmbientParticles(): void {
    // Falling ash/embers
    this.ashTimer = this.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(0, GAME_WIDTH);
        const isEmber = Math.random() < 0.15;
        const size = isEmber ? Phaser.Math.Between(2, 4) : Phaser.Math.Between(1, 3);
        const color = isEmber ? COLORS.ember : COLORS.ash;
        const alpha = isEmber ? Phaser.Math.FloatBetween(0.4, 0.8) : Phaser.Math.FloatBetween(0.1, 0.3);

        const particle = this.add.rectangle(x, -5, size, size, color, alpha);
        particle.setDepth(500);

        this.tweens.add({
          targets: particle,
          x: x + Phaser.Math.Between(-40, 40),
          y: GAME_HEIGHT + 10,
          alpha: 0,
          angle: Phaser.Math.Between(-90, 90),
          duration: Phaser.Math.Between(3000, 6000),
          onComplete: () => particle.destroy(),
        });
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  VIGNETTE & POLISH
  // ═══════════════════════════════════════════════════════════

  private drawVignette(): void {
    this.vignette = this.add.graphics();
    this.vignette.setDepth(900);

    // Top vignette
    for (let i = 0; i < 5; i++) {
      this.vignette.fillStyle(0x000000, 0.15 - i * 0.03);
      this.vignette.fillRect(0, 0, GAME_WIDTH, 20 - i * 3);
    }
    // Bottom vignette
    for (let i = 0; i < 5; i++) {
      this.vignette.fillStyle(0x000000, 0.2 - i * 0.04);
      this.vignette.fillRect(0, GAME_HEIGHT - 20 + i * 3, GAME_WIDTH, 20 - i * 3);
    }
    // Left vignette
    for (let i = 0; i < 4; i++) {
      this.vignette.fillStyle(0x000000, 0.1 - i * 0.025);
      this.vignette.fillRect(0, 0, 15 - i * 3, GAME_HEIGHT);
    }
    // Right vignette
    for (let i = 0; i < 4; i++) {
      this.vignette.fillStyle(0x000000, 0.1 - i * 0.025);
      this.vignette.fillRect(GAME_WIDTH - 15 + i * 3, 0, 15 - i * 3, GAME_HEIGHT);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  INPUT
  // ═══════════════════════════════════════════════════════════

  private selectUnit(unitId: string): void {
    Audio2.play('uiClick');
    const cd = this.cooldowns.get(unitId) ?? 0;
    if (cd > 0) return;
    if (!this.sim.canAfford(unitId)) {
      this.ui.flashSupplies();
      return;
    }

    const runState = this.game.registry.get('runState');
    const roster = runState ? runState.roster : [];
    const available = roster.filter((s: any) => s.unitId === unitId && s.status === 'ready' && !this.deployedSoldierIds.has(s.id)).length;
    if (available <= 0) {
      return;
    }

    if (this.selectedUnitId === unitId) {
      this.selectedUnitId = null;
      this.ui.setSelectedUnit(null);
    } else {
      this.selectedUnitId = unitId;
      this.activeAbilityId = null;
      this.ui.setSelectedUnit(unitId); // ya limpia visuals de habilidades + activa el catcher
    }
  }

  private selectAbility(abilityId: string): void {
    Audio2.play('uiClick');
    const cd = this.cooldowns.get(abilityId) ?? 0;
    if (cd > 0) return;
    const def = ABILITY_INDEX[abilityId];
    if (!def || this.sim.supplies < def.cost) {
      this.ui.flashSupplies();
      return;
    }

    if (this.activeAbilityId === abilityId) {
      this.activeAbilityId = null;
      this.ui.setSelectedAbility(null);
    } else {
      this.activeAbilityId = abilityId;
      this.selectedUnitId = null;
      this.ui.setSelectedAbility(abilityId); // ya limpia visuals de cartas + activa el catcher
    }
  }

  private handleBattlefieldClick(x: number, y: number): void {
    if (this.isPaused) return;
    if (this.selectedUnitId) {
      // Zona desplegable: banda del battlefield (con un pequeño margen vertical).
      const top = FIELD.LANES_Y[0] - 50;
      const bottom = FIELD.LANES_Y[FIELD.LANES_Y.length - 1] + 50;
      if (y >= top && y <= bottom) {
        const lane = FIELD.laneFromY(y);
        this.tryDeployInLane(this.selectedUnitId, lane);
        this.selectedUnitId = null;
        this.ui.setSelectedUnit(null);
      } else {
        this.selectedUnitId = null;
        this.ui.setSelectedUnit(null);
      }
    } else if (this.activeAbilityId) {
      this.useCommanderAbility(this.activeAbilityId, x, y);
      this.activeAbilityId = null;
      this.ui.setSelectedAbility(null);
    }
  }

  private tryDeployInLane(unitId: string, lane: number): void {
    const runState = this.game.registry.get('runState');
    if (!runState || !runState.roster) return;

    // Buscar el primer recluta disponible de esta clase
    const soldier = runState.roster.find((s: any) => 
      s.unitId === unitId && 
      s.status === 'ready' && 
      !this.deployedSoldierIds.has(s.id)
    );

    if (!soldier) {
      return; // No quedan soldados de esta clase
    }

    if (!this.sim.canAfford(unitId)) {
      this.ui.flashSupplies();
      return;
    }

    const c = this.sim.spawnAlly(unitId, lane, soldier);
    if (c) {
      this.deployedSoldierIds.add(soldier.id);
      this.cooldowns.set(unitId, this.sim.getDeployCooldown(unitId));
      this.spawnUnit(c);
      this.spawnDeployPuff(FIELD.SPAWN_ALLY_X, FIELD.LANES_Y[lane]);
      Audio2.play('deploy');
    }
  }

  /** Tutorial de onboarding: secuencia de globos que se tocan para avanzar. */
  private showTutorial(): void {
    const layer = document.getElementById('ui-layer');
    if (!layer) return;
    const steps = [
      '🪖 DESPLEGAR — Tocá una carta de unidad (abajo) y después un carril del campo para soltar a tu soldado. Cada unidad cuesta SUMINISTROS (se generan solos con el tiempo).',
      '⚔️ COMBATE — Tus unidades avanzan y atacan solas, formando el frente. Empujá la línea hasta destruir el BÚNKER ENEMIGO (derecha).',
      '🇦🇷 NO CAIGAS — Arriba ves la vida de tu BASE (izquierda), la MORAL (centro) y el búnker enemigo (derecha). Si tu base o tu moral llegan a 0, perdés.',
      '💥 HABILIDADES — Abajo a la derecha tenés Ataque Aéreo y Botiquín. Usalas en el momento justo para dar vuelta una oleada.',
      '★ PROGRESO — Ganá medallas para desbloquear nuevas unidades argentinas entre partidas. ¡Aguante la Patagonia, a pelear!',
    ];
    let i = 0;
    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      position: 'absolute', inset: '0', zIndex: '250', pointerEvents: 'auto',
      background: 'rgba(5,7,5,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    } as Partial<CSSStyleDeclaration> as CSSStyleDeclaration);

    const panel = document.createElement('div');
    panel.className = 'mil-panel';
    Object.assign(panel.style, { maxWidth: '440px', width: '82%', padding: '18px 20px', textAlign: 'center', boxSizing: 'border-box' } as CSSStyleDeclaration);
    const title = document.createElement('div');
    title.innerText = 'CÓMO SE JUEGA';
    Object.assign(title.style, { fontFamily: 'var(--font-title)', fontSize: '16px', color: 'var(--primary)', marginBottom: '8px', letterSpacing: '1px' } as CSSStyleDeclaration);
    const body = document.createElement('div');
    Object.assign(body.style, { fontSize: '14px', color: '#e5e7eb', lineHeight: '1.5', minHeight: '84px' } as CSSStyleDeclaration);
    const dots = document.createElement('div');
    Object.assign(dots.style, { marginTop: '8px', fontSize: '12px', color: 'var(--primary)' } as CSSStyleDeclaration);
    const hint = document.createElement('div');
    Object.assign(hint.style, { marginTop: '6px', fontSize: '11px', color: '#9aa08c' } as CSSStyleDeclaration);
    panel.appendChild(title); panel.appendChild(body); panel.appendChild(dots); panel.appendChild(hint);
    wrap.appendChild(panel);

    const renderStep = () => {
      body.innerText = steps[i];
      dots.innerText = steps.map((_, k) => (k === i ? '●' : '○')).join(' ');
      hint.innerText = i < steps.length - 1 ? 'Tocá para continuar  ›' : 'Tocá para empezar  ⚔';
    };
    wrap.onclick = () => {
      Audio2.play('uiClick');
      i++;
      if (i >= steps.length) { MetaProgression.setTutorialDone(); wrap.remove(); return; }
      renderStep();
    };
    renderStep();
    layer.appendChild(wrap);
  }

  /** Dev-only: despliega un escuadrón inicial repartido en carriles para capturas. */
  private devDemoDeploy(): void {
    this.sim.supplies = 800; // presupuesto de demo
    const plan: Array<[string, number]> = [
      ['gaucho', 0],
      ['heavy-gunner', 1],
      ['veterano', 2],
      ['sniper', 3],
      ['flamethrower', 1],
      ['bombero', 2],
      ['cientifica', 3],
      ['colectivero', 0],
    ];
    for (const [unitId, lane] of plan) {
      this.cooldowns.set(unitId, 0);
      this.tryDeployInLane(unitId, lane);
    }
  }

  private applyBossPreviewHp(nodeType: string): void {
    if (nodeType !== 'boss') return;
    const hpParam = new URLSearchParams(window.location.search).get('bossHpPct');
    if (!hpParam) return;

    const hpPct = Phaser.Math.Clamp(Number(hpParam), 1, 99) / 100;
    const boss = this.sim.combatants.find((c) => c.faction === 'enemy' && c.defId === this.sim.bossId);
    if (!boss || Number.isNaN(hpPct)) return;

    boss.hp = Math.max(1, Math.floor(boss.maxHp * hpPct));
    this.sim.enemyBaseHp = boss.hp;
  }

  private spawnDeployPuff(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      const size = Phaser.Math.Between(4, 8);
      const puff = this.add.circle(
        x + Phaser.Math.Between(-10, 10),
        y + 15,
        size,
        0x888877, // ash color
        0.3
      );
      puff.setDepth(y + 10);
      this.tweens.add({
        targets: puff,
        y: y - Phaser.Math.Between(10, 30),
        x: puff.x + Phaser.Math.Between(-15, 15),
        alpha: 0,
        scale: 1.8,
        duration: Phaser.Math.Between(300, 600),
        onComplete: () => puff.destroy()
      });
    }
  }

  private useCommanderAbility(abilityId: string, x: number, y: number): void {
    const def = ABILITY_INDEX[abilityId];
    if (!def || this.sim.supplies < def.cost) {
      this.ui.flashSupplies();
      return;
    }

    let cd = def.cooldown;
    if (this.sim.activeUpgrades.includes('war-room-1')) {
      cd = Math.round(cd * 0.8);
    }

    this.cooldowns.set(abilityId, cd);
    this.sim.supplies -= def.cost;

    if (abilityId === 'airstrike') {
      const crossG = this.add.graphics();
      crossG.setDepth(800);
      
      this.tweens.add({
        targets: crossG,
        alpha: { from: 0.8, to: 0.2 },
        duration: 200,
        yoyo: true,
        repeat: 4,
        onUpdate: () => {
          crossG.clear();
          crossG.lineStyle(2, 0xc0432d, crossG.alpha);
          crossG.strokeCircle(x, y, 60);
          crossG.strokeCircle(x, y, 140);
          crossG.lineBetween(x - 160, y, x + 160, y);
          crossG.lineBetween(x, y - 160, x, y + 160);
        },
        onComplete: () => {
          crossG.destroy();
          // Shadow plane flying
          const bomber = this.add.rectangle(-100, y - 50, 80, 40, 0x000000, 0.4);
          bomber.setDepth(810);
          this.tweens.add({
            targets: bomber,
            x: GAME_WIDTH + 100,
            duration: 600,
            onComplete: () => {
              bomber.destroy();
              this.sim.castAirstrike(x);
              this.triggerAirstrikeExplosion(x, y);
            }
          });
        }
      });
    } else if (abilityId === 'medkit') {
      const healG = this.add.graphics();
      healG.setDepth(790);
      
      this.tweens.add({
        targets: healG,
        alpha: { from: 0.7, to: 0 },
        duration: 800,
        onUpdate: () => {
          healG.clear();
          healG.fillStyle(0x7bbf4a, healG.alpha * 0.3);
          healG.fillCircle(x, y, 120);
          healG.lineStyle(3, 0x7bbf4a, healG.alpha);
          healG.strokeCircle(x, y, 120);
        },
        onComplete: () => {
          healG.destroy();
        }
      });

      for (let i = 0; i < 8; i++) {
        const hx = x + Phaser.Math.Between(-100, 100);
        const hy = y + Phaser.Math.Between(-80, 80);
        const plus = this.add.text(hx, hy, '+', {
          fontFamily: FONTS.ui,
          fontSize: '20px',
          color: '#44ff88',
          fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(800);
        
        this.tweens.add({
          targets: plus,
          y: hy - 40,
          alpha: 0,
          duration: 1000,
          onComplete: () => plus.destroy()
        });
      }

      this.sim.castMedkit(x);
    }
  }

  private triggerAirstrikeExplosion(x: number, y: number): void {
    Audio2.play('explosion');
    this.cameras.main.shake(300, 0.015);
    
    const flash = this.add.circle(x, y, 140, 0xffaa44, 0.8);
    flash.setDepth(850);
    this.tweens.add({
      targets: flash,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 350,
      onComplete: () => flash.destroy()
    });

    for (let i = 0; i < 18; i++) {
      const size = Phaser.Math.Between(6, 14);
      const color = Math.random() < 0.3 ? 0xffffff : (Math.random() < 0.5 ? 0xff5500 : 0xffaa00);
      const spark = this.add.rectangle(x, y, size, size, color, 0.9);
      spark.setDepth(860);
      
      const angle = Math.random() * Math.PI * 2;
      const dist = Phaser.Math.Between(40, 160);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(400, 800),
        onComplete: () => spark.destroy()
      });
    }
  }

  

  // ═══════════════════════════════════════════════════════════
  //  UNIT MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  private spawnUnit(c: Combatant): void {
    const renderer = new UnitRenderer(this, c);
    this.renderers.set(c.uid, renderer);
    if (c.soldierId) {
      this.uidToSoldierId.set(c.uid, c.soldierId);
    }
  }

  private syncUnits(delta: number): void {
    const live = new Set<number>();

    for (const c of this.sim.combatants) {
      live.add(c.uid);
      let r = this.renderers.get(c.uid);
      if (!r) {
        this.spawnUnit(c);
        r = this.renderers.get(c.uid)!;
      }
      r.update(c, delta);
    }

    // Remove dead units
    for (const [uid, r] of this.renderers) {
      if (!live.has(uid)) {
        r.playDeath(() => {
          this.renderers.delete(uid);
        });
        this.renderers.delete(uid);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  EFFECTS
  // ═══════════════════════════════════════════════════════════

  private spawnMuzzleFlash(x: number, y: number, facingRight: boolean): void {
    const dir = facingRight ? 1 : -1;
    const flashX = x + dir * 20;

    // Core flash
    const core = this.add.rectangle(flashX, y - 5, 6, 6, COLORS.muzzleCore, 0.9);
    core.setDepth(y + 5);
    this.tweens.add({
      targets: core,
      alpha: 0, scaleX: 2, scaleY: 2,
      duration: 80,
      onComplete: () => core.destroy(),
    });

    // Outer glow
    const glow = this.add.rectangle(flashX + dir * 3, y - 5, 10, 4, COLORS.muzzleFlash, 0.7);
    glow.setDepth(y + 4);
    this.tweens.add({
      targets: glow,
      alpha: 0, scaleX: 1.5,
      duration: 120,
      onComplete: () => glow.destroy(),
    });

    // Sparks
    for (let i = 0; i < 3; i++) {
      const spark = this.add.rectangle(
        flashX, y - 5, 2, 2, COLORS.fireGlow,
        Phaser.Math.FloatBetween(0.5, 0.9)
      );
      spark.setDepth(y + 3);
      this.tweens.add({
        targets: spark,
        x: flashX + dir * Phaser.Math.Between(8, 25),
        y: y - 5 + Phaser.Math.Between(-10, 10),
        alpha: 0,
        duration: Phaser.Math.Between(100, 200),
        onComplete: () => spark.destroy(),
      });
    }
  }

  private spawnBountyText(x: number, y: number, amount: number): void {
    const text = this.add.text(x, y - 20, `+${amount}`, {
      fontFamily: FONTS.ui,
      fontSize: '14px',
      color: hex(COLORS.textBounty),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(900);

    this.tweens.add({
      targets: text,
      y: y - 55,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  private spawnBloodSplat(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      const size = Phaser.Math.Between(2, 5);
      const splat = this.add.circle(x, y, size, COLORS.blood, 0.7);
      splat.setDepth(y + 2);
      this.tweens.add({
        targets: splat,
        x: x + Phaser.Math.Between(-15, 15),
        y: y + Phaser.Math.Between(-10, 10),
        alpha: 0,
        scale: 0.3,
        duration: Phaser.Math.Between(300, 600),
        onComplete: () => splat.destroy(),
      });
    }
  }

  private spawnGreenSmoke(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const smoke = this.add.circle(
        x + Phaser.Math.Between(-8, 8),
        y + Phaser.Math.Between(-5, 5),
        Phaser.Math.Between(4, 10),
        COLORS.serumGlow,
        0.2
      );
      smoke.setDepth(y + 2);
      this.tweens.add({
        targets: smoke,
        y: y - Phaser.Math.Between(15, 35),
        alpha: 0,
        scale: 2,
        duration: Phaser.Math.Between(500, 900),
        onComplete: () => smoke.destroy(),
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  GAME LOOP
  // ═══════════════════════════════════════════════════════════

  private triggerBossPhaseFx(ev: BattleEvent): void {
    const x = ev.x ?? FIELD.SPAWN_ENEMY_X;
    const y = ev.y ?? FIELD.CENTER_Y;
    const color = this.bossAccentColor(ev.defId);
    this.renderers.get(ev.uid ?? -1)?.playBossPhaseShift(ev.phaseIndex ?? 1);
    this.cameras.main.shake(500, 0.012);

    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, color, 0.20);
    flash.setDepth(870);
    this.tweens.add({ targets: flash, alpha: 0, duration: 760, onComplete: () => flash.destroy() });

    this.spawnBossGroundRing(x, y - 54, color, 80, 980);
    this.spawnBossAlert(this.bossPhaseLabel(ev.defId, ev.phaseIndex), color);
  }

  private triggerBossAbilityFx(ev: BattleEvent): void {
    this.renderers.get(ev.uid ?? -1)?.playBossAbilityCue(ev.abilityId);
    const x = ev.x ?? FIELD.SPAWN_ENEMY_X;
    const y = ev.y ?? FIELD.CENTER_Y;

    if (ev.abilityId === 'summon') {
      this.cameras.main.shake(160, 0.004);
      for (const laneY of FIELD.LANES_Y) this.spawnDeployPuff(FIELD.SPAWN_ENEMY_X, laneY);
      this.spawnFloatingLabel('REFUERZOS', FIELD.SPAWN_ENEMY_X - 24, y - 52, 0xffcc66);
      return;
    }

    if (ev.abilityId === 'mutate') {
      this.spawnBossGroundRing(x, y - 34, COLORS.serumGlow, 44, 640);
      this.spawnGreenSmoke(x, y - 32);
      this.spawnFloatingLabel('MUTACION', x, y - 72, COLORS.serumGlow);
      return;
    }

    if (ev.abilityId === 'heal-zone') {
      Audio2.play('heal');
      this.spawnBossGroundRing(x, y - 48, COLORS.serumGlow, 110, 860);
      for (let i = 0; i < 8; i++) {
        this.spawnFloatingLabel('+', x + Phaser.Math.Between(-85, 85), y - 46 + Phaser.Math.Between(-34, 34), COLORS.textHeal, 16);
      }
      return;
    }

    if (ev.abilityId === 'cannon') {
      this.triggerBossCannonFx(ev);
    }
  }

  private triggerBossCannonFx(ev: BattleEvent): void {
    const targetX = ev.x ?? GAME_WIDTH * 0.35;
    const targetY = ev.y ?? FIELD.CENTER_Y;
    const boss = this.sim.combatants.find((c) => c.uid === ev.uid);
    const sourceX = boss?.x ?? FIELD.SPAWN_ENEMY_X;
    const sourceY = boss ? FIELD.LANES_Y[boss.lane] - 92 : targetY - 80;

    Audio2.play('explosion');
    this.cameras.main.shake(240, 0.010);

    const trail = this.add.graphics().setDepth(845);
    trail.lineStyle(5, COLORS.fireGlow, 0.78);
    trail.lineBetween(sourceX, sourceY, targetX, targetY - 36);
    this.tweens.add({ targets: trail, alpha: 0, duration: 180, onComplete: () => trail.destroy() });

    const blast = this.add.circle(targetX, targetY - 28, 58, COLORS.fireGlow, 0.55).setDepth(850);
    this.tweens.add({
      targets: blast,
      scale: 1.45,
      alpha: 0,
      duration: 360,
      onComplete: () => blast.destroy(),
    });

    for (let i = 0; i < 10; i++) {
      const spark = this.add.rectangle(targetX, targetY - 28, 5, 5, i % 2 ? COLORS.ember : COLORS.impact, 0.9).setDepth(860);
      const angle = Math.random() * Math.PI * 2;
      const dist = Phaser.Math.Between(22, 82);
      this.tweens.add({
        targets: spark,
        x: targetX + Math.cos(angle) * dist,
        y: targetY - 28 + Math.sin(angle) * dist,
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(260, 560),
        onComplete: () => spark.destroy(),
      });
    }
  }

  private spawnBossGroundRing(x: number, y: number, color: number, radius: number, duration: number): void {
    const ring = this.add.graphics().setDepth(y + 95);
    ring.alpha = 1;
    this.tweens.add({
      targets: ring,
      alpha: 0,
      duration,
      onUpdate: () => {
        const p = 1 - ring.alpha;
        ring.clear();
        ring.fillStyle(color, ring.alpha * 0.10);
        ring.fillCircle(x, y, radius + p * 34);
        ring.lineStyle(4, color, ring.alpha * 0.85);
        ring.strokeCircle(x, y, radius + p * 58);
      },
      onComplete: () => ring.destroy(),
    });
  }

  private spawnBossAlert(text: string, color: number): void {
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 104, text, {
      fontFamily: FONTS.title,
      fontSize: '28px',
      color: hex(color),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(880);
    this.tweens.add({
      targets: txt,
      y: GAME_HEIGHT / 2 - 150,
      alpha: 0,
      delay: 980,
      duration: 650,
      onComplete: () => txt.destroy(),
    });
  }

  private spawnFloatingLabel(text: string, x: number, y: number, color: number, fontSize = 13): void {
    const label = this.add.text(x, y, text, {
      fontFamily: FONTS.ui,
      fontSize: `${fontSize}px`,
      color: hex(color),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(880);
    this.tweens.add({
      targets: label,
      y: y - 34,
      alpha: 0,
      duration: 720,
      ease: 'Power2',
      onComplete: () => label.destroy(),
    });
  }

  private bossAccentColor(defId?: string): number {
    if (defId === 'doctor-totenkopf') return COLORS.serumGlow;
    if (defId === 'panzer-corpse-engine') return COLORS.fireGlow;
    return COLORS.hpBad;
  }

  private bossPhaseLabel(defId?: string, phaseIndex = 1): string {
    if (defId === 'doctor-totenkopf') return phaseIndex >= 2 ? 'AUTOINYECCION' : 'PRUEBAS ACELERADAS';
    if (defId === 'panzer-corpse-engine') return 'MOTOR EXPUESTO';
    return phaseIndex >= 2 ? 'FURIA DE METAL' : 'AURA DE COMANDO';
  }

  update(_time: number, delta: number): void {
    if (this.isPaused) return;
    if (this.sim.outcome !== 'ongoing') return;

    // Sincronizar combatientes
    this.syncUnits(delta);

    // Refrescar HUD
    this.refreshHud();

    // Indicadores de carril cuando hay una unidad seleccionada:
    // banda translúcida a lo ancho (elegí carril) + marcador en la trinchera.
    this.deployIndicators.clear();
    if (this.selectedUnitId) {
      const pulse = 0.10 + Math.sin(this.time.now * 0.006) * 0.04;
      const fieldRight = FIELD.ENEMY_BASE_X - 60;
      for (const y of FIELD.LANES_Y) {
        // banda sutil del carril
        this.deployIndicators.fillStyle(0x7bbf4a, pulse);
        this.deployIndicators.fillRect(FIELD.SPAWN_ALLY_X - 24, y - 18, fieldRight - (FIELD.SPAWN_ALLY_X - 24), 36);
        // marcador de despliegue (trinchera)
        this.deployIndicators.fillStyle(0x9be060, 0.22 + Math.sin(this.time.now * 0.012) * 0.10);
        this.deployIndicators.fillRoundedRect(FIELD.SPAWN_ALLY_X - 26, y - 20, 52, 40, 8);
        this.deployIndicators.lineStyle(2, 0x33aa22, 0.5);
        this.deployIndicators.strokeRoundedRect(FIELD.SPAWN_ALLY_X - 26, y - 20, 52, 40, 8);
      }
    }

    // Cooldowns
    for (const [id, ms] of this.cooldowns) {
      const next = ms - delta;
      this.cooldowns.set(id, next <= 0 ? 0 : next);
    }

    this.sim.update(delta);

    // Process battle events for visual effects
    for (const ev of this.sim.pendingEvents) {
      if (ev.type === 'death') {
        const lastLane = FIELD.LANES_Y.length - 1;
        const ex = ev.x !== undefined ? ev.x : (ev.faction === 'enemy' ? Phaser.Math.Between(FIELD.ENEMY_BASE_X - 250, FIELD.ENEMY_BASE_X) : Phaser.Math.Between(FIELD.ALLY_BASE_X, FIELD.ALLY_BASE_X + 250));
        const ey = ev.y !== undefined ? ev.y : FIELD.LANES_Y[Phaser.Math.Between(0, lastLane)];
        
        if (ev.faction === 'enemy') {
          this.killCount++;
          if (ev.defId === 'general-eisenfaust') {
            this.triggerBossDeathExplosion(ex, ey);
          } else if (ev.defId === 'exploder') {
            this.triggerExploderExplosion(ex, ey);
          } else {
            this.spawnGreenSmoke(ex, ey);
            Audio2.play('enemyDeath');
          }
        } else {
          this.spawnBloodSplat(ex, ey);
          Audio2.play('allyDeath');
          if (ev.uid && this.uidToSoldierId.has(ev.uid)) {
            const soldierId = this.uidToSoldierId.get(ev.uid);
            const runState = this.game.registry.get('runState');
            if (runState && runState.roster && soldierId) {
              const rosterSoldier = runState.roster.find((s: any) => s.id === soldierId);
              if (rosterSoldier) {
                rosterSoldier.status = 'dead';
                console.log(`Soldier ${rosterSoldier.name} "${rosterSoldier.nickname}" has died in battle.`);
              }
            }
          }
        }
      }
      if (ev.type === 'bounty' && ev.amount) {
        const lane = Phaser.Math.Between(0, FIELD.LANES_Y.length - 1);
        this.spawnBountyText(Phaser.Math.Between(GAME_WIDTH * 0.45, GAME_WIDTH * 0.7), FIELD.LANES_Y[lane], ev.amount);
      }
      if (ev.type === 'base-hit') {
        if (ev.amount === 999) {
          this.triggerBossPhaseFx(ev);
          continue;
        }
        if (ev.abilityId === 'cannon') {
          this.triggerBossAbilityFx(ev);
          continue;
        }
        if (ev.amount === 999) {
          // Boss phase transition
          this.cameras.main.shake(500, 0.012);
          const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0.25);
          flash.setDepth(870);
          this.tweens.add({ targets: flash, alpha: 0, duration: 800, onComplete: () => flash.destroy() });
          
          const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '¡JEFE ENFURECIDO!', {
            fontFamily: FONTS.title,
            fontSize: '28px',
            color: '#ff3333',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
          }).setOrigin(0.5).setDepth(880);
          this.tweens.add({
            targets: txt,
            y: GAME_HEIGHT / 2 - 150,
            alpha: 0,
            delay: 1200,
            duration: 800,
            onComplete: () => txt.destroy()
          });
        } else if (ev.faction === 'ally') {
          this.cameras.main.shake(150, 0.005);
          // Screen edge flash
          const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.hpBad, 0.08);
          flash.setDepth(850);
          this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
          if (ev.amount && ev.amount > 0) Audio2.play('baseHit');
        } else if (ev.faction === 'enemy') {
          this.cameras.main.shake(80, 0.003);
        }
      }
      if (ev.type === 'heal') {
        if (ev.faction === 'enemy' && ev.abilityId) {
          this.triggerBossAbilityFx(ev);
          continue;
        }
        if (ev.faction === 'enemy' && ev.amount === 888) {
          this.cameras.main.shake(200, 0.006);
          this.spawnDeployPuff(FIELD.SPAWN_ENEMY_X, FIELD.LANES_Y[0]);
          this.spawnDeployPuff(FIELD.SPAWN_ENEMY_X, FIELD.LANES_Y[1]);
          this.spawnDeployPuff(FIELD.SPAWN_ENEMY_X, FIELD.LANES_Y[2]);
        } else if (ev.faction === 'ally') {
          Audio2.play('heal');
        }
      }
    }

    // Handle attack visuals - check for units that just attacked
    for (const c of this.sim.combatants) {
      if (c.alive && c.attackCooldown > c.attackInterval - 50 && c.attackCooldown < c.attackInterval) {
        // This unit just attacked (cooldown was just reset)
        const r = this.renderers.get(c.uid);
        if (r) {
          r.playAttack();
          // Muzzle flash for ranged units (a la altura del arma)
          if (c.range > 30) {
            const y = FIELD.LANES_Y[c.lane] - 34;
            this.spawnMuzzleFlash(c.x, y, c.faction === 'ally');
            if (c.faction === 'ally') Audio2.play('shoot');
          }
        }
      }
    }

    this.syncUnits(delta);
    this.refreshHud();

    if (this.sim.outcome !== 'ongoing') {
      this.endBattle(this.sim.outcome);
    }
  }

  private refreshHud(): void {
    const runState = this.game.registry.get('runState');
    const roster = runState ? runState.roster : [];
    const unitCosts = new Map<string, number>();
    const deployCooldowns = new Map<string, number>();
    for (const unitId of Object.keys(UNIT_INDEX)) {
      unitCosts.set(unitId, this.sim.getUnitCost(unitId));
      deployCooldowns.set(unitId, this.sim.getDeployCooldown(unitId));
    }

    this.ui.update({
      supplies: this.sim.supplies,
      killCount: this.killCount,
      allyHp: this.sim.allyBaseHp,
      allyMaxHp: this.sim.allyBaseMaxHp,
      enemyHp: this.sim.enemyBaseHp,
      enemyMaxHp: this.sim.enemyBaseMaxHp,
      cooldowns: this.cooldowns,
      morale: this.sim.morale,
      roster,
      deployedSoldierIds: this.deployedSoldierIds,
      unitCosts,
      deployCooldowns,
      wave: this.sim.nodeType === 'boss'
        ? undefined
        : { current: this.sim.waveSys.state.currentWave, total: this.sim.waveSys.state.totalWaves },
    });
  }

  private endBattle(outcome: 'won' | 'lost'): void {
    Audio2.play(outcome === 'won' ? 'victory' : 'defeat');
    // Persist HP and Morale back to RunState
    const runState = this.game.registry.get('runState');
    if (runState) {
      runState.baseHp = this.sim.allyBaseHp;
      runState.morale = this.sim.morale;

      if (outcome === 'won' && runState.roster) {
        // Distribuir XP y ascensos a los sobrevivientes desplegados
        this.sim.combatants.forEach((c: any) => {
          if (c.faction === 'ally' && c.alive && c.soldierId) {
            const soldier = runState.roster.find((s: any) => s.id === c.soldierId);
            if (soldier && soldier.status === 'ready') {
              let xpGained = 15; // Bono de supervivencia
              const killsThisBattle = c.kills || 0;
              xpGained += killsThisBattle * 5; // Bono de bajas

              soldier.xp += xpGained;
              if (soldier.kills === undefined) {
                soldier.kills = 0;
              }
              soldier.kills += killsThisBattle;

              // Calcular nivel (XP acumulada, 100 XP por nivel, max 5)
              const oldLevel = soldier.level || 1;
              const newLevel = Math.min(5, 1 + Math.floor(soldier.xp / 100));
              if (newLevel > oldLevel) {
                soldier.level = newLevel;
                console.log(`¡ASCENSO! ${soldier.name} subió al nivel ${newLevel}!`);
              }
            }
          }
        });
      }

      // Purgar definitivamente del plantel a los soldados muertos
      if (runState.roster) {
        runState.roster = runState.roster.filter((s: any) => s.status !== 'dead');
      }

      this.game.registry.set('runState', runState);
    }

    // Dramatic pause
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // Cleanup ambient timer
        this.ashTimer?.destroy();
        this.ui.destroy();
        this.scene.start('Result', { outcome, nodeType: this.sim.nodeType });
      });
    });
  }

  private triggerExploderExplosion(x: number, y: number): void {
    Audio2.play('explosion');
    this.cameras.main.shake(150, 0.006);
    
    // Toxic flash
    const flash = this.add.circle(x, y, 70, 0x33ff11, 0.6);
    flash.setDepth(y + 10);
    this.tweens.add({
      targets: flash,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });

    // Spawning 8-10 green smoke particles
    for (let i = 0; i < 10; i++) {
      const size = Phaser.Math.Between(8, 16);
      const smoke = this.add.circle(
        x + Phaser.Math.Between(-15, 15),
        y + Phaser.Math.Between(-10, 10),
        size,
        0x5ee03a, // serum
        0.3
      );
      smoke.setDepth(y + 15);
      this.tweens.add({
        targets: smoke,
        y: y - Phaser.Math.Between(20, 50),
        x: smoke.x + Phaser.Math.Between(-20, 20),
        alpha: 0,
        scale: 1.8,
        duration: Phaser.Math.Between(600, 1000),
        onComplete: () => smoke.destroy()
      });
    }
  }

  private triggerBossDeathExplosion(x: number, y: number): void {
    // Massive screen shake
    this.cameras.main.shake(800, 0.02);
    
    // Multiple delayed explosions
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 120, () => {
        const bx = x + Phaser.Math.Between(-30, 30);
        const by = y + Phaser.Math.Between(-30, 30);
        this.triggerAirstrikeExplosion(bx, by);
      });
    }

    // Huge toxic/blood cloud
    const cloud = this.add.circle(x, y, 90, 0x9c2424, 0.7);
    cloud.setDepth(y + 10);
    this.tweens.add({
      targets: cloud,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 1000,
      onComplete: () => cloud.destroy()
    });
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Pausar relojes, tweens y animaciones en Phaser
      this.time.paused = true;
      this.tweens.pauseAll();
      this.anims.pauseAll();

      // Deseleccionar cartas de unidad/habilidad para evitar glitches visuales
      this.selectedUnitId = null;
      this.activeAbilityId = null;
      this.ui.clearSelection();

      // Crear el overlay modal HTML
      const uiLayer = document.getElementById('ui-layer');
      if (uiLayer) {
        const overlay = document.createElement('div');
        overlay.className = 'glass-panel';
        Object.assign(overlay.style, {
          position: 'absolute',
          inset: '50px 80px',
          background: 'rgba(15,18,15,0.95)',
          zIndex: '300',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 25px',
          boxSizing: 'border-box',
          border: '2px solid var(--panel-border)',
          boxShadow: '5px 5px 0px rgba(0,0,0,0.8)'
        } as CSSStyleDeclaration);

        // Header
        const header = document.createElement('div');
        Object.assign(header.style, {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #3f3f3f',
          paddingBottom: '8px',
          marginBottom: '15px'
        } as CSSStyleDeclaration);

        const titleSpan = document.createElement('div');
        titleSpan.innerHTML = `<span style="font-family:var(--font-title); font-size:22px; color:var(--primary);">BATALLA EN PAUSA</span>`;
        header.appendChild(titleSpan);
        overlay.appendChild(header);

        // Content
        const content = document.createElement('div');
        Object.assign(content.style, {
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          flex: '1'
        } as CSSStyleDeclaration);

        // Slider Música
        const musicRow = document.createElement('div');
        musicRow.innerHTML = `<div style="font-family:var(--font-title); font-size:13px; color:#aaa; margin-bottom:4px;">VOLUMEN MÚSICA</div>`;
        const musicSliderContainer = document.createElement('div');
        Object.assign(musicSliderContainer.style, { display: 'flex', alignItems: 'center', gap: '15px' });

        const musicSlider = document.createElement('input');
        musicSlider.type = 'range';
        musicSlider.min = '0';
        musicSlider.max = '100';
        musicSlider.value = Math.round(Audio2.musicVolume * 100).toString();
        musicSlider.style.flex = '1';
        musicSlider.style.accentColor = 'var(--primary)';

        const musicVal = document.createElement('span');
        Object.assign(musicVal.style, { fontFamily: 'var(--font-title)', fontSize: '15px', width: '40px', textAlign: 'right' });
        musicVal.innerText = `${musicSlider.value}%`;

        musicSlider.oninput = () => {
          const v = parseInt(musicSlider.value);
          musicVal.innerText = `${v}%`;
          Audio2.setMusicVolume(v / 100);
        };

        musicSliderContainer.appendChild(musicSlider);
        musicSliderContainer.appendChild(musicVal);
        musicRow.appendChild(musicSliderContainer);
        content.appendChild(musicRow);

        // Slider SFX
        const sfxRow = document.createElement('div');
        sfxRow.innerHTML = `<div style="font-family:var(--font-title); font-size:13px; color:#aaa; margin-bottom:4px;">VOLUMEN EFECTOS (SFX)</div>`;
        const sfxSliderContainer = document.createElement('div');
        Object.assign(sfxSliderContainer.style, { display: 'flex', alignItems: 'center', gap: '15px' });

        const sfxSlider = document.createElement('input');
        sfxSlider.type = 'range';
        sfxSlider.min = '0';
        sfxSlider.max = '100';
        sfxSlider.value = Math.round(Audio2.sfxVolume * 100).toString();
        sfxSlider.style.flex = '1';
        sfxSlider.style.accentColor = 'var(--primary)';

        const sfxVal = document.createElement('span');
        Object.assign(sfxVal.style, { fontFamily: 'var(--font-title)', fontSize: '15px', width: '40px', textAlign: 'right' });
        sfxVal.innerText = `${sfxSlider.value}%`;

        let lastPlay = 0;
        sfxSlider.oninput = () => {
          const v = parseInt(sfxSlider.value);
          sfxVal.innerText = `${v}%`;
          Audio2.setSfxVolume(v / 100);

          const now = Date.now();
          if (now - lastPlay > 85) {
            Audio2.play('uiClick');
            lastPlay = now;
          }
        };

        sfxSliderContainer.appendChild(sfxSlider);
        sfxSliderContainer.appendChild(sfxVal);
        sfxRow.appendChild(sfxSliderContainer);
        content.appendChild(sfxRow);

        // Mute
        const muteRow = document.createElement('div');
        Object.assign(muteRow.style, { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '5px' });

        const muteCheckbox = document.createElement('input');
        muteCheckbox.type = 'checkbox';
        muteCheckbox.id = 'pause-cfg-mute';
        muteCheckbox.checked = Audio2.muted;
        muteCheckbox.style.width = '18px';
        muteCheckbox.style.height = '18px';
        muteCheckbox.style.cursor = 'pointer';
        muteCheckbox.style.accentColor = 'var(--primary)';

        const muteLabel = document.createElement('label');
        muteLabel.htmlFor = 'pause-cfg-mute';
        muteLabel.innerText = 'SILENCIAR TODO';
        Object.assign(muteLabel.style, { fontFamily: 'var(--font-title)', fontSize: '13px', cursor: 'pointer' });

        muteCheckbox.onchange = () => {
          Audio2.toggleMute();
          Audio2.play('uiClick');
        };

        muteRow.appendChild(muteCheckbox);
        muteRow.appendChild(muteLabel);
        content.appendChild(muteRow);

        overlay.appendChild(content);

        // Footer / Botones
        const footer = document.createElement('div');
        Object.assign(footer.style, {
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '15px',
          gap: '15px'
        } as CSSStyleDeclaration);

        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'btn-primary';
        resumeBtn.innerText = 'REANUDAR';
        Object.assign(resumeBtn.style, { flex: '1', fontSize: '14px', padding: '10px 15px' });
        resumeBtn.onclick = () => {
          Audio2.play('uiClick');
          this.togglePause();
        };

        const retreatBtn = document.createElement('button');
        retreatBtn.className = 'btn-primary';
        retreatBtn.innerText = 'RETIRARSE';
        Object.assign(retreatBtn.style, {
          flex: '1',
          fontSize: '14px',
          padding: '10px 15px',
          background: '#c0392b',
          color: '#fff',
          border: '2px solid #5a1410'
        });
        retreatBtn.onclick = () => {
          Audio2.play('uiClick');
          overlay.remove();
          this.pauseOverlay = null;
          this.isPaused = false;
          // Reanudar antes de terminar la batalla para evitar que se quede congelado
          this.time.paused = false;
          this.tweens.resumeAll();
          this.anims.resumeAll();
          this.endBattle('lost');
        };

        footer.appendChild(resumeBtn);
        footer.appendChild(retreatBtn);
        overlay.appendChild(footer);

        uiLayer.appendChild(overlay);
        this.pauseOverlay = overlay;
      }
    } else {
      // Reanudar Phaser
      this.time.paused = false;
      this.tweens.resumeAll();
      this.anims.resumeAll();

      // Remover overlay
      if (this.pauseOverlay) {
        this.pauseOverlay.remove();
        this.pauseOverlay = null;
      }
    }
  }
}
