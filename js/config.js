/**
 * config.js — Constantes y datos estáticos.
 * Expone window.PokeAnalyzer.config
 */

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.config = {

    POKEAPI_BASE: 'https://pokeapi.co/api/v2',
    SPRITE_RAW:   'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon',

    STAT_META: {
        'hp':              { label: 'PS',      cls: 'sb-hp'    },
        'attack':          { label: 'Atq',     cls: 'sb-atk'   },
        'defense':         { label: 'Def',     cls: 'sb-def'   },
        'special-attack':  { label: 'At.Esp',  cls: 'sb-spatk' },
        'special-defense': { label: 'Def.Esp', cls: 'sb-spdef' },
        'speed':           { label: 'Vel',     cls: 'sb-speed' },
    },

    // Traducciones oficiales de tipos al castellano
    TYPE_ES: {
        normal:   'Normal',   fire:     'Fuego',    water:    'Agua',
        electric: 'Eléctrico',grass:    'Planta',   ice:      'Hielo',
        fighting: 'Lucha',    poison:   'Veneno',   ground:   'Tierra',
        flying:   'Volador',  psychic:  'Psíquico', bug:      'Bicho',
        rock:     'Roca',     ghost:    'Fantasma', dragon:   'Dragón',
        dark:     'Siniestro',steel:    'Acero',    fairy:    'Hada',
    },

    TYPE_COLORS: {
        normal:   { bg: '#A8A878', fg: '#111' },
        fire:     { bg: '#F08030', fg: '#111' },
        water:    { bg: '#6890F0', fg: '#111' },
        electric: { bg: '#F8D030', fg: '#111' },
        grass:    { bg: '#78C850', fg: '#111' },
        ice:      { bg: '#98D8D8', fg: '#111' },
        fighting: { bg: '#C03028', fg: '#fff' },
        poison:   { bg: '#A040A0', fg: '#fff' },
        ground:   { bg: '#E0C068', fg: '#111' },
        flying:   { bg: '#A890F0', fg: '#111' },
        psychic:  { bg: '#F85888', fg: '#fff' },
        bug:      { bg: '#A8B820', fg: '#111' },
        rock:     { bg: '#B8A038', fg: '#111' },
        ghost:    { bg: '#705898', fg: '#fff' },
        dragon:   { bg: '#7038F8', fg: '#fff' },
        dark:     { bg: '#705848', fg: '#fff' },
        steel:    { bg: '#B8B8D0', fg: '#111' },
        fairy:    { bg: '#EE99AC', fg: '#111' },
    },

    /**
     * Type chart (Gen 6+) — multiplicadores de daño por tipo.
     * Nota: para Gen < 6, el renderer trata Fairy como Normal (aprox).
     */
    TYPE_CHART: {
        normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
        fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
        water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
        electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
        grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
        ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
        fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
        poison:   { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
        ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
        flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
        psychic:  { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
        bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
        rock:     { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
        ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
        dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
        dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
        steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, fairy: 2, steel: 0.5 },
        fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
    },

    // Traducciones oficiales de naturalezas al castellano (nombres del juego)
    NATURE_ES: {
        'Hardy':   'Fuerte',    'Lonely':  'Huraña',    'Brave':   'Audaz',
        'Adamant': 'Firme',     'Naughty': 'Pícara',    'Bold':    'Osada',
        'Docile':  'Dócil',     'Relaxed': 'Plácida',   'Impish':  'Agitada',
        'Lax':     'Floja',     'Timid':   'Miedosa',   'Hasty':   'Activa',
        'Serious': 'Seria',     'Jolly':   'Alegre',    'Naive':   'Ingenua',
        'Modest':  'Modesta',   'Mild':    'Afable',    'Quiet':   'Mansa',
        'Bashful': 'Tímida',    'Rash':    'Alocada',   'Calm':    'Serena',
        'Gentle':  'Amable',    'Sassy':   'Grosera',   'Careful': 'Cauta',
        'Quirky':  'Rara',
    },

    // Efectos de naturaleza sobre stats (+10% / -10%)
    // up = stat potenciado, down = stat reducido, null = neutra
    NATURE_EFFECTS: {
        'Hardy':   null,
        'Lonely':  { up: 'attack',          down: 'defense' },
        'Brave':   { up: 'attack',          down: 'speed' },
        'Adamant': { up: 'attack',          down: 'special-attack' },
        'Naughty': { up: 'attack',          down: 'special-defense' },
        'Bold':    { up: 'defense',         down: 'attack' },
        'Docile':  null,
        'Relaxed': { up: 'defense',         down: 'speed' },
        'Impish':  { up: 'defense',         down: 'special-attack' },
        'Lax':     { up: 'defense',         down: 'special-defense' },
        'Timid':   { up: 'speed',           down: 'attack' },
        'Hasty':   { up: 'speed',           down: 'defense' },
        'Serious': null,
        'Jolly':   { up: 'speed',           down: 'special-attack' },
        'Naive':   { up: 'speed',           down: 'special-defense' },
        'Modest':  { up: 'special-attack',  down: 'attack' },
        'Mild':    { up: 'special-attack',  down: 'defense' },
        'Quiet':   { up: 'special-attack',  down: 'speed' },
        'Bashful': null,
        'Rash':    { up: 'special-attack',  down: 'special-defense' },
        'Calm':    { up: 'special-defense', down: 'attack' },
        'Gentle':  { up: 'special-defense', down: 'defense' },
        'Sassy':   { up: 'special-defense', down: 'speed' },
        'Careful': { up: 'special-defense', down: 'special-attack' },
        'Quirky':  null,
    },

    // Generación de introducción de cada objeto competitivo (nombre inglés → gen)
    ITEM_INTRO_GEN: {
        'Leftovers': 2, 'Light Ball': 2, 'Thick Club': 2, 'Metal Coat': 2,
        'Scope Lens': 2, 'King\'s Rock': 2, 'Pink Bow': 2,
        'Charcoal': 2, 'Mystic Water': 2, 'Miracle Seed': 2, 'Magnet': 2,
        'Black Belt': 2, 'Never-Melt Ice': 2, 'Poison Barb': 2,
        'Soft Sand': 2, 'Sharp Beak': 2, 'Hard Stone': 2,
        'Silver Powder': 2, 'Spell Tag': 2,
        'Choice Band': 3, 'White Herb': 3, 'Shell Bell': 3, 'Silk Scarf': 3,
        'Salac Berry': 3, 'Petaya Berry': 3, 'Liechi Berry': 3,
        'Lum Berry': 3, 'Sitrus Berry': 3, 'Custap Berry': 3,
        'Colbur Berry': 3, 'Shuca Berry': 3, 'Yache Berry': 3,
        'Chople Berry': 3, 'Occa Berry': 3, 'Wacan Berry': 3,
        'Charti Berry': 3, 'Kasib Berry': 3, 'Rindo Berry': 3,
        'Passho Berry': 3, 'Aguav Berry': 3, 'Figy Berry': 3,
        'Iapapa Berry': 3, 'Mago Berry': 3, 'Wiki Berry': 3,
        'Choice Specs': 4, 'Choice Scarf': 4, 'Life Orb': 4,
        'Focus Sash': 4, 'Expert Belt': 4, 'Black Sludge': 4,
        'Flame Orb': 4, 'Toxic Orb': 4, 'Power Herb': 4,
        'Light Clay': 4, 'Wide Lens': 4, 'Razor Claw': 4, 'Razor Fang': 4,
        'Metronome': 4, 'Iron Ball': 4, 'Lagging Tail': 4,
        'Muscle Band': 4, 'Wise Glasses': 4, 'Sticky Barb': 4,
        'Eviolite': 5, 'Rocky Helmet': 5, 'Air Balloon': 5, 'Red Card': 5,
        'Ring Target': 5, 'Shed Shell': 5, 'Bright Powder': 5,
        'Quick Claw': 5,
        'Assault Vest': 6, 'Weakness Policy': 6, 'Safety Goggles': 6,
        'Protective Pads': 6,
        'Terrain Extender': 7, 'Grassy Seed': 7, 'Electric Seed': 7,
        'Psychic Seed': 7, 'Misty Seed': 7,
        'Heavy-Duty Boots': 8, 'Throat Spray': 8, 'Utility Umbrella': 8,
        'Covert Cloak': 9, 'Clear Amulet': 9, 'Booster Energy': 9,
        'Loaded Dice': 9, 'Ability Shield': 9, 'Mirror Herb': 9,
        'Punching Glove': 9,
    },

    // Mapa de nombre de generación de PokeAPI → número
    GEN_NUM_MAP: {
        'generation-i':    1, 'generation-ii':   2, 'generation-iii': 3,
        'generation-iv':   4, 'generation-v':    5, 'generation-vi':  6,
        'generation-vii':  7, 'generation-viii': 8, 'generation-ix':  9,
    },

    GENERATIONS: [
        {
            num: 1, label: 'GEN I', years: '1996–1999',
            games: 'Rojo / Azul / Amarillo', gamesShort: 'RBY',
            mechanics: `Sin habilidades ni naturalezas. Split físico/especial por TIPO. Sin objetos. Solo 151 Pokémon.`,
        },
        {
            num: 2, label: 'GEN II', years: '1999–2002',
            games: 'Oro / Plata / Cristal', gamesShort: 'GSC',
            mechanics: `Sin habilidades. Naturalezas existen (IVs de 4 bits). Objetos equipables introducidos. Tipos Acero y Siniestro.`,
        },
        {
            num: 3, label: 'GEN III', years: '2002–2006',
            games: 'Rubí / Zafiro / Esmeralda / FR / HV', gamesShort: 'RSE',
            mechanics: `Habilidades normales (sin ocultas). Naturalezas (+10%/-10%). IVs/EVs modernos. Split por TIPO todavía.`,
        },
        {
            num: 4, label: 'GEN IV', years: '2006–2010',
            games: 'Diamante / Perla / Platino / HG / SS', gamesShort: 'DPPt',
            mechanics: `Split físico/especial por MOVIMIENTO. VGC oficial. Stealth Rock fundamental. Sin habilidades ocultas.`,
        },
        {
            num: 5, label: 'GEN V', years: '2010–2013',
            games: 'Negro / Blanco / N2 / B2', gamesShort: 'BW',
            mechanics: `Habilidades ocultas (Dream World). Meta de clima automático dominante. Eviolite introducida.`,
        },
        {
            num: 6, label: 'GEN VI', years: '2013–2016',
            games: 'X / Y / ORAS', gamesShort: 'XY',
            mechanics: `Tipo Hada introducido. Megaevoluciones disponibles. Clima nerfado (5 turnos).`,
        },
        {
            num: 7, label: 'GEN VII', years: '2016–2019',
            games: 'Sol / Luna / US / UM', gamesShort: 'SM',
            mechanics: `Z-Moves disponibles (uno por combate). Formas de Alola. Terrenos clave en el meta.`,
        },
        {
            num: 8, label: 'GEN VIII', years: '2019–2022',
            games: 'Espada / Escudo / BDSP', gamesShort: 'SwSh',
            mechanics: `Dynamax/Gigantamax (3 turnos). Movepool recortado. Sin Z-moves en línea principal.`,
        },
        {
            num: 9, label: 'GEN IX', years: '2022–hoy',
            games: 'Escarlata / Púrpura', gamesShort: 'SV',
            mechanics: `Terastal (cambio de tipo en combate). Tera Blast. Pokémon Paradox. Meta VGC actual.`,
        },
    ],
};
