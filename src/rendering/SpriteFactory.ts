/**
 * SpriteFactory — Genera texturas programáticas para unidades y enemigos.
 * Usa CanvasTexture de Phaser para dibujar soldados y zombis con detalle.
 * Llamar ensureTextures() una vez en create() de la escena de batalla.
 */
import Phaser from 'phaser';
import { COLORS, rgba } from '../ui/colors';

/** Resolución de textura (2x display size para nitidez). */
const TEX_W = 64;
const TEX_H = 96;

/** Tamaño para partículas y shapes pequeños. */
const PARTICLE_SIZE = 8;

export class SpriteFactory {
  private static created = false;

  /** Genera todas las texturas si aún no existen. Llamar en scene.create(). */
  static ensureTextures(scene: Phaser.Scene): void {
    if (SpriteFactory.created) return;
    SpriteFactory.created = true;

    // ── Allied units ──
    if (!scene.textures.exists('unit-rifleman')) {
      SpriteFactory.makeAllyTexture(scene, 'unit-rifleman', {
        helmet: COLORS.allyHelmet,
        uniform: COLORS.allyUniform,
        uniformLight: COLORS.allyUniformLight,
        weaponType: 'rifle',
      });
    }
    if (!scene.textures.exists('unit-heavy-gunner')) {
      SpriteFactory.makeAllyTexture(scene, 'unit-heavy-gunner', {
        helmet: COLORS.allyHelmet,
        uniform: 0x334a28,
        uniformLight: 0x3a5230,
        weaponType: 'mg',
        wider: true,
      });
    }
    if (!scene.textures.exists('unit-medic')) {
      SpriteFactory.makeAllyTexture(scene, 'unit-medic', {
        helmet: 0xc8c8b8,
        uniform: 0x5a6a52,
        uniformLight: 0x6a7a62,
        weaponType: 'pistol',
        crossMark: true,
      });
    }
    if (!scene.textures.exists('unit-engineer')) {
      SpriteFactory.makeAllyTexture(scene, 'unit-engineer', {
        helmet: COLORS.allyHelmet,
        uniform: 0x6a5a3a,
        uniformLight: 0x7a6a4a,
        weaponType: 'pistol',
        hasPack: true,
      });
    }
    if (!scene.textures.exists('unit-sniper')) {
      SpriteFactory.makeAllyTexture(scene, 'unit-sniper', {
        helmet: 0x3a4a3a,
        uniform: 0x3a4a42,
        uniformLight: 0x4a5a52,
        weaponType: 'sniper',
      });
    }
    if (!scene.textures.exists('unit-flamethrower')) {
      SpriteFactory.makeAllyTexture(scene, 'unit-flamethrower', {
        helmet: COLORS.allyHelmet,
        uniform: 0x5a4a2e,
        uniformLight: 0x6a5a3e,
        weaponType: 'flamer',
      });
    }

    // ── Enemy units ──
    if (!scene.textures.exists('enemy-revenant-grunt')) {
      SpriteFactory.makeEnemyTexture(scene, 'enemy-revenant-grunt', {
        tier: 'fodder',
        color: COLORS.enemyUniform,
      });
    }
    if (!scene.textures.exists('enemy-runner-corpse')) {
      SpriteFactory.makeEnemyTexture(scene, 'enemy-runner-corpse', {
        tier: 'fast',
        color: 0x5a3a2a,
        leaning: true,
      });
    }
    if (!scene.textures.exists('enemy-shielded-revenant')) {
      SpriteFactory.makeEnemyTexture(scene, 'enemy-shielded-revenant', {
        tier: 'armored',
        color: 0x4a4a4a,
        hasShield: true,
      });
    }
    if (!scene.textures.exists('enemy-exploder')) {
      SpriteFactory.makeEnemyTexture(scene, 'enemy-exploder', {
        tier: 'special',
        color: 0x6a3a1a,
        glowing: true,
      });
    }
    if (!scene.textures.exists('enemy-dead-officer')) {
      SpriteFactory.makeEnemyTexture(scene, 'enemy-dead-officer', {
        tier: 'elite',
        color: 0x3a3a3a,
        hasCap: true,
      });
    }
    if (!scene.textures.exists('enemy-occultist')) {
      SpriteFactory.makeEnemyTexture(scene, 'enemy-occultist', {
        tier: 'elite',
        color: 0x2a1a2a,
        hooded: true,
      });
    }
    if (!scene.textures.exists('enemy-panzer-corpse')) {
      SpriteFactory.makeEnemyTexture(scene, 'enemy-panzer-corpse', {
        tier: 'miniboss',
        color: 0x4a4a42,
        wider: true,
      });
    }
    if (!scene.textures.exists('enemy-rot-hound')) {
      SpriteFactory.makeEnemyTexture(scene, 'enemy-rot-hound', {
        tier: 'fast',
        color: 0x5a4a3a,
        quadruped: true,
      });
    }

    // ── Particle textures ──
    if (!scene.textures.exists('particle-circle')) SpriteFactory.makeParticleTexture(scene, 'particle-circle', COLORS.textWhite);
    if (!scene.textures.exists('particle-ember')) SpriteFactory.makeParticleTexture(scene, 'particle-ember', COLORS.ember);
    if (!scene.textures.exists('particle-ash')) SpriteFactory.makeParticleTexture(scene, 'particle-ash', COLORS.ash);
    if (!scene.textures.exists('particle-blood')) SpriteFactory.makeParticleTexture(scene, 'particle-blood', COLORS.blood);
  }

  /** Devuelve la key de textura para un defId dado. */
  static getTextureKey(defId: string, faction: 'ally' | 'enemy'): string {
    const prefix = faction === 'ally' ? 'unit-' : 'enemy-';
    const key = prefix + defId;
    // Fallback si la textura no existe
    return key;
  }

  // ═══════════════════════════════════════════════════════════
  //  ALLIED SOLDIER DRAWING
  // ═══════════════════════════════════════════════════════════

  private static makeAllyTexture(
    scene: Phaser.Scene,
    key: string,
    opts: {
      helmet: number;
      uniform: number;
      uniformLight: number;
      weaponType: 'rifle' | 'mg' | 'pistol' | 'sniper' | 'flamer';
      wider?: boolean;
      crossMark?: boolean;
      hasPack?: boolean;
    },
  ): void {
    const canvas = scene.textures.createCanvas(key, TEX_W, TEX_H);
    if (!canvas) return;
    const ctx = canvas.getContext();
    const w = opts.wider ? TEX_W : TEX_W;
    const skin = COLORS.allySkin;
    const boots = COLORS.allyBoots;

    // Shadow on ground
    ctx.fillStyle = rgba(0x000000, 0.3);
    ctx.beginPath();
    ctx.ellipse(w / 2, 90, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Legs ──
    ctx.fillStyle = rgba(opts.uniform);
    ctx.fillRect(22, 66, 7, 18); // back leg
    ctx.fillRect(33, 68, 7, 16); // front leg

    // ── Boots ──
    ctx.fillStyle = rgba(boots);
    ctx.fillRect(21, 80, 9, 8);  // back boot
    ctx.fillRect(32, 80, 9, 8);  // front boot

    // ── Torso ──
    ctx.fillStyle = rgba(opts.uniform);
    ctx.fillRect(19, 38, 24, 30);
    // Uniform highlights
    ctx.fillStyle = rgba(opts.uniformLight, 0.5);
    ctx.fillRect(19, 38, 24, 3);

    // ── Belt ──
    ctx.fillStyle = rgba(COLORS.allyBoots);
    ctx.fillRect(19, 62, 24, 4);

    // ── Webbing / straps ──
    ctx.fillStyle = rgba(COLORS.allyWebbing, 0.7);
    ctx.fillRect(26, 38, 3, 24);

    // ── Backpack (engineer) ──
    if (opts.hasPack) {
      ctx.fillStyle = rgba(0x5a5030);
      ctx.fillRect(13, 40, 8, 18);
      ctx.strokeStyle = rgba(0x3a3020);
      ctx.lineWidth = 1;
      ctx.strokeRect(13, 40, 8, 18);
    }

    // ── Back arm ──
    ctx.fillStyle = rgba(opts.uniform);
    ctx.fillRect(14, 42, 7, 14);

    // ── Weapon ──
    const wpnColor = rgba(COLORS.allyWeapon);
    ctx.fillStyle = wpnColor;
    switch (opts.weaponType) {
      case 'rifle':
        ctx.fillRect(42, 42, 16, 3);  // barrel
        ctx.fillRect(38, 42, 6, 8);   // body
        ctx.fillRect(38, 48, 3, 6);   // grip
        break;
      case 'mg':
        ctx.fillRect(40, 40, 20, 5);  // barrel (longer)
        ctx.fillRect(36, 40, 8, 10);  // body (bulkier)
        ctx.fillRect(38, 48, 3, 6);
        // ammo belt
        ctx.fillStyle = rgba(COLORS.gold, 0.6);
        ctx.fillRect(36, 50, 10, 2);
        break;
      case 'pistol':
        ctx.fillRect(42, 44, 8, 3);
        ctx.fillRect(40, 44, 4, 7);
        break;
      case 'sniper':
        ctx.fillRect(40, 41, 22, 3);  // long barrel
        ctx.fillRect(36, 41, 6, 8);
        ctx.fillRect(38, 47, 3, 6);
        // scope
        ctx.fillStyle = rgba(0x222222);
        ctx.fillRect(46, 38, 6, 3);
        break;
      case 'flamer':
        ctx.fillRect(40, 40, 14, 6);  // nozzle
        ctx.fillStyle = rgba(0x884422);
        ctx.fillRect(36, 38, 8, 16);  // tank connection
        // fuel tank on back
        ctx.fillStyle = rgba(0x666644);
        ctx.fillRect(13, 38, 8, 22);
        ctx.strokeStyle = rgba(0x444422);
        ctx.lineWidth = 1;
        ctx.strokeRect(13, 38, 8, 22);
        break;
    }

    // ── Front arm ──
    ctx.fillStyle = rgba(opts.uniform);
    ctx.fillRect(38, 42, 6, 12);
    // Hand
    ctx.fillStyle = rgba(skin);
    ctx.fillRect(39, 43, 4, 4);

    // ── Head ──
    ctx.fillStyle = rgba(skin);
    ctx.beginPath();
    ctx.arc(31, 28, 8, 0, Math.PI * 2);
    ctx.fill();

    // ── Helmet ──
    ctx.fillStyle = rgba(opts.helmet);
    ctx.beginPath();
    ctx.ellipse(31, 22, 11, 8, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(20, 21, 22, 7);
    // Helmet rim
    ctx.fillStyle = rgba(opts.helmet, 0.6);
    ctx.fillRect(19, 27, 14, 3);
    // Helmet highlight
    ctx.fillStyle = rgba(0xffffff, 0.08);
    ctx.fillRect(24, 18, 10, 3);

    // ── Face detail ──
    ctx.fillStyle = rgba(0x222211, 0.6);
    ctx.fillRect(36, 26, 2, 2); // eye

    // ── Medic cross ──
    if (opts.crossMark) {
      ctx.fillStyle = rgba(0xdd2222);
      ctx.fillRect(26, 44, 8, 3);  // horizontal
      ctx.fillRect(29, 41, 3, 8);  // vertical
    }

    canvas.refresh();
  }

  // ═══════════════════════════════════════════════════════════
  //  ENEMY ZOMBIE DRAWING
  // ═══════════════════════════════════════════════════════════

  private static makeEnemyTexture(
    scene: Phaser.Scene,
    key: string,
    opts: {
      tier: string;
      color: number;
      leaning?: boolean;
      hasShield?: boolean;
      glowing?: boolean;
      hasCap?: boolean;
      hooded?: boolean;
      wider?: boolean;
      quadruped?: boolean;
    },
  ): void {
    const h = opts.quadruped ? 56 : TEX_H;
    const canvas = scene.textures.createCanvas(key, TEX_W, h);
    if (!canvas) return;
    const ctx = canvas.getContext();
    const skinColor = COLORS.enemySkin;
    const skinDark = COLORS.enemySkinDark;

    if (opts.quadruped) {
      // ── Rot Hound (dog zombie) ──
      SpriteFactory.drawQuadruped(ctx, opts.color, skinColor);
      canvas.refresh();
      return;
    }

    // Shadow
    ctx.fillStyle = rgba(0x000000, 0.3);
    ctx.beginPath();
    ctx.ellipse(TEX_W / 2, 90, opts.wider ? 18 : 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Legs (shambling, asymmetric) ──
    ctx.fillStyle = rgba(opts.color);
    ctx.fillRect(22, 66, 7, 18);
    ctx.fillRect(35, 70, 6, 14);

    // Torn leg detail
    ctx.fillStyle = rgba(COLORS.enemyRot, 0.6);
    ctx.fillRect(22, 72, 7, 3);

    // ── Boots (worn) ──
    ctx.fillStyle = rgba(0x222218);
    ctx.fillRect(21, 81, 9, 7);
    ctx.fillRect(34, 81, 8, 7);

    // ── Torso ──
    const bodyW = opts.wider ? 28 : 22;
    const bodyX = opts.wider ? 17 : 20;
    ctx.fillStyle = rgba(opts.color);
    ctx.fillRect(bodyX, 38, bodyW, 30);

    // Torn uniform marks
    ctx.fillStyle = rgba(COLORS.enemyRot, 0.5);
    ctx.fillRect(bodyX + 2, 48, 6, 3);
    ctx.fillRect(bodyX + bodyW - 8, 42, 5, 4);

    // Blood stains
    ctx.fillStyle = rgba(COLORS.enemyBlood, 0.4);
    ctx.fillRect(bodyX + 4, 54, 8, 5);

    // ── Arms ──
    // Back arm (reaching)
    ctx.fillStyle = rgba(skinDark);
    ctx.fillRect(bodyX - 6, 42, 7, 14);
    // Front arm (reaching forward)
    ctx.fillStyle = rgba(skinColor);
    ctx.fillRect(bodyX + bodyW - 2, 40, 12, 5);
    ctx.fillRect(bodyX + bodyW + 8, 38, 5, 8);
    // Clawed hand
    ctx.fillStyle = rgba(COLORS.enemyBone, 0.8);
    ctx.fillRect(bodyX + bodyW + 12, 37, 3, 4);
    ctx.fillRect(bodyX + bodyW + 12, 42, 3, 3);

    // ── Head ──
    ctx.fillStyle = rgba(skinColor);
    ctx.beginPath();
    ctx.arc(30, 28, 8, 0, Math.PI * 2);
    ctx.fill();

    // Exposed skull/bone
    ctx.fillStyle = rgba(COLORS.enemyBone, 0.3);
    ctx.beginPath();
    ctx.arc(28, 24, 4, 0, Math.PI * 2);
    ctx.fill();

    if (opts.hasCap) {
      // Officer cap
      ctx.fillStyle = rgba(0x2a2a28);
      ctx.fillRect(20, 16, 20, 8);
      ctx.fillRect(18, 22, 24, 4);
      // Cap insignia
      ctx.fillStyle = rgba(COLORS.enemy, 0.8);
      ctx.fillRect(27, 18, 6, 4);
    } else if (opts.hooded) {
      // Occultist hood
      ctx.fillStyle = rgba(0x1a0a1a);
      ctx.beginPath();
      ctx.moveTo(20, 30);
      ctx.lineTo(30, 10);
      ctx.lineTo(40, 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(20, 24, 20, 8);
    } else {
      // Damaged helmet or bare head
      ctx.fillStyle = rgba(COLORS.enemyUniformDark);
      ctx.beginPath();
      ctx.ellipse(30, 22, 10, 7, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // Crack in helmet
      ctx.strokeStyle = rgba(COLORS.enemyRot, 0.6);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(26, 18);
      ctx.lineTo(30, 24);
      ctx.lineTo(28, 28);
      ctx.stroke();
    }

    // ── Glowing eyes ──
    ctx.fillStyle = rgba(COLORS.enemyEyes);
    ctx.fillRect(24, 26, 3, 3);
    ctx.fillRect(33, 26, 3, 3);
    // Eye glow
    ctx.fillStyle = rgba(COLORS.enemyEyes, 0.3);
    ctx.beginPath();
    ctx.arc(25, 27, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(34, 27, 4, 0, Math.PI * 2);
    ctx.fill();

    // ── Shield (Shielded Revenant) ──
    if (opts.hasShield) {
      ctx.fillStyle = rgba(0x555550, 0.9);
      ctx.fillRect(bodyX - 10, 32, 8, 30);
      ctx.strokeStyle = rgba(0x333330);
      ctx.lineWidth = 1;
      ctx.strokeRect(bodyX - 10, 32, 8, 30);
      // Rivets
      ctx.fillStyle = rgba(0x777770);
      ctx.fillRect(bodyX - 8, 36, 3, 3);
      ctx.fillRect(bodyX - 8, 52, 3, 3);
    }

    // ── Exploder glow ──
    if (opts.glowing) {
      ctx.fillStyle = rgba(COLORS.serumGlow, 0.15);
      ctx.beginPath();
      ctx.arc(30, 50, 20, 0, Math.PI * 2);
      ctx.fill();
      // Toxic veins on torso
      ctx.strokeStyle = rgba(COLORS.serumGlow, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(24, 42);
      ctx.lineTo(28, 52);
      ctx.lineTo(32, 46);
      ctx.lineTo(36, 56);
      ctx.stroke();
    }

    canvas.refresh();
  }

  /** Draws a zombie dog (quadruped). */
  private static drawQuadruped(
    ctx: CanvasRenderingContext2D,
    bodyColor: number,
    skinColor: number,
  ): void {
    const cx = TEX_W / 2;

    // Shadow
    ctx.fillStyle = rgba(0x000000, 0.25);
    ctx.beginPath();
    ctx.ellipse(cx, 50, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs (4)
    ctx.fillStyle = rgba(bodyColor);
    ctx.fillRect(12, 38, 5, 14); // back left
    ctx.fillRect(20, 40, 5, 12); // back right
    ctx.fillRect(38, 38, 5, 14); // front left
    ctx.fillRect(44, 40, 5, 12); // front right

    // Body (horizontal)
    ctx.fillStyle = rgba(bodyColor);
    ctx.fillRect(14, 26, 34, 16);

    // Torn fur
    ctx.fillStyle = rgba(COLORS.enemyRot, 0.4);
    ctx.fillRect(20, 30, 8, 4);

    // Head
    ctx.fillStyle = rgba(skinColor);
    ctx.beginPath();
    ctx.ellipse(50, 24, 8, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = rgba(skinColor);
    ctx.fillRect(54, 22, 8, 5);

    // Jaw
    ctx.fillStyle = rgba(COLORS.enemyRot);
    ctx.fillRect(56, 26, 6, 3);

    // Eyes
    ctx.fillStyle = rgba(COLORS.enemyEyes);
    ctx.fillRect(52, 21, 2, 2);

    // Tail (stubby)
    ctx.fillStyle = rgba(bodyColor);
    ctx.fillRect(8, 24, 6, 3);
  }

  // ═══════════════════════════════════════════════════════════
  //  PARTICLE TEXTURES
  // ═══════════════════════════════════════════════════════════

  private static makeParticleTexture(scene: Phaser.Scene, key: string, color: number): void {
    const canvas = scene.textures.createCanvas(key, PARTICLE_SIZE, PARTICLE_SIZE);
    if (!canvas) return;
    const ctx = canvas.getContext();
    ctx.fillStyle = rgba(color);
    ctx.beginPath();
    ctx.arc(PARTICLE_SIZE / 2, PARTICLE_SIZE / 2, PARTICLE_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    canvas.refresh();
  }

  /**
   * Toma una textura de imagen cruda con fondo oscuro y la procesa para remover el fondo negro,
   * haciendo que el fondo sea transparente mediante un algoritmo de flood-fill.
   */
  static processTransparentTexture(scene: Phaser.Scene, sourceKey: string, targetKey: string): void {
    if (!scene.textures.exists(sourceKey)) {
      console.warn(`Source texture ${sourceKey} not found for transparency processing`);
      return;
    }
    const texture = scene.textures.get(sourceKey);
    const sourceImage = texture.getSourceImage() as HTMLImageElement;
    const w = sourceImage.width;
    const h = sourceImage.height;

    // Crear canvas temporal
    const canvas = scene.textures.createCanvas(targetKey, w, h);
    if (!canvas) return;
    const ctx = canvas.getContext();
    ctx.drawImage(sourceImage, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Flood fill / BFS para encontrar píxeles de fondo
    const visited = new Uint8Array(w * h);
    const queue: number[] = [];

    // Agregar bordes a la cola de procesamiento
    for (let x = 0; x < w; x++) {
      queue.push(x, 0);
      queue.push(x, h - 1);
      visited[x] = 1;
      visited[(h - 1) * w + x] = 1;
    }
    for (let y = 1; y < h - 1; y++) {
      queue.push(0, y);
      queue.push(w - 1, y);
      visited[y * w] = 1;
      visited[y * w + (w - 1)] = 1;
    }

    let head = 0;
    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];

      const idx = (cy * w + cx) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Verificar si es cercano a negro (r, g, b menores a 45)
      if (r < 45 && g < 45 && b < 45) {
        data[idx + 3] = 0; // Píxel transparente

        // Agregar vecinos (4 direcciones)
        const dx = [0, 0, 1, -1];
        const dy = [1, -1, 0, 0];
        for (let i = 0; i < 4; i++) {
          const nx = cx + dx[i];
          const ny = cy + dy[i];
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const nidx = ny * w + nx;
            if (visited[nidx] === 0) {
              visited[nidx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    canvas.refresh();
  }
}
