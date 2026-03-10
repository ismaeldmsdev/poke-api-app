/**
 * analyzer.js — Motor de análisis competitivo.
 * Obtiene sets verificados de Smogon y los presenta en castellano.
 * Expone window.PokeAnalyzer.analyzer
 */

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

// (Sets competitivos se obtienen en tiempo real de la API Smogon)

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
    'Sticky Barb':        'Púas Adhesivas',
    'Weakness Policy':    'Seguro Debilidad',
    'Mental Herb':        'Hierba Mental',
    'Terrain Extender':   'Extensión Terreno',
    'Protective Pads':    'Guantes Protectores',
    'Shed Shell':         'Caparazón Muda',
    'Red Card':           'Tarjeta Roja',
    'Razor Claw':         'Garra Afilada',
    'Razor Fang':         'Colmillo Afilado',
    'King\'s Rock':       'Roca del Rey',
    'Colbur Berry':       'Baya Yecana',
    'Shuca Berry':        'Baya Acardo',
    'Yache Berry':        'Baya Chardón',
    'Chople Berry':       'Baya Amichan',
    'Occa Berry':         'Baya Monli',
    'Wacan Berry':        'Baya Gualot',
    'Charti Berry':       'Baya Saurio',
    'Kasib Berry':        'Baya Bsjal',
    'Rindo Berry':        'Baya Kebia',
    'Passho Berry':       'Baya Yeniu',
    'Aguav Berry':        'Baya Aguav',
    'Figy Berry':         'Baya Higog',
    'Iapapa Berry':       'Baya Papaya',
    'Mago Berry':         'Baya Taperus',
    'Wiki Berry':         'Baya Wiki',
    'Petaya Berry':       'Baya Yapati',
    'Liechi Berry':       'Baya Zanama',
    'Grassy Seed':        'Semilla Hierba',
    'Electric Seed':      'Semilla Eléctrica',
    'Psychic Seed':       'Semilla Psíquica',
    'Misty Seed':         'Semilla Bruma',
    'Utility Umbrella':   'Parasol Multiusos',
    'Safety Goggles':     'Gafas Protectoras',
    'Bright Powder':      'Polvo Brillo',
    'Quick Claw':         'Garra Veloz',
    'Ring Target':        'Diana',
    'Lagging Tail':       'Cola Lenta',
    'Iron Ball':          'Bola de Hierro',
    'Muscle Band':        'Cinta Musculosa',
    'Wise Glasses':       'Gafas Inteligentes',
    'Metronome':          'Metrónomo',
    'Ability Shield':     'Escudo Habilidad',
    'Mirror Herb':        'Hierba Espejo',
    'Punching Glove':     'Guante de Boxeo',
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

    async analyze(pokemon, movesData, abilitiesEs, generation, smogonData = null) {
        const stats  = this._parseStats(pokemon);
        const role   = this._determineRole(stats);
        const builds = await this._buildCompetitiveBuilds(pokemon, movesData, abilitiesEs, stats, role, generation, smogonData);
        const formato    = this._determineFormat(stats, generation);
        const consejo    = this._buildAdvice(pokemon, stats, role, generation);
        return { builds, rol: role.description, formato, consejo_extra: consejo };
    },

    /** Genera builds competitivos usando datos de la API Smogon. */
    async _buildCompetitiveBuilds(pokemon, movesData, abilitiesEs, stats, role, generation, smogonData = null) {
        if (smogonData) {
            return await this._buildFromSmogonAPI(smogonData, pokemon, movesData, abilitiesEs, stats, role, generation);
        }
        // Sin datos de Smogon: devolver build informativo vacío
        return [{
            etiqueta: 'SIN DATOS SMOGON',
            nature:   '—',
            ability:  '—',
            item:     '—',
            evs:      '—',
            role:     `No hay sets Smogon para Gen ${generation.num}`,
            moveset:  [{
                movimiento: 'Sin datos',
                tipo: 'normal',
                razon: `Este Pokémon no tiene sets verificados en Smogon para Gen ${generation.num}. Prueba otra generación.`,
            }],
        }];
    },

    /**
     * Construye builds usando datos live de la API Smogon.
     * Los sets de Smogon tienen movimientos en inglés con nombre display (ej. "Draco Meteor").
     * Muestra todos los sets disponibles (hasta 3).
     */
    async _buildFromSmogonAPI(smogonData, pokemon, movesData, abilitiesEs, stats, role, generation) {
        const { NATURE_ES } = window.PokeAnalyzer.config;
        const { tier, sets } = smogonData;
        const setNames = Object.keys(sets);

        // Mostrar hasta 3 sets de Smogon
        const maxSets = Math.min(setNames.length, 3);

        const builds = [];
        for (let i = 0; i < maxSets; i++) {
            const setName = setNames[i];
            const s = sets[setName];

            // Naturaleza
            const natureEn = Array.isArray(s.nature) ? s.nature[0] : (s.nature ?? 'Hardy');
            const natureEs = NATURE_ES[natureEn] ?? natureEn;

            // Habilidad: puede estar ausente (Pokemon con 1 sola ability)
            let abilityEs = '—';
            if (s.ability) {
                const abilityEn  = Array.isArray(s.ability) ? s.ability[0] : s.ability;
                const abilityKey = abilityEn.toLowerCase().replace(/ /g, '-').replace(/[.']/g, '');
                abilityEs = abilitiesEs.get(abilityKey) ?? abilityEn;
            } else {
                const firstAb = pokemon.abilities?.[0]?.ability?.name;
                if (firstAb) abilityEs = abilitiesEs.get(firstAb) ?? firstAb;
            }

            // Objeto
            const itemEn = Array.isArray(s.item) ? s.item[0] : (s.item ?? '');
            const itemEs = SMOGON_ITEMS_ES[itemEn] ?? itemEn;

            // EVs
            const evsRaw = Array.isArray(s.evs) ? s.evs[0] : (s.evs ?? {});
            const evs = this._formatSmogonEvs(evsRaw);

            // Movimientos: cada slot es string o array de opciones; tomamos la primera
            const moveDefs = (s.moves ?? []).slice(0, 4).map(slotOptions => {
                const displayName = Array.isArray(slotOptions) ? slotOptions[0] : slotOptions;
                const slug = displayName.toLowerCase()
                    .replace(/[.']/g, '')
                    .replace(/ /g, '-');
                return { slug, displayName };
            });

            const moveset = await this._resolveSmogonAPIMoves(moveDefs, movesData);

            const label = i === 0
                ? `${natureEs} — SMOGON ${tier}`
                : `${natureEs} — ${setName} (${tier})`;

            builds.push({
                etiqueta: label,
                nature:   natureEs,
                ability:  abilityEs,
                item:     itemEs,
                evs,
                role:     setName,
                moveset,
            });
        }

        return builds;
    },

    /**
     * Convierte slug de movimiento Smogon + movesData → formato de salida.
     * Si el movimiento no está en movesData, lo busca en PokéAPI para obtener el nombre en español.
     */
    async _resolveSmogonAPIMoves(moveDefs, movesData) {
        const { pokeAPI } = window.PokeAnalyzer;
        const results = await Promise.all(moveDefs.map(async ({ slug, displayName }) => {
            // Buscar primero en movesData (ya descargados)
            const found = movesData.find(m => m.name === slug);
            if (found) {
                return {
                    movimiento: found.nameEs,
                    tipo: found.type,
                    razon: SMOGON_REASONS[slug] ?? `Move Smogon verificado — ${found.nameEs}.`,
                };
            }

            // Buscar en diccionario estático
            if (SMOGON_NAMES_ES[slug]) {
                return {
                    movimiento: SMOGON_NAMES_ES[slug],
                    tipo: SMOGON_MOVE_TYPE[slug] ?? 'normal',
                    razon: SMOGON_REASONS[slug] ?? `Move Smogon verificado — ${SMOGON_NAMES_ES[slug]}.`,
                };
            }

            // Buscar en PokéAPI on-the-fly
            const fetched = await pokeAPI.fetchMoveSpanish(slug);
            if (fetched) {
                return {
                    movimiento: fetched.nameEs,
                    tipo: fetched.type,
                    razon: SMOGON_REASONS[slug] ?? `Move Smogon verificado — ${fetched.nameEs}.`,
                };
            }

            // Último fallback: nombre display de Smogon tal cual
            return {
                movimiento: displayName,
                tipo: SMOGON_MOVE_TYPE[slug] ?? 'normal',
                razon: SMOGON_REASONS[slug] ?? `Move Smogon verificado — ${displayName}.`,
            };
        }));
        return results;
    },

    /** Formatea los EVs del objeto Smogon ({ hp: 252, spa: 252, spe: 4 }) a cadena legible. */
    _formatSmogonEvs(evs) {
        const LABEL = { hp: 'HP', atk: 'ATK', def: 'DEF', spa: 'SP.ATK', spd: 'SP.DEF', spe: 'VEL' };
        const parts = Object.entries(evs)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `${v} ${LABEL[k] ?? k.toUpperCase()}`);
        return parts.length > 0 ? parts.join(' / ') : '252 HP / 4 ATK / 252 VEL';
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
