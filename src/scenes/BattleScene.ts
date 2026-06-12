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
const FIELD_TOP = 380;
const FIELD_BOTTOM = 700;
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
    this.drawSky();
    this.drawDistantRuins();
    this.drawMidGround();
    this.drawTerrain();
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

  private drawSky(): void {
    this.cameras.main.setBackgroundColor(hex(COLORS.skyTop));

    const g = this.add.graphics();
    g.setDepth(-100);

    // Sky gradient (top to horizon)
    const steps = 20;
    const skyHeight = FIELD_TOP + 40;
    const stepH = skyHeight / steps;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      let colorObj: Phaser.Types.Display.ColorObject;
      if (t < 0.6) {
        // Dark blue to purple
        const tt = t / 0.6;
        colorObj = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.IntegerToColor(COLORS.skyTop),
          Phaser.Display.Color.IntegerToColor(COLORS.skyMid),
          100, Math.round(tt * 100)
        );
        g.fillStyle(Phaser.Display.Color.GetColor(colorObj.r, colorObj.g, colorObj.b));
      } else {
        // Purple to fiery horizon
        const tt = (t - 0.6) / 0.4;
        colorObj = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.IntegerToColor(COLORS.skyMid),
          Phaser.Display.Color.IntegerToColor(COLORS.skyHorizon),
          100, Math.round(tt * 100)
        );
        g.fillStyle(Phaser.Display.Color.GetColor(colorObj.r, colorObj.g, colorObj.b));
      }
      g.fillRect(0, i * stepH, GAME_WIDTH, stepH + 1);
    }

    // Distant fire glow at horizon
    g.fillStyle(COLORS.skyFire, 0.15);
    g.fillRect(0, FIELD_TOP - 20, GAME_WIDTH, 40);

    // Clouds
    g.fillStyle(COLORS.cloudDark, 0.3);
    g.fillEllipse(120, 80, 200, 30);
    g.fillEllipse(380, 50, 160, 20);
    g.fillEllipse(60, 130, 140, 25);
    g.fillEllipse(450, 120, 180, 28);
    g.fillStyle(COLORS.cloudLight, 0.15);
    g.fillEllipse(280, 100, 220, 22);
  }

  private drawDistantRuins(): void {
    const g = this.add.graphics();
    g.setDepth(-90);
    const baseY = FIELD_TOP - 10;

    // Draw silhouettes of destroyed buildings against the sky
    g.fillStyle(0x0e0e0e, 0.8);

    // Destroyed church steeple
    g.fillRect(80, baseY - 80, 20, 80);
    g.fillTriangle(70, baseY - 80, 90, baseY - 120, 110, baseY - 80);
    // Broken top
    g.fillRect(85, baseY - 115, 10, 15);

    // Collapsed factory
    g.fillRect(160, baseY - 50, 80, 50);
    g.fillRect(170, baseY - 70, 15, 20);
    g.fillRect(200, baseY - 65, 30, 15);
    // Smokestacks
    g.fillRect(230, baseY - 90, 8, 40);

    // Ruined apartments
    g.fillRect(300, baseY - 60, 40, 60);
    g.fillRect(310, baseY - 80, 25, 20);
    // Windows (holes)
    g.fillStyle(COLORS.skyMid, 0.3);
    g.fillRect(308, baseY - 50, 6, 8);
    g.fillRect(320, baseY - 50, 6, 8);
    g.fillRect(308, baseY - 35, 6, 8);
    g.fillRect(320, baseY - 35, 6, 8);

    g.fillStyle(0x0e0e0e, 0.8);
    // Transmission tower
    g.fillRect(400, baseY - 100, 4, 100);
    g.fillRect(390, baseY - 70, 24, 3);
    g.fillRect(393, baseY - 85, 18, 3);
    // Broken wires hanging
    g.lineStyle(1, 0x0e0e0e, 0.4);
    g.beginPath();
    g.moveTo(414, baseY - 70);
    g.lineTo(430, baseY - 50);
    g.strokePath();

    // Water tower (damaged)
    g.fillStyle(0x0e0e0e, 0.7);
    g.fillRect(465, baseY - 90, 3, 50);
    g.fillRect(470, baseY - 90, 3, 50);
    g.fillEllipse(469, baseY - 95, 20, 12);

    // Fire glow behind some buildings
    g.fillStyle(COLORS.skyFire, 0.08);
    g.fillEllipse(190, baseY - 30, 100, 40);
    g.fillEllipse(420, baseY - 40, 60, 30);
  }

  private drawMidGround(): void {
    const g = this.add.graphics();
    g.setDepth(-80);
    const baseY = FIELD_TOP + 10;

    // Closer ruins, poles, barbed wire
    g.fillStyle(0x161210, 0.9);
    g.fillRect(30, baseY - 30, 35, 30);   // rubble pile
    g.fillRect(130, baseY - 20, 25, 20);
    g.fillRect(350, baseY - 25, 30, 25);
    g.fillRect(480, baseY - 15, 20, 15);

    // Broken poles
    g.fillStyle(0x1a1814, 0.8);
    g.fillRect(200, baseY - 40, 3, 40);
    g.fillRect(420, baseY - 35, 3, 35);

    // Smoke wisps rising (static, atmospheric)
    for (const sx of [100, 250, 400]) {
      for (let i = 0; i < 5; i++) {
        const sw = 6 + i * 2;
        const yOff = baseY - 20 - i * 15;
        g.fillStyle(0x333333, 0.05 - i * 0.008);
        g.fillEllipse(sx + Math.sin(i * 1.5) * 8, yOff, sw, 8);
      }
    }

    // Barbed wire across the field
    g.lineStyle(1, 0x2a2822, 0.5);
    g.beginPath();
    for (let x = 0; x < GAME_WIDTH; x += 8) {
      g.lineTo(x, baseY + Math.sin(x * 0.1) * 2);
    }
    g.strokePath();
  }

  private drawTerrain(): void {
    const g = this.add.graphics();
    g.setDepth(-70);

    // Main ground fill
    const groundSteps = 8;
    const groundH = (FIELD_BOTTOM - FIELD_TOP) / groundSteps;
    for (let i = 0; i < groundSteps; i++) {
      const t = i / groundSteps;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(COLORS.groundTop),
        Phaser.Display.Color.IntegerToColor(COLORS.groundBot),
        100, Math.round(t * 100)
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
      g.fillRect(0, FIELD_TOP + i * groundH, GAME_WIDTH, groundH + 1);
    }

    // Mud patches and craters
    g.fillStyle(COLORS.mud, 0.3);
    const craterPositions = [
      { x: 150, y: 480, w: 30, h: 12 },
      { x: 280, y: 550, w: 40, h: 15 },
      { x: 370, y: 610, w: 25, h: 10 },
      { x: 100, y: 630, w: 35, h: 12 },
      { x: 440, y: 490, w: 28, h: 11 },
    ];
    for (const c of craterPositions) {
      g.fillEllipse(c.x, c.y, c.w, c.h);
    }

    // Crater shadows
    g.fillStyle(COLORS.trench, 0.4);
    for (const c of craterPositions) {
      g.fillEllipse(c.x, c.y + 2, c.w - 4, c.h - 3);
    }

    // Ground texture (small random marks)
    g.fillStyle(0x1a1610, 0.2);
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(20, GAME_WIDTH - 20);
      const y = Phaser.Math.Between(FIELD_TOP + 20, FIELD_BOTTOM - 10);
      g.fillRect(x, y, Phaser.Math.Between(2, 6), Phaser.Math.Between(1, 3));
    }

    // Lane markers (subtle trenches)
    for (const laneY of FIELD.LANES_Y) {
      g.fillStyle(COLORS.trench, 0.15);
      g.fillRect(70, laneY + 18, GAME_WIDTH - 140, 2);
    }

    // Foreground rubble at bottom
    g.fillStyle(0x1e1a12, 0.6);
    g.fillRect(0, FIELD_BOTTOM - 5, GAME_WIDTH, GAME_HEIGHT - FIELD_BOTTOM + 5);

    // Bottom edge debris
    g.fillStyle(0x2a2418, 0.5);
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      g.fillRect(x, FIELD_BOTTOM - Phaser.Math.Between(2, 8), Phaser.Math.Between(8, 20), Phaser.Math.Between(4, 8));
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
    const g = this.add.graphics();
    const x = FIELD.ALLY_BASE_X;
    const cy = 550;
    g.setDepth(100);

    // Sandbag wall (3 rows)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const sx = x - 20 + col * 18;
        const sy = cy + 30 - row * 22;
        g.fillStyle(0x6a6040, 1);
        g.fillRoundedRect(sx, sy, 16, 12, 4);
        g.lineStyle(1, 0x4a4030, 0.6);
        g.strokeRoundedRect(sx, sy, 16, 12, 4);
      }
    }

    // Wooden supports behind
    g.fillStyle(0x5a4020);
    g.fillRect(x - 25, cy - 50, 5, 100);
    g.fillRect(x + 20, cy - 45, 5, 95);
    g.fillRect(x - 25, cy - 35, 50, 4);

    // Flag pole and flag
    g.fillStyle(0x666666);
    g.fillRect(x - 8, cy - 90, 3, 80);
    // Simple flag (red/white stripes + blue corner)
    const flagX = x - 5;
    const flagY = cy - 88;
    g.fillStyle(0xcc2233);
    g.fillRect(flagX, flagY, 24, 16);
    g.fillStyle(0xeeeeee);
    g.fillRect(flagX, flagY + 3, 24, 2);
    g.fillRect(flagX, flagY + 8, 24, 2);
    g.fillRect(flagX, flagY + 13, 24, 2);
    g.fillStyle(0x2244aa);
    g.fillRect(flagX, flagY, 10, 8);

    // Ammo boxes at base
    g.fillStyle(0x4a5a3a);
    g.fillRect(x - 18, cy + 45, 14, 10);
    g.fillRect(x + 2, cy + 48, 12, 8);
    g.lineStyle(1, 0x3a4a2a, 0.5);
    g.strokeRect(x - 18, cy + 45, 14, 10);

    // HQ label
    this.add.text(x, cy - 10, 'HQ', {
      fontFamily: FONTS.title,
      fontSize: '18px',
      color: hex(COLORS.ink),
      stroke: hex(0x000000),
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(101);
  }

  private drawEnemyBase(): void {
    const g = this.add.graphics();
    const x = FIELD.ENEMY_BASE_X;
    const cy = 550;
    g.setDepth(100);

    // Concrete bunker wall
    g.fillStyle(0x3a3a38);
    g.fillRect(x - 25, cy - 60, 50, 120);
    g.fillStyle(0x2a2a28);
    g.fillRect(x - 22, cy - 55, 44, 110);

    // Cracks
    g.lineStyle(1, 0x1a1a18, 0.8);
    g.beginPath();
    g.moveTo(x - 10, cy - 55);
    g.lineTo(x - 5, cy - 30);
    g.lineTo(x - 15, cy - 10);
    g.strokePath();
    g.beginPath();
    g.moveTo(x + 10, cy - 40);
    g.lineTo(x + 5, cy - 15);
    g.strokePath();

    // Green toxic glow from cracks
    g.fillStyle(COLORS.serumGlow, 0.06);
    g.fillEllipse(x - 8, cy - 30, 20, 30);
    g.fillStyle(COLORS.serumGlow, 0.04);
    g.fillEllipse(x + 5, cy - 20, 15, 25);

    // Iron Talon banner
    g.fillStyle(0x6a1a1a);
    g.fillRect(x - 15, cy - 50, 30, 40);
    g.lineStyle(1, 0x3a0a0a, 0.8);
    g.strokeRect(x - 15, cy - 50, 30, 40);
    // Talon symbol (simple claw marks)
    g.lineStyle(2, 0x2a0808, 0.9);
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(x + i * 6, cy - 46);
      g.lineTo(x + i * 4, cy - 16);
      g.strokePath();
    }

    // Barbed wire on top
    g.lineStyle(1, 0x4a4a44, 0.6);
    g.beginPath();
    for (let bx = x - 28; bx <= x + 28; bx += 6) {
      g.lineTo(bx, cy - 62 + Math.sin(bx * 0.3) * 3);
    }
    g.strokePath();

    // REICH label with glow
    this.add.text(x, cy + 15, 'REICH', {
      fontFamily: FONTS.title,
      fontSize: '14px',
      color: hex(COLORS.serum),
      stroke: hex(0x000000),
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(101);

    // Toxic drip
    g.fillStyle(COLORS.serumGlow, 0.1);
    g.fillRect(x - 3, cy + 55, 2, 8);
    g.fillRect(x + 8, cy + 50, 2, 12);
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
