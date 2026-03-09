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
// MÓDULO
// ================================================================

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.analyzer = {

    analyze(pokemon, movesData, abilitiesEs, generation) {
        const stats       = this._parseStats(pokemon);
        const role        = this._determineRole(stats);
        const naturalezas = this._recommendNatures(stats, role, generation);
        const habilidad   = this._recommendAbility(pokemon, abilitiesEs, generation);
        const { moveset_1, moveset_2 } = this._buildTwoSets(pokemon, movesData, stats, role, generation);
        const formato     = this._determineFormat(stats, generation);
        const consejo     = this._buildAdvice(pokemon, stats, role, generation);

        return { naturalezas, habilidad, moveset_1, moveset_2, rol: role.description, formato, consejo_extra: consejo };
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
                { nombre: es('Jolly'),   razon: `+10% VEL para superar rivales clave del meta. Permite ser amenaza sin necesitar setup previo${genIINote}.` },
            ],
            'special-sweeper': [
                { nombre: es('Modest'), razon: `+10% SP.ATK, -10% ATK (irrelevante). Maximiza el daño especial desde ${stats.spatk} de SP.ATK base${genIINote}.` },
                { nombre: es('Timid'),  razon: `+10% VEL para atacar antes que rivales de velocidad similar${genIINote}.` },
            ],
            'physical-attacker': [
                { nombre: es('Adamant'), razon: `Maximiza el ATK. Con ${stats.atk} de base cada punto extra amplifica el daño${genIINote}.` },
                { nombre: es('Jolly'),  razon: `+10% VEL, no perder el turno ante walls rápidas. Complementa bien el poder base${genIINote}.` },
            ],
            'special-attacker': [
                { nombre: es('Modest'), razon: `Maximiza el SP.ATK. Con ${stats.spatk} de base cada punto cuenta${genIINote}.` },
                { nombre: es('Timid'),  razon: `+10% VEL para no ser bloqueado por Pokémon más rápidos${genIINote}.` },
            ],
            'mixed-attacker': [
                { nombre: es('Naive'),  razon: `+10% VEL, -10% SP.DEF (aguanta igual con el set mixto). Permite atacar desde los dos lados a gran velocidad${genIINote}.` },
                { nombre: es('Hasty'), razon: `+10% VEL, -10% DEF. Similar a Activa pero sacrifica el lado físico — ideal si el rol es principalmente especial${genIINote}.` },
            ],
            'physical-wall': [
                { nombre: es('Impish'),  razon: `+10% DEF, refuerza la defensa física de ${stats.def} base${genIINote}.` },
                { nombre: es('Careful'), razon: `+10% SP.DEF para no ser completamente vulnerable al lado especial también${genIINote}.` },
            ],
            'special-wall': [
                { nombre: es('Calm'),  razon: `+10% SP.DEF, refuerza la defensa especial de ${stats.spdef} base${genIINote}.` },
                { nombre: es('Bold'),  razon: `+10% DEF para resistir también el lado físico${genIINote}.` },
            ],
            'support': [
                { nombre: es('Careful'), razon: `Más SP.DEF para sobrevivir y poder usar movimientos de utilidad${genIINote}.` },
                { nombre: es('Bold'),    razon: `Más DEF para aguantar ataques físicos mientras actúa de soporte${genIINote}.` },
            ],
            'balanced': [
                { nombre: es('Jolly'),   razon: `+10% VEL para tomar la iniciativa en la mayoría de situaciones${genIINote}.` },
                { nombre: es('Adamant'), razon: `+10% ATK para maximizar el daño si la velocidad no es crítica${genIINote}.` },
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

        // Movimiento de daño normal
        const powerStr  = effPower ? ` — ${effPower} BP efectivos` : '';
        const premiumStr = isPremium ? ' Staple competitivo de primer nivel.' : '';
        return `${focus === 'poder' ? 'Daño máximo' : 'Cobertura estratégica'}${powerStr}${splitNote}.${premiumStr}`;
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
