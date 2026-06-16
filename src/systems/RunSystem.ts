import type { RunState, RunMapDef, RunNodeDef, NodeType, RunEffect, RosterSoldier } from '../types/RunTypes';
import { BASES, MORALE } from '../utils/constants';
import { MetaProgression } from './MetaProgression';
import { OPERATION_INDEX } from '../data/operations';
import { RELICS } from '../data/relics';
import { createSeededRandom, randomInt, randomItem } from '../utils/SeededRandom';

const NOMBRES = ['Juan', 'Esteban', 'Santiago', 'Ignacio', 'Facundo', 'Lautaro', 'Bautista', 'Mateo', 'Rodrigo', 'Lucas', 'Enzo', 'Lionel', 'Beto', 'Cacho', 'Tito', 'Gato', 'Charly', 'Diego', 'Lucho', 'Felipe'];
const APELLIDOS = ['Pérez', 'Rodríguez', 'González', 'Gómez', 'Fernández', 'López', 'Martínez', 'Álvarez', 'Romero', 'Sosa', 'Benítez', 'Giménez', 'Medina', 'Herrera', 'Castro', 'Paz', 'Ortega', 'Rojas', 'Díaz', 'Silva'];
const APODOS = ['El Toro', 'El Gaucho', 'Lobo', 'Pájaro', 'Pulga', 'Pampa', 'Carancho', 'Comadreja', 'Víbora', 'Yacaré', 'Facha', 'Manco', 'Flaco', 'Gordo', 'Chino', 'Negro', 'Pibe', 'El Capo', 'La Fiera', 'Cuchillo'];

export class RunSystem {
  static generateRandomSoldier(unitId: string, random: () => number = Math.random): RosterSoldier {
    const id = 'soldier_' + random().toString(36).substring(2, 9);
    const name = randomItem(random, NOMBRES) + ' ' + randomItem(random, APELLIDOS);
    const nickname = randomItem(random, APODOS);
    return {
      id,
      unitId,
      name,
      nickname,
      level: 1,
      xp: 0,
      colorTint: 0xffffff,
      status: 'ready',
      kills: 0,
    };
  }

  /**
   * Inicializa un nuevo estado de run limpio con el plantel (roster) inicial.
   */
  static startNewRun(
    operationId: string = 'op-first-light',
    commanderId: string = 'capt-miller',
    seed: string = Math.random().toString(36).substring(2, 10),
  ): RunState {
    const random = createSeededRandom(`${seed}:roster`);

    // Plantel inicial: 3 Conscriptos + 1 de cada clase YA desbloqueada (meta-progreso).
    const unlocked = MetaProgression.getUnlocked();
    const roster: RosterSoldier[] = [
      RunSystem.generateRandomSoldier('rifleman', random),
      RunSystem.generateRandomSoldier('rifleman', random),
      RunSystem.generateRandomSoldier('rifleman', random),
    ];
    for (const id of unlocked) {
      if (id !== 'rifleman') roster.push(RunSystem.generateRandomSoldier(id, random));
    }

    return {
      operationId,
      commanderId,
      seed,
      currentNodeId: null,
      visitedNodeIds: [],
      baseHp: BASES.ALLY_HP,
      baseMaxHp: BASES.ALLY_HP,
      morale: MORALE.START,
      suppliesBonusNextBattle: 0,
      unlockedUnitIds: unlocked,
      equippedAbilityIds: ['airstrike', 'medkit'],
      upgradeIds: [],
      relicIds: [],
      mutationIds: [],
      flags: [],
      intelEarned: 0,
      medalsEarned: 0,
      kills: 0,
      roster,
    };
  }

  /**
   * Genera un mapa procedimental de 9 filas (0 a 8).
   * La fila 8 contiene únicamente el Boss.
   * La fila 0 contiene los puntos de entrada iniciales.
   * No hay élites en las filas 1 y 2.
   */
  static generateMap(seed: string, operationId: string = 'op-first-light'): RunMapDef {
    const nodes: RunNodeDef[] = [];
    const operation = OPERATION_INDEX[operationId] || OPERATION_INDEX['op-first-light'];
    const random = createSeededRandom(`${seed}:${operation.id}:map`);
    const rowsBeforeBoss = randomInt(random, operation.rows[0], operation.rows[1]);
    const rowsCount = rowsBeforeBoss + 1;

    // Generar nodos para cada fila
    for (let r = 0; r < rowsCount; r++) {
      if (r === rowsCount - 1) {
        // Fila final: Boss
        nodes.push({
          id: `node_${r}_1`,
          row: r,
          col: 1,
          type: 'boss',
          battleMode: 'assault',
          edges: [],
        });
      } else {
        // Filas 0 a 7: 3 nodos por fila
        const cols = [0, 1, 2];
        cols.forEach(c => {
          let type: NodeType = 'battle';
          
          // Asignar tipo según fila
          if (r === 0) {
            // Fila 0: Solo batallas y eventos
            type = random() < 0.6 ? 'battle' : 'event';
          } else {
            const roll = random();
            if (roll < 0.45) {
              type = 'battle';
            } else if (roll < 0.65) {
              type = 'event';
            } else if (roll < 0.78) {
              // Elites solo a partir de fila 3 (GDD: sin élites en filas 1-2)
              type = r >= 3 ? 'elite' : 'battle';
            } else if (roll < 0.90) {
              type = 'supply';
            } else {
              type = 'hq';
            }
          }

          nodes.push({
            id: `node_${r}_${c}`,
            row: r,
            col: c,
            type,
            battleMode: type === 'elite' ? 'defense' : (random() < 0.5 ? 'assault' : 'defense'),
            edges: [],
          });
        });
      }
    }

    // Crear conexiones (edges) de fila r a fila r+1
    for (let r = 0; r < rowsCount - 1; r++) {
      const currentNodes = nodes.filter(n => n.row === r);
      const nextNodes = nodes.filter(n => n.row === r + 1);

      if (r === rowsCount - 2) {
        // La penultima fila conecta completa al boss.
        currentNodes.forEach(n => {
          n.edges.push(`node_${rowsCount - 1}_1`);
        });
      } else {
        // Conexión regular entre filas de 3 nodos
        // Asegurar que cada nodo de fila r conecte a 1 o 2 nodos de fila r+1
        currentNodes.forEach(n => {
          const c = n.col;
          const possibleCols = [c - 1, c, c + 1].filter(col => col >= 0 && col <= 2);
          
          // Elegir al menos una conexión cercana
          const mainCol = randomItem(random, possibleCols);
          n.edges.push(`node_${r+1}_${mainCol}`);

          // 40% de probabilidad de una segunda conexión
          if (possibleCols.length > 1 && random() < 0.4) {
            const otherCols = possibleCols.filter(col => col !== mainCol);
            const secondCol = randomItem(random, otherCols);
            n.edges.push(`node_${r+1}_${secondCol}`);
          }
        });

        // Asegurar que no queden nodos huérfanos en fila r+1 (sin conexiones entrantes)
        nextNodes.forEach(nextN => {
          const incoming = currentNodes.filter(currN => currN.edges.includes(nextN.id));
          if (incoming.length === 0) {
            // Forzar conexión desde el nodo más cercano en columna
            const closest = currentNodes.find(currN => Math.abs(currN.col - nextN.col) <= 1) || currentNodes[0];
            closest.edges.push(nextN.id);
          }
        });
      }
    }

    return {
      seed,
      nodes,
      startNodeId: 'node_0_1', // Fila 0, centro (se puede empezar por cualquier nodo de fila 0)
      bossNodeId: `node_${rowsCount - 1}_1`,
    };
  }

  /**
   * Resuelve un efecto de la run y modifica el estado.
   */
  static resolveEffect(state: RunState, effect: RunEffect): void {
    switch (effect.kind) {
      case 'supplies':
        state.suppliesBonusNextBattle += effect.amount;
        break;
      case 'intel':
        state.intelEarned += effect.amount;
        break;
      case 'medals':
        state.medalsEarned += effect.amount;
        break;
      case 'morale':
        state.morale = Math.max(0, Math.min(100, state.morale + effect.amount));
        break;
      case 'base-hp':
        state.baseHp = Math.max(0, Math.min(state.baseMaxHp, state.baseHp + effect.amount));
        break;
      case 'unlock-unit':
        if (!state.unlockedUnitIds.includes(effect.unitId)) {
          state.unlockedUnitIds.push(effect.unitId);
        }
        break;
      case 'gain-upgrade':
        if (effect.upgradeId && !state.upgradeIds.includes(effect.upgradeId)) {
          state.upgradeIds.push(effect.upgradeId);
        }
        break;
      case 'gain-relic':
        {
          if (!state.relicIds) state.relicIds = [];
          const relicId = effect.relicId || RunSystem.pickRandomRelicId(state);
          if (relicId && !state.relicIds.includes(relicId)) {
            state.relicIds.push(relicId);
          }
        }
        break;
      case 'add-mutation':
        if (effect.mutationId && !state.mutationIds.includes(effect.mutationId)) {
          state.mutationIds.push(effect.mutationId);
        }
        break;
      case 'remove-mutation':
        if (effect.mutationId) {
          state.mutationIds = state.mutationIds.filter(id => id !== effect.mutationId);
        } else if (state.mutationIds.length > 0) {
          state.mutationIds.pop();
        }
        break;
      case 'flag':
        if (!state.flags.includes(effect.id)) {
          state.flags.push(effect.id);
        }
        break;
      default:
        break;
    }
  }

  private static pickRandomRelicId(state: RunState): string | undefined {
    const owned = new Set(state.relicIds || []);
    const available = RELICS.filter((relic) => !owned.has(relic.id));
    if (available.length === 0) return undefined;
    return randomItem(Math.random, available).id;
  }
}
