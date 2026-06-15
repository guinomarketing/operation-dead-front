# Bugs & Tech Debt — Patagonia Z

Escala: **P0** bloquea core · **P1** afecta fuerte la experiencia · **P2** polish/claridad · **P3** deseable.
Estado: `abierto` / `en progreso` / `resuelto` / `no reproducible`.

---

## Bug P0-1 — No se puede desplegar en los 2 carriles inferiores
- **Prioridad:** P0
- **Estado:** abierto (sin verificar en motor)
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
- Unidades usan solo animación procedural. Hay spritesheets de boss cargados (`enemy-doctor-totenkopf`, `enemy-panzer-corpse-engine`) sin confirmar integración de fases/clips.
- **Archivos:** `src/rendering/UnitRenderer.ts`, `src/scenes/BattleScene.ts`, `src/scenes/BootScene.ts`, `src/data/bosses.ts`.
- **IA:** Codex (frames) + Claude Code (integración).

## Debt P1-2 — Mapa no es "frente táctico vivo"
- **Prioridad:** P1 · **Estado:** abierto
- El mapa es nodos mejorados pero no la visión de frente con sub-bases/trincheras/decisiones simultáneas/consecuencias.
- **Archivos:** `src/scenes/MapScene.ts`, `src/systems/RunSystem.ts`, `src/data/operations.ts`.
- **IA:** Codex (dirección visual) + Claude Code (sistema).

## Debt P1-3 — Reliquias sin impacto real
- **Prioridad:** P1 · **Estado:** abierto
- `src/data/relics.ts` existe pero las reliquias no cambian builds de forma significativa en combate.
- **Archivos:** `src/data/relics.ts`, `src/systems/BattleSystem.ts`, `src/systems/RunSystem.ts`, `src/types/RunTypes.ts`.
- **IA:** Claude Code (lógica) + Codex (iconos).

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
