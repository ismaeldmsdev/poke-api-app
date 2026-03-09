/**
 * app.js — Orquestador principal.
 * Conecta los módulos sin contener lógica de fetch ni de DOM.
 */

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.app = {

    state: {
        selectedGen: 9,
        cache: null,   // { pokemon, evoData, movesData, abilitiesEs }
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
    },

    async run() {
        const { pokeAPI, renderer } = window.PokeAnalyzer;

        const query = document.getElementById('searchInput').value.trim();

        if (!query) {
            renderer.showMessage('INGRESA EL NOMBRE O ID DE UN POKEMON');
            return;
        }

        renderer.resetResults();
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
        renderer.renderPokemon(pokemon, evoData);

        // ── Fase 2: movimientos + habilidades en castellano ────────
        renderer.showAILoading();

        try {
            const [movesData, abilitiesEs] = await Promise.all([
                pokeAPI.fetchMovesData(pokemon),
                pokeAPI.fetchAbilitiesSpanish(pokemon),
            ]);

            this.state.cache = { pokemon, evoData, movesData, abilitiesEs };
            this._runAnalysis();
        } catch (err) {
            renderer.hideAILoading();
            renderer.showMessage(err.message, 'error');
        }

        renderer.setSearchBusy(false);
    },

    _runAnalysis() {
        const { config, analyzer, renderer } = window.PokeAnalyzer;
        const { pokemon, movesData, abilitiesEs } = this.state.cache;
        const generation = config.GENERATIONS.find(g => g.num === this.state.selectedGen);

        renderer.resetAnalysis();
        renderer.showAILoading();

        // Usar setTimeout para que el DOM actualice el spinner antes de la tarea síncrona
        setTimeout(() => {
            try {
                const analysis = analyzer.analyze(pokemon, movesData, abilitiesEs, generation);
                renderer.hideAILoading();
                renderer.renderAnalysis(analysis, generation);
            } catch (err) {
                renderer.hideAILoading();
                renderer.showMessage(err.message, 'error');
            }
        }, 0);
    },
};

document.addEventListener('DOMContentLoaded', () => {
    window.PokeAnalyzer.app.init();
});
