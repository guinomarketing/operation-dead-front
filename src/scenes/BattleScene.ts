/**
 * BattleScene — Escena principal de combate. Visual overhaul completo.
 * Integra todos los módulos de rendering para producir una experiencia
 * visual de calidad producción mobile.
 */
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FIELD, SPAWN_MVP01 } from '../utils/constants';
import { COLORS, hex, FONTS } from '../ui/colors';
import { BattleSystem, type Combatant } from '../systems/BattleSystem';
import { UNIT_INDEX } from '../data/units';
import { SpriteFactory } from '../rendering/SpriteFactory';
import { UnitRenderer } from '../rendering/UnitRenderer';

// ── Layout constants ──────────────────────────────────────
const HUD_HEIGHT = 110;
const DEPLOY_PANEL_TOP = GAME_HEIGHT - 200;

/** Unidades desplegables en MVP 0.1 */
const DEPLOYABLE = ['rifleman'] as const;

export class BattleScene extends Phaser.Scene {
  private sim!: BattleSystem;
  private renderers = new Map<number, UnitRenderer>();

  private gruntTimer = 0;
  private cooldowns = new Map<string, number>();
  private killCount = 0;

  // HUD elements
  private suppliesText!: Phaser.GameObjects.Text;
  private allyHpBar!: Phaser.GameObjects.Rectangle;
  private allyHpText!: Phaser.GameObjects.Text;
  private enemyHpBar!: Phaser.GameObjects.Rectangle;
  private enemyHpText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;

  // Deploy cards
  private deployCards: Array<{
    container: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Graphics;
    cdOverlay: Phaser.GameObjects.Rectangle;
    unitId: string;
    costText: Phaser.GameObjects.Text;
    w: number;
    h: number;
  }> = [];

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
    this.gruntTimer = 0;

    // Generate all textures
    SpriteFactory.ensureTextures(this);

    // Build the scene layers (order matters for depth)
    this.drawBattlefieldBackground();
    this.drawBases();
    this.startAmbientParticles();
    this.buildHud();
    this.buildDeployBar();
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
  //  HUD
  // ═══════════════════════════════════════════════════════════

  private buildHud(): void {
    const hudDepth = 800;

    // Panel background
    const panel = this.add.graphics();
    panel.setDepth(hudDepth);
    // Gradient panel
    const panelSteps = 6;
    for (let i = 0; i < panelSteps; i++) {
      const t = i / panelSteps;
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(COLORS.panelTop),
        Phaser.Display.Color.IntegerToColor(COLORS.panelBot),
        100, Math.round(t * 100)
      );
      panel.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 0.92);
      panel.fillRect(0, i * (HUD_HEIGHT / panelSteps), GAME_WIDTH, HUD_HEIGHT / panelSteps + 1);
    }
    // Bottom border
    panel.fillStyle(COLORS.metalFrame, 0.6);
    panel.fillRect(0, HUD_HEIGHT - 2, GAME_WIDTH, 2);

    // ── Supplies ──
    // Supply icon (ammo box)
    const supIcon = this.add.graphics();
    supIcon.setDepth(hudDepth + 1);
    supIcon.fillStyle(COLORS.supplyIcon);
    supIcon.fillRoundedRect(16, 16, 18, 14, 3);
    supIcon.lineStyle(1, COLORS.goldDark, 0.8);
    supIcon.strokeRoundedRect(16, 16, 18, 14, 3);
    supIcon.fillStyle(COLORS.goldDark);
    supIcon.fillRect(22, 18, 6, 2);

    this.add.text(40, 14, 'SUPPLIES', {
      fontFamily: FONTS.ui,
      fontSize: '11px',
      color: hex(COLORS.inkDim),
    }).setDepth(hudDepth + 1);

    this.suppliesText = this.add.text(40, 28, '0', {
      fontFamily: FONTS.title,
      fontSize: '28px',
      color: hex(COLORS.gold),
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true },
    }).setDepth(hudDepth + 1);

    // ── Kill counter ──
    const skullIcon = this.add.graphics();
    skullIcon.setDepth(hudDepth + 1);
    skullIcon.fillStyle(COLORS.inkDim, 0.7);
    skullIcon.fillCircle(28, 68, 7);
    skullIcon.fillStyle(COLORS.panel);
    skullIcon.fillRect(24, 66, 3, 3);
    skullIcon.fillRect(30, 66, 3, 3);

    this.killText = this.add.text(40, 60, '0', {
      fontFamily: FONTS.ui,
      fontSize: '14px',
      color: hex(COLORS.inkDim),
      fontStyle: 'bold',
    }).setDepth(hudDepth + 1);

    // ── Ally HQ bar ──
    const barW = 200;
    const barH = 16;
    const barX = GAME_WIDTH - barW - 20;

    this.add.text(barX - 2, 14, 'HQ', {
      fontFamily: FONTS.ui,
      fontSize: '11px',
      color: hex(COLORS.hpAlly),
      fontStyle: 'bold',
    }).setOrigin(0, 0).setDepth(hudDepth + 1);

    // Star icon for ally
    const starG = this.add.graphics();
    starG.setDepth(hudDepth + 1);
    starG.fillStyle(COLORS.hpAlly, 0.8);
    starG.fillCircle(barX - 14, 38, 5);

    this.add.rectangle(barX, 38, barW, barH, COLORS.hpBg).setOrigin(0, 0.5).setDepth(hudDepth + 1);
    this.allyHpBar = this.add.rectangle(barX, 38, barW, barH - 2, COLORS.hpAlly).setOrigin(0, 0.5).setDepth(hudDepth + 2);
    this.add.rectangle(barX, 38, barW, barH, 0x000000, 0).setOrigin(0, 0.5).setStrokeStyle(1, COLORS.hpBorder).setDepth(hudDepth + 2);

    this.allyHpText = this.add.text(barX + barW - 4, 38, '', {
      fontFamily: FONTS.ui,
      fontSize: '11px',
      color: hex(COLORS.ink),
      fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(hudDepth + 3);

    // ── Enemy Bastion bar ──
    this.add.text(barX - 2, 56, 'BASTION', {
      fontFamily: FONTS.ui,
      fontSize: '11px',
      color: hex(COLORS.hpEnemy),
      fontStyle: 'bold',
    }).setOrigin(0, 0).setDepth(hudDepth + 1);

    // Skull icon for enemy
    const skullG2 = this.add.graphics();
    skullG2.setDepth(hudDepth + 1);
    skullG2.fillStyle(COLORS.hpEnemy, 0.8);
    skullG2.fillCircle(barX - 14, 80, 5);
    skullG2.fillStyle(COLORS.panelBot);
    skullG2.fillRect(barX - 17, 79, 2, 2);
    skullG2.fillRect(barX - 13, 79, 2, 2);

    this.add.rectangle(barX, 80, barW, barH, COLORS.hpBg).setOrigin(0, 0.5).setDepth(hudDepth + 1);
    this.enemyHpBar = this.add.rectangle(barX, 80, barW, barH - 2, COLORS.hpEnemy).setOrigin(0, 0.5).setDepth(hudDepth + 2);
    this.add.rectangle(barX, 80, barW, barH, 0x000000, 0).setOrigin(0, 0.5).setStrokeStyle(1, COLORS.hpBorder).setDepth(hudDepth + 2);

    this.enemyHpText = this.add.text(barX + barW - 4, 80, '', {
      fontFamily: FONTS.ui,
      fontSize: '11px',
      color: hex(COLORS.ink),
      fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(hudDepth + 3);
  }

  // ═══════════════════════════════════════════════════════════
  //  DEPLOY BAR
  // ═══════════════════════════════════════════════════════════

  private buildDeployBar(): void {
    const depth = 810;

    // Panel background
    const panel = this.add.graphics();
    panel.setDepth(depth);
    panel.fillStyle(COLORS.panel, 0.95);
    panel.fillRect(0, DEPLOY_PANEL_TOP, GAME_WIDTH, GAME_HEIGHT - DEPLOY_PANEL_TOP);
    panel.fillStyle(COLORS.metalFrame, 0.4);
    panel.fillRect(0, DEPLOY_PANEL_TOP, GAME_WIDTH, 2);

    const n = DEPLOYABLE.length;
    const cardW = 120;
    const cardH = 140;
    const gap = 16;
    const totalW = n * cardW + (n - 1) * gap;
    let cx = (GAME_WIDTH - totalW) / 2 + cardW / 2;
    const cy = DEPLOY_PANEL_TOP + (GAME_HEIGHT - DEPLOY_PANEL_TOP) / 2;

    for (const unitId of DEPLOYABLE) {
      const def = UNIT_INDEX[unitId];
      const container = this.add.container(cx, cy);
      container.setDepth(depth + 1);

      const bg = this.add.graphics();

      const drawCard = (ready: boolean) => {
        bg.clear();
        // Card background
        bg.fillStyle(COLORS.cardFace, 1);
        bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);

        // Border
        const borderColor = ready ? COLORS.cardReady : COLORS.cardBorder;
        bg.lineStyle(2, borderColor, ready ? 0.9 : 0.5);
        bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);

        // Ready glow
        if (ready) {
          bg.lineStyle(4, COLORS.cardReady, 0.15);
          bg.strokeRoundedRect(-cardW / 2 - 2, -cardH / 2 - 2, cardW + 4, cardH + 4, 10);
        }

        // Unit color chip
        bg.fillStyle(def.placeholder.color, 1);
        bg.fillRoundedRect(-20, -cardH / 2 + 12, 40, 40, 6);
        bg.lineStyle(1, 0x000000, 0.3);
        bg.strokeRoundedRect(-20, -cardH / 2 + 12, 40, 40, 6);

        // Soldier icon on chip
        bg.fillStyle(COLORS.allySkin, 0.8);
        bg.fillCircle(0, -cardH / 2 + 24, 6); // head
        bg.fillStyle(def.placeholder.color, 0.6);
        bg.fillRect(-5, -cardH / 2 + 30, 10, 14); // body
      };
      drawCard(true);
      container.add(bg);

      // Unit label (letter)
      const label = this.add.text(0, -cardH / 2 + 32, def.placeholder.label, {
        fontFamily: FONTS.title,
        fontSize: '22px',
        color: hex(COLORS.ink),
        stroke: hex(0x000000),
        strokeThickness: 2,
      }).setOrigin(0.5);
      container.add(label);

      // Unit name
      const nameText = this.add.text(0, cardH / 2 - 42, def.name, {
        fontFamily: FONTS.ui,
        fontSize: '14px',
        color: hex(COLORS.ink),
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(nameText);

      // Cost with supply icon
      const costText = this.add.text(0, cardH / 2 - 22, `⬢ ${def.cost}`, {
        fontFamily: FONTS.ui,
        fontSize: '13px',
        color: hex(COLORS.gold),
      }).setOrigin(0.5);
      container.add(costText);

      // Cooldown overlay
      const cdOverlay = this.add.rectangle(0, -cardH / 2, cardW - 4, cardH - 4, 0x000000, 0.6)
        .setOrigin(0.5, 0)
        .setVisible(false);
      container.add(cdOverlay);

      // Interactive zone
      const zone = this.add.zone(cx, cy, cardW, cardH).setInteractive({ useHandCursor: true }).setDepth(depth + 2);
      zone.on('pointerdown', () => {
        this.tweens.add({ targets: container, scale: 0.93, duration: 60, yoyo: true });
      });
      zone.on('pointerup', () => this.tryDeploy(unitId, drawCard));

      this.deployCards.push({ container, bg, cdOverlay, unitId, costText, w: cardW, h: cardH });
      cx += cardW + gap;
    }
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

  private tryDeploy(unitId: string, redrawCard: (ready: boolean) => void): void {
    const def = UNIT_INDEX[unitId];
    const cd = this.cooldowns.get(unitId) ?? 0;
    if (cd > 0) return;
    if (!this.sim.canAfford(unitId)) {
      this.flashSupplies();
      return;
    }
    const c = this.sim.spawnAlly(unitId);
    if (c) {
      this.cooldowns.set(unitId, def.deployCooldown);
      this.spawnUnit(c);
      redrawCard(false);
    }
  }

  private flashSupplies(): void {
    this.tweens.add({
      targets: this.suppliesText,
      scale: 1.3,
      duration: 80,
      yoyo: true,
    });
    this.suppliesText.setColor(hex(COLORS.hpBad));
    this.time.delayedCall(200, () => this.suppliesText.setColor(hex(COLORS.gold)));
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

    // Spawn Revenant Grunts
    this.gruntTimer += delta;
    if (this.gruntTimer >= SPAWN_MVP01.GRUNT_INTERVAL_MS) {
      this.gruntTimer -= SPAWN_MVP01.GRUNT_INTERVAL_MS;
      const e = this.sim.spawnEnemy('revenant-grunt');
      if (e) this.spawnUnit(e);
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
    this.suppliesText.setText(`${Math.floor(this.sim.supplies)}`);
    this.killText.setText(`${this.killCount}`);

    const barW = 200;

    // Ally HP bar
    const allyPct = Phaser.Math.Clamp(this.sim.allyBaseHp / this.sim.allyBaseMaxHp, 0, 1);
    this.allyHpBar.width = Math.max(1, barW * allyPct);
    this.allyHpBar.fillColor = allyPct > 0.35 ? COLORS.hpAlly : COLORS.hpBad;
    this.allyHpText.setText(`${Math.ceil(this.sim.allyBaseHp)}/${this.sim.allyBaseMaxHp}`);

    // Enemy HP bar
    const enemyPct = Phaser.Math.Clamp(this.sim.enemyBaseHp / this.sim.enemyBaseMaxHp, 0, 1);
    this.enemyHpBar.width = Math.max(1, barW * enemyPct);
    this.enemyHpText.setText(`${Math.ceil(this.sim.enemyBaseHp)}/${this.sim.enemyBaseMaxHp}`);

    // Deploy card states
    for (const card of this.deployCards) {
      const def = UNIT_INDEX[card.unitId];
      const cd = this.cooldowns.get(card.unitId) ?? 0;
      const affordable = this.sim.supplies >= def.cost;

      if (cd > 0) {
        card.cdOverlay.setVisible(true);
        const frac = Phaser.Math.Clamp(cd / def.deployCooldown, 0, 1);
        card.cdOverlay.height = card.h * frac;
        card.cdOverlay.y = -card.h / 2;
      } else {
        card.cdOverlay.setVisible(false);
      }

      card.costText.setColor(affordable ? hex(COLORS.gold) : hex(COLORS.hpBad));
    }
  }

  private endBattle(outcome: 'won' | 'lost'): void {
    // Dramatic pause
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // Cleanup ambient timer
        this.ashTimer?.destroy();
        this.scene.start('Result', { outcome });
      });
    });
  }
}
