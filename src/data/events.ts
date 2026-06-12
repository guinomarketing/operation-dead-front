import type { EventDef } from '../types/EventTypes';

/**
 * 25 eventos narrativos. Tono: pulp bélico sobrenatural, decisiones con costo.
 * Reglas: 2-3 opciones, chances de una opción suman ~1, 'hidden' = sorpresa.
 */
export const EVENTS: EventDef[] = [
  {
    id: 'abandoned-bunker',
    title: 'Abandoned Bunker',
    text: 'A sealed Reich bunker. Crates of experimental weapons inside — and claw marks on the inside of the door.',
    options: [
      {
        id: 'claim', label: 'Claim the weapons', hint: 'Damage boost… probably.',
        outcomes: [
          { chance: 0.7, text: 'Clean haul. Your squads load up.', effects: [{ kind: 'run-modifier', modifier: { stat: 'damage', op: 'mul', value: 1.1, filter: { side: 'ally' } }, duration: 'run' }] },
          { chance: 0.3, text: 'The crates were bait. Something followed you out.', hidden: true, effects: [{ kind: 'run-modifier', modifier: { stat: 'damage', op: 'mul', value: 1.1, filter: { side: 'ally' } }, duration: 'run' }, { kind: 'spawn-threat', enemyId: 'rot-hound', count: 3 }] },
        ],
      },
      {
        id: 'destroy', label: 'Blow it up', hint: 'Safe. Intel and morale.',
        outcomes: [{ text: 'The blast echoes for miles. Your men cheer.', effects: [{ kind: 'intel', amount: 2 }, { kind: 'morale', amount: 5 }] }],
      },
      {
        id: 'study', label: 'Study the tech', hint: 'Gamble: relic or wasted time.',
        outcomes: [
          { chance: 0.5, text: 'Among the junk: something genuinely useful.', effects: [{ kind: 'gain-relic' }] },
          { chance: 0.5, text: 'Hours lost on scrap. Supplies wasted on transport.', effects: [{ kind: 'supplies', amount: -20 }] },
        ],
      },
    ],
  },
  {
    id: 'infected-soldier',
    title: 'The Infected Soldier',
    text: 'Private Hayes hides a serum bite under his sleeve. The medic gives him hours, maybe less.',
    options: [
      {
        id: 'sacrifice', label: 'Give him a soldier\'s end', hint: 'Hard on morale. The men remember.',
        outcomes: [{ text: 'One shot at dawn. His tags go in the ledger; his notes go to Intel.', effects: [{ kind: 'morale', amount: -10 }, { kind: 'intel', amount: 2 }] }],
      },
      {
        id: 'cure', label: 'Attempt the experimental cure', hint: 'Risky. Could inspire everyone.',
        outcomes: [
          { chance: 0.55, text: 'Hayes pulls through. The whole company fights harder knowing it.', effects: [{ kind: 'morale', amount: 8 }, { kind: 'run-modifier', modifier: { stat: 'maxHp', op: 'mul', value: 1.05, filter: { side: 'ally' } }, duration: 'run' }] },
          { chance: 0.45, text: 'The cure fails. What gets up isn\'t Hayes anymore.', hidden: true, effects: [{ kind: 'spawn-threat', enemyId: 'shielded-revenant', count: 1 }] },
        ],
      },
      {
        id: 'bait', label: 'Use him as bait', hint: 'Cruel but tactical.',
        outcomes: [{ text: 'The horde slows to feed. Your men won\'t look you in the eye.', effects: [{ kind: 'run-modifier', modifier: { stat: 'moveSpeed', op: 'mul', value: 0.85, filter: { side: 'enemy' } }, duration: 'next-battle' }, { kind: 'morale', amount: -6 }] }],
      },
    ],
  },
  {
    id: 'enemy-radio',
    title: 'Enemy Radio',
    text: 'A working Reich transmitter, still humming with coded traffic.',
    options: [
      {
        id: 'listen', label: 'Decode the traffic', hint: 'Knowledge is ammunition.',
        outcomes: [{ text: 'Patrol routes, supply lines, names. All noted.', effects: [{ kind: 'intel', amount: 3 }, { kind: 'reveal-next-event' }] }],
      },
      {
        id: 'false-signal', label: 'Broadcast a false signal', hint: 'Gamble: thin their next push — or anger it.',
        outcomes: [
          { chance: 0.7, text: 'They take the bait and split their forces.', effects: [{ kind: 'reduce-waves', amount: 1 }] },
          { chance: 0.3, text: 'They trace the signal. They\'re coming heavier.', hidden: true, effects: [{ kind: 'spawn-threat', enemyId: 'revenant-grunt', count: 4 }] },
        ],
      },
    ],
  },
  {
    id: 'hidden-civilians',
    title: 'Hidden Civilians',
    text: 'A cellar full of survivors. They have food, water — and nowhere to go.',
    options: [
      {
        id: 'escort', label: 'Escort them out', hint: 'Costs supplies. The right thing.',
        outcomes: [{ text: 'They make it. Your men walk taller for days.', effects: [{ kind: 'supplies', amount: -25 }, { kind: 'morale', amount: 12 }] }],
      },
      {
        id: 'requisition', label: 'Requisition their stores', hint: 'Supplies now, shame later.',
        outcomes: [{ text: 'War has a price. Today, they paid it.', effects: [{ kind: 'supplies', amount: 40 }, { kind: 'morale', amount: -8 }, { kind: 'flag', id: 'ruthless' }] }],
      },
      {
        id: 'fortify', label: 'Arm them and move on', hint: 'Small cost, small comfort.',
        outcomes: [{ text: 'You leave rifles and a prayer.', effects: [{ kind: 'supplies', amount: -10 }, { kind: 'morale', amount: 4 }] }],
      },
    ],
  },
  {
    id: 'occult-laboratory',
    title: 'Occult Laboratory',
    text: 'Sigils on the walls, serum vats on the floor. The Umbra Project worked here.',
    options: [
      {
        id: 'burn', label: 'Burn it all', hint: 'Cleansing. Removes a mutation.',
        outcomes: [{ text: 'The green fire burns black, then dies. The air feels lighter.', effects: [{ kind: 'morale', amount: 8 }, { kind: 'remove-mutation' }] }],
      },
      {
        id: 'loot-notes', label: 'Take the research', hint: 'Intel, with a contamination risk.',
        outcomes: [
          { chance: 0.65, text: 'The notes are gold. Doctor Totenkopf\'s own hand.', effects: [{ kind: 'intel', amount: 4 }] },
          { chance: 0.35, text: 'Something in the ink. The dead march stranger now.', hidden: true, effects: [{ kind: 'intel', amount: 4 }, { kind: 'add-mutation' }] },
        ],
      },
      {
        id: 'test-serum', label: 'Test a serum sample', hint: 'Coin flip on your soldiers\' flesh.',
        outcomes: [
          { chance: 0.5, text: 'Diluted, it hardens skin like leather.', effects: [{ kind: 'run-modifier', modifier: { stat: 'maxHp', op: 'mul', value: 1.1, filter: { side: 'ally' } }, duration: 'run' }] },
          { chance: 0.5, text: 'The volunteer doesn\'t die. He just stops being useful.', effects: [{ kind: 'morale', amount: -8 }, { kind: 'disable-unit-next-battle', random: true }] },
        ],
      },
    ],
  },
  {
    id: 'supply-train',
    title: 'Stranded Supply Train',
    text: 'A derailed Reich train. Cargo intact. The escort, less so — but not gone.',
    options: [
      {
        id: 'raid-fast', label: 'Smash and grab', hint: 'Quick supplies, light resistance.',
        outcomes: [{ text: 'In and out before the dead reorganize.', effects: [{ kind: 'supplies', amount: 35 }] }],
      },
      {
        id: 'raid-thorough', label: 'Strip it to the bolts', hint: 'Big haul, but they\'ll notice.',
        outcomes: [
          { chance: 0.6, text: 'Everything that wasn\'t welded down is yours.', effects: [{ kind: 'supplies', amount: 60 }, { kind: 'gain-upgrade', buildingId: 'armory' }] },
          { chance: 0.4, text: 'The escort returns mid-loot.', hidden: true, effects: [{ kind: 'supplies', amount: 60 }, { kind: 'spawn-threat', enemyId: 'shielded-revenant', count: 2 }] },
        ],
      },
    ],
  },
  {
    id: 'military-cemetery',
    title: 'Military Cemetery',
    text: 'Rows of crosses from the last war. Some graves are open. From the inside.',
    options: [
      {
        id: 'honor', label: 'Pay respects', hint: 'Morale. The dead appreciate manners.',
        outcomes: [{ text: 'A minute of silence buys a week of courage.', effects: [{ kind: 'morale', amount: 10 }] }],
      },
      {
        id: 'salvage', label: 'Salvage equipment', hint: 'Supplies, at the cost of decency.',
        outcomes: [
          { chance: 0.7, text: 'Old gear, still serviceable.', effects: [{ kind: 'supplies', amount: 30 }, { kind: 'morale', amount: -4 }] },
          { chance: 0.3, text: 'The graves answer back.', hidden: true, effects: [{ kind: 'supplies', amount: 30 }, { kind: 'spawn-threat', enemyId: 'revenant-grunt', count: 5 }] },
        ],
      },
    ],
  },
  {
    id: 'minefield',
    title: 'The Minefield',
    text: 'Your shortcut runs through a Reich minefield. The long way costs a day of rations.',
    options: [
      {
        id: 'rush', label: 'Cross it fast', hint: 'Risk casualties, save supplies.',
        outcomes: [
          { chance: 0.5, text: 'Light feet, held breath. Everyone makes it.', effects: [{ kind: 'morale', amount: 6 }] },
          { chance: 0.5, text: 'One wrong step. The blast shakes the column.', effects: [{ kind: 'base-hp', amount: -8 }, { kind: 'morale', amount: -5 }] },
        ],
      },
      {
        id: 'around', label: 'Go around', hint: 'Safe, slow, expensive.',
        outcomes: [{ text: 'A long, boring, beautiful detour.', effects: [{ kind: 'supplies', amount: -20 }] }],
      },
      {
        id: 'clear', label: 'Clear a path', requiresUnitId: 'engineer', hint: 'Engineers earn their pay.',
        outcomes: [{ text: 'Your engineers lift enough mines to arm a welcome party.', effects: [{ kind: 'morale', amount: 4 }, { kind: 'run-modifier', modifier: { stat: 'damage', op: 'mul', value: 1.15, filter: { side: 'ally' } }, duration: 'next-battle' }] }],
      },
    ],
  },
  {
    id: 'captured-officer',
    title: 'Captured Officer',
    text: 'A living Reich collaborator, caught feeding the dead coordinates. He offers to talk.',
    options: [
      {
        id: 'interrogate', label: 'Interrogate him', hint: 'Intel. Takes time.',
        outcomes: [{ text: 'He sings. Names, routes, the works.', effects: [{ kind: 'intel', amount: 3 }, { kind: 'reveal-next-event' }] }],
      },
      {
        id: 'execute', label: 'Field tribunal', hint: 'Justice. The men approve.',
        outcomes: [{ text: 'Short trial. Shorter sentence.', effects: [{ kind: 'morale', amount: 7 }] }],
      },
      {
        id: 'trade', label: 'Trade him to partisans', hint: 'They pay in supplies.',
        outcomes: [{ text: 'The partisans have their own questions for him.', effects: [{ kind: 'supplies', amount: 35 }] }],
      },
    ],
  },
  {
    id: 'incomplete-map',
    title: 'The Incomplete Map',
    text: 'A dead courier clutches a map of the sector. Half of it is burned away.',
    options: [
      {
        id: 'trust', label: 'Follow the map', hint: 'Could reveal the route. Could be a trap.',
        outcomes: [
          { chance: 0.65, text: 'The surviving half is accurate. The front opens up before you.', effects: [{ kind: 'reveal-map' }] },
          { chance: 0.35, text: 'The burned half hid a warning.', hidden: true, effects: [{ kind: 'spawn-threat', enemyId: 'dead-officer', count: 1 }] },
        ],
      },
      {
        id: 'sell', label: 'Sell it to the quartermaster', hint: 'Guaranteed supplies.',
        outcomes: [{ text: 'He pays well for paper with coordinates on it.', effects: [{ kind: 'supplies', amount: 25 }] }],
      },
    ],
  },
  {
    id: 'the-deserter',
    title: 'The Deserter',
    text: 'A soldier from a shattered company wants in. His rifle is clean. His story isn\'t.',
    options: [
      {
        id: 'recruit', label: 'Take him in', hint: 'Manpower with a question mark.',
        outcomes: [
          { chance: 0.7, text: 'He fights like a man with something to prove.', effects: [{ kind: 'morale', amount: 4 }, { kind: 'run-modifier', modifier: { stat: 'deployCooldown', op: 'mul', value: 0.9, filter: { unitIds: ['rifleman'] } }, duration: 'run' }] },
          { chance: 0.3, text: 'He vanishes on the second night. With a crate.', hidden: true, effects: [{ kind: 'supplies', amount: -25 }, { kind: 'morale', amount: -4 }] },
        ],
      },
      {
        id: 'turn-away', label: 'Send him off armed', hint: 'Cheap mercy.',
        outcomes: [{ text: 'He nods once and walks into the gray.', effects: [{ kind: 'morale', amount: 2 }] }],
      },
    ],
  },
  {
    id: 'field-hospital',
    title: 'Field Hospital',
    text: 'An allied field hospital, overworked and underdefended. The chief surgeon offers a deal.',
    options: [
      {
        id: 'leave-wounded', label: 'Leave your wounded here', hint: 'Restores the base\'s strength.',
        outcomes: [{ text: 'Clean beds and real anesthesia. Your column moves lighter.', effects: [{ kind: 'base-hp', amount: 15 }] }],
      },
      {
        id: 'donate', label: 'Donate medical supplies', hint: 'Costs supplies. They remember.',
        outcomes: [{ text: 'The surgeon promises a favor. Surgeons keep ledgers too.', effects: [{ kind: 'supplies', amount: -20 }, { kind: 'morale', amount: 6 }, { kind: 'gain-upgrade', buildingId: 'med-tent' }] }],
      },
    ],
  },
  {
    id: 'ammo-cache',
    title: 'Ammo Cache',
    text: 'Allied markings on a buried cache. Whoever hid it isn\'t coming back.',
    options: [
      {
        id: 'take-supplies', label: 'Take it all', hint: 'Straight supplies.',
        outcomes: [{ text: 'Crates of clean brass. Christmas in the trenches.', effects: [{ kind: 'supplies', amount: 45 }] }],
      },
      {
        id: 'outfit', label: 'Outfit your best squads', hint: 'Armory upgrade instead.',
        outcomes: [{ text: 'Specialist rounds, distributed to those who\'ll use them.', effects: [{ kind: 'gain-upgrade', buildingId: 'armory' }] }],
      },
    ],
  },
  {
    id: 'the-old-chapel',
    title: 'The Old Chapel',
    text: 'A chapel untouched by the war. The candles are lit. Nobody is inside.',
    options: [
      {
        id: 'pray', label: 'Let the men pray', hint: 'Morale and protection.',
        outcomes: [{ text: 'Whatever listens here, it listens kindly.', effects: [{ kind: 'morale', amount: 10 }, { kind: 'run-modifier', modifier: { stat: 'moraleLossMult', op: 'mul', value: 0.8 }, duration: 'next-battle' }] }],
      },
      {
        id: 'search-crypt', label: 'Search the crypt', hint: 'Relics live in crypts. So do other things.',
        outcomes: [
          { chance: 0.6, text: 'Beneath the altar: something old and blessed.', effects: [{ kind: 'gain-relic' }] },
          { chance: 0.4, text: 'The crypt was sealed for a reason.', hidden: true, effects: [{ kind: 'spawn-threat', enemyId: 'occultist', count: 1 }, { kind: 'morale', amount: -4 }] },
        ],
      },
    ],
  },
  {
    id: 'crashed-bomber',
    title: 'Crashed Bomber',
    text: 'One of ours, nose-down in a field. The radio still works. So does the payload.',
    options: [
      {
        id: 'salvage-radio', label: 'Salvage the radio', hint: 'Call in a free airstrike next battle.',
        outcomes: [{ text: 'You raise HQ on the third try. They owe this crew a favor.', effects: [{ kind: 'ability-charge', abilityId: 'airstrike' }] }],
      },
      {
        id: 'salvage-parts', label: 'Strip it for parts', hint: 'Supplies and engineering scrap.',
        outcomes: [{ text: 'Aluminum, fuel, instruments. All of it useful.', effects: [{ kind: 'supplies', amount: 30 }, { kind: 'intel', amount: 1 }] }],
      },
    ],
  },
  {
    id: 'black-market-trader',
    title: 'Black Market Trader',
    text: 'A trader with a cart full of miracles and a smile full of teeth. Cash only.',
    options: [
      {
        id: 'buy-relic', label: 'Buy the "special item"', hint: '-30 supplies for a relic.',
        outcomes: [{ text: 'It\'s real. Probably stolen, definitely useful.', effects: [{ kind: 'supplies', amount: -30 }, { kind: 'gain-relic' }] }],
      },
      {
        id: 'rob', label: 'Rob him', hint: 'Free supplies — or a curse.',
        outcomes: [
          { chance: 0.6, text: 'He surrenders the cart with suspicious grace.', effects: [{ kind: 'supplies', amount: 40 }, { kind: 'morale', amount: -5 }] },
          { chance: 0.4, text: 'His goods spoil to ash in your hands. His smile doesn\'t fade.', hidden: true, effects: [{ kind: 'morale', amount: -8 }, { kind: 'disable-unit-next-battle', random: true }] },
        ],
      },
      {
        id: 'walk-away', label: 'Walk away', hint: 'Some deals smell wrong.',
        outcomes: [{ text: 'You keep your supplies and your soul.', effects: [{ kind: 'morale', amount: 2 }] }],
      },
    ],
  },
  {
    id: 'storm-front',
    title: 'Storm Front',
    text: 'A black storm rolls over the sector. The dead don\'t mind the rain. Your men do.',
    options: [
      {
        id: 'push-through', label: 'March through it', hint: 'Save time, arrive soaked and hard.',
        outcomes: [{ text: 'Miserable, fast, unforgettable.', effects: [{ kind: 'morale', amount: -4 }, { kind: 'supplies', amount: 20 }, { kind: 'run-modifier', modifier: { stat: 'moveSpeed', op: 'mul', value: 1.1, filter: { side: 'ally' } }, duration: 'next-battle' }] }],
      },
      {
        id: 'wait', label: 'Wait it out', hint: 'Costs supplies, rests the men.',
        outcomes: [{ text: 'Card games, hot food, dry socks. Worth every crate.', effects: [{ kind: 'supplies', amount: -15 }, { kind: 'morale', amount: 8 }] }],
      },
    ],
  },
  {
    id: 'propaganda-tower',
    title: 'Propaganda Tower',
    text: 'A Reich loudspeaker tower drones a dead man\'s speech on loop. Your men hear it in their sleep.',
    options: [
      {
        id: 'demolish', label: 'Demolish it', hint: 'Loud. They\'ll know.',
        outcomes: [
          { chance: 0.7, text: 'The silence afterwards is the best sound of the war.', effects: [{ kind: 'morale', amount: 10 }] },
          { chance: 0.3, text: 'The crash draws every corpse in the valley.', hidden: true, effects: [{ kind: 'morale', amount: 10 }, { kind: 'spawn-threat', enemyId: 'runner-corpse', count: 4 }] },
        ],
      },
      {
        id: 'hijack', label: 'Hijack the broadcast', hint: 'Costs intel. Demoralizes the front.',
        outcomes: [{ text: 'Your counter-broadcast confuses their officers\' rites.', effects: [{ kind: 'intel', amount: -2 }, { kind: 'reduce-waves', amount: 1 }, { kind: 'morale', amount: 5 }] }],
      },
    ],
  },
  {
    id: 'mass-grave',
    title: 'The Mass Grave',
    text: 'A pit of the unburied dead. The ground hums like a held breath.',
    options: [
      {
        id: 'consecrate', label: 'Consecrate the ground', hint: 'Quiets the dead.',
        outcomes: [{ text: 'The humming stops. The air forgives.', effects: [{ kind: 'morale', amount: 8 }, { kind: 'remove-mutation', mutationId: 'grave-discipline' }] }],
      },
      {
        id: 'search-tags', label: 'Search for dog tags', hint: 'Intel from the fallen. Risky digging.',
        outcomes: [
          { chance: 0.6, text: 'Names and unit numbers. The ledger grows.', effects: [{ kind: 'intel', amount: 3 }] },
          { chance: 0.4, text: 'The pit was waiting for visitors.', hidden: true, effects: [{ kind: 'intel', amount: 3 }, { kind: 'spawn-threat', enemyId: 'revenant-grunt', count: 6 }] },
        ],
      },
    ],
  },
  {
    id: 'lost-patrol',
    title: 'The Lost Patrol',
    text: 'Gunfire to the east. An allied patrol is pinned, half a klick into bad ground.',
    options: [
      {
        id: 'rescue', label: 'Go get them', hint: 'Could gain a heavy weapons team.',
        outcomes: [
          { chance: 0.65, text: 'You pull them out. Their gunner joins your roster.', effects: [{ kind: 'unlock-unit', unitId: 'heavy-gunner' }, { kind: 'morale', amount: 6 }] },
          { chance: 0.35, text: 'You arrive in time for the ambush meant for them.', effects: [{ kind: 'base-hp', amount: -10 }, { kind: 'morale', amount: -4 }] },
        ],
      },
      {
        id: 'mark', label: 'Mark their position for HQ', hint: 'Safe intel.',
        outcomes: [{ text: 'Someone else\'s rescue, someone else\'s medal.', effects: [{ kind: 'intel', amount: 2 }] }],
      },
    ],
  },
  {
    id: 'wounded-sniper',
    title: 'The Wounded Sniper',
    text: 'A marksman from a dissolved battalion, leg wrecked, rifle immaculate. "Patch me up and I\'m yours."',
    options: [
      {
        id: 'patch-up', label: 'Spend supplies on surgery', hint: '-20 supplies. Gain a sniper.',
        outcomes: [{ text: 'Two weeks of healing crammed into one night. She shoots better angry.', effects: [{ kind: 'supplies', amount: -20 }, { kind: 'unlock-unit', unitId: 'sniper' }] }],
      },
      {
        id: 'morphine', label: 'Ease her pain and move on', hint: 'Kind, cheap, final.',
        outcomes: [{ text: 'She thanks you and asks you to leave the rifle within reach.', effects: [{ kind: 'morale', amount: 3 }] }],
      },
    ],
  },
  {
    id: 'railgun-parts',
    title: 'Railgun Parts',
    text: 'Crates stenciled with Reich engineering marks: components of something big that never got built.',
    options: [
      {
        id: 'engineer-it', label: 'Have the engineers study it', hint: 'Engineering upgrade.',
        outcomes: [{ text: 'Half of it is nonsense. The other half is genius.', effects: [{ kind: 'gain-upgrade', buildingId: 'engineering-bay' }] }],
      },
      {
        id: 'scrap', label: 'Scrap it for parts', hint: 'Straight supplies.',
        outcomes: [{ text: 'Genius melts down the same as nonsense.', effects: [{ kind: 'supplies', amount: 35 }] }],
      },
    ],
  },
  {
    id: 'war-dog-kennel',
    title: 'The Kennel',
    text: 'An abandoned K9 kennel. Most cages empty. One occupant left, wagging.',
    options: [
      {
        id: 'adopt', label: 'Adopt the dog', hint: 'Mascot. Permanent morale perk.',
        outcomes: [{ text: 'Private Biscuit reports for duty. Effective immediately.', effects: [{ kind: 'morale', amount: 6 }, { kind: 'flag', id: 'mascot' }] }],
      },
      {
        id: 'release', label: 'Release the dogs of war', hint: 'They hunt the dead tonight.',
        outcomes: [{ text: 'Howls in the dark. By morning, fewer shamblers.', effects: [{ kind: 'reduce-waves', amount: 1 }] }],
      },
    ],
  },
  {
    id: 'colonels-letter',
    title: 'The Colonel\'s Letter',
    text: 'A sealed letter addressed to "whoever is still fighting". The wax bears the old army crest.',
    options: [
      {
        id: 'read-aloud', label: 'Read it to the company', hint: 'Big morale.',
        outcomes: [{ text: '"…and if you are reading this, then the line held. Hold it again." Nobody speaks for a minute.', effects: [{ kind: 'morale', amount: 15 }] }],
      },
      {
        id: 'keep-sealed', label: 'Deliver it sealed to HQ', hint: 'Small intel.',
        outcomes: [{ text: 'Some words belong to their addressee.', effects: [{ kind: 'intel', amount: 1 }, { kind: 'morale', amount: 2 }] }],
      },
    ],
  },
  {
    id: 'quartermasters-gamble',
    title: 'Quartermaster\'s Gamble',
    text: 'The quartermaster offers double-or-nothing on your next requisition. He shuffles cards while he talks.',
    options: [
      {
        id: 'gamble', label: 'Take the bet', hint: '50/50: +60 or -30 supplies.',
        outcomes: [
          { chance: 0.5, text: 'He pays up with the face of a man who planned to.', effects: [{ kind: 'supplies', amount: 60 }] },
          { chance: 0.5, text: 'The house always wins. He IS the house.', effects: [{ kind: 'supplies', amount: -30 }] },
        ],
      },
      {
        id: 'decline', label: 'Decline politely', hint: 'Small guaranteed cut.',
        outcomes: [{ text: 'He respects a careful officer. Tosses you a crate anyway.', effects: [{ kind: 'supplies', amount: 10 }] }],
      },
    ],
  },
];

export const EVENT_INDEX: Record<string, EventDef> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e]),
);
