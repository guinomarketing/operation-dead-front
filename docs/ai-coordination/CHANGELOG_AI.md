# AI Changelog — Patagonia Z

Registro de TODO cambio por cada IA. Sin cambios silenciosos: si no está acá, es deuda.
Formato por entrada: Fecha — Herramienta · Objetivo · Archivos · Cambios · Motivo · Riesgos · Cómo probar · Estado.

---

## 2026-06-15 — Antigravity (relic visuals & tooltip pass)
- **Objetivo:** Darle identidad visual a las reliquias en campaña/recompensas con iconos pixel art, tooltips HTML detallados e inventario táctico.
- **Archivos:** `src/types/RunTypes.ts`, `src/data/relics.ts`, `src/ui/TooltipManager.ts` (nuevo), `src/scenes/BootScene.ts`, `src/scenes/MapScene.ts`, `src/scenes/ResultScene.ts`, `public/assets/sprites/relics-sheet.png` (nuevo), `docs/ai-coordination/{AI_HANDOFF,CHANGELOG_AI,NEXT_ACTIONS,BUGS_AND_TECH_DEBT}.md`.
- **Cambios:**
  1. Generé un spritesheet pixel art de `320x256` con los 20 iconos para reliquias, y lo precargué en `BootScene` como `'relics-sheet'`.
  2. Modifiqué `RelicDef` para usar `iconFrame?: number` y asigné índices de cuadro del 0 al 19 a cada reliquia en `relics.ts`.
  3. Creé `TooltipManager.ts` (DOM HTML tooltip flotante) con estilos de "glass-panel" oscuro y color según rareza, con ajuste inteligente de posición y soporte táctil.
  4. Modifiqué `MapScene.ts` para mostrar la fila de iconos de reliquias equipadas con hover de tooltip en la barra táctica superior.
  5. Modifiqué `ResultScene.ts` para renderizar el icono real de la reliquia y mostrar su tooltip al pasar el mouse por la carta de recompensa (además de añadir un engranaje vectorial sutil para las mejoras).
- **Motivo:** La deuda P1 requería que las reliquias tuvieran íconos, tooltips e inventario legible para hacer atractiva la build de la run.
- **Riesgos:** Ninguno detectado. El spritesheet es dinámico en CSS y Phaser.
- **Cómo probar:** `npm run build` y `npm run test` (ambos pasan OK); abrir `?scene=result-win` para ver recompensas con tooltips y elegir una; luego abrir `?scene=map` para ver el inventario y pasar el cursor sobre las reliquias.
- **Estado:** ✅ Completado y verificado. Build y 19 tests en verde.

## 2026-06-15 - Codex (relic gameplay pass)
- **Objetivo:** Conectar `relics.ts` al loop real de run/combate/recompensas para que las reliquias cambien builds, no solo existan como data.
- **Archivos:** `src/systems/BattleSystem.ts`, `src/systems/RunSystem.ts`, `src/scenes/BattleScene.ts`, `src/ui/BattleUI.ts`, `src/scenes/ResultScene.ts`, `src/scenes/MapScene.ts`, `src/data/relics.ts`, `src/systems/core.test.ts`, `docs/ai-coordination/{AI_HANDOFF,CHANGELOG_AI,NEXT_ACTIONS,BUGS_AND_TECH_DEBT,ASSET_PIPELINE}.md`.
- **Cambios:** `BattleSystem` ahora recibe `activeRelics` y aplica modificadores declarativos a coste, cooldown de despliegue, HP, ataque, alcance, curacion, economia, moral y dano contextual contra tags/tiers objetivo. Se implementaron hooks jugables iniciales: base baja = furia, primera baja sobrevive, suministros iniciales, salvage por baja aliada, despliegue gratis cada 12 kills, fuego extendido y piso de moral una vez. Los eventos `gain-relic` sin id ahora otorgan una reliquia aleatoria no repetida. La pantalla de victoria ofrece reliquias mezcladas con mejoras, la HUD usa costes/cooldowns reales y el mapa muestra contador de reliquias.
- **Motivo:** La deuda P1 indicaba que las reliquias no tenian impacto real. Esto mete el sistema en el loop roguelite: conseguir reliquia -> cambia cartas/combate/economia -> afecta decisiones de run.
- **Riesgos:** Falta balance humano de combinaciones; faltan iconos/tooltip/inventario de reliquias; las pasivas de comandantes y mutaciones todavia no usan el mismo aplicador generico.
- **Como probar:** `npm.cmd run test -- --reporter=dot`; `npm.cmd run build`; abrir `?scene=result-win` y elegir una reliquia; abrir `?scene=battle&demo=1`; abrir `?scene=map`.
- **Estado:** OK, 19 tests + build verdes; verificacion visual local sin errores de consola en recompensa, batalla demo y mapa.

## 2026-06-15 — Codex (boss balance pass)
- **Objetivo:** Primera pasada de balance sobre bosses activos con habilidades reales.
- **Archivos:** `src/data/bosses.ts`, `src/systems/BattleSystem.ts`, `src/systems/core.test.ts`, `docs/ai-coordination/{AI_HANDOFF,CHANGELOG_AI,NEXT_ACTIONS,BUGS_AND_TECH_DEBT}.md`.
- **Cambios:** Totenkopf invoca sujetos de prueba tóxicos para dar sentido a mutación/curación; los cooldowns iniciales de habilidades de boss se escalonan por tipo/orden; Eisenfaust y Locomotora fueron retuneados contra un banco automático full-roster; en boss node, los ataques al extremo ahora dañan al boss vivo real.
- **Motivo:** Totenkopf quedaba solo y mutación no tenía objetivo; varias habilidades podían entrar simultáneamente; el benchmark reveló que algunos bosses eran apenas imposibles y que el HP del boss podía desincronizarse de la entidad real.
- **Riesgos:** números todavía requieren playtest humano en mobile real; el banco automatizado valida posibilidad/legibilidad básica, no sensación táctil final.
- **Cómo probar:** `npm.cmd run test -- --reporter=dot`; `npm.cmd run build`; jugar `?scene=boss&demo=1&operation=op-hollow-town` y `?scene=boss&demo=1&operation=op-iron-grave`.
- **Estado:** ✅ 15 tests + build verdes.

## 2026-06-15 — Codex (boss FX pass)
- **Objetivo:** Hacer legibles en pantalla las fases/habilidades de bosses ya activas en lógica.
- **Archivos:** `src/systems/BattleSystem.ts`, `src/scenes/BattleScene.ts`, `src/rendering/UnitRenderer.ts`, `docs/ai-coordination/{AI_HANDOFF,CHANGELOG_AI,NEXT_ACTIONS,BUGS_AND_TECH_DEBT,ASSET_PIPELINE}.md`.
- **Cambios:** eventos de boss enriquecidos con `abilityId`, `phaseIndex`, `uid`, `x/y`; tintes persistentes por fase; pulsos de fase/habilidad; textos de fase; FX de summon/mutación/heal-zone/cannon; atajo QA `bossHpPct`.
- **Motivo:** las fases existían mecánicamente, pero necesitaban lectura audiovisual clara para sentirse como bosses memorables.
- **Riesgos:** FX básicos, no reemplazan animaciones por frames dedicadas. Atajo `bossHpPct` es dev/QA, no parte del loop normal.
- **Cómo probar:** `?scene=boss&demo=1&operation=op-hollow-town&bossHpPct=29`; `?scene=boss&demo=1&operation=op-iron-grave&bossHpPct=49`.
- **Estado:** ✅ tests/build verdes; capturas QA OK.

## 2026-06-15 — Codex
- **Objetivo:** Hacer funcionales las fases declaradas de bosses sin tocar el P0 de despliegue.
- **Archivos:** `src/systems/BattleSystem.ts`, `src/systems/core.test.ts`, `docs/ai-coordination/{AI_HANDOFF,CHANGELOG_AI,NEXT_ACTIONS,BUGS_AND_TECH_DEBT,ASSET_PIPELINE}.md`.
- **Cambios:** `updateBossPhases` ahora es genérico para los bosses de `data/bosses.ts`; aplica `statOverrides`, cooldowns, summons por umbral de HP, mutación, zona de curación y cannon. Se conservaron los eventos visuales existentes (`999` fase, `888` summon/mutación).
- **Motivo:** Totenkopf y Locomotora tenían data de diseño pero el motor solo ejecutaba fases hardcodeadas para Eisenfaust.
- **Riesgos:** balance a revisar; las habilidades nuevas vuelven más exigentes los combates de boss. La presentación visual por fase todavía necesita FX/animaciones en `BattleScene`/`UnitRenderer`.
- **Cómo probar:** `npm.cmd run test -- --reporter=dot`; `npm.cmd run build`; jugar `?scene=boss&demo=1&operation=op-hollow-town` y `?scene=boss&demo=1&operation=op-iron-grave`.
- **Estado:** ✅ tests y build verdes.

## 2026-06-15 — Claude Code (P0 fix)
- **Objetivo:** Resolver el bug P0 de despliegue en carriles inferiores.
- **Archivos:** `src/ui/BattleUI.ts` (DOM deploy-catcher + toggle en setSelectedUnit/Ability), `src/scenes/BattleScene.ts` (pasa onFieldTap; quita llamadas cruzadas a setters que desactivaban el catcher), `src/utils/constants.ts` (`LANES_Y=[300,336,372,408]`).
- **Cambios:** toque de despliegue/habilidad confiable vía DOM, independiente del stacking canvas/DOM.
- **Motivo:** en viewports chicos la barra de cartas tapaba los carriles inferiores → no se podía desplegar.
- **Riesgos:** bajo; el catcher solo intercepta cuando hay selección. Verificado sin doble-deploy (clear post-deploy + stopPropagation).
- **Cómo probar:** `?scene=battle&demo=1`, seleccionar carta, tocar el borde inferior del campo → deploy en carril de abajo.
- **Estado:** ✅ verificado en preview (812×375).

## 2026-06-15 — Claude Code
- **Objetivo:** Crear sistema de coordinación entre IAs + auditoría real (sin features).
- **Archivos:** `docs/ai-coordination/{AI_MASTER_CONTEXT,AI_HANDOFF,PRODUCTION_ROADMAP,CURRENT_STATE,BUGS_AND_TECH_DEBT,ASSET_PIPELINE,FEATURE_OWNERSHIP,CHANGELOG_AI,NEXT_ACTIONS}.md` (nuevos); `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `GRAVITY.md` (nuevos, raíz).
- **Cambios:** documentación viva de coordinación + auditoría del repo + bug P0 documentado.
- **Motivo:** evitar que múltiples IAs (Codex/Claude/Gravity) se pisen o pierdan contexto.
- **Riesgos:** ninguno (solo docs).
- **Cómo probar:** abrir los `.md`; arrancar cualquier sesión leyendo `AGENTS.md` → `/docs/ai-coordination/`.
- **Estado:** ✅ hecho.

## 2026-06-15 (previo, misma jornada) — Claude Code
- **Objetivo:** Progresión "empezar con 1 soldado" + tutorial + intro de historia.
- **Archivos:** `systems/MetaProgression.ts` (nuevo), `systems/RunSystem.ts`, `scenes/StoryScene.ts` (nuevo), `scenes/MainMenuScene.ts`, `scenes/BattleScene.ts`, `scenes/MapScene.ts`, `scenes/ResultScene.ts`, `scenes/BootScene.ts`, `ui/BattleUI.ts`, `main.ts`, `data/units.ts`.
- **Cambios:** meta-progreso persistente (localStorage `pz_meta_v1`), roster inicial = 1 Conscripto + desbloqueos por medallas, cartas dinámicas, pantalla DESBLOQUEOS, tutorial de primer combate, escena de historia.
- **Motivo:** sensación de progresión roguelite (pedido del dueño).
- **Riesgos:** cambió firma de `RunSystem.startNewRun`; cartas ya no usan const `DEPLOYABLE`.
- **Cómo probar:** `npm run dev` → DESPLEGAR → intro → mapa; menú → DESBLOQUEOS.
- **Estado:** ✅ commit `40f1f49`.

## 2026-06-15 (previo) — Antigravity / Codex (commit `c85f6c2`)
- **Objetivo:** "Refactor front-end MVP state and UI flows".
- **Archivos (detectados):** assets nuevos (fondos town/ironworks/hq/result/map/keyart-v2, story-0{1..4}, spritesheets de boss), `utils/SeededRandom.ts`, `systems/core.test.ts`, `BootScene.ts` (carga de nuevos assets + jumps extra), `RunSystem` (operationId), docs `CHECKPOINT_PLAYTEST.md`/`CLAUDE_SYNC.md`/`V1_COMMERCIAL_AUDIT.md`.
- **Motivo:** sumar arte por sala, semilla determinística, tests y flujos.
- **Riesgos:** `CLAUDE_SYNC.md` quedó desactualizado vs. progresión "1 soldado"; integración de animación de bosses a confirmar.
- **Cómo probar:** `npm run build`; jugar run.
- **Estado:** 🟡 integrado, validación de animación/fases pendiente. (Entrada reconstruida por Claude a partir del repo; Antigravity debe completarla.)

## Sesiones anteriores (resumen, ver `git log` + `docs/changelog.md`)
Landscape 16:9 · 22 personajes Magnific + recorte · grounding/sombras/perspectiva plana · HUD premium + íconos · audio SFX+música. Commits `9afdd70`…`5437674`.
