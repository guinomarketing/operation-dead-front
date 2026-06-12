# Operation Dead Front

Roguelite táctico mobile (2D, vista lateral) de guerra alternativa contra una facción
ficticia de muertos vivientes — **The Revenant Reich**. Inspirado mecánicamente en
*Warfare 1917* (frente lateral, despliegue por recursos, presión de línea), con
identidad propia y estética pulp bélica sobrenatural.

**Stack:** Phaser 3 · TypeScript · Vite · (Capacitor para empaquetar mobile, más adelante).

---

## Estado: MVP 0.1 — jugable

Esta build ya se juega. Incluye el bucle de combate completo de una batalla:

- Escenas Boot → Menú → Batalla → Resultado, en formato vertical 540×960 (Scale.FIT).
- Despliegue de **Rifleman** por coste (25 supplies) y cooldown (2 s).
- Spawn automático de **Revenant Grunts** cada 3,5 s.
- Combate automático: avance, rango, ataque por intervalos, daño con armadura, muerte.
- Economía de supplies (+8/s, arranque 40) con recompensa (bounty) por matar.
- Vida de HQ aliado (100) y bastión enemigo (250); daño al alcanzar la base.
- Victoria (bastión a 0) / derrota (HQ a 0) con pantalla de resultado y reinicio.

Todo el arte es **placeholder vectorial** (rectángulos con color + etiqueta), por diseño.

---

## Cómo correrlo

Requiere Node 18+.

```bash
npm install
npm run dev      # servidor de desarrollo (Vite) → abrí la URL que imprime
```

Para una build estática lista para servir / empaquetar:

```bash
npm run build    # typecheck + vite build → genera /dist
npm run preview  # sirve /dist localmente
```

`/dist` es una carpeta autocontenida: se puede abrir en un navegador mobile,
subir a itch.io o envolver con Capacitor sin cambios.

### Cómo se juega

Tocá la carta **RIFLEMAN** abajo para desplegar tropa cuando tengas supplies.
Los riflemen avanzan solos y pelean. Acumulá presión para empujar hasta el bastión
enemigo antes de que los grunts arrasen tu HQ. Si te quedás sin supplies, esperá:
se regeneran solos y subís bounty por cada muerto.

---

## Estructura

```
operation-dead-front/
├─ index.html               # contenedor mobile portrait
├─ src/
│  ├─ main.ts               # arranque Phaser (Scale.FIT 540×960)
│  ├─ scenes/               # Boot · MainMenu · Battle · Result
│  ├─ systems/              # BattleSystem (lógica de combate, sin Phaser)
│  ├─ data/                 # contenido declarativo (units, enemies, bosses, …)
│  ├─ types/                # contratos TypeScript (sin Phaser)
│  ├─ ui/                   # paleta y helpers de UI
│  └─ utils/                # constants.ts (números base del juego)
├─ docs/                    # GDD · ART_DIRECTION · TECH_ARCHITECTURE · ROADMAP · BACKLOG
└─ prompts/                 # prompts de agentes por rol (ver docs/PROMPTS.md)
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
