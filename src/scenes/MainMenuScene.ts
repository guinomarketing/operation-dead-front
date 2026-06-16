import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { RunSystem } from '../systems/RunSystem';
import { Audio2 } from '../systems/AudioSystem';
import { MetaProgression, UNLOCK_CATALOG } from '../systems/MetaProgression';
import { UNIT_INDEX } from '../data/units';

export class MainMenuScene extends Phaser.Scene {
  private uiContainer!: HTMLElement | null;
  private background?: Phaser.GameObjects.Image;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    // Inicializar / reiniciar mejoras de la run
    this.game.registry.set('upgrades', []);

    // Dibujar el nuevo fondo premium
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'keyart-main');
    this.background = bg;
    // Escalar para que cubra la pantalla manteniendo la relación de aspecto
    const scaleX = GAME_WIDTH / bg.width;
    const scaleY = GAME_HEIGHT / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);

    // Fade in sutil
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Desbloquear audio + música de menú al primer gesto del usuario
    const unlockOnce = () => { Audio2.unlock(); Audio2.playMusic('menu'); };
    document.addEventListener('pointerdown', unlockOnce, { once: true });

    // Crear Interfaz HTML
    this.createHTMLMenu();
    if (new URLSearchParams(window.location.search).get('panel') === 'unlocks') {
      this.time.delayedCall(100, () => this.openUnlocksOverlay());
    }
  }

  private createHTMLMenu() {
    this.uiContainer = document.getElementById('ui-layer');
    if (!this.uiContainer) return;

    // Limpiar UI previa si existiese
    this.uiContainer.innerHTML = '';

    // Crear contenedor principal del menú
    const menuDiv = document.createElement('div');
    menuDiv.id = 'main-menu-ui';

    // Logotipo Premium generado
    const logo = document.createElement('img');
    logo.src = '/assets/ui/logo.png';
    logo.className = 'menu-logo';
    logo.alt = 'Patagonia Z';

    // Subtítulo tipo Briefing
    const subtitle = document.createElement('div');
    subtitle.className = 'briefing-subtitle';
    subtitle.innerHTML = `<p style="margin: 0; font-size: 1.15rem; color: #b6c4b2; text-align: center; font-style: italic; text-shadow: 0 2px 4px rgba(0,0,0,0.9); line-height: 1.35; letter-spacing: 0.5px;">
      La Patagonia no se entrega.<br/>Sostené la línea. Enterralos de nuevo.
    </p>`;

    // Consola de Comandos (Contenedor de Botones)
    const consoleDiv = document.createElement('div');
    consoleDiv.className = 'briefing-console';

    const startBtn = document.createElement('button');
    startBtn.className = 'btn-primary';
    startBtn.innerText = 'DESPLEGAR';
    startBtn.style.padding = '14px 44px';
    startBtn.style.fontSize = '1.6rem';
    startBtn.style.width = '260px';
    startBtn.onclick = () => { Audio2.unlock(); Audio2.play('uiClick'); this.startGame(menuDiv); };

    const unlockBtn = document.createElement('button');
    unlockBtn.className = 'btn-secondary';
    unlockBtn.innerText = '★ DESBLOQUEOS';
    unlockBtn.style.width = '240px';
    unlockBtn.style.color = '#f0d070';
    unlockBtn.onclick = () => { Audio2.unlock(); Audio2.play('uiClick'); this.openUnlocksOverlay(); };

    const configBtn = document.createElement('button');
    configBtn.className = 'btn-secondary';
    configBtn.innerText = '⚙ CONFIGURACIÓN';
    configBtn.style.width = '240px';
    configBtn.onclick = () => { Audio2.unlock(); Audio2.play('uiClick'); this.openConfigOverlay(); };

    consoleDiv.appendChild(startBtn);
    consoleDiv.appendChild(unlockBtn);
    consoleDiv.appendChild(configBtn);

    menuDiv.appendChild(logo);
    menuDiv.appendChild(subtitle);
    menuDiv.appendChild(consoleDiv);

    this.uiContainer.appendChild(menuDiv);
  }

  private openUnlocksOverlay(): void {
    if (!this.uiContainer) return;
    this.setBackground('hq-progression');
    const menu = document.getElementById('main-menu-ui');
    if (menu) menu.style.visibility = 'hidden';
    const overlay = document.createElement('div');
    overlay.className = 'glass-panel';
    Object.assign(overlay.style, {
      position: 'absolute', inset: '40px 60px', background: 'rgba(12,16,12,0.96)', zIndex: '300',
      pointerEvents: 'auto', display: 'flex', flexDirection: 'column', padding: '20px 24px', boxSizing: 'border-box',
      border: '2px solid #3c4a35', boxShadow: '0 0 30px rgba(0,0,0,0.95), 0 0 10px rgba(94, 224, 58, 0.1)'
    } as CSSStyleDeclaration);

    const render = () => {
      overlay.innerHTML = '';
      const header = document.createElement('div');
      Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2d3824', paddingBottom: '10px', marginBottom: '12px' } as CSSStyleDeclaration);
      const h = document.createElement('div');
      h.innerHTML = `<span style="font-family:var(--font-title); font-size:22px; color:var(--primary); text-shadow: 0 0 8px rgba(245,158,11,0.2);">CUARTEL · RECLUTAMIENTO</span> <span style="color:#f0d070; font-family:var(--font-title); margin-left:14px; text-shadow: 0 0 5px rgba(240,208,112,0.2);">★ ${MetaProgression.getMedals()} medallas</span>`;
      
      const close = document.createElement('button');
      close.className = 'btn-secondary'; close.innerText = 'VOLVER'; close.style.padding = '6px 16px'; close.style.fontSize = '12px';
      close.onclick = () => {
        Audio2.play('uiClick');
        overlay.remove();
        if (menu) menu.style.visibility = 'visible';
        this.setBackground('keyart-main');
      };
      header.appendChild(h); header.appendChild(close);
      overlay.appendChild(header);

      const sub = document.createElement('div');
      sub.innerText = 'Empezás cada campaña con el Conscripto. Gastá medallas (ganadas al ganar combates y completar runs) para sumar nuevas clases a tu plantel inicial.';
      Object.assign(sub.style, { color: '#8fa08b', fontSize: '12px', marginBottom: '12px', fontFamily: 'var(--font-body)', letterSpacing: '0.5px' } as CSSStyleDeclaration);
      overlay.appendChild(sub);

      const grid = document.createElement('div');
      Object.assign(grid.style, { flex: '1', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', alignContent: 'start', paddingRight: '6px' } as CSSStyleDeclaration);

      for (const entry of UNLOCK_CATALOG) {
        const def = UNIT_INDEX[entry.id];
        if (!def) continue;
        const unlocked = MetaProgression.isUnlocked(entry.id);
        const medals = MetaProgression.getMedals();
        
        const card = document.createElement('div');
        card.className = 'glass-panel';
        Object.assign(card.style, {
          padding: '10px', display: 'flex', gap: '10px', alignItems: 'center',
          background: unlocked ? 'linear-gradient(180deg, #1c2717 0%, #0c1208 100%)' : 'linear-gradient(180deg, #181c18 0%, #0a0d0a 100%)',
          border: unlocked ? '1px solid #3c4a2d' : '1px solid #222c1f',
          transition: 'all 0.2s ease',
          boxShadow: unlocked ? '0 2px 6px rgba(0,0,0,0.5)' : 'none'
        } as CSSStyleDeclaration);

        // Hover effect on ID card
        card.onmouseover = () => {
          if (unlocked) {
            card.style.border = '1px solid #5ee03a';
            card.style.boxShadow = '0 0 10px rgba(94,224,58,0.2)';
          } else {
            card.style.border = '1px solid #d4a843';
          }
        };
        card.onmouseout = () => {
          card.style.border = unlocked ? '1px solid #3c4a2d' : '1px solid #222c1f';
          card.style.boxShadow = unlocked ? '0 2px 6px rgba(0,0,0,0.5)' : 'none';
        };

        const img = document.createElement('img');
        img.src = `/assets/sprites/unit-${entry.id}.png`;
        Object.assign(img.style, {
          height: '60px', width: 'auto', objectFit: 'contain',
          filter: unlocked ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' : 'grayscale(1) contrast(1.1) brightness(0.4) opacity(0.6)',
          transition: 'filter 0.2s ease'
        } as CSSStyleDeclaration);
        img.onerror = () => { img.style.display = 'none'; };

        const info = document.createElement('div'); info.style.flex = '1';
        info.innerHTML = `<div style="font-weight:bold; color:${unlocked ? '#e8e6d8' : '#778074'}; font-size:13px; font-family:var(--font-body); letter-spacing:0.5px;">${def.name}</div><div style="font-size:10px; color:${unlocked ? '#9aa08c' : '#555e53'}; text-transform:uppercase; font-family:var(--font-body); margin-top:2px;">${def.role}</div>`;
        
        const act = document.createElement('div'); act.style.marginTop = '6px';
        if (unlocked) {
          act.innerHTML = `<span style="color:#5ee03a; font-size:11px; font-weight:bold; font-family:var(--font-title); letter-spacing:0.5px; text-shadow: 0 0 5px rgba(94,224,58,0.3);">✔ DISPONIBLE</span>`;
        } else {
          const b = document.createElement('button');
          b.className = 'btn-primary'; b.style.padding = '5px 12px'; b.style.fontSize = '10px';
          b.innerText = `★ ${entry.cost}`;
          const can = medals >= entry.cost;
          if (!can) {
            b.disabled = true;
            b.style.opacity = '0.4';
            b.style.cursor = 'not-allowed';
            b.style.boxShadow = 'none';
          }
          b.onclick = () => {
            if (MetaProgression.unlock(entry.id)) {
              Audio2.play('victory');
              render();
            } else {
              Audio2.play('uiClick');
            }
          };
          act.appendChild(b);
        }
        info.appendChild(act);
        card.appendChild(img); card.appendChild(info);
        grid.appendChild(card);
      }
      overlay.appendChild(grid);
    };

    render();
    this.uiContainer.appendChild(overlay);
  }

  private setBackground(textureKey: string): void {
    if (!this.background) return;
    this.background.setTexture(textureKey);
    const scale = Math.max(GAME_WIDTH / this.background.width, GAME_HEIGHT / this.background.height);
    this.background.setScale(scale);
  }

  private startGame(menuDiv: HTMLElement) {
    // Inicializar RunState procedimental (MVP 0.3)
    const runState = RunSystem.startNewRun();
    const mapDef = RunSystem.generateMap(runState.seed, runState.operationId);
    this.game.registry.set('runState', runState);
    this.game.registry.set('mapDef', mapDef);

    // Animación de salida de la UI
    menuDiv.style.transition = 'opacity 0.4s ease';
    menuDiv.style.opacity = '0';
    
    // Fade out de la cámara del juego
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Limpiar DOM
      if (this.uiContainer && menuDiv.parentNode) {
        this.uiContainer.removeChild(menuDiv);
      }
      // Intro narrativa → mapa de la run
      this.scene.start('Story');
    });
  }

  private openConfigOverlay(): void {
    if (!this.uiContainer) return;
    this.setBackground('hq-progression');
    const menu = document.getElementById('main-menu-ui');
    if (menu) menu.style.visibility = 'hidden';
    
    const overlay = document.createElement('div');
    overlay.className = 'glass-panel';
    Object.assign(overlay.style, {
      position: 'absolute', inset: '60px 100px', background: 'rgba(12,16,12,0.96)', zIndex: '300',
      pointerEvents: 'auto', display: 'flex', flexDirection: 'column', padding: '20px 24px', boxSizing: 'border-box',
      border: '2px solid #3c4a35', boxShadow: '0 0 30px rgba(0,0,0,0.95), 0 0 10px rgba(94, 224, 58, 0.1)'
    } as CSSStyleDeclaration);

    const header = document.createElement('div');
    Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2d3824', paddingBottom: '10px', marginBottom: '20px' } as CSSStyleDeclaration);
    
    const h = document.createElement('div');
    h.innerHTML = `<span style="font-family:var(--font-title); font-size:22px; color:var(--primary); text-shadow: 0 0 8px rgba(245,158,11,0.2);">CENTRO DE OPERACIONES · AUDIO</span>`;
    
    const close = document.createElement('button');
    close.className = 'btn-secondary'; close.innerText = 'VOLVER'; close.style.padding = '6px 16px'; close.style.fontSize = '12px';
    close.onclick = () => {
      Audio2.play('uiClick');
      overlay.remove();
      if (menu) menu.style.visibility = 'visible';
      this.setBackground('keyart-main');
    };
    
    header.appendChild(h);
    header.appendChild(close);
    overlay.appendChild(header);

    // Contenido de configuración
    const content = document.createElement('div');
    Object.assign(content.style, { display: 'flex', flexDirection: 'column', gap: '20px', flex: '1' } as CSSStyleDeclaration);

    // MÚSICA
    const musicRow = document.createElement('div');
    musicRow.innerHTML = `<div style="font-family:var(--font-title); font-size:13px; color:#8fa08b; margin-bottom:6px; letter-spacing:0.5px;">VOLUMEN MÚSICA</div>`;
    const musicSliderContainer = document.createElement('div');
    musicSliderContainer.style.display = 'flex';
    musicSliderContainer.style.alignItems = 'center';
    musicSliderContainer.style.gap = '15px';

    const musicSlider = document.createElement('input');
    musicSlider.type = 'range';
    musicSlider.min = '0';
    musicSlider.max = '100';
    musicSlider.value = Math.round(Audio2.musicVolume * 100).toString();
    musicSlider.style.flex = '1';
    musicSlider.style.accentColor = 'var(--primary)';

    const musicVal = document.createElement('span');
    musicVal.style.fontFamily = 'var(--font-title)';
    musicVal.style.fontSize = '16px';
    musicVal.style.width = '40px';
    musicVal.style.textAlign = 'right';
    musicVal.style.color = '#fff';
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

    // SFX
    const sfxRow = document.createElement('div');
    sfxRow.innerHTML = `<div style="font-family:var(--font-title); font-size:13px; color:#8fa08b; margin-bottom:6px; letter-spacing:0.5px;">VOLUMEN EFECTOS (SFX)</div>`;
    const sfxSliderContainer = document.createElement('div');
    sfxSliderContainer.style.display = 'flex';
    sfxSliderContainer.style.alignItems = 'center';
    sfxSliderContainer.style.gap = '15px';

    const sfxSlider = document.createElement('input');
    sfxSlider.type = 'range';
    sfxSlider.min = '0';
    sfxSlider.max = '100';
    sfxSlider.value = Math.round(Audio2.sfxVolume * 100).toString();
    sfxSlider.style.flex = '1';
    sfxSlider.style.accentColor = 'var(--primary)';

    const sfxVal = document.createElement('span');
    sfxVal.style.fontFamily = 'var(--font-title)';
    sfxVal.style.fontSize = '16px';
    sfxVal.style.width = '40px';
    sfxVal.style.textAlign = 'right';
    sfxVal.style.color = '#fff';
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

    // SILENCIAR TODO
    const muteRow = document.createElement('div');
    muteRow.style.display = 'flex';
    muteRow.style.alignItems = 'center';
    muteRow.style.gap = '12px';
    muteRow.style.marginTop = '10px';

    const muteCheckbox = document.createElement('input');
    muteCheckbox.type = 'checkbox';
    muteCheckbox.id = 'cfg-mute';
    muteCheckbox.checked = Audio2.muted;
    muteCheckbox.style.width = '18px';
    muteCheckbox.style.height = '18px';
    muteCheckbox.style.cursor = 'pointer';
    muteCheckbox.style.accentColor = 'var(--primary)';

    const muteLabel = document.createElement('label');
    muteLabel.htmlFor = 'cfg-mute';
    muteLabel.innerText = 'SILENCIAR TODO';
    muteLabel.style.fontFamily = 'var(--font-title)';
    muteLabel.style.fontSize = '13px';
    muteLabel.style.cursor = 'pointer';
    muteLabel.style.color = '#e8e6d8';

    muteCheckbox.onchange = () => {
      Audio2.toggleMute();
      Audio2.play('uiClick');
    };

    muteRow.appendChild(muteCheckbox);
    muteRow.appendChild(muteLabel);
    content.appendChild(muteRow);

    overlay.appendChild(content);
    this.uiContainer.appendChild(overlay);
  }
}
