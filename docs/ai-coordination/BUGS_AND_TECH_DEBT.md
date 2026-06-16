# Bugs & Tech Debt — Patagonia Z

Escala: **P0** bloquea core · **P1** afecta fuerte la experiencia · **P2** polish/claridad · **P3** deseable.
Estado: `abierto` / `en progreso` / `resuelto` / `no reproducible`.

---

## Bug P0-1 — No se puede desplegar en los 2 carriles inferiores
- **Prioridad:** P0
- **Estado:** ✅ RESUELTO 2026-06-15 (Claude Code, verificado en preview a 812×375).
- **Solución aplicada:** se agregó un **DOM "deploy catcher"** transparente sobre la banda del battlefield (`BattleUI`) que enruta el toque al `handleBattlefieldClick` con coords lógicas, sin depender de que el toque llegue al canvas por debajo de las cartas. Además se corrigió que `selectUnit/selectAbility` llamaban a ambos setters y el segundo desactivaba el catcher y borraba la selección. Lanes reubicados a `[300,336,372,408]`.
- **Validación:** seleccionar Conscripto → catcher `pointerEvents=auto` → tap en el borde inferior de la banda → carta (3)→(2) y suministros bajan = deploy en carril inferior OK.
- **Causa raíz (histórico):** la barra de cartas (DOM, px fijos) cubre más pantalla en viewports chicos y tapaba el toque de los carriles 3/4.
- **Cómo reproducir:** en combate, seleccionar una carta de unidad y tocar uno de los 2 carriles de abajo (lanes índice 2 y 3).
- **Resultado esperado:** la unidad se despliega en ese carril.
- **Resultado actual (reportado):** no despliega en los carriles inferiores; sí en los superiores.
- **Posible causa:** la barra inferior de cartas/habilidades es un overlay **DOM con `pointer-events: auto`** que se superpone con la zona de toque de los carriles bajos. Lanes en `FIELD.LANES_Y = [296, 336, 378, 422]`; la zona de deploy en `handleBattlefieldClick` llega hasta `LANES_Y[last]+50 ≈ 472`, pero las cartas DOM arrancan ~`y 428`. Un toque sobre las cartas no llega al canvas Phaser → no hay deploy. También revisar `laneFromY` y si el carril 3 (y=422) queda casi tapado.
- **Archivos relacionados:** `src/scenes/BattleScene.ts` (`handleBattlefieldClick`), `src/ui/BattleUI.ts` (barra inferior, `pointer-events`), `src/utils/constants.ts` (`FIELD.LANES_Y`, `LAYOUT.UI_BOTTOM_HEIGHT`, `laneFromY`).
- **Fix sugerido:** subir los 4 carriles para que el más bajo quede por encima del borde superior de la UI inferior, y/o limitar la zona de deploy a `y < (GAME_HEIGHT - UI_BOTTOM_HEIGHT)`, y/o dejar un "canal" sin DOM sobre los carriles. Verificar los 4 carriles en `localhost`.
- **IA recomendada:** Claude Code.

---

## Debt P1-1 — Animaciones por frames ausentes
- **Prioridad:** P1 · **Estado:** en progreso (parcial)
- Unidades usan solo animación procedural. Las fases de bosses ya funcionan en lógica pura y tienen FX básicos en `BattleScene`/`UnitRenderer`, pero todavía faltan ciclos por frame dedicados y poses/clips únicos para que se sientan comerciales.
- **Archivos:** `src/rendering/UnitRenderer.ts`, `src/scenes/BattleScene.ts`, `src/scenes/BootScene.ts`, `src/data/bosses.ts`, `src/systems/BattleSystem.ts`.
- **IA:** Codex (frames) + Claude Code (integración).

## Debt P1-4 — Balance de bosses con habilidades activas
- **Prioridad:** P1 · **Estado:** en progreso (primera pasada estructural hecha)
- Totenkopf y Locomotora ahora ejecutan sus habilidades declaradas y muestran FX básicos. Primera pasada: Totenkopf invoca sujetos de prueba tóxicos, los cooldowns iniciales de boss están escalonados, y el banco automático full-roster valida que los 3 bosses sean ganables/legibles. Falta playtest humano para cooldowns finales, daño, claridad visual y curva de dificultad en mobile real.
- **Archivos:** `src/data/bosses.ts`, `src/systems/BattleSystem.ts`, `src/systems/core.test.ts`.
- **IA:** Claude Code / Codex.

## Bug P1-5 — Ataques al extremo no dañaban al boss real
- **Prioridad:** P1
- **Estado:** ✅ RESUELTO 2026-06-15 (Codex).
- **Problema:** en nodos boss, una unidad aliada que llegaba a `FIELD.ENEMY_BASE_X` bajaba `enemyBaseHp` como si fuera búnker, sin aplicar daño al combatiente boss. Eso podía desincronizar barra/fases.
- **Solución:** `hitBase` redirige el daño al boss vivo cuando `nodeType === 'boss'` y sincroniza `enemyBaseHp = boss.hp`.
- **Validación:** test `routes ally base attacks into the living boss during boss battles`.

## Debt P1-2 — Mapa no es "frente táctico vivo"
- **Prioridad:** P1 · **Estado:** abierto
- El mapa es nodos mejorados pero no la visión de frente con sub-bases/trincheras/decisiones simultáneas/consecuencias.
- **Archivos:** `src/scenes/MapScene.ts`, `src/systems/RunSystem.ts`, `src/data/operations.ts`.
- **IA:** Codex (dirección visual) + Claude Code (sistema).

## Debt P1-3 — Reliquias sin impacto real
- **Prioridad:** P1 · **Estado:** ✅ RESUELTO 2026-06-15 (Antigravity)
- **Solución aplicada:** La integración funcional en combate fue hecha por Codex. Añadí spritesheet pixel art con los 20 iconos, inyección de tooltips flotantes HTML (`TooltipManager.ts`) con estilo premium y color por rareza, inventario visual dinámico en el mapa (MapScene) y visualización/interactividad en las cartas de recompensa (ResultScene).
- **Pendiente:** Playtest de balance de combinaciones y rarezas en mobile. Las pasivas de comandantes y mutaciones aún no se aplican con la misma estructura general.
- **Archivos:** `src/data/relics.ts`, `src/systems/BattleSystem.ts`, `src/systems/RunSystem.ts`, `src/scenes/ResultScene.ts`, `src/ui/BattleUI.ts`, `src/scenes/MapScene.ts`, `src/ui/TooltipManager.ts`, `src/systems/core.test.ts`.
- **IA:** Claude Code / Antigravity.

## Debt P2-1 — Coordinación / docs divergentes
- **Prioridad:** P2 · **Estado:** en progreso
- `docs/CLAUDE_SYNC.md` desactualizado (dice 8 reclutas iniciales; hoy se arranca con 1). Conviven varias notas.
- **Acción:** este sistema `/docs/ai-coordination/` es la fuente de verdad; marcar `CLAUDE_SYNC.md` como histórico o migrarlo.

## Debt P2-2 — Verificación visual inestable
- **Prioridad:** P2 · **Estado:** ambiental
- El preview/screenshot del entorno se cuelga por sesiones. Validar abriendo `localhost` en navegador real.

## Debt P2-3 — Bundle grande / sin code-splitting
- **Prioridad:** P2/P3 · `vite build` avisa chunk >500 kB (Phaser ~1.6 MB). Considerar manualChunks para carga inicial mobile.

## Debt P3-1 — Balance sin pasada
- Economía, oleadas, costos, curva de desbloqueo sin tunear. Hacer tras estabilizar core.
