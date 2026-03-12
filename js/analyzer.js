/**
 * analyzer.js — Motor de análisis competitivo.
 * Fuente principal: JSON oficial de Smogon (pkmn.github.io).
 * Fallback: análisis dinámico por stats + movesData de PokéAPI
 *           (solo cuando NO hay datos de Smogon).
 * Expone window.PokeAnalyzer.analyzer
 */

// ================================================================
// GEN 1-3: Split físico/especial por TIPO (no por movimiento)
// ================================================================
const GEN1_PHYSICAL_TYPES = new Set([
    'normal', 'fighting', 'poison', 'ground', 'flying', 'bug', 'rock', 'ghost', 'steel',
]);

// Listas premium para fallback dinámico
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
// COMMUNITY BUILDS — Sets populares históricos no-meta
// Builds "gimmick" o de aventura conocidos por la comunidad.
// ================================================================
const COMMUNITY_BUILDS_DB = {
    'charizard': [
        {
            setName: 'Tambor + Baya Ziena',
            description: 'Clásico: Tambor + Baya Ziena para barrer tras potenciarse.',
            natureEn: 'Jolly', item: 'Salac Berry',
            evs: '4 PS / 252 Atq / 252 Vel',
            moves: ['belly-drum', 'fire-punch', 'earthquake', 'thunder-punch'],
        },
        {
            setName: 'Poder Solar (Especial)',
            description: 'Aprovecha Solar Power bajo sol para daño especial devastador.',
            natureEn: 'Timid', item: 'Choice Specs',
            evs: '252 At.Esp / 4 PS / 252 Vel',
            moves: ['fire-blast', 'air-slash', 'focus-blast', 'dragon-pulse'],
        },
    ],
    'gengar': [
        {
            setName: 'Sustituto + Anulación',
            description: 'Sustituto + Anulación para bloquear al rival y forzar cambios.',
            natureEn: 'Timid', item: 'Leftovers',
            evs: '4 PS / 252 At.Esp / 252 Vel',
            moves: ['substitute', 'disable', 'shadow-ball', 'focus-blast'],
        },
        {
            setName: 'Canto Mortal (Trampa)',
            description: 'Canto Mortal + Mal de Ojo para eliminar amenazas clave.',
            natureEn: 'Timid', item: 'Leftovers',
            evs: '252 PS / 4 At.Esp / 252 Vel',
            moves: ['perish-song', 'mean-look', 'substitute', 'protect'],
        },
    ],
    'blissey': [
        {
            setName: 'Toxic Stall',
            description: 'Set clásico de agotamiento con Tóxico + Amortiguador para desgastar al rival.',
            natureEn: 'Bold', item: 'Leftovers',
            evs: '252 PS / 252 Def / 4 Def.Esp',
            moves: ['toxic', 'soft-boiled', 'seismic-toss', 'stealth-rock'],
        },
        {
            setName: 'Teletransporte (Pivote)',
            description: 'Teletransporte para generar momentum y mantener al equipo sano con Deseo.',
            natureEn: 'Bold', item: 'Heavy-Duty Boots',
            evs: '252 PS / 252 Def / 4 Def.Esp',
            moves: ['teleport', 'wish', 'seismic-toss', 'toxic'],
        },
    ],
    'snorlax': [
        {
            setName: 'MaldiciónLax',
            description: 'Maldición + Descanso para volverse un muro imparable que golpea fuerte.',
            natureEn: 'Careful', item: 'Leftovers',
            evs: '252 PS / 4 Atq / 252 Def.Esp',
            moves: ['curse', 'rest', 'sleep-talk', 'body-slam'],
        },
        {
            setName: 'Tanque con Cinta Elegida',
            description: 'Snorlax ofensivo con Cinta Elegida: sorprende con daño físico bruto.',
            natureEn: 'Adamant', item: 'Choice Band',
            evs: '252 Atq / 4 PS / 252 Def.Esp',
            moves: ['body-slam', 'earthquake', 'fire-punch', 'crunch'],
        },
    ],
    'garchomp': [
        {
            setName: 'Sustituto + Baya Ziena',
            description: 'Sustituto hasta activar Baya Ziena y barrer con Danza Espada.',
            natureEn: 'Jolly', item: 'Salac Berry',
            evs: '4 PS / 252 Atq / 252 Vel',
            moves: ['substitute', 'swords-dance', 'earthquake', 'dragon-claw'],
        },
        {
            setName: 'Atacante Mixto',
            description: 'Garchomp mixto con Llamarada para sorprender a muros físicos.',
            natureEn: 'Naive', item: 'Life Orb',
            evs: '252 Atq / 4 At.Esp / 252 Vel',
            moves: ['earthquake', 'outrage', 'fire-blast', 'stone-edge'],
        },
    ],
    'dragonite': [
        {
            setName: 'Dragon Dance + Multiscale',
            description: 'Aprovecha Multiescamas para potenciarte con seguridad y barrer.',
            natureEn: 'Adamant', item: 'Lum Berry',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['dragon-dance', 'outrage', 'extreme-speed', 'earthquake'],
        },
        {
            setName: 'Cinta Elegida Mixta',
            description: 'Cinta Elegida con cobertura mixta para romper cualquier núcleo defensivo.',
            natureEn: 'Lonely', item: 'Choice Band',
            evs: '252 Atq / 4 At.Esp / 252 Vel',
            moves: ['outrage', 'extreme-speed', 'fire-blast', 'superpower'],
        },
    ],
    'tyranitar': [
        {
            setName: 'Danza Dragón (Barredor)',
            description: 'Danza Dragón + Chorro Arena para barrer con cobertura sólida.',
            natureEn: 'Jolly', item: 'Life Orb',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['dragon-dance', 'stone-edge', 'crunch', 'earthquake'],
        },
        {
            setName: 'Tanque de Defensa Esp.',
            description: 'TTar como muro especial aprovechando el aumento de Defensa Esp. en arena.',
            natureEn: 'Careful', item: 'Leftovers',
            evs: '252 PS / 4 Atq / 252 Def.Esp',
            moves: ['stealth-rock', 'crunch', 'earthquake', 'thunder-wave'],
        },
    ],
    'salamence': [
        {
            setName: 'MixMence (Clásico)',
            description: 'Set mixto clásico de Gen IV: impredecible contra cualquier cambio rival.',
            natureEn: 'Naive', item: 'Life Orb',
            evs: '252 Atq / 4 At.Esp / 252 Vel',
            moves: ['outrage', 'fire-blast', 'earthquake', 'draco-meteor'],
        },
        {
            setName: 'Dragon Dance + Moxie',
            description: 'DD + Autoestima para escalar tras cada KO consecutivo.',
            natureEn: 'Jolly', item: 'Lum Berry',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['dragon-dance', 'outrage', 'earthquake', 'fire-fang'],
        },
    ],
    'metagross': [
        {
            setName: 'Agilidad (Barredor)',
            description: 'Agilidad + Cuerpo Puro para barrer equipos lentos tras potenciarte una vez.',
            natureEn: 'Adamant', item: 'Life Orb',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['agility', 'meteor-mash', 'earthquake', 'ice-punch'],
        },
        {
            setName: 'Tanque con Cinta Elegida',
            description: 'Metagross con Cinta Elegida: poder bruto con Puño Bala como prioridad.',
            natureEn: 'Adamant', item: 'Choice Band',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['meteor-mash', 'bullet-punch', 'earthquake', 'ice-punch'],
        },
    ],
    'lucario': [
        {
            setName: 'Nasty Plot Especial',
            description: 'Maquinación + Onda Vacío para barrer con prioridad especial.',
            natureEn: 'Timid', item: 'Life Orb',
            evs: '252 At.Esp / 4 PS / 252 Vel',
            moves: ['nasty-plot', 'aura-sphere', 'vacuum-wave', 'flash-cannon'],
        },
        {
            setName: 'Swords Dance Físico',
            description: 'SD + Velocidad Extrema para prioridad física devastadora.',
            natureEn: 'Adamant', item: 'Life Orb',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['swords-dance', 'close-combat', 'extreme-speed', 'crunch'],
        },
    ],
    'gyarados': [
        {
            setName: 'Dragon Dance Clásico',
            description: 'DD Gyarados — uno de los sweepers más icónicos de la historia.',
            natureEn: 'Jolly', item: 'Leftovers',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['dragon-dance', 'waterfall', 'earthquake', 'bounce'],
        },
        {
            setName: 'SubDD',
            description: 'Sustituto + Danza Dragón para potenciarte con seguridad contra estados.',
            natureEn: 'Jolly', item: 'Leftovers',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['substitute', 'dragon-dance', 'waterfall', 'earthquake'],
        },
    ],
    'scizor': [
        {
            setName: 'Swords Dance + Roost',
            description: 'Variante bulky que aprovecha Técnico + Puño Bala.',
            natureEn: 'Adamant', item: 'Leftovers',
            evs: '252 PS / 252 Atq / 4 Def',
            moves: ['swords-dance', 'bullet-punch', 'roost', 'u-turn'],
        },
        {
            setName: 'Pivote con Cinta Elegida',
            description: 'Cinta Elegida + Ida y Vuelta para momentum constante; prioridad con STAB letal.',
            natureEn: 'Adamant', item: 'Choice Band',
            evs: '248 PS / 252 Atq / 8 Def',
            moves: ['u-turn', 'bullet-punch', 'superpower', 'knock-off'],
        },
    ],
    'alakazam': [
        {
            setName: 'Líder con Banda Focus',
            description: 'Líder clásico con Banda Focus para garantizar al menos un KO.',
            natureEn: 'Timid', item: 'Focus Sash',
            evs: '252 At.Esp / 4 PS / 252 Vel',
            moves: ['psychic', 'shadow-ball', 'focus-blast', 'energy-ball'],
        },
        {
            setName: 'Paz Mental (Barredor)',
            description: 'Paz Mental para potenciar At.Esp y barrer equipos debilitados.',
            natureEn: 'Timid', item: 'Life Orb',
            evs: '252 At.Esp / 4 PS / 252 Vel',
            moves: ['calm-mind', 'psychic', 'shadow-ball', 'focus-blast'],
        },
    ],
    'starmie': [
        {
            setName: 'Giro Rápido (Utilidad)',
            description: 'Utilidad clásica: Giro Rápido para controlar trampas de entrada con cobertura especial.',
            natureEn: 'Timid', item: 'Leftovers',
            evs: '252 At.Esp / 4 PS / 252 Vel',
            moves: ['rapid-spin', 'surf', 'thunderbolt', 'recover'],
        },
        {
            setName: 'Life Orb Attacker',
            description: 'Starmie ofensivo con cobertura amplia: clásico de Gen IV.',
            natureEn: 'Timid', item: 'Life Orb',
            evs: '252 At.Esp / 4 PS / 252 Vel',
            moves: ['surf', 'thunderbolt', 'ice-beam', 'psychic'],
        },
    ],
    'ferrothorn': [
        {
            setName: 'Hazard Setter',
            description: 'Set estándar de trampas de entrada con Drenadoras para presión pasiva.',
            natureEn: 'Relaxed', item: 'Leftovers',
            evs: '252 PS / 252 Def / 4 Def.Esp',
            moves: ['stealth-rock', 'spikes', 'leech-seed', 'power-whip'],
        },
        {
            setName: 'Tanque con Plancha Corporal',
            description: 'Plancha Corporal para sorprender a Pokémon de tipo Acero y Siniestro.',
            natureEn: 'Relaxed', item: 'Rocky Helmet',
            evs: '252 PS / 252 Def / 4 Def.Esp',
            moves: ['body-press', 'leech-seed', 'knock-off', 'stealth-rock'],
        },
    ],
    'toxapex': [
        {
            setName: 'Toxic Stall Clásico',
            description: 'Regenerator + Toxic + Recover para stall puro.',
            natureEn: 'Bold', item: 'Black Sludge',
            evs: '252 PS / 252 Def / 4 Def.Esp',
            moves: ['toxic', 'recover', 'scald', 'haze'],
        },
        {
            setName: 'Baneful Bunker',
            description: 'Protect variante que envenena al contacto — presión extra.',
            natureEn: 'Bold', item: 'Black Sludge',
            evs: '252 PS / 252 Def / 4 Def.Esp',
            moves: ['baneful-bunker', 'recover', 'scald', 'toxic-spikes'],
        },
    ],
    'landorus-therian': [
        {
            setName: 'Pivote Ofensivo',
            description: 'Ida y Vuelta + Intimidación para ciclos de momentum.',
            natureEn: 'Jolly', item: 'Choice Scarf',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['u-turn', 'earthquake', 'stone-edge', 'knock-off'],
        },
        {
            setName: 'Líder Suicida',
            description: 'Líder con Trampa Rocas + Explosión para presión inmediata.',
            natureEn: 'Jolly', item: 'Focus Sash',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['stealth-rock', 'earthquake', 'explosion', 'u-turn'],
        },
    ],
    'gliscor': [
        {
            setName: 'Poison Heal Stall',
            description: 'Toxic Orb + Poison Heal para recuperación constante.',
            natureEn: 'Impish', item: 'Toxic Orb',
            evs: '252 PS / 252 Def / 4 Vel',
            moves: ['substitute', 'protect', 'earthquake', 'toxic'],
        },
        {
            setName: 'Swords Dance',
            description: 'SD + Antídoto para potenciarte con seguridad y barrer.',
            natureEn: 'Jolly', item: 'Toxic Orb',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['swords-dance', 'earthquake', 'ice-fang', 'facade'],
        },
    ],
    'volcarona': [
        {
            setName: 'Danza Aleteo (Barredor)',
            description: 'QD clásico: uno de los barredores de potenciación más potentes.',
            natureEn: 'Timid', item: 'Heavy-Duty Boots',
            evs: '252 At.Esp / 4 PS / 252 Vel',
            moves: ['quiver-dance', 'fire-blast', 'bug-buzz', 'giga-drain'],
        },
        {
            setName: 'Bulky QD',
            description: 'Variante bulky con Respiro para más oportunidades de potenciarse.',
            natureEn: 'Modest', item: 'Heavy-Duty Boots',
            evs: '252 PS / 252 At.Esp / 4 Vel',
            moves: ['quiver-dance', 'flamethrower', 'bug-buzz', 'roost'],
        },
    ],
    'blaziken': [
        {
            setName: 'Impulso (Barredor)',
            description: 'Protección + Impulso para superar el meta tras un turno.',
            natureEn: 'Adamant', item: 'Life Orb',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['protect', 'flare-blitz', 'close-combat', 'swords-dance'],
        },
        {
            setName: 'Atacante Mixto',
            description: 'Blaziken mixto que destruye tanto muros físicos como especiales.',
            natureEn: 'Naive', item: 'Life Orb',
            evs: '252 Atq / 4 At.Esp / 252 Vel',
            moves: ['close-combat', 'flare-blitz', 'fire-blast', 'knock-off'],
        },
    ],
    'togekiss': [
        {
            setName: 'Dicha (Paraflinch)',
            description: 'Tajo Aéreo + Onda Trueno — infame combo de retroceso del 60%.',
            natureEn: 'Timid', item: 'Leftovers',
            evs: '252 At.Esp / 4 PS / 252 Vel',
            moves: ['air-slash', 'thunder-wave', 'roost', 'nasty-plot'],
        },
        {
            setName: 'Maquinación (Barredor)',
            description: 'Maquinación + cobertura para barrer tras un solo aumento.',
            natureEn: 'Timid', item: 'Life Orb',
            evs: '252 At.Esp / 4 PS / 252 Vel',
            moves: ['nasty-plot', 'air-slash', 'dazzling-gleam', 'flamethrower'],
        },
    ],
    'swampert': [
        {
            setName: 'Líder con Trampa Rocas',
            description: 'Líder defensivo con trampas de entrada y Rugido para forzar cambios.',
            natureEn: 'Relaxed', item: 'Leftovers',
            evs: '252 PS / 252 Def / 4 Atq',
            moves: ['stealth-rock', 'earthquake', 'scald', 'roar'],
        },
        {
            setName: 'Danza Lluvia (Barredor)',
            description: 'Nado Rápido + Danza Lluvia para velocidad duplicada.',
            natureEn: 'Adamant', item: 'Life Orb',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['rain-dance', 'waterfall', 'earthquake', 'ice-punch'],
        },
    ],
    'pikachu': [
        {
            setName: 'Light Ball Attacker',
            description: 'Bola Luz duplica ATQ/AT.ESP — el set emblema de Pikachu.',
            natureEn: 'Hasty', item: 'Light Ball',
            evs: '252 At.Esp / 4 Atq / 252 Vel',
            moves: ['volt-switch', 'thunderbolt', 'grass-knot', 'fake-out'],
        },
        {
            setName: 'Maquinación (Barredor)',
            description: 'Maquinación + Bola Luz para un Pikachu sorprendentemente letal.',
            natureEn: 'Timid', item: 'Light Ball',
            evs: '252 At.Esp / 4 PS / 252 Vel',
            moves: ['nasty-plot', 'thunderbolt', 'surf', 'grass-knot'],
        },
    ],
    'eevee': [
        {
            setName: 'Adaptability Attacker',
            description: 'Last Resort + Adaptability para STAB Normal de 280 BP efectivos.',
            natureEn: 'Jolly', item: 'Eviolite',
            evs: '252 Atq / 4 PS / 252 Vel',
            moves: ['last-resort', 'quick-attack', 'bite', 'iron-tail'],
        },
        {
            setName: 'Wish Support (LC)',
            description: 'Wish + Protect para soporte en Little Cup.',
            natureEn: 'Bold', item: 'Eviolite',
            evs: '252 PS / 252 Def / 4 Def.Esp',
            moves: ['wish', 'protect', 'heal-bell', 'body-slam'],
        },
    ],
};

// ================================================================
// GEN-SPECIFIC MECHANICS — Mecánicas que cambian por generación
// ================================================================
const GEN_MECHANICS = {
    1: { hasAbilities: false, hasNatures: false, hasItems: false, hasPhysSpecSplit: false, hasFairyType: false },
    2: { hasAbilities: false, hasNatures: false, hasItems: true,  hasPhysSpecSplit: false, hasFairyType: false },
    3: { hasAbilities: true,  hasNatures: true,  hasItems: true,  hasPhysSpecSplit: false, hasFairyType: false },
    4: { hasAbilities: true,  hasNatures: true,  hasItems: true,  hasPhysSpecSplit: true,  hasFairyType: false },
    5: { hasAbilities: true,  hasNatures: true,  hasItems: true,  hasPhysSpecSplit: true,  hasFairyType: false },
    6: { hasAbilities: true,  hasNatures: true,  hasItems: true,  hasPhysSpecSplit: true,  hasFairyType: true  },
    7: { hasAbilities: true,  hasNatures: true,  hasItems: true,  hasPhysSpecSplit: true,  hasFairyType: true  },
    8: { hasAbilities: true,  hasNatures: true,  hasItems: true,  hasPhysSpecSplit: true,  hasFairyType: true  },
    9: { hasAbilities: true,  hasNatures: true,  hasItems: true,  hasPhysSpecSplit: true,  hasFairyType: true  },
};

// ================================================================
// MÓDULO
// ================================================================

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.analyzer = {

    /**
     * Punto de entrada.
     * Si hay smogonData → devuelve TODOS los sets de Smogon formateados.
     * Si no → fallback a _buildDynamic (stats + movesData).
     */
    async analyze(pokemon, movesData, abilitiesEs, generation, smogonData = null) {
        const stats  = this._parseStats(pokemon);
        const role   = this._determineRole(stats);

        let allSets, tier, hasSmogon;
        if (smogonData) {
            tier = smogonData.tier;
            hasSmogon = true;
            allSets = await this._buildFromSmogon(smogonData, pokemon, movesData, abilitiesEs, generation);
        } else {
            tier = null;
            hasSmogon = false;
            allSets = this._buildDynamic(pokemon, movesData, abilitiesEs, stats, role, generation);
        }

        // Community builds (siempre disponibles como alternativas)
        const communityBuilds = await this.getCommunityBuilds(pokemon.name, generation, movesData, abilitiesEs);

        const formato = this._determineFormat(stats, generation, tier);
        const consejo = this._buildAdvice(pokemon, stats, role, generation);
        return {
            allSets,
            communityBuilds,
            hasSmogon,
            rol: role.description,
            formato,
            consejo_extra: consejo,
            genMechanics: GEN_MECHANICS[generation.num] || GEN_MECHANICS[9],
        };
    },

    // ================================================================
    // COMMUNITY BUILDS — Sets alternativos populares
    // ================================================================

    _getValidAbility(abilitiesEs, genNum) {
        const mechanics = GEN_MECHANICS[genNum] || GEN_MECHANICS[9];
        if (!mechanics.hasAbilities) return '—';
        for (const [, entry] of abilitiesEs) {
            if (entry.genNum <= genNum) return entry.nameEs;
        }
        const first = abilitiesEs?.values?.().next?.()?.value;
        return first?.nameEs ?? '—';
    },

    _isItemAvailable(itemEn, genNum) {
        const { ITEM_INTRO_GEN } = window.PokeAnalyzer.config;
        const mechanics = GEN_MECHANICS[genNum] || GEN_MECHANICS[9];
        if (!mechanics.hasItems) return false;
        const introGen = ITEM_INTRO_GEN[itemEn];
        return introGen == null || introGen <= genNum;
    },

    _fallbackItem(genNum) {
        if (genNum < 2) return '—';
        return 'Leftovers';
    },

    async getCommunityBuilds(pokemonName, generation, movesData, abilitiesEs) {
        const { translator } = window.PokeAnalyzer;
        const { NATURE_ES } = window.PokeAnalyzer.config;
        const genNum = generation.num;
        const slug = pokemonName.toLowerCase().replace(/ /g, '-');
        const builds = COMMUNITY_BUILDS_DB[slug];

        if (!builds || builds.length === 0) {
            return this._generateGenericCommunityBuilds(pokemonName, generation, movesData, abilitiesEs);
        }

        const moveIndex = new Map();
        if (movesData) movesData.forEach(m => moveIndex.set(m.name, m));

        const parsed = [];
        for (const build of builds) {
            const natureEs = NATURE_ES[build.natureEn] ?? build.natureEn;

            const itemEn = build.item;
            const itemEs = this._isItemAvailable(itemEn, genNum)
                ? translator.translateItem(itemEn)
                : translator.translateItem(this._fallbackItem(genNum));

            const abilityEs = this._getValidAbility(abilitiesEs, genNum);

            const moveset = await this._translateCommunityMoves(build.moves, moveIndex, genNum);
            if (!moveset || moveset.length === 0) continue;

            parsed.push({
                setName: build.setName,
                tierLabel: `[Comunidad] ${build.setName}`,
                description: build.description,
                natureEn: build.natureEn,
                nature: natureEs,
                ability: abilityEs,
                item: itemEs,
                evs: build.evs,
                moveset,
                isCommunity: true,
            });
        }

        if (parsed.length === 0) {
            return this._generateGenericCommunityBuilds(pokemonName, generation, movesData, abilitiesEs);
        }

        return parsed;
    },

    async _translateCommunityMoves(moveSlugs, moveIndex, genNum) {
        const { pokeAPI } = window.PokeAnalyzer;
        const result = [];

        for (const slug of moveSlugs) {
            let move = moveIndex.get(slug);

            // Si el movimiento no está en movesData, intentamos buscarlo en PokeAPI
            // y lo aceptamos solo si pertenece a esta generación o anteriores.
            if (!move) {
                const fetched = await pokeAPI._fetchMove(slug);
                if (!fetched || fetched.generationNum > genNum) continue;
                move = fetched;
            }

            result.push({
                movimiento: move.nameEs,
                tipo: move.type,
                razon: '',
            });
        }

        // Si no se han podido mapear TODOS los movimientos (por gen u otra razón),
        // consideramos que este build no es válido para esta generación.
        return result.length === moveSlugs.length ? result : [];
    },

    _generateGenericCommunityBuilds(pokemonName, generation, movesData, abilitiesEs) {
        const { NATURE_ES } = window.PokeAnalyzer.config;
        const { translator } = window.PokeAnalyzer;
        const genNum = generation.num;
        const available = (movesData || []).filter(m => m.generationNum <= genNum);
        if (available.length < 4) return [];

        const builds = [];

        // Heurística de puntuación potencia/precisión para aventura.
        function mAccScore(m) {
            const power = m.power || 0;
            const acc   = (m.accuracy || 100) / 100; // si no hay precisión, asumimos 100%
            return power * acc;
        }

        // Build 1: Set de aventura / ingame optimizado
        // Priorizamos daño + precisión (mejor Surf que Hidrobomba para aventura).
        const strongMoves = available
            .filter(m => m.power && m.power >= 60)
            .sort((a, b) => {
                const accA = mAccScore(a);
                const accB = mAccScore(b);
                return accB - accA;
            });

        if (strongMoves.length >= 2) {
            const usedTypes = new Set();
            const adventureMoves = [];
            for (const m of strongMoves) {
                if (adventureMoves.length >= 4) break;
                if (!usedTypes.has(m.type)) {
                    adventureMoves.push(m);
                    usedTypes.add(m.type);
                }
            }
            while (adventureMoves.length < 4 && strongMoves.length > adventureMoves.length) {
                const next = strongMoves.find(m => !adventureMoves.includes(m));
                if (next) adventureMoves.push(next);
                else break;
            }

            const abilityEs = this._getValidAbility(abilitiesEs, genNum);
            const advItemEn = this._isItemAvailable('Life Orb', genNum) ? 'Life Orb' : this._fallbackItem(genNum);

            builds.push({
                setName: 'Set de Aventura',
                tierLabel: '[Comunidad] Set de Aventura',
                description: 'Set optimizado para la aventura principal — máxima cobertura de tipos.',
                natureEn: 'Adamant',
                nature: NATURE_ES['Adamant'],
                ability: abilityEs,
                item: translator.translateItem(advItemEn),
                evs: '252 Atq / 4 PS / 252 Vel',
                moveset: adventureMoves.slice(0, 4).map(m => ({
                    movimiento: m.nameEs, tipo: m.type, razon: 'Cobertura de tipo.',
                })),
                isCommunity: true,
            });
        }

        // Build 2: Set "gimmick" — basado en movimientos de status
        const statusMoves = available.filter(m => m.category === 'status');
        const attackMoves = available.filter(m => m.power && m.power > 0);
        if (statusMoves.length >= 2 && attackMoves.length >= 1) {
            const gimmickMoves = [...statusMoves.slice(0, 2), ...attackMoves.slice(0, 2)];
            const abilityEs2 = this._getValidAbility(abilitiesEs, genNum);
            const gimItemEn = this._isItemAvailable('Leftovers', genNum) ? 'Leftovers' : this._fallbackItem(genNum);

            builds.push({
                setName: 'Set Creativo',
                tierLabel: '[Comunidad] Set Creativo',
                description: 'Set no convencional con movimientos de estado — ideal para sorprender.',
                natureEn: 'Bold',
                nature: NATURE_ES['Bold'],
                ability: abilityEs2,
                item: translator.translateItem(gimItemEn),
                evs: '252 PS / 128 Def / 128 Def.Esp',
                moveset: gimmickMoves.slice(0, 4).map(m => ({
                    movimiento: m.nameEs, tipo: m.type,
                    razon: m.category === 'status' ? 'Utilidad / Control.' : 'Daño de respaldo.',
                })),
                isCommunity: true,
            });
        }

        return builds;
    },

    // ================================================================
    // RUTA 1: SMOGON — TODOS los sets oficiales del JSON
    // ================================================================

    async _buildFromSmogon(smogonData, pokemon, movesData, abilitiesEs, generation) {
        const { NATURE_ES } = window.PokeAnalyzer.config;
        const { translator } = window.PokeAnalyzer;
        const { tier, sets } = smogonData;
        const setNames = Object.keys(sets);

        const moveIndex = new Map();
        movesData.forEach(m => moveIndex.set(m.name, m));

        const parsedSets = [];
        for (let i = 0; i < setNames.length; i++) {
            const setName = setNames[i];
            const s = sets[setName];

            // Naturaleza
            const natureEn = Array.isArray(s.nature) ? s.nature[0] : (s.nature ?? 'Hardy');
            const natureEs = NATURE_ES[natureEn] ?? natureEn;

            // Habilidad (Smogon ya filtra por gen, confiamos en el set)
            let abilityEs = '—';
            if (s.ability) {
                const abilityEn  = Array.isArray(s.ability) ? s.ability[0] : s.ability;
                const abilityKey = abilityEn.toLowerCase().replace(/ /g, '-').replace(/[.']/g, '');
                abilityEs = abilitiesEs.get(abilityKey)?.nameEs ?? abilityEn;
            } else {
                const firstAb = pokemon.abilities?.[0]?.ability?.name;
                if (firstAb) abilityEs = abilitiesEs.get(firstAb)?.nameEs ?? firstAb;
            }

            // Objeto (usa translator)
            const itemEn = Array.isArray(s.item) ? s.item[0] : (s.item ?? '');
            const itemEs = translator.translateItem(itemEn);

            // EVs (usa translator)
            const evsRaw = Array.isArray(s.evs) ? s.evs[0] : (s.evs ?? {});
            const evs = translator.formatSmogonEvs(evsRaw);

            // Movimientos
            const moveSlots = (s.moves ?? []).slice(0, 4).map(slot => {
                const displayName = Array.isArray(slot) ? slot[0] : slot;
                const slug = displayName.toLowerCase().replace(/[.']/g, '').replace(/ /g, '-');
                return { slug, displayName };
            });

            const moveset = await this._translateSmogonMoves(moveSlots, moveIndex);

            parsedSets.push({
                setName,
                tierLabel: `[${tier}] ${setName}`,
                natureEn,
                nature: natureEs,
                ability: abilityEs,
                item: itemEs,
                evs,
                moveset,
            });
        }

        return parsedSets;
    },

    async _translateSmogonMoves(moveSlots, moveIndex) {
        const { pokeAPI } = window.PokeAnalyzer;
        const { TYPE_ES } = window.PokeAnalyzer.config;

        return await Promise.all(moveSlots.map(async ({ slug, displayName }) => {
            const cached = moveIndex.get(slug);
            if (cached) {
                return { movimiento: cached.nameEs, tipo: cached.type, razon: '' };
            }

            // Movimientos con variante de tipo (Hidden Power Fire, etc.):
            // PokeAPI solo conoce el slug base (hidden-power), no hidden-power-fire.
            const variantMatch = slug.match(/^(hidden-power|natural-gift|judgment|multi-attack|techno-blast|weather-ball)-(.+)$/);
            if (variantMatch) {
                const baseSlug = variantMatch[1];
                const variantType = variantMatch[2];
                const baseCached = moveIndex.get(baseSlug);
                const baseMove = baseCached || await pokeAPI.fetchMoveSpanish(baseSlug);
                if (baseMove) {
                    const typeEs = TYPE_ES[variantType] || variantType;
                    return {
                        movimiento: `${baseMove.nameEs} [${typeEs}]`,
                        tipo: variantType,
                        razon: '',
                    };
                }
            }

            const fetched = await pokeAPI.fetchMoveSpanish(slug);
            if (fetched) {
                return { movimiento: fetched.nameEs, tipo: fetched.type, razon: '' };
            }
            return { movimiento: displayName, tipo: 'normal', razon: '' };
        }));
    },

    // ================================================================
    // RUTA 2: FALLBACK DINÁMICO
    // ================================================================

    _buildDynamic(pokemon, movesData, abilitiesEs, stats, role, generation) {
        const { NATURE_ES } = window.PokeAnalyzer.config;
        const genNum = generation.num;
        const types = pokemon.types.map(t => t.type.name);

        const available = movesData
            .filter(m => m.generationNum <= genNum)
            .map(m => ({
                ...m,
                effectiveCategory: genNum <= 3
                    ? (m.category === 'status' ? 'status' : (GEN1_PHYSICAL_TYPES.has(m.type) ? 'physical' : 'special'))
                    : m.category,
            }));

        const isPhysical = stats.atk > stats.spatk;
        const isMixed    = role.type === 'mixed-attacker';

        const abilityEs = this._getValidAbility(abilitiesEs, genNum);

        const allSets = [];

        const offBuild = this._buildOffensiveSet(available, types, stats, isPhysical, isMixed, role, abilityEs, genNum);
        if (offBuild) allSets.push(offBuild);

        const defBuild = this._buildDefensiveSet(available, types, stats, isPhysical, abilityEs, genNum);
        if (defBuild) allSets.push(defBuild);

        if (allSets.length === 0) {
            allSets.push({
                setName: 'Análisis Básico',
                tierLabel: 'Sin datos de Smogon',
                natureEn: 'Hardy',
                nature: '—', ability: abilityEs, item: '—',
                evs: '—',
                moveset: [{ movimiento: 'Sin movimientos válidos', tipo: 'normal',
                    razon: `No hay movimientos disponibles para Gen ${genNum}.` }],
            });
        }

        return allSets;
    },

    _buildOffensiveSet(moves, types, stats, isPhysical, isMixed, role, abilityEs, genNum) {
        const { NATURE_ES } = window.PokeAnalyzer.config;

        const natureEn = this._pickOffensiveNature(stats, isPhysical, isMixed);
        const natureEs = NATURE_ES[natureEn] ?? natureEn;
        const allowedCategory = this._natureToCategory(natureEn);
        const selectedMoves = this._selectCoherentMoves(moves, types, allowedCategory, isMixed);
        if (selectedMoves.length === 0) return null;

        const item = this._pickOffensiveItem(role, isPhysical, selectedMoves, genNum);
        const finalMoves = this._enforceChoiceRule(selectedMoves, moves, allowedCategory, item, types);

        return {
            setName: isPhysical ? 'Atacante Físico' : 'Atacante Especial',
            tierLabel: `[Estimado] ${isPhysical ? 'Atacante Físico' : 'Atacante Especial'}`,
            natureEn,
            nature: natureEs,
            ability: abilityEs,
            item,
            evs: this._pickEvs(isPhysical, isMixed),
            moveset: finalMoves.slice(0, 4).map(m => ({
                movimiento: m.nameEs,
                tipo: m.type,
                razon: this._moveReason(m, types, genNum),
            })),
        };
    },

    _buildDefensiveSet(moves, types, stats, isPhysical, abilityEs, genNum) {
        const { NATURE_ES } = window.PokeAnalyzer.config;
        const { translator } = window.PokeAnalyzer;
        const defMoves = this._selectDefensiveMoves(moves, types);
        if (defMoves.length < 3) return null;

        const defItemEn = this._isItemAvailable('Leftovers', genNum) ? 'Leftovers' : this._fallbackItem(genNum);
        const natureEn = isPhysical ? 'Impish' : 'Calm';
        return {
            setName: 'Soporte Defensivo',
            tierLabel: '[Estimado] Soporte Defensivo',
            natureEn,
            nature: NATURE_ES[natureEn] ?? natureEn,
            ability: abilityEs,
            item: translator.translateItem(defItemEn),
            evs: '252 PS / 252 Def / 4 Def.Esp',
            moveset: defMoves.slice(0, 4).map(m => ({
                movimiento: m.nameEs,
                tipo: m.type,
                razon: this._moveReason(m, types, genNum),
            })),
        };
    },

    // ── Coherencia Naturaleza-Movimiento ──────────────────────────

    _pickOffensiveNature(stats, isPhysical, isMixed) {
        if (isMixed) return stats.spe > 95 ? 'Hasty' : 'Lonely';
        if (isPhysical) return stats.spe > 95 ? 'Jolly' : 'Adamant';
        return stats.spe > 95 ? 'Timid' : 'Modest';
    },

    _natureToCategory(nature) {
        const PHYSICAL = new Set(['Jolly', 'Adamant', 'Impish', 'Careful']);
        const SPECIAL  = new Set(['Timid', 'Modest', 'Calm', 'Bold']);
        if (PHYSICAL.has(nature)) return 'physical';
        if (SPECIAL.has(nature))  return 'special';
        return 'mixed';
    },

    _selectCoherentMoves(moves, types, allowedCategory, isMixed) {
        const attacks = moves.filter(m => {
            if (m.effectiveCategory === 'status') return false;
            if (!m.power || m.power <= 0) return false;
            if (allowedCategory === 'mixed') return true;
            return m.effectiveCategory === allowedCategory;
        });

        const setups = moves.filter(m => {
            if (m.effectiveCategory !== 'status') return false;
            if (allowedCategory === 'physical' || allowedCategory === 'mixed')
                if (PREMIUM_PHYSICAL.has(m.name)) return true;
            if (allowedCategory === 'special' || allowedCategory === 'mixed')
                if (PREMIUM_SPECIAL.has(m.name)) return true;
            return false;
        });

        const pivots = moves.filter(m => PIVOT_MOVES.has(m.name));

        const premiumList = allowedCategory === 'physical' ? PREMIUM_PHYSICAL : PREMIUM_SPECIAL;
        const sorted = [...attacks].sort((a, b) => {
            const aScore = (a.power || 0) * (types.includes(a.type) ? 1.5 : 1) * (premiumList.has(a.name) ? 1.2 : 1);
            const bScore = (b.power || 0) * (types.includes(b.type) ? 1.5 : 1) * (premiumList.has(b.name) ? 1.2 : 1);
            return bScore - aScore;
        });

        const selected = [];
        const usedTypes = new Set();

        const bestStab = sorted.find(m => types.includes(m.type));
        if (bestStab) { selected.push(bestStab); usedTypes.add(bestStab.type); }
        if (types.length > 1) {
            const s2 = sorted.find(m => types.includes(m.type) && !usedTypes.has(m.type));
            if (s2) { selected.push(s2); usedTypes.add(s2.type); }
        }

        for (const m of sorted) {
            if (selected.length >= 3) break;
            if (!usedTypes.has(m.type) && !selected.includes(m)) {
                selected.push(m); usedTypes.add(m.type);
            }
        }

        if (selected.length < 4 && setups.length > 0) selected.push(setups[0]);
        else if (selected.length < 4 && pivots.length > 0) selected.push(pivots[0]);

        for (const m of sorted) {
            if (selected.length >= 4) break;
            if (!selected.includes(m)) selected.push(m);
        }

        return selected.slice(0, 4);
    },

    _enforceChoiceRule(selectedMoves, allMoves, allowedCategory, item, types) {
        const CHOICE = new Set(['Cinta Elegida', 'Lentes Elegidas', 'Pañuelo Elegido']);
        if (!CHOICE.has(item)) return selectedMoves;

        const valid = selectedMoves.filter(m => (m.power && m.power > 0) || PIVOT_MOVES.has(m.name));
        if (valid.length === selectedMoves.length) return selectedMoves;

        const usedNames = new Set(valid.map(m => m.name));
        const replacements = allMoves
            .filter(m => !usedNames.has(m.name) && m.effectiveCategory !== 'status' && m.power > 0
                && (allowedCategory === 'mixed' || m.effectiveCategory === allowedCategory))
            .sort((a, b) => {
                const aS = (a.power || 0) * (types.includes(a.type) ? 1.5 : 1);
                const bS = (b.power || 0) * (types.includes(b.type) ? 1.5 : 1);
                return bS - aS;
            });

        if (!valid.some(m => PIVOT_MOVES.has(m.name))) {
            const pivot = allMoves.find(m => PIVOT_MOVES.has(m.name) && !usedNames.has(m.name));
            if (pivot) { valid.push(pivot); usedNames.add(pivot.name); }
        }

        for (const m of replacements) {
            if (valid.length >= 4) break;
            if (!usedNames.has(m.name)) { valid.push(m); usedNames.add(m.name); }
        }

        return valid.slice(0, 4);
    },

    _selectDefensiveMoves(moves, types) {
        const selected = [];
        const recovery = moves.find(m => RECOVERY_MOVES.has(m.name));
        if (recovery) selected.push(recovery);
        const hazard = moves.find(m => HAZARD_MOVES.has(m.name));
        if (hazard) selected.push(hazard);
        for (const m of moves.filter(m => SUPPORT_MOVES.has(m.name))) {
            if (selected.length >= 3) break;
            if (!selected.includes(m)) selected.push(m);
        }
        const stab = moves.find(m => types.includes(m.type) && m.power > 0 && !selected.includes(m));
        if (stab && selected.length < 4) selected.push(stab);
        for (const m of moves.filter(m => m.power > 0)) {
            if (selected.length >= 4) break;
            if (!selected.includes(m)) selected.push(m);
        }
        return selected.slice(0, 4);
    },

    // ── Utilidades ────────────────────────────────────────────────

    _pickEvs(isPhysical, isMixed) {
        if (isMixed) return '252 Atq / 4 At.Esp / 252 Vel';
        if (isPhysical) return '252 Atq / 4 PS / 252 Vel';
        return '252 At.Esp / 4 PS / 252 Vel';
    },

    _pickOffensiveItem(role, isPhysical, moves, genNum) {
        const { translator } = window.PokeAnalyzer;
        const hasSetup = moves.some(m => m.effectiveCategory === 'status' &&
            (PREMIUM_PHYSICAL.has(m.name) || PREMIUM_SPECIAL.has(m.name)));

        let itemEn;
        if (role.type.includes('wall')) {
            itemEn = 'Leftovers';
        } else if (hasSetup) {
            itemEn = 'Life Orb';
        } else if (isPhysical) {
            itemEn = 'Choice Band';
        } else {
            itemEn = 'Choice Specs';
        }

        if (!this._isItemAvailable(itemEn, genNum)) {
            itemEn = this._fallbackItem(genNum);
        }
        return translator.translateItem(itemEn);
    },

    _moveReason(move, types, genNum) {
        const { translator } = window.PokeAnalyzer;
        const isStab = types.includes(move.type);

        if (!move.power || move.power === 0) {
            if (PIVOT_MOVES.has(move.name)) return translator.MOVE_REASONS.pivot;
            if (RECOVERY_MOVES.has(move.name)) return translator.MOVE_REASONS.recovery;
            if (HAZARD_MOVES.has(move.name)) return translator.MOVE_REASONS.hazard;
            if (PREMIUM_PHYSICAL.has(move.name) || PREMIUM_SPECIAL.has(move.name))
                return translator.MOVE_REASONS.setup;
            return translator.MOVE_REASONS.utility;
        }

        const catLabel = genNum <= 3
            ? ` (${GEN1_PHYSICAL_TYPES.has(move.type) ? translator.translateMoveCategory('physical') : translator.translateMoveCategory('special')} por tipo en Gen ${genNum})`
            : '';

        return `${isStab ? 'STAB' : 'Cobertura'} — ${move.power} BP${catLabel}.`;
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

        if (isPhys && isFast)       return { type: 'physical-sweeper',  description: 'Barredor Físico — alto daño y velocidad para vencer antes de recibir golpes.' };
        if (isSpec && isFast)       return { type: 'special-sweeper',   description: 'Barredor Especial — ataque especial y velocidad para dominar el campo.' };
        if (isPhys)                 return { type: 'physical-attacker', description: 'Atacante Físico — alto poder de ataque, ideal para romper defensas.' };
        if (isSpec)                 return { type: 'special-attacker',  description: 'Atacante Especial — fuerte en SP.ATK, domina a largo plazo.' };
        if (isMixed)                return { type: 'mixed-attacker',    description: 'Atacante Mixto — reparte entre ATK y SP.ATK para ser impredecible.' };
        if (isTank && def >= spdef) return { type: 'physical-wall',    description: 'Muro Físico — gran DEF para aguantar ataques físicos y apoyar al equipo.' };
        if (isTank)                 return { type: 'special-wall',     description: 'Muro Especial — excelente SP.DEF, resistente a atacantes especiales.' };
        if (bst < 380)              return { type: 'support',          description: 'Soporte — stats moderados, ideal para aportar utilidad y control al equipo.' };
        return                             { type: 'balanced',         description: 'Versátil — stats equilibrados, se adapta a varios roles según el set.' };
    },

    // ── Formato ──────────────────────────────────────────────────

    _determineFormat(stats, generation, tier = null) {
        const { translator } = window.PokeAnalyzer;
        const g = `Gen ${generation.num}`;
        if (tier) {
            return `${g} — ${translator.translateTier(tier)}`;
        }
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
        const genNum = generation.num;
        const mechanics = GEN_MECHANICS[genNum] || GEN_MECHANICS[9];

        if (stats.spe > 110) tips.push(`Su Velocidad de ${stats.spe} le permite superar a casi todo el meta sin naturaleza de Velocidad.`);
        if (stats.hp  > 100) tips.push(`Con ${stats.hp} de HP es muy difícil de eliminar de un solo golpe — maximiza EVs de HP.`);
        if (stats.bst >= 580) tips.push(`Con ${stats.bst} de total de stats base está en la élite — diseña el equipo alrededor de él.`);
        if (stats.atk > 130 || stats.spatk > 130) tips.push(`Atributo ofensivo excepcional — incluso sin potenciarte ejerce una presión enorme.`);
        if (role.type.includes('wall') || role.type === 'support') tips.push(`Rol defensivo/soporte — prioriza recuperación y trampas de entrada para maximizar la presión pasiva.`);

        // Mecánicas por generación
        if (!mechanics.hasAbilities) tips.push(`En Gen ${genNum} no existen habilidades — la estrategia depende solo de tipos, movimientos y stats base.`);
        if (!mechanics.hasPhysSpecSplit) tips.push(`En Gen ${genNum} el split físico/especial es por TIPO de movimiento, no por movimiento individual.`);
        if (!mechanics.hasFairyType && genNum < 6) tips.push(`En Gen ${genNum} no existe el tipo Hada — Dragón solo es débil a Hielo y Dragón.`);

        const genTips = {
            1: 'En Gen I no hay objetos ni habilidades. El atributo Especial es único (At.Esp = Def.Esp). Prioriza cobertura de tipos y control de PP.',
            2: 'En Gen II los Restos son el objeto más valioso. El split físico/especial sigue siendo por tipo de movimiento.',
            3: 'En Gen III el split es por TIPO del movimiento. Elige coberturas teniendo esto en cuenta.',
            4: 'En Gen IV el split ya es por movimiento individual — revisa bien la categoría de cada ataque.',
            5: 'En Gen V el meta de clima es dominante. Considera respuesta para sol, lluvia y arena.',
            6: 'En Gen VI el tipo Hada cambia matchups clave. Evalúa si necesitas cobertura de Acero o Veneno.',
            7: 'En Gen VII aprovecha el Z-Move para potenciar tu STAB principal o para una potenciación devastadora.',
            8: 'En Gen VIII el Dynamax permite convertir cualquier ataque en un aumento. Úsalo en el turno más impactante.',
            9: 'En Gen IX elige el Tipo Tera para potenciar tu STAB ofensivamente o tapar debilidades defensivas.',
        };

        if (genTips[genNum]) tips.push(genTips[genNum]);

        return tips.join(' ') ||
            `Pokémon de tipo ${types} con ${stats.bst} de total de stats base. Adapta cada set según las amenazas del meta de Gen ${genNum}.`;
    },
};
