
/**
 * app.js — Orquestador principal.
 * Conecta los módulos sin contener lógica de fetch ni de DOM.
 */

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.app = {

    state: {
        selectedGen: 9,
        cache: null,
        analysis: null,
        coverage: { mode: 'defensive', genNum: 9, selected: [] },
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

        // Generación como eje central: al cambiar, re-analiza TODO
        document.getElementById('genGrid').addEventListener('click', e => {
            const btn = e.target.closest('.gen-btn');
            if (!btn) return;
            const newGen = Number(btn.dataset.gen);
            this._setGeneration(newGen);
        });

        // Desplegable de generación en el header
        const genChip = document.getElementById('activeGenChip');
        const genDropdown = document.getElementById('genDropdown');
        if (genChip && genDropdown) {
            genChip.addEventListener('click', () => {
                const isOpen = !genDropdown.classList.contains('hidden');
                genDropdown.classList.toggle('hidden', isOpen);
                genChip.setAttribute('aria-expanded', String(!isOpen));
            });

            genDropdown.addEventListener('click', e => {
                const btn = e.target.closest('.gen-option');
                if (!btn) return;
                const newGen = Number(btn.dataset.gen);
                genDropdown.classList.add('hidden');
                genChip.setAttribute('aria-expanded', 'false');
                this._setGeneration(newGen);
            });
        }

        document.getElementById('evoChain').addEventListener('click', e => {
            const item = e.target.closest('.evo-item');
            if (!item) return;
            document.getElementById('searchInput').value = item.dataset.name;
            this.run();
        });

        // Selector de sets
        document.getElementById('setDropdown').addEventListener('change', e => {
            const idx = Number(e.target.value);
            if (this.state.analysis && this.state.analysis.allSets[idx]) {
                window.PokeAnalyzer.renderer.renderSelectedSet(
                    this.state.analysis.allSets[idx],
                    this.state.analysis.hasSmogon
                );
            }
        });

        // Versus (modal) desde menú de header
        document.getElementById('closeVersusBtn').addEventListener('click', () => {
            window.PokeAnalyzer.renderer.closeVersusModal();
        });
        document.getElementById('versusModal').addEventListener('click', e => {
            if (e.target?.dataset?.close) window.PokeAnalyzer.renderer.closeVersusModal();
        });
        document.getElementById('versusBtn').addEventListener('click', () => this.runVersus());
        document.getElementById('versusInput').addEventListener('keydown', e => {
            if (e.key === 'Enter') this.runVersus();
        });

        const menuBtn = document.getElementById('headerMenuBtn');
        const menuPanel = document.getElementById('headerMenuPanel');
        const menuVersus = document.getElementById('menuVersusItem');
        if (menuBtn && menuPanel) {
            menuBtn.addEventListener('click', () => {
                const isOpen = !menuPanel.classList.contains('hidden');
                menuPanel.classList.toggle('hidden', isOpen);
                menuBtn.setAttribute('aria-expanded', String(!isOpen));
            });

            menuPanel.addEventListener('click', e => {
                const item = e.target.closest('.header-menu-item');
                if (!item) return;
                menuPanel.classList.add('hidden');
                menuBtn.setAttribute('aria-expanded', 'false');

                if (item.id === 'menuVersusItem' && !item.disabled) {
                    window.PokeAnalyzer.renderer.openVersusModal();
                    document.getElementById('versusInput').focus();
                }
                if (item.id === 'menuCoverageItem') {
                    this._openCoverage();
                }
            });
        }

        // Coverage calculator
        document.getElementById('closeCoverageBtn').addEventListener('click', () => {
            window.PokeAnalyzer.renderer.closeCoverageModal();
        });
        document.getElementById('coverageModal').addEventListener('click', e => {
            if (e.target?.dataset?.closeCov) window.PokeAnalyzer.renderer.closeCoverageModal();
        });

        document.querySelector('.cov-tabs').addEventListener('click', e => {
            const tab = e.target.closest('.cov-tab');
            if (!tab) return;
            this._setCoverageMode(tab.dataset.mode);
        });

        document.getElementById('covGenGrid').addEventListener('click', e => {
            const btn = e.target.closest('.cov-gen-btn');
            if (!btn) return;
            this._setCoverageGen(Number(btn.dataset.gen));
        });

        document.getElementById('covTypeGrid').addEventListener('click', e => {
            const btn = e.target.closest('.cov-type-btn');
            if (!btn) return;
            this._toggleCoverageType(btn.dataset.type);
        });

        document.getElementById('covSelected').addEventListener('click', e => {
            const badge = e.target.closest('.cov-sel-badge');
            if (!badge) return;
            this._toggleCoverageType(badge.dataset.type);
        });

        document.getElementById('covClearBtn').addEventListener('click', () => {
            this.state.coverage.selected = [];
            this._refreshCoverage();
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
        renderer.hideVersusCta();
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
        renderer.showVersusCta();

        // ── Fase 2: movimientos + habilidades + Smogon en paralelo ──
        renderer.showAILoading();

        try {
            const [movesData, abilitiesEs, smogonData] = await Promise.all([
                pokeAPI.fetchMovesData(pokemon),
                pokeAPI.fetchAbilitiesSpanish(pokemon),
                pokeAPI.fetchSmogonSets(pokemon.name, this.state.selectedGen),
            ]);

            this.state.cache = {
                pokemon, evoData, movesData, abilitiesEs,
                smogonData, smogonGen: this.state.selectedGen,
            };
            renderer.renderPokemon(pokemon, evoData, abilitiesEs, this.state.selectedGen);
            this._runAnalysis();
        } catch (err) {
            renderer.hideAILoading();
            renderer.showMessage(err.message, 'error');
        }

        renderer.setSearchBusy(false);
    },

    async runVersus() {
        const { pokeAPI, renderer } = window.PokeAnalyzer;

        if (!this.state.cache?.pokemon) {
            renderer.showMessage('PRIMERO ANALIZA UN POKÉMON PARA USAR VERSUS', 'error');
            return;
        }

        const query = document.getElementById('versusInput').value.trim();
        if (!query) {
            renderer.showMessage('INGRESA EL NOMBRE DEL RIVAL', 'error');
            return;
        }

        renderer.setVersusBusy(true);
        renderer.hideMessage();

        try {
            const pokemon2 = await pokeAPI._fetchPokemon(query);
            renderer.renderVersus(
                this.state.cache.pokemon,
                pokemon2,
                this.state.selectedGen,
                this.state.analysis?.allSets?.[Number(document.getElementById('setDropdown')?.value) || 0] || null
            );
        } catch (err) {
            renderer.showMessage(err.message, 'error');
        }

        renderer.setVersusBusy(false);
    },

    _setGeneration(newGen) {
        const { config, renderer } = window.PokeAnalyzer;
        const exists = config.GENERATIONS.some(g => g.num === newGen);
        if (!exists || newGen === this.state.selectedGen) return;
        this.state.selectedGen = newGen;
        renderer.setActiveGenButton(this.state.selectedGen);
        if (this.state.cache) this._runAnalysis();
    },

    // ── Calculadora de Cobertura ─────────────────────────────────
    _openCoverage() {
        const { renderer } = window.PokeAnalyzer;
        this.state.coverage.genNum = this.state.selectedGen;
        this.state.coverage.selected = [];
        renderer.openCoverageModal();
        renderer.renderCoverageGenGrid(this.state.coverage.genNum);
        renderer.renderCoverageTypeGrid(this.state.coverage.genNum);
        renderer.setCoverageInstruction(this.state.coverage.mode);
        this._refreshCoverage();
    },

    _setCoverageMode(mode) {
        if (mode === this.state.coverage.mode) return;
        this.state.coverage.mode = mode;
        this.state.coverage.selected = [];
        const { renderer } = window.PokeAnalyzer;
        document.querySelectorAll('.cov-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.mode === mode);
        });
        renderer.setCoverageInstruction(mode);
        this._refreshCoverage();
    },

    _setCoverageGen(genNum) {
        if (genNum === this.state.coverage.genNum) return;
        this.state.coverage.genNum = genNum;
        const { renderer } = window.PokeAnalyzer;
        const validTypes = window.PokeAnalyzer.config.getTypesForGen(genNum);
        this.state.coverage.selected = this.state.coverage.selected.filter(t => validTypes.includes(t));
        renderer.renderCoverageGenGrid(genNum);
        renderer.renderCoverageTypeGrid(genNum);
        this._refreshCoverage();
    },

    _toggleCoverageType(type) {
        const { selected, mode } = this.state.coverage;
        const idx = selected.indexOf(type);
        if (idx >= 0) {
            selected.splice(idx, 1);
        } else {
            const max = mode === 'defensive' ? 2 : 4;
            if (selected.length >= max) return;
            selected.push(type);
        }
        this._refreshCoverage();
    },

    _refreshCoverage() {
        const { renderer } = window.PokeAnalyzer;
        const { selected, mode, genNum } = this.state.coverage;
        renderer.renderCoverageSelected(selected);
        renderer.renderCoverageResults(selected, mode, genNum);

        document.querySelectorAll('.cov-type-btn').forEach(btn => {
            btn.classList.toggle('selected', selected.includes(btn.dataset.type));
        });
    },

    async _runAnalysis() {
        const { config, analyzer, renderer, pokeAPI } = window.PokeAnalyzer;
        const { pokemon, movesData, abilitiesEs } = this.state.cache;
        const generation = config.GENERATIONS.find(g => g.num === this.state.selectedGen);

        if (!movesData || movesData.length === 0) {
            renderer.hideAILoading();
            renderer.showMessage('No se pudieron cargar los movimientos. Intenta de nuevo.', 'error');
            return;
        }

        renderer.resetAnalysis();
        renderer.showAILoading();
        renderer.updateAbilities(pokemon, abilitiesEs, this.state.selectedGen);

        try {
            // Re-fetch Smogon si la generación cambió
            let smogonData = this.state.cache.smogonData;
            if (!smogonData || this.state.cache.smogonGen !== this.state.selectedGen) {
                smogonData = await pokeAPI.fetchSmogonSets(pokemon.name, this.state.selectedGen);
                this.state.cache.smogonData = smogonData;
                this.state.cache.smogonGen = this.state.selectedGen;
            }

            const analysis = await analyzer.analyze(pokemon, movesData, abilitiesEs, generation, smogonData);
            this.state.analysis = analysis;
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
