# Current State — Patagonia Z (auditoría real)

Fecha auditoría: 2026-06-15 · Rama: `feature/landscape-gameplay-refactor` · Último commit: `c85f6c2` (hecho por OTRA herramienta — Antigravity/Codex).

> Auditoría sin humo. Esto es lo que HAY hoy en el repo.

## Lo que FUNCIONA
- Corre en **landscape 960×540**, build verde (`tsc` + `vite build`). Hay tests headless (`src/systems/core.test.ts`).
- **Flujo completo de escenas**: Boot → MainMenu → Story (intro narrativa 4 paneles) → Map → Battle → Result → Map.
- **Combate por carriles** (4) con base izq / búnker der; combate automático; **frente/línea** (las unidades se forman y empujan, no se atraviesan).
- **Economía** (suministros), **moral**, HP base/búnker, **oleadas** (WaveSystem), **boss** (General Eisenfaust) con fases.
- **12 unidades** jugables (data + arte) y **9 enemigos** + boss; counters por traits (sniper→elites, flamethrower→horda/quema, gendarme→tanque, suppress, etc.).
- **HUD premium** (placas metálicas, barras segmentadas, medallón de moral, pips de oleada, íconos) y **cartas con retrato** + barra de carga; tira de cartas con scroll.
- **Audio**: SFX procedurales (WebAudio) + 2 temas de música (menú/combate).
- **Progresión meta**: arrancás con **un solo Conscripto**, desbloqueás clases con **medallas** (persistente, localStorage), pantalla **DESBLOQUEOS** en el menú.
- **Tutorial** de onboarding en el primer combate (tap-through).
- **Roster XCOM-like**: soldados con nombre/apodo/color, XP/nivel, permadeath, reclutamiento en camp/tienda.
- **Assets nuevos** (commit c85f6c2): fondos de batalla alternos (town, ironworks), key art v2, map-patagonia v2, result victoria/derrota, hq-progression, 4 paneles de historia, y **2 spritesheets de boss** (doctor-totenkopf, locomotora-profanadora).

## Lo que se siente BETA / está flojo
- **Animaciones de unidades**: solo procedurales (bobbing/embestida/flash). Faltan frames reales (idle/walk/ataque/daño/muerte). Hay spritesheets de boss generados pero la **integración de animación por frames está a medias**.
- **Mapa de campaña**: mejoró (key art + nodos con bisel) pero NO es el "frente táctico vivo" pedido (sub-bases, trincheras, ataque/defensa simultáneos, consecuencias).
- **Reliquias/objetos**: existe data (`relics.ts`) pero impacto real en build/gameplay es limitado o no enchufado.
- **Personalización de tropas**: hay apodo/color/nivel; faltan especializaciones, variantes, skins, habilidades desbloqueables.
- **Pantallas de evento/recompensa/config**: funcionales pero básicas; evento no es a 2 columnas (ilustración/decisión).
- **Balance**: sin pasada real; curva de desbloqueo y economía sin tunear.

## ROTO / riesgos
- **P0 — Bug de despliegue en los 2 carriles inferiores** (reportado por el dueño y por `PRODUCT_QUALITY_PASS.md`). Hipótesis fuerte: la **barra inferior de cartas (DOM, pointer-events auto)** se superpone con la zona de toque de los carriles 3 y 4 (lanes en y≈378 y 422; las cartas arrancan ~y428). El click sobre las cartas no llega al canvas → no se puede desplegar abajo. Ver `BUGS_AND_TECH_DEBT.md` P0-1. **Sin verificar en motor todavía.**
- **Divergencia multi-IA**: `docs/CLAUDE_SYNC.md` (Antigravity) quedó **desactualizado** (dice "8 reclutas iniciales"; ahora se arranca con 1 + desbloqueos). Coexisten dos sistemas de notas. Este sistema `/docs/ai-coordination/` es ahora la fuente de verdad.
- **Verificación visual intermitente**: el preview/screenshot del entorno se colgó varias sesiones. Validar abriendo `localhost` en navegador real.

## Assets: existentes vs placeholder
- **Implementados y usados**: 12 unidades, 9 enemigos, boss eisenfaust, fondos (battlefield.jpg + variantes v1), key art, UI icons (6), música (2), paneles de historia.
- **Generados pero NO totalmente integrados**: spritesheets boss doctor-totenkopf y locomotora (animación/fases por enchufar); fondos town/ironworks/hq-progression (¿usados por sala? verificar en MapScene/BattleScene).
- **Procedural (placeholder técnico)**: enemigos sin arte propio (barricade, burrower si aplica) los dibuja `SpriteFactory`; partículas/sombra.

## Veredicto
Base sólida y mucho mejor que "MVP feo", pero todavía **se siente beta** por: bug P0 de despliegue, animaciones, mapa-como-frente, profundidad roguelite (reliquias/builds) y balance. Prioridad: estabilizar (P0) → animación/feel → mapa → roguelite depth.
