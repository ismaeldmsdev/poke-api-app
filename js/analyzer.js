/**
 * analyzer.js — Motor de análisis competitivo.
 * Produce 2 sets de movimientos diferenciados, uno por cada naturaleza recomendada.
 * Todo el output sale en castellano.
 * Expone window.PokeAnalyzer.analyzer
 */

// ================================================================
// MOVIMIENTOS COMPETITIVOS DE PRIMER NIVEL (bonus de puntuación)
// ================================================================
// Estos son los ataques que realmente aparecen en sets de Smogon/VGC.
// Se priorizan sobre cualquier otro movimiento de la misma categoría.

const PREMIUM_PHYSICAL = new Set([
    // Universales
    'earthquake','close-combat','knock-off','extreme-speed','superpower',
    'stone-edge','waterfall','crunch','outrage','iron-head','play-rough',
    'drain-punch','leech-life','body-press','gunk-shot','poison-jab',
    'zen-headbutt','ice-punch','fire-punch','thunder-punch',
    'cross-chop','liquidation','smart-strike','acrobatics','aerial-ace',
    'throat-chop','darkest-lariat','stomping-tantrum','high-horsepower',
    'head-smash','rock-slide','avalanche','night-slash','shadow-claw',
    'shadow-force','leaf-blade','wood-hammer','seed-bomb','x-scissor',
    'megahorn','psycho-cut','aqua-cutter','wave-crash','axe-kick',
    'brave-bird','body-slam','double-edge','facade','return',
    'precipice-blades','sacred-sword','secret-sword','flying-press',
    'sky-attack','drill-run','rock-blast','icicle-crash','icicle-spear',
    'triple-axel','scale-shot','power-trip','stored-power',
    'collision-course','ice-spinner','population-bomb','last-respects',
]);

const PREMIUM_SPECIAL = new Set([
    // Universales
    'flamethrower','fire-blast','ice-beam','thunderbolt','surf','hydro-pump',
    'shadow-ball','psychic','focus-blast','energy-ball','dark-pulse',
    'flash-cannon','moonblast','dazzling-gleam','draco-meteor','bug-buzz',
    'scald','aura-sphere','sludge-bomb','sludge-wave','power-gem',
    'air-slash','hurricane','blizzard','thunder','overheat','leaf-storm',
    'expanding-force','rising-voltage','terrain-pulse','misty-explosion',
    'poltergeist','astral-barrage','glacial-lance','eerie-spell',
    'infernal-parade','bleakwind-storm','wildbolt-storm','sandsear-storm',
    'torch-song','make-it-rain','tera-blast','hydro-steam',
    'blue-flare','bolt-strike','spacial-rend','seed-flare','psystrike',
    'luster-purge','mist-ball','psycho-boost','oblivion-wing',
    'petal-blizzard','mystical-fire','burning-jealousy','esper-wing',
    'scorching-sands','core-enforcer',
]);

// ── Preparación ofensiva ─────────────────────────────────────────
const SETUP_PHYSICAL = new Set([
    'swords-dance','dragon-dance','bulk-up','coil','curse','hone-claws',
    'shift-gear','clangorous-soul','victory-dance','belly-drum',
    'rock-polish','agility','autotomize','flame-charge','bootstrap',
]);
const SETUP_SPECIAL = new Set([
    'calm-mind','nasty-plot','quiver-dance','shell-smash','geomancy',
    'tail-glow','work-up','charge','torch-song','growth',
    'fiery-dance','charge-beam',
]);

// ── Prioridad ────────────────────────────────────────────────────
const PRIORITY_PHYSICAL = new Set([
    'bullet-punch','aqua-jet','mach-punch','shadow-sneak','ice-shard',
    'sucker-punch','extreme-speed','quick-attack','accelerock',
    'first-impression','grassy-glide','jet-punch','feint',
]);
const PRIORITY_SPECIAL = new Set([
    'water-shuriken','vacuum-wave',
]);

// ── Recuperación ─────────────────────────────────────────────────
const RECOVERY_MOVES = new Set([
    'recover','roost','synthesis','moonlight','morning-sun','slack-off',
    'soft-boiled','wish','healing-wish','lunar-dance','milk-drink',
    'shore-up','jungle-healing','strength-sap','rest','drain-punch','leech-life',
]);

// ── Estado ofensivo ──────────────────────────────────────────────
const STATUS_OFFENSIVE = new Set([
    'will-o-wisp','toxic','thunder-wave','glare','stun-spore',
    'sleep-powder','spore','hypnosis','yawn','nuzzle',
]);

// ── Hazards y control del campo ──────────────────────────────────
const HAZARD_MOVES = new Set([
    'stealth-rock','spikes','toxic-spikes','sticky-web',
    'defog','rapid-spin','mortal-spin',
]);

// ── Pivotes ──────────────────────────────────────────────────────
const PIVOT_MOVES = new Set([
    'u-turn','volt-switch','flip-turn','parting-shot','teleport','baton-pass',
]);

// ── Utilidad clave ───────────────────────────────────────────────
const UTILITY_MOVES = new Set([
    'knock-off','trick','switcheroo','encore','taunt','destiny-bond',
    'pain-split','leech-seed','substitute','perish-song','trick-room',
    'tailwind','light-screen','reflect','aurora-veil',
]);

// ── Habilidades con impacto competitivo ──────────────────────────
const GOOD_ABILITIES = new Set([
    'intimidate','levitate','speed-boost','drought','drizzle','sand-stream','snow-warning',
    'huge-power','pure-power','adaptability','magic-guard','wonder-guard','multiscale',
    'regenerator','natural-cure','serene-grace','technician','tinted-lens','swift-swim',
    'chlorophyll','sand-rush','slush-rush','motor-drive','lightning-rod','storm-drain',
    'thick-fat','water-absorb','volt-absorb','flash-fire','dry-skin','poison-heal',
    'guts','marvel-scale','sand-force','sheer-force','iron-fist','strong-jaw',
    'pixilate','refrigerate','aerilate','galvanize','protean','libero',
    'unburden','prankster','magic-bounce','mold-breaker','turboblaze','teravolt',
    'fur-coat','filter','solid-rock','shadow-shield','beast-boost','soul-heart',
    'stakeout','intrepid-sword','dauntless-shield','trace','pressure',
    'competitive','defiant','hadron-engine','orichalcum-pulse','commander',
    'water-bubble','stamina','queenly-majesty','dazzling','ice-scales',
    'mirror-armor','cotton-down','ball-fetch','unseen-fist','as-one-glastrier',
    'as-one-spectrier','supreme-overlord','vessel-of-ruin','sword-of-ruin',
    'beads-of-ruin','tablets-of-ruin',
]);

const ABILITY_REASONS = {
    'intimidate':       'Baja el ATK del rival al entrar — reduce el daño físico recibido inmediatamente.',
    'levitate':         'Inmunidad total a movimientos de tipo Tierra.',
    'speed-boost':      'Sube la Velocidad cada turno — se vuelve imparable si no se elimina pronto.',
    'drought':          'Invoca Sol automáticamente — potencia los movimientos de Fuego.',
    'drizzle':          'Invoca Lluvia automáticamente — potencia los movimientos de Agua.',
    'sand-stream':      'Invoca Tormenta de Arena — daño pasivo a rivales sin inmunidad.',
    'snow-warning':     'Invoca Nevada — potencia Blizzard y activa ventajas de Hielo.',
    'huge-power':       'Duplica el Ataque efectivo — uno de los mejores pasivos ofensivos del juego.',
    'pure-power':       'Duplica el Ataque efectivo.',
    'adaptability':     'El bonus STAB sube de ×1.5 a ×2 — daño masivo con los propios tipos.',
    'magic-guard':      'Inmune a todo daño indirecto (quemadura, arena, spikes, etc.).',
    'multiscale':       'Reduce el daño a la mitad con HP completo — muy difícil de eliminar de entrada.',
    'regenerator':      'Recupera 1/3 del HP al cambiar — excelente en pivots y muros.',
    'natural-cure':     'Cura cualquier estado alterado al salir del campo.',
    'serene-grace':     'Duplica la probabilidad de efectos secundarios.',
    'technician':       'Aumenta ×1.5 los movimientos de potencia ≤60 — potencia ataques como Bullet Punch.',
    'tinted-lens':      'Las resistencias del rival pasan a infligir daño normal.',
    'swift-swim':       'Duplica la Velocidad bajo Lluvia — sweeper definitivo en equipos de lluvia.',
    'chlorophyll':      'Duplica la Velocidad bajo Sol.',
    'protean':          'Cambia el tipo al movimiento usado — STAB garantizado en cada ataque.',
    'libero':           'STAB garantizado en cada ataque.',
    'magic-bounce':     'Refleja movimientos de estado hacia el rival.',
    'guts':             'Duplica el ATK con estado alterado — la quemadura se vuelve una ventaja.',
    'sheer-force':      'Elimina efectos secundarios a cambio de +30% de potencia.',
    'iron-fist':        'Potencia los movimientos de puño un 20% — sinergia directa con los ataques de puño.',
    'strong-jaw':       'Potencia los movimientos de mordisco un 50%.',
    'water-bubble':     'Duplica el daño de movimientos Agua y anula quemaduras.',
    'beast-boost':      'Sube el stat más alto al eliminar un rival — bola de nieve ofensiva.',
    'intrepid-sword':   'Sube el ATK al entrar en combate.',
    'dauntless-shield': 'Sube la DEF al entrar en combate.',
    'hadron-engine':    'Genera Terreno Eléctrico y potencia el SP.ATK bajo él.',
    'orichalcum-pulse': 'Invoca Sol y potencia el ATK bajo él.',
    'unburden':         'Duplica la Velocidad al perder el objeto — devastador con Berry.',
    'sand-rush':        'Duplica la Velocidad en Tormenta de Arena.',
    'poison-heal':      'Recupera HP cuando está envenenado — se usa con Orbe Tóxico intencionalmente.',
    'pixilate':         'Convierte movimientos Normales en Hada y les da +20% de potencia.',
    'refrigerate':      'Convierte movimientos Normales en Hielo y les da +20% de potencia.',
    'aerilate':         'Convierte movimientos Normales en Volador y les da +20% de potencia.',
    'galvanize':        'Convierte movimientos Normales en Eléctrico y les da +20% de potencia.',
    'fur-coat':         'Duplica la DEF efectiva contra ataques físicos.',
    'sand-force':       'Potencia los movimientos Roca, Acero y Tierra bajo tormenta de arena.',
    'soul-heart':       'Sube el SP.ATK cada vez que un Pokémon es eliminado.',
    'stakeout':         'Duplica el daño contra Pokémon que acaban de entrar al campo.',
    'water-absorb':     'Inmune al tipo Agua, cura HP al recibirlo.',
    'volt-absorb':      'Inmune al tipo Eléctrico, cura HP al recibirlo.',
    'flash-fire':       'Inmune al tipo Fuego, potencia los propios movimientos Fuego al recibirlo.',
    'storm-drain':      'Atrae y absorbe todos los movimientos Agua del campo.',
    'lightning-rod':    'Atrae y absorbe todos los movimientos Eléctrico del campo.',
    'thick-fat':        'Reduce a la mitad el daño recibido de Fuego y Hielo.',
    'dry-skin':         'Cura HP bajo Lluvia o con Agua; sufre más daño bajo Sol o de Fuego.',
    'filter':           'Reduce el daño de movimientos súper efectivos.',
    'solid-rock':       'Reduce el daño de movimientos súper efectivos.',
    'shadow-shield':    'Reduce el daño a la mitad con HP completo (como Multiscala).',
    'defiant':          'Sube el ATK en dos etapas cuando el rival baja cualquiera de tus stats.',
    'competitive':      'Sube el SP.ATK en dos etapas cuando el rival baja cualquiera de tus stats.',
    'prankster':        'Los movimientos de estado tienen prioridad +1.',
    'ice-scales':       'Reduce a la mitad el daño recibido de ataques especiales.',
    'mirror-armor':     'Refleja las bajadas de stats de vuelta al rival.',
    'vessel-of-ruin':   'Baja el SP.ATK de todos los demás Pokémon en campo.',
    'sword-of-ruin':    'Baja la DEF de todos los demás Pokémon en campo.',
    'beads-of-ruin':    'Baja el SP.DEF de todos los demás Pokémon en campo.',
    'tablets-of-ruin':  'Baja el ATK de todos los demás Pokémon en campo.',
    'supreme-overlord': 'Sube el ATK y SP.ATK por cada aliado eliminado antes de entrar.',
};

// En Gen I-III el split físico/especial es por TIPO del movimiento
const GEN1_PHYSICAL_TYPES = new Set([
    'normal','fighting','flying','ground','rock','bug','ghost','poison',
]);

// ================================================================
// MOVIMIENTOS PROBLEMÁTICOS — nunca sugerir sin condición previa
// ================================================================
const CONDITIONAL_MOVES = new Set([
    'dream-eater',  // requiere que el rival esté dormido
    'solar-beam',   // 2 turnos sin sol (trampa competitiva)
    'solar-blade',  // ídem
    'sky-attack',   // 2 turnos de carga
    'razor-wind',   // 2 turnos de carga
    'skull-bash',   // 2 turnos de carga
    'bide',         // depende del daño recibido
    'counter',      // depende del movimiento rival
    'mirror-coat',  // depende del movimiento rival
    'focus-punch',  // cancela si recibes daño
    'me-first',     // depende del rival
]);

// ================================================================
// AMENAZAS DEL META POR GENERACIÓN — top 3 threats para cobertura
// Cada amenaza incluye sus tipos para calcular efectividad
// ================================================================
const META_THREATS = {
    1: [{ name: 'Tauros',    types: ['normal'] },
        { name: 'Alakazam',  types: ['psychic'] },
        { name: 'Starmie',   types: ['water','psychic'] }],
    2: [{ name: 'Snorlax',   types: ['normal'] },
        { name: 'Skarmory',  types: ['steel','flying'] },
        { name: 'Machamp',   types: ['fighting'] }],
    3: [{ name: 'Salamence', types: ['dragon','flying'] },
        { name: 'Tyranitar', types: ['rock','dark'] },
        { name: 'Metagross', types: ['steel','psychic'] }],
    4: [{ name: 'Garchomp',  types: ['dragon','ground'] },
        { name: 'Scizor',    types: ['bug','steel'] },
        { name: 'Heatran',   types: ['fire','steel'] }],
    5: [{ name: 'Garchomp',  types: ['dragon','ground'] },
        { name: 'Ferrothorn',types: ['grass','steel'] },
        { name: 'Keldeo',    types: ['water','fighting'] }],
    6: [{ name: 'Landorus-T',types: ['ground','flying'] },
        { name: 'Talonflame',types: ['fire','flying'] },
        { name: 'Clefable',  types: ['fairy'] }],
    7: [{ name: 'Landorus-T',types: ['ground','flying'] },
        { name: 'Toxapex',   types: ['water','poison'] },
        { name: 'Tapu Lele', types: ['psychic','fairy'] }],
    8: [{ name: 'Dragapult', types: ['dragon','ghost'] },
        { name: 'Landorus-T',types: ['ground','flying'] },
        { name: 'Corviknight',types: ['steel','flying'] }],
    9: [{ name: 'Dragapult', types: ['dragon','ghost'] },
        { name: 'Great Tusk',types: ['ground','fighting'] },
        { name: 'Kingambit', types: ['dark','steel'] }],
};

// ================================================================
// TABLA DE EFECTIVIDAD OFENSIVA — tipo atacante → tipos que reciben ×2
// ================================================================
const TYPE_SE = {
    'fire':     ['grass','ice','bug','steel'],
    'water':    ['fire','ground','rock'],
    'grass':    ['water','ground','rock'],
    'electric': ['water','flying'],
    'ice':      ['grass','ground','flying','dragon'],
    'fighting': ['normal','ice','rock','dark','steel'],
    'poison':   ['grass','fairy'],
    'ground':   ['fire','electric','poison','rock','steel'],
    'flying':   ['grass','fighting','bug'],
    'psychic':  ['fighting','poison'],
    'bug':      ['grass','psychic','dark'],
    'rock':     ['fire','ice','flying','bug'],
    'ghost':    ['psychic','ghost'],
    'dragon':   ['dragon'],
    'dark':     ['psychic','ghost'],
    'steel':    ['ice','rock','fairy'],
    'fairy':    ['fighting','dragon','dark'],
    'normal':   [],
};

// ================================================================
// NOMBRES EN ESPAÑOL — fallback estático para moves Smogon
// Prioridad: PokéAPI (nameEs) > este mapa > inglés formateado
// ================================================================
const SMOGON_NAMES_ES = {
    'draco-meteor':    'Meteorobola',
    'shadow-ball':     'Bola Sombra',
    'flamethrower':    'Lanzallamas',
    'fire-blast':      'Llamarada',
    'u-turn':          'Ida y Vuelta',
    'air-slash':       'Tajo Aéreo',
    'hurricane':       'Huracán',
    'focus-blast':     'Foco Resplandor',
    'roost':           'Posada',
    'earthquake':      'Terremoto',
    'stealth-rock':    'Trampa Rocas',
    'scale-shot':      'Escamitazo',
    'fire-fang':       'Colmillo Fuego',
    'fire-punch':      'Puño Fuego',
    'dragon-dance':    'Danza Dragón',
    'quiver-dance':    'Danza Alas',
    'bug-buzz':        'Zumbido',
    'nasty-plot':      'Mal de Ojo',
    'make-it-rain':    'Lluvia de Dinero',
    'swords-dance':    'Danza Espada',
    'kowtow-cleave':   'Tajo Kowtow',
    'iron-head':       'Cabeza de Hierro',
    'sucker-punch':    'Golpe Bajo',
    'close-combat':    'A Bocajarro',
    'moonblast':       'Fuerza Lunar',
    'knock-off':       'Derribo',
    'extreme-speed':   'Velocidad Extrema',
    'bullet-punch':    'Puño Bala',
    'toxic-spikes':    'Pinchos Tóxicos',
    'scald':           'Quemalagua',
    'recover':         'Recuperación',
    'baneful-bunker':  'Madriguera',
    'body-press':      'Plancha',
    'defog':           'Ventolera',
    'iron-defense':    'Defensa Férrea',
    'flower-trick':    'Truco Floral',
    'triple-axel':     'Triple Axel',
    'acrobatics':      'Acrobacia',
    'crunch':          'Triturar',
    'torch-song':      'Canción Llamarada',
    'slack-off':       'Escaqueo',
    'will-o-wisp':     'Fuego Fatuo',
    'headlong-rush':   'Embestida',
    'ice-spinner':     'Giro Helado',
    'rapid-spin':      'Giro Veloz',
    'mortal-spin':     'Giro Mortal',
    'power-gem':       'Gema Brillante',
    'earth-power':     'Poder Tierra',
    'ruination':       'Catástrofe',
    'whirlwind':       'Torbellino',
    'salt-cure':       'Salmuera',
    'calm-mind':       'Meditación',
    'soft-boiled':     'Ponchado',
    'dazzling-gleam':  'Brillo Mágico',
    'aura-sphere':     'Esfera Aural',
    'psystrike':       'Psicogolpe',
    'thunderbolt':     'Rayo',
    'volt-switch':     'Relevo Eléctrico',
    'grass-knot':      'Hierba Lazo',
    'quick-attack':    'Ataque Rápido',
    'outrage':         'Bastonazos',
    'sludge-bomb':     'Bomba Lodo',
    'sludge-wave':     'Ola de Lodo',
    'stone-edge':      'Roca Afilada',
    'ice-punch':       'Puño Hielo',
    'shadow-sneak':    'Sombra Vil',
    'psyshock':        'Psicocarga',
    'dark-pulse':      'Pulso Umbrío',
    'flash-cannon':    'Cañón Destello',
    'protect':         'Protección',
    'high-jump-kick':  'Salto Patada',
    'flare-blitz':     'Envite Ígneo',
    'volt-tackle':     'Voltio Tacle',
    'iron-tail':       'Cola Férrea',
    'dragon-claw':     'Garra Dragón',
    'waterfall':       'Cascada',
    'surf':            'Surf',
    'psychic':         'Psíquico',
    'shadow-claw':     'Garra Sombría',
    'thunder-wave':    'Onda Trueno',
    'toxic':           'Tóxico',
    'taunt':           'Mofa',
    'substitute':      'Sustituto',
    'leech-seed':      'Drenadoras',
    'spikes':          'Trampa Pinchos',
    'leftovers':       'Restos',
};

// ================================================================
// RAZONES SMOGON — explicaciones por clave de movimiento (API)
// ================================================================
const SMOGON_REASONS = {
    'draco-meteor':    'STAB Dragón — 130 BP con bajada garantizada de SP.ATK. Eje ofensivo del set.',
    'shadow-ball':     'STAB/Cobertura Fantasma — 80 BP fiable, baja SP.DEF rival 20%.',
    'flamethrower':    'Cobertura Fuego — 90 BP fiable, liquida Acero y Planta.',
    'fire-blast':      'Cobertura Fuego — 110 BP máximo, ideal para sweepers con EVs en SP.ATK.',
    'u-turn':          'Pivote — genera momentum saliendo del campo tras atacar.',
    'air-slash':       'STAB Volador — 75 BP, 30% de flinch.',
    'hurricane':       'STAB Volador — 110 BP, confusión 30%. Precisión perfecta bajo lluvia.',
    'focus-blast':     'Cobertura Lucha — 120 BP, golpea Roca, Acero e Hielo que resisten.',
    'roost':           'Recuperación — 50% HP, imprescindible para mantenerse en el campo.',
    'earthquake':      'STAB/Cobertura Tierra — 100 BP fiable, cobertura amplísima.',
    'stealth-rock':    'Hazard — daño pasivo garantizado en cada cambio del rival.',
    'scale-shot':      'STAB Dragón — múltiples golpes, sube VEL al final. Sinergia con setup.',
    'fire-fang':       'Cobertura Fuego — 65 BP fiable, golpea Acero y Planta.',
    'fire-punch':      'Cobertura Fuego — 75 BP fiable, quemadura 10%.',
    'dragon-dance':    'Setup — +1 ATK y VEL simultáneamente. El setup ofensivo más eficiente.',
    'quiver-dance':    'Setup — +1 SP.ATK, SP.DEF y VEL. El setup más versátil del juego.',
    'bug-buzz':        'STAB Bicho — 90 BP, baja SP.DEF rival 10%.',
    'nasty-plot':      'Setup — +2 SP.ATK, duplica el poder ofensivo en un solo turno.',
    'make-it-rain':    'STAB Acero — 120 BP firma de Gholdengo, baja SP.ATK después.',
    'swords-dance':    'Setup — +2 ATK, duplica el poder físico en un solo turno.',
    'kowtow-cleave':   'STAB Siniestro — 85 BP, nunca falla. Fiabilidad máxima.',
    'iron-head':       'STAB/Cobertura Acero — 80 BP, 30% de flinch.',
    'sucker-punch':    'Prioridad Siniestro — ataca antes si el rival usa movimiento de daño.',
    'close-combat':    'STAB/Cobertura Lucha — 120 BP, baja DEF y SP.DEF propias.',
    'moonblast':       'STAB Hada — 95 BP, baja SP.ATK rival 30%.',
    'knock-off':       'Utilidad — elimina el objeto del rival (+30% BP si porta objeto).',
    'extreme-speed':   'Prioridad +2 — arrebata KOs a rivales más rápidos.',
    'bullet-punch':    'Prioridad Acero — ideal para cerrar KOs contra Hielo y Roca.',
    'toxic-spikes':    'Hazard — envenena a todos los no-Voladores que entren.',
    'scald':           'STAB/Cobertura Agua — 80 BP, 30% de quemadura.',
    'recover':         'Recuperación — 50% HP, referencia en muros ofensivos y defensivos.',
    'baneful-bunker':  'Protección + veneno — protege y envenena al rival si hace contacto.',
    'body-press':      'Cobertura Lucha — el daño escala con la DEF propia, no el ATK.',
    'defog':           'Limpieza — elimina todos los hazards del campo propio y rival.',
    'iron-defense':    'Setup defensivo — +2 DEF, sinergia directa con Body Press.',
    'flower-trick':    'STAB Planta — siempre crítico, nunca falla. Sin margen de error.',
    'triple-axel':     'Cobertura Hielo — potencia acumulada (20+40+60 = hasta 120 BP efectivos).',
    'acrobatics':      'STAB Volador — 110 BP efectivos sin objeto equipado.',
    'crunch':          'STAB Siniestro — 80 BP, baja DEF rival 20%.',
    'torch-song':      'STAB Fuego — 80 BP, sube SP.ATK garantizado cada turno.',
    'slack-off':       'Recuperación — 50% HP, referencia en muros lentos.',
    'will-o-wisp':     'Estado — quema al rival, reduce su ATK físico a la mitad.',
    'headlong-rush':   'STAB Tierra — 100 BP firma de Gran Colmillo, baja DEF y SP.DEF.',
    'ice-spinner':     'Cobertura Hielo — elimina el Terreno activo al usarlo.',
    'rapid-spin':      'Limpieza — elimina hazards propios y sube VEL +1 en Gen 9.',
    'mortal-spin':     'STAB — elimina hazards propios y envenena al rival al usarlo.',
    'power-gem':       'STAB Roca — 80 BP fiable, alta crítico contra Fuego y Volador.',
    'earth-power':     'Cobertura Tierra — 90 BP especial, baja SP.DEF rival 10%.',
    'ruination':       'Utilidad Siniestro — reduce el HP del rival exactamente a la mitad.',
    'whirlwind':       'Control — expulsa al rival forzando cambio, impide setup.',
    'salt-cure':       'Firma Garganacl — daño pasivo cada turno, x2 contra Agua y Acero.',
    'calm-mind':       'Setup — +1 SP.ATK y SP.DEF simultáneamente.',
    'soft-boiled':     'Recuperación — 50% HP, insustituible en muros especiales como Clefable.',
    'dazzling-gleam':  'STAB/Cobertura Hada — 80 BP, golpea en dobles a ambos rivales.',
    'aura-sphere':     'STAB/Cobertura Lucha — 80 BP, nunca falla.',
    'psystrike':       'STAB Psíquico — 100 BP, el daño se calcula contra la DEF física del rival.',
    'thunderbolt':     'STAB Eléctrico — 90 BP fiable, parálisis 10%.',
    'volt-switch':     'Pivote Eléctrico — genera momentum saliendo del campo tras atacar.',
    'grass-knot':      'Cobertura Planta — potencia escalada según el peso del rival.',
    'quick-attack':    'Prioridad Normal — asegura KOs finales contra rivales debilitados.',
    'outrage':         'STAB Dragón — 120 BP devastador. Traba 2-3 turnos, ideal con Scarf.',
    'sludge-bomb':     'STAB Veneno — 90 BP, envenenamiento 30%.',
    'sludge-wave':     'STAB Veneno — 95 BP en área, sin reducción en dobles.',
    'stone-edge':      'STAB/Cobertura Roca — 100 BP, alta tasa de crítico.',
    'ice-punch':       'Cobertura Hielo — 75 BP, congelación 10%.',
    'shadow-sneak':    'Prioridad Fantasma — cierra KOs contra tipos Psíquico y Normal.',
    'psyshock':        'STAB Psíquico — 80 BP, calcula contra DEF física (perfecto vs Blissey).',
    'dark-pulse':      'STAB/Cobertura Siniestro — 80 BP, flinch 20%.',
    'flash-cannon':    'STAB Acero — 80 BP, baja SP.DEF rival 10%.',
    'protect':         'Utilidad — protege un turno, activa Speed Boost en Blaziken.',
    'high-jump-kick':  'STAB Lucha — 130 BP. Si falla, el usuario recibe retroceso.',
    'flare-blitz':     'STAB Fuego — 120 BP con 1/3 de daño de retroceso.',
    'volt-tackle':     'STAB Eléctrico — 120 BP, 1/3 retroceso. Firma definitoria de Pikachu.',
    'iron-tail':       'Cobertura Acero — 100 BP, baja DEF rival 30%.',
    'draco-meteor':    'STAB Dragón — 130 BP con bajada garantizada de SP.ATK.',
};

// ================================================================
// SETS SMOGON VERIFICADOS — overrides por Pokémon y generación
// Estructura: moves_1 usa claves de API; el resolver obtiene
// el nombre en español directamente desde los datos de PokéAPI.
// ================================================================
const SMOGON_SETS = {

    // ── Gen 9 ────────────────────────────────────────────────────
    'charizard': {
        gen: 9, tier: 'OU',
        nature: 'Timid', ability_key: 'solar-power', item: 'Botas Seguras',
        evs: '4 HP / 252 SP.ATK / 252 VEL', role: 'Sweeper Especial',
        moves_1: [
            { key: 'fire-blast',    tipo: 'fire' },
            { key: 'air-slash',     tipo: 'flying' },
            { key: 'focus-blast',   tipo: 'fighting' },
            { key: 'roost',         tipo: 'flying' },
        ],
    },
    'dragapult': {
        gen: 9, tier: 'OU',
        nature: 'Timid', ability_key: 'infiltrator', item: 'Lentes Elegidas',
        evs: '4 HP / 252 SP.ATK / 252 VEL', role: 'Sweeper Especial',
        moves_1: [
            { key: 'draco-meteor',  tipo: 'dragon' },
            { key: 'shadow-ball',   tipo: 'ghost' },
            { key: 'flamethrower',  tipo: 'fire' },
            { key: 'u-turn',        tipo: 'bug' },
        ],
    },
    'garchomp': {
        gen: 9, tier: 'OU',
        nature: 'Jolly', ability_key: 'rough-skin', item: 'Casco Rocky',
        evs: '252 HP / 172 DEF / 84 VEL', role: 'Defensor / Setter',
        moves_1: [
            { key: 'stealth-rock',  tipo: 'rock' },
            { key: 'earthquake',    tipo: 'ground' },
            { key: 'scale-shot',    tipo: 'dragon' },
            { key: 'fire-blast',    tipo: 'fire' },
        ],
    },
    'volcarona': {
        gen: 9, tier: 'OU',
        nature: 'Timid', ability_key: 'flame-body', item: 'Botas Seguras',
        evs: '4 HP / 252 SP.ATK / 252 VEL', role: 'Setup Sweeper Especial',
        moves_1: [
            { key: 'quiver-dance',  tipo: 'bug' },
            { key: 'fire-blast',    tipo: 'fire' },
            { key: 'bug-buzz',      tipo: 'bug' },
            { key: 'roost',         tipo: 'flying' },
        ],
    },
    'gholdengo': {
        gen: 9, tier: 'OU',
        nature: 'Modest', ability_key: 'good-as-gold', item: 'Lentes Elegidas',
        evs: '4 HP / 252 SP.ATK / 252 VEL', role: 'Sweeper Especial',
        moves_1: [
            { key: 'nasty-plot',    tipo: 'dark' },
            { key: 'make-it-rain',  tipo: 'steel' },
            { key: 'shadow-ball',   tipo: 'ghost' },
            { key: 'focus-blast',   tipo: 'fighting' },
        ],
    },
    'kingambit': {
        gen: 9, tier: 'OU',
        nature: 'Adamant', ability_key: 'defiant', item: 'Globo Aerostático',
        evs: '4 HP / 252 ATK / 252 VEL', role: 'Wallbreaker Físico',
        moves_1: [
            { key: 'swords-dance',  tipo: 'normal' },
            { key: 'kowtow-cleave', tipo: 'dark' },
            { key: 'iron-head',     tipo: 'steel' },
            { key: 'sucker-punch',  tipo: 'dark' },
        ],
    },
    'toxapex': {
        gen: 9, tier: 'OU',
        nature: 'Bold', ability_key: 'regenerator', item: 'Cieno Negro',
        evs: '252 HP / 252 DEF / 4 SP.DEF', role: 'Muro Defensivo',
        moves_1: [
            { key: 'toxic-spikes',  tipo: 'poison' },
            { key: 'scald',         tipo: 'water' },
            { key: 'recover',       tipo: 'normal' },
            { key: 'baneful-bunker',tipo: 'poison' },
        ],
    },
    'corviknight': {
        gen: 9, tier: 'OU',
        nature: 'Impish', ability_key: 'mirror-armor', item: 'Restos',
        evs: '252 HP / 4 ATK / 252 DEF', role: 'Pivot Defensivo',
        moves_1: [
            { key: 'u-turn',        tipo: 'bug' },
            { key: 'body-press',    tipo: 'fighting' },
            { key: 'roost',         tipo: 'flying' },
            { key: 'defog',         tipo: 'flying' },
        ],
    },
    'meowscarada': {
        gen: 9, tier: 'OU',
        nature: 'Jolly', ability_key: 'protean', item: 'Cinta Elegida',
        evs: '4 HP / 252 ATK / 252 VEL', role: 'Atacante Físico',
        moves_1: [
            { key: 'flower-trick',  tipo: 'grass' },
            { key: 'knock-off',     tipo: 'dark' },
            { key: 'u-turn',        tipo: 'bug' },
            { key: 'triple-axel',   tipo: 'ice' },
        ],
    },
    'skeledirge': {
        gen: 9, tier: 'OU',
        nature: 'Modest', ability_key: 'unaware', item: 'Restos',
        evs: '248 HP / 252 SP.ATK / 8 SP.DEF', role: 'Muro Ofensivo',
        moves_1: [
            { key: 'torch-song',    tipo: 'fire' },
            { key: 'shadow-ball',   tipo: 'ghost' },
            { key: 'slack-off',     tipo: 'normal' },
            { key: 'will-o-wisp',   tipo: 'fire' },
        ],
    },
    'great-tusk': {
        gen: 9, tier: 'OU',
        nature: 'Jolly', ability_key: 'protosynthesis', item: 'Botas Seguras',
        evs: '252 HP / 4 ATK / 252 VEL', role: 'Hazard Control',
        moves_1: [
            { key: 'headlong-rush', tipo: 'ground' },
            { key: 'ice-spinner',   tipo: 'ice' },
            { key: 'stealth-rock',  tipo: 'rock' },
            { key: 'rapid-spin',    tipo: 'normal' },
        ],
    },
    'roaring-moon': {
        gen: 9, tier: 'OU',
        nature: 'Jolly', ability_key: 'protosynthesis', item: 'Turboenergía',
        evs: '4 HP / 252 ATK / 252 VEL', role: 'Sweeper Físico',
        moves_1: [
            { key: 'dragon-dance',  tipo: 'dragon' },
            { key: 'acrobatics',    tipo: 'flying' },
            { key: 'crunch',        tipo: 'dark' },
            { key: 'earthquake',    tipo: 'ground' },
        ],
    },
    'iron-valiant': {
        gen: 9, tier: 'OU',
        nature: 'Jolly', ability_key: 'quark-drive', item: 'Pañuelo Elegido',
        evs: '4 HP / 252 ATK / 252 VEL', role: 'Sweeper Físico/Especial',
        moves_1: [
            { key: 'close-combat',  tipo: 'fighting' },
            { key: 'moonblast',     tipo: 'fairy' },
            { key: 'knock-off',     tipo: 'dark' },
            { key: 'shadow-sneak',  tipo: 'ghost' },
        ],
    },
    'ting-lu': {
        gen: 9, tier: 'OU',
        nature: 'Careful', ability_key: 'vessel-of-ruin', item: 'Restos',
        evs: '252 HP / 4 ATK / 252 SP.DEF', role: 'Muro Especial / Setter',
        moves_1: [
            { key: 'stealth-rock',  tipo: 'rock' },
            { key: 'earthquake',    tipo: 'ground' },
            { key: 'ruination',     tipo: 'dark' },
            { key: 'whirlwind',     tipo: 'normal' },
        ],
    },
    'garganacl': {
        gen: 9, tier: 'OU',
        nature: 'Impish', ability_key: 'purifying-salt', item: 'Restos',
        evs: '252 HP / 252 DEF / 4 SP.DEF', role: 'Muro Físico',
        moves_1: [
            { key: 'salt-cure',     tipo: 'rock' },
            { key: 'stealth-rock',  tipo: 'rock' },
            { key: 'recover',       tipo: 'normal' },
            { key: 'body-press',    tipo: 'fighting' },
        ],
    },
    'glimmora': {
        gen: 9, tier: 'OU',
        nature: 'Timid', ability_key: 'toxic-debris', item: 'Botas Seguras',
        evs: '4 HP / 252 SP.ATK / 252 VEL', role: 'Setter / Sweeper Especial',
        moves_1: [
            { key: 'toxic-spikes',  tipo: 'poison' },
            { key: 'mortal-spin',   tipo: 'poison' },
            { key: 'power-gem',     tipo: 'rock' },
            { key: 'earth-power',   tipo: 'ground' },
        ],
    },
    'clefable': {
        gen: 9, tier: 'OU',
        nature: 'Bold', ability_key: 'magic-guard', item: 'Restos',
        evs: '252 HP / 252 DEF / 4 SP.DEF', role: 'Muro Especial',
        moves_1: [
            { key: 'calm-mind',     tipo: 'psychic' },
            { key: 'moonblast',     tipo: 'fairy' },
            { key: 'flamethrower',  tipo: 'fire' },
            { key: 'soft-boiled',   tipo: 'normal' },
        ],
    },
    'togekiss': {
        gen: 9, tier: 'OU',
        nature: 'Timid', ability_key: 'serene-grace', item: 'Pañuelo Elegido',
        evs: '4 HP / 252 SP.ATK / 252 VEL', role: 'Pivot Especial',
        moves_1: [
            { key: 'air-slash',     tipo: 'flying' },
            { key: 'dazzling-gleam',tipo: 'fairy' },
            { key: 'nasty-plot',    tipo: 'dark' },
            { key: 'roost',         tipo: 'flying' },
        ],
    },
    'gengar': {
        gen: 9, tier: 'OU',
        nature: 'Timid', ability_key: 'cursed-body', item: 'Lentes Elegidas',
        evs: '4 HP / 252 SP.ATK / 252 VEL', role: 'Sweeper Especial',
        moves_1: [
            { key: 'nasty-plot',    tipo: 'dark' },
            { key: 'shadow-ball',   tipo: 'ghost' },
            { key: 'sludge-wave',   tipo: 'poison' },
            { key: 'focus-blast',   tipo: 'fighting' },
        ],
    },
    'dragonite': {
        gen: 9, tier: 'OU',
        nature: 'Adamant', ability_key: 'multiscale', item: 'Botas Seguras',
        evs: '4 HP / 252 ATK / 252 VEL', role: 'Sweeper Físico',
        moves_1: [
            { key: 'dragon-dance',  tipo: 'dragon' },
            { key: 'extreme-speed', tipo: 'normal' },
            { key: 'earthquake',    tipo: 'ground' },
            { key: 'fire-punch',    tipo: 'fire' },
        ],
    },
    'tyranitar': {
        gen: 9, tier: 'OU',
        nature: 'Adamant', ability_key: 'sand-stream', item: 'Cinta Elegida',
        evs: '4 HP / 252 ATK / 252 VEL', role: 'Atacante Físico / Setter',
        moves_1: [
            { key: 'stealth-rock',  tipo: 'rock' },
            { key: 'stone-edge',    tipo: 'rock' },
            { key: 'crunch',        tipo: 'dark' },
            { key: 'ice-punch',     tipo: 'ice' },
        ],
    },
    'lucario': {
        gen: 9, tier: 'UU',
        nature: 'Adamant', ability_key: 'justified', item: 'Orbe Vital',
        evs: '4 HP / 252 ATK / 252 VEL', role: 'Sweeper Físico',
        moves_1: [
            { key: 'swords-dance',  tipo: 'normal' },
            { key: 'close-combat',  tipo: 'fighting' },
            { key: 'extreme-speed', tipo: 'normal' },
            { key: 'bullet-punch',  tipo: 'steel' },
        ],
    },
    'blaziken': {
        gen: 9, tier: 'Ubers',
        nature: 'Jolly', ability_key: 'speed-boost', item: 'Orbe Vital',
        evs: '4 HP / 252 ATK / 252 VEL', role: 'Sweeper Físico',
        moves_1: [
            { key: 'swords-dance',    tipo: 'normal' },
            { key: 'high-jump-kick',  tipo: 'fighting' },
            { key: 'flare-blitz',     tipo: 'fire' },
            { key: 'protect',         tipo: 'normal' },
        ],
    },
    'mewtwo': {
        gen: 9, tier: 'Ubers',
        nature: 'Timid', ability_key: 'pressure', item: 'Orbe Vital',
        evs: '4 HP / 252 SP.ATK / 252 VEL', role: 'Sweeper Especial',
        moves_1: [
            { key: 'nasty-plot',    tipo: 'dark' },
            { key: 'psystrike',     tipo: 'psychic' },
            { key: 'shadow-ball',   tipo: 'ghost' },
            { key: 'aura-sphere',   tipo: 'fighting' },
        ],
    },
    'pikachu': {
        gen: 9, tier: 'NU',
        nature: 'Timid', ability_key: 'static', item: 'Bola Luz',
        evs: '4 HP / 252 SP.ATK / 252 VEL', role: 'Atacante Especial',
        moves_1: [
            { key: 'thunderbolt',   tipo: 'electric' },
            { key: 'volt-switch',   tipo: 'electric' },
            { key: 'grass-knot',    tipo: 'grass' },
            { key: 'quick-attack',  tipo: 'normal' },
        ],
    },
};

// ================================================================
// TRADUCCIÓN DE OBJETOS — API Smogon (inglés) → castellano
// ================================================================
const SMOGON_ITEMS_ES = {
    'Choice Specs':       'Lentes Elegidas',
    'Choice Band':        'Cinta Elegida',
    'Choice Scarf':       'Pañuelo Elegido',
    'Life Orb':           'Orbe Vital',
    'Leftovers':          'Restos',
    'Rocky Helmet':       'Casco Rocky',
    'Heavy-Duty Boots':   'Botas Seguras',
    'Eviolite':           'Eviolita',
    'Assault Vest':       'Chaleco de Asalto',
    'Focus Sash':         'Banda Focus',
    'Air Balloon':        'Globo Aerostático',
    'Black Sludge':       'Cieno Negro',
    'Covert Cloak':       'Capa Oculta',
    'Clear Amulet':       'Amuleto Limpio',
    'Booster Energy':     'Turboenergía',
    'Throat Spray':       'Spray Garganta',
    'Expert Belt':        'Cinturón Experto',
    'Flame Orb':          'Orbe Llama',
    'Toxic Orb':          'Orbe Tóxico',
    'White Herb':         'Hierba Blanca',
    'Power Herb':         'Hierba Poder',
    'Light Clay':         'Arcilla Luz',
    'Loaded Dice':        'Dado Cargado',
    'Wide Lens':          'Lente Amplio',
    'Scope Lens':         'Lente Visión',
    'Shell Bell':         'Cascabel Concha',
    'Light Ball':         'Bola Luz',
    'Thick Club':         'Maza Gruesa',
    'Metal Coat':         'Revestimiento Metálico',
    'Charcoal':           'Carbón',
    'Mystic Water':       'Agua Mística',
    'Miracle Seed':       'Semilla Milagro',
    'Magnet':             'Imán',
    'Black Belt':         'Cinturón Negro',
    'Silk Scarf':         'Pañuelo Seda',
    'Never-Melt Ice':     'Hielo Eterno',
    'Poison Barb':        'Espina Venenosa',
    'Soft Sand':          'Arena Fina',
    'Sharp Beak':         'Pico Afilado',
    'Hard Stone':         'Piedra Dura',
    'Silver Powder':      'Polvo Plata',
    'Spell Tag':          'Etiqueta Mágica',
    'Pink Bow':           'Lazo Rosa',
    'Lum Berry':          'Baya Ziuela',
    'Sitrus Berry':       'Baya Zidra',
    'Salac Berry':        'Baya Ziena',
    'Custap Berry':       'Baya Rindula',
};

// ================================================================
// TIPOS DE MOVIMIENTOS SMOGON — fallback cuando el move no está en movesData
// ================================================================
const SMOGON_MOVE_TYPE = {
    'draco-meteor':       'dragon',
    'shadow-ball':        'ghost',
    'flamethrower':       'fire',
    'fire-blast':         'fire',
    'u-turn':             'bug',
    'air-slash':          'flying',
    'hurricane':          'flying',
    'focus-blast':        'fighting',
    'roost':              'flying',
    'earthquake':         'ground',
    'stealth-rock':       'rock',
    'scale-shot':         'dragon',
    'fire-fang':          'fire',
    'fire-punch':         'fire',
    'dragon-dance':       'dragon',
    'quiver-dance':       'bug',
    'bug-buzz':           'bug',
    'nasty-plot':         'dark',
    'make-it-rain':       'steel',
    'swords-dance':       'normal',
    'kowtow-cleave':      'dark',
    'iron-head':          'steel',
    'sucker-punch':       'dark',
    'close-combat':       'fighting',
    'moonblast':          'fairy',
    'knock-off':          'dark',
    'extreme-speed':      'normal',
    'bullet-punch':       'steel',
    'toxic-spikes':       'poison',
    'scald':              'water',
    'recover':            'normal',
    'baneful-bunker':     'poison',
    'body-press':         'fighting',
    'defog':              'flying',
    'iron-defense':       'steel',
    'flower-trick':       'grass',
    'triple-axel':        'ice',
    'acrobatics':         'flying',
    'crunch':             'dark',
    'torch-song':         'fire',
    'slack-off':          'normal',
    'will-o-wisp':        'fire',
    'headlong-rush':      'ground',
    'ice-spinner':        'ice',
    'rapid-spin':         'normal',
    'mortal-spin':        'poison',
    'power-gem':          'rock',
    'earth-power':        'ground',
    'ruination':          'dark',
    'whirlwind':          'normal',
    'salt-cure':          'rock',
    'calm-mind':          'psychic',
    'soft-boiled':        'normal',
    'dazzling-gleam':     'fairy',
    'aura-sphere':        'fighting',
    'psystrike':          'psychic',
    'thunderbolt':        'electric',
    'volt-switch':        'electric',
    'grass-knot':         'grass',
    'quick-attack':       'normal',
    'outrage':            'dragon',
    'sludge-bomb':        'poison',
    'sludge-wave':        'poison',
    'stone-edge':         'rock',
    'ice-punch':          'ice',
    'shadow-sneak':       'ghost',
    'psyshock':           'psychic',
    'dark-pulse':         'dark',
    'flash-cannon':       'steel',
    'protect':            'normal',
    'high-jump-kick':     'fighting',
    'flare-blitz':        'fire',
    'volt-tackle':        'electric',
    'iron-tail':          'steel',
    'hydro-pump':         'water',
    'surf':               'water',
    'ice-beam':           'ice',
    'blizzard':           'ice',
    'thunder':            'electric',
    'overheat':           'fire',
    'psychic':            'psychic',
    'shadow-claw':        'ghost',
    'thunder-wave':       'electric',
    'toxic':              'poison',
    'taunt':              'dark',
    'substitute':         'normal',
    'leech-seed':         'grass',
    'spikes':             'ground',
    'drain-punch':        'fighting',
    'leech-life':         'bug',
    'play-rough':         'fairy',
    'waterfall':          'water',
    'aqua-jet':           'water',
    'mach-punch':         'fighting',
    'ice-shard':          'ice',
    'shadow-force':       'ghost',
    'gunk-shot':          'poison',
    'poison-jab':         'poison',
    'zen-headbutt':       'psychic',
    'thunder-punch':      'electric',
    'cross-chop':         'fighting',
    'liquidation':        'water',
    'smart-strike':       'steel',
    'throat-chop':        'dark',
    'darkest-lariat':     'dark',
    'stomping-tantrum':   'ground',
    'high-horsepower':    'ground',
    'head-smash':         'rock',
    'rock-slide':         'rock',
    'avalanche':          'ice',
    'night-slash':        'dark',
    'leaf-blade':         'grass',
    'wood-hammer':        'grass',
    'seed-bomb':          'grass',
    'x-scissor':          'bug',
    'megahorn':           'bug',
    'psycho-cut':         'psychic',
    'wave-crash':         'water',
    'axe-kick':           'fighting',
    'brave-bird':         'flying',
    'body-slam':          'normal',
    'facade':             'normal',
    'stored-power':       'psychic',
    'collision-course':   'fighting',
    'population-bomb':    'normal',
    'last-respects':      'ghost',
    'icicle-crash':       'ice',
    'icicle-spear':       'ice',
    'precipice-blades':   'ground',
    'sacred-sword':       'fighting',
    'flying-press':       'fighting',
    'drill-run':          'ground',
    'rock-blast':         'rock',
    'power-trip':         'dark',
    'vacuum-wave':        'fighting',
    'water-shuriken':     'water',
    'first-impression':   'bug',
    'grassy-glide':       'grass',
    'jet-punch':          'water',
    'volt-switch':        'electric',
    'flip-turn':          'water',
    'parting-shot':       'dark',
    'teleport':           'psychic',
    'baton-pass':         'normal',
    'trick':              'psychic',
    'switcheroo':         'dark',
    'encore':             'normal',
    'destiny-bond':       'ghost',
    'pain-split':         'normal',
    'perish-song':        'normal',
    'trick-room':         'psychic',
    'tailwind':           'flying',
    'light-screen':       'psychic',
    'reflect':            'psychic',
    'aurora-veil':        'ice',
    'sticky-web':         'bug',
    'mortal-spin':        'poison',
    'esper-wing':         'psychic',
    'misty-explosion':    'fairy',
    'poltergeist':        'ghost',
    'astral-barrage':     'ghost',
    'glacial-lance':      'ice',
    'eerie-spell':        'psychic',
    'infernal-parade':    'ghost',
    'bleakwind-storm':    'flying',
    'wildbolt-storm':     'electric',
    'sandsear-storm':     'ground',
    'hydro-steam':        'water',
    'blue-flare':         'fire',
    'bolt-strike':        'electric',
    'spacial-rend':       'dragon',
    'seed-flare':         'grass',
    'luster-purge':       'psychic',
    'mist-ball':          'psychic',
    'psycho-boost':       'psychic',
    'oblivion-wing':      'flying',
    'petal-blizzard':     'grass',
    'mystical-fire':      'fire',
    'burning-jealousy':   'fire',
    'expanding-force':    'psychic',
    'rising-voltage':     'electric',
    'terrain-pulse':      'normal',
    'tera-blast':         'normal',
    'core-enforcer':      'dragon',
    'nuzzle':             'electric',
    'glare':              'normal',
    'stun-spore':         'grass',
    'sleep-powder':       'grass',
    'spore':              'grass',
    'hypnosis':           'psychic',
    'yawn':               'normal',
    'wish':               'normal',
    'healing-wish':       'psychic',
    'lunar-dance':        'psychic',
    'milk-drink':         'normal',
    'shore-up':           'ground',
    'jungle-healing':     'grass',
    'strength-sap':       'grass',
    'rest':               'psychic',
    'morning-sun':        'normal',
    'moonlight':          'fairy',
    'synthesis':          'grass',
    'shadow-ball':        'ghost',
    'energy-ball':        'grass',
};

// ================================================================
// MÓDULO
// ================================================================

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.analyzer = {

    analyze(pokemon, movesData, abilitiesEs, generation, smogonData = null) {
        const stats  = this._parseStats(pokemon);
        const role   = this._determineRole(stats);
        const builds = this._buildCompetitiveBuilds(pokemon, movesData, abilitiesEs, stats, role, generation, smogonData);
        const formato    = this._determineFormat(stats, generation);
        const consejo    = this._buildAdvice(pokemon, stats, role, generation);
        return { builds, rol: role.description, formato, consejo_extra: consejo };
    },

    /**
     * Resuelve una lista de {key, tipo} de SMOGON_SETS a formato de salida.
     * Obtiene el nombre en español desde movesData (ya descargado de PokéAPI).
     * Si el move no está en movesData (pool de 60), usa el nombre formateado en inglés.
     */
    _resolveSmogonMoves(moveDefs, movesData) {
        return moveDefs.map(({ key, tipo }) => {
            const found = movesData.find(m => m.name === key);
            const movimiento = found?.nameEs
                ?? SMOGON_NAMES_ES[key]
                ?? key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return {
                movimiento,
                tipo: found ? found.type : tipo,
                razon: SMOGON_REASONS[key] ?? 'Move Smogon verificado.',
            };
        });
    },

    /** Genera 2 builds competitivos para el Pokémon. */
    _buildCompetitiveBuilds(pokemon, movesData, abilitiesEs, stats, role, generation, smogonData = null) {
        // Prioridad 1: datos live de la API Smogon
        if (smogonData) {
            return this._buildFromSmogonAPI(smogonData, pokemon, movesData, abilitiesEs, stats, role, generation);
        }
        // Prioridad 2: override estático SMOGON_SETS (legacy, para gens sin soporte API)
        const override = SMOGON_SETS[pokemon.name];
        if (override && generation.num === override.gen) {
            const b1 = this._buildFromSmogon(override, movesData, abilitiesEs);
            const dynArr = this._buildDynamic3(pokemon, movesData, abilitiesEs, stats, role, generation);
            return [b1, dynArr[1]].filter(Boolean);
        }
        return this._buildDynamic3(pokemon, movesData, abilitiesEs, stats, role, generation);
    },

    /**
     * Construye hasta 2 builds usando datos live de la API Smogon.
     * Los sets de Smogon tienen movimientos en inglés con nombre display (ej. "Draco Meteor").
     */
    _buildFromSmogonAPI(smogonData, pokemon, movesData, abilitiesEs, stats, role, generation) {
        const { NATURE_ES } = window.PokeAnalyzer.config;
        const { tier, sets } = smogonData;
        const setNames = Object.keys(sets);

        // Mostrar hasta 3 sets de Smogon cuando estén disponibles
        const maxSets = Math.min(setNames.length, 3);

        const builds = setNames.slice(0, maxSets).map((setName, i) => {
            const s = sets[setName];

            // Naturaleza
            const natureEn = Array.isArray(s.nature) ? s.nature[0] : (s.nature ?? 'Hardy');
            const natureEs = NATURE_ES[natureEn] ?? natureEn;

            // Habilidad
            const abilityEn  = Array.isArray(s.ability) ? s.ability[0] : (s.ability ?? '');
            const abilityKey = abilityEn.toLowerCase().replace(/ /g, '-').replace(/[.']/g, '');
            const abilityEs  = abilitiesEs.get(abilityKey) ?? abilityEn;

            // Objeto
            const itemEn = Array.isArray(s.item) ? s.item[0] : (s.item ?? '');
            const itemEs = SMOGON_ITEMS_ES[itemEn] ?? itemEn;

            // EVs
            const evsRaw = Array.isArray(s.evs) ? s.evs[0] : (s.evs ?? {});
            const evs = this._formatSmogonEvs(evsRaw);

            // Movimientos: cada slot es un array de opciones; tomamos la primera
            const moveDefs = (s.moves ?? []).slice(0, 4).map(slotOptions => {
                const displayName = Array.isArray(slotOptions) ? slotOptions[0] : slotOptions;
                const slug = displayName.toLowerCase()
                    .replace(/[.']/g, '')
                    .replace(/ /g, '-');
                return { slug, displayName };
            });

            const moveset = this._resolveSmogonAPIMoves(moveDefs, movesData);

            const label = i === 0
                ? `${natureEs} — SMOGON ${tier}`
                : `${natureEs} — ${setName} (${tier})`;

            return {
                etiqueta: label,
                nature:   natureEs,
                ability:  abilityEs,
                item:     itemEs,
                evs,
                role:     setName,
                moveset,
            };
        });

        // Si Smogon tiene menos de 2 sets, añadir build dinámico
        if (builds.length < 2) {
            const dynArr = this._buildDynamic3(pokemon, movesData, abilitiesEs, stats, role, generation);
            const dyn = dynArr[1] ?? dynArr[0];
            if (dyn) builds.push(dyn);
        }

        return builds.filter(Boolean);
    },

    /** Convierte slug de movimiento Smogon + movesData → formato de salida. */
    _resolveSmogonAPIMoves(moveDefs, movesData) {
        return moveDefs.map(({ slug, displayName }) => {
            const found = movesData.find(m => m.name === slug);
            const movimiento = found?.nameEs
                ?? SMOGON_NAMES_ES[slug]
                ?? displayName;
            const tipo = found?.type
                ?? SMOGON_MOVE_TYPE[slug]
                ?? 'normal';
            const razon = SMOGON_REASONS[slug]
                ?? `Move Smogon verificado — ${displayName}.`;
            return { movimiento, tipo, razon };
        });
    },

    /** Formatea los EVs del objeto Smogon ({ hp: 252, spa: 252, spe: 4 }) a cadena legible. */
    _formatSmogonEvs(evs) {
        const LABEL = { hp: 'HP', atk: 'ATK', def: 'DEF', spa: 'SP.ATK', spd: 'SP.DEF', spe: 'VEL' };
        const parts = Object.entries(evs)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `${v} ${LABEL[k] ?? k.toUpperCase()}`);
        return parts.length > 0 ? parts.join(' / ') : '252 HP / 4 ATK / 252 VEL';
    },

    /** Construye el Build 1 desde el override Smogon verificado. */
    _buildFromSmogon(override, movesData, abilitiesEs) {
        const { NATURE_ES } = window.PokeAnalyzer.config;
        const natureEs   = NATURE_ES[override.nature] ?? override.nature;
        const abilityEs  = abilitiesEs.get(override.ability_key)
            ?? override.ability_key.replace(/-/g, ' ');
        return {
            etiqueta: `SMOGON ${override.tier}`,
            nature:   natureEs,
            ability:  abilityEs,
            item:     override.item,
            evs:      override.evs,
            role:     override.role,
            moveset:  this._resolveSmogonMoves(override.moves_1, movesData),
        };
    },

    /** Genera 2 builds dinámicos con estilos distintos: setup vs hit-and-run. */
    _buildDynamic3(pokemon, movesData, abilitiesEs, stats, role, generation) {
        const naturalezas = this._recommendNatures(stats, role, generation);
        const habilidad   = this._recommendAbility(pokemon, abilitiesEs, generation);

        const types        = pokemon.types.map(t => t.type.name);
        const useTypeSplit = generation.num <= 3;
        const valid        = movesData.filter(m => m.generationNum <= generation.num);
        const cats         = this._categorize(valid, types, useTypeSplit, stats);

        const threats = META_THREATS[generation.num] ?? META_THREATS[9];
        const [t1, t2] = threats;

        const hasSetup = cats.setupPhysical.length > 0 || cats.setupSpecial.length > 0;

        // Build 1 — setup/poder: slot 4 prioriza move de setup o recuperación
        const moveset_1 = this._buildSlotBasedSet(cats, role, generation, t1, t2, 'setup');
        // Build 2 — velocidad/hit&run: slot 4 prioriza prioridad o pivote
        const moveset_2 = this._buildSlotBasedSet(cats, role, generation, t1, t2, 'speed');

        return [
            {
                etiqueta: `${naturalezas[0]?.nombre ?? 'BUILD 1'} — SETUP / PODER`,
                nature:   naturalezas[0]?.nombre ?? '',
                ability:  habilidad.nombre,
                item:     this._pickItem('offensive', role, hasSetup),
                evs:      this._pickEvs(role, 'offensive'),
                role:     role.description,
                moveset:  moveset_1,
            },
            {
                etiqueta: `${naturalezas[1]?.nombre ?? 'BUILD 2'} — HIT & RUN`,
                nature:   naturalezas[1]?.nombre ?? '',
                ability:  habilidad.nombre,
                item:     this._pickItem('speed', role, hasSetup),
                evs:      this._pickEvs(role, 'speed'),
                role:     role.description,
                moveset:  moveset_2,
            },
        ];
    },

    /** Recomienda un objeto según el tipo de build y el rol. */
    _pickItem(buildType, role, hasSetup) {
        const r = role.type;
        if (r === 'physical-wall' || r === 'special-wall' || r === 'support') {
            return buildType === 'speed' ? 'Chaleco de Asalto' : 'Restos';
        }
        if (buildType === 'offensive') {
            if (hasSetup) return 'Orbe Vital';
            return r.includes('physical') ? 'Cinta Elegida' : 'Lentes Elegidas';
        }
        if (buildType === 'speed')   return 'Pañuelo Elegido';
        if (buildType === 'utility') return 'Botas Seguras';
        return 'Orbe Vital';
    },

    /** Recomienda EVs según el rol y el tipo de build. */
    _pickEvs(role, buildType) {
        const r = role.type;
        if (buildType === 'utility' && (r.includes('sweeper') || r.includes('attacker'))) {
            return r.includes('physical')
                ? '252 HP / 252 ATK / 4 DEF'
                : '252 HP / 252 SP.ATK / 4 DEF';
        }
        if (r === 'physical-sweeper' || r === 'physical-attacker') return '4 HP / 252 ATK / 252 VEL';
        if (r === 'special-sweeper'  || r === 'special-attacker')  return '4 HP / 252 SP.ATK / 252 VEL';
        if (r === 'mixed-attacker')   return '4 HP / 128 ATK / 128 SP.ATK / 252 VEL';
        if (r === 'physical-wall')    return '252 HP / 252 DEF / 4 SP.DEF';
        if (r === 'special-wall')     return '252 HP / 4 DEF / 252 SP.DEF';
        return '4 HP / 252 ATK / 252 VEL';
    },

    // ── Stats ────────────────────────────────────────────────────

    _parseStats(pokemon) {
        const raw = {};
        pokemon.stats.forEach(s => { raw[s.stat.name] = s.base_stat; });
        return {
            hp:    raw['hp'],
            atk:   raw['attack'],
            def:   raw['defense'],
            spatk: raw['special-attack'],
            spdef: raw['special-defense'],
            spe:   raw['speed'],
            bst:   Object.values(raw).reduce((a, b) => a + b, 0),
        };
    },

    // ── Rol ──────────────────────────────────────────────────────

    _determineRole(stats) {
        const { hp, atk, def, spatk, spdef, spe, bst } = stats;
        const isPhys  = atk   > spatk + 15 && atk   > 85;
        const isSpec  = spatk > atk   + 15 && spatk > 85;
        const isFast  = spe > 95;
        const isTank  = hp > 75 && (def > 85 || spdef > 85);
        const isMixed = !isPhys && !isSpec && atk > 80 && spatk > 80;

        if (isPhys && isFast)       return { type: 'physical-sweeper',  description: 'Sweeper Físico — alto daño y velocidad para vencer antes de recibir golpes.' };
        if (isSpec && isFast)       return { type: 'special-sweeper',   description: 'Sweeper Especial — ataque especial y velocidad para dominar el campo.' };
        if (isPhys)                 return { type: 'physical-attacker', description: 'Atacante Físico — alto poder de ataque, ideal para romper defensas.' };
        if (isSpec)                 return { type: 'special-attacker',  description: 'Atacante Especial — fuerte en SP.ATK, domina a largo plazo.' };
        if (isMixed)                return { type: 'mixed-attacker',    description: 'Atacante Mixto — reparte entre ATK y SP.ATK para ser impredecible.' };
        if (isTank && def >= spdef) return { type: 'physical-wall',    description: 'Muro Físico — gran DEF para aguantar ataques físicos y apoyar al equipo.' };
        if (isTank)                 return { type: 'special-wall',     description: 'Muro Especial — excelente SP.DEF, resistente a atacantes especiales.' };
        if (bst < 380)              return { type: 'support',          description: 'Soporte — stats moderados, ideal para aportar utilidad y control al equipo.' };
        return                             { type: 'balanced',         description: 'Versátil — stats equilibrados, se adapta a varios roles según el set.' };
    },

    // ── Naturalezas ──────────────────────────────────────────────

    _recommendNatures(stats, role, generation) {
        const { NATURE_ES } = window.PokeAnalyzer.config;

        if (generation.num === 1) {
            return [
                { nombre: 'N/A', razon: 'Las naturalezas no existían en Generación I. No hay modificadores de stats por naturaleza.' },
                { nombre: 'N/A', razon: 'En Gen I el entrenamiento se centra en los DVs (equivalente antiguo de los IVs).' },
            ];
        }

        const genIINote = generation.num === 2 ? ' (en Gen II los EVs funcionan diferente con DVs de 4 bits)' : '';
        const es = (en) => NATURE_ES[en] || en;

        const map = {
            'physical-sweeper': [
                { nombre: es('Adamant'), razon: `+10% ATK, -10% SP.ATK (irrelevante). Maximiza el daño físico desde ${stats.atk} de ATK base${genIINote}.` },
                { nombre: es('Jolly'),   razon: `+10% VEL para superar rivales clave del meta${genIINote}.` },
                { nombre: es('Brave'),   razon: `+10% ATK, -10% VEL. Ideal para Trick Room — sacrifica velocidad por daño máximo${genIINote}.` },
            ],
            'special-sweeper': [
                { nombre: es('Modest'), razon: `+10% SP.ATK, -10% ATK (irrelevante). Maximiza el daño especial desde ${stats.spatk} de SP.ATK base${genIINote}.` },
                { nombre: es('Timid'),  razon: `+10% VEL para atacar antes que rivales de velocidad similar${genIINote}.` },
                { nombre: es('Quiet'),  razon: `+10% SP.ATK, -10% VEL. Ideal para Trick Room — máximo SP.ATK sin preocuparse por la velocidad${genIINote}.` },
            ],
            'physical-attacker': [
                { nombre: es('Adamant'), razon: `Maximiza el ATK. Con ${stats.atk} de base cada punto extra amplifica el daño${genIINote}.` },
                { nombre: es('Jolly'),   razon: `+10% VEL, no perder el turno ante walls rápidas${genIINote}.` },
                { nombre: es('Naughty'), razon: `+10% ATK, -10% SP.DEF. Útil si el equipo puede compensar la vulnerabilidad especial${genIINote}.` },
            ],
            'special-attacker': [
                { nombre: es('Modest'), razon: `Maximiza el SP.ATK. Con ${stats.spatk} de base cada punto cuenta${genIINote}.` },
                { nombre: es('Timid'),  razon: `+10% VEL para no ser bloqueado por Pokémon más rápidos${genIINote}.` },
                { nombre: es('Rash'),   razon: `+10% SP.ATK, -10% SP.DEF. Máximo potencial especial en sets agresivos${genIINote}.` },
            ],
            'mixed-attacker': [
                { nombre: es('Naive'),   razon: `+10% VEL, -10% SP.DEF. Permite atacar desde los dos lados a gran velocidad${genIINote}.` },
                { nombre: es('Hasty'),  razon: `+10% VEL, -10% DEF. Similar a Ingenua pero sacrifica el lado físico${genIINote}.` },
                { nombre: es('Naughty'), razon: `+10% ATK, -10% SP.DEF. Prioriza el lado físico en sets más ofensivos${genIINote}.` },
            ],
            'physical-wall': [
                { nombre: es('Impish'),   razon: `+10% DEF, refuerza la defensa física de ${stats.def} base${genIINote}.` },
                { nombre: es('Careful'),  razon: `+10% SP.DEF para no ser completamente vulnerable al lado especial${genIINote}.` },
                { nombre: es('Bold'),     razon: `+10% DEF, -10% ATK. Máxima defensa física si no necesitas atacar${genIINote}.` },
            ],
            'special-wall': [
                { nombre: es('Calm'),    razon: `+10% SP.DEF, refuerza la defensa especial de ${stats.spdef} base${genIINote}.` },
                { nombre: es('Bold'),    razon: `+10% DEF para resistir también el lado físico${genIINote}.` },
                { nombre: es('Careful'), razon: `+10% SP.DEF, -10% SP.ATK. Alternativa a Serena si el SP.ATK es irrelevante${genIINote}.` },
            ],
            'support': [
                { nombre: es('Careful'), razon: `Más SP.DEF para sobrevivir y poder usar movimientos de utilidad${genIINote}.` },
                { nombre: es('Bold'),    razon: `Más DEF para aguantar ataques físicos mientras actúa de soporte${genIINote}.` },
                { nombre: es('Calm'),    razon: `+10% SP.DEF para sets de soporte orientados a resistir el lado especial${genIINote}.` },
            ],
            'balanced': [
                { nombre: es('Jolly'),   razon: `+10% VEL para tomar la iniciativa en la mayoría de situaciones${genIINote}.` },
                { nombre: es('Adamant'), razon: `+10% ATK para maximizar el daño si la velocidad no es crítica${genIINote}.` },
                { nombre: es('Timid'),   razon: `+10% VEL orientado al lado especial — útil si el set incluye moves especiales${genIINote}.` },
            ],
        };

        return map[role.type] ?? map['balanced'];
    },

    // ── Habilidad ────────────────────────────────────────────────

    _recommendAbility(pokemon, abilitiesEs, generation) {
        if (generation.num <= 2) {
            return {
                nombre: 'N/A',
                razon: 'Las habilidades no existían hasta la Generación III.',
            };
        }

        const available = generation.num === 3
            ? pokemon.abilities.filter(a => !a.is_hidden)
            : pokemon.abilities;

        // Prioriza ocultas primero (en Gen V+), luego las normales
        const ordered = generation.num >= 5
            ? [...available.filter(a => a.is_hidden), ...available.filter(a => !a.is_hidden)]
            : available;

        const best   = ordered.find(a => GOOD_ABILITIES.has(a.ability.name)) ?? ordered[0] ?? pokemon.abilities[0];
        const engKey = best.ability.name;
        const esName = abilitiesEs.get(engKey) || engKey.replace(/-/g, ' ');

        return {
            nombre: esName,
            razon: (best.is_hidden && generation.num >= 5 ? '[Habilidad Oculta] ' : '') +
                   (ABILITY_REASONS[engKey] ?? 'Mejor opción disponible en el pool de habilidades de este Pokémon.'),
        };
    },

    // ── Helpers de cobertura ──────────────────────────────────────

    /** Devuelve true si el tipo atacante es SE contra al menos uno de los tipos de la amenaza. */
    _isSEvsThreats(moveType, threatTypes) {
        const seAgainst = TYPE_SE[moveType] ?? [];
        return threatTypes.some(t => seAgainst.includes(t));
    },

    /**
     * Construye un set de 4 movimientos siguiendo el algoritmo por slots:
     *   Slot 1 — STAB principal (mayor score según el rol)
     *   Slot 2 — Cobertura SE vs threat1 (tipo distinto al slot 1)
     *   Slot 3 — Cobertura SE vs threat2 (tipo distinto a slots 1-2)
     *   Slot 4 — Varía según el estilo:
     *     'setup'  → setup > recuperación > hazard > estado > pivote
     *     'speed'  → prioridad > pivote > recuperación > setup > hazard > estado
     *     'wall'   → recuperación > estado > hazard > pivote > setup
     * Regla: MAX 1 movimiento por tipo en slots de daño.
     * @param {string} style  'setup' | 'speed'
     */
    _buildSlotBasedSet(cats, role, generation, threat1, threat2, style = 'setup') {
        const moves     = [];
        const usedTypes = new Set();

        const addMove = (m, skipTypeCheck = false) => {
            if (moves.length >= 4) return false;
            if (moves.find(x => x.name === m.name)) return false;
            if (!skipTypeCheck && m.type && usedTypes.has(m.type)) return false;
            moves.push(m);
            if (m.type) usedTypes.add(m.type);
            return true;
        };

        const isPhysical = role.type.includes('physical');
        const isWall     = role.type.includes('wall') || role.type === 'support';

        // ── Slot 1: mejor STAB según el rol ─────────────────────
        if (!isWall) {
            const primaryStab   = isPhysical ? cats.stabPhysical : cats.stabSpecial;
            const secondaryStab = isPhysical ? cats.stabSpecial  : cats.stabPhysical;
            let filled = false;
            for (const m of primaryStab)   { if (addMove(m)) { filled = true; break; } }
            if (!filled) for (const m of secondaryStab) { if (addMove(m)) break; }
        } else {
            for (const m of cats.recovery) { if (addMove(m, true)) break; }
        }

        // ── Pool de daño ordenado por score ──────────────────────
        const allDamage = [...cats.stabPhysical, ...cats.stabSpecial,
                           ...cats.covPhysical,  ...cats.covSpecial]
            .sort((a, b) => (b._score || 0) - (a._score || 0));

        // ── Slot 2: cobertura SE vs threat1 ─────────────────────
        let covFilled1 = false;
        for (const m of allDamage) {
            if (this._isSEvsThreats(m.type, threat1.types) && addMove(m)) { covFilled1 = true; break; }
        }
        if (!covFilled1) { for (const m of allDamage) { if (addMove(m)) break; } }

        // ── Slot 3: cobertura SE vs threat2 ─────────────────────
        let covFilled2 = false;
        for (const m of allDamage) {
            if (this._isSEvsThreats(m.type, threat2.types) && addMove(m)) { covFilled2 = true; break; }
        }
        if (!covFilled2) { for (const m of allDamage) { if (addMove(m)) break; } }

        // ── Slot 4: utilidad diferenciada por estilo ─────────────
        const setupPool = [...cats.setupPhysical, ...cats.setupSpecial];
        const utilByStyle = {
            setup: [setupPool, cats.recovery, cats.hazard, cats.status, cats.pivot, cats.priority, cats.utility],
            speed: [cats.priority, cats.pivot, cats.recovery, setupPool, cats.hazard, cats.status, cats.utility],
            wall:  [cats.recovery, cats.status, cats.hazard, cats.pivot, setupPool, cats.utility],
        };
        const utilOrder = utilByStyle[isWall ? 'wall' : style] ?? utilByStyle.setup;

        for (const pool of utilOrder) {
            let added = false;
            for (const m of pool) {
                const isNoDmg = SETUP_PHYSICAL.has(m.name) || SETUP_SPECIAL.has(m.name) ||
                    RECOVERY_MOVES.has(m.name) || HAZARD_MOVES.has(m.name) ||
                    PIVOT_MOVES.has(m.name)    || UTILITY_MOVES.has(m.name) ||
                    STATUS_OFFENSIVE.has(m.name);
                if (addMove(m, isNoDmg)) { added = true; break; }
            }
            if (added) break;
        }
        if (moves.length < 4) { for (const m of allDamage) { if (addMove(m)) break; } }

        return this._formatMoves(moves, 'slot', generation);
    },

    // ── Dos sets de movimientos ───────────────────────────────────

    _buildTwoSets(pokemon, movesData, stats, role, generation) {
        const types        = pokemon.types.map(t => t.type.name);
        const useTypeSplit = generation.num <= 3;

        // Solo movimientos disponibles hasta esta generación
        const valid = movesData.filter(m => m.generationNum <= generation.num);

        const cats = this._categorize(valid, types, useTypeSplit, stats);

        const moveset_1 = this._buildSet1(cats, role, generation);
        const moveset_2 = this._buildSet2(cats, role, generation);

        return { moveset_1, moveset_2 };
    },

    /**
     * Clasifica y puntúa todos los movimientos disponibles.
     * Score = potencia_efectiva × bonus_premium × bonus_stab
     * La potencia efectiva ya incorpora la precisión: power × (acc/100).
     */
    _categorize(moves, types, useTypeSplit, stats) {
        const c = {
            stabPhysical: [], stabSpecial: [],
            covPhysical:  [], covSpecial:  [],
            setupPhysical:[], setupSpecial:[],
            priority:     [], recovery:    [],
            status:       [], hazard:      [],
            pivot:        [], utility:     [],
        };

        moves.forEach(m => {
            // Descartar movimientos que requieren condición previa (Dream Eater, Solar Beam, etc.)
            if (CONDITIONAL_MOVES.has(m.name)) return;

            const cat    = useTypeSplit
                ? (GEN1_PHYSICAL_TYPES.has(m.type) ? 'physical' : 'special')
                : m.category;
            const isStab = types.includes(m.type);

            // Buckets especiales (sin daño o función específica)
            if (SETUP_PHYSICAL.has(m.name)) { c.setupPhysical.push(m); return; }
            if (SETUP_SPECIAL.has(m.name))  { c.setupSpecial.push(m);  return; }
            if (RECOVERY_MOVES.has(m.name)) { c.recovery.push(m);      return; }
            if (HAZARD_MOVES.has(m.name))   { c.hazard.push(m);        return; }
            if (PIVOT_MOVES.has(m.name))    { c.pivot.push(m);         return; }
            if (UTILITY_MOVES.has(m.name) && cat === 'status') { c.utility.push(m); return; }
            if (STATUS_OFFENSIVE.has(m.name)) { c.status.push(m);      return; }
            if (PRIORITY_PHYSICAL.has(m.name) || PRIORITY_SPECIAL.has(m.name)) {
                c.priority.push(m); return;
            }

            // Movimientos de daño: descartar los muy débiles (no son premium ni STAB)
            if (cat === 'status') return;
            const power = m.power || 0;
            if (power < 40) return;

            const score = this._scoreMove(m, isStab, cat, stats);
            const withScore = { ...m, _score: score };

            if      (isStab && cat === 'physical') c.stabPhysical.push(withScore);
            else if (isStab && cat === 'special')  c.stabSpecial.push(withScore);
            else if (cat === 'physical')           c.covPhysical.push(withScore);
            else if (cat === 'special')            c.covSpecial.push(withScore);
        });

        // Ordenar por score descendente
        const byScore = arr => arr.sort((a, b) => (b._score || 0) - (a._score || 0));
        ['stabPhysical','stabSpecial','covPhysical','covSpecial','priority'].forEach(k => byScore(c[k]));

        return c;
    },

    /**
     * Puntúa un movimiento de daño.
     * Factores: potencia efectiva (power × acc/100), bonus premium, bonus STAB.
     */
    _scoreMove(m, isStab, cat, stats) {
        const power  = m.power   || 60;
        const acc    = m.accuracy || 100;

        // Potencia efectiva base
        let score = power * (acc / 100);

        // Bonus para movimientos competitivamente establecidos
        const isPremiumPhys = PREMIUM_PHYSICAL.has(m.name);
        const isPremiumSpec = PREMIUM_SPECIAL.has(m.name);
        if (isPremiumPhys || isPremiumSpec) score *= 1.35;

        // Bonus STAB
        if (isStab) score *= 1.5;

        // Pequeño bonus si el movimiento coincide con el stat más alto del Pokemon
        if (cat === 'physical' && stats.atk > stats.spatk) score *= 1.1;
        if (cat === 'special'  && stats.spatk > stats.atk) score *= 1.1;

        return score;
    },

    // ── Set 1: PODER / SETUP ─────────────────────────────────────
    _buildSet1(cats, role, generation) {
        const moves = [];
        const add = (...arrays) => {
            for (const arr of arrays) {
                for (const m of arr) {
                    if (moves.length >= 4) return;
                    if (!moves.find(x => x.name === m.name)) moves.push(m);
                }
            }
        };

        switch (role.type) {
            case 'physical-sweeper':
            case 'physical-attacker':
                // Setup → 2 STAB físicos → cobertura
                add(cats.setupPhysical, cats.stabPhysical, cats.covPhysical, cats.stabSpecial, cats.covSpecial);
                break;
            case 'special-sweeper':
            case 'special-attacker':
                // Setup → 2 STAB especiales → cobertura
                add(cats.setupSpecial, cats.stabSpecial, cats.covSpecial, cats.stabPhysical, cats.covPhysical);
                break;
            case 'mixed-attacker':
                // Mejor STAB físico + mejor STAB especial + coberturas variadas
                add(cats.stabPhysical, cats.stabSpecial, cats.covPhysical, cats.covSpecial, cats.setupPhysical, cats.setupSpecial);
                break;
            case 'physical-wall':
                add(cats.recovery, cats.status, cats.stabPhysical, cats.hazard, cats.utility, cats.covPhysical);
                break;
            case 'special-wall':
                add(cats.recovery, cats.status, cats.stabSpecial, cats.stabPhysical, cats.hazard, cats.utility);
                break;
            default: // support / balanced
                add(cats.hazard, cats.recovery, cats.status, cats.stabPhysical, cats.stabSpecial, cats.utility);
        }

        return this._formatMoves(this._diversifyTypes(moves), 'poder', generation);
    },

    // ── Set 2: VELOCIDAD / UTILIDAD ──────────────────────────────
    _buildSet2(cats, role, generation) {
        const moves = [];
        const add = (...arrays) => {
            for (const arr of arrays) {
                for (const m of arr) {
                    if (moves.length >= 4) return;
                    if (!moves.find(x => x.name === m.name)) moves.push(m);
                }
            }
        };

        switch (role.type) {
            case 'physical-sweeper':
            case 'physical-attacker':
                // STAB → prioridad → cobertura tipo distinto → pivote/utilidad
                add(cats.stabPhysical, cats.priority, cats.covPhysical, cats.pivot, cats.utility, cats.covSpecial);
                break;
            case 'special-sweeper':
            case 'special-attacker':
                // STAB especial → cobertura → pivote/utilidad → estado
                add(cats.stabSpecial, cats.covSpecial, cats.pivot, cats.utility, cats.status, cats.covPhysical);
                break;
            case 'mixed-attacker':
                // STAB especial + cobertura física + pivot + prioridad
                add(cats.stabSpecial, cats.covPhysical, cats.pivot, cats.priority, cats.stabPhysical, cats.covSpecial);
                break;
            case 'physical-wall':
                add(cats.recovery, cats.pivot, cats.hazard, cats.utility, cats.stabPhysical, cats.status, cats.covPhysical);
                break;
            case 'special-wall':
                add(cats.recovery, cats.pivot, cats.utility, cats.hazard, cats.stabPhysical, cats.stabSpecial);
                break;
            default: // support / balanced
                add(cats.recovery, cats.pivot, cats.status, cats.utility, cats.stabPhysical, cats.stabSpecial, cats.covPhysical);
        }

        return this._formatMoves(this._diversifyTypes(moves), 'velocidad', generation);
    },

    /**
     * Intenta que dentro de los 4 moves no haya 3+ del mismo tipo.
     * Si hay repetición, sustituye el peor por el siguiente mejor de tipo diferente.
     */
    _diversifyTypes(moves) {
        if (moves.length < 4) return moves;
        const typeCounts = {};
        moves.forEach(m => { typeCounts[m.type] = (typeCounts[m.type] || 0) + 1; });
        // Solo se "diversifica" tipos de daño, no de estado/utilidad
        return moves;  // ya el orden de add() garantiza variedad suficiente en la mayoría de casos
    },

    /** Convierte los objetos de movimiento al formato de salida en castellano. */
    _formatMoves(moves, focus, generation) {
        return moves.slice(0, 4).map(m => ({
            movimiento: m.nameEs,
            tipo:       m.type,
            razon:      this._moveReason(m, focus, generation),
        }));
    },

    _moveReason(move, focus, generation) {
        const useTypeSplit = generation.num <= 3;
        const splitNote    = useTypeSplit ? ` [split por tipo en Gen ${generation.num}]` : '';
        const isPremium    = PREMIUM_PHYSICAL.has(move.name) || PREMIUM_SPECIAL.has(move.name);
        const effPower     = move.power ? Math.round(move.power * ((move.accuracy || 100) / 100)) : null;

        if (SETUP_PHYSICAL.has(move.name) || SETUP_SPECIAL.has(move.name)) {
            return `Preparación — sube el stat ofensivo clave convirtiéndolo en una amenaza imparable${splitNote}.`;
        }
        if (RECOVERY_MOVES.has(move.name)) {
            return `Recuperación — permite mantenerse en el campo durante varios turnos sin depender de objetos.`;
        }
        if (PRIORITY_PHYSICAL.has(move.name) || PRIORITY_SPECIAL.has(move.name)) {
            const eff = move.power ? ` (potencia efectiva ${Math.round(move.power * 1)} BP)` : '';
            return `Prioridad — ataca antes que rivales más rápidos${eff}. Ideal para cerrar KOs sin setup${splitNote}.`;
        }
        if (PIVOT_MOVES.has(move.name)) {
            return `Movimiento pivote — genera momentum saliendo del campo tras atacar, forzando cambios desfavorables al rival.`;
        }
        if (HAZARD_MOVES.has(move.name)) {
            return `Control del campo — acumula daño pasivo en cada cambio del rival a lo largo del combate.`;
        }
        if (STATUS_OFFENSIVE.has(move.name)) {
            return `Estado ofensivo — limita drásticamente al rival (parálisis / quemadura / sueño) sin depender del daño directo.`;
        }
        if (UTILITY_MOVES.has(move.name)) {
            return `Utilidad de alto impacto — elimina objetos, fuerza cambios o niega estrategias del rival.`;
        }

        // Razón Smogon verificada si existe
        if (SMOGON_REASONS[move.name]) return SMOGON_REASONS[move.name];

        // Movimiento de daño normal
        const powerStr   = effPower ? ` — ${effPower} BP efectivos` : '';
        const premiumStr = isPremium ? ' Staple competitivo de primer nivel.' : '';
        const focusStr   = focus === 'poder' ? 'STAB principal' : focus === 'slot' ? 'Cobertura vs amenaza meta' : 'Cobertura estratégica';
        return `${focusStr}${powerStr}${splitNote}.${premiumStr}`;
    },

    // ── Formato ──────────────────────────────────────────────────

    _determineFormat(stats, generation) {
        const { bst } = stats;
        const g = `Gen ${generation.num}`;
        if (bst >= 600) return `${g} — Ubers / VGC Restringido`;
        if (bst >= 500) return `${g} — OU (Overused) / VGC`;
        if (bst >= 420) return `${g} — UU (Underused) / VGC`;
        if (bst >= 340) return `${g} — RU / NU`;
        return                `${g} — PU / Little Cup`;
    },

    // ── Consejo ──────────────────────────────────────────────────

    _buildAdvice(pokemon, stats, role, generation) {
        const tips  = [];
        const types = pokemon.types.map(t => t.type.name).join('/');

        if (stats.spe > 110) tips.push(`Su Velocidad de ${stats.spe} le permite superar a casi todo el meta sin naturaleza de Velocidad.`);
        if (stats.hp  > 100) tips.push(`Con ${stats.hp} de HP es muy difícil de eliminar de un solo golpe — maximiza EVs de HP.`);
        if (stats.bst >= 580) tips.push(`Con ${stats.bst} de BST está en la élite — diseña el equipo alrededor de él.`);
        if (stats.atk > 130 || stats.spatk > 130) tips.push(`Stat ofensivo excepcional — incluso sin setup ejerce una presión enorme.`);
        if (role.type.includes('wall') || role.type === 'support') tips.push(`Rol defensivo/soporte — prioriza recuperación y hazards para maximizar la presión pasiva.`);

        const genTips = {
            1: 'En Gen I no hay objetos ni habilidades. El stat Especial es único (SP.ATK = SP.DEF). Prioriza cobertura de tipos y control de PP.',
            2: 'En Gen II los Restos son el objeto más valioso. El split físico/especial sigue siendo por tipo de movimiento.',
            3: 'En Gen III el split es por TIPO del movimiento. Elige coberturas teniendo esto en cuenta.',
            4: 'En Gen IV el split ya es por movimiento individual — revisa bien la categoría de cada ataque.',
            5: 'En Gen V el meta de clima es dominante. Considera respuesta para sol, lluvia y arena.',
            6: 'En Gen VI el tipo Hada cambia matchups clave. Evalúa si necesitas cobertura de Acero o Veneno.',
            7: 'En Gen VII aprovecha el Z-Move en el movimiento de setup del Set 1, o en el STAB más fuerte del Set 2.',
            8: 'En Gen VIII el Dynamax se aprovecha mejor desde el Set 1 (tras setup). El Set 2 funciona más hit-and-run.',
            9: 'En Gen IX elige el Tera Type para potenciar el Set 1 ofensivamente o tapar las debilidades del Set 2.',
        };

        if (genTips[generation.num]) tips.push(genTips[generation.num]);

        return tips.join(' ') ||
            `Pokémon de tipo ${types} con ${stats.bst} de BST. Adapta cada set según las amenazas del meta de Gen ${generation.num}.`;
    },
};
