import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { COLORS, hex, FONTS } from '../ui/colors';
import { RunSystem } from '../systems/RunSystem';
import type { RunState, RunMapDef, RunNodeDef } from '../types/RunTypes';
import { EVENTS } from '../data/events';
import { UPGRADES } from '../data/upgrades';

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

  private getXCoord(col: number): number {
    if (col === 0) return 130;
    if (col === 2) return 410;
    return 270; // centro
  }

  private getYCoord(row: number): number {
    // Distribuido desde Y=790 (Fila 0) hasta Y=190 (Fila 8)
    return 790 - row * 75;
  }

  private drawMapGraph(): void {
    this.g.clear();

    const nodes = this.mapDef.nodes;
    
    // 1. Dibujar líneas de conexión primero (quedan detrás de los nodos)
    nodes.forEach(n => {
      const sx = this.getXCoord(n.col);
      const sy = this.getYCoord(n.row);

      n.edges.forEach(edgeId => {
        const destNode = nodes.find(dn => dn.id === edgeId);
        if (destNode) {
          const dx = this.getXCoord(destNode.col);
          const dy = this.getYCoord(destNode.row);

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
      const x = this.getXCoord(n.col);
      const y = this.getYCoord(n.row);
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
    hqDiv.innerHTML = `<span style="color:#3b82f6; font-size:10px; font-weight:bold; letter-spacing:1px;">HQ HEALTH</span>`;
    const hqBar = this.createProgressBar('#3b82f6', this.runState.baseHp / this.runState.baseMaxHp, `${this.runState.baseHp}/${this.runState.baseMaxHp}`);
    hqDiv.appendChild(hqBar);

    // Moral Bar
    const moraleDiv = document.createElement('div');
    moraleDiv.style.width = '100px';
    moraleDiv.innerHTML = `<span style="color:#eab308; font-size:10px; font-weight:bold; letter-spacing:1px;">MORALE</span>`;
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
      <div style="color:#eab308">★ ${this.runState.medalsEarned} <span style="font-family:var(--font-body); font-size:10px; color:#aaa;">MEDALS</span></div>
      <div style="color:#fff">⚙ ${this.runState.upgradeIds.length} <span style="font-family:var(--font-body); font-size:10px; color:#aaa;">UPGRADES</span></div>
    `;

    // Derecha: Botón Salir / Retirarse
    const exitBtn = document.createElement('button');
    exitBtn.style.background = '#3f3f3f';
    exitBtn.style.color = '#fff';
    exitBtn.style.border = '1px solid #555';
    exitBtn.style.padding = '4px 8px';
    exitBtn.style.fontSize = '11px';
    exitBtn.style.fontWeight = 'bold';
    exitBtn.style.cursor = 'pointer';
    exitBtn.innerText = 'RETIRE';
    exitBtn.onclick = () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu');
      });
    };

    topBar.appendChild(statusDiv);
    topBar.appendChild(currencyDiv);
    topBar.appendChild(exitBtn);

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
    modal.style.top = '150px';
    modal.style.left = '50%';
    modal.style.transform = 'translateX(-50%)';
    modal.style.width = '88%';
    modal.style.maxHeight = '620px';
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
    nextBtn.innerText = 'CONTINUE MISSION';
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
    modal.style.top = '150px';
    modal.style.left = '50%';
    modal.style.transform = 'translateX(-50%)';
    modal.style.width = '88%';
    modal.style.padding = '20px';
    modal.style.boxSizing = 'border-box';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.pointerEvents = 'auto';
    modal.style.zIndex = '100';

    const title = document.createElement('h2');
    title.innerText = 'REQUISITIONS & SUPPLIES';
    title.style.fontFamily = 'var(--font-title)';
    title.style.fontSize = '22px';
    title.style.color = 'var(--primary)';
    title.style.marginTop = '0';
    title.style.borderBottom = '1px solid var(--panel-border)';
    title.style.paddingBottom = '8px';

    const desc = document.createElement('p');
    desc.innerText = 'Acquire tactical upgrades or field kits using your Intel credentials.';
    desc.style.fontSize = '12px';
    desc.style.color = '#aaa';

    const itemsDiv = document.createElement('div');
    itemsDiv.style.display = 'flex';
    itemsDiv.style.flexDirection = 'column';
    itemsDiv.style.gap = '12px';
    itemsDiv.style.margin = '15px 0';

    // Artículos en venta (3 mejoras aleatorias + kit médico)
    // Usaremos un coste fijo de 2 Intel para Upgrades, 1 Intel para curar
    const shopOffers = [
      { id: 'barracks-1', name: 'Hardened Recruits', desc: 'Riflemen gain +20% HP.', cost: 2 },
      { id: 'armory-1', name: 'Fresh Ammunition', desc: 'All allies gain +10% damage.', cost: 2 },
      { id: 'med-tent-1', name: 'Better Bandages', desc: 'Medics heal +30% more.', cost: 2 },
      { id: 'engineering-bay-1', name: 'Reinforced Barricades', desc: 'Barricades gain +50% HP.', cost: 2 },
      { id: 'war-room-1', name: 'Direct Line', desc: 'Commander CDs reduced by 20%.', cost: 2 },
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
    const healOffer = { name: 'Field Medical Kit', desc: 'Restores +30 HP to the HQ.', cost: 1 };
    const healRow = this.createShopItemRow(healOffer.name, healOffer.desc, healOffer.cost, () => {
      this.runState.intelEarned -= healOffer.cost;
      this.runState.baseHp = Math.min(this.runState.baseMaxHp, this.runState.baseHp + 30);
      this.game.registry.set('runState', this.runState);
      this.createHTMLOverlay();
    });
    itemsDiv.appendChild(healRow);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-primary';
    closeBtn.innerText = 'LEAVE STATION';
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
    buyBtn.innerHTML = `BUY ⬢ ${cost}`;

    const hasIntel = this.runState.intelEarned >= cost;
    
    // Validar si ya lo tiene (si es una mejora)
    // Buscar la id de mejora correspondiente
    const upDef = UPGRADES.find(u => u.name === name);
    const alreadyOwned = upDef ? this.runState.upgradeIds.includes(upDef.id) : false;

    if (alreadyOwned) {
      buyBtn.innerText = 'OWNED';
      buyBtn.disabled = true;
      buyBtn.style.opacity = '0.5';
    } else if (!hasIntel) {
      buyBtn.disabled = true;
      buyBtn.style.opacity = '0.5';
    } else {
      buyBtn.onclick = () => {
        onBuy();
        row.style.opacity = '0.5';
        buyBtn.innerText = 'BOUGHT';
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
    modal.style.top = '180px';
    modal.style.left = '50%';
    modal.style.transform = 'translateX(-50%)';
    modal.style.width = '88%';
    modal.style.padding = '20px';
    modal.style.boxSizing = 'border-box';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.pointerEvents = 'auto';
    modal.style.zIndex = '100';

    const title = document.createElement('h2');
    title.innerText = 'FIELD HEADQUARTERS';
    title.style.fontFamily = 'var(--font-title)';
    title.style.fontSize = '22px';
    title.style.color = 'var(--primary)';
    title.style.marginTop = '0';
    title.style.borderBottom = '1px solid var(--panel-border)';
    title.style.paddingBottom = '8px';

    const desc = document.createElement('p');
    desc.innerText = 'Secure area. Command must choose how to deploy remaining resources for the battalion.';
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
    restBtn.innerHTML = `<span style="font-size:18px;">🛠 REPAIR HQ</span><br/><span style="font-size:11px; color:#222; font-weight:bold;">(+30 HQ Health)</span>`;
    restBtn.onclick = () => {
      this.runState.baseHp = Math.min(this.runState.baseMaxHp, this.runState.baseHp + 30);
      this.completeCamp(modal);
    };

    // Opción 2: Recuperar Moral
    const rallyBtn = document.createElement('button');
    rallyBtn.className = 'btn-primary';
    rallyBtn.style.flex = '1';
    rallyBtn.style.height = '80px';
    rallyBtn.innerHTML = `<span style="font-size:18px;">📣 RALLY TROOPS</span><br/><span style="font-size:11px; color:#222; font-weight:bold;">(+20 Morale)</span>`;
    rallyBtn.onclick = () => {
      this.runState.morale = Math.min(100, this.runState.morale + 20);
      this.completeCamp(modal);
    };

    actionsDiv.appendChild(restBtn);
    actionsDiv.appendChild(rallyBtn);

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
}
