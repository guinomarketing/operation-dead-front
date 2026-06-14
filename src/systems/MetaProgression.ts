/**
 * MetaProgression — progreso PERSISTENTE entre runs (localStorage).
 * Empezás con un solo soldado (Conscripto) y vas desbloqueando el resto del
 * plantel con medallas ganadas en las runs.
 */
const KEY = 'pz_meta_v1';

/** Orden de desbloqueo y costo en medallas. El Conscripto viene gratis. */
export const UNLOCK_CATALOG: Array<{ id: string; cost: number }> = [
  { id: 'rifleman', cost: 0 },
  { id: 'gaucho', cost: 4 },
  { id: 'heavy-gunner', cost: 5 },
  { id: 'medic', cost: 6 },
  { id: 'flamethrower', cost: 7 },
  { id: 'sniper', cost: 8 },
  { id: 'engineer', cost: 8 },
  { id: 'bombero', cost: 9 },
  { id: 'electricista', cost: 10 },
  { id: 'colectivero', cost: 11 },
  { id: 'cientifica', cost: 12 },
  { id: 'veterano', cost: 14 },
];

interface MetaState {
  unlocked: string[];
  medals: number;
  runsWon: number;
  tutorialDone: boolean;
}

function load(): MetaState {
  try {
    const s = localStorage.getItem(KEY);
    if (s) {
      const p = JSON.parse(s);
      return {
        unlocked: Array.isArray(p.unlocked) && p.unlocked.length ? p.unlocked : ['rifleman'],
        medals: typeof p.medals === 'number' ? p.medals : 0,
        runsWon: typeof p.runsWon === 'number' ? p.runsWon : 0,
        tutorialDone: !!p.tutorialDone,
      };
    }
  } catch (e) { /* ignore */ }
  return { unlocked: ['rifleman'], medals: 0, runsWon: 0, tutorialDone: false };
}

function save(s: MetaState): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
}

export const MetaProgression = {
  get state(): MetaState { return load(); },

  getUnlocked(): string[] {
    const u = load().unlocked;
    return u.includes('rifleman') ? u : ['rifleman', ...u];
  },

  isUnlocked(id: string): boolean { return load().unlocked.includes(id); },

  getMedals(): number { return load().medals; },
  addMedals(n: number): void { const s = load(); s.medals += n; save(s); },

  costFor(id: string): number {
    const e = UNLOCK_CATALOG.find((c) => c.id === id);
    return e ? e.cost : 99;
  },

  /** Intenta desbloquear una unidad gastando medallas. Devuelve true si pudo. */
  unlock(id: string): boolean {
    const s = load();
    if (s.unlocked.includes(id)) return false;
    const cost = this.costFor(id);
    if (s.medals < cost) return false;
    s.medals -= cost;
    s.unlocked.push(id);
    save(s);
    return true;
  },

  markRunWon(): void { const s = load(); s.runsWon += 1; save(s); },

  isTutorialDone(): boolean { return load().tutorialDone; },
  setTutorialDone(): void { const s = load(); s.tutorialDone = true; save(s); },

  /** Solo para pruebas: desbloquear todo. */
  unlockAll(): void {
    const s = load();
    s.unlocked = UNLOCK_CATALOG.map((c) => c.id);
    save(s);
  },

  resetProgress(): void { save({ unlocked: ['rifleman'], medals: 0, runsWon: 0, tutorialDone: false }); },
};
