# Guía de UI Landscape — Operación Cóndor Muerto

Referencia rápida para mantener consistencia al tocar el HUD horizontal.

## Bandas verticales (de `LAYOUT` en `src/utils/constants.ts`)

```
┌──────────────────────────────────────────────────────────┐  ← 0
│  TOP HUD  (~12%, UI_TOP_HEIGHT=66)                        │
│  🇦🇷 Base Argentina HP | Moral · Suministros · Bajas | Búnker HP │
├──────────────────────────────────────────────────────────┤  ← 66
│                                                          │
│  BATTLEFIELD (~66%)                                      │
│  Base ◀── carril 1 ──────────────────────────▶ Búnker   │
│         carril 2   ·   carril 3   ·   carril 4          │
│                                                          │
├──────────────────────────────────────────────────────────┤  ← 420
│  BOTTOM UI (~22%, UI_BOTTOM_HEIGHT=120)                  │
│  [cartas de unidad ...] ........... [habilidades]       │
└──────────────────────────────────────────────────────────┘  ← 540
```

## Reglas
- **Lógica de canvas** (Phaser) → siempre en coordenadas lógicas 960×540, leídas de `FIELD`/`LAYOUT`. Nunca hardcodear posiciones de combate.
- **HUD** (DOM `#ui-layer`) → posicionado por `%`/flex respecto a los bordes del `#app-container` (16:9), así escala con el canvas FIT.
- **Top HUD**: 3 clústeres con `justify-content: space-between` (izq / centro / der).
- **Bottom bar**: `space-between` → cartas a la izquierda, habilidades a la derecha. `bottom: 8px` para dejar aire sobre el carril más bajo.
- **Tamaños táctiles**: cartas 74×92, habilidades 92×60 (cómodas con el dedo). Máx ~6 cartas visibles; si hay más → scroll horizontal o selección previa.
- **Legibilidad**: texto ≥10px, costos en color ámbar `--primary`, cooldown como overlay `scaleY`.
- **Safe areas**: el `#app-container` ya aplica `env(safe-area-inset-left/right)`; no colocar nada crítico pegado a los bordes laterales.

## Pantallas roguelite
- **Mapa**: nodos de izquierda→derecha, 3 rutas en alto, boss a la derecha. Conexiones diagonales sutiles.
- **Evento / Tienda / Cuartel**: modal centrado (`top:50%; translate(-50%,-50%)`), `width: min(90%, 700px)`, `max-height: 88%` + scroll. (Pendiente: layout a 2 columnas ilustración-izquierda / texto-derecha.)
- **Recompensa**: 3 cards horizontales centradas (y≈320), botones de continuación lado a lado (y≈460).
