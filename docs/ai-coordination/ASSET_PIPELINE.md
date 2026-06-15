# Asset Pipeline — Patagonia Z

Dirección visual: cómic bélico oscuro argentino (ChatGPT Images 2 / Magnific). Ver `AI_MASTER_CONTEXT.md` y `docs/ART_DIRECTION.md` / `docs/MAGNIFIC_PROMPTS.md`.

## Carpetas (ubicación final)
```
public/assets/
  backgrounds/   # fondos 16:9 (jpg para fotográficos sin alfa)
  sprites/       # personajes/bosses PNG transparente recortado al alpha
  ui/            # íconos/emblemas/paneles PNG transparente
  audio/         # mp3 (música) — SFX son procedurales, no archivos
```
Cargar en `src/scenes/BootScene.ts` con su key. Personajes: key `unit-<defId>` / `enemy-<defId>`.

## Naming convention
```
unit_conscript_idle_v01.png        (frames de animación, cuando existan)
boss_bunker_commander_phase01_v01.png
bg_battlefield_patagonia_trench_v01.png
ui_button_primary_v01.png
relic_icon_corazon_de_trinchera_v01.png
```
Nota: lo ya integrado usa keys cortas (`unit-rifleman.png`, `enemy-revenant-grunt.png`, `icon-sun.png`). Mantener esas keys para no romper `BootScene`; el naming `*_v0N` aplica a assets nuevos/variantes en disco.

## Proceso para sprites de personaje (probado y recomendado)
1. Generar con fondo blanco/plano (ChatGPT Images 2 / Magnific).
2. Recorte de fondo (matte) → PNG transparente.
3. **Recortar al bounding box del alpha** y reescalar (altura ~300px) para que los pies queden al borde (el render usa origen en los pies). Ver método ya usado en sesiones previas.
4. Guardar en `public/assets/sprites/` con la key esperada.
5. Agregar a `REAL_ART` en `UnitRenderer.ts` (evita el flip de los procedurales).

## Assets EXISTENTES (en repo hoy)
- **Unidades (12):** `unit-{rifleman,heavy-gunner,medic,engineer,sniper,flamethrower,bombero,cientifica,veterano,gaucho,colectivero,electricista}.png`
- **Enemigos (10):** `enemy-{revenant-grunt,runner-corpse,shielded-revenant,exploder,dead-officer,occultist,panzer-corpse,rot-hound,toxic-carrier,general-eisenfaust}.png`
- **Bosses (spritesheets):** `boss-doctor-totenkopf-sheet-v2.png` (362×663), `boss-locomotora-profanadora-sheet-v2.png` (362×413)
- **Fondos:** `battlefield.jpg`, `battlefield-town-v1.png`, `battlefield-ironworks-v1.png`, `keyart-main.jpg`/`keyart-main-v2.png`, `map-patagonia-v2.png`, `result-victory-v1.png`, `result-defeat-v1.png`, `hq-progression-v1.png`, `story-0{1..4}-*-v1.png`
- **UI:** `icon-sun`, `icon-mate`, `icon-skull`, `emblem-flag`, `ability-airstrike`, `ability-medkit`
- **Audio:** `music-menu.mp3`, `music-combat.mp3`

## Assets FALTANTES (prioridad)
- **P0:** (ninguno nuevo bloquea; el P0 es un bug de código).
- **P1:** frames de animación de unidades (idle/walk/attack/death); confirmar/llenar fases de bosses; iconos de reliquias; fondos/composición de "frente táctico vivo" para el mapa.
- **P2:** logo real **Patagonia Z**; panel de UI (marco card 9-slice), tooltips; pantalla de evento (ilustración 2 columnas); música boss/evento/victoria/derrota.
- **P3:** skins/variantes de tropas; splash/loading; screenshots Play Store; icono de app.

## Quién genera qué
- **Codex / Magnific:** todo lo visual (fondos, personajes, bosses, iconos, UI, logo, store art) + prompts. Dejar registro (nombre, prompt, ubicación, uso, estado) en `CHANGELOG_AI.md`.
- **Claude Code:** integración técnica (carga en BootScene, spritesheets/atlas, anim configs, recorte/optimización, hooks de VFX, HUD).
- **Gravity:** integración visual rápida y ajustes de escena/flujo.

## Reglas de peso (mobile)
Fondos 16:9 → reescalar a ≤1600px, **JPEG** q85 (~200–350 KB). Sprites → PNG recortado (~60–220 KB). No commitear PNGs 2k de 6 MB.
