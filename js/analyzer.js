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
    'draco-meteor':    'Cometa Draco',
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
    'nasty-plot':      'Maquinación',
    'make-it-rain':    'Lluvia de Dinero',
    'swords-dance':    'Danza Espada',
    'kowtow-cleave':   'Tajo Kowtow',
    'iron-head':       'Cabeza de Hierro',
    'sucker-punch':    'Golpe Bajo',
    'close-combat':    'A Bocajarro',
    'moonblast':       'Fuerza Lunar',
    'knock-off':       'Desarme',
    'extreme-speed':   'Velocidad Extrema',
    'bullet-punch':    'Puño Bala',
    'toxic-spikes':    'Pinchos Tóxicos',
    'scald':           'Escaldar',
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
    'calm-mind':       'Paz Mental',
    'soft-boiled':     'Huevo Pasado por Agua',
    'dazzling-gleam':  'Brillo Mágico',
    'aura-sphere':     'Esfera Aural',
    'psystrike':       'Psicogolpe',
    'thunderbolt':     'Rayo',
    'volt-switch':     'Relevo Eléctrico',
    'grass-knot':      'Hierba Lazo',
    'quick-attack':    'Ataque Rápido',
    'outrage':         'Enfado',
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
// GEN 1-3: Split físico/especial por TIPO (no por movimiento)
// En Gen 1-3, la categoría del movimiento se determina por su tipo.
// ================================================================
const GEN1_PHYSICAL_TYPES = new Set([
    'normal', 'fighting', 'poison', 'ground', 'flying', 'bug', 'rock', 'ghost', 'steel',
]);

// Listas de movimientos premium por categoría para builds dinámicos
const PREMIUM_PHYSICAL = new Set([
    'earthquake', 'close-combat', 'stone-edge', 'knock-off', 'u-turn', 'iron-head',
    'crunch', 'play-rough', 'brave-bird', 'flare-blitz', 'waterfall', 'ice-punch',
    'thunder-punch', 'fire-punch', 'dragon-claw', 'outrage', 'x-scissor', 'megahorn',
    'leaf-blade', 'wood-hammer', 'seed-bomb', 'shadow-claw', 'iron-tail', 'drill-run',
    'high-horsepower', 'liquidation', 'rock-slide', 'head-smash', 'bullet-punch',
    'extreme-speed', 'sucker-punch', 'aqua-jet', 'mach-punch', 'ice-shard',
    'body-slam', 'facade', 'swords-dance', 'dragon-dance', 'scale-shot',
    'headlong-rush', 'wave-crash', 'triple-axel', 'flower-trick', 'kowtow-cleave',
    'sacred-sword', 'poison-jab', 'gunk-shot', 'zen-headbutt', 'throat-chop',
    'fire-fang', 'acrobatics',
]);

const PREMIUM_SPECIAL = new Set([
    'flamethrower', 'fire-blast', 'hydro-pump', 'surf', 'thunderbolt', 'thunder',
    'ice-beam', 'blizzard', 'psychic', 'shadow-ball', 'dark-pulse', 'moonblast',
    'draco-meteor', 'focus-blast', 'aura-sphere', 'energy-ball', 'grass-knot',
    'flash-cannon', 'sludge-bomb', 'earth-power', 'hurricane', 'air-slash',
    'bug-buzz', 'dazzling-gleam', 'overheat', 'scald', 'volt-switch',
    'psyshock', 'psystrike', 'nasty-plot', 'calm-mind', 'quiver-dance',
    'torch-song', 'make-it-rain', 'stored-power', 'expanding-force',
    'mystical-fire', 'power-gem', 'sludge-wave',
]);

const PIVOT_MOVES = new Set([
    'u-turn', 'volt-switch', 'flip-turn', 'teleport', 'parting-shot', 'baton-pass',
]);

const RECOVERY_MOVES = new Set([
    'recover', 'roost', 'soft-boiled', 'slack-off', 'rest', 'milk-drink',
    'shore-up', 'morning-sun', 'moonlight', 'synthesis', 'strength-sap', 'wish',
]);

const HAZARD_MOVES = new Set([
    'stealth-rock', 'spikes', 'toxic-spikes', 'sticky-web',
]);

const SUPPORT_MOVES = new Set([
    'will-o-wisp', 'thunder-wave', 'toxic', 'defog', 'rapid-spin', 'taunt',
    'whirlwind', 'encore', 'light-screen', 'reflect', 'aurora-veil', 'protect',
]);

// ================================================================
// MÓDULO
// ================================================================

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.analyzer = {

    async analyze(pokemon, movesData, abilitiesEs, generation) {
        const stats  = this._parseStats(pokemon);
        const role   = this._determineRole(stats);
        const builds = this._buildDynamic(pokemon, movesData, abilitiesEs, stats, role, generation);
        const formato    = this._determineFormat(stats, generation);
        const consejo    = this._buildAdvice(pokemon, stats, role, generation);
        return { builds, rol: role.description, formato, consejo_extra: consejo };
    },

    /**
     * Genera builds 100% dinámicos basados en stats + movesData de PokéAPI.
     * Respeta el split físico/especial por TIPO en Gen 1-3.
     *
     * FLUJO ESTRICTO:
     *   1. Decidir orientación (físico/especial) por stats
     *   2. Elegir naturaleza PRIMERO
     *   3. Filtrar moves coherentes con la naturaleza
     *   4. Elegir objeto
     *   5. Validar: Choice → prohibir status/recovery
     */
    _buildDynamic(pokemon, movesData, abilitiesEs, stats, role, generation) {
        const { NATURE_ES } = window.PokeAnalyzer.config;
        const genNum = generation.num;
        const types = pokemon.types.map(t => t.type.name);

        // Filtrar movimientos por generación y asignar categoría efectiva
        const available = movesData
            .filter(m => m.generationNum <= genNum)
            .map(m => ({
                ...m,
                effectiveCategory: genNum <= 3
                    ? (m.category === 'status' ? 'status' : (GEN1_PHYSICAL_TYPES.has(m.type) ? 'physical' : 'special'))
                    : m.category,
            }));

        // ── PASO 1: Determinar orientación por stats ──
        const isPhysical = stats.atk > stats.spatk;
        const isSpecial  = stats.spatk > stats.atk;
        const isMixed    = role.type === 'mixed-attacker';
        const isDefensive = role.type.includes('wall') || role.type === 'support';

        // Habilidad en español
        const firstAb = pokemon.abilities?.[0]?.ability?.name;
        const abilityEs = firstAb ? (abilitiesEs.get(firstAb) ?? firstAb) : '—';

        const builds = [];

        // ── BUILD 1: Set ofensivo principal ──
        const offBuild = this._buildOffensiveSet(available, types, stats, isPhysical, isMixed, role, abilityEs, genNum);
        if (offBuild) builds.push(offBuild);

        // ── BUILD 2: Set defensivo/soporte ──
        const defBuild = this._buildDefensiveSet(available, types, stats, isPhysical, abilityEs, genNum);
        if (defBuild) builds.push(defBuild);

        // Fallback: si no se generó ningún build
        if (builds.length === 0) {
            builds.push({
                etiqueta: 'ANÁLISIS BÁSICO',
                nature: '—', ability: abilityEs, item: '—',
                evs: '—', role: role.description,
                moveset: [{ movimiento: 'Sin movimientos válidos', tipo: 'normal',
                    razon: `No hay movimientos disponibles para Gen ${genNum}.` }],
            });
        }

        return builds;
    },

    /**
     * Build ofensivo con coherencia estricta naturaleza → moves → objeto.
     */
    _buildOffensiveSet(moves, types, stats, isPhysical, isMixed, role, abilityEs, genNum) {
        const { NATURE_ES } = window.PokeAnalyzer.config;

        // ── PASO 2: Elegir naturaleza PRIMERO ──
        const nature = this._pickOffensiveNature(stats, isPhysical, isMixed);
        const natureEs = NATURE_ES[nature] ?? nature;

        // ── PASO 3: Filtrar moves coherentes con la naturaleza ──
        const allowedCategory = this._natureToCategory(nature);
        const selectedMoves = this._selectCoherentMoves(moves, types, allowedCategory, isMixed, genNum);
        if (selectedMoves.length === 0) return null;

        // ── PASO 4: Elegir objeto ──
        const item = this._pickOffensiveItem(role, isPhysical, selectedMoves);

        // ── PASO 5: Validar Choice ──
        const finalMoves = this._enforceChoiceRule(selectedMoves, moves, allowedCategory, item, types);

        const evs = this._pickEvs(isPhysical, isMixed, stats);
        const roleLabel = isPhysical ? 'Atacante Físico' : 'Atacante Especial';

        return {
            etiqueta: `${natureEs} — ANÁLISIS DINÁMICO`,
            nature: natureEs,
            ability: abilityEs,
            item,
            evs,
            role: roleLabel,
            moveset: finalMoves.slice(0, 4).map(m => ({
                movimiento: m.nameEs,
                tipo: m.type,
                razon: this._moveReason(m, types, genNum),
            })),
        };
    },

    /**
     * Build defensivo/soporte. Item siempre es Restos (no Choice).
     */
    _buildDefensiveSet(moves, types, stats, isPhysical, abilityEs, genNum) {
        const { NATURE_ES } = window.PokeAnalyzer.config;

        const defMoves = this._selectDefensiveMoves(moves, types, genNum);
        if (defMoves.length < 3) return null;

        const defNature = isPhysical ? 'Impish' : 'Calm';
        return {
            etiqueta: `${NATURE_ES[defNature] ?? defNature} — SOPORTE/DEFENSIVO`,
            nature: NATURE_ES[defNature] ?? defNature,
            ability: abilityEs,
            item: 'Restos',
            evs: '252 HP / 252 DEF / 4 SP.DEF',
            role: 'Soporte Defensivo',
            moveset: defMoves.slice(0, 4).map(m => ({
                movimiento: m.nameEs,
                tipo: m.type,
                razon: this._moveReason(m, types, genNum),
            })),
        };
    },

    // ── REGLA 1: Coherencia Naturaleza-Movimiento ─────────────────

    /** Decide naturaleza basándose en stats ANTES de seleccionar moves. */
    _pickOffensiveNature(stats, isPhysical, isMixed) {
        if (isMixed) return stats.spe > 95 ? 'Hasty' : 'Lonely';
        if (isPhysical) return stats.spe > 95 ? 'Jolly' : 'Adamant';
        return stats.spe > 95 ? 'Timid' : 'Modest';
    },

    /** Mapea naturaleza → categoría de ataque permitida. */
    _natureToCategory(nature) {
        const PHYSICAL_NATURES = new Set(['Jolly', 'Adamant', 'Impish', 'Careful']);
        const SPECIAL_NATURES  = new Set(['Timid', 'Modest', 'Calm', 'Bold']);
        if (PHYSICAL_NATURES.has(nature)) return 'physical';
        if (SPECIAL_NATURES.has(nature))  return 'special';
        return 'mixed'; // Hasty, Lonely, Naive, etc.
    },

    /**
     * Selecciona moves COHERENTES con la categoría de la naturaleza.
     * - Si categoría = 'physical': SOLO ataques physical + utilidad
     * - Si categoría = 'special':  SOLO ataques special + utilidad
     * - Si categoría = 'mixed':    ambos permitidos
     * Los setups deben coincidir: Swords Dance solo en physical, Nasty Plot solo en special.
     */
    _selectCoherentMoves(moves, types, allowedCategory, isMixed, genNum) {
        const stab = types;

        // Filtrar ataques por categoría permitida
        const attacks = moves.filter(m => {
            if (m.effectiveCategory === 'status') return false;
            if (!m.power || m.power <= 0) return false;
            if (allowedCategory === 'mixed') return true;
            return m.effectiveCategory === allowedCategory;
        });

        // Filtrar setups coherentes con la categoría
        const setups = moves.filter(m => {
            if (m.effectiveCategory !== 'status') return false;
            if (allowedCategory === 'physical' || allowedCategory === 'mixed')
                if (PREMIUM_PHYSICAL.has(m.name)) return true;
            if (allowedCategory === 'special' || allowedCategory === 'mixed')
                if (PREMIUM_SPECIAL.has(m.name)) return true;
            return false;
        });

        const pivots = moves.filter(m => PIVOT_MOVES.has(m.name));

        // Ordenar ataques: STAB > Premium > Power
        const sorted = attacks.sort((a, b) => {
            const aStab = stab.includes(a.type) ? 1.5 : 1;
            const bStab = stab.includes(b.type) ? 1.5 : 1;
            const premiumList = allowedCategory === 'physical' ? PREMIUM_PHYSICAL : PREMIUM_SPECIAL;
            const aPremium = premiumList.has(a.name) ? 1.2 : 1;
            const bPremium = premiumList.has(b.name) ? 1.2 : 1;
            return (b.power * bStab * bPremium) - (a.power * aStab * aPremium);
        });

        // Seleccionar con cobertura de tipos
        const selected = [];
        const usedTypes = new Set();

        // 1. Mejor STAB
        const bestStab = sorted.find(m => stab.includes(m.type));
        if (bestStab) { selected.push(bestStab); usedTypes.add(bestStab.type); }

        // 2. Segundo STAB
        if (stab.length > 1) {
            const secondStab = sorted.find(m => stab.includes(m.type) && !usedTypes.has(m.type));
            if (secondStab) { selected.push(secondStab); usedTypes.add(secondStab.type); }
        }

        // 3. Cobertura
        for (const m of sorted) {
            if (selected.length >= 3) break;
            if (!usedTypes.has(m.type) && !selected.includes(m)) {
                selected.push(m); usedTypes.add(m.type);
            }
        }

        // 4. Slot 4: setup coherente o pivote
        if (selected.length < 4 && setups.length > 0) {
            selected.push(setups[0]);
        } else if (selected.length < 4 && pivots.length > 0) {
            selected.push(pivots[0]);
        }

        // Rellenar con ataques de la categoría correcta
        for (const m of sorted) {
            if (selected.length >= 4) break;
            if (!selected.includes(m)) selected.push(m);
        }

        return selected.slice(0, 4);
    },

    // ── REGLA 2: Check de Objeto Choice ───────────────────────────

    /**
     * Si el objeto es Choice (Band/Specs/Scarf), PROHIBE status y recovery.
     * Reemplaza cualquier move de status con un ataque o pivote adicional.
     */
    _enforceChoiceRule(selectedMoves, allMoves, allowedCategory, item, types) {
        const CHOICE_ITEMS = new Set(['Cinta Elegida', 'Lentes Elegidas', 'Pañuelo Elegido']);
        if (!CHOICE_ITEMS.has(item)) return selectedMoves;

        // Separar: ataques/pivotes OK, status/recovery prohibidos
        const valid   = selectedMoves.filter(m =>
            (m.power && m.power > 0) || PIVOT_MOVES.has(m.name));
        const invalid = selectedMoves.filter(m =>
            !(m.power && m.power > 0) && !PIVOT_MOVES.has(m.name));

        if (invalid.length === 0) return selectedMoves;

        // Buscar reemplazos: ataques de la categoría correcta que no estén ya
        const usedNames = new Set(valid.map(m => m.name));
        const replacements = allMoves
            .filter(m => {
                if (usedNames.has(m.name)) return false;
                if (m.effectiveCategory === 'status') return false;
                if (!m.power || m.power <= 0) return false;
                if (allowedCategory === 'mixed') return true;
                return m.effectiveCategory === allowedCategory;
            })
            .sort((a, b) => {
                const aStab = types.includes(a.type) ? 1.5 : 1;
                const bStab = types.includes(b.type) ? 1.5 : 1;
                return (b.power * bStab) - (a.power * aStab);
            });

        // Si no hay pivotes, intentar añadir uno
        const hasPivot = valid.some(m => PIVOT_MOVES.has(m.name));
        if (!hasPivot) {
            const pivot = allMoves.find(m => PIVOT_MOVES.has(m.name) && !usedNames.has(m.name));
            if (pivot) {
                valid.push(pivot);
                usedNames.add(pivot.name);
            }
        }

        // Rellenar slots vacíos con ataques
        for (const m of replacements) {
            if (valid.length >= 4) break;
            if (!usedNames.has(m.name)) {
                valid.push(m);
                usedNames.add(m.name);
            }
        }

        return valid.slice(0, 4);
    },

    // ── REGLA 3: Traducciones desde movesData (PokeAPI) ───────────
    // Ya resuelta: movesData viene con nameEs desde pokeapi.js._fetchMove()
    // No se usa SMOGON_NAMES_ES para builds dinámicos.

    /** Selecciona movimientos para un set defensivo/soporte. */
    _selectDefensiveMoves(moves, types, genNum) {
        const selected = [];

        // 1. Recuperación
        const recovery = moves.find(m => RECOVERY_MOVES.has(m.name));
        if (recovery) selected.push(recovery);

        // 2. Hazard
        const hazard = moves.find(m => HAZARD_MOVES.has(m.name));
        if (hazard) selected.push(hazard);

        // 3. Soporte/estado
        const support = moves.filter(m => SUPPORT_MOVES.has(m.name));
        for (const m of support) {
            if (selected.length >= 3) break;
            if (!selected.includes(m)) selected.push(m);
        }

        // 4. Un ataque STAB para no ser taunt-bait
        const stabAtk = moves.find(m =>
            types.includes(m.type) && m.power && m.power > 0 && !selected.includes(m));
        if (stabAtk && selected.length < 4) selected.push(stabAtk);

        // Rellenar
        for (const m of moves.filter(m => m.power > 0)) {
            if (selected.length >= 4) break;
            if (!selected.includes(m)) selected.push(m);
        }

        return selected.slice(0, 4);
    },

    /** Elige EVs según el rol. */
    _pickEvs(isPhysical, isMixed, stats) {
        if (isMixed) return '252 ATK / 4 SP.ATK / 252 VEL';
        if (isPhysical) return '252 ATK / 4 HP / 252 VEL';
        return '252 SP.ATK / 4 HP / 252 VEL';
    },

    /** Elige objeto ofensivo. Setup → Life Orb; sin setup → Choice. */
    _pickOffensiveItem(role, isPhysical, moves) {
        const hasSetup = moves.some(m => m.effectiveCategory === 'status' &&
            (PREMIUM_PHYSICAL.has(m.name) || PREMIUM_SPECIAL.has(m.name)));

        if (role.type.includes('wall')) return 'Restos';
        if (hasSetup) return 'Orbe Vital';
        if (isPhysical) return 'Cinta Elegida';
        return 'Lentes Elegidas';
    },

    /** Genera una razón competitiva para un movimiento. */
    _moveReason(move, types, genNum) {
        const isStab = types.includes(move.type);
        const catNote = genNum <= 3
            ? ` (${GEN1_PHYSICAL_TYPES.has(move.type) ? 'FÍSICO' : 'ESPECIAL'} por tipo en Gen ${genNum})`
            : '';

        if (move.power === null || move.power === 0) {
            if (PIVOT_MOVES.has(move.name)) return 'Pivote — genera momentum saliendo tras atacar.';
            if (RECOVERY_MOVES.has(move.name)) return 'Recuperación — mantiene la presencia en el campo.';
            if (HAZARD_MOVES.has(move.name)) return 'Hazard — daño pasivo en cada cambio del rival.';
            if (PREMIUM_PHYSICAL.has(move.name) || PREMIUM_SPECIAL.has(move.name))
                return 'Setup — potencia el daño para barrer al equipo rival.';
            return 'Utilidad — control o soporte al equipo.';
        }

        const stabText = isStab ? 'STAB' : 'Cobertura';
        return `${stabText} — ${move.power} BP${catNote}.`;
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
        const g = `Gen ${generation.num}`;
        const { bst } = stats;
        if (bst >= 600) return `${g} — Ubers (estimado)`;
        if (bst >= 500) return `${g} — OU (estimado)`;
        if (bst >= 420) return `${g} — UU (estimado)`;
        if (bst >= 340) return `${g} — RU / NU (estimado)`;
        return                `${g} — PU / LC (estimado)`;
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
            7: 'En Gen VII aprovecha el Z-Move para potenciar tu STAB principal o para hacer un setup devastador.',
            8: 'En Gen VIII el Dynamax permite convertir cualquier ataque en un boost. Úsalo en el turno más impactante.',
            9: 'En Gen IX elige el Tera Type para potenciar tu STAB ofensivamente o tapar debilidades defensivas.',
        };

        if (genTips[generation.num]) tips.push(genTips[generation.num]);

        return tips.join(' ') ||
            `Pokémon de tipo ${types} con ${stats.bst} de BST. Adapta cada set según las amenazas del meta de Gen ${generation.num}.`;
    },
};
