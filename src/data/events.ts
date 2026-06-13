import type { EventDef } from '../types/EventTypes';

/**
 * 25 eventos narrativos. Tono: pulp bélico sobrenatural, decisiones con costo.
 * Ambientación: Resistencia patagónica en los bosques y estepas heladas de Argentina.
 */
export const EVENTS: EventDef[] = [
  {
    id: 'abandoned-bunker',
    title: 'Búnker Abandonado',
    text: 'Un búnker oculto del Cóndor Negro en medio del bosque de lengas. Hay cajones con armas experimentales y marcas de garras en el interior de la compuerta.',
    options: [
      {
        id: 'claim', label: 'Reclamar las armas', hint: 'Aumento de daño... probablemente.',
        outcomes: [
          { chance: 0.7, text: 'Botín limpio. Tus conscriptos cargan los fusiles con entusiasmo.', effects: [{ kind: 'run-modifier', modifier: { stat: 'damage', op: 'mul', value: 1.1, filter: { side: 'ally' } }, duration: 'run' }] },
          { chance: 0.3, text: 'Los cajones eran una carnada. Unos sabuesos infectados salen de la maleza y te atacan.', hidden: true, effects: [{ kind: 'run-modifier', modifier: { stat: 'damage', op: 'mul', value: 1.1, filter: { side: 'ally' } }, duration: 'run' }, { kind: 'spawn-threat', enemyId: 'rot-hound', count: 3 }] },
        ],
      },
      {
        id: 'destroy', label: 'Volarlo por los aires', hint: 'Seguro. Aporta información y moral.',
        outcomes: [{ text: 'La explosión retumba en la cordillera. Los soldados celebran el estallido.', effects: [{ kind: 'intel', amount: 2 }, { kind: 'morale', amount: 5 }] }],
      },
      {
        id: 'study', label: 'Estudiar la tecnología', hint: 'Apuesta: una reliquia o tiempo perdido.',
        outcomes: [
          { chance: 0.5, text: 'Entre la chatarra nazi: encontrás algo genuinamente útil.', effects: [{ kind: 'gain-relic' }] },
          { chance: 0.5, text: 'Horas perdidas analizando chatarra inservible. Desgaste de suministros.', effects: [{ kind: 'supplies', amount: -20 }] },
        ],
      },
    ],
  },
  {
    id: 'infected-soldier',
    title: 'El Conscripto Infectado',
    text: 'El conscripto Maidana oculta una mordedura de zombi bajo su poncho. El médico estima pocas horas de lucidez.',
    options: [
      {
        id: 'sacrifice', label: 'Darle un final digno', hint: 'Golpe a la moral. Los soldados recordarán esto.',
        outcomes: [{ text: 'Un disparo al amanecer. Su libreta va al registro; sus notas van a Inteligencia.', effects: [{ kind: 'morale', amount: -10 }, { kind: 'intel', amount: 2 }] }],
      },
      {
        id: 'cure', label: 'Probar el brebaje experimental', hint: 'Riesgoso. Podría inspirar a toda la tropa.',
        outcomes: [
          { chance: 0.55, text: 'Maidana sobrevive al trago. Toda la compañía lucha con más fuerzas al ver el milagro.', effects: [{ kind: 'morale', amount: 8 }, { kind: 'run-modifier', modifier: { stat: 'maxHp', op: 'mul', value: 1.05, filter: { side: 'ally' } }, duration: 'run' }] },
          { chance: 0.45, text: 'El brebaje falla. Lo que se levanta de la camilla ya no es Maidana.', hidden: true, effects: [{ kind: 'spawn-threat', enemyId: 'shielded-revenant', count: 1 }] },
        ],
      },
      {
        id: 'bait', label: 'Usarlo como distracción', hint: 'Cruel pero tácticamente ventajoso.',
        outcomes: [{ text: 'La horda se entretiene con la carnada. Tus hombres evitan mirarte a los ojos.', effects: [{ kind: 'run-modifier', modifier: { stat: 'moveSpeed', op: 'mul', value: 0.85, filter: { side: 'enemy' } }, duration: 'next-battle' }, { kind: 'morale', amount: -6 }] }],
      },
    ],
  },
  {
    id: 'enemy-radio',
    title: 'Radio de la Secta',
    text: 'Un transmisor del Cóndor Negro en funcionamiento, transmitiendo coordenadas cifradas.',
    options: [
      {
        id: 'listen', label: 'Decodificar la frecuencia', hint: 'El conocimiento es munición.',
        outcomes: [{ text: 'Rutas de patrullaje, depósitos de suero y planes del búnker anotados.', effects: [{ kind: 'intel', amount: 3 }, { kind: 'reveal-next-event' }] }],
      },
      {
        id: 'false-signal', label: 'Emitir una señal falsa', hint: 'Apuesta: reducir su próximo ataque, o enfurecerlos.',
        outcomes: [
          { chance: 0.7, text: 'Muerden el anzuelo y dividen sus fuerzas por el valle.', effects: [{ kind: 'reduce-waves', amount: 1 }] },
          { chance: 0.3, text: 'Rastrean tu transmisión. Se dirigen directamente hacia vos.', hidden: true, effects: [{ kind: 'spawn-threat', enemyId: 'revenant-grunt', count: 4 }] },
        ],
      },
    ],
  },
  {
    id: 'hidden-civilians',
    title: 'Pobladores Escondidos',
    text: 'Un sótano lleno de familias patagónicas refugiadas. Tienen comida y agua, pero no tienen defensa.',
    options: [
      {
        id: 'escort', label: 'Escoltarlos a zona segura', hint: 'Cuesta suministros. Es lo correcto.',
        outcomes: [{ text: 'Llegan a salvo al puesto fronterizo. Tus hombres marchan con orgullo.', effects: [{ kind: 'supplies', amount: -25 }, { kind: 'morale', amount: 12 }] }],
      },
      {
        id: 'requisition', label: 'Requisar sus provisiones', hint: 'Suministros ahora, vergüenza después.',
        outcomes: [{ text: 'La guerra tiene un costo amargo. Hoy les tocó pagarlo a ellos.', effects: [{ kind: 'supplies', amount: 40 }, { kind: 'morale', amount: -8 }, { kind: 'flag', id: 'ruthless' }] }],
      },
      {
        id: 'fortify', label: 'Armarlos y seguir viaje', hint: 'Costo mínimo, consuelo rápido.',
        outcomes: [{ text: 'Les dejás unos fusiles viejos y les deseás suerte.', effects: [{ kind: 'supplies', amount: -10 }, { kind: 'morale', amount: 4 }] }],
      },
    ],
  },
  {
    id: 'occult-laboratory',
    title: 'Laboratorio de la Secta',
    text: 'Raros símbolos pintados y tanques de suero verdoso. El Proyecto Umbra operaba acá.',
    options: [
      {
        id: 'burn', label: 'Quemarlo todo', hint: 'Purificación. Elimina una mutación de la run.',
        outcomes: [{ text: 'El fuego del soplete consume las muestras. El aire se siente más limpio.', effects: [{ kind: 'morale', amount: 8 }, { kind: 'remove-mutation' }] }],
      },
      {
        id: 'loot-notes', label: 'Llevarse las bitácoras', hint: 'Inteligencia, con riesgo de contaminación.',
        outcomes: [
          { chance: 0.65, text: 'Los documentos son valiosos. Detallan los experimentos de Von Totenkopf.', effects: [{ kind: 'intel', amount: 4 }] },
          { chance: 0.35, text: 'Una toxina oculta se esparce. Los muertos avanzan más extraños ahora.', hidden: true, effects: [{ kind: 'intel', amount: 4 }, { kind: 'add-mutation' }] },
        ],
      },
      {
        id: 'test-serum', label: 'Probar una muestra purificada', hint: 'Moneda al aire sobre el cuerpo de tus soldados.',
        outcomes: [
          { chance: 0.5, text: 'Diluido correctamente, endurece la piel frente al frío y los golpes.', effects: [{ kind: 'run-modifier', modifier: { stat: 'maxHp', op: 'mul', value: 1.1, filter: { side: 'ally' } }, duration: 'run' }] },
          { chance: 0.5, text: 'El voluntario cae en un delirio violento y debe ser aislado.', effects: [{ kind: 'morale', amount: -8 }, { kind: 'disable-unit-next-battle', random: true }] },
        ],
      },
    ],
  },
  {
    id: 'supply-train',
    title: 'La Trochita Varada',
    text: 'Un vagón de carga descarrilado en la nieve. La carga del Cóndor Negro sigue intacta, pero su escolta no se ha ido del todo.',
    options: [
      {
        id: 'raid-fast', label: 'Golpe rápido y huida', hint: 'Suministros rápidos, resistencia leve.',
        outcomes: [{ text: 'Entrar, agarrar lo que se pueda y salir antes de que se organicen.', effects: [{ kind: 'supplies', amount: 35 }] }],
      },
      {
        id: 'raid-thorough', label: 'Desvalijar por completo', hint: 'Gran botín, pero alertará a la horda.',
        outcomes: [
          { chance: 0.6, text: 'Te llevás hasta los clavos. Conseguís repuestos excelentes para la armería.', effects: [{ kind: 'supplies', amount: 60 }, { kind: 'gain-upgrade', buildingId: 'armory' }] },
          { chance: 0.4, text: 'Zombis acorazados emergen de la cabina mientras saqueás.', hidden: true, effects: [{ kind: 'supplies', amount: 60 }, { kind: 'spawn-threat', enemyId: 'shielded-revenant', count: 2 }] },
        ],
      },
    ],
  },
  {
    id: 'military-cemetery',
    title: 'Cementerio de la Estepa',
    text: 'Viejas cruces de madera cubiertas de escarcha. Algunas tumbas parecen haber sido abiertas desde adentro.',
    options: [
      {
        id: 'honor', label: 'Rendir homenaje', hint: 'Moral. El respeto fortalece la fe.',
        outcomes: [{ text: 'Un minuto de silencio frente al viento helado compra una semana de coraje.', effects: [{ kind: 'morale', amount: 10 }] }],
      },
      {
        id: 'salvage', label: 'Revisar equipamiento abandonado', hint: 'Suministros, a cambio de un mal augurio.',
        outcomes: [
          { chance: 0.7, text: 'Viejos pertrechos militares, aún utilizables.', effects: [{ kind: 'supplies', amount: 30 }, { kind: 'morale', amount: -4 }] },
          { chance: 0.3, text: 'Las tumbas crujen y responden.', hidden: true, effects: [{ kind: 'supplies', amount: 30 }, { kind: 'spawn-threat', enemyId: 'revenant-grunt', count: 5 }] },
        ],
      },
    ],
  },
  {
    id: 'minefield',
    title: 'El Campo Minado',
    text: 'Tu ruta atraviesa un campo de minas plantado por la secta. El desvío costará un día de raciones.',
    options: [
      {
        id: 'rush', label: 'Cruzar rápido', hint: 'Riesgo de bajas, pero ahorra suministros.',
        outcomes: [
          { chance: 0.5, text: 'Pasos ligeros, respiración contenida. Todos cruzan a salvo.', effects: [{ kind: 'morale', amount: 6 }] },
          { chance: 0.5, text: 'Un paso en falso. El estallido sacude la columna.', effects: [{ kind: 'base-hp', amount: -8 }, { kind: 'morale', amount: -5 }] },
        ],
      },
      {
        id: 'around', label: 'Rodear la zona', hint: 'Seguro, lento y costoso.',
        outcomes: [{ text: 'Un largo, aburrido pero seguro rodeo por los cerros.', effects: [{ kind: 'supplies', amount: -20 }] }],
      },
      {
        id: 'clear', label: 'Despejar sendero', requiresUnitId: 'engineer', hint: 'El Mecánico demuestra su valor.',
        outcomes: [{ text: 'El mecánico desactiva las minas y las convierte en repuestos explosivos.', effects: [{ kind: 'morale', amount: 4 }, { kind: 'run-modifier', modifier: { stat: 'damage', op: 'mul', value: 1.15, filter: { side: 'ally' } }, duration: 'next-battle' }] }],
      },
    ],
  },
  {
    id: 'captured-officer',
    title: 'Sectario Capturado',
    text: 'Un colaborador de la secta es capturado enviando señales de radio a los muertos. Ofrece información a cambio de clemencia.',
    options: [
      {
        id: 'interrogate', label: 'Interrogarlo a fondo', hint: 'Datos del búnker. Lleva tiempo.',
        outcomes: [{ text: 'Habla todo lo que sabe: mapas de patrullas y ubicaciones.', effects: [{ kind: 'intel', amount: 3 }, { kind: 'reveal-next-event' }] }],
      },
      {
        id: 'execute', label: 'Juicio de campaña', hint: 'Moral para la tropa.',
        outcomes: [{ text: 'Juicio corto. Sentencia inmediata en la estepa.', effects: [{ kind: 'morale', amount: 7 }] }],
      },
      {
        id: 'trade', label: 'Entregarlo a los baquianos', hint: 'Pagan en suministros.',
        outcomes: [{ text: 'Los baquianos locales tienen sus propios métodos para tratar con él.', effects: [{ kind: 'supplies', amount: 35 }] }],
      },
    ],
  },
  {
    id: 'incomplete-map',
    title: 'El Mapa Incompleto',
    text: 'Un baquiano caído sostiene un mapa de senderos cordilleranos. La mitad está quemada.',
    options: [
      {
        id: 'trust', label: 'Seguir el mapa', hint: 'Puede revelar atajos o llevarte a una emboscada.',
        outcomes: [
          { chance: 0.65, text: 'La mitad sobreviviente es exacta. Los pasos se abren limpios.', effects: [{ kind: 'reveal-map' }] },
          { chance: 0.35, text: 'La parte quemada ocultaba un nido de tiradores reanimados.', hidden: true, effects: [{ kind: 'spawn-threat', enemyId: 'dead-officer', count: 1 }] },
        ],
      },
      {
        id: 'sell', label: 'Venderlo al intendente', hint: 'Suministros garantizados.',
        outcomes: [{ text: 'Paga una buena cantidad por papel con senderos marcados.', effects: [{ kind: 'supplies', amount: 25 }] }],
      },
    ],
  },
  {
    id: 'the-deserter',
    title: 'El Conscripto Aislado',
    text: 'Un soldado que se separó de su unidad quiere unirse. Su fusil está impecable, pero su historia tiene baches.',
    options: [
      {
        id: 'recruit', label: 'Aceptarlo en las filas', hint: 'Un fusil extra, pero con dudas.',
        outcomes: [
          { chance: 0.7, text: 'Pelea como alguien que necesita redimirse. Ayuda a organizar reclutas.', effects: [{ kind: 'morale', amount: 4 }, { kind: 'run-modifier', modifier: { stat: 'deployCooldown', op: 'mul', value: 0.9, filter: { unitIds: ['rifleman'] } }, duration: 'run' }] },
          { chance: 0.3, text: 'Desaparece a la segunda noche. Se llevó un cajón de raciones.', hidden: true, effects: [{ kind: 'supplies', amount: -25 }, { kind: 'morale', amount: -4 }] },
        ],
      },
      {
        id: 'turn-away', label: 'Darle provisiones y despedirlo', hint: 'Misericordia barata.',
        outcomes: [{ text: 'Asiente en silencio y se pierde en el viento blanco.', effects: [{ kind: 'morale', amount: 2 }] }],
      },
    ],
  },
  {
    id: 'field-hospital',
    title: 'Puesto de Guardia Médico',
    text: 'Un puesto sanitario de gendarmería saturado de heridos. El cirujano principal ofrece un trato.',
    options: [
      {
        id: 'leave-wounded', label: 'Dejar heridos graves para cuidado', hint: 'Restaura salud al cuartel general.',
        outcomes: [{ text: 'Camas limpias y cuidado médico real. La columna avanza sin lastre.', effects: [{ kind: 'base-hp', amount: 15 }] }],
      },
      {
        id: 'donate', label: 'Donar insumos médicos', hint: 'Cuesta suministros. Lo recordarán.',
        outcomes: [{ text: 'El cirujano te promete prioridad médica y mejoras para la enfermería.', effects: [{ kind: 'supplies', amount: -20 }, { kind: 'morale', amount: 6 }, { kind: 'gain-upgrade', buildingId: 'med-tent' }] }],
      },
    ],
  },
  {
    id: 'ammo-cache',
    title: 'Caché de Municiones',
    text: 'Un contenedor enterrado con marcas del ejército. Quien lo escondió no va a volver.',
    options: [
      {
        id: 'take-supplies', label: 'Llevarse todo', hint: 'Suministros directos.',
        outcomes: [{ text: 'Cajas llenas de cartuchos limpios. Regalo del cielo en las trincheras.', effects: [{ kind: 'supplies', amount: 45 }] }],
      },
      {
        id: 'outfit', label: 'Abastecer pelotones de élite', hint: 'Obtené una mejora de Armería.',
        outcomes: [{ text: 'Cartuchos especiales de caza, distribuidos a los mejores tiradores.', effects: [{ kind: 'gain-upgrade', buildingId: 'armory' }] }],
      },
    ],
  },
  {
    id: 'the-old-chapel',
    title: 'La Capilla de la Estepa',
    text: 'Una pequeña capilla de piedra intacta. Las velas siguen encendidas, pero no hay nadie.',
    options: [
      {
        id: 'pray', label: 'Permitir un momento de oración', hint: 'Moral y templanza.',
        outcomes: [{ text: 'El silencio reconforta a los soldados. Marchan con la mente clara.', effects: [{ kind: 'morale', amount: 10 }, { kind: 'run-modifier', modifier: { stat: 'moraleLossMult', op: 'mul', value: 0.8 }, duration: 'next-battle' }] }],
      },
      {
        id: 'search-crypt', label: 'Revisar el sótano', hint: 'Las reliquias suelen guardarse abajo. Otras cosas también.',
        outcomes: [
          { chance: 0.6, text: 'Bajo el altar de madera: encontrás un amuleto antiguo bendecido.', effects: [{ kind: 'gain-relic' }] },
          { chance: 0.4, text: 'La entrada estaba bloqueada por una razón. Un ocultista acechaba abajo.', hidden: true, effects: [{ kind: 'spawn-threat', enemyId: 'occultist', count: 1 }, { kind: 'morale', amount: -4 }] },
        ],
      },
    ],
  },
  {
    id: 'crashed-bomber',
    title: 'Avión de Carga Caído',
    text: 'Un bimotor militar accidentado en la ladera. La radio de alta frecuencia funciona, y la carga pesada también.',
    options: [
      {
        id: 'salvage-radio', label: 'Sintonizar la radio', hint: 'Carga un ataque aéreo gratuito para el próximo combate.',
        outcomes: [{ text: 'Lográs contactar al hangar de apoyo de Pucará. Confirmaron coordenadas.', effects: [{ kind: 'ability-charge', abilityId: 'airstrike' }] }],
      },
      {
        id: 'salvage-parts', label: 'Desguazar piezas', hint: 'Suministros y chatarra útil.',
        outcomes: [{ text: 'Instrumental, combustible e instrumental de aviación rescatado.', effects: [{ kind: 'supplies', amount: 30 }, { kind: 'intel', amount: 1 }] }],
      },
    ],
  },
  {
    id: 'black-market-trader',
    title: 'Mercachifle de Frontera',
    text: 'Un contrabandista con un carro repleto de curiosidades y una sonrisa dudosa. Solo efectivo.',
    options: [
      {
        id: 'buy-relic', label: 'Comprar "objeto especial"', hint: '-30 suministros por una reliquia.',
        outcomes: [{ text: 'Es legítimo. De procedencia dudosa, pero sumamente útil.', effects: [{ kind: 'supplies', amount: -30 }, { kind: 'gain-relic' }] }],
      },
      {
        id: 'rob', label: 'Confiscar el carro', hint: 'Suministros gratis, pero con consecuencias de moral.',
        outcomes: [
          { chance: 0.6, text: 'Cede la mercancía con una calma que te resulta inquietante.', effects: [{ kind: 'supplies', amount: 40 }, { kind: 'morale', amount: -5 }] },
          { chance: 0.4, text: 'Los productos se deshacen en tus manos. Su sonrisa burlona sigue grabada en tu memoria.', hidden: true, effects: [{ kind: 'morale', amount: -8 }, { kind: 'disable-unit-next-battle', random: true }] },
        ],
      },
      {
        id: 'walk-away', label: 'Seguir de largo', hint: 'Algunos tratos huelen mal a la distancia.',
        outcomes: [{ text: 'Mantenés tus recursos e integridad intactos.', effects: [{ kind: 'morale', amount: 2 }] }],
      },
    ],
  },
  {
    id: 'storm-front',
    title: 'Viento Blanco',
    text: 'Un feroz temporal de nieve se desata sobre el carril. A los muertos no les importa el frío; a tus conscriptos sí.',
    options: [
      {
        id: 'push-through', label: 'Marchar bajo la tormenta', hint: 'Avanzar rápido, pero con frío en el cuerpo.',
        outcomes: [{ text: 'Incómodo y helado, pero ganás terreno y velocidad de respuesta.', effects: [{ kind: 'morale', amount: -4 }, { kind: 'supplies', amount: 20 }, { kind: 'run-modifier', modifier: { stat: 'moveSpeed', op: 'mul', value: 1.1, filter: { side: 'ally' } }, duration: 'next-battle' }] }],
      },
      {
        id: 'wait', label: 'Esperar a que amaine', hint: 'Consume suministros, pero permite descansar.',
        outcomes: [{ text: 'Mate cocido caliente, truco en las tiendas y ropa seca. Vale cada ración.', effects: [{ kind: 'supplies', amount: -15 }, { kind: 'morale', amount: 8 }] }],
      },
    ],
  },
  {
    id: 'propaganda-tower',
    title: 'Torre de Transmisión Nazi',
    text: 'Una torre con parlantes oxidados del Cóndor Negro repite un discurso marcial en bucle. El eco crispa los nervios de tus hombres.',
    options: [
      {
        id: 'demolish', label: 'Derribar la torre', hint: 'Ruidoso. Atraerá atención.',
        outcomes: [
          { chance: 0.7, text: 'El silencio posterior es el sonido más glorioso del día.', effects: [{ kind: 'morale', amount: 10 }] },
          { chance: 0.3, text: 'El estrépito de la caída alerta a todos los zombis cercanos.', hidden: true, effects: [{ kind: 'morale', amount: 10 }, { kind: 'spawn-threat', enemyId: 'runner-corpse', count: 4 }] },
        ],
      },
      {
        id: 'hijack', label: 'Intervenir la señal', hint: 'Usa inteligencia. Desmoraliza al enemigo.',
        outcomes: [{ text: 'Sintonizás folklore e himnos patrios. Interrumpe las frecuencias rituales.', effects: [{ kind: 'intel', amount: -2 }, { kind: 'reduce-waves', amount: 1 }, { kind: 'morale', amount: 5 }] }],
      },
    ],
  },
  {
    id: 'mass-grave',
    title: 'Fosa Común',
    text: 'Una fosa de soldados sin sepultura. La tierra parece vibrar con un lamento sordo.',
    options: [
      {
        id: 'consecrate', label: 'Consagrar la fosa', hint: 'Calma el espíritu de los caídos.',
        outcomes: [{ text: 'La vibración cesa. El ambiente se siente en paz.', effects: [{ kind: 'morale', amount: 8 }, { kind: 'remove-mutation', mutationId: 'grave-discipline' }] }],
      },
      {
        id: 'search-tags', label: 'Recuperar libretas de enrolamiento', hint: 'Datos de inteligencia. Excavación peligrosa.',
        outcomes: [
          { chance: 0.6, text: 'Encontrás identidades y chapas de gendarmería. Información útil.', effects: [{ kind: 'intel', amount: 3 }] },
          { chance: 0.4, text: 'La fosa responde al movimiento. Brazos reanimados emergen del suelo.', hidden: true, effects: [{ kind: 'intel', amount: 3 }, { kind: 'spawn-threat', enemyId: 'revenant-grunt', count: 6 }] },
        ],
      },
    ],
  },
  {
    id: 'lost-patrol',
    title: 'La Patrulla Perdida',
    text: 'Disparos al este. Una patrulla de gendarmería está rodeada por sabuesos en un bajo.',
    options: [
      {
        id: 'rescue', label: 'Ir al rescate', hint: 'Podrías sumar un equipo pesado (Gendarme) a tus filas.',
        outcomes: [
          { chance: 0.65, text: 'Lográs sacarlos con vida. Su tirador de ametralladora pesada se une al plantel.', effects: [{ kind: 'unlock-unit', unitId: 'heavy-gunner' }, { kind: 'morale', amount: 6 }] },
          { chance: 0.35, text: 'Llegás tarde y caés en la emboscada que los devoró.', effects: [{ kind: 'base-hp', amount: -10 }, { kind: 'morale', amount: -4 }] },
        ],
      },
      {
        id: 'mark', label: 'Marcar su posición', hint: 'Inteligencia segura sin riesgos.',
        outcomes: [{ text: 'Reportás el cuadrante para que otra compañía lo verifique.', effects: [{ kind: 'intel', amount: 2 }] }],
      },
    ],
  },
  {
    id: 'wounded-sniper',
    title: 'La Cazadora Herida',
    text: 'Una cazadora patagónica con la pierna rota y el fusil impecable descansa contra un calafate. "Veneno de zombi no tengo, cúrenme y les cuido la espalda."',
    options: [
      {
        id: 'patch-up', label: 'Gastar insumos médicos en cirugía', hint: '-20 suministros. Suma un Cazador Patagónico.',
        outcomes: [{ text: 'Una sutura rápida y alcohol del parrillero. Dispara mejor enojada.', effects: [{ kind: 'supplies', amount: -20 }, { kind: 'unlock-unit', unitId: 'sniper' }] }],
      },
      {
        id: 'morphine', label: 'Aliviar su dolor y seguir viaje', hint: 'Misericordia final.',
        outcomes: [{ text: 'Te agradece el gesto y te pide que le dejes munición al alcance.', effects: [{ kind: 'morale', amount: 3 }] }],
      },
    ],
  },
  {
    id: 'railgun-parts',
    title: 'Piezas de Prototipo',
    text: 'Cajas marcadas por la ingeniería del Cóndor Negro: planos de una bobina eléctrica gigante que nunca se terminó.',
    options: [
      {
        id: 'engineer-it', label: 'Que el Mecánico lo estudie', hint: 'Mejora del taller de chatarra.',
        outcomes: [{ text: 'La mitad es locura oculta; la otra mitad es chasis y alambres de cobre útiles.', effects: [{ kind: 'gain-upgrade', buildingId: 'engineering-bay' }] }],
      },
      {
        id: 'scrap', label: 'Desguazar para repuestos', hint: 'Suministros directos.',
        outcomes: [{ text: 'El cobre y las baterías sirven para las barricadas del frente.', effects: [{ kind: 'supplies', amount: 35 }] }],
      },
    ],
  },
  {
    id: 'war-dog-kennel',
    title: 'El Canil de Frontera',
    text: 'Un refugio canino abandonado en las afueras del hotel. La mayoría de las jaulas rotas, pero queda un ovejero agitando la cola.',
    options: [
      {
        id: 'adopt', label: 'Adoptar al ovejero', hint: 'Mascota. Beneficio permanente de moral.',
        outcomes: [{ text: 'El sargento "Mate" se reporta al servicio. Su presencia reconforta a la tropa.', effects: [{ kind: 'morale', amount: 6 }, { kind: 'flag', id: 'mascot' }] }],
      },
      {
        id: 'release', label: 'Soltar a los perros', hint: 'Cazarán infectados en el perímetro.',
        outcomes: [{ text: 'Aullidos en el monte por la noche. Al amanecer, menos zombis acechan la zona.', effects: [{ kind: 'reduce-waves', amount: 1 }] }],
      },
    ],
  },
  {
    id: 'colonels-letter',
    title: 'Carta del Viejo Coronel',
    text: 'Una carta lacrada dirigida a "quien sea que siga sosteniendo el frente". Lleva el escudo de la vieja guardia.',
    options: [
      {
        id: 'read-aloud', label: 'Leerla a viva voz', hint: 'Gran aumento de moral.',
        outcomes: [{ text: '"...y si están leyendo esto, es porque la estepa resistió. Defiendan la patria una vez más". Silencio respetuoso de la tropa.', effects: [{ kind: 'morale', amount: 15 }] }],
      },
      {
        id: 'keep-sealed', label: 'Enviarla sin abrir al cuartel', hint: 'Poca inteligencia.',
        outcomes: [{ text: 'Algunas palabras pertenecen al archivo histórico y de inteligencia.', effects: [{ kind: 'intel', amount: 1 }, { kind: 'morale', amount: 2 }] }],
      },
    ],
  },
  {
    id: 'quartermasters-gamble',
    title: 'La Apuesta del Intendente',
    text: 'El intendente te propone un truco doble o nada por una caja de pertrechos de la reserva.',
    options: [
      {
        id: 'gamble', label: 'Aceptar el truco', hint: '50/50: +60 o -30 suministros.',
        outcomes: [
          { chance: 0.5, text: 'Le ganás con un ancho de espadas falso. Paga con cara de póker.', effects: [{ kind: 'supplies', amount: 60 }] },
          { chance: 0.5, text: 'Te mete un flor de tres a la primera mano y te confisca parte de los víveres.', effects: [{ kind: 'supplies', amount: -30 }] },
        ],
      },
      {
        id: 'decline', label: 'Rechazar amablemente', hint: 'Un pequeño beneficio garantizado.',
        outcomes: [{ text: 'Respeta a un oficial prudente. Te convida un amargo y un cajón pequeño.', effects: [{ kind: 'supplies', amount: 10 }] }],
      },
    ],
  },
];

export const EVENT_INDEX: Record<string, EventDef> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e]),
);
