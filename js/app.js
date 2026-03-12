
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
        tm: { gameId: '', search: '', typeFilter: 'all' },
        team: { genNum: 9, slots: [null, null, null, null, null, null], searchingSlot: -1 },
        breeding: { parent1: null, parent2: null, destinyKnot: false, everstone: false },
        pokemonList: null,
        capture: { name: '', captureRate: null },
    },

    _togglePanel(panel, btn) {
        const isOpen = !panel.classList.contains('hidden');
        panel.classList.toggle('hidden', isOpen);
        if (btn) btn.setAttribute('aria-expanded', String(!isOpen));
    },

    _debounce(fn, ms) {
        let timer;
        return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
    },

    init() {
        const { config, renderer, pokeAPI } = window.PokeAnalyzer;
        renderer.buildGenButtons(config.GENERATIONS, this.state.selectedGen);
        this._bindEvents();
        pokeAPI.fetchPokemonList()
            .then(list => { this.state.pokemonList = list; })
            .catch(err => console.warn('[BuildDex] No se pudo cargar la lista de Pokémon:', err));
    },

    _hideAllAc() {
        const { renderer } = window.PokeAnalyzer;
        ['searchAc', 'versusAc1', 'versusAc2'].forEach(id => renderer.hideSearchAc(id));
    },

    _getSuggestions(query, limit) {
        if (!this.state.pokemonList) return [];
        const list = this.state.pokemonList;
        const { UI } = window.PokeAnalyzer.config;
        const max = limit ?? UI.AC_MAIN_MAX;
        const startsWith = list.filter(p => p.name.startsWith(query));
        const includes   = list.filter(p => !p.name.startsWith(query) && p.name.includes(query));
        return [...startsWith, ...includes].slice(0, max);
    },

    _filterPokemonSuggestions(query, targetId) {
        const { renderer } = window.PokeAnalyzer;
        if (query.length < 2) { renderer.hideSearchAc(targetId); return; }
        renderer.showSearchAc(targetId, this._getSuggestions(query));
    },

    _bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => { this._hideAllAc(); this.run(); });

        document.getElementById('searchInput').addEventListener('keydown', e => {
            if (e.key === 'Enter') { this._hideAllAc(); this.run(); }
            if (e.key === 'Escape') this._hideAllAc();
        });

        document.getElementById('searchInput').addEventListener('input', this._debounce(e => {
            this._filterPokemonSuggestions(e.target.value.trim().toLowerCase(), 'searchAc');
        }, 120));

        document.getElementById('searchAc').addEventListener('click', e => {
            const item = e.target.closest('.search-ac-item');
            if (!item) return;
            document.getElementById('searchInput').value = item.dataset.name;
            this._hideAllAc();
            this.run();
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
                this._togglePanel(genDropdown, genChip);
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

        // Versus (modal) - 2 campos independientes
        document.getElementById('closeVersusBtn').addEventListener('click', () => {
            window.PokeAnalyzer.renderer.closeVersusModal();
        });
        document.getElementById('versusModal').addEventListener('click', e => {
            if (e.target?.dataset?.close) window.PokeAnalyzer.renderer.closeVersusModal();
        });
        document.getElementById('versusBtn').addEventListener('click', () => this.runVersus());

        document.getElementById('versusInput1').addEventListener('input', this._debounce(e => {
            this._filterPokemonSuggestions(e.target.value.trim().toLowerCase(), 'versusAc1');
        }, 120));
        document.getElementById('versusInput2').addEventListener('input', this._debounce(e => {
            this._filterPokemonSuggestions(e.target.value.trim().toLowerCase(), 'versusAc2');
        }, 120));

        document.getElementById('versusAc1').addEventListener('click', e => {
            const item = e.target.closest('.search-ac-item');
            if (item) { document.getElementById('versusInput1').value = item.dataset.name; window.PokeAnalyzer.renderer.hideSearchAc('versusAc1'); }
        });
        document.getElementById('versusAc2').addEventListener('click', e => {
            const item = e.target.closest('.search-ac-item');
            if (item) { document.getElementById('versusInput2').value = item.dataset.name; window.PokeAnalyzer.renderer.hideSearchAc('versusAc2'); }
        });

        ['versusInput1', 'versusInput2'].forEach(id => {
            document.getElementById(id).addEventListener('keydown', e => {
                if (e.key === 'Enter') this.runVersus();
                if (e.key === 'Escape') this._hideAllAc();
            });
        });

        const menuBtn = document.getElementById('headerMenuBtn');
        const menuPanel = document.getElementById('headerMenuPanel');
        const menuHandlers = {
            menuVersusItem:   () => { window.PokeAnalyzer.renderer.openVersusModal(); document.getElementById('versusInput1').focus(); },
            menuCoverageItem: () => this._openCoverage(),
            menuTmItem:       () => this._openTmLocator(),
            menuTeamItem:     () => this._openTeamAnalyzer(),
            menuBreedingItem: () => this._openBreeding(),
            menuCaptureItem:  () => this._openCapture(),
        };

        if (menuBtn && menuPanel) {
            menuBtn.addEventListener('click', () => this._togglePanel(menuPanel, menuBtn));

            menuPanel.addEventListener('click', e => {
                const item = e.target.closest('.header-menu-item');
                if (!item) return;
                menuPanel.classList.add('hidden');
                menuBtn.setAttribute('aria-expanded', 'false');
                const handler = menuHandlers[item.id];
                if (handler) handler();
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

        // TM Locator
        document.getElementById('closeTmBtn').addEventListener('click', () => {
            window.PokeAnalyzer.renderer.closeTmModal();
        });
        document.getElementById('tmModal').addEventListener('click', e => {
            if (e.target?.dataset?.closeTm) window.PokeAnalyzer.renderer.closeTmModal();
        });

        document.getElementById('tmGameSelect').addEventListener('change', e => {
            this.state.tm.gameId = e.target.value;
            this.state.tm.search = '';
            this.state.tm.typeFilter = 'all';
            document.getElementById('tmSearch').value = '';
            this._refreshTm();
        });

        document.getElementById('tmSearch').addEventListener('input', this._debounce(e => {
            this.state.tm.search = e.target.value.trim().toLowerCase();
            this._refreshTm();
        }, 200));

        document.getElementById('tmTypeFilter').addEventListener('click', e => {
            const btn = e.target.closest('.tm-type-btn');
            if (!btn) return;
            this.state.tm.typeFilter = btn.dataset.type;
            document.querySelectorAll('.tm-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === this.state.tm.typeFilter));
            this._refreshTm();
        });

        // Team Analyzer
        document.getElementById('closeTeamBtn').addEventListener('click', () => {
            window.PokeAnalyzer.renderer.closeTeamModal();
        });
        document.getElementById('teamModal').addEventListener('click', e => {
            if (e.target?.dataset?.closeTeam) window.PokeAnalyzer.renderer.closeTeamModal();
        });

        document.getElementById('teamGenGrid').addEventListener('click', e => {
            const btn = e.target.closest('.cov-gen-btn');
            if (!btn) return;
            this._setTeamGen(Number(btn.dataset.gen));
        });

        // Slots: tap vacío → abrir búsqueda; tap quitar → eliminar
        document.getElementById('teamSlots').addEventListener('click', e => {
            const removeBtn = e.target.closest('.team-slot-remove');
            if (removeBtn) {
                this._removeTeamPokemon(Number(removeBtn.dataset.slot));
                return;
            }
            const emptySlot = e.target.closest('.team-slot--empty');
            if (emptySlot) {
                const idx = Number(emptySlot.dataset.slot);
                this.state.team.searchingSlot = idx;
                window.PokeAnalyzer.renderer.openTeamSearch(idx);
            }
        });
        document.getElementById('teamSlots').addEventListener('keydown', e => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const emptySlot = e.target.closest('.team-slot--empty');
            if (emptySlot) {
                e.preventDefault();
                const idx = Number(emptySlot.dataset.slot);
                this.state.team.searchingSlot = idx;
                window.PokeAnalyzer.renderer.openTeamSearch(idx);
            }
        });

        // Overlay de búsqueda de Pokémon para equipo
        document.getElementById('teamPokeSearchClose').addEventListener('click', () => {
            window.PokeAnalyzer.renderer.closeTeamSearch();
        });
        document.getElementById('teamPokeSearchBg').addEventListener('click', () => {
            window.PokeAnalyzer.renderer.closeTeamSearch();
        });

        document.getElementById('teamPokeSearchInput').addEventListener('input', this._debounce(e => {
            this._filterTeamPokeSearch(e.target.value.trim().toLowerCase());
        }, 120));
        document.getElementById('teamPokeSearchInput').addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                window.PokeAnalyzer.renderer.closeTeamSearch();
                return;
            }
            if (e.key === 'Enter') {
                const first = document.querySelector('.team-poke-search-item');
                if (first) {
                    const slot = this.state.team.searchingSlot;
                    window.PokeAnalyzer.renderer.closeTeamSearch();
                    this._addTeamPokemon(slot, first.dataset.name);
                }
            }
        });
        document.getElementById('teamPokeSearchResults').addEventListener('click', e => {
            const item = e.target.closest('.team-poke-search-item');
            if (!item) return;
            const slot = this.state.team.searchingSlot;
            window.PokeAnalyzer.renderer.closeTeamSearch();
            this._addTeamPokemon(slot, item.dataset.name);
        });

        // Breeding modal
        document.getElementById('closeBreedingBtn').addEventListener('click', () => {
            window.PokeAnalyzer.renderer.closeBreedingModal();
        });
        document.getElementById('breedingModal').addEventListener('click', e => {
            if (e.target?.dataset?.closeBreed) window.PokeAnalyzer.renderer.closeBreedingModal();
        });

        document.getElementById('breedParents').addEventListener('input', this._debounce(e => {
            const inp = e.target.closest('.breed-search');
            if (!inp) return;
            const slot = Number(inp.dataset.slot);
            this._filterBreedSuggestions(slot, inp.value.trim().toLowerCase());
        }, 120));

        document.getElementById('breedParents').addEventListener('keydown', e => {
            const inp = e.target.closest('.breed-search');
            if (!inp || e.key !== 'Enter') return;
            const first = inp.closest('.breed-parent')?.querySelector('.breed-ac-item');
            if (first) this._setBreedingParent(Number(inp.dataset.slot), first.dataset.name);
        });

        document.getElementById('breedParents').addEventListener('click', e => {
            const acItem = e.target.closest('.breed-ac-item');
            if (acItem) {
                this._setBreedingParent(Number(acItem.dataset.slot), acItem.dataset.name);
                return;
            }
            const removeBtn = e.target.closest('.breed-parent-remove');
            if (removeBtn) {
                this._removeBreedingParent(Number(removeBtn.dataset.slot));
            }
        });

        document.getElementById('breedItems').addEventListener('change', e => {
            const cb = e.target.closest('.breed-item-cb');
            if (!cb) return;
            this._toggleBreedingItem(cb.dataset.item, cb.checked);
        });


        // Capture calculator modal
        const closeCaptureBtn = document.getElementById('closeCaptureBtn');
        const captureModal = document.getElementById('captureModal');
        if (closeCaptureBtn && captureModal) {
            closeCaptureBtn.addEventListener('click', () => {
                window.PokeAnalyzer.renderer.closeCaptureModal();
            });
            captureModal.addEventListener('click', e => {
                if (e.target?.dataset?.closeCapture) window.PokeAnalyzer.renderer.closeCaptureModal();
            });
        }

        const captureInput = document.getElementById('captureInput');
        const captureAc = document.getElementById('captureAc');
        if (captureInput && captureAc) {
            captureInput.addEventListener('input', this._debounce(e => {
                this._filterPokemonSuggestions(e.target.value.trim().toLowerCase(), 'captureAc');
            }, 120));
            captureInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    const first = captureAc.querySelector('.search-ac-item');
                    if (first) {
                        captureInput.value = first.dataset.name;
                        this._onCapturePokemonSelected(first.dataset.name);
                        window.PokeAnalyzer.renderer.hideSearchAc('captureAc');
                    }
                }
                if (e.key === 'Escape') {
                    this._hideAllAc();
                }
            });
            captureAc.addEventListener('click', e => {
                const item = e.target.closest('.search-ac-item');
                if (!item) return;
                captureInput.value = item.dataset.name;
                this._onCapturePokemonSelected(item.dataset.name);
                window.PokeAnalyzer.renderer.hideSearchAc('captureAc');
            });
        }

        const hpSlider = document.getElementById('captureHpSlider');
        if (hpSlider) {
            hpSlider.addEventListener('input', e => {
                const v = Number(e.target.value || 100);
                window.PokeAnalyzer.renderer.renderCaptureHp(v);
            });
        }

        const calcBtn = document.getElementById('captureCalcBtn');
        if (calcBtn) {
            calcBtn.addEventListener('click', () => this._runCaptureCalc());
        }
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

        const q1 = document.getElementById('versusInput1').value.trim();
        const q2 = document.getElementById('versusInput2').value.trim();
        if (!q1 || !q2) {
            renderer.showMessage('INGRESA LOS DOS POKÉMON PARA COMPARAR', 'error');
            return;
        }

        this._hideAllAc();
        renderer.setVersusBusy(true);
        renderer.hideMessage();

        try {
            const [pokemon1, pokemon2] = await Promise.all([
                pokeAPI._fetchPokemon(q1),
                pokeAPI._fetchPokemon(q2),
            ]);
            renderer.renderVersus(pokemon1, pokemon2, this.state.selectedGen, null);
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

    // ── Localizador de MT ───────────────────────────────────────
    _openTmLocator() {
        const doOpen = () => {
            const { renderer, tmData } = window.PokeAnalyzer;
            renderer.openTmModal();
            renderer.renderTmGameSelector(tmData.GAMES.filter(g => tmData[g.id]));
            this._refreshTm();
        };
        if (window.PokeAnalyzer.tmData) {
            doOpen();
        } else {
            const script = document.createElement('script');
            script.src = 'js/tm-data.js';
            script.onload = doOpen;
            script.onerror = () => console.warn('[BuildDex] No se pudo cargar tm-data.js');
            document.head.appendChild(script);
        }
    },

    _refreshTm() {
        const { renderer, tmData, config } = window.PokeAnalyzer;
        const { gameId, search, typeFilter } = this.state.tm;

        if (!gameId || !tmData[gameId]) {
            renderer.renderTmTypeFilter([]);
            renderer.renderTmList([], gameId);
            return;
        }

        const allTms = tmData[gameId];
        const game = tmData.GAMES.find(g => g.id === gameId);
        const genTypes = config.getTypesForGen(game?.gen || 9);
        const usedTypes = [...new Set(allTms.map(t => t.type))].filter(t => genTypes.includes(t)).sort((a, b) => genTypes.indexOf(a) - genTypes.indexOf(b));
        renderer.renderTmTypeFilter(usedTypes);

        document.querySelectorAll('.tm-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === typeFilter));

        let filtered = allTms;
        if (typeFilter !== 'all') {
            filtered = filtered.filter(t => t.type === typeFilter);
        }
        if (search) {
            filtered = filtered.filter(t =>
                t.move.toLowerCase().includes(search) ||
                t.num.toLowerCase().includes(search) ||
                t.loc.toLowerCase().includes(search)
            );
        }

        renderer.renderTmList(filtered, gameId);
    },

    // ── Analizador de Equipo ────────────────────────────────────
    _openTeamAnalyzer() {
        const { renderer } = window.PokeAnalyzer;
        this.state.team.genNum = this.state.selectedGen;
        this.state.team.slots = [null, null, null, null, null, null];
        renderer.openTeamModal();
        renderer.renderTeamGenGrid(this.state.team.genNum);
        renderer.renderTeamSlots(this.state.team.slots);
        renderer.hide('teamResults');
    },

    _filterTeamPokeSearch(query) {
        const { renderer, config } = window.PokeAnalyzer;
        const slot = this.state.team.searchingSlot;
        if (query.length < 2) {
            const results = document.getElementById('teamPokeSearchResults');
            if (results) results.innerHTML = '<p class="team-poke-search-hint">Escribe 2+ letras para buscar.</p>';
            return;
        }
        renderer.renderTeamPokeSearchResults(this._getSuggestions(query, config.UI.AC_TEAM_MAX), slot);
    },

    async _addTeamPokemon(slotIdx, query) {
        if (!query) return;
        const { pokeAPI, renderer } = window.PokeAnalyzer;
        renderer.setTeamSlotBusy(slotIdx, true);

        try {
            const pokemon = await pokeAPI._fetchPokemon(query);
            this.state.team.slots[slotIdx] = {
                name: pokemon.name,
                id: pokemon.id,
                types: pokemon.types.map(t => t.type.name),
                sprite: pokeAPI.getBestSprite(pokemon),
            };
        } catch {
            renderer.setTeamSlotBusy(slotIdx, false);
            renderer.showTeamSlotError(slotIdx);
            return;
        }

        renderer.renderTeamSlots(this.state.team.slots);
        this._refreshTeamAnalysis();
    },

    _removeTeamPokemon(slotIdx) {
        this.state.team.slots[slotIdx] = null;
        window.PokeAnalyzer.renderer.renderTeamSlots(this.state.team.slots);
        this._refreshTeamAnalysis();
    },

    _setTeamGen(genNum) {
        if (genNum === this.state.team.genNum) return;
        this.state.team.genNum = genNum;
        window.PokeAnalyzer.renderer.renderTeamGenGrid(genNum);
        this._refreshTeamAnalysis();
    },

    _refreshTeamAnalysis() {
        const { renderer, config } = window.PokeAnalyzer;
        const { slots, genNum } = this.state.team;
        const filled = slots.filter(Boolean);

        if (filled.length < 1) { renderer.hide('teamResults'); return; }
        renderer.show('teamResults');

        const allTypes = config.getTypesForGen(genNum);

        const matrix = [];
        const warnings = [];

        for (const atkType of allTypes) {
            const row = { type: atkType, cells: [], score: 0 };
            let weakCount = 0;

            for (const slot of slots) {
                if (!slot) { row.cells.push(null); continue; }
                const pokeTypes = slot.types.filter(t => allTypes.includes(t));
                if (pokeTypes.length === 0) pokeTypes.push('normal');
                const mul = config.getEffectiveness(atkType, pokeTypes, genNum);

                let sc = 0;
                if (mul >= 4)       sc = -2;
                else if (mul >= 2)  sc = -1;
                else if (mul === 0.5)  sc = 1;
                else if (mul === 0.25) sc = 2;
                else if (mul === 0)    sc = 3;

                row.cells.push({ mul, score: sc });
                row.score += sc;
                if (mul >= 2) weakCount++;
            }

            if (weakCount >= 3) warnings.push({ type: atkType, count: weakCount });
            matrix.push(row);
        }

        const teamTypes = new Set();
        for (const s of filled) {
            for (const t of s.types) { if (allTypes.includes(t)) teamTypes.add(t); }
        }

        const superEff = [], notCovered = [];
        for (const target of allTypes) {
            let hit = false;
            for (const atk of teamTypes) {
                if (config.getEffectiveness(atk, [target], genNum) >= 2) { hit = true; break; }
            }
            (hit ? superEff : notCovered).push(target);
        }

        renderer.renderTeamWarnings(warnings);
        renderer.renderTeamMatrix(matrix, slots);
        renderer.renderTeamOffensive(superEff, notCovered, allTypes.length);
    },

    // ── Simulador de Crianza ───────────────────────────────────
    _openBreeding() {
        const { renderer } = window.PokeAnalyzer;
        this.state.breeding = { parent1: null, parent2: null, destinyKnot: false, everstone: false };
        renderer.openBreedingModal();
        renderer.renderBreedingParents(null, null);
        renderer.renderBreedingItems(false, false);
        renderer.hide('breedResult');
        renderer.hide('breedError');
    },

    _filterBreedSuggestions(slot, query) {
        const { renderer, config } = window.PokeAnalyzer;
        if (query.length < 2) { renderer.hideBreedingSuggestions(slot); return; }
        renderer.showBreedingSuggestions(slot, this._getSuggestions(query, config.UI.AC_BREED_MAX));
    },

    async _setBreedingParent(slot, name) {
        if (!name) return;
        const { pokeAPI, renderer } = window.PokeAnalyzer;

        renderer.setBreedingSlotBusy(slot, true);

        try {
            const [pokemon, species] = await Promise.all([
                pokeAPI._fetchPokemon(name),
                pokeAPI.fetchSpeciesBreeding(name),
            ]);

            if (!pokemon || !species) throw new Error('No encontrado');

            const parentData = {
                name: pokemon.name,
                id: pokemon.id,
                sprite: pokeAPI.getBestSprite(pokemon),
                types: pokemon.types.map(t => t.type.name),
                eggGroups: species.eggGroups,
                genderRate: species.genderRate,
                hatchCounter: species.hatchCounter,
                stats: {},
            };
            const statMap = { hp: 'PS', attack: 'Atq', defense: 'Def', 'special-attack': 'Atq.Esp', 'special-defense': 'Def.Esp', speed: 'Vel' };
            for (const s of pokemon.stats) {
                parentData.stats[statMap[s.stat.name] || s.stat.name] = s.base_stat;
            }

            if (slot === 1) this.state.breeding.parent1 = parentData;
            else this.state.breeding.parent2 = parentData;
        } catch {
            renderer.setBreedingSlotBusy(slot, false);
            renderer.renderBreedingError('No se encontró el Pokémon.');
            return;
        }

        renderer.renderBreedingParents(this.state.breeding.parent1, this.state.breeding.parent2);
        this._calculateBreeding();
    },

    _removeBreedingParent(slot) {
        if (slot === 1) this.state.breeding.parent1 = null;
        else this.state.breeding.parent2 = null;
        const { renderer } = window.PokeAnalyzer;
        renderer.renderBreedingParents(this.state.breeding.parent1, this.state.breeding.parent2);
        renderer.hide('breedResult');
        renderer.hide('breedError');
    },

    _toggleBreedingItem(item, checked) {
        if (item === 'destinyKnot') this.state.breeding.destinyKnot = checked;
        if (item === 'everstone') this.state.breeding.everstone = checked;
        this._calculateBreeding();
    },

    _checkBreedingCompatibility() {
        const { parent1, parent2 } = this.state.breeding;
        if (!parent1 || !parent2) return { compatible: false, reason: '' };

        const g1 = parent1.eggGroups;
        const g2 = parent2.eggGroups;

        if (g1.includes('no-eggs') || g2.includes('no-eggs')) {
            return { compatible: false, reason: 'Uno de los Pokémon pertenece al grupo "Sin huevos" (Undiscovered) y no puede criar.' };
        }
        if (g1.includes('ditto') || g2.includes('ditto')) {
            return { compatible: true, reason: 'Compatible vía Ditto.' };
        }
        const shared = g1.filter(g => g2.includes(g));
        if (shared.length > 0) {
            return { compatible: true, reason: '' };
        }
        return { compatible: false, reason: 'Estos Pokémon no pueden criar entre sí. No comparten ningún grupo huevo.' };
    },

    _calculateBreeding() {
        const { renderer, config } = window.PokeAnalyzer;
        const { parent1, parent2, destinyKnot } = this.state.breeding;

        if (!parent1 || !parent2) {
            renderer.hide('breedResult');
            renderer.hide('breedError');
            return;
        }

        const compat = this._checkBreedingCompatibility();
        if (!compat.compatible) {
            renderer.renderBreedingError(compat.reason);
            renderer.hide('breedResult');
            return;
        }

        renderer.hide('breedError');

        const isDitto1 = parent1.eggGroups.includes('ditto');
        const isDitto2 = parent2.eggGroups.includes('ditto');
        let mother = isDitto1 ? parent2 : (isDitto2 ? parent1 : null);
        if (!mother) {
            mother = parent2.genderRate >= 0 ? parent2 : parent1;
        }

        const B = config.BREEDING;
        const hatchSteps = (mother.hatchCounter + 1) * B.STEPS_PER_CYCLE;

        const statKeys = ['PS', 'Atq', 'Def', 'Atq.Esp', 'Def.Esp', 'Vel'];
        const inheritedCount = destinyKnot ? B.DESTINY_KNOT_IVS : 3;
        const ivProbs = {};
        for (const stat of statKeys) {
            const v1 = parent1.stats[stat] ?? 0;
            const v2 = parent2.stats[stat] ?? 0;
            const base1 = Math.min(v1 / 255, 1);
            const base2 = Math.min(v2 / 255, 1);
            const probInherited = inheritedCount / 6;
            const probRandom = 1 / 32;
            const parentAvg = (base1 + base2) / 2;
            ivProbs[stat] = Math.min(1, probInherited * parentAvg + (1 - probInherited) * probRandom);
        }

        const eggGroupsES = config.EGG_GROUPS_ES;
        const sharedGroupsEs = parent1.eggGroups
            .filter(g => parent2.eggGroups.includes(g) || parent2.eggGroups.includes('ditto') || parent1.eggGroups.includes('ditto'))
            .map(g => eggGroupsES[g] || g);

        const resultData = {
            offspring: mother,
            sharedGroups: sharedGroupsEs,
            hatchSteps,
            maxHatchSteps: 10240,
            ivProbs,
            shinyMasuda: `1/${B.SHINY_MASUDA}`,
            shinyCharm: `1/${B.SHINY_CHARM}`,
            shinyBoth: `1/${B.SHINY_MASUDA_CHARM}`,
            shinyBase: `1/${B.SHINY_BASE}`,
            destinyKnot,
            everstone: this.state.breeding.everstone,
        };

        renderer.renderBreedingResult(resultData);
    },


    // ── Calculadora de Captura ───────────────────────────────────
    _openCapture() {
        const { renderer } = window.PokeAnalyzer;
        this.state.capture = { name: '', captureRate: null };
        renderer.openCaptureModal();
        renderer.renderCaptureHp(100);
        renderer.renderCaptureSelected(null);
        renderer.renderCaptureResult(null);
        const input = document.getElementById('captureInput');
        if (input) {
            input.value = '';
            setTimeout(() => input.focus(), 60);
        }
    },

    async _onCapturePokemonSelected(name) {
        if (!name) return;
        const { pokeAPI, renderer } = window.PokeAnalyzer;
        try {
            const species = await pokeAPI.fetchSpeciesBreeding(name);
            if (!species || typeof species.captureRate !== 'number' || Number.isNaN(species.captureRate)) {
                renderer.renderCaptureSelected({ name, captureRate: null });
                this.state.capture = { name, captureRate: null };
                return;
            }
            this.state.capture = {
                name: species.name,
                captureRate: species.captureRate,
            };
            renderer.renderCaptureSelected({
                name: species.name,
                captureRate: species.captureRate,
            });
        } catch {
            renderer.renderCaptureSelected({ name, captureRate: null });
            this.state.capture = { name, captureRate: null };
        }
    },

    _calculateCaptureProbability(captureRate, hpPercent, ballBonus, statusBonus) {
        // hpPercent debe ser el valor entero del slider (1–100)
        const hp = Math.min(100, Math.max(1, Math.floor(Number(hpPercent) || 1)));
        const cr = Math.max(0, Math.floor(Number(captureRate) || 0));
        const ball = Number(ballBonus) || 1;
        const status = Number(statusBonus) || 1;

        // Atajo práctico: ratios de captura máximos (255) se tratan como 100%
        // en esta calculadora simplificada.
        if (cr >= 255) {
            return 100;
        }

        // Paso 1: calcular a con la fórmula indicada
        const a = ((3 * 100 - 2 * hp) * cr * ball * status) / 300;

        // Corte de seguridad
        if (a >= 255) return 100;

        // Paso 2: probabilidad final
        if (a <= 0) return 0;
        const p = Math.pow(a / 255, 0.75) * 100;
        return Math.max(0, Math.min(100, p));
    },

    _runCaptureCalc() {
        const { renderer } = window.PokeAnalyzer;
        const { captureRate, name } = this.state.capture;
        if (!name || !captureRate) {
            renderer.renderCaptureResult({ error: 'Primero selecciona un Pokémon válido del buscador.' });
            return;
        }
        const hp = Number(document.getElementById('captureHpSlider')?.value || 100);
        const ball = Number(document.getElementById('captureBallSelect')?.value || 1);
        const status = Number(document.getElementById('captureStatusSelect')?.value || 1);

        const prob = this._calculateCaptureProbability(captureRate, hp, ball, status);
        renderer.renderCaptureResult({
            name,
            probability: prob,
        });
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
