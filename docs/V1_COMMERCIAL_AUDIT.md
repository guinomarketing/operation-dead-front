# Patagonia Z - Auditoria comercial 1.0

Fecha: 2026-06-15

## Veredicto

Patagonia Z tiene una direccion visual fuerte y una base jugable prometedora, pero
el proyecto actual sigue siendo una pre-alpha vertical slice. Todavia no esta
cerca de una version comercial apta para Play Store.

- Calidad global frente a un 1.0 comercial: 3.4/10
- Preparacion tecnica para Play Store: 0.5/10
- Potencial del concepto y direccion artistica: 8/10

El principal riesgo no es la falta de contenido. Es que varios sistemas declarados
existen solo como datos o interfaz, sin comportamiento real. Agregar contenido
sobre esa base multiplicaria deuda, bugs y balance falso.

## Fortalezas

- Concepto facil de comunicar y con identidad argentina.
- Combate horizontal entendible en segundos.
- Buena base de unidades, enemigos y progresion.
- Direccion pulp militar sobrenatural diferenciada.
- Tecnologia sencilla de iterar: Phaser, TypeScript y Vite.

## Bloqueadores criticos

### Gameplay

- Las batallas de asalto pueden terminar sin destruir el bunker.
- El primer combate es demasiado facil y tacticamente superficial.
- Habilidades, comportamientos enemigos y fases de boss estan incompletos.
- Muchos efectos de eventos, reliquias, mutaciones y mejoras son no-op.

### Runs y progresion

- El mapa ignora la seed y no es reproducible.
- No existe guardado y reanudacion confiable de una run.
- La progresion permanente es superficial.
- No hay logros implementados.

### UX y onboarding

- El tutorial no ensena counters, objetivos, economia ni lectura de carriles.
- Faltan seleccion profesional de operacion/comandante, pausa y ajustes.
- La interfaz de combate ocupa demasiado espacio y las unidades se amontonan.

### Tecnologia y Play Store

- No existe proyecto Android, AAB ni pipeline de firma.
- No hay analytics, crash reporting, remote config, pruebas automatizadas o CI.
- Faltan lifecycle mobile, safe areas, haptics, privacidad y billing.
- El bundle JavaScript supera 1.6 MB minificado y requiere division de chunks.

### Audio

- Solo existen dos loops musicales y efectos procedurales basicos.
- Faltan musica por biome/boss, stingers y ajustes visibles.

## Cambios realizados en el checkpoint visual

Se uso ChatGPT Images 2 mediante la herramienta integrada para crear e integrar:

- Portada principal y nombre Patagonia Z.
- Mapa de campana.
- Campos de batalla Pueblo Fantasma y Fundicion Negra.
- Fondos de victoria, derrota y cuartel.
- Cuatro vinetas cinematograficas de apertura.
- Hojas animadas de seis poses para Totenkopf y Locomotora Profanadora.

Tambien se conectaron:

- Fondo por operacion.
- Boss y estadisticas por operacion.
- Frames de movimiento, ataque y dano para los bosses nuevos.
- Cuartel con pantalla propia.
- Cinematica de apertura pagina por pagina.
- IDs iniciales validos de operacion y comandante.
- Pipeline reutilizable para normalizar hojas de animacion.

## Alcance recomendado para 1.0

- 3 operaciones completas con reglas y bosses propios.
- 12 unidades, 10 enemigos regulares, 3 elites/minibosses y 3 bosses.
- 30 reliquias, 18 mejoras y 30 eventos completamente funcionales.
- 5 comandantes y 5 objetivos de batalla.
- Tutorial interactivo, cinematicas, progresion permanente y 25-35 logros.
- Espanol e ingles.
- Android AAB, billing, analytics, crash reporting y cumplimiento Play Store.

## Monetizacion recomendada

- Descarga gratuita con Operacion 1 completa.
- Compra unica para desbloquear operaciones 2 y 3 y la progresion completa.
- Cosmeticos de apoyo opcionales luego del lanzamiento.
- Evitar energia, gacha, intersticiales y pay-to-win.

## Plan de ejecucion

1. Reset de producto y marca: 2 semanas.
2. Fundacion tecnica, guardado, RNG y Android: 6 semanas.
3. Combat slice comercial: 6 semanas.
4. Run, meta y onboarding: 6 semanas.
5. Contenido y presentacion: 8-10 semanas.
6. Beta y Play Store: 6 semanas.
7. Soft launch: 4 semanas.

Estimacion realista: 34-40 semanas con un equipo central de 8-10 personas.

## Proxima prioridad

La siguiente tanda debe cerrar el combat slice comercial:

1. Corregir condiciones de asalto y defensa.
2. Crear waves por operacion y composiciones tacticas.
3. Implementar fases funcionales de Totenkopf y Locomotora.
4. Rehacer el tutorial para ensenar counters.
5. Implementar guardado y reanudacion de run.

