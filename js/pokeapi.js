/**
 * pokeapi.js — Comunicación con PokeAPI.
 * Expone window.PokeAnalyzer.pokeAPI
 */

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.pokeAPI = {

    /** Datos base + especie + cadena de evolución. */
    async fetchAll(query) {
        const pokemon = await this._fetchPokemon(query);
        const species = await this._fetchSpecies(pokemon.species.url);
        const evoData = await this._fetchEvoChain(species.evolution_chain.url);
        return { pokemon, evoData };
    },

    /**
     * Descarga datos de movimientos priorizando TMs y tutores
     * (tienden a ser los más fuertes competitivamente).
     * Limita a 60 llamadas en paralelo.
     */
    async fetchMovesData(pokemon) {
        const allMoves = pokemon.moves;

        // Separar por método de aprendizaje
        const byMethod = { machine: [], tutor: [], levelUp: [], egg: [], other: [] };

        allMoves.forEach(entry => {
            const methods = entry.version_group_details.map(d => d.move_learn_method.name);
            const name    = entry.move.name;

            if (methods.includes('machine'))  byMethod.machine.push(name);
            else if (methods.includes('tutor'))  byMethod.tutor.push(name);
            else if (methods.includes('level-up')) byMethod.levelUp.push(name);
            else if (methods.includes('egg'))     byMethod.egg.push(name);
            else                                  byMethod.other.push(name);
        });

        // Prioridad: TMs → tutores → level-up → huevo → resto
        const prioritized = [
            ...byMethod.machine,
            ...byMethod.tutor,
            ...byMethod.levelUp,
            ...byMethod.egg,
            ...byMethod.other,
        ];

        // Eliminar duplicados y limitar a 20 (evita timeouts con 60+ fetches)
        const unique = [...new Set(prioritized)].slice(0, 20);

        const results = await Promise.allSettled(
            unique.map(name => this._fetchMove(name))
        );

        return results
            .filter(r => r.status === 'fulfilled' && r.value !== null)
            .map(r => r.value);
    },

    /**
     * Nombres en castellano de las habilidades del Pokémon (2-3 llamadas).
     * @returns {Map<string, string>}
     */
    async fetchAbilitiesSpanish(pokemon) {
        const results = await Promise.allSettled(
            pokemon.abilities.map(a => this._fetchAbility(a.ability.name))
        );

        const map = new Map();
        results.forEach((r, i) => {
            const eng = pokemon.abilities[i].ability.name;
            if (r.status === 'fulfilled' && r.value) {
                map.set(eng, r.value);
            } else {
                map.set(eng, { nameEs: _capitalize(eng.replace(/-/g, ' ')), genNum: 3 });
            }
        });
        return map;
    },

    /**
     * Busca sets Smogon del JSON oficial de pkmn.github.io.
     * Intenta OU y Ubers en paralelo; si no aparece, prueba UU/RU/NU secuencial.
     * @returns {{ tier: string, sets: object } | null}
     */
    async fetchSmogonSets(pokemonSlug, generationNum) {
        const displayName = this._slugToSmogonName(pokemonSlug);
        const gen = generationNum;

        // Tiers principales en paralelo (rápido)
        const [ouResult, ubersResult] = await Promise.allSettled([
            this._trySmogonTier(displayName, gen, 'ou'),
            this._trySmogonTier(displayName, gen, 'ubers'),
        ]);
        if (ouResult.status === 'fulfilled' && ouResult.value)    return ouResult.value;
        if (ubersResult.status === 'fulfilled' && ubersResult.value) return ubersResult.value;

        // Tiers secundarios (secuencial, corta si encuentra)
        for (const tier of ['uu', 'ru', 'nu', 'pu', 'lc', 'doublesou']) {
            const result = await this._trySmogonTier(displayName, gen, tier);
            if (result) return result;
        }
        return null;
    },

    async _trySmogonTier(displayName, gen, tier) {
        try {
            const res = await fetch(
                `${window.PokeAnalyzer.config.SMOGON_BASE}/gen${gen}${tier}.json`
            );
            if (!res.ok) return null;
            const data = await res.json();
            return data[displayName] ? { tier: tier.toUpperCase(), sets: data[displayName] } : null;
        } catch { return null; }
    },

    /** Convierte slug de PokéAPI al nombre display que usa Smogon. */
    _slugToSmogonName(slug) {
        const SPECIAL = {
            'mr-mime':        'Mr. Mime',
            'mime-jr':        'Mime Jr.',
            'mr-rime':        'Mr. Rime',
            'flabebe':        'Flabébé',
            'type-null':      'Type: Null',
            'jangmo-o':       'Jangmo-o',
            'hakamo-o':       'Hakamo-o',
            'kommo-o':        'Kommo-o',
            'porygon-z':      'Porygon-Z',
            'tapu-koko':      'Tapu Koko',
            'tapu-lele':      'Tapu Lele',
            'tapu-bulu':      'Tapu Bulu',
            'tapu-fini':      'Tapu Fini',
            'ho-oh':          'Ho-Oh',
            'chi-yu':         'Chi-Yu',
            'chien-pao':      'Chien-Pao',
            'ting-lu':        'Ting-Lu',
            'wo-chien':       'Wo-Chien',
            'great-tusk':     'Great Tusk',
            'iron-valiant':   'Iron Valiant',
            'iron-moth':      'Iron Moth',
            'iron-treads':    'Iron Treads',
            'iron-hands':     'Iron Hands',
            'iron-jugulis':   'Iron Jugulis',
            'iron-thorns':    'Iron Thorns',
            'iron-bundle':    'Iron Bundle',
            'iron-boulder':   'Iron Boulder',
            'iron-crown':     'Iron Crown',
            'sandy-shocks':   'Sandy Shocks',
            'scream-tail':    'Scream Tail',
            'brute-bonnet':   'Brute Bonnet',
            'flutter-mane':   'Flutter Mane',
            'slither-wing':   'Slither Wing',
            'roaring-moon':   'Roaring Moon',
            'walking-wake':   'Walking Wake',
            'iron-leaves':    'Iron Leaves',
            'raging-bolt':    'Raging Bolt',
            'gouging-fire':   'Gouging Fire',
            'primarina':      'Primarina',
            'dragapult':      'Dragapult',
        };
        if (SPECIAL[slug]) return SPECIAL[slug];
        // Título case: "great-tusk" → "Great Tusk"
        return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    },

    /**
     * Busca la traducción al castellano de un movimiento por su slug.
     * Devuelve { nameEs, type } o null si no existe.
     * Cache en memoria para evitar llamadas repetidas.
     */
    _moveCache: {},
    async fetchMoveSpanish(slug) {
        if (this._moveCache[slug]) return this._moveCache[slug];
        try {
            const res = await fetch(`${window.PokeAnalyzer.config.POKEAPI_BASE}/move/${slug}`);
            if (!res.ok) return null;
            const data = await res.json();
            const nameEs = data.names?.find(n => n.language.name === 'es')?.name
                || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const result = { nameEs, type: data.type.name };
            this._moveCache[slug] = result;
            return result;
        } catch { return null; }
    },

    _speciesCache: {},
    async fetchSpeciesBreeding(name) {
        const key = String(name).toLowerCase().trim();
        if (this._speciesCache[key]) return this._speciesCache[key];
        try {
            const res = await fetch(`${window.PokeAnalyzer.config.POKEAPI_BASE}/pokemon-species/${key}`);
            if (!res.ok) return null;
            const data = await res.json();
            const result = {
                name: data.name,
                eggGroups: (data.egg_groups || []).map(g => g.name),
                hatchCounter: data.hatch_counter ?? 20,
                genderRate: data.gender_rate ?? -1,
                isBaby: data.is_baby ?? false,
            };
            this._speciesCache[key] = result;
            return result;
        } catch { return null; }
    },

    _pokemonListCache: null,
    async fetchPokemonList() {
        if (this._pokemonListCache) return this._pokemonListCache;
        try {
            const res = await fetch(`${window.PokeAnalyzer.config.POKEAPI_BASE}/pokemon?limit=1025`);
            if (!res.ok) return [];
            const data = await res.json();
            this._pokemonListCache = data.results.map(p => ({
                name: p.name,
                id: Number(p.url.split('/').filter(Boolean).pop()),
            }));
            return this._pokemonListCache;
        } catch { return []; }
    },

    /** Sprite animado Gen V > estático > vacío. */
    getBestSprite(pokemon) {
        return pokemon.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default
            || pokemon.sprites?.front_default
            || '';
    },

    flattenEvoChain(chainLink) {
        const result = [];
        let node = chainLink;
        while (node) {
            result.push({ name: node.species.name, url: node.species.url });
            node = node.evolves_to?.[0] ?? null;
        }
        return result;
    },

    speciesUrlToId(url)  { return url.split('/').filter(Boolean).pop(); },
    staticSpriteUrl(id)  { return `${window.PokeAnalyzer.config.SPRITE_RAW}/${id}.png`; },

    // ── Privados ─────────────────────────────────────────────────

    async _fetchPokemon(query) {
        const q   = String(query).toLowerCase().trim();
        const res = await fetch(`${window.PokeAnalyzer.config.POKEAPI_BASE}/pokemon/${q}`);
        if (!res.ok) {
            if (res.status === 404) throw new Error(`POKEMON "${query.toUpperCase()}" NO ENCONTRADO`);
            throw new Error(`ERROR AL CONECTAR CON POKEAPI (HTTP ${res.status})`);
        }
        return res.json();
    },

    async _fetchSpecies(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error('ERROR AL CARGAR DATOS DE ESPECIE');
        return res.json();
    },

    async _fetchEvoChain(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error('ERROR AL CARGAR CADENA DE EVOLUCION');
        return res.json();
    },

    async _fetchMove(name) {
        const res = await fetch(`${window.PokeAnalyzer.config.POKEAPI_BASE}/move/${name}`);
        if (!res.ok) return null;
        const data = await res.json();

        const { GEN_NUM_MAP } = window.PokeAnalyzer.config;
        const esName = data.names?.find(n => n.language.name === 'es')?.name
            || _capitalize(data.name.replace(/-/g, ' '));

        return {
            name:          data.name,
            nameEs:        esName,
            type:          data.type.name,
            power:         data.power,
            category:      data.damage_class.name,
            accuracy:      data.accuracy,
            generationNum: GEN_NUM_MAP[data.generation?.name] ?? 1,
        };
    },

    async _fetchAbility(name) {
        const { GEN_NUM_MAP } = window.PokeAnalyzer.config;
        const res = await fetch(`${window.PokeAnalyzer.config.POKEAPI_BASE}/ability/${name}`);
        if (!res.ok) return null;
        const data = await res.json();
        const nameEs = data.names?.find(n => n.language.name === 'es')?.name ?? null;
        const genNum = GEN_NUM_MAP[data.generation?.name] ?? 3;
        return nameEs ? { nameEs, genNum } : null;
    },
};

function _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
