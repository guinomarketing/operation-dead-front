# Arquitectura técnica — Operation Dead Front

## Stack

- **Phaser 3.80+** — motor de juego 2D (render, input, escenas, tweens).
- **TypeScript 5.x** (strict) — contratos y seguridad de tipos.
- **Vite 5** — dev server + build. `base: './'` para servir desde cualquier path.
- **Capacitor** (fase Beta) — empaquetado iOS/Android desde la misma build web.

## Principios

1. **Las escenas orquestan, los sistemas tienen la lógica, la data es declarativa,
   los tipos son contratos.** Ningún archivo de `/types` ni `/data` importa Phaser.
2. **Lógica testeable sin motor.** `BattleSystem` corre headless (lo prueba el smoke
   test en Node). Las escenas sólo dibujan el estado del sistema.
3. **Data-driven.** Agregar una unidad/enemigo/evento es agregar un objeto en
   `/src/data`; el motor no se toca.
4. **Una fuente de números:** `src/utils/constants.ts`. Los sistemas leen de ahí.

## Carpetas

```
src/
├─ main.ts        Config de Phaser y registro de escenas. Único punto que instancia el juego.
├─ scenes/        Boot · MainMenu · Battle · Result. Crean GameObjects y leen sistemas.
├─ systems/       Lógica pura. BattleSystem hoy; Economy/Morale/Wave/Run vendrán acá.
├─ data/          Contenido declarativo + índices por id (UNIT_INDEX, etc.).
├─ types/         Interfaces y uniones. Contratos compartidos data↔sistemas.
├─ ui/            Paleta (colors.ts) y, a futuro, componentes de HUD reutilizables.
└─ utils/         constants.ts y helpers sin estado.
```

## Flujo de una batalla

1. `BattleScene.create()` instancia `BattleSystem`, dibuja fondo, bases, HUD y la
   barra de despliegue.
2. Cada frame, `update(_, delta)`:
   - acumula el timer de spawn de grunts (MVP 0.1: intervalo fijo),
   - descuenta cooldowns de despliegue,
   - llama `sim.update(delta)` (la simulación avanza),
   - reacciona a `sim.pendingEvents` (FX: shake, puffs),
   - sincroniza sprites con `sim.combatants` y refresca el HUD.
3. Cuando `sim.outcome` deja de ser `'ongoing'`, pasa a `ResultScene`.

`BattleSystem` no sabe nada de Phaser: expone `combatants`, `supplies`, `allyBaseHp`,
`enemyBaseHp`, `outcome` y `pendingEvents`, más `spawnAlly/spawnEnemy/update`.

## Flujo de una run (MVP 0.3+)

`RunState` (en `types/RunTypes.ts`) es el estado serializable: operación, comandante,
seed, nodo actual, baseHp/morale persistentes, unidades/reliquias/upgrades/mutaciones,
flags y contadores meta. `RunSystem` resolverá `RunEffect[]` (vocabulario cerrado) que
producen eventos, recompensas y reliquias.

## Convenciones

- **IDs** en kebab-case (`revenant-grunt`). **Clases** PascalCase.
- **Tiempos** en ms; **velocidades** en px/s; **rangos/posiciones** en px.
- **Sin physics engine**: el movimiento es manual (x += v·dt). Suficiente y barato
  para un lane battler.
- **Pooling / límites**: respetar `LIMITS` (10 aliados, 25 enemigos) por perf mobile.

## Agregar contenido (checklists)

**Unidad nueva:** objeto en `data/units.ts` (con `placeholder`) → aparece en
`UNIT_INDEX` → agregarla a `DEPLOYABLE` en `BattleScene` si querés desplegarla ya.

**Enemigo nuevo:** objeto en `data/enemies.ts` → spawneable vía
`sim.spawnEnemy(id)`.

**Evento nuevo:** objeto en `data/events.ts` usando sólo `RunEffect` válidos.

**Reliquia/upgrade nuevos:** objeto en su data; los `hooks` que use deben estar en el
registro de `types/common.ts` y resolverse en el sistema indicado.

## Persistencia (MVP 0.3+)

`SaveSchema` v1 en `localStorage` (migración a Capacitor Preferences en Beta):

```ts
{ version: 1, meta: { medals, intel, unlocks, settings }, currentRun: RunState | null, stats }
```

Versionado explícito para permitir migraciones.

## Render y escalado

Viewport lógico 540×960 (portrait). `Phaser.Scale.FIT` + `CENTER_BOTH`: el juego
escala a cualquier pantalla manteniendo proporción. `index.html` fija `viewport-fit=cover`
y `touch-action: none` para comportamiento mobile correcto.

## Event bus (a medida que crezca)

Phaser `EventEmitter` para desacoplar sistemas de UI. Eventos previstos:
`unit:deployed`, `unit:died`, `enemy:killed`, `base:damaged`, `battle:won`,
`battle:lost`, `morale:changed`, `economy:changed`, `wave:started`, `ability:cast`.
En el MVP 0.1 esto se resuelve con `pendingEvents`; se migra a bus cuando haya más
consumidores.

## Testing

Lógica pura testeable con vitest sobre `/systems` (hoy validada con un smoke test en
Node que corre dos escenarios end-to-end). El objetivo es mantener la lógica de
combate/economía/moral separada de Phaser para poder testearla sin DOM.

## Build & deploy

`npm run build` = `tsc --noEmit` + `vite build` → `/dist` autocontenido. Sirve en web,
itch.io o se envuelve con Capacitor sin cambios de código.
