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

        // Eliminar duplicados y limitar a 60
        const unique = [...new Set(prioritized)].slice(0, 60);

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
            map.set(eng, r.status === 'fulfilled' && r.value
                ? r.value
                : _capitalize(eng.replace(/-/g, ' ')));
        });
        return map;
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
        const res = await fetch(`${window.PokeAnalyzer.config.POKEAPI_BASE}/ability/${name}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.names?.find(n => n.language.name === 'es')?.name ?? null;
    },
};

function _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
