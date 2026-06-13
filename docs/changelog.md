# Changelog — Operación Cóndor Muerto

## [personajes ilustrados] — 2026-06-13 · rama `feature/landscape-gameplay-refactor`

Reemplazo total de los sprites placeholder (rectángulos/procedurales) por **arte
ilustrado de personajes generado con Magnific** — el mayor salto visual.

- **12 personajes nuevos** (Nano Banana Pro + recorte AI de fondo, PNG transparente
  recortado al alpha y reescalado): 6 unidades (Conscripto, Gendarme, Médica, Mecánico,
  Cazador Patagónico, Parrillero), 5 enemigos (revenant común, runner, escudado, explosivo,
  oficial reanimado) y el **jefe El Coronel Reanimado**. En `public/assets/sprites/`.
- **`UnitRenderer` reescrito**: origen en los pies sobre la línea del carril, tamaño por
  tipo (jefe ~210px), aspecto real del arte, barra de vida + nombre sobre la cabeza,
  sin volteo para el arte real (ya mira en la dirección correcta), animaciones de
  aparición/ataque/muerte. Procedural sólo como fallback (rot-hound, occultist, etc.).
- **`BootScene`**: carga los 12 PNG bajo sus keys finales (`unit-*`, `enemy-*`); se eliminó
  el flood-fill de transparencia (ya no hace falta) y los búnkers placeholder.
- **Cartas de unidad rediseñadas**: retrato ilustrado que llena la carta + badge de coste +
  barra de nombre (estilo brandbook), en vez del ícono diminuto.
- Indicadores de despliegue suavizados (banda de carril sutil en vez de bloques verdes);
  destello de disparo a la altura del arma; intro del jefe renombrada "El Coronel Reanimado".
- `tsc` ✅ · `vite build` ✅ · sin errores de consola · verificado en pantalla (personajes
  reales en el campo + cartas con retrato).

## [landscape art] — 2026-06-13 · rama `feature/landscape-gameplay-refactor`

### Arte (Magnific)
- **Nuevo fondo de batalla 16:9** `public/assets/backgrounds/battlefield.jpg` — escena
  cohesiva de cómic bélico: trinchera argentina con bandera (izq), búnker enemigo con
  estandarte de calavera y resplandor tóxico (der), no-man's-land con cráteres y alambre
  (centro), montañas nevadas + molino + luna al fondo. Generado con Nano Banana Pro,
  reescalado a 1600px y optimizado a JPEG (~257 KB).
- **Nuevo key art del menú 16:9** `public/assets/backgrounds/keyart-main.jpg` — escuadrón
  argentino (bandera + médica) vs horda revenant saliendo del búnker; espacio superior
  para el título. (~336 KB).
- `BattleScene` ahora deja que el fondo represente las bases (se quitaron los sprites
  placeholder de búnker que se pisaban con la ilustración); overlays de carril/oscurecido
  suavizados para que el arte se lea.
- `MainMenuScene` usa el key art con degradado para legibilidad del texto.

### Migración landscape (previo en esta rama)
- Resolución lógica **960×540 (16:9)** + bloque `LAYOUT` central; `#app-container`
  bloqueado a 16:9 con safe-areas de notch.
- Campo: base izq / búnker der, **4 carriles**, helpers `FIELD.CENTER_Y/CENTER_LANE/laneFromY`.
- HUD landscape (base/moral/búnker arriba; cartas izq + habilidades der abajo).
- Mapa de run **horizontal**; `ResultScene` re-maquetado; modales centrados.
- Hooks de dev `?scene=` y `?demo=1`.

### Build / QA
- `tsc --noEmit` ✅ · `vite build` ✅.
- Assets sirven 200 y decodifican en navegador (1600×893).
- Nota: la herramienta automática de screenshots del preview quedó inestable en la sesión
  (múltiples contextos); verificación visual del arte hecha sobre las imágenes generadas y
  el flujo ya validado en sesión previa. Abrir `localhost:5173` en un navegador real para ver.

### Decisiones
- Fondo cohesivo único (estilo screenshots de referencia) en lugar de sprites de búnker
  separados → mejor lectura y coherencia, sin tocar la lógica (las bases son zonas
  numéricas en `FIELD`).
- Backgrounds como **JPEG** (sin alfa) para peso mobile; los sprites con transparencia
  seguirán siendo PNG.
