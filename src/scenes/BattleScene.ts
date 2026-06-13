/**
 * BattleScene — Escena principal de combate. Visual overhaul completo.
 * Integra todos los módulos de rendering para producir una experiencia
 * visual de calidad producción mobile.
 */
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FIELD, BASES } from '../utils/constants';
import { COLORS, hex, FONTS } from '../ui/colors';
import { BattleSystem, type Combatant } from '../systems/BattleSystem';
import { UNIT_INDEX } from '../data/units';
import { ABILITY_INDEX } from '../data/abilities';
import { SpriteFactory } from '../rendering/SpriteFactory';
import { UnitRenderer } from '../rendering/UnitRenderer';
import { BattleUI } from '../ui/BattleUI';

// ── Layout constants ──────────────────────────────────────

/** Unidades desplegables en MVP 0.2 */
export const DEPLOYABLE = ['rifleman', 'heavy-gunner', 'medic', 'engineer', 'sniper', 'flamethrower'] as const;

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

  // Selección y apuntado (MVP 0.2+)
  private selectedUnitId: string | null = null;
  private activeAbilityId: string | null = null;
  private deployIndicators!: Phaser.GameObjects.Graphics;

  constructor() {
    super('Battle');
  }

  create(): void {
    const activeUpgrades = this.game.registry.get('upgrades') || [];
    this.sim = new BattleSystem(BASES.ALLY_HP, activeUpgrades);
    this.renderers.clear();
    this.cooldowns.clear();
    this.killCount = 0;
    this.selectedUnitId = null;
    this.activeAbilityId = null;

    // Generate all textures
    SpriteFactory.ensureTextures(this);

    // Deploy indicators
    this.deployIndicators = this.add.graphics();
    this.deployIndicators.setDepth(450);

    // Build the scene layers (order matters for depth)
    this.drawBattlefieldBackground();
    this.drawBases();
    this.startAmbientParticles();
    this.ui = new BattleUI(
      this,
      (unitId) => this.selectUnit(unitId),
      (abilityId) => this.selectAbility(abilityId)
    );
    this.drawVignette();

    // Clics en el campo de batalla
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleBattlefieldClick(pointer.x, pointer.y);
    });

    // Camera fade in
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  // ═══════════════════════════════════════════════════════════
  //  BACKGROUND LAYERS
  // ═══════════════════════════════════════════════════════════

  private drawBattlefieldBackground(): void {
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'battlefield');
    bg.setDepth(-100);
    bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // Dibujar caminos visuales para los carriles
    const pathG = this.add.graphics();
    pathG.setDepth(-90);
    for (const y of FIELD.LANES_Y) {
      // Sendero de tierra marrón
      pathG.fillStyle(0x3a2d1e, 0.4); 
      pathG.fillRect(0, y - 18, GAME_WIDTH, 36);

      // Bordes del sendero (tierra más oscura)
      pathG.fillStyle(0x1a1610, 0.3);
      pathG.fillRect(0, y - 20, GAME_WIDTH, 2);
      pathG.fillRect(0, y + 18, GAME_WIDTH, 2);

      // Postes pequeños decorativos a los lados
      pathG.fillStyle(0x111111, 0.4);
      for (let px = 20; px < GAME_WIDTH; px += 80) {
        pathG.fillRect(px, y - 24, 2, 6);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  BASES
  // ═══════════════════════════════════════════════════════════

  private drawBases(): void {
    this.drawAllyBase();
    this.drawEnemyBase();
  }

  private drawAllyBase(): void {
    const x = FIELD.ALLY_BASE_X;
    const cy = 550;

    // Dibujar el búnker aliado
    const bunker = this.add.image(x, cy, 'ally-bunker');
    bunker.setDepth(100);
    bunker.setDisplaySize(120, 120);

    // HQ label
    this.add.text(x, cy - 70, 'HQ', {
      fontFamily: FONTS.title,
      fontSize: '18px',
      color: hex(COLORS.ink),
      stroke: hex(0x000000),
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(101);
  }

  private drawEnemyBase(): void {
    const x = FIELD.ENEMY_BASE_X;
    const cy = 550;

    // Dibujar el búnker enemigo
    const bunker = this.add.image(x, cy, 'enemy-bunker');
    bunker.setDepth(100);
    bunker.setDisplaySize(120, 120);
    bunker.setFlipX(true); // Orientar el bastión hacia la izquierda

    // REICH label con brillo
    this.add.text(x, cy - 70, 'REICH', {
      fontFamily: FONTS.title,
      fontSize: '14px',
      color: hex(COLORS.serum),
      stroke: hex(0x000000),
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(101);
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
    const cd = this.cooldowns.get(unitId) ?? 0;
    if (cd > 0) return;
    if (!this.sim.canAfford(unitId)) {
      this.ui.flashSupplies();
      return;
    }

    if (this.selectedUnitId === unitId) {
      this.selectedUnitId = null;
      this.ui.setSelectedUnit(null);
    } else {
      this.selectedUnitId = unitId;
      this.activeAbilityId = null;
      this.ui.setSelectedUnit(unitId);
      this.ui.setSelectedAbility(null);
    }
  }

  private selectAbility(abilityId: string): void {
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
      this.ui.setSelectedAbility(abilityId);
      this.ui.setSelectedUnit(null);
    }
  }

  private handleBattlefieldClick(x: number, y: number): void {
    if (this.selectedUnitId) {
      // Si hace click dentro de la zona de combate vertical
      if (y >= 420 && y <= 680) {
        let lane = 1;
        if (y < 505) lane = 0;
        else if (y >= 580) lane = 2;

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
    const def = UNIT_INDEX[unitId as keyof typeof UNIT_INDEX];
    if (!this.sim.canAfford(unitId)) {
      this.ui.flashSupplies();
      return;
    }
    const c = this.sim.spawnAlly(unitId, lane);
    if (c) {
      this.cooldowns.set(unitId, def.deployCooldown);
      this.spawnUnit(c);
      this.spawnDeployPuff(FIELD.SPAWN_ALLY_X, FIELD.LANES_Y[lane]);
    }
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

  update(_time: number, delta: number): void {
    if (this.sim.outcome !== 'ongoing') return;

    // Sincronizar combatientes
    this.syncUnits(delta);

    // Refrescar HUD
    this.refreshHud();

    // Dibujar indicadores de carril si hay unidad seleccionada
    this.deployIndicators.clear();
    if (this.selectedUnitId) {
      const pulse = 0.4 + Math.sin(this.time.now * 0.015) * 0.15;
      this.deployIndicators.fillStyle(0x7bbf4a, pulse);
      for (const y of FIELD.LANES_Y) {
        this.deployIndicators.fillRoundedRect(FIELD.SPAWN_ALLY_X - 30, y - 20, 60, 40, 6);
        this.deployIndicators.lineStyle(2, 0x33aa22, pulse + 0.2);
        this.deployIndicators.strokeRoundedRect(FIELD.SPAWN_ALLY_X - 30, y - 20, 60, 40, 6);
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
        const ex = ev.x !== undefined ? ev.x : (ev.faction === 'enemy' ? Phaser.Math.Between(300, 480) : Phaser.Math.Between(50, 200));
        const ey = ev.y !== undefined ? ev.y : FIELD.LANES_Y[Phaser.Math.Between(0, 2)];
        
        if (ev.faction === 'enemy') {
          this.killCount++;
          if (ev.defId === 'exploder') {
            this.triggerExploderExplosion(ex, ey);
          } else {
            this.spawnGreenSmoke(ex, ey);
          }
        } else {
          this.spawnBloodSplat(ex, ey);
        }
      }
      if (ev.type === 'bounty' && ev.amount) {
        this.spawnBountyText(Phaser.Math.Between(350, 450), FIELD.LANES_Y[Phaser.Math.Between(0, 2)], ev.amount);
      }
      if (ev.type === 'base-hit') {
        if (ev.faction === 'ally') {
          this.cameras.main.shake(150, 0.005);
          // Screen edge flash
          const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.hpBad, 0.08);
          flash.setDepth(850);
          this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
        } else if (ev.faction === 'enemy') {
          this.cameras.main.shake(80, 0.003);
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
          // Muzzle flash for ranged units
          if (c.range > 30) {
            const y = FIELD.LANES_Y[c.lane];
            this.spawnMuzzleFlash(c.x, y, c.faction === 'ally');
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
    this.ui.update({
      supplies: this.sim.supplies,
      killCount: this.killCount,
      allyHp: this.sim.allyBaseHp,
      allyMaxHp: this.sim.allyBaseMaxHp,
      enemyHp: this.sim.enemyBaseHp,
      enemyMaxHp: this.sim.enemyBaseMaxHp,
      cooldowns: this.cooldowns,
      morale: this.sim.morale
    });
  }

  private endBattle(outcome: 'won' | 'lost'): void {
    // Dramatic pause
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // Cleanup ambient timer
        this.ashTimer?.destroy();
        this.ui.destroy();
        this.scene.start('Result', { outcome });
      });
    });
  }

  private triggerExploderExplosion(x: number, y: number): void {
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
}
