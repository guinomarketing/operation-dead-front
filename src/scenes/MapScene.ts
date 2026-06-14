import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { COLORS, hex, FONTS } from '../ui/colors';
import { RunSystem } from '../systems/RunSystem';
import type { RunState, RunMapDef, RunNodeDef } from '../types/RunTypes';
import { EVENTS } from '../data/events';
import { UPGRADES } from '../data/upgrades';
import { UNIT_INDEX } from '../data/units';
import { Audio2 } from '../systems/AudioSystem';

export class MapScene extends Phaser.Scene {
  private runState!: RunState;
  private mapDef!: RunMapDef;

  private g!: Phaser.GameObjects.Graphics;
  private uiContainer!: HTMLElement | null;

  constructor() {
    super('Map');
  }

  create(): void {
    // Leer estado de la run del registry
    this.runState = this.game.registry.get('runState');
    this.mapDef = this.game.registry.get('mapDef');

    if (!this.runState || !this.mapDef) {
      console.warn('RunState not found, starting new run');
      this.runState = RunSystem.startNewRun();
      this.mapDef = RunSystem.generateMap(this.runState.seed);
      this.game.registry.set('runState', this.runState);
      this.game.registry.set('mapDef', this.mapDef);
    }

    // Comprobar si nos quedamos sin soldados (derrota definitiva de la run)
    if (this.runState && this.runState.roster && this.runState.roster.length === 0) {
      this.drawBackground();
      this.uiContainer = document.getElementById('ui-layer');
      this.showGameOverRosterEmpty();
      return;
    }

    // Dibujar el fondo táctico militar
    this.drawBackground();

    // Gráficos para las conexiones y nodos
    this.g = this.add.graphics();
    this.g.setDepth(10);

    // Dibujar conexiones y nodos interactivos
    this.drawMapGraph();

    // Renderizar barra superior y botones HTML
    this.uiContainer = document.getElementById('ui-layer');
    this.createHTMLOverlay();

    // Fade in
    this.cameras.main.fadeIn(600, 0, 0, 0);
    Audio2.unlock();
    Audio2.playMusic('menu');
  }

  private drawBackground(): void {
    // Fondo de color plano oscuro militar
    this.cameras.main.setBackgroundColor('#0d110d');

    // Rejilla de blueprint
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1f2e1f, 0.4);
    
    // Líneas verticales
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      grid.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    // Líneas horizontales
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      grid.lineBetween(0, y, GAME_WIDTH, y);
    }

    // Líneas diagonales decorativas en las esquinas
    const dec = this.add.graphics();
    dec.lineStyle(2, 0x3a4a3a, 0.25);
    dec.lineBetween(0, 80, 80, 0);
    dec.lineBetween(GAME_WIDTH - 80, 0, GAME_WIDTH, 80);
    dec.lineBetween(0, GAME_HEIGHT - 80, 80, GAME_HEIGHT);
    dec.lineBetween(GAME_WIDTH - 80, GAME_HEIGHT, GAME_WIDTH, GAME_HEIGHT - 80);
  }

  /**
   * LANDSCAPE: la run progresa de IZQUIERDA → DERECHA.
   * X = fila (avance de la run). Y = columna (carril/ruta).
   */
  private nodeX(row: number): number {
    const leftPad = 95;
    const rightPad = 95;
    const maxRow = Math.max(1, ...this.mapDef.nodes.map((n) => n.row));
    const step = (GAME_WIDTH - leftPad - rightPad) / maxRow;
    return leftPad + row * step;
  }

  private nodeY(col: number): number {
    // 3 rutas verticales dentro de la banda visible (debajo de la barra superior).
    if (col === 0) return 170; // ruta superior
    if (col === 2) return 430; // ruta inferior
    return 300; // ruta central
  }

  private drawMapGraph(): void {
    this.g.clear();

    const nodes = this.mapDef.nodes;
    
    // 1. Dibujar líneas de conexión primero (quedan detrás de los nodos)
    nodes.forEach(n => {
      const sx = this.nodeX(n.row);
      const sy = this.nodeY(n.col);

      n.edges.forEach(edgeId => {
        const destNode = nodes.find(dn => dn.id === edgeId);
        if (destNode) {
          const dx = this.nodeX(destNode.row);
          const dy = this.nodeY(destNode.col);

          // Línea de metal punteada o gruesa
          const isAvailable = this.isNodeSelectable(destNode.id, destNode.row);
          if (isAvailable) {
            this.g.lineStyle(3, COLORS.serum, 0.75);
          } else if (this.runState.visitedNodeIds.includes(n.id) && this.runState.currentNodeId === destNode.id) {
            this.g.lineStyle(3, COLORS.gold, 0.85);
          } else {
            this.g.lineStyle(2, COLORS.panelEdge, 0.4);
          }
          
          this.g.beginPath();
          this.g.moveTo(sx, sy);
          this.g.lineTo(dx, dy);
          this.g.strokePath();
        }
      });
    });

    // 2. Dibujar nodos interactivos
    nodes.forEach(n => {
      const x = this.nodeX(n.row);
      const y = this.nodeY(n.col);
      const isSelectable = this.isNodeSelectable(n.id, n.row);
      const isVisited = this.runState.visitedNodeIds.includes(n.id);
      const isCurrent = this.runState.currentNodeId === n.id;

      // Color base del nodo
      let color: number = COLORS.metalDark;
      let strokeColor: number = COLORS.metalFrame;
      let strokeWidth = 2;
      let alpha = 0.9;
      let size = 20;

      if (isCurrent) {
        color = COLORS.bgField;
        strokeColor = COLORS.gold;
        strokeWidth = 3;
        size = 23;
      } else if (isSelectable) {
        color = COLORS.panel;
        strokeColor = COLORS.serum;
        strokeWidth = 2.5;
        size = 22;
      } else if (isVisited) {
        color = 0x111611;
        strokeColor = COLORS.inkDim;
        alpha = 0.6;
      }

      // Dibujar círculo del nodo
      this.g.fillStyle(color, alpha);
      this.g.beginPath();
      this.g.arc(x, y, size, 0, Math.PI * 2);
      this.g.fill();
      this.g.lineStyle(strokeWidth, strokeColor, alpha);
      this.g.strokePath();

      // Añadir icono textual descriptivo
      let icon = '⚔';
      if (n.type === 'elite') icon = '☠';
      else if (n.type === 'event') icon = '?';
      else if (n.type === 'supply') icon = '⬢';
      else if (n.type === 'hq') icon = '✚';
      else if (n.type === 'boss') icon = '⭐';

      const label = this.add.text(x, y, icon, {
        fontFamily: FONTS.ui,
        fontSize: n.type === 'boss' ? '18px' : '14px',
        color: hex(isSelectable ? COLORS.serum : (isCurrent ? COLORS.gold : (isVisited ? COLORS.inkDim : COLORS.ink))),
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(15);

      // Si es seleccionable, hacerlo interactivo
      if (isSelectable) {
        // Círculo invisible para zona de clic más grande
        const clickZone = this.add.circle(x, y, 28).setInteractive({ useHandCursor: true });
        
        clickZone.on('pointerover', () => {
          label.setScale(1.2);
          this.tweens.add({
            targets: label,
            angle: 15,
            duration: 80,
            yoyo: true
          });
        });
        
        clickZone.on('pointerout', () => {
          label.setScale(1);
          label.setAngle(0);
        });

        clickZone.on('pointerdown', () => {
          this.selectNode(n);
        });
      }
    });
  }

  private isNodeSelectable(nodeId: string, row: number): boolean {
    // Si la run no ha empezado, se puede elegir cualquier nodo de la fila 0
    if (this.runState.currentNodeId === null) {
      return row === 0;
    }
    
    // Si ya estamos en el final o visitamos el nodo
    if (this.runState.visitedNodeIds.includes(nodeId)) return false;

    // Buscar el nodo actual del jugador
    const current = this.mapDef.nodes.find(n => n.id === this.runState.currentNodeId);
    if (!current) return false;

    // Es elegible si está en la lista de conexiones (edges)
    return current.edges.includes(nodeId);
  }

  private selectNode(node: RunNodeDef): void {
    Audio2.play('uiClick');
    // Bloquear interacción
    this.input.enabled = false;

    // Registrar nodo como actual
    this.runState.currentNodeId = node.id;
    this.game.registry.set('runState', this.runState);

    // Animación de cámara antes del viaje
    this.cameras.main.flash(300, 0, 80, 0, false);
    
    this.time.delayedCall(400, () => {
      this.input.enabled = true;
      
      if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
        // Viajar a batalla
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('Battle', { nodeType: node.type, battleMode: node.battleMode });
        });
      } else if (node.type === 'event') {
        this.openEventDialog();
      } else if (node.type === 'supply') {
        this.openSupplyShop();
      } else if (node.type === 'hq') {
        this.openHQCamp();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  UI HTML OVERLAYS
  // ═══════════════════════════════════════════════════════════

  private createHTMLOverlay(): void {
    if (!this.uiContainer) return;
    this.uiContainer.innerHTML = '';

    // Barra táctica superior (HQ, Moral, Intel, Upgrades)
    const topBar = document.createElement('div');
    topBar.className = 'glass-panel';
    topBar.style.position = 'absolute';
    topBar.style.top = '10px';
    topBar.style.left = '50%';
    topBar.style.transform = 'translateX(-50%)';
    topBar.style.width = '96%';
    topBar.style.padding = '10px 16px';
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'center';
    topBar.style.boxSizing = 'border-box';
    topBar.style.pointerEvents = 'auto';

    // Izquierda: Status de HP de base y Moral
    const statusDiv = document.createElement('div');
    statusDiv.style.display = 'flex';
    statusDiv.style.gap = '15px';

    // HQ Bar
    const hqDiv = document.createElement('div');
    hqDiv.style.width = '100px';
    hqDiv.innerHTML = `<span style="color:#3b82f6; font-size:10px; font-weight:bold; letter-spacing:1px;">VIDA BASE</span>`;
    const hqBar = this.createProgressBar('#3b82f6', this.runState.baseHp / this.runState.baseMaxHp, `${this.runState.baseHp}/${this.runState.baseMaxHp}`);
    hqDiv.appendChild(hqBar);

    // Moral Bar
    const moraleDiv = document.createElement('div');
    moraleDiv.style.width = '100px';
    moraleDiv.innerHTML = `<span style="color:#eab308; font-size:10px; font-weight:bold; letter-spacing:1px;">MORAL</span>`;
    const moraleBar = this.createProgressBar('#eab308', this.runState.morale / 100, `${this.runState.morale}/100`);
    moraleDiv.appendChild(moraleBar);

    statusDiv.appendChild(hqDiv);
    statusDiv.appendChild(moraleDiv);

    // Centro: Monedas e Inventario
    const currencyDiv = document.createElement('div');
    currencyDiv.style.display = 'flex';
    currencyDiv.style.gap = '20px';
    currencyDiv.style.fontFamily = 'var(--font-title)';
    currencyDiv.style.fontSize = '14px';

    currencyDiv.innerHTML = `
      <div style="color:var(--primary)">⬢ ${this.runState.intelEarned} <span style="font-family:var(--font-body); font-size:10px; color:#aaa;">INTEL</span></div>
      <div style="color:#eab308">★ ${this.runState.medalsEarned} <span style="font-family:var(--font-body); font-size:10px; color:#aaa;">MEDALLAS</span></div>
      <div style="color:#fff">⚙ ${this.runState.upgradeIds.length} <span style="font-family:var(--font-body); font-size:10px; color:#aaa;">MEJORAS</span></div>
    `;

    // Derecha: Botón Salir / Retirarse y Ver Plantel
    const rightDiv = document.createElement('div');
    rightDiv.style.display = 'flex';
    rightDiv.style.alignItems = 'center';
    rightDiv.style.gap = '8px';

    const plantBtn = document.createElement('button');
    plantBtn.className = 'btn-primary';
    plantBtn.style.background = 'var(--primary)';
    plantBtn.style.color = '#000';
    plantBtn.style.border = '1px solid #000';
    plantBtn.style.padding = '4px 8px';
    plantBtn.style.fontSize = '11px';
    plantBtn.style.fontWeight = 'bold';
    plantBtn.style.cursor = 'pointer';
    plantBtn.style.boxShadow = 'none';
    plantBtn.style.letterSpacing = '0px';
    plantBtn.innerText = 'VER PLANTEL';
    plantBtn.onclick = () => {
      this.openRosterOverlay();
    };

    const exitBtn = document.createElement('button');
    exitBtn.style.background = '#3f3f3f';
    exitBtn.style.color = '#fff';
    exitBtn.style.border = '1px solid #555';
    exitBtn.style.padding = '4px 8px';
    exitBtn.style.fontSize = '11px';
    exitBtn.style.fontWeight = 'bold';
    exitBtn.style.cursor = 'pointer';
    exitBtn.innerText = 'RETIRARSE';
    exitBtn.onclick = () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu');
      });
    };

    rightDiv.appendChild(plantBtn);
    rightDiv.appendChild(exitBtn);

    topBar.appendChild(statusDiv);
    topBar.appendChild(currencyDiv);
    topBar.appendChild(rightDiv);

    this.uiContainer.appendChild(topBar);
  }

  private createProgressBar(color: string, percentage: number, label: string): HTMLElement {
    const barBg = document.createElement('div');
    barBg.style.width = '100%';
    barBg.style.height = '10px';
    barBg.style.backgroundColor = 'rgba(0,0,0,0.5)';
    barBg.style.borderRadius = '2px';
    barBg.style.overflow = 'hidden';
    barBg.style.border = '1px solid rgba(255,255,255,0.15)';
    barBg.style.position = 'relative';
    barBg.style.marginTop = '2px';

    const barInner = document.createElement('div');
    barInner.style.height = '100%';
    barInner.style.backgroundColor = color;
    barInner.style.width = `${percentage * 100}%`;

    const barText = document.createElement('div');
    barText.style.position = 'absolute';
    barText.style.width = '100%';
    barText.style.textAlign = 'center';
    barText.style.top = '0';
    barText.style.fontSize = '8px';
    barText.style.lineHeight = '10px';
    barText.style.color = '#fff';
    barText.style.fontWeight = 'bold';
    barText.innerText = label;

    barBg.appendChild(barInner);
    barBg.appendChild(barText);
    return barBg;
  }

  // ═══════════════════════════════════════════════════════════
  //  NARRATIVE EVENTS WINDOW
  // ═══════════════════════════════════════════════════════════

  private openEventDialog(): void {
    if (!this.uiContainer) return;

    // Seleccionar evento al azar de la lista
    const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];

    const modal = document.createElement('div');
    modal.className = 'glass-panel';
    modal.style.position = 'absolute';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = 'min(90%, 700px)';
    modal.style.maxHeight = '88%';
    modal.style.overflowY = 'auto';
    modal.style.padding = '20px';
    modal.style.boxSizing = 'border-box';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.pointerEvents = 'auto';
    modal.style.zIndex = '100';

    const title = document.createElement('h2');
    title.innerText = ev.title;
    title.style.fontFamily = 'var(--font-title)';
    title.style.fontSize = '22px';
    title.style.color = 'var(--primary)';
    title.style.marginTop = '0';
    title.style.marginBottom = '12px';
    title.style.borderBottom = '1px solid var(--panel-border)';
    title.style.paddingBottom = '8px';

    const text = document.createElement('p');
    text.innerText = ev.text;
    text.style.fontSize = '14px';
    text.style.lineHeight = '1.5';
    text.style.color = '#e5e7eb';
    text.style.marginBottom = '20px';

    const optionsDiv = document.createElement('div');
    optionsDiv.style.display = 'flex';
    optionsDiv.style.flexDirection = 'column';
    optionsDiv.style.gap = '10px';

    ev.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn-primary';
      btn.style.fontSize = '14px';
      btn.style.padding = '10px 15px';
      btn.style.textAlign = 'left';
      btn.style.width = '100%';
      
      btn.innerHTML = `<span style="font-weight:bold; font-family:var(--font-title);">${opt.label}</span><br/><span style="font-size:11px; color:#444;">(${opt.hint})</span>`;
      
      btn.onclick = () => {
        // Resolver consecuencias
        this.resolveEventOption(opt, text, optionsDiv, modal);
      };

      optionsDiv.appendChild(btn);
    });

    modal.appendChild(title);
    modal.appendChild(text);
    modal.appendChild(optionsDiv);
    this.uiContainer.appendChild(modal);
  }

  private resolveEventOption(opt: any, textEl: HTMLElement, optionsDiv: HTMLElement, modal: HTMLElement): void {
    optionsDiv.innerHTML = '';

    // Elegir outcome según chance
    let roll = Math.random();
    let outcome = opt.outcomes[0];
    let cumChance = 0;

    for (const out of opt.outcomes) {
      const chance = out.chance !== undefined ? out.chance : 1.0;
      cumChance += chance;
      if (roll <= cumChance) {
        outcome = out;
        break;
      }
    }

    // Mostrar el texto del resultado
    textEl.innerHTML = `<span style="font-style:italic; color:#ffd700;">Result: ${opt.label}</span><br/><br/>${outcome.text}`;

    // Aplicar efectos
    if (outcome.effects) {
      outcome.effects.forEach((eff: any) => {
        RunSystem.resolveEffect(this.runState, eff);
      });
      this.game.registry.set('runState', this.runState);
      this.createHTMLOverlay(); // refrescar barra superior
    }

    // Botón Continuar
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-primary';
    nextBtn.innerText = 'CONTINUAR MISIÓN';
    nextBtn.style.marginTop = '20px';
    nextBtn.style.width = '100%';
    nextBtn.onclick = () => {
      // Registrar visita y cerrar
      this.runState.visitedNodeIds.push(this.runState.currentNodeId!);
      this.game.registry.set('runState', this.runState);
      modal.remove();
      this.drawMapGraph(); // redibujar
    };
    optionsDiv.appendChild(nextBtn);
  }

  // ═══════════════════════════════════════════════════════════
  //  SUPPLY SHOP OVERLAY
  // ═══════════════════════════════════════════════════════════

  private openSupplyShop(): void {
    if (!this.uiContainer) return;

    const modal = document.createElement('div');
    modal.className = 'glass-panel';
    modal.style.position = 'absolute';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = 'min(90%, 700px)';
    modal.style.maxHeight = '88%';
    modal.style.overflowY = 'auto';
    modal.style.padding = '20px';
    modal.style.boxSizing = 'border-box';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.pointerEvents = 'auto';
    modal.style.zIndex = '100';

    const title = document.createElement('h2');
    title.innerText = 'REQUISICIÓN Y SUMINISTROS';
    title.style.fontFamily = 'var(--font-title)';
    title.style.fontSize = '22px';
    title.style.color = 'var(--primary)';
    title.style.marginTop = '0';
    title.style.borderBottom = '1px solid var(--panel-border)';
    title.style.paddingBottom = '8px';

    const desc = document.createElement('p');
    desc.innerText = 'Adquirí mejoras tácticas o kits de campaña usando tus credenciales de Intel.';
    desc.style.fontSize = '12px';
    desc.style.color = '#aaa';

    const itemsDiv = document.createElement('div');
    itemsDiv.style.display = 'flex';
    itemsDiv.style.flexDirection = 'column';
    itemsDiv.style.gap = '12px';
    itemsDiv.style.margin = '15px 0';

    // Artículos en venta (3 mejoras aleatorias + kit médico)
    // Usaremos un coste de 2 Intel para Upgrades, 1 Intel para curar
    const shopOffers = [
      { id: 'barracks-1', name: 'Reclutas Curtidos', desc: 'Los Conscriptos ganan +20% HP.', cost: 2 },
      { id: 'armory-1', name: 'Munición Fresca', desc: 'Todos los aliados ganan +10% de daño.', cost: 2 },
      { id: 'med-tent-1', name: 'Vendas de Gasa Fuerte', desc: 'Médicos curan +30% más.', cost: 2 },
      { id: 'engineering-bay-1', name: 'Barricadas Reforzadas', desc: 'Barricadas ganan +50% HP.', cost: 2 },
      { id: 'war-room-1', name: 'Línea Directa', desc: 'CDs de comandante bajan 20%.', cost: 2 },
    ];

    // Mezclar y ofrecer 2
    const pickedOffers = Phaser.Utils.Array.Shuffle(shopOffers).slice(0, 2);

    pickedOffers.forEach(offer => {
      const itemRow = this.createShopItemRow(offer.name, offer.desc, offer.cost, () => {
        // Comprar mejora
        this.runState.intelEarned -= offer.cost;
        this.runState.upgradeIds.push(offer.id);
        this.game.registry.set('runState', this.runState);
        this.createHTMLOverlay(); // refrescar
      });
      itemsDiv.appendChild(itemRow);
    });

    // Añadir siempre la opción de curar HP del HQ
    const healOffer = { name: 'Botiquín de Campaña', desc: 'Restaura +30 HP a la base aliada.', cost: 1 };
    const healRow = this.createShopItemRow(healOffer.name, healOffer.desc, healOffer.cost, () => {
      this.runState.intelEarned -= healOffer.cost;
      this.runState.baseHp = Math.min(this.runState.baseMaxHp, this.runState.baseHp + 30);
      this.game.registry.set('runState', this.runState);
      this.createHTMLOverlay();
    });
    itemsDiv.appendChild(healRow);

    // Añadir opción de reclutar soldado aleatorio por 1 Intel
    const recruitClasses = ['rifleman', 'heavy-gunner', 'medic', 'engineer', 'sniper', 'flamethrower'];
    const randomClass = recruitClasses[Math.floor(Math.random() * recruitClasses.length)];
    const newRecruit = RunSystem.generateRandomSoldier(randomClass);
    const recruitRow = this.createShopItemRow(
      `Reclutar: ${newRecruit.name}`,
      `Clase: ${UNIT_INDEX[randomClass].name} ("${newRecruit.nickname}"). Sumalo a tu plantel.`,
      1,
      () => {
        this.runState.intelEarned -= 1;
        if (!this.runState.roster) this.runState.roster = [];
        this.runState.roster.push(newRecruit);
        this.game.registry.set('runState', this.runState);
        this.createHTMLOverlay();
      }
    );
    itemsDiv.appendChild(recruitRow);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-primary';
    closeBtn.innerText = 'SALIR DE LA ESTACIÓN';
    closeBtn.onclick = () => {
      this.runState.visitedNodeIds.push(this.runState.currentNodeId!);
      this.game.registry.set('runState', this.runState);
      modal.remove();
      this.drawMapGraph();
    };

    modal.appendChild(title);
    modal.appendChild(desc);
    modal.appendChild(itemsDiv);
    modal.appendChild(closeBtn);
    this.uiContainer.appendChild(modal);
  }

  private createShopItemRow(name: string, desc: string, cost: number, onBuy: () => void): HTMLElement {
    const row = document.createElement('div');
    row.className = 'glass-panel';
    row.style.padding = '10px';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';

    const info = document.createElement('div');
    info.innerHTML = `<span style="font-weight:bold; color:#fff; font-size:13px;">${name}</span><br/><span style="font-size:10px; color:#aaa;">${desc}</span>`;

    const buyBtn = document.createElement('button');
    buyBtn.className = 'btn-primary';
    buyBtn.style.padding = '6px 12px';
    buyBtn.style.fontSize = '12px';
    buyBtn.innerHTML = `COMPRAR ⬢ ${cost}`;

    const hasIntel = this.runState.intelEarned >= cost;
    
    // Validar si ya lo tiene (si es una mejora)
    // Buscar la id de mejora correspondiente
    const upDef = UPGRADES.find(u => u.name === name);
    const alreadyOwned = upDef ? this.runState.upgradeIds.includes(upDef.id) : false;

    if (alreadyOwned) {
      buyBtn.innerText = 'ADQUIRIDO';
      buyBtn.disabled = true;
      buyBtn.style.opacity = '0.5';
    } else if (!hasIntel) {
      buyBtn.disabled = true;
      buyBtn.style.opacity = '0.5';
    } else {
      buyBtn.onclick = () => {
        onBuy();
        row.style.opacity = '0.5';
        buyBtn.innerText = 'COMPRADO';
        buyBtn.disabled = true;
      };
    }

    row.appendChild(info);
    row.appendChild(buyBtn);
    return row;
  }

  // ═══════════════════════════════════════════════════════════
  //  HQ CAMP / REST SITE OVERLAY
  // ═══════════════════════════════════════════════════════════

  private openHQCamp(): void {
    if (!this.uiContainer) return;

    const modal = document.createElement('div');
    modal.className = 'glass-panel';
    modal.style.position = 'absolute';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = 'min(90%, 720px)';
    modal.style.maxHeight = '88%';
    modal.style.overflowY = 'auto';
    modal.style.padding = '20px';
    modal.style.boxSizing = 'border-box';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.pointerEvents = 'auto';
    modal.style.zIndex = '100';

    const title = document.createElement('h2');
    title.innerText = 'CUARTEL DE CAMPAÑA';
    title.style.fontFamily = 'var(--font-title)';
    title.style.fontSize = '22px';
    title.style.color = 'var(--primary)';
    title.style.marginTop = '0';
    title.style.borderBottom = '1px solid var(--panel-border)';
    title.style.paddingBottom = '8px';

    const desc = document.createElement('p');
    desc.innerText = 'Zona segura. El mando táctico debe elegir cómo distribuir los recursos del batallón.';
    desc.style.fontSize = '13px';
    desc.style.lineHeight = '1.4';
    desc.style.color = '#ccc';

    const actionsDiv = document.createElement('div');
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '15px';
    actionsDiv.style.margin = '20px 0';

    // Opción 1: Curar HP
    const restBtn = document.createElement('button');
    restBtn.className = 'btn-primary';
    restBtn.style.flex = '1';
    restBtn.style.height = '80px';
    restBtn.innerHTML = `<span style="font-size:18px;">🛠 REPARAR BASE</span><br/><span style="font-size:11px; color:#222; font-weight:bold;">(+30 Salud HQ)</span>`;
    restBtn.onclick = () => {
      this.runState.baseHp = Math.min(this.runState.baseMaxHp, this.runState.baseHp + 30);
      this.completeCamp(modal);
    };

    // Opción 2: Recuperar Moral
    const rallyBtn = document.createElement('button');
    rallyBtn.className = 'btn-primary';
    rallyBtn.style.flex = '1';
    rallyBtn.style.height = '80px';
    rallyBtn.innerHTML = `<span style="font-size:18px;">📣 ARENGAR TROPA</span><br/><span style="font-size:11px; color:#222; font-weight:bold;">(+20 Moral)</span>`;
    rallyBtn.onclick = () => {
      this.runState.morale = Math.min(100, this.runState.morale + 20);
      this.completeCamp(modal);
    };

    // Opción 3: Reclutar Refuerzos gratis
    const recruitBtn = document.createElement('button');
    recruitBtn.className = 'btn-primary';
    recruitBtn.style.flex = '1';
    recruitBtn.style.height = '80px';
    const recruitClasses = ['rifleman', 'heavy-gunner', 'medic', 'engineer', 'sniper', 'flamethrower'];
    const tempRecruit = RunSystem.generateRandomSoldier(recruitClasses[Math.floor(Math.random() * recruitClasses.length)]);
    recruitBtn.innerHTML = `<span style="font-size:18px;">🎖 RECLUTAR</span><br/><span style="font-size:11px; color:#222; font-weight:bold;">${tempRecruit.name} (${UNIT_INDEX[tempRecruit.unitId].name})</span>`;
    recruitBtn.onclick = () => {
      if (!this.runState.roster) {
        this.runState.roster = [];
      }
      this.runState.roster.push(tempRecruit);
      this.completeCamp(modal);
    };

    actionsDiv.appendChild(restBtn);
    actionsDiv.appendChild(rallyBtn);
    actionsDiv.appendChild(recruitBtn);

    modal.appendChild(title);
    modal.appendChild(desc);
    modal.appendChild(actionsDiv);
    this.uiContainer.appendChild(modal);
  }

  private completeCamp(modal: HTMLElement): void {
    // Guardar estado
    this.runState.visitedNodeIds.push(this.runState.currentNodeId!);
    this.game.registry.set('runState', this.runState);
    this.createHTMLOverlay(); // refrescar HP/moral superior
    
    modal.remove();
    this.drawMapGraph();
  }

  private openRosterOverlay(): void {
    if (!this.uiContainer) return;

    // Crear el overlay de fondo del modal a pantalla completa
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(10, 12, 10, 0.96)';
    overlay.style.zIndex = '200';
    overlay.style.pointerEvents = 'auto';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.padding = '20px';
    overlay.style.boxSizing = 'border-box';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.borderBottom = '2px solid var(--panel-border)';
    header.style.paddingBottom = '10px';
    header.style.marginBottom = '15px';

    const title = document.createElement('h2');
    title.innerText = 'PLANTEL DE COMBATIENTES';
    title.style.fontFamily = 'var(--font-title)';
    title.style.fontSize = '20px';
    title.style.color = 'var(--primary)';
    title.style.margin = '0';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-primary';
    closeBtn.style.padding = '6px 16px';
    closeBtn.style.fontSize = '12px';
    closeBtn.innerText = 'CERRAR';
    closeBtn.style.boxShadow = 'none';
    closeBtn.onclick = () => {
      overlay.remove();
    };

    header.appendChild(title);
    header.appendChild(closeBtn);
    overlay.appendChild(header);

    // Contenedor scrollable de la lista
    const listDiv = document.createElement('div');
    listDiv.style.flex = '1';
    listDiv.style.overflowY = 'auto';
    listDiv.style.display = 'flex';
    listDiv.style.flexDirection = 'column';
    listDiv.style.gap = '12px';
    listDiv.style.paddingRight = '5px';

    const roster = this.runState.roster || [];

    if (roster.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.innerText = 'No tenés soldados en el plantel. Reclutá en un campamento.';
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.color = '#888';
      emptyMsg.style.marginTop = '40px';
      listDiv.appendChild(emptyMsg);
    } else {
      roster.forEach((soldier: any) => {
        const def = UNIT_INDEX[soldier.unitId];
        if (!def) return;

        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '12px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '8px';

        // Fila 1: Nombre, Clase, Nivel
        const row1 = document.createElement('div');
        row1.style.display = 'flex';
        row1.style.justifyContent = 'space-between';
        row1.style.alignItems = 'center';

        const nameInfo = document.createElement('div');
        nameInfo.innerHTML = `
          <span style="font-weight:bold; color:#fff; font-size:14px;">${soldier.name}</span>
          <span style="font-size:11px; color:#aaa; margin-left: 8px;">[${def.name}]</span>
        `;

        const levelInfo = document.createElement('div');
        levelInfo.style.fontFamily = 'var(--font-title)';
        levelInfo.style.color = 'var(--primary)';
        levelInfo.style.fontSize = '12px';
        levelInfo.innerText = `NIVEL ${soldier.level}`;

        row1.appendChild(nameInfo);
        row1.appendChild(levelInfo);

        // Fila 2: Cuadro de texto para editar el apodo en tiempo real
        const row2 = document.createElement('div');
        row2.style.display = 'flex';
        row2.style.alignItems = 'center';
        row2.style.gap = '8px';

        const nickLabel = document.createElement('span');
        nickLabel.innerText = 'Apodo:';
        nickLabel.style.fontSize = '12px';
        nickLabel.style.color = '#888';

        const nickInput = document.createElement('input');
        nickInput.type = 'text';
        nickInput.value = soldier.nickname || '';
        nickInput.style.flex = '1';
        nickInput.style.background = '#222';
        nickInput.style.color = '#fff';
        nickInput.style.border = '1px solid #444';
        nickInput.style.padding = '4px 8px';
        nickInput.style.fontSize = '12px';
        nickInput.style.borderRadius = '2px';
        
        nickInput.oninput = () => {
          soldier.nickname = nickInput.value;
          this.game.registry.set('runState', this.runState);
        };

        row2.appendChild(nickLabel);
        row2.appendChild(nickInput);

        // Fila 3: Barra de XP y Selector de Color Tint
        const row3 = document.createElement('div');
        row3.style.display = 'flex';
        row3.style.justifyContent = 'space-between';
        row3.style.alignItems = 'center';
        row3.style.gap = '15px';

        const xpDiv = document.createElement('div');
        xpDiv.style.flex = '1';
        const xpPercentage = soldier.level >= 5 ? 1.0 : (soldier.xp % 100) / 100;
        const xpText = soldier.level >= 5 ? 'MAX XP' : `${soldier.xp % 100}/100 XP (Total: ${soldier.xp})`;
        xpDiv.appendChild(this.createProgressBar('#3b82f6', xpPercentage, xpText));

        // Selector de color
        const colorDiv = document.createElement('div');
        colorDiv.style.display = 'flex';
        colorDiv.style.gap = '4px';
        colorDiv.style.alignItems = 'center';

        const colors = [
          { value: 0xffffff, hex: '#ffffff' }, // Blanco (Default)
          { value: 0x4ade80, hex: '#4ade80' }, // Verde
          { value: 0x60a5fa, hex: '#60a5fa' }, // Azul
          { value: 0xf43f5e, hex: '#f43f5e' }, // Rojo
          { value: 0xf59e0b, hex: '#f59e0b' }, // Amarillo
          { value: 0xa855f7, hex: '#a855f7' }, // Púrpura
        ];

        colors.forEach(col => {
          const circle = document.createElement('div');
          circle.style.width = '14px';
          circle.style.height = '14px';
          circle.style.borderRadius = '50%';
          circle.style.background = col.hex;
          circle.style.cursor = 'pointer';
          circle.style.border = soldier.colorTint === col.value ? '2px solid #fff' : '1px solid #000';
          
          circle.onclick = () => {
            soldier.colorTint = col.value;
            this.game.registry.set('runState', this.runState);
            // Actualizar bordes
            Array.from(colorDiv.children).forEach((child: any, idx) => {
              child.style.border = colors[idx].value === col.value ? '2px solid #fff' : '1px solid #000';
            });
          };

          colorDiv.appendChild(circle);
        });

        row3.appendChild(xpDiv);
        row3.appendChild(colorDiv);

        card.appendChild(row1);
        card.appendChild(row2);
        card.appendChild(row3);
        listDiv.appendChild(card);
      });
    }

    overlay.appendChild(listDiv);
    this.uiContainer.appendChild(overlay);
  }

  private showGameOverRosterEmpty(): void {
    if (!this.uiContainer) return;
    this.uiContainer.innerHTML = '';

    const modal = document.createElement('div');
    modal.className = 'glass-panel';
    modal.style.position = 'absolute';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = 'min(90%, 600px)';
    modal.style.padding = '30px 20px';
    modal.style.boxSizing = 'border-box';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.pointerEvents = 'auto';
    modal.style.zIndex = '300';

    const title = document.createElement('h2');
    title.innerText = 'SIN SOLDADOS ACTIVOS';
    title.style.fontFamily = 'var(--font-title)';
    title.style.fontSize = '24px';
    title.style.color = '#ef4444';
    title.style.margin = '0 0 15px 0';

    const desc = document.createElement('p');
    desc.innerText = 'El batallón completo fue aniquilado. No quedan combatientes para sostener la línea en la Patagonia.';
    desc.style.fontSize = '14px';
    desc.style.color = '#ccc';
    desc.style.textAlign = 'center';
    desc.style.lineHeight = '1.5';
    desc.style.margin = '0 0 25px 0';

    const menuBtn = document.createElement('button');
    menuBtn.className = 'btn-primary';
    menuBtn.innerText = 'MENÚ PRINCIPAL';
    menuBtn.style.width = '100%';
    menuBtn.onclick = () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu');
      });
    };

    modal.appendChild(title);
    modal.appendChild(desc);
    modal.appendChild(menuBtn);
    this.uiContainer.appendChild(modal);
  }
}
