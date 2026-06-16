/**
 * ResultScene — Pantalla de resultados dramática.
 */
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { COLORS, hex, FONTS } from '../ui/colors';
import { UPGRADE_INDEX } from '../data/upgrades';
import { RELICS, RELIC_INDEX } from '../data/relics';
import { TooltipManager } from '../ui/TooltipManager';
import { MetaProgression } from '../systems/MetaProgression';

interface ResultData {
  outcome: 'won' | 'lost';
  nodeType?: string;
}

type RewardChoice =
  | { kind: 'upgrade'; id: string; name: string; description: string }
  | { kind: 'relic'; id: string; name: string; description: string; rarity: string };

export class ResultScene extends Phaser.Scene {
  private nodeType: string = 'battle';

  constructor() {
    super('Result');
  }

  create(data: ResultData): void {
    const cx = GAME_WIDTH / 2;
    const won = data.outcome === 'won';
    this.nodeType = data.nodeType || 'battle';

    this.drawBackground(won);
    this.startAmbientParticles(won);
    this.drawContent(cx, won);
    this.drawVignette();

    this.events.on('shutdown', () => {
      TooltipManager.hide();
    });

    this.cameras.main.fadeIn(800, 0, 0, 0);
  }

  private drawBackground(won: boolean): void {
    const textureKey = won ? 'result-victory' : 'result-defeat';
    if (this.textures.exists(textureKey)) {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, textureKey);
      bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height));
      bg.setDepth(-100);
      this.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x050707,
        won ? 0.16 : 0.22,
      ).setDepth(-95);
    }

    const g = this.add.graphics();
    g.setDepth(-90);
    const steps = 30;
    const stepH = GAME_HEIGHT / steps;
    
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      let topColor = won ? COLORS.skyTop : COLORS.hpBg;
      let botColor = won ? COLORS.goldDark : COLORS.hpBad;
      
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(topColor),
        Phaser.Display.Color.IntegerToColor(botColor),
        100, Math.round(t * 100)
      );
      
      // Make it very dark
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), won ? 0.12 : 0.18);
      g.fillRect(0, i * stepH, GAME_WIDTH, stepH + 1);
    }
    
    // Add solid dark background behind the gradient
    this.cameras.main.setBackgroundColor('#0a0c0a');
  }

  private startAmbientParticles(won: boolean): void {
    this.time.addEvent({
      delay: won ? 300 : 100,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(0, GAME_WIDTH);
        const size = Phaser.Math.Between(1, 3);
        const color = won ? COLORS.gold : COLORS.ember;
        const alpha = Phaser.Math.FloatBetween(0.2, 0.6);

        const p = this.add.rectangle(x, -10, size, size, color, alpha);
        
        this.tweens.add({
          targets: p,
          y: GAME_HEIGHT + 20,
          x: x + Phaser.Math.Between(-50, 50),
          alpha: 0,
          duration: Phaser.Math.Between(3000, 6000),
          onComplete: () => p.destroy()
        });
      }
    });
  }

  private drawContent(cx: number, won: boolean): void {
    let delay = 0;

    // Title
    const titleText = won ? (this.nodeType === 'boss' ? 'BÚNKER DESTRUIDO' : 'VICTORIA') : 'TRINCHERA CAÍDA';
    const title = this.add.text(cx, 100, titleText, {
      fontFamily: FONTS.title,
      fontSize: '44px',
      color: won ? hex(COLORS.gold) : hex(COLORS.hpBad),
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 8, fill: true }
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, y: 84, duration: 800, delay });
    delay += 400;

    // Subtitle
    const subText = won 
      ? (this.nodeType === 'boss' ? 'El mando de la secta ha caído. El sector está asegurado.' : 'La línea resistió. Los muertos vuelven a la tierra.') 
      : 'Los muertos rompieron el frente. La trinchera colapsó.';
      
    const sub = this.add.text(cx, 135, subText, {
      fontFamily: FONTS.body,
      fontSize: '17px',
      color: won ? hex(COLORS.ink) : hex(COLORS.inkDim),
      align: 'center',
      fontStyle: 'italic',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true }
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: sub, alpha: 1, duration: 800, delay });
    delay += 500;

    // Separator line
    const sep = this.add.graphics().setAlpha(0);
    sep.lineStyle(1, won ? COLORS.goldDark : COLORS.enemy, 0.5);
    sep.beginPath();
    sep.moveTo(cx - 180, 170);
    sep.lineTo(cx + 180, 170);
    sep.strokePath();

    this.tweens.add({ targets: sep, alpha: 1, duration: 600, delay });
    delay += 300;

    // Upgrades or Buttons
    if (won) {
      if (this.nodeType === 'boss') {
        this.showCampaignVictory(cx, delay);
      } else {
        this.showRewards(cx, delay);
      }
    } else {
      this.time.delayedCall(delay, () => {
        this.makeButton(cx, 410, 'MENÚ PRINCIPAL', () => this.transition('MainMenu'), COLORS.metalDark);
      });
    }
  }

  private showRewards(cx: number, delay: number): void {
    const title = this.add.text(cx, 205, 'ELEGÍ UNA RECOMPENSA', {
      fontFamily: FONTS.title,
      fontSize: '22px',
      color: hex(COLORS.gold),
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 600, delay });

    const runState = this.game.registry.get('runState');
    const ownedUpgrades = new Set<string>(runState?.upgradeIds || []);
    const ownedRelics = new Set<string>(runState?.relicIds || []);
    const upgradePool: RewardChoice[] = ['barracks-1', 'armory-1', 'med-tent-1', 'engineering-bay-1', 'war-room-1']
      .filter((id) => !ownedUpgrades.has(id))
      .map((id) => ({
        kind: 'upgrade',
        id,
        name: UPGRADE_INDEX[id].name,
        description: UPGRADE_INDEX[id].description,
      }));
    const relicPool: RewardChoice[] = RELICS
      .filter((relic) => !ownedRelics.has(relic.id))
      .map((relic) => ({
        kind: 'relic',
        id: relic.id,
        name: relic.name,
        description: relic.description,
        rarity: relic.rarity,
      }));
    const picked: RewardChoice[] = [];
    const shuffledRelics = Phaser.Utils.Array.Shuffle([...relicPool]);
    if (shuffledRelics.length > 0) picked.push(shuffledRelics.shift()!);

    const mixedPool = Phaser.Utils.Array.Shuffle([...upgradePool, ...shuffledRelics]);
    while (picked.length < 3 && mixedPool.length > 0) {
      picked.push(mixedPool.shift()!);
    }
    if (picked.length === 0) {
      picked.push(
        ...Phaser.Utils.Array.Shuffle(Object.values(UPGRADE_INDEX).map((up) => ({
          kind: 'upgrade' as const,
          id: up.id,
          name: up.name,
          description: up.description,
        }))).slice(0, 3),
      );
    }

    const containers: Phaser.GameObjects.Container[] = [];
    const zones: Phaser.GameObjects.Zone[] = [];

    picked.forEach((reward, index) => {
      const x = cx + (index - 1) * 185;
      const y = 320;
      const w = 150;
      const h = 160;
      
      const container = this.add.container(x, y);
      
      // Card base
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.cardFace, 1);
      bg.fillRoundedRect(-w/2, -h/2, w, h, 6);
      bg.lineStyle(2, reward.kind === 'relic' ? COLORS.gold : COLORS.metalFrame, 0.8);
      bg.strokeRoundedRect(-w/2, -h/2, w, h, 6);
      
      // Card header highlight
      bg.fillStyle(reward.kind === 'relic' ? COLORS.goldDark : COLORS.panelEdge, 0.5);
      bg.fillRect(-w/2 + 2, -h/2 + 2, w - 4, 30);

      const kindText = reward.kind === 'relic'
        ? `RELIQUIA ${reward.rarity.toUpperCase()}`
        : 'MEJORA';
      const kind = this.add.text(0, -h/2 + 46, kindText, {
        fontFamily: FONTS.ui,
        fontSize: '9px',
        color: reward.kind === 'relic' ? hex(COLORS.gold) : hex(COLORS.inkDim),
        align: 'center',
      }).setOrigin(0.5);
      
      // Title
      const t = this.add.text(0, -h/2 + 15, reward.name, {
        fontFamily: FONTS.ui,
        fontSize: '13px',
        color: '#fff',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: w - 10 }
      }).setOrigin(0.5);
      
      // Description & Icon
      let descY = 15;
      if (reward.kind === 'relic') {
        descY = 38;
        const relicDef = RELIC_INDEX[reward.id];
        const frameIndex = relicDef?.iconFrame ?? 0;
        const icon = this.add.image(0, -3, 'relics-sheet', frameIndex);
        icon.setDisplaySize(36, 36);
        container.add(icon);
      } else {
        const iconGraphics = this.add.graphics();
        iconGraphics.lineStyle(2, COLORS.metalFrame, 0.8);
        iconGraphics.strokeCircle(0, -5, 12);
        iconGraphics.strokeCircle(0, -5, 4);
        for (let a = 0; a < 360; a += 45) {
          const rad = Phaser.Math.DegToRad(a);
          iconGraphics.lineBetween(
            Math.cos(rad) * 12,
            -5 + Math.sin(rad) * 12,
            Math.cos(rad) * 16,
            -5 + Math.sin(rad) * 16
          );
        }
        container.add(iconGraphics);
        descY = 38;
      }

      const desc = this.add.text(0, descY, reward.description, {
        fontFamily: FONTS.body,
        fontSize: '11px',
        color: hex(COLORS.inkDim),
        align: 'center',
        wordWrap: { width: w - 16 }
      }).setOrigin(0.5);
      
      container.add([bg, t, kind, desc]);
      container.setAlpha(0);
      container.setScale(0.8);
      
      this.tweens.add({
        targets: container,
        alpha: 1,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut',
        delay: delay + 200 + index * 100
      });
      
      containers.push(container);
      
      // Click zone
      const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });

      if (reward.kind === 'relic') {
        const relicDef = RELIC_INDEX[reward.id];
        if (relicDef) {
          zone.on('pointerover', (pointer: Phaser.Input.Pointer) => {
            const ev = pointer.event as any;
            const cx = ev?.clientX ?? (ev?.touches?.[0]?.clientX ?? pointer.x);
            const cy = ev?.clientY ?? (ev?.touches?.[0]?.clientY ?? pointer.y);
            TooltipManager.show(cx, cy, {
              name: relicDef.name,
              description: relicDef.description,
              rarity: relicDef.rarity,
              flavor: relicDef.flavor,
            });
          });
          zone.on('pointerout', () => {
            TooltipManager.hide();
          });
          zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            const ev = pointer.event as any;
            const cx = ev?.clientX ?? (ev?.touches?.[0]?.clientX ?? pointer.x);
            const cy = ev?.clientY ?? (ev?.touches?.[0]?.clientY ?? pointer.y);
            TooltipManager.show(cx, cy, {
              name: relicDef.name,
              description: relicDef.description,
              rarity: relicDef.rarity,
              flavor: relicDef.flavor,
            });
          });
        }
      }

      zone.on('pointerdown', () => {
        TooltipManager.hide();
        this.tweens.add({ targets: container, scale: 0.95, duration: 60 });
      });
      zone.on('pointerup', () => {
        TooltipManager.hide();
        // Apply reward to persistent runState
        const runState = this.game.registry.get('runState');
        if (runState) {
          if (!runState.upgradeIds) runState.upgradeIds = [];
          if (!runState.relicIds) runState.relicIds = [];
          if (reward.kind === 'upgrade' && !runState.upgradeIds.includes(reward.id)) {
            runState.upgradeIds.push(reward.id);
          }
          if (reward.kind === 'relic' && !runState.relicIds.includes(reward.id)) {
            runState.relicIds.push(reward.id);
          }
          // Reward Intel & Medals on victory (medallas también al banco persistente)
          runState.intelEarned += 1;
          runState.medalsEarned += 1;
          MetaProgression.addMedals(1);
          // Mark current node as visited
          if (runState.currentNodeId && !runState.visitedNodeIds.includes(runState.currentNodeId)) {
            runState.visitedNodeIds.push(runState.currentNodeId);
          }
          this.game.registry.set('runState', runState);
        }
        
        // Clean up cards
        zones.forEach(z => z.destroy());
        this.tweens.add({
          targets: [title, ...containers],
          alpha: 0,
          scale: 0.8,
          duration: 300,
          onComplete: () => {
            containers.forEach(c => c.destroy());
            title.destroy();
            
            // Show continuation buttons (lado a lado en landscape)
            this.makeButton(cx - 150, 460, 'VOLVER AL MAPA', () => this.transition('Map'), COLORS.allyBase);
            this.makeButton(cx + 150, 460, 'MENÚ PRINCIPAL', () => this.transition('MainMenu'), COLORS.metalDark);
          }
        });
      });
      zones.push(zone);
    });
  }

  private showCampaignVictory(cx: number, delay: number): void {
    const runState = this.game.registry.get('runState');
    const opName = runState && runState.operationId ? (runState.operationId === 'op-first-light' ? 'OPERACIÓN VIENTO BLANCO' : (runState.operationId === 'op-hollow-town' ? 'OPERACIÓN PUEBLO FANTASMA' : 'OPERACIÓN FUNDICIÓN NEGRA')) : 'CAMPAÑA COMPLETADA';
    const title = this.add.text(cx, 200, opName, {
      fontFamily: FONTS.title,
      fontSize: '24px',
      color: hex(COLORS.gold),
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5).setAlpha(0);

    const bossName = runState && runState.operationId === 'op-first-light' ? 'El Coronel Von Grüber' : (runState && runState.operationId === 'op-hollow-town' ? 'El Doctor Von Totenkopf' : 'La Locomotora Profanadora');
    const descText = `${bossName} ha sido derrotado. Las fuerzas de la secta se dispersan\nen retirada. La Patagonia está a salvo... por ahora.\n\nCompletaste la operación con éxito.`;

    const desc = this.add.text(cx, 290, descText, {
      fontFamily: FONTS.body,
      fontSize: '14px',
      color: '#fff',
      align: 'center',
      lineSpacing: 8,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true }
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 600, delay });
    this.tweens.add({ targets: desc, alpha: 1, duration: 800, delay: delay + 300 });

    this.time.delayedCall(delay + 1000, () => {
      // Reward medals for run completion
      const runState = this.game.registry.get('runState');
      if (runState) {
        runState.medalsEarned += 10; // 10 medals for run completion
        MetaProgression.addMedals(10);
        MetaProgression.markRunWon();
        // Also mark current node as visited
        if (runState.currentNodeId && !runState.visitedNodeIds.includes(runState.currentNodeId)) {
          runState.visitedNodeIds.push(runState.currentNodeId);
        }
        this.game.registry.set('runState', runState);
      }
      this.makeButton(cx, 460, 'MENÚ PRINCIPAL', () => this.transition('MainMenu'), COLORS.allyBase);
    });
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void, fill: number): void {
    const w = 240;
    const h = 72;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-w/2, -h/2, w, h, 8);
    bg.lineStyle(2, COLORS.metalLight, 0.6);
    bg.strokeRoundedRect(-w/2, -h/2, w, h, 8);

    // Inner shadow
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(-w/2, 0, w, h/2, { tl: 0, tr: 0, bl: 8, br: 8 });

    const txt = this.add.text(0, 0, label, {
      fontFamily: FONTS.title,
      fontSize: '28px',
      color: hex(COLORS.textWhite),
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, fill: true }
    }).setOrigin(0.5);

    container.add([bg, txt]);
    container.setAlpha(0);

    this.tweens.add({ targets: container, alpha: 1, y: y - 10, duration: 600, ease: 'Back.easeOut' });

    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    
    zone.on('pointerdown', () => this.tweens.add({ targets: container, scale: 0.95, duration: 60 }));
    zone.on('pointerup', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 60 });
      onClick();
    });
  }

  private transition(sceneName: string): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneName);
    });
  }

  private drawVignette(): void {
    const v = this.add.graphics();
    for (let i = 0; i < 6; i++) {
      v.fillStyle(0x000000, 0.15 - i * 0.02);
      v.fillRect(0, 0, GAME_WIDTH, 40 - i * 5);
      v.fillRect(0, GAME_HEIGHT - 40 + i * 5, GAME_WIDTH, 40 - i * 5);
      v.fillRect(0, 0, 30 - i * 4, GAME_HEIGHT);
      v.fillRect(GAME_WIDTH - 30 + i * 4, 0, 30 - i * 4, GAME_HEIGHT);
    }
  }
}
