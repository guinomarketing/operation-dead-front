# AI Master Context — Patagonia Z

> Lectura obligatoria para CUALQUIER IA antes de tocar el proyecto.
> Si algo de acá contradice lo que ibas a hacer, gana este documento (o proponé cambiarlo y documentalo).

## Qué es Patagonia Z
Juego **mobile 2D, horizontal (landscape 16:9), táctico, roguelite por runs**, de **defensa por carriles / frente lateral**. Identidad **argentina**.

Fantasía central: Argentina improvisa una defensa desesperada contra una amenaza **zombi / revenant / ocultista** salida de una **base secreta enemiga en la Patagonia**. Gente común (conscriptos, gendarmes, médicas, parrilleros, gauchos, científicas del CONICET…) que decide no arrodillarse.

- Base **argentina a la IZQUIERDA**, **búnker enemigo a la DERECHA**.
- Tropas avanzan →, enemigos ←. Combate automático; el jugador decide **qué desplegar, dónde y cuándo** + habilidades.

## Género e inspiraciones (tomar aprendizajes, NO clonar)
- **Plants vs Zombies** → claridad de carriles, lectura inmediata, counters simples, siluetas fuertes.
- **Warfare 1917** → presión lateral, frente, moral, desgaste, avance de tropas.
- **Slay the Spire** → mapa de run, nodos, reliquias, eventos, builds, riesgo/recompensa.
- Identidad propia: NO copiar UI/arte/estructura exacta de ninguno. El mapa NO debe sentirse "Slay the Spire pobre" → dirección objetivo: **frente táctico vivo en la Patagonia**.

## Tono e identidad
Cómic bélico oscuro + terror pulp sobrenatural + humor criollo inteligente + épica nacional improvisada. Oscuro pero no depresivo. Heroico con humor.

## Reglas duras (no romper)
1. **Enemigos = monstruos**, nunca héroes. Sin glorificación nazi.
2. **Sin iconografía nazi real** como elemento protagonista (nada de esvásticas). Facción ficticia: **Orden del Cóndor Negro / Revenant Reich** con simbología propia (calavera, etc.).
3. Humor argentino sí; humor discriminatorio/berreta no.
4. Mobile-first, landscape, legible con el dedo.
5. Data-driven: contenido en `src/data/`, lógica en `src/systems/` (sin Phaser), render en `src/scenes|rendering`, UI en `src/ui/`.

## Estilo visual
2D ilustrado cómic bélico, trazos marcados, paleta verde militar / azul noche / marrón barro / gris búnker / rojo apagado / verde tóxico, con celeste-blanco argentino y naranja fuego como acentos. Assets generados con **ChatGPT Images 2 / Magnific**. Mantener esa dirección.

## Estándar de calidad (definición de "aceptable")
Una mejora vale solo si: **se siente bien, se ve bien, es legible, es táctica, tiene impacto y acerca a un producto comercial.** No maqueta, no prototipo disfrazado.

## Objetivo
**Patagonia Z v1.0**: juego completo, jugable, pulido, apto para **Play Store**. No demo, no MVP pobre.

## Stack técnico
Phaser **3.90** + **TypeScript** + **Vite**. Resolución lógica **960×540** (Scale.FIT). Empaquetado mobile futuro: Capacitor (Android). Sin backend.
