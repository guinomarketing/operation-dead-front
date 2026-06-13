# Refactor a Landscape (Horizontal) — Operación Cóndor Muerto

> Rama: `feature/landscape-gameplay-refactor`
> Estado: **Fase 1 completada** — el juego corre en horizontal 16:9 de punta a punta.

---

## 1. Auditoría de la orientación anterior (portrait)

El proyecto es **Phaser 3 + TypeScript + Vite**. Antes de este refactor:

| Aspecto | Estado anterior |
|---|---|
| Resolución lógica | `540 × 960` (portrait 9:16) en `src/utils/constants.ts` |
| Scale mode | `Phaser.Scale.FIT` + `CENTER_BOTH` (correcto, se reusa) |
| Contenedor DOM | `#app-container` con `max-width: 54vh` → **forzaba 9:16** |
| Campo de batalla | **Ya era lateral**: base aliada `x=50`, búnker `x=490`, 3 carriles horizontales (`LANES_Y=[470,545,620]`) apretados en el **tercio inferior** |
| Lógica de combate | `BattleSystem` puro: aliados avanzan `x+`, enemigos `x-`, lee TODO de `FIELD.*` |
| HUD | DOM overlay (`#ui-layer`) — barras arriba, cartas abajo centradas |
| Hardcodes de posición | `BattleScene` (`cy=550`, click `y∈[420,680]`, splits `505/580`), `MapScene` (mapa vertical), `ResultScene` (Y fijos 240–640) |

**Conclusión clave:** la mecánica ya era *lane-defense lateral*; sólo estaba **comprimida en un lienzo vertical**. La migración fue por lo tanto un **remapeo de layout centralizado**, NO una reescritura de lógica. Cero cambios al núcleo de simulación.

---

## 2. Qué se cambió

### Resolución y escala
- `GAME_WIDTH/HEIGHT` → **960 × 540** (16:9; escala exacta ×2 a 1920×1080).
- Nuevo bloque `LAYOUT` en `constants.ts`: `UI_TOP_HEIGHT` (66 ≈12%), `UI_BOTTOM_HEIGHT` (120 ≈22%), `BATTLEFIELD_*` (≈66%), `SAFE_MARGIN`.
- `#app-container` ahora se **bloquea a 16:9** con `aspect-ratio: 16/9; width: min(100vw, 177.78vh)` + `env(safe-area-inset-*)` para notch. El canvas (FIT) y la capa DOM comparten exactamente ese rectángulo → la UI nunca se desalinea.

### Campo de batalla (`FIELD`)
- Base argentina **izquierda** `ALLY_BASE_X=64`, búnker enemigo **derecha** `ENEMY_BASE_X=896`.
- Spawns: aliados `140`, enemigos `820`.
- **4 carriles** (antes 3): `LANES_Y=[168,248,328,396]`, repartidos en la banda del battlefield.
- Helpers nuevos: `FIELD.CENTER_Y`, `FIELD.CENTER_LANE`, `FIELD.laneFromY(y)`.

### Escenas
- **BattleScene**: bases dibujadas en `CENTER_Y` como estructuras altas que cubren los carriles; click de despliegue usa `laneFromY()` (soporta N carriles); fondo `cover`-scale + capa de oscurecido para lectura PvZ; rangos de FX de muerte/recompensa derivados de `FIELD` (ya no asumen ancho portrait).
- **BattleSystem**: jefe spawnea en `FIELD.CENTER_LANE` (antes lane `1` hardcodeado).
- **BattleUI**: HUD landscape — **izq** HP Base Argentina, **centro** Moral+Suministros+Bajas, **der** HP Búnker; barra inferior con **cartas de unidad a la izquierda** y **habilidades a la derecha** (como en los mockups).
- **MapScene**: mapa roguelite ahora **horizontal** (progreso izquierda→derecha). `nodeX(row)` reparte las filas a lo ancho; `nodeY(col)` ubica las 3 rutas en alto. Modales (evento/tienda/cuartel/plantel/game-over) centrados verticalmente con `max-height` + scroll para no desbordar 540px.
- **ResultScene**: todas las Y reubicadas para 540px de alto; 3 cards de recompensa en fila horizontal; botones de continuación lado a lado.
- **MainMenuScene** / CSS: título con `clamp()` para no desbordar en alto reducido.

### Hooks de desarrollo (guardados, invisibles en el flujo normal)
- `?scene=battle | boss | map` (en `BootScene`) salta directo a esa escena con una run sembrada.
- `?demo=1` (en `BattleScene`) auto-despliega un escuadrón para capturas/QA.

---

## 3. Qué sigue igual (no se tocó)
- `BattleSystem` (combate, daño, AoE, moral, oleadas, jefe) — intacto salvo el carril central del jefe.
- `WaveSystem`, `RunSystem` (generación de mapa/roster), toda la `data/` (unidades, enemigos, jefes, reliquias, eventos, upgrades).
- `SpriteFactory` (texturas procedurales), `UnitRenderer` (lee `FIELD.LANES_Y`).
- Persistencia en `registry`, flujo de escenas, sistema de soldados XCOM-like.

---

## 4. Criterios de aceptación (verificado en `localhost:5173`)

| Criterio | ✓ |
|---|---|
| Canvas abre en landscape 16:9 | ✅ (`#app-container` 16:9, canvas 960×540) |
| Battlefield ocupa la mayor parte | ✅ (~66%) |
| Base aliada a la izquierda / búnker a la derecha | ✅ |
| Aliados avanzan → / enemigos ← | ✅ |
| Carriles claros (4) | ✅ |
| UI inferior con cartas + habilidades | ✅ (cartas izq, habilidades der) |
| UI superior HP/Moral/Oleada/Recursos | ✅ |
| Cartas tocables y legibles | ✅ (botones grandes DOM) |
| No se rompe el loop principal | ✅ (build + typecheck verdes) |
| Nada cortado por pantalla/notch | ✅ (safe-area + aspect lock) |

---

## 5. Pendientes / riesgos conocidos
- **Fondo del battlefield**: el `battlefield.png` actual es de proporción portrait; se cubre-escala (recorta) pero conviene reemplazarlo por un fondo nativo 16:9 (ver `MAGNIFIC_PROMPTS.md`).
- **Búnkers**: `ally-bunker.png` / `enemy-bunker.png` se estiran a 150×210; idealmente assets verticales propios de trinchera/búnker.
- **Densidad de tropas**: con 4 carriles el campo pide algo más de separación visual entre carriles (líneas/trincheras) — pulido de arte, no de lógica.
- **HMR + Phaser**: en dev, editar `main.ts`/escenas puede apilar instancias (recargar la pestaña lo limpia). No afecta build de producción.

## 6. Próximo paso recomendado
Reemplazar los 3 fondos clave por arte 16:9 (battlefield, base, búnker) con los prompts de `MAGNIFIC_PROMPTS.md`, e integrar trincheras/carriles ilustrados para subir la lectura PvZ. Luego: animaciones de unidad (idle/walk/attack) y SFX.
