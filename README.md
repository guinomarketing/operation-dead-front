# Operación Cóndor Muerto

Roguelite táctico mobile **horizontal (landscape 16:9)** ambientado en Argentina: una
base nazi secreta liberó un virus zombi en la Patagonia y un grupo de argentinos
improvisados sostiene la línea contra la horda revenant. Mezcla propia de *Warfare 1917*
(frente lateral, moral, presión de línea), *Plants vs Zombies* (carriles, counterplay) y
*Slay the Spire* (mapa de run, nodos, reliquias, eventos). Estética **cómic bélico oscuro
pulp** con humor criollo.

**Stack:** Phaser 3 · TypeScript · Vite · (Capacitor para empaquetar mobile, más adelante).

---

## Estado: landscape jugable + arte inicial

Build jugable de punta a punta en **horizontal 960×540 (16:9)**:

- Escenas Boot → Menú → Mapa de run → Batalla → Resultado.
- **Combate por carriles** (4): base argentina a la izquierda, búnker enemigo a la
  derecha; tropas avanzan →, revenants avanzan ←; combate automático.
- Unidades argentinas (Conscripto, Gendarme, Médica, Mecánico, Cazador Patagónico,
  Parrillero…) desplegables por coste + cooldown; habilidades de comandante (Ataque
  Aéreo, Botiquín).
- Economía de suministros, **moral**, HP de base/búnker, oleadas (WaveSystem) y **boss**.
- **Run roguelite**: mapa de nodos horizontal, eventos, tienda, cuartel, recompensas,
  upgrades y reliquias (data ya definida en `/src/data`).
- **Arte**: fondo de batalla y key art del menú **16:9 generados con Magnific** (cómic
  bélico). Las unidades/enemigos aún usan sprites procedurales (placeholder coherente);
  reemplazo de personajes documentado en `docs/MAGNIFIC_PROMPTS.md`.

> HUD: arriba HP Base / Moral · Suministros · Bajas / HP Búnker; abajo cartas de unidad
> (izquierda) y habilidades (derecha). Pensado para dedos en mobile landscape.

---

## Cómo correrlo

Requiere Node 18+.

```bash
npm install
npm run dev      # servidor de desarrollo (Vite) → http://localhost:5173
```

**Atajos de desarrollo** (para QA, no afectan el flujo normal):

- `http://localhost:5173/?scene=battle&demo=1` — combate con escuadrón ya desplegado.
- `?scene=boss` — pelea de jefe · `?scene=map` — mapa de run directo.

Para una build estática lista para servir / empaquetar:

```bash
npm run build    # typecheck + vite build → genera /dist
npm run preview  # sirve /dist localmente
```

`/dist` es una carpeta autocontenida: se puede abrir en un navegador mobile,
subir a itch.io o envolver con Capacitor sin cambios.

### Cómo se juega

Elegí un nodo en el **mapa de run** (izquierda→derecha). En combate, tocá una **carta
de unidad** (abajo a la izquierda) y luego un **carril** del campo para desplegarla
cuando tengas suministros. Las unidades avanzan y pelean solas; usá las **habilidades**
(abajo a la derecha) para inclinar la balanza. Empujá hasta el búnker enemigo antes de
que la horda arrase tu base — y cuidá la **moral**: si llega a 0, perdés.

---

## Estructura

```
operation-dead-front/
├─ index.html               # contenedor mobile landscape (#app-container 16:9)
├─ public/assets/           # backgrounds (battlefield.jpg, keyart-main.jpg), sprites, ui, audio
├─ src/
│  ├─ main.ts               # arranque Phaser (Scale.FIT 960×540 landscape)
│  ├─ scenes/               # Boot · MainMenu · Map · Battle · Result
│  ├─ systems/              # BattleSystem · WaveSystem · RunSystem (lógica, sin Phaser)
│  ├─ rendering/            # SpriteFactory (texturas procedurales) · UnitRenderer
│  ├─ data/                 # contenido declarativo (units, enemies, bosses, …)
│  ├─ types/                # contratos TypeScript (sin Phaser)
│  ├─ ui/                   # BattleUI (HUD landscape) · paleta y helpers
│  └─ utils/                # constants.ts (GAME_*, LAYOUT, FIELD — fuente única de layout)
├─ docs/                    # LANDSCAPE_REFACTOR · UI_LANDSCAPE_GUIDE · MAGNIFIC_PROMPTS ·
│                           #   asset_plan · changelog · next_steps · GDD · ROADMAP · BACKLOG …
└─ prompts/                 # prompts de agentes por rol
```

La data viene mucho más allá del MVP: 6 unidades, 8 enemigos, 3 bosses, 7 habilidades,
6 edificios + 18 upgrades, 20 reliquias, 25 eventos, 6 mutaciones, 5 comandantes y
3 operaciones — todo ya definido en `/src/data`, listo para que los próximos MVP lo
enchufen. El MVP 0.1 sólo usa Rifleman y Revenant Grunt.

---

## Reglas del proyecto

1. Nombre oficial: **Operation Dead Front**.
2. *Warfare 1917* es referencia mecánica, no se clona.
3. Sin iconografía nazi real: la facción es ficticia (Revenant Reich, sigilo *Iron Talon*).
4. Mobile-first, 2D, escalable. Ante duda: lo más simple y escalable para el MVP.
5. Data-driven: el contenido vive en `/src/data`, la lógica en `/src/systems`,
   el dibujo en `/src/scenes`. Agregar contenido no debería tocar el motor.
6. Docs en español; contenido in-game y código en inglés (i18n a futuro).

Próximo objetivo: **MVP 0.2** (ver `docs/ROADMAP.md` y `docs/BACKLOG.md`).
