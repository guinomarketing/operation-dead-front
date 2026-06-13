# Prompts de Magnific — Operación Cóndor Muerto (Landscape)

Pipeline de arte para llevar el juego a calidad final. Estilo único, paleta del brandbook,
**composición horizontal 16:9**, lectura mobile.

## Estilo base (pegar al inicio de TODOS los prompts)

```
Dark war-comic illustration, Argentine post-apocalyptic supernatural war, gritty pulp
military aesthetic, bold inked outlines, clear readable silhouettes, dramatic cinematic
lighting, cold blue/green night palette with warm orange fire accents, dirty textures
(mud, rust, worn wood, smoke), NOT hyperrealistic, NOT childish, NOT pixel art,
mobile game art, high contrast, 2D side-view game-ready.
Palette: dark military green #334B3D, night blue #1F2A33, mud brown #6B4A2E,
bunker grey, dark red #B03A2E, toxic green, fire orange, Argentine sky-blue/white as accent.
```

> Negativos sugeridos: `no real nazi symbols, no swastikas, no text, no watermark, no logos, no modern cars, no bright cartoon colors`.

---

## A. FONDOS 16:9 (máxima prioridad) — `public/assets/backgrounds/`
Tamaño: **1920×1080** (export). Sin personajes; sólo escenario, con zona media despejada para tropas.

1. `bg-battlefield-patagonia.png` — *Campo de batalla nocturno*
   `…wide horizontal battlefield in rural Patagonia at night, Argentine improvised trench on the LEFT, distant ominous bunker entrance on the RIGHT, cracked dirt road and lanes across the middle, barbed wire, broken military vehicles, windmill silhouette, mountains and fog in the background, moon, drifting smoke, empty central ground for unit combat, 16:9.`

2. `bg-bunker-exterior.png` — *Entrada del búnker enemigo (sala assault)*
   `…ominous concrete nazi-era secret bunker entrance on the right side, rusted blast doors, toxic green glow seeping out, fictional eagle/condor insignia (no real symbols), skull banner, devastated approach on the left, night, fog, 16:9.`

3. `bg-lab-underground.png` — *Laboratorio subterráneo (sala laboratorio)*
   `…underground clandestine lab corridor seen side-on, broken containment tanks with toxic green fluid, flickering lights, cables, biohazard, cold light, claustrophobic, horizontal layout, 16:9.`

4. `bg-route-fog.png` — *Ruta patagónica con niebla (sala emboscada)*
   `…abandoned Patagonian highway at night, heavy fog, wrecked bus and trucks, snow patches, pine forest silhouettes, danger, horizontal, 16:9.`

5. `bg-town-abandoned.png` — *Pueblo cordillerano evacuado (sala rescate)*
   `…evacuated Argentine mountain town, empty houses, overturned market stalls, flickering streetlight, fog, side-scrolling battlefield ground in foreground, 16:9.`

---

## B. ESTRUCTURAS — `public/assets/sprites/`
Verticales/cuadradas, fondo NEGRO sólido (el motor lo vuelve transparente por flood-fill), ~512×768.

6. `ally-bunker.png` — *Trinchera/base argentina*
   `…improvised Argentine resistance trench bunker, sandbags, corrugated metal, wood beams, small Argentine flag, lantern, facing right, solid black background.`

7. `enemy-bunker.png` — *Búnker enemigo*
   `…corrupted concrete enemy bunker tower, rusted, toxic green glow, fictional skull/condor banner, facing left, solid black background.`

---

## C. UNIDADES ALIADAS — `public/assets/sprites/unit-*.png`
Vista 3/4 lateral, mirando a la DERECHA, cuerpo completo, fondo NEGRO sólido, ~512×768, silueta única por clase.

| Archivo | Prompt corto (+estilo base) |
|---|---|
| `unit-rifleman.png` (Conscripto) | young Argentine conscript soldier, basic helmet, rifle, nervous-brave |
| `unit-heavy-gunner.png` (Gendarme) | Argentine gendarme, riot shield + heavy weapon, sturdy, defensive |
| `unit-medic.png` (Médica de Guardia) | Argentine field medic woman, white coat with red cross over fatigues, medkit |
| `unit-engineer.png` (Mecánico de Barrio) | neighborhood mechanic, jumpsuit, wrench + improvised gear, toolbelt |
| `unit-sniper.png` (Cazador/Francotirador Patagónico) | Patagonian hunter sniper, ghillie/poncho, long scoped rifle |
| `unit-flamethrower.png` (Parrillero) | grill-master soldier "parrillero", improvised flamethrower from a grill tank, apron |
| `unit-bombero.png` (Bombero Voluntario) | volunteer firefighter, hose, helmet, crowd-control |
| `unit-cientifica.png` (Científica del CONICET) | CONICET scientist woman, glasses, lab coat, vial/analyzer |
| `unit-veterano.png` (Veterano) | grizzled Malvinas-style veteran, beret, inspiring presence |
| `unit-gaucho.png` (Gaucho) | rural gaucho, facón knife, poncho, melee charge |
| `unit-colectivero.png` (Colectivero) | bus driver "colectivero", improvised gear, brings reinforcements vibe |
| `unit-electricista.png` (Electricista) | electrician, cables + stun trap gear, sparks |

---

## D. ENEMIGOS — `public/assets/sprites/enemy-*.png`
Vista 3/4 lateral, mirando a la IZQUIERDA, grotescos pero legibles, fondo NEGRO sólido, ~512×768.

| Archivo | Prompt corto (+estilo base) |
|---|---|
| `enemy-revenant-grunt.png` | rotting reanimated soldier of a fictional cult faction, decayed uniform, glowing green eyes |
| `enemy-runner-corpse.png` | fast lean sprinting zombie soldier, lunging |
| `enemy-shielded-revenant.png` | armored revenant with heavy riot/trench shield |
| `enemy-exploder.png` | bloated toxic zombie glowing green, about to detonate |
| `enemy-dead-officer.png` | reanimated officer with cap (fictional insignia), commanding aura |
| `enemy-occultist.png` | hooded cult occultist, eerie green ritual energy |
| `enemy-panzer-corpse.png` | huge bio-mechanical armored zombie tank, mini-boss bulk |
| `enemy-rot-hound.png` | rotting quadruped zombie dog, fast, fierce |
| `enemy-toxic-carrier.png` | zombie with toxic canisters leaking green gas |

---

## E. BOSSES — `public/assets/sprites/boss-*.png`
Gran tamaño, silueta fortísima, ~768×1024, fondo NEGRO sólido.

- `boss-coronel-reanimado.png` — `reanimated colonel boss, tattered greatcoat, fictional medals, glowing eyes, commanding undead general, imposing.`
- `boss-doctor-bunker.png` — `mad bunker doctor boss, surgical apron, syringes, mutagen tanks on back.`
- `boss-maquina-carne.png` — `flesh-and-metal abomination boss, corpses fused with old machinery, grotesque.`

---

## F. UI / CARDS / ICONOS — `public/assets/ui/`
- `card-frame.png` (256×340) — `dark metal/wood tactical card frame, riveted, amber accents, empty center, mobile UI.`
- `panel-hud.png` (512×128) — `heavy dark military HUD panel, metal plates, rivets, hazard stripes.`
- `icon-supplies.png`, `icon-morale.png`, `icon-intel.png`, `icon-medal.png` (128×128) — `bold illustrated tactical icon of {mate sun / morale fist / intel radio / medal}, amber on dark, readable at small size.`
- Habilidades (128×128): `icon-airstrike.png` (avión/bombardeo), `icon-medkit.png` (botiquín cruz), `icon-mate.png` (mate boost), `icon-corte-ruta.png` (barricada ruta).

---

## G. PROMO / STORE
- `keyart.png` (1920×1080) — `epic key art: Argentine resistance squad holding a trench on the left, horde of nazi-cult zombies pouring from a bunker on the right, fire, fog, dramatic, title space top.`
- `splash.png` (1920×1080) — versión más limpia del keyart con espacio para logo.
- `icon-app.png` (1024×1024) — `app icon: stylized helmet + skull + Argentine sky-blue accent, bold, readable at small size.`
- Screenshots de store: capturar el gameplay real en `localhost` (combate, mapa, recompensa).

---

## Integración
1. Generar a alta resolución → `Upscale` en Magnific si hace falta.
2. Fondos: exportar PNG 16:9 a `public/assets/backgrounds/`.
3. Sprites/estructuras: fondo **negro sólido** (el `SpriteFactory.processTransparentTexture` recorta el negro). Export PNG a `public/assets/sprites/`.
4. Cargar en `BootScene.preload` y registrar la key; reemplazar las texturas procedurales de `SpriteFactory` cuando el asset exista.
5. Verificar legibilidad en `localhost` a viewport mobile landscape (900×450).
