/**
 * app.js — Orquestador principal.
 * Conecta los módulos sin contener lógica de fetch ni de DOM.
 */

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.app = {

    state: {
        selectedGen: 9,
        cache: null,   // { pokemon, evoData, abilitiesEs, smogonData, smogonGen }
    },

    init() {
        const { config, renderer } = window.PokeAnalyzer;
        renderer.buildGenButtons(config.GENERATIONS, this.state.selectedGen);
        this._bindEvents();
    },

    _bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => this.run());

        document.getElementById('searchInput').addEventListener('keydown', e => {
            if (e.key === 'Enter') this.run();
        });

        document.getElementById('genGrid').addEventListener('click', e => {
            const btn = e.target.closest('.gen-btn');
            if (!btn) return;
            this.state.selectedGen = Number(btn.dataset.gen);
            window.PokeAnalyzer.renderer.setActiveGenButton(this.state.selectedGen);
            if (this.state.cache) this._runAnalysis();
        });

        document.getElementById('evoChain').addEventListener('click', e => {
            const item = e.target.closest('.evo-item');
            if (!item) return;
            document.getElementById('searchInput').value = item.dataset.name;
            this.run();
        });

        // Comparador
        document.getElementById('compareBtn').addEventListener('click', () => this.runCompare());
        document.getElementById('compareInput').addEventListener('keydown', e => {
            if (e.key === 'Enter') this.runCompare();
        });
    },

    async run() {
        const { pokeAPI, renderer } = window.PokeAnalyzer;

        const query = document.getElementById('searchInput').value.trim();

        if (!query) {
            renderer.showMessage('INGRESA EL NOMBRE O ID DE UN POKEMON');
            return;
        }

        renderer.resetResults();
        renderer.hideCompareSection();
        renderer.setSearchBusy(true);

        // ── Fase 1: datos del Pokémon ────────────────────────────
        renderer.showPokeLoading();

        let pokemon, evoData;
        try {
            ({ pokemon, evoData } = await pokeAPI.fetchAll(query));
        } catch (err) {
            renderer.hidePokeLoading();
            renderer.showMessage(err.message, 'error');
            renderer.setSearchBusy(false);
            return;
        }

        renderer.hidePokeLoading();
        renderer.showCompareSection();

        // ── Fase 2: habilidades en castellano + sets Smogon ────────
        renderer.showAILoading();

        try {
            const [abilitiesEs, smogonData] = await Promise.all([
                pokeAPI.fetchAbilitiesSpanish(pokemon),
                pokeAPI.fetchSmogonSets(pokemon.name, this.state.selectedGen),
            ]);

            this.state.cache = {
                pokemon, evoData, abilitiesEs,
                smogonData, smogonGen: this.state.selectedGen,
            };
            renderer.renderPokemon(pokemon, evoData, abilitiesEs);
            this._runAnalysis();
        } catch (err) {
            renderer.hideAILoading();
            renderer.showMessage(err.message, 'error');
        }

        renderer.setSearchBusy(false);
    },

    async runCompare() {
        const { pokeAPI, renderer } = window.PokeAnalyzer;

        if (!this.state.cache?.pokemon) {
            renderer.showMessage('PRIMERO BUSCA UN POKEMON PARA COMPARAR', 'error');
            return;
        }

        const query = document.getElementById('compareInput').value.trim();
        if (!query) {
            renderer.showMessage('INGRESA EL NOMBRE DEL POKEMON A COMPARAR', 'error');
            return;
        }

        const btn = document.getElementById('compareBtn');
        btn.disabled = true;
        btn.textContent = '...';
        renderer.hideMessage();

        try {
            const pokemon2 = await pokeAPI._fetchPokemon(query);
            renderer.renderComparison(this.state.cache.pokemon, pokemon2);
        } catch (err) {
            renderer.showMessage(err.message, 'error');
        }

        btn.disabled = false;
        btn.textContent = 'VS';
    },

    async _runAnalysis() {
        const { config, analyzer, renderer, pokeAPI } = window.PokeAnalyzer;
        const { pokemon, abilitiesEs } = this.state.cache;
        const generation = config.GENERATIONS.find(g => g.num === this.state.selectedGen);

        renderer.resetAnalysis();
        renderer.showAILoading();

        try {
            // Re-fetch Smogon data si la generación cambió o no hay datos
            let smogonData = this.state.cache.smogonData;
            if (!smogonData || this.state.cache.smogonGen !== this.state.selectedGen) {
                smogonData = await pokeAPI.fetchSmogonSets(pokemon.name, this.state.selectedGen);
                this.state.cache.smogonData = smogonData;
                this.state.cache.smogonGen = this.state.selectedGen;
            }

            const analysis = await analyzer.analyze(pokemon, abilitiesEs, generation, smogonData);
            renderer.hideAILoading();
            renderer.renderAnalysis(analysis, generation);
        } catch (err) {
            renderer.hideAILoading();
            renderer.showMessage(err.message, 'error');
        }
    },
};

document.addEventListener('DOMContentLoaded', () => {
    window.PokeAnalyzer.app.init();
});
