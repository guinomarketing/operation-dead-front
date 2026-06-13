/**
 * BattleScene — Escena principal de combate. Visual overhaul completo.
 * Integra todos los módulos de rendering para producir una experiencia
 * visual de calidad producción mobile.
 */
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FIELD } from '../utils/constants';
import { COLORS, hex, FONTS } from '../ui/colors';
import { BattleSystem, type Combatant } from '../systems/BattleSystem';
import { UNIT_INDEX } from '../data/units';
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

  constructor() {
    super('Battle');
  }

  create(): void {
    this.sim = new BattleSystem();
    this.renderers.clear();
    this.cooldowns.clear();
    this.killCount = 0;

    // Generate all textures
    SpriteFactory.ensureTextures(this);

    // Build the scene layers (order matters for depth)
    this.drawBattlefieldBackground();
    this.drawBases();
    this.startAmbientParticles();
    this.ui = new BattleUI((unitId) => this.tryDeploy(unitId));
    this.drawVignette();

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

  private tryDeploy(unitId: string): void {
    const def = UNIT_INDEX[unitId as keyof typeof UNIT_INDEX];
    const cd = this.cooldowns.get(unitId) ?? 0;
    if (cd > 0) return;
    if (!this.sim.canAfford(unitId)) {
      return;
    }
    const c = this.sim.spawnAlly(unitId);
    if (c) {
      this.cooldowns.set(unitId, def.deployCooldown);
      this.spawnUnit(c);
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

    // Cooldowns
    for (const [id, ms] of this.cooldowns) {
      const next = ms - delta;
      this.cooldowns.set(id, next <= 0 ? 0 : next);
    }

    this.sim.update(delta);

    // Process battle events for visual effects
    for (const ev of this.sim.pendingEvents) {
      if (ev.type === 'death') {
        if (ev.faction === 'enemy') {
          this.killCount++;
          this.spawnGreenSmoke(Phaser.Math.Between(300, 480), FIELD.LANES_Y[Phaser.Math.Between(0, 2)]);
        } else {
          this.spawnBloodSplat(Phaser.Math.Between(50, 200), FIELD.LANES_Y[Phaser.Math.Between(0, 2)]);
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
      cooldowns: this.cooldowns
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
}
