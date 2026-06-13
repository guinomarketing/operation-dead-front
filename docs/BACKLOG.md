# Backlog — Operation Dead Front

Formato por issue: **Fase · Tamaño (S/M/L) · Depende de · Objetivo · Criterios ·
Archivos**. Los issues 1–7 (MVP 0.1) están **hechos** en esta build; quedan como
referencia de lo construido.

---

## Landscape / camino a v1.0 (prioridad actual)

- **L-1 · Landscape 16:9** — ✅ HECHO. Migración portrait→horizontal. `constants.ts`, `style.css`, `BattleScene`, `BattleUI`, `MapScene`, `ResultScene`, `BattleSystem`. Ver `LANDSCAPE_REFACTOR.md`.
- **L-2 · Fondos 16:9 (M)** — dep L-1 — reemplazar `battlefield.png` y búnkers por arte horizontal nativo (prompts en `MAGNIFIC_PROMPTS.md`). Criterio: sin recorte/distorsión, lectura PvZ. Archivos: `public/assets/backgrounds/*`, `BootScene`.
- **L-3 · Carriles ilustrados (S)** — dep L-2 — trincheras/líneas por carril para reforzar lectura de amenazas.
- **L-4 · Sprites de unidades argentinas (L)** — dep L-2 — 12 unidades del brandbook (3/4 lateral), reemplazar `SpriteFactory`. Archivos: `public/assets/sprites/unit-*`, `BootScene`, `UnitRenderer`.
- **L-5 · Sprites enemigos + bosses (L)** — dep L-2 — 9 enemigos + 3 bosses.
- **L-6 · Animaciones (L)** — dep L-4/L-5 — idle/walk/attack/death; spritesheets o tween-based.
- **L-7 · Audio + música (M)** — SFX y loops; `AudioSystem` + settings de volumen.
- **L-8 · Tutorial (M)** — onboarding integrado en la primera batalla.
- **L-9 · Variedad de rooms (L)** — tipos de sala con objetivos/modificadores/fondos distintos.
- **L-10 · Event screen 2 columnas (S)** — dep L-2 — ilustración izquierda / texto-decisiones derecha.
- **L-11 · Meta-progresión + guardado (M)** — desbloqueos persistentes entre runs.
- **L-12 · Build mobile (M)** — Capacitor Android, lock landscape, safe-areas, key art/screenshots.

---

## MVP 0.1 — hecho

### 1 · Setup Phaser/Vite/TS — `S` ✅
Proyecto Vite + TypeScript + Phaser 3, escenas Boot/Preload mínimas, Scale.FIT 540×960.
**Archivos:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`,
`src/main.ts`, `src/scenes/BootScene.ts`.

### 2 · BattleScene base + menú — `M` ✅
Menú con título/lore/Deploy. BattleScene con base aliada, bastión enemigo, terreno
placeholder y HUD. **Archivos:** `MainMenuScene.ts`, `BattleScene.ts`, `ui/colors.ts`.

### 3 · Despliegue de Rifleman — `M` ✅
Carta de Rifleman (coste 25, cd 2 s) que spawnea desde `data/units.ts`.
**Criterios:** no deja desplegar sin supplies ni en cooldown; feedback visual.

### 4 · Revenant Grunt automático — `S` ✅
Spawn cada 3,5 s desde `data/enemies.ts`. **Archivos:** `BattleScene.ts`, `constants.ts`.

### 5 · Combate automático — `M` ✅
Avance, detección de objetivo por carril, rango, ataque por intervalos, daño con
armadura, muerte y limpieza. **Archivos:** `systems/BattleSystem.ts`.

### 6 · Economía de supplies — `S` ✅
+8/s, arranque 40, contador en HUD, bounty por matar. **Archivos:** `BattleSystem.ts`.

### 7 · HP de bases + win/lose — `M` ✅
HQ 100 / bastión 250, daño al alcanzar base, victoria/derrota + ResultScene con
reinicio. **Archivos:** `BattleSystem.ts`, `ResultScene.ts`.

---

## MVP 0.2 — siguiente

### 8 · Moral — `M` · dep 7
MoraleSystem persistente; sube por kills/oleadas, baja por bajas/golpes; ruta a 0.
**Criterios:** barra de moral en HUD; derrota por moral además de por HP.

### 9 · Cartas de unidades (Heavy + Medic) — `M` · dep 3
Agregar Heavy Gunner y Medic a `DEPLOYABLE`; Medic cura en radio (usar `healPower`).
**Criterios:** las 3 cartas funcionan con sus costes/cooldowns reales.

### 10 · Más enemigos (Runner + Exploder) — `M` · dep 5
Runner (rush) y Exploder (kamikaze con daño en área a la muerte/contacto).
**Criterios:** Exploder daña en radio y pega a la base si llega.

### 11 · Primera oleada (WaveSystem) — `M` · dep 4
Reemplazar el spawn fijo por oleadas con presupuesto (`WAVES`).
**Criterios:** las oleadas escalan con la fila; hay pausa entre oleadas.

### 12 · Habilidad Airstrike + botón — `M` · dep 6
AbilityButton con coste+cooldown; Airstrike (zone-damage) desde `data/abilities.ts`.
**Criterios:** daño en área tras delay; respeta coste y cooldown.

### 13 · Recompensa post-combate — `M` · dep 7
Pantalla de 1-de-3 cartas (unidad/upgrade/reliquia/supplies). **Criterios:** la
elección persiste a la siguiente batalla.

---

## MVP 0.3 — la run

### 14 · Mapa de run — `L` · dep 13
Generación por semilla (8–10 filas), navegación de nodos, tipos battle/elite/event/
supply/hq/boss. **Archivos:** `systems/RunSystem.ts`, `types/RunTypes.ts`.

### 15 · Eventos narrativos — `M` · dep 14
Render de `data/events.ts`, resolución de `RunEffect[]`, outcomes con chance/hidden.

### 16 · Upgrades de cuartel — `M` · dep 13
Enchufar 10 upgrades (`data/upgrades.ts`) como recompensas; aplicar modifiers.

### 17 · Boss inicial — `L` · dep 11
General Eisenfaust con fases por umbral de HP (`data/bosses.ts`).

### 18 · Guardado local — `M` · dep 14
`SaveSchema` v1 en localStorage; reanudar run. **Archivos:** `systems/SaveSystem.ts`.

### 19 · Polish mobile — `M` · dep 17
Safe areas, feedback táctil, pausa, ajuste de tamaños de toque.

---

## Soporte

### 20 · Setup vitest — `S`
Tests de `BattleSystem`/`MoraleSystem`/economía (la lógica ya corre headless).

### 21 · Reliquias base (5) — `M` · dep 13
Activar 5 reliquias con sus hooks/modifiers como recompensas tempranas.
