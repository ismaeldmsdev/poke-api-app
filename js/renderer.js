/**
 * renderer.js — Todo lo que toca el DOM.
 * Expone window.PokeAnalyzer.renderer
 */

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.renderer = {

    el:   id => document.getElementById(id),
    show: id => document.getElementById(id).classList.remove('hidden'),
    hide: id => document.getElementById(id).classList.add('hidden'),

    _openModal(id) {
        const modal = this.el(id);
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    },
    _closeModal(id) {
        const modal = this.el(id);
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    },

    showMessage(text, type = 'error') {
        const node = this.el('msgBox');
        node.className   = `msg msg-${type}`;
        node.textContent = text;
        this.show('msgBox');
    },
    hideMessage() { this.hide('msgBox'); },

    setSearchBusy(busy) {
        const btn    = this.el('searchBtn');
        btn.disabled = busy;
        btn.textContent = busy ? '...' : 'ANALIZAR';
    },

    // ── Autocompletado genérico ──────────────────────────────────
    showSearchAc(containerId, matches) {
        const { SPRITE_RAW } = window.PokeAnalyzer.config;
        const ac = this.el(containerId);
        if (!ac) return;
        if (!matches || matches.length === 0) {
            ac.innerHTML = '';
            ac.classList.remove('search-ac--open');
            return;
        }
        ac.innerHTML = matches.map(p => `
            <div class="search-ac-item" data-name="${p.name}">
                <img class="search-ac-sprite" src="${SPRITE_RAW}/${p.id}.png" alt="${p.name}" loading="lazy">
                <span class="search-ac-name">${p.name}</span>
                <span class="search-ac-num">#${String(p.id).padStart(4, '0')}</span>
            </div>`).join('');
        ac.classList.add('search-ac--open');
    },

    hideSearchAc(containerId) {
        const ac = this.el(containerId);
        if (ac) { ac.classList.remove('search-ac--open'); ac.innerHTML = ''; }
    },

    // ── Selector de generación ────────────────────────────────────
    buildGenButtons(generations, activeNum) {
        const grid = this.el('genGrid');
        grid.innerHTML = '';
        generations.forEach(gen => {
            const btn = document.createElement('button');
            btn.className   = `gen-btn${gen.num === activeNum ? ' active' : ''}`;
            btn.dataset.gen = gen.num;
            btn.textContent = gen.label;
            btn.title       = `${gen.games} (${gen.years})\n${gen.mechanics}`;
            grid.appendChild(btn);
        });
        const activeGen = generations.find(g => g.num === activeNum) || generations[0];
        if (activeGen) {
            this.renderActiveGenIndicator(activeGen);
            this.renderGenDropdown(generations, activeGen.num);
        }
        this.setupGenStickyObserver();
    },

    setActiveGenButton(num) {
        const { GENERATIONS } = window.PokeAnalyzer.config;
        document.querySelectorAll('.gen-btn').forEach(btn => {
            btn.classList.toggle('active', Number(btn.dataset.gen) === num);
        });
        const gen = GENERATIONS.find(g => g.num === num);
        if (gen) {
            this.renderActiveGenIndicator(gen);
            this.renderGenDropdown(GENERATIONS, num);
        }
    },

    renderActiveGenIndicator(generation) {
        const chip = this.el('activeGenChip');
        if (!chip) return;
        chip.textContent = `Gen ${generation.num} — ${generation.gamesShort || generation.games}`;
    },

    renderGenDropdown(generations, activeNum) {
        const list = this.el('genDropdown');
        if (!list) return;
        list.innerHTML = generations.map(gen => {
            const isActive = gen.num === activeNum;
            return `
                <button class="gen-option${isActive ? ' active' : ''}" type="button" data-gen="${gen.num}">
                    <span class="gen-option-label">${gen.label}</span>
                    <span class="gen-option-meta">${gen.games}</span>
                </button>`;
        }).join('');
    },

    setupGenStickyObserver() {
        if (this._genObserverSetup) return;
        const target = this.el('genGrid');
        const wrap = this.el('headerGenWrap');
        if (!target || !wrap) return;

        const observer = new IntersectionObserver(entries => {
            const entry = entries[0];
            if (!entry) return;
            if (entry.isIntersecting) {
                wrap.classList.add('header-gen-wrap--collapsed');
            } else {
                wrap.classList.remove('header-gen-wrap--collapsed');
            }
        }, { root: null, threshold: 0 });

        observer.observe(target);
        this._genObserverSetup = true;
    },

    // ── Gen Mechanics Info Banner ──────────────────────────────────
    renderGenMechanics(generation) {
        const box = this.el('genMechanicsBox');
        if (!box) return;
        box.innerHTML = `
            <span class="gen-mech-label">${generation.label}</span>
            <span class="gen-mech-text">${generation.mechanics}</span>`;
        this.show('genMechanicsBox');
    },

    // ── Pokémon card ──────────────────────────────────────────────
    renderPokemon(pokemon, evoData, abilitiesEs = null, genNum = 9) {
        const { pokeAPI } = window.PokeAnalyzer;
        this._renderHeader(pokemon, pokeAPI);
        this._renderTypes(pokemon);
        this._renderStats(pokemon);
        this._renderAbilities(pokemon, abilitiesEs, genNum);
        this._renderEvoChain(evoData, pokeAPI);
        this.show('pokeCard');
        requestAnimationFrame(() => requestAnimationFrame(() => {
            this.el('pokeCard').classList.add('show');
        }));
        setTimeout(() => this._animateStatBars(), 100);
    },

    _renderHeader(pokemon, pokeAPI) {
        this.el('pokeSprite').src = pokeAPI.getBestSprite(pokemon);
        this.el('pokeSprite').alt = pokemon.name;
        this.el('pokeNum').textContent  = `#${String(pokemon.id).padStart(4, '0')}`;
        const displayName = pokemon.name.split('-')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
        this.el('pokeName').textContent = displayName;
    },

    _renderTypes(pokemon) {
        const { TYPE_ES } = window.PokeAnalyzer.config;
        this.el('pokeTypes').innerHTML = pokemon.types
            .map(t => {
                const es = TYPE_ES[t.type.name] || t.type.name;
                return `<span class="type-badge t-${t.type.name}">${es.toUpperCase()}</span>`;
            }).join('');
    },

    _renderStats(pokemon) {
        const { STAT_META } = window.PokeAnalyzer.config;
        const container = this.el('statsRows');
        container.innerHTML = '';
        let bst = 0;

        pokemon.stats.forEach(s => {
            const val = s.base_stat;
            bst += val;
            const meta = STAT_META[s.stat.name] ?? { label: s.stat.name, cls: '' };
            const pct  = ((val / 255) * 100).toFixed(1);
            container.insertAdjacentHTML('beforeend', `
                <div class="stat-row">
                    <span class="stat-lbl">${meta.label}</span>
                    <span class="stat-num">${val}</span>
                    <div class="stat-bg">
                        <div class="stat-bar ${meta.cls}" data-w="${pct}"></div>
                    </div>
                </div>`);
        });
        this.el('bstNum').textContent = bst;
        this._animateStatBars();
    },

    _animateStatBars() {
        requestAnimationFrame(() => {
            document.querySelectorAll('.stat-bar').forEach(bar => {
                bar.style.width = bar.dataset.w + '%';
            });
        });
    },

    _renderAbilities(pokemon, abilitiesEs = null, genNum = 9) {
        const row = this.el('abilitiesRow');
        const hasAbilities = genNum >= 3;

        if (!hasAbilities) {
            row.innerHTML = '<span class="pill">Sin habilidades en esta gen</span>';
            return;
        }

        const pills = pokemon.abilities
            .filter(a => {
                const entry = abilitiesEs && abilitiesEs.get(a.ability.name);
                return entry ? entry.genNum <= genNum : true;
            })
            .map(a => {
                const key  = a.ability.name;
                const entry = abilitiesEs && abilitiesEs.get(key);
                const name = entry?.nameEs || key.replace(/-/g, ' ');
                const cls  = a.is_hidden ? 'pill hidden-ab' : 'pill';
                return `<span class="${cls}">${name}${a.is_hidden ? ' [H]' : ''}</span>`;
            });

        row.innerHTML = pills.length > 0
            ? pills.join('')
            : '<span class="pill">Sin habilidades disponibles en esta gen</span>';
    },

    updateAbilities(pokemon, abilitiesEs, genNum) {
        this._renderAbilities(pokemon, abilitiesEs, genNum);
    },

    _renderEvoChain(evoData, pokeAPI) {
        const chain = pokeAPI.flattenEvoChain(evoData.chain);
        if (chain.length <= 1) { this.hide('evoSection'); return; }
        this.show('evoSection');
        const container = this.el('evoChain');
        container.innerHTML = '';
        chain.forEach((evo, i) => {
            const id   = pokeAPI.speciesUrlToId(evo.url);
            const item = document.createElement('div');
            item.className    = 'evo-item';
            item.dataset.name = evo.name;
            item.innerHTML    = `
                <img src="${pokeAPI.staticSpriteUrl(id)}" alt="Sprite de ${evo.name}" loading="lazy">
                <p class="evo-name">${evo.name}</p>`;
            container.appendChild(item);
            if (i < chain.length - 1) {
                container.insertAdjacentHTML('beforeend', `<span class="evo-arrow">&#9658;</span>`);
            }
        });
    },

    // ── Selector de Sets ──────────────────────────────────────────

    renderSetSelector(allSets) {
        const dropdown = this.el('setDropdown');
        dropdown.innerHTML = '';

        allSets.forEach((set, i) => {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = set.tierLabel;
            dropdown.appendChild(option);
        });

        if (allSets.length > 1) {
            this.show('setSelector');
        } else {
            this.hide('setSelector');
        }
    },

    renderSelectedSet(set, hasSmogon) {
        this.el('buildLabel1').textContent = set.tierLabel;
        this._renderBuildCard('buildContent1', set, hasSmogon);
        this.el('cardBuild1').classList.remove('hidden');
        requestAnimationFrame(() => {
            this.el('cardBuild1').classList.add('show');
        });
    },

    // ── Comunidad: 2 sugerencias debajo de Smogon ─────────────────

    renderCommunitySuggestions(communityBuilds) {
        const panel = this.el('communitySuggestions');
        if (!panel) return;

        if (!communityBuilds || communityBuilds.length === 0) {
            panel.innerHTML = '';
            this.hide('communitySuggestions');
            return;
        }

        const top2 = communityBuilds.slice(0, 2);
        panel.innerHTML = `
            <div class="ai-card full community-suggestions-card show">
                <p class="ai-card-title community-title">SUGERENCIAS DE LA COMUNIDAD</p>
                <div class="community-panel">
                    ${top2.map(b => this._renderCommunityCard(b)).join('')}
                </div>
            </div>`;
        this.show('communitySuggestions');
    },

    _renderCommunityCard(build) {
        const { TYPE_COLORS, TYPE_ES } = window.PokeAnalyzer.config;

        const movesHtml = (build.moveset ?? []).map(m => {
            const typeKey = (m.tipo ?? '').toLowerCase();
            const colors  = TYPE_COLORS[typeKey] ?? { bg: '#888', fg: '#111' };
            const typeEs  = (TYPE_ES[typeKey] || m.tipo || '').toUpperCase();
            return `
                <div class="move-item">
                    <div class="move-type-bar" style="background:${colors.bg}"></div>
                    <div class="move-body">
                        <div class="move-header">
                            <span class="move-name">${m.movimiento ?? ''}</span>
                            <span class="move-type" style="background:${colors.bg};color:${colors.fg}">${typeEs}</span>
                        </div>
                        <p class="move-why">${m.razon ?? ''}</p>
                    </div>
                </div>`;
        }).join('');

        return `
            <div class="ai-card community-card full show">
                <p class="ai-card-title community-title">${build.setName || build.tierLabel}</p>
                ${build.description ? `<p class="community-desc">${build.description}</p>` : ''}
                <div class="build-meta">
                    <span class="build-nature">${(build.nature ?? '').toUpperCase()}</span>
                    <span class="build-item">${build.item ?? ''}</span>
                    <span class="build-ability">${build.ability ?? ''}</span>
                    <span class="build-evs">EVs: ${build.evs ?? ''}</span>
                </div>
                <div class="move-inner">${movesHtml}</div>
            </div>`;
    },

    // ── AI Analysis ───────────────────────────────────────────────
    renderAnalysis(analysis, generation) {
        this.el('aiHeading').textContent =
            `An\u00e1lisis Gen ${generation.num} — ${generation.games}`;

        // Render gen mechanics banner
        this.renderGenMechanics(generation);

        const allSets = analysis.allSets ?? [];
        const communityBuilds = analysis.communityBuilds ?? [];

        // Smogon panel: set selector + build card
        this.renderSetSelector(allSets);
        if (allSets.length > 0) {
            this.renderSelectedSet(allSets[0], analysis.hasSmogon);
        } else {
            this.el('cardBuild1').classList.add('hidden');
        }

        // Comunidad: 2 sugerencias no-meta bajo el set principal
        this.renderCommunitySuggestions(communityBuilds);

        this._renderRol(analysis.rol, analysis.formato);
        this._renderExtra(analysis.consejo_extra ?? '');

        this.show('aiSection');
        this._animateAICards();
    },

    _renderBuildCard(contentId, build, hasSmogon = false) {
        const { TYPE_COLORS, TYPE_ES } = window.PokeAnalyzer.config;

        const natureDisplay = hasSmogon
            ? `\u2605 ${(build.nature ?? '').toUpperCase()}`
            : (build.nature ?? '').toUpperCase();

        const movesHtml = (build.moveset ?? []).map(m => {
            const typeKey = (m.tipo ?? '').toLowerCase();
            const colors  = TYPE_COLORS[typeKey] ?? { bg: '#888', fg: '#111' };
            const typeEs  = (TYPE_ES[typeKey] || m.tipo || '').toUpperCase();
            return `
                <div class="move-item">
                    <div class="move-type-bar" style="background:${colors.bg}"></div>
                    <div class="move-body">
                        <div class="move-header">
                            <span class="move-name">${m.movimiento ?? ''}</span>
                            <span class="move-type" style="background:${colors.bg};color:${colors.fg}">${typeEs}</span>
                        </div>
                        <p class="move-why">${m.razon ?? ''}</p>
                    </div>
                </div>`;
        }).join('');

        this.el(contentId).innerHTML = `
            <div class="build-meta">
                <span class="build-nature">${natureDisplay}</span>
                <span class="build-item">${build.item ?? ''}</span>
                <span class="build-ability">${build.ability ?? ''}</span>
                <span class="build-role">${build.setName ?? ''}</span>
                <span class="build-evs">EVs: ${build.evs ?? ''}</span>
            </div>
            <div class="move-inner">${movesHtml}</div>`;
    },

    _renderRol(rol, formato) {
        this.el('rolContent').innerHTML = `
            <p class="rol-text">${rol ?? ''}</p>
            <span class="format-pill">${formato ?? ''}</span>`;
    },

    _renderExtra(consejo) {
        this.el('extraContent').innerHTML = `<p class="extra-text">${consejo}</p>`;
    },

    _animateAICards() {
        const ids = ['cardBuild1', 'cardRol', 'cardExtra'];
        ids.forEach((id, i) => {
            setTimeout(() => {
                const el = document.getElementById(id);
                if (el) el.classList.add('show');
            }, i * 100);
        });
    },

    // ── Comparador ────────────────────────────────────────────────
    openVersusModal() {
        this._openModal('versusModal');
        this.el('versusResult').classList.add('hidden');
        this.el('versusLoading').classList.add('hidden');
        const i1 = this.el('versusInput1');
        const i2 = this.el('versusInput2');
        if (i1) i1.value = '';
        if (i2) i2.value = '';
        this.hideSearchAc('versusAc1');
        this.hideSearchAc('versusAc2');
    },
    closeVersusModal() { this._closeModal('versusModal'); },
    setVersusBusy(busy) {
        const btn = this.el('versusBtn');
        btn.disabled = busy;
        btn.textContent = busy ? '...' : 'ENFRENTAR';
        if (busy) this.show('versusLoading');
        else this.hide('versusLoading');
    },

    renderVersus(poke1, poke2, selectedGen, activeSet = null) {
        const { STAT_META, TYPE_ES, TYPE_COLORS, TYPE_CHART } = window.PokeAnalyzer.config;
        const { pokeAPI } = window.PokeAnalyzer;

        const genNum = Number(selectedGen) || 9;
        const hasFairy = genNum >= 6;

        const sprite1 = pokeAPI.getBestSprite(poke1);
        const sprite2 = pokeAPI.getBestSprite(poke2);

        const stats1 = {};
        const stats2 = {};
        poke1.stats.forEach(s => { stats1[s.stat.name] = s.base_stat; });
        poke2.stats.forEach(s => { stats2[s.stat.name] = s.base_stat; });

        const getTypes = (pokemon) => pokemon.types.map(t => t.type.name).map(t => {
            if (!hasFairy && t === 'fairy') return 'normal';
            return t;
        });

        const p1Types = getTypes(poke1);
        const p2Types = getTypes(poke2);

        const typeBadges = (types) => types.map(t => {
            const es = TYPE_ES[t] || t;
            return `<span class="type-badge t-${t}">${es.toUpperCase()}</span>`;
        }).join('');

        const statNames = ['speed', 'attack', 'special-attack'];
        const keyMeta = {
            speed: STAT_META['speed']?.label || 'Vel',
            attack: STAT_META['attack']?.label || 'Atq',
            'special-attack': STAT_META['special-attack']?.label || 'At.Esp',
        };

        const quickStats = statNames.map(k => {
            const v1 = stats1[k] || 0;
            const v2 = stats2[k] || 0;
            const w1 = v1 > v2 ? 'winner' : '';
            const w2 = v2 > v1 ? 'winner' : '';
            return `
                <div class="versus-mini-row">
                    <span class="compare-val left ${w1}">${v1}</span>
                    <span class="versus-mini-label">${keyMeta[k]}</span>
                    <span class="compare-val right ${w2}">${v2}</span>
                </div>`;
        }).join('');

        const speed1 = stats1['speed'] || 0;
        const speed2 = stats2['speed'] || 0;
        const speedText = speed1 === speed2
            ? 'Empate de Velocidad: cualquiera puede atacar primero.'
            : (speed1 > speed2
                ? `${poke1.name} ataca primero en igualdad de condiciones.`
                : `${poke2.name} ataca primero en igualdad de condiciones.`);

        const bestAtk1 = Math.max(stats1['attack'] || 0, stats1['special-attack'] || 0);
        const bestAtk2 = Math.max(stats2['attack'] || 0, stats2['special-attack'] || 0);
        const hitText = bestAtk1 === bestAtk2
            ? 'Potencial ofensivo similar (Atq/At.Esp base).'
            : (bestAtk1 > bestAtk2
                ? `${poke1.name} tiene mejor stat ofensivo base.`
                : `${poke2.name} tiene mejor stat ofensivo base.`);

        const mul = (atkType, defTypes) => {
            const chart = TYPE_CHART || {};
            const row = chart[atkType] || {};
            return defTypes.reduce((acc, dt) => acc * (row[dt] ?? 1), 1);
        };

        const formatMul = (m) => {
            if (m === 0) return '0x';
            if (m === 0.25) return '0.25x';
            if (m === 0.5) return '0.5x';
            if (m === 1) return '1x';
            if (m === 2) return '2x';
            if (m === 4) return '4x';
            return `${m}x`;
        };

        const yourMoveTypes = (activeSet?.moveset ?? [])
            .map(m => (m.tipo ?? '').toLowerCase())
            .filter(Boolean);
        const uniqueYourMoveTypes = [...new Set(yourMoveTypes)].slice(0, 4);

        const typeTableYour = (uniqueYourMoveTypes.length > 0
            ? uniqueYourMoveTypes
            : p1Types
        ).map(t => {
            const m = mul(t, p2Types);
            const colors = TYPE_COLORS[t] ?? { bg: '#888', fg: '#111' };
            return `
                <div class="type-eff-row">
                    <span class="move-type" style="background:${colors.bg};color:${colors.fg}">${(TYPE_ES[t] || t).toUpperCase()}</span>
                    <span class="type-eff-val">${formatMul(m)}</span>
                </div>`;
        }).join('');

        const typeTableRival = p2Types.map(t => {
            const m = mul(t, p1Types);
            const colors = TYPE_COLORS[t] ?? { bg: '#888', fg: '#111' };
            return `
                <div class="type-eff-row">
                    <span class="move-type" style="background:${colors.bg};color:${colors.fg}">${(TYPE_ES[t] || t).toUpperCase()}</span>
                    <span class="type-eff-val">${formatMul(m)}</span>
                </div>`;
        }).join('');

        const container = this.el('versusResult');
        container.innerHTML = `
            <div class="compare-result versus-card">
                <div class="compare-header">
                    <div class="compare-poke">
                        <img src="${sprite1}" alt="${poke1.name}">
                        <p class="compare-poke-name">${poke1.name}</p>
                        <div class="compare-types">${typeBadges(p1Types)}</div>
                    </div>
                    <span class="compare-vs">VS</span>
                    <div class="compare-poke">
                        <img src="${sprite2}" alt="${poke2.name}">
                        <p class="compare-poke-name">${poke2.name}</p>
                        <div class="compare-types">${typeBadges(p2Types)}</div>
                    </div>
                </div>

                <div class="versus-grid">
                    <div class="versus-panel">
                        <p class="section-title">STATS CLAVE</p>
                        ${quickStats}
                        <div class="versus-note">${hitText}</div>
                    </div>
                    <div class="versus-panel">
                        <p class="section-title">CHECK DE VELOCIDAD</p>
                        <div class="versus-speed">${speedText}</div>
                    </div>
                </div>

                <div class="versus-grid">
                    <div class="versus-panel">
                        <p class="section-title">TU DAÑO POR TIPO</p>
                        <div class="type-eff-table">${typeTableYour}</div>
                        <p class="versus-foot">Basado en los tipos de tus movimientos del set activo (o tus tipos si no hay set).</p>
                    </div>
                    <div class="versus-panel">
                        <p class="section-title">DAÑO DEL RIVAL POR TIPO</p>
                        <div class="type-eff-table">${typeTableRival}</div>
                        <p class="versus-foot">Aproximación: STAB del rival (sus tipos).</p>
                    </div>
                </div>
            </div>`;

        container.classList.remove('hidden');
    },

    // ── Calculadora de Cobertura ─────────────────────────────────
    openCoverageModal()  { this._openModal('coverageModal');  },
    closeCoverageModal() { this._closeModal('coverageModal'); },

    renderCoverageGenGrid(genNum) {
        const grid = this.el('covGenGrid');
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.className = `cov-gen-btn${i === genNum ? ' active' : ''}`;
            btn.dataset.gen = i;
            btn.type = 'button';
            btn.textContent = i;
            grid.appendChild(btn);
        }
    },

    renderCoverageTypeGrid(genNum) {
        const { TYPE_ES, TYPE_COLORS } = window.PokeAnalyzer.config;
        const types = window.PokeAnalyzer.config.getTypesForGen(genNum);
        const grid = this.el('covTypeGrid');
        grid.innerHTML = types.map(t => {
            const colors = TYPE_COLORS[t] || { bg: '#888', fg: '#111' };
            const name = TYPE_ES[t] || t;
            return `<button class="cov-type-btn" data-type="${t}" type="button" style="background:${colors.bg};color:${colors.fg}">${name}</button>`;
        }).join('');
    },

    renderCoverageSelected(selectedTypes) {
        const { TYPE_ES, TYPE_COLORS } = window.PokeAnalyzer.config;
        const container = this.el('covSelected');
        if (selectedTypes.length === 0) { container.innerHTML = ''; return; }
        container.innerHTML = selectedTypes.map(t => {
            const colors = TYPE_COLORS[t] || { bg: '#888', fg: '#111' };
            const name = TYPE_ES[t] || t;
            return `<span class="cov-sel-badge" data-type="${t}" style="background:${colors.bg};color:${colors.fg}">${name} ✕</span>`;
        }).join('');
    },

    setCoverageInstruction(mode) {
        this.el('covInstruction').textContent = mode === 'defensive'
            ? 'Selecciona hasta 2 tipos para ver debilidades y resistencias.'
            : 'Selecciona hasta 4 tipos de movimiento para analizar cobertura ofensiva.';
    },

    renderCoverageResults(selectedTypes, mode, genNum) {
        const container = this.el('covResults');
        if (selectedTypes.length === 0) { container.classList.add('hidden'); return; }
        container.classList.remove('hidden');
        if (mode === 'defensive') this._renderDefCoverage(selectedTypes, genNum, container);
        else this._renderOffCoverage(selectedTypes, genNum, container);
    },

    _renderDefCoverage(defTypes, genNum, container) {
        const config = window.PokeAnalyzer.config;
        const { TYPE_ES, TYPE_COLORS } = config;
        const allTypes = config.getTypesForGen(genNum);

        const buckets = {
            quad_weak: { label: 'DEBILIDADES DOBLES (4×)', items: [], accent: '#ff2222' },
            weak:      { label: 'DEBILIDADES (2×)', items: [], accent: '#ff6b6b' },
            neutral:   { label: 'NEUTRAL (1×)', items: [], accent: 'var(--muted)' },
            resist:    { label: 'RESISTENCIAS (½×)', items: [], accent: '#4caf50' },
            quad_res:  { label: 'RESISTENCIAS DOBLES (¼×)', items: [], accent: '#2e7d32' },
            immune:    { label: 'INMUNIDADES (0×)', items: [], accent: '#7c5cfc' },
        };

        for (const atk of allTypes) {
            const m = config.getEffectiveness(atk, defTypes, genNum);
            if (m >= 4) buckets.quad_weak.items.push(atk);
            else if (m >= 2) buckets.weak.items.push(atk);
            else if (m === 1) buckets.neutral.items.push(atk);
            else if (m === 0.5) buckets.resist.items.push(atk);
            else if (m === 0.25) buckets.quad_res.items.push(atk);
            else if (m === 0) buckets.immune.items.push(atk);
        }

        const badge = (t) => {
            const c = TYPE_COLORS[t] || { bg: '#888', fg: '#111' };
            return `<span class="cov-res-badge" style="background:${c.bg};color:${c.fg}">${TYPE_ES[t] || t}</span>`;
        };

        const order = ['quad_weak', 'weak', 'resist', 'quad_res', 'immune', 'neutral'];
        container.innerHTML = order
            .filter(k => buckets[k].items.length > 0)
            .map(k => {
                const b = buckets[k];
                return `
                <div class="cov-group">
                    <p class="cov-group-label" style="color:${b.accent}">${b.label} <span class="cov-count">${b.items.length}</span></p>
                    <div class="cov-badges">${b.items.map(badge).join('')}</div>
                </div>`;
            }).join('');
    },

    _renderOffCoverage(moveTypes, genNum, container) {
        const config = window.PokeAnalyzer.config;
        const { TYPE_ES, TYPE_COLORS } = config;
        const allTypes = config.getTypesForGen(genNum);

        const superEff = [], neutral = [], resist = [], immune = [];

        for (const target of allTypes) {
            let best = 0;
            for (const atk of moveTypes) {
                const m = config.getEffectiveness(atk, [target], genNum);
                if (m > best) best = m;
            }
            if (best >= 2) superEff.push(target);
            else if (best === 1) neutral.push(target);
            else if (best > 0) resist.push(target);
            else immune.push(target);
        }

        const pct = ((superEff.length / allTypes.length) * 100).toFixed(0);
        const badge = (t) => {
            const c = TYPE_COLORS[t] || { bg: '#888', fg: '#111' };
            return `<span class="cov-res-badge" style="background:${c.bg};color:${c.fg}">${TYPE_ES[t] || t}</span>`;
        };

        const sections = [
            { label: `SUPER EFECTIVO`, items: superEff, accent: '#4caf50' },
            { label: `NEUTRAL`, items: neutral, accent: 'var(--muted)' },
            { label: `POCO EFECTIVO`, items: resist, accent: '#ff6b6b' },
            { label: `INMUNE`, items: immune, accent: '#7c5cfc' },
        ];

        container.innerHTML = `
            <div class="cov-bar-wrap">
                <div class="cov-bar-header">
                    <span class="cov-bar-label">COBERTURA</span>
                    <span class="cov-bar-pct">${pct}%</span>
                </div>
                <div class="cov-bar-bg"><div class="cov-bar-fill" style="width:${pct}%"></div></div>
                <p class="cov-bar-detail">Cubres ${superEff.length} de ${allTypes.length} tipos con daño super efectivo.</p>
            </div>
            ${sections
                .filter(s => s.items.length > 0)
                .map(s => `
                <div class="cov-group">
                    <p class="cov-group-label" style="color:${s.accent}">${s.label} <span class="cov-count">${s.items.length}</span></p>
                    <div class="cov-badges">${s.items.map(badge).join('')}</div>
                </div>`).join('')}`;
    },

    // ── Analizador de Equipo ────────────────────────────────────
    openTeamModal()  { this._openModal('teamModal');  },
    closeTeamModal() { this._closeModal('teamModal'); },

    renderTeamGenGrid(genNum) {
        const grid = this.el('teamGenGrid');
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.className = `cov-gen-btn${i === genNum ? ' active' : ''}`;
            btn.dataset.gen = i;
            btn.type = 'button';
            btn.textContent = i;
            grid.appendChild(btn);
        }
    },

    renderTeamSlots(slots) {
        const { TYPE_ES, TYPE_COLORS } = window.PokeAnalyzer.config;
        const container = this.el('teamSlots');
        const filled = slots.filter(Boolean).length;
        const countEl = this.el('teamSlotCount');
        if (countEl) countEl.textContent = `${filled} / 6`;

        container.innerHTML = slots.map((slot, i) => {
            if (slot) {
                const badges = slot.types.map(t => {
                    const c = TYPE_COLORS[t] || { bg: '#888', fg: '#111' };
                    return `<span class="type-badge" style="font-size:8px;padding:2px 6px;background:${c.bg};color:${c.fg}">${(TYPE_ES[t] || t).toUpperCase()}</span>`;
                }).join('');
                return `
                <div class="team-slot team-slot--filled" data-slot="${i}">
                    <button class="team-slot-remove" data-slot="${i}" type="button" title="Quitar">✕</button>
                    <img class="team-slot-sprite" src="${slot.sprite}" alt="${slot.name}">
                    <p class="team-slot-name">${slot.name}</p>
                    <div class="team-slot-types">${badges}</div>
                </div>`;
            }
            return `
            <div class="team-slot team-slot--empty" data-slot="${i}" role="button" tabindex="0" aria-label="Añadir Pokémon en slot ${i + 1}">
                <div class="team-slot-add-icon">+</div>
                <span class="team-slot-add-label">SLOT ${i + 1}</span>
            </div>`;
        }).join('');
    },

    // ── Team Pokémon search overlay ─────────────────────────────
    openTeamSearch(idx) {
        const overlay = this.el('teamPokeSearch');
        const title   = this.el('teamPokeSearchTitle');
        const input   = this.el('teamPokeSearchInput');
        const results = this.el('teamPokeSearchResults');
        title.textContent = `SLOT ${idx + 1} — AÑADIR POKÉMON`;
        input.value = '';
        results.innerHTML = '<p class="team-poke-search-hint">Escribe 2+ letras para buscar.</p>';
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
        setTimeout(() => input.focus(), 60);
    },

    closeTeamSearch() {
        const overlay = this.el('teamPokeSearch');
        overlay.classList.add('hidden');
        overlay.setAttribute('aria-hidden', 'true');
        const input = this.el('teamPokeSearchInput');
        if (input) input.value = '';
    },

    renderTeamPokeSearchResults(suggestions, slotIdx) {
        const { SPRITE_RAW } = window.PokeAnalyzer.config;
        const results = this.el('teamPokeSearchResults');
        if (!suggestions || suggestions.length === 0) {
            results.innerHTML = '<p class="team-poke-search-hint">Sin resultados. Prueba con otro nombre.</p>';
            return;
        }
        results.innerHTML = suggestions.map(p => `
            <div class="team-poke-search-item" data-slot="${slotIdx}" data-name="${p.name}">
                <img class="team-poke-search-sprite" src="${SPRITE_RAW}/${p.id}.png" alt="${p.name}" loading="lazy">
                <span class="team-poke-search-name">${p.name}</span>
                <span class="team-poke-search-num">#${String(p.id).padStart(4, '0')}</span>
            </div>`).join('');
    },

    setTeamSlotBusy(idx, busy) {
        const slot = document.querySelector(`.team-slot[data-slot="${idx}"]`);
        if (slot) slot.style.opacity = busy ? '0.5' : '';
    },

    showTeamSlotError(idx) {
        const slot = document.querySelector(`.team-slot[data-slot="${idx}"]`);
        if (slot) slot.style.opacity = '';
        // Reabrir búsqueda con indicación de error
        this.openTeamSearch(idx);
        const input = this.el('teamPokeSearchInput');
        if (input) {
            input.placeholder = '❌ No encontrado, intenta de nuevo';
            setTimeout(() => { input.placeholder = 'Charizard, Garchomp, Rotom-W...'; }, 2500);
        }
    },

    renderTeamWarnings(warnings) {
        const { TYPE_ES, TYPE_COLORS } = window.PokeAnalyzer.config;
        const container = this.el('teamWarnings');
        if (warnings.length === 0) { container.innerHTML = ''; return; }
        container.innerHTML = warnings.map(w => {
            const c = TYPE_COLORS[w.type] || { bg: '#888', fg: '#111' };
            const name = TYPE_ES[w.type] || w.type;
            return `
            <div class="team-warn">
                <span class="team-warn-icon">⚠️</span>
                <span>GRAN VULNERABILIDAD a <span class="type-badge" style="background:${c.bg};color:${c.fg};font-size:9px;padding:2px 8px;border-radius:10px">${name.toUpperCase()}</span> — ${w.count} Pokémon débiles</span>
            </div>`;
        }).join('');
    },

    renderTeamMatrix(matrix, slots) {
        const { TYPE_ES, TYPE_COLORS } = window.PokeAnalyzer.config;
        const filled = slots.map((s, i) => s ? { ...s, idx: i } : null).filter(Boolean);

        let head = '<tr><th class="mat-th-type">TIPO</th>';
        for (const s of filled) {
            head += `<th class="mat-th-poke">
                <img src="${s.sprite}" alt="${s.name}" class="mat-th-sprite">
                <span class="mat-th-name">${s.name}</span>
            </th>`;
        }
        head += '<th class="mat-th-bal">BAL.</th></tr>';

        const mulLabel = m => {
            if (m >= 4)       return '×4';
            if (m >= 2)       return '×2';
            if (m === 1)      return '·';
            if (m === 0.5)    return '½';
            if (m === 0.25)   return '¼';
            if (m === 0)      return '0';
            return '·';
        };
        const mulClass = m => {
            if (m >= 4)       return 'mat-qweak';
            if (m >= 2)       return 'mat-weak';
            if (m === 1)      return 'mat-neutral';
            if (m === 0.5)    return 'mat-resist';
            if (m === 0.25)   return 'mat-qresist';
            if (m === 0)      return 'mat-immune';
            return 'mat-neutral';
        };

        let body = '';
        for (const row of matrix) {
            const c = TYPE_COLORS[row.type] || { bg: '#888', fg: '#111' };
            const name = TYPE_ES[row.type] || row.type;
            body += '<tr>';
            body += `<td class="mat-td-type"><span class="mat-type-badge" style="background:${c.bg};color:${c.fg}">${name}</span></td>`;

            for (const s of filled) {
                const cell = row.cells[s.idx];
                if (!cell) { body += '<td class="mat-td-cell"></td>'; continue; }
                body += `<td class="mat-td-cell ${mulClass(cell.mul)}">${mulLabel(cell.mul)}</td>`;
            }

            let balCls = 'mat-bal-zero';
            if (row.score < 0) balCls = 'mat-bal-neg';
            else if (row.score > 0) balCls = 'mat-bal-pos';
            const balTxt = row.score > 0 ? `+${row.score}` : String(row.score);
            body += `<td class="mat-td-bal ${balCls}">${balTxt}</td>`;
            body += '</tr>';
        }

        this.el('teamMatrix').innerHTML = `<thead>${head}</thead><tbody>${body}</tbody>`;
    },

    renderTeamOffensive(superEff, notCovered, total) {
        const { TYPE_ES, TYPE_COLORS } = window.PokeAnalyzer.config;
        const container = this.el('teamOffensive');
        const pct = ((superEff.length / total) * 100).toFixed(0);

        const badge = t => {
            const c = TYPE_COLORS[t] || { bg: '#888', fg: '#111' };
            return `<span class="cov-res-badge" style="background:${c.bg};color:${c.fg}">${TYPE_ES[t] || t}</span>`;
        };

        let html = `
        <div class="cov-bar-wrap">
            <div class="cov-bar-header">
                <span class="cov-bar-label">COBERTURA STAB</span>
                <span class="cov-bar-pct">${pct}%</span>
            </div>
            <div class="cov-bar-bg"><div class="cov-bar-fill" style="width:${pct}%"></div></div>
            <p class="cov-bar-detail">Tu equipo golpea súper efectivo a ${superEff.length} de ${total} tipos (basado en STAB).</p>
        </div>`;

        if (superEff.length > 0) {
            html += `<div class="cov-group">
                <p class="cov-group-label" style="color:#4caf50">SÚPER EFECTIVO <span class="cov-count">${superEff.length}</span></p>
                <div class="cov-badges">${superEff.map(badge).join('')}</div>
            </div>`;
        }
        if (notCovered.length > 0) {
            html += `<div class="cov-group">
                <p class="cov-group-label" style="color:#ff6b6b">SIN COBERTURA <span class="cov-count">${notCovered.length}</span></p>
                <div class="cov-badges">${notCovered.map(badge).join('')}</div>
            </div>`;
        }

        container.innerHTML = html;
    },

    // ── Reset ─────────────────────────────────────────────────────
    resetResults() {
        this.hideMessage();
        this.hide('aiSection');
        this.hide('aiLoading');
        this.hide('setSelector');
        this.hide('communitySuggestions');
        this.hide('genMechanicsBox');
        const card = this.el('pokeCard');
        card.classList.add('hidden');
        card.classList.remove('show');
        ['cardBuild1','cardRol','cardExtra'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('show');
        });
    },

    resetAnalysis() {
        this.hide('aiSection');
        this.hide('aiLoading');
        this.hide('setSelector');
        this.hide('communitySuggestions');
        this.hide('genMechanicsBox');
        ['cardBuild1','cardRol','cardExtra'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('show');
        });
    },

    showPokeLoading() { this.show('pokeLoading'); },
    hidePokeLoading() { this.hide('pokeLoading'); },
    showAILoading()   { this.show('aiLoading');   },
    hideAILoading()   { this.hide('aiLoading');   },

    // ── Localizador de MT ─────────────────────────────────────────
    openTmModal()  { this._openModal('tmModal');  },
    closeTmModal() { this._closeModal('tmModal'); },

    renderTmGameSelector(games) {
        const select = this.el('tmGameSelect');
        select.innerHTML = '<option value="">— Elige un juego —</option>' +
            games.map(g => `<option value="${g.id}">Gen ${g.gen} — ${g.label}</option>`).join('');
    },

    renderTmTypeFilter(types) {
        const { TYPE_ES, TYPE_COLORS } = window.PokeAnalyzer.config;
        const container = this.el('tmTypeFilter');
        container.innerHTML = `<button class="tm-type-btn active" data-type="all" type="button">TODOS</button>` +
            types.map(t => {
                const c = TYPE_COLORS[t] || { bg: '#888', fg: '#111' };
                return `<button class="tm-type-btn" data-type="${t}" type="button" style="--tb:${c.bg};--tf:${c.fg}">${TYPE_ES[t] || t}</button>`;
            }).join('');
    },

    renderTmList(tms, gameId) {
        const { TYPE_COLORS, TYPE_ES } = window.PokeAnalyzer.config;
        const { METHOD_LABELS } = window.PokeAnalyzer.tmData;
        const list = this.el('tmList');
        const empty = this.el('tmEmpty');

        if (!tms || tms.length === 0) {
            list.innerHTML = '';
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        list.innerHTML = tms.map(tm => {
            const c = TYPE_COLORS[tm.type] || { bg: '#888', fg: '#111' };
            const typeEs = TYPE_ES[tm.type] || tm.type;
            const m = METHOD_LABELS[tm.method] || { icon: '❓', label: 'Otro' };
            const isHm = tm.num.startsWith('MO');

            return `
            <div class="tm-card" data-num="${tm.num}">
                <div class="tm-num ${isHm ? 'tm-num--hm' : ''}">${tm.num}</div>
                <div class="tm-info">
                    <div class="tm-move-row">
                        <span class="tm-move-name">${tm.move}</span>
                        <span class="tm-move-type" style="background:${c.bg};color:${c.fg}">${typeEs.toUpperCase()}</span>
                        <span class="tm-method" title="${m.label}">${m.icon}</span>
                    </div>
                    <p class="tm-loc">${tm.loc}</p>
                </div>
            </div>`;
        }).join('');
    },

    // ── Simulador de Crianza ───────────────────────────────────
    openBreedingModal()  { this._openModal('breedingModal');  },
    closeBreedingModal() { this._closeModal('breedingModal'); },

    renderBreedingParents(parent1, parent2) {
        const { TYPE_ES, TYPE_COLORS, EGG_GROUPS_ES } = window.PokeAnalyzer.config;
        const container = this.el('breedParents');

        const renderParent = (parent, slot, label) => {
            if (!parent) {
                return `
                <div class="breed-parent breed-parent--empty" data-slot="${slot}">
                    <p class="breed-parent-label">${label}</p>
                    <input class="breed-search" type="search" data-slot="${slot}" placeholder="Buscar Pokémon..." autocomplete="off" spellcheck="false">
                    <div class="breed-ac" data-slot="${slot}"></div>
                </div>`;
            }

            const badges = parent.types.map(t => {
                const c = TYPE_COLORS[t] || { bg: '#888', fg: '#111' };
                return `<span class="type-badge" style="font-size:9px;padding:2px 7px;background:${c.bg};color:${c.fg}">${(TYPE_ES[t] || t).toUpperCase()}</span>`;
            }).join('');

            const eggBadges = parent.eggGroups.map(g =>
                `<span class="breed-egg-badge">${EGG_GROUPS_ES[g] || g}</span>`
            ).join('');

            const genderText = parent.genderRate === -1 ? 'Sin género'
                : parent.genderRate === 0 ? '100% ♂'
                : parent.genderRate === 8 ? '100% ♀'
                : `${((8 - parent.genderRate) / 8 * 100).toFixed(0)}% ♂ / ${(parent.genderRate / 8 * 100).toFixed(0)}% ♀`;

            const statKeys = ['PS', 'Atq', 'Def', 'Atq.Esp', 'Def.Esp', 'Vel'];
            const statBars = statKeys.map(k => {
                const val = parent.stats[k] ?? 0;
                const pct = Math.min((val / 255) * 100, 100);
                const hue = Math.round((pct / 100) * 120);
                return `
                <div class="breed-stat-row">
                    <span class="breed-stat-label">${k}</span>
                    <div class="breed-stat-bar-track">
                        <div class="breed-stat-bar-fill" style="width:${pct}%;background:hsl(${hue},70%,50%)"></div>
                    </div>
                    <span class="breed-stat-val">${val}</span>
                </div>`;
            }).join('');

            return `
            <div class="breed-parent breed-parent--filled" data-slot="${slot}">
                <div class="breed-parent-header">
                    <p class="breed-parent-label">${label}</p>
                    <button class="breed-parent-remove" data-slot="${slot}" type="button" title="Quitar">✕</button>
                </div>
                <img class="breed-parent-sprite" src="${parent.sprite}" alt="Sprite de ${parent.name}">
                <p class="breed-parent-name">${parent.name}</p>
                <div class="breed-parent-types">${badges}</div>
                <div class="breed-parent-eggs">${eggBadges}</div>
                <p class="breed-parent-gender">${genderText}</p>
                <div class="breed-parent-stats">${statBars}</div>
            </div>`;
        };

        container.innerHTML = renderParent(parent1, 1, 'Padre') + renderParent(parent2, 2, 'Madre / Ditto');
    },

    renderBreedingItems(destinyKnot, everstone) {
        const container = this.el('breedItems');
        container.innerHTML = `
        <label class="breed-toggle${destinyKnot ? ' breed-toggle--active' : ''}">
            <input type="checkbox" class="breed-item-cb" data-item="destinyKnot" ${destinyKnot ? 'checked' : ''}>
            <span class="breed-toggle-icon">🔗</span>
            <span class="breed-toggle-text">Lazo Destino<br><small>Hereda 5 IVs</small></span>
        </label>
        <label class="breed-toggle${everstone ? ' breed-toggle--active' : ''}">
            <input type="checkbox" class="breed-item-cb" data-item="everstone" ${everstone ? 'checked' : ''}>
            <span class="breed-toggle-icon">🪨</span>
            <span class="breed-toggle-text">Piedra Eterna<br><small>Hereda Naturaleza</small></span>
        </label>`;
    },

    renderBreedingResult(data) {
        const { TYPE_ES, TYPE_COLORS } = window.PokeAnalyzer.config;
        const container = this.el('breedResult');
        container.classList.remove('hidden');

        const badges = data.offspring.types.map(t => {
            const c = TYPE_COLORS[t] || { bg: '#888', fg: '#111' };
            return `<span class="type-badge" style="font-size:9px;padding:2px 7px;background:${c.bg};color:${c.fg}">${(TYPE_ES[t] || t).toUpperCase()}</span>`;
        }).join('');

        const groupBadges = data.sharedGroups.map(g =>
            `<span class="breed-egg-badge breed-egg-badge--shared">${g}</span>`
        ).join('') || '<span class="breed-egg-badge breed-egg-badge--shared">Ditto</span>';

        const hatchPct = Math.min((data.hatchSteps / data.maxHatchSteps) * 100, 100).toFixed(0);

        const statKeys = ['PS', 'Atq', 'Def', 'Atq.Esp', 'Def.Esp', 'Vel'];
        const ivBars = statKeys.map(k => {
            const prob = data.ivProbs[k] ?? 0;
            const pct = (prob * 100).toFixed(1);
            const hue = Math.round(prob * 120);
            return `
            <div class="breed-iv-row">
                <span class="breed-iv-label">${k}</span>
                <div class="breed-iv-bar-track">
                    <div class="breed-iv-bar-fill" style="width:${pct}%;background:hsl(${hue},70%,50%)"></div>
                </div>
                <span class="breed-iv-val">${pct}%</span>
            </div>`;
        }).join('');

        container.innerHTML = `
        <div class="breed-result-top">
            <div class="breed-offspring-card">
                <img class="breed-offspring-sprite" src="${data.offspring.sprite}" alt="Sprite de ${data.offspring.name}">
                <p class="breed-offspring-name">${data.offspring.name}</p>
                <div class="breed-offspring-types">${badges}</div>
            </div>
            <div class="breed-compat-info">
                <p class="breed-compat-label">Grupo(s) huevo compartido(s)</p>
                <div class="breed-compat-groups">${groupBadges}</div>
                <p class="breed-compat-ok">✅ Compatible</p>
            </div>
        </div>

        <div class="breed-hatch-section">
            <p class="breed-section-title">Pasos de eclosión</p>
            <div class="breed-hatch-bar-track">
                <div class="breed-hatch-bar-fill" style="width:${hatchPct}%"></div>
            </div>
            <p class="breed-hatch-steps">${data.hatchSteps.toLocaleString('es-ES')} pasos <small>(aprox. ${(data.hatchSteps / 256).toFixed(0)} ciclos)</small></p>
            <p class="breed-hatch-note">🔥 Con Cuerpo Llama / Armadura Magma se reduce a la mitad</p>
        </div>

        <div class="breed-iv-section">
            <p class="breed-section-title">Probabilidad de IV perfecto por stat ${data.destinyKnot ? '(Lazo Destino)' : '(sin Lazo Destino)'}</p>
            <div class="breed-iv-bars">${ivBars}</div>
        </div>

        <div class="breed-shiny-section">
            <p class="breed-section-title">Probabilidades Shiny</p>
            <div class="breed-shiny-grid">
                <div class="breed-shiny-card">
                    <span class="breed-shiny-label">Base</span>
                    <span class="breed-shiny-val">${data.shinyBase}</span>
                </div>
                <div class="breed-shiny-card breed-shiny-card--highlight">
                    <span class="breed-shiny-label">Método Masuda</span>
                    <span class="breed-shiny-val">${data.shinyMasuda}</span>
                </div>
                <div class="breed-shiny-card">
                    <span class="breed-shiny-label">Amuleto Iris</span>
                    <span class="breed-shiny-val">${data.shinyCharm}</span>
                </div>
                <div class="breed-shiny-card breed-shiny-card--highlight">
                    <span class="breed-shiny-label">Masuda + Iris</span>
                    <span class="breed-shiny-val">${data.shinyBoth}</span>
                </div>
            </div>
        </div>`;
    },

    renderBreedingError(msg) {
        const container = this.el('breedError');
        container.classList.remove('hidden');
        container.innerHTML = `<p class="breed-error-text">❌ ${msg}</p>`;
    },

    setBreedingSlotBusy(slot, busy) {
        const parent = document.querySelector(`.breed-parent[data-slot="${slot}"]`);
        if (parent) parent.style.opacity = busy ? '0.5' : '';
    },

    showBreedingSuggestions(slot, matches) {
        const { SPRITE_RAW } = window.PokeAnalyzer.config;
        const ac = document.querySelector(`.breed-ac[data-slot="${slot}"]`);
        if (!ac) return;
        if (!matches || matches.length === 0) {
            ac.innerHTML = '<p class="breed-ac-empty">Sin resultados.</p>';
            ac.classList.add('breed-ac--open');
            return;
        }
        ac.innerHTML = matches.map(p => `
            <div class="breed-ac-item" data-slot="${slot}" data-name="${p.name}">
                <img class="breed-ac-sprite" src="${SPRITE_RAW}/${p.id}.png" alt="${p.name}" loading="lazy">
                <span class="breed-ac-name">${p.name}</span>
                <span class="breed-ac-num">#${String(p.id).padStart(4, '0')}</span>
            </div>`).join('');
        ac.classList.add('breed-ac--open');
    },

    hideBreedingSuggestions(slot) {
        const ac = document.querySelector(`.breed-ac[data-slot="${slot}"]`);
        if (ac) {
            ac.classList.remove('breed-ac--open');
            ac.innerHTML = '';
        }
    },

    // ── Calculadora de Captura ───────────────────────────────────
    openCaptureModal() {
        this._openModal('captureModal');
    },
    closeCaptureModal() {
        this._closeModal('captureModal');
    },
    renderCaptureHp(value) {
        const lbl = this.el('captureHpValue');
        if (lbl) lbl.textContent = `${Number(value || 0)}%`;
    },
    renderCaptureSelected(info) {
        const node = this.el('captureSelectedInfo');
        if (!node) return;
        if (!info || !info.name) {
            node.classList.add('hidden');
            node.textContent = '';
            return;
        }
        const cr = typeof info.captureRate === 'number' && !Number.isNaN(info.captureRate)
            ? info.captureRate
            : null;
        const niceName = info.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
        node.classList.remove('hidden');
        node.textContent = cr !== null
            ? `${niceName} — ratio de captura base: ${cr}`
            : `${niceName} — no se pudo obtener el ratio de captura`;
    },
    renderCaptureResult(result) {
        const box = this.el('captureResult');
        const txt = this.el('captureResultText');
        if (!box || !txt) return;

        box.classList.remove('capture-result--low', 'capture-result--mid', 'capture-result--high');

        if (!result) {
            box.classList.add('hidden');
            txt.textContent = '';
            return;
        }

        if (result.error) {
            box.classList.remove('hidden');
            txt.textContent = result.error;
            box.classList.add('capture-result--low');
            return;
        }

        const p = Number(result.probability || 0);
        const clamped = Math.max(0, Math.min(100, p));

        if (clamped < 15) {
            box.classList.add('capture-result--low');
        } else if (clamped <= 50) {
            box.classList.add('capture-result--mid');
        } else {
            box.classList.add('capture-result--high');
        }

        const baseText = result.name
            ? `Probabilidad de captura para ${result.name}: `
            : 'Probabilidad de captura estimada: ';

        let displayText;
        if (clamped > 0 && clamped < 1) {
            displayText = '< 1%';
        } else {
            displayText = `${clamped.toFixed(1)}%`;
        }

        txt.textContent = `${baseText}${displayText}`;
        box.classList.remove('hidden');
    },
};
