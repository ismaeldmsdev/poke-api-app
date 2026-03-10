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

    // Mapa de nombre de generación de PokeAPI → número
    GEN_NUM_MAP: {
        'generation-i':    1, 'generation-ii':   2, 'generation-iii': 3,
        'generation-iv':   4, 'generation-v':    5, 'generation-vi':  6,
        'generation-vii':  7, 'generation-viii': 8, 'generation-ix':  9,
    },

    GENERATIONS: [
        {
            num: 1, label: 'GEN I', years: '1996–1999', games: 'Rojo / Azul / Amarillo',
            mechanics: `Sin habilidades ni naturalezas. Split físico/especial por TIPO. Sin objetos. Solo 151 Pokémon.`,
        },
        {
            num: 2, label: 'GEN II', years: '1999–2002', games: 'Oro / Plata / Cristal',
            mechanics: `Sin habilidades. Naturalezas existen (IVs de 4 bits). Objetos equipables introducidos. Tipos Acero y Siniestro.`,
        },
        {
            num: 3, label: 'GEN III', years: '2002–2006', games: 'Rubí / Zafiro / Esmeralda / FR / HV',
            mechanics: `Habilidades normales (sin ocultas). Naturalezas (+10%/-10%). IVs/EVs modernos. Split por TIPO todavía.`,
        },
        {
            num: 4, label: 'GEN IV', years: '2006–2010', games: 'Diamante / Perla / Platino / HG / SS',
            mechanics: `Split físico/especial por MOVIMIENTO. VGC oficial. Stealth Rock fundamental. Sin habilidades ocultas.`,
        },
        {
            num: 5, label: 'GEN V', years: '2010–2013', games: 'Negro / Blanco / N2 / B2',
            mechanics: `Habilidades ocultas (Dream World). Meta de clima automático dominante. Eviolite introducida.`,
        },
        {
            num: 6, label: 'GEN VI', years: '2013–2016', games: 'X / Y / ORAS',
            mechanics: `Tipo Hada introducido. Megaevoluciones disponibles. Clima nerfado (5 turnos).`,
        },
        {
            num: 7, label: 'GEN VII', years: '2016–2019', games: 'Sol / Luna / US / UM',
            mechanics: `Z-Moves disponibles (uno por combate). Formas de Alola. Terrenos clave en el meta.`,
        },
        {
            num: 8, label: 'GEN VIII', years: '2019–2022', games: 'Espada / Escudo / BDSP',
            mechanics: `Dynamax/Gigantamax (3 turnos). Movepool recortado. Sin Z-moves en línea principal.`,
        },
        {
            num: 9, label: 'GEN IX', years: '2022–hoy', games: 'Escarlata / Púrpura',
            mechanics: `Terastal (cambio de tipo en combate). Tera Blast. Pokémon Paradox. Meta VGC actual.`,
        },
    ],
};
