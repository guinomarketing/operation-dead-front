# Plan de Assets — Operación Cóndor Muerto

Prioridades: **P0** = bloquea el look actual · **P1** = gran salto de calidad ·
**P2** = polish · **P3** = nice-to-have. Prompts completos en `MAGNIFIC_PROMPTS.md`.

## Integrados ✅
| Asset | Archivo | Uso | Estado |
|---|---|---|---|
| Fondo de batalla 16:9 | `public/assets/backgrounds/battlefield.jpg` | BattleScene | ✅ Magnific, integrado |
| Key art menú 16:9 | `public/assets/backgrounds/keyart-main.jpg` | MainMenu | ✅ Magnific, integrado |

## Faltantes priorizados
| Prioridad | Asset | Uso | Estado |
|---|---|---|---|
| **P1** | Sprites de 6 unidades base (Conscripto, Gendarme, Médica, Mecánico, Cazador, Parrillero) | UnitRenderer + cartas | ⏳ procedural placeholder; prompts listos |
| **P1** | Sprites de enemigos (grunt, runner, escudado, explosivo, oficial, perro) | UnitRenderer | ⏳ procedural placeholder; prompts listos |
| **P1** | Boss "Coronel Reanimado" | boss splash + combate | ⏳ prompt listo |
| **P2** | Fondos alternos por sala (laboratorio, ruta/niebla, pueblo) | variedad de rooms | ⏳ prompts listos |
| **P2** | Marcos/íconos de UI (card-frame, iconos de recursos/habilidades) | HUD | ⏳ usa emojis/CSS |
| **P2** | Sprites de 6 unidades extra (Bombero, Científica, Veterano, Gaucho, Colectivero, Electricista) | desbloqueos | ⏳ prompts listos |
| **P2** | Ilustraciones de evento | event screen | ⏳ |
| **P3** | Íconos de reliquias/upgrades | recompensas | ⏳ |
| **P3** | Splash/loading, icono de app, screenshots de store | branding | ⏳ |
| **P3** | VFX como overlays (fuego, niebla tóxica, curación) | FX | ⏳ hoy procedural |

## Pipeline
1. Generar con Magnific (Nano Banana Pro para fondos/personajes consistentes).
2. Fondos → JPEG 1600px (~250–350 KB). Sprites → fondo negro sólido (el
   `SpriteFactory.processTransparentTexture` recorta) o PNG transparente directo.
3. Colocar en `public/assets/{backgrounds,sprites,ui}/` con nombres claros.
4. Cargar en `BootScene.preload`; reemplazar el `SpriteFactory` cuando el sprite exista.
5. Verificar legibilidad a 900×450 (mobile landscape).

## Notas de peso
- Backgrounds 2k de Magnific pesan ~6 MB; **siempre** reescalar a ≤1600px + JPEG q85.
- Mantener el total de `public/assets` chico para carga inicial mobile.
