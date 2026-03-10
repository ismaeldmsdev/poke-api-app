/**
 * analyzer.js — Motor de análisis competitivo.
 * Fuente principal: JSON oficial de Smogon (pkmn.github.io).
 * Fallback: análisis dinámico por stats + movesData de PokéAPI.
 * Expone window.PokeAnalyzer.analyzer
 */

// ================================================================
// TRADUCCIÓN DE OBJETOS — Smogon (inglés) → castellano
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
// MÓDULO
// ================================================================

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.analyzer = {

    /**
     * Punto de entrada.
     * Si hay smogonData → usa los sets de Smogon TAL CUAL.
     * Si no → fallback a _buildDynamic (stats + movesData).
     */
    async analyze(pokemon, movesData, abilitiesEs, generation, smogonData = null) {
        const stats  = this._parseStats(pokemon);
        const role   = this._determineRole(stats);

        let builds, tier;
        if (smogonData) {
            tier = smogonData.tier;
            builds = await this._buildFromSmogon(smogonData, pokemon, movesData, abilitiesEs, generation);
        } else {
            tier = null;
            builds = this._buildDynamic(pokemon, movesData, abilitiesEs, stats, role, generation);
        }

        const formato = this._determineFormat(stats, generation, tier);
        const consejo = this._buildAdvice(pokemon, stats, role, generation);
        return { builds, rol: role.description, formato, consejo_extra: consejo };
    },

    // ================================================================
    // RUTA 1: SMOGON — sets oficiales del JSON de pkmn.github.io
    // ================================================================

    /**
     * Construye builds directamente desde los sets de Smogon.
     * Traduce nombres de movimientos buscando en movesData o vía PokeAPI.
     * NO recalcula nada: naturaleza, item, EVs, moves son TAL CUAL de Smogon.
     */
    async _buildFromSmogon(smogonData, pokemon, movesData, abilitiesEs, generation) {
        const { NATURE_ES } = window.PokeAnalyzer.config;
        const { tier, sets } = smogonData;
        const setNames = Object.keys(sets).slice(0, 3);

        // Índice slug → nameEs desde movesData para traducción rápida
        const moveIndex = new Map();
        movesData.forEach(m => moveIndex.set(m.name, m));

        const builds = [];
        for (let i = 0; i < setNames.length; i++) {
            const setName = setNames[i];
            const s = sets[setName];

            // Naturaleza
            const natureEn = Array.isArray(s.nature) ? s.nature[0] : (s.nature ?? 'Hardy');
            const natureEs = NATURE_ES[natureEn] ?? natureEn;

            // Habilidad
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

            // Movimientos: traducir cada slot
            const moveSlots = (s.moves ?? []).slice(0, 4).map(slot => {
                const displayName = Array.isArray(slot) ? slot[0] : slot;
                const slug = displayName.toLowerCase().replace(/[.']/g, '').replace(/ /g, '-');
                return { slug, displayName };
            });

            const moveset = await this._translateSmogonMoves(moveSlots, moveIndex);

            builds.push({
                etiqueta: i === 0
                    ? `${natureEs} — SMOGON ${tier}`
                    : `${natureEs} — ${setName} (${tier})`,
                nature: natureEs,
                ability: abilityEs,
                item: itemEs,
                evs,
                role: setName,
                moveset,
            });
        }

        return builds;
    },

    /**
     * Traduce moves de Smogon al castellano.
     * 1º: busca en movesData (ya viene con nameEs de PokeAPI)
     * 2º: llama a pokeAPI.fetchMoveSpanish() individualmente
     * 3º: fallback al displayName original
     */
    async _translateSmogonMoves(moveSlots, moveIndex) {
        const { pokeAPI } = window.PokeAnalyzer;

        return await Promise.all(moveSlots.map(async ({ slug, displayName }) => {
            // 1. movesData (ya descargado, tiene nameEs y type)
            const cached = moveIndex.get(slug);
            if (cached) {
                return { movimiento: cached.nameEs, tipo: cached.type, razon: '' };
            }

            // 2. PokeAPI individual (con cache interna)
            const fetched = await pokeAPI.fetchMoveSpanish(slug);
            if (fetched) {
                return { movimiento: fetched.nameEs, tipo: fetched.type, razon: '' };
            }

            // 3. Nombre de Smogon tal cual (último recurso)
            return { movimiento: displayName, tipo: 'normal', razon: '' };
        }));
    },

    _formatSmogonEvs(evs) {
        const LABEL = { hp: 'HP', atk: 'ATK', def: 'DEF', spa: 'SP.ATK', spd: 'SP.DEF', spe: 'VEL' };
        const parts = Object.entries(evs)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `${v} ${LABEL[k] ?? k.toUpperCase()}`);
        return parts.length > 0 ? parts.join(' / ') : '252 HP / 4 ATK / 252 VEL';
    },

    // ================================================================
    // RUTA 2: FALLBACK DINÁMICO — cuando Smogon no tiene datos
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

        const firstAb = pokemon.abilities?.[0]?.ability?.name;
        const abilityEs = firstAb ? (abilitiesEs.get(firstAb) ?? firstAb) : '—';

        const builds = [];

        // Build ofensivo
        const offBuild = this._buildOffensiveSet(available, types, stats, isPhysical, isMixed, role, abilityEs, genNum);
        if (offBuild) builds.push(offBuild);

        // Build defensivo
        const defBuild = this._buildDefensiveSet(available, types, stats, isPhysical, abilityEs, genNum);
        if (defBuild) builds.push(defBuild);

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

    _buildOffensiveSet(moves, types, stats, isPhysical, isMixed, role, abilityEs, genNum) {
        const { NATURE_ES } = window.PokeAnalyzer.config;

        const nature = this._pickOffensiveNature(stats, isPhysical, isMixed);
        const natureEs = NATURE_ES[nature] ?? nature;
        const allowedCategory = this._natureToCategory(nature);
        const selectedMoves = this._selectCoherentMoves(moves, types, allowedCategory, isMixed);
        if (selectedMoves.length === 0) return null;

        const item = this._pickOffensiveItem(role, isPhysical, selectedMoves);
        const finalMoves = this._enforceChoiceRule(selectedMoves, moves, allowedCategory, item, types);

        return {
            etiqueta: `${natureEs} — ANÁLISIS DINÁMICO`,
            nature: natureEs,
            ability: abilityEs,
            item,
            evs: this._pickEvs(isPhysical, isMixed),
            role: isPhysical ? 'Atacante Físico' : 'Atacante Especial',
            moveset: finalMoves.slice(0, 4).map(m => ({
                movimiento: m.nameEs,
                tipo: m.type,
                razon: this._moveReason(m, types, genNum),
            })),
        };
    },

    _buildDefensiveSet(moves, types, stats, isPhysical, abilityEs, genNum) {
        const { NATURE_ES } = window.PokeAnalyzer.config;
        const defMoves = this._selectDefensiveMoves(moves, types);
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

        // STAB(s)
        const bestStab = sorted.find(m => types.includes(m.type));
        if (bestStab) { selected.push(bestStab); usedTypes.add(bestStab.type); }
        if (types.length > 1) {
            const s2 = sorted.find(m => types.includes(m.type) && !usedTypes.has(m.type));
            if (s2) { selected.push(s2); usedTypes.add(s2.type); }
        }

        // Cobertura
        for (const m of sorted) {
            if (selected.length >= 3) break;
            if (!usedTypes.has(m.type) && !selected.includes(m)) {
                selected.push(m); usedTypes.add(m.type);
            }
        }

        // Slot 4: setup o pivote
        if (selected.length < 4 && setups.length > 0) selected.push(setups[0]);
        else if (selected.length < 4 && pivots.length > 0) selected.push(pivots[0]);

        // Rellenar
        for (const m of sorted) {
            if (selected.length >= 4) break;
            if (!selected.includes(m)) selected.push(m);
        }

        return selected.slice(0, 4);
    },

    // ── Check de Objeto Choice ────────────────────────────────────

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

    // ── Soporte defensivo ─────────────────────────────────────────

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
        if (isMixed) return '252 ATK / 4 SP.ATK / 252 VEL';
        if (isPhysical) return '252 ATK / 4 HP / 252 VEL';
        return '252 SP.ATK / 4 HP / 252 VEL';
    },

    _pickOffensiveItem(role, isPhysical, moves) {
        const hasSetup = moves.some(m => m.effectiveCategory === 'status' &&
            (PREMIUM_PHYSICAL.has(m.name) || PREMIUM_SPECIAL.has(m.name)));
        if (role.type.includes('wall')) return 'Restos';
        if (hasSetup) return 'Orbe Vital';
        if (isPhysical) return 'Cinta Elegida';
        return 'Lentes Elegidas';
    },

    _moveReason(move, types, genNum) {
        const isStab = types.includes(move.type);
        const catNote = genNum <= 3
            ? ` (${GEN1_PHYSICAL_TYPES.has(move.type) ? 'FÍSICO' : 'ESPECIAL'} por tipo en Gen ${genNum})`
            : '';

        if (!move.power || move.power === 0) {
            if (PIVOT_MOVES.has(move.name)) return 'Pivote — genera momentum saliendo tras atacar.';
            if (RECOVERY_MOVES.has(move.name)) return 'Recuperación — mantiene la presencia en el campo.';
            if (HAZARD_MOVES.has(move.name)) return 'Hazard — daño pasivo en cada cambio del rival.';
            if (PREMIUM_PHYSICAL.has(move.name) || PREMIUM_SPECIAL.has(move.name))
                return 'Setup — potencia el daño para barrer al equipo rival.';
            return 'Utilidad — control o soporte al equipo.';
        }

        return `${isStab ? 'STAB' : 'Cobertura'} — ${move.power} BP${catNote}.`;
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

    _determineFormat(stats, generation, tier = null) {
        const g = `Gen ${generation.num}`;
        if (tier) {
            const TIER_NAMES = {
                'OU': 'OU (Overused)', 'UBERS': 'Ubers', 'UU': 'UU (Underused)',
                'RU': 'RU (Rarely Used)', 'NU': 'NU (Never Used)', 'PU': 'PU',
                'ZU': 'ZU', 'LC': 'LC (Little Cup)', 'DOUBLESOU': 'Dobles OU',
            };
            return `${g} — ${TIER_NAMES[tier] ?? tier}`;
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
