/**
 * renderer.js — Todo lo que toca el DOM.
 * Expone window.PokeAnalyzer.renderer
 */

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.renderer = {

    el:   id => document.getElementById(id),
    show: id => document.getElementById(id).classList.remove('hidden'),
    hide: id => document.getElementById(id).classList.add('hidden'),

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
    renderPokemon(pokemon, evoData, abilitiesEs = null) {
        const { pokeAPI } = window.PokeAnalyzer;
        this._renderHeader(pokemon, pokeAPI);
        this._renderTypes(pokemon);
        this._renderStats(pokemon);
        this._renderAbilities(pokemon, abilitiesEs);
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
        const effect = null;

        pokemon.stats.forEach(s => {
            const baseStat = s.base_stat;
            let displayStat = baseStat;
            let modifier = '';
            let modClass = '';

            if (effect) {
                if (effect.up === s.stat.name) {
                    displayStat = Math.floor(baseStat * 1.1);
                    modifier = ' (\u2191)';
                    modClass = ' stat-up';
                } else if (effect.down === s.stat.name) {
                    displayStat = Math.floor(baseStat * 0.9);
                    modifier = ' (\u2193)';
                    modClass = ' stat-down';
                }
            }

            bst += displayStat;
            const meta = STAT_META[s.stat.name] ?? { label: s.stat.name, cls: '' };
            const pct  = ((displayStat / 255) * 100).toFixed(1);
            container.insertAdjacentHTML('beforeend', `
                <div class="stat-row">
                    <span class="stat-lbl">${meta.label}</span>
                    <span class="stat-num${modClass}">${displayStat}${modifier}</span>
                    <div class="stat-bg">
                        <div class="stat-bar ${meta.cls}${modClass}" data-w="${pct}"></div>
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

    _renderAbilities(pokemon, abilitiesEs = null) {
        this.el('abilitiesRow').innerHTML = pokemon.abilities.map(a => {
            const key  = a.ability.name;
            const name = (abilitiesEs && abilitiesEs.get(key))
                || key.replace(/-/g, ' ');
            const cls  = a.is_hidden ? 'pill hidden-ab' : 'pill';
            return `<span class="${cls}">${name}${a.is_hidden ? ' [H]' : ''}</span>`;
        }).join('');
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
                <img src="${pokeAPI.staticSpriteUrl(id)}" alt="${evo.name}" loading="lazy">
                <p class="evo-name">${evo.name}</p>`;
            container.appendChild(item);
            if (i < chain.length - 1) {
                container.insertAdjacentHTML('beforeend', `<span class="evo-arrow">&#9658;</span>`);
            }
        });
    },

    // ── Selector de Sets ──────────────────────────────────────────

    renderSetSelector(allSets, hasSmogon) {
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
                    ${top2.map((b, i) => this._renderCommunityCard(b, i)).join('')}
                </div>
            </div>`;
        this.show('communitySuggestions');
    },

    _renderCommunityCard(build, index) {
        const { TYPE_COLORS, TYPE_ES } = window.PokeAnalyzer.config;
        const { translator } = window.PokeAnalyzer;

        const movesHtml = (build.moveset ?? []).map(m => {
            const typeKey = (m.tipo ?? '').toLowerCase();
            const colors  = TYPE_COLORS[typeKey] ?? { bg: '#888', fg: '#111' };
            const typeEs  = (TYPE_ES[typeKey] || m.tipo || '').toUpperCase();
            const catEs   = translator.translateMoveCategory(m.category || '');
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
        this.renderSetSelector(allSets, analysis.hasSmogon);
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
        const { translator } = window.PokeAnalyzer;

        const natureDisplay = hasSmogon
            ? `\u2605 ${(build.nature ?? '').toUpperCase()}`
            : (build.nature ?? '').toUpperCase();

        const movesHtml = (build.moveset ?? []).map((m, i) => {
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
    showVersusCta() {
        const item = this.el('menuVersusItem');
        if (item) item.disabled = false;
    },
    hideVersusCta() {
        const item = this.el('menuVersusItem');
        if (item) item.disabled = true;
    },

    openVersusModal() {
        const modal = this.el('versusModal');
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        this.el('versusResult').classList.add('hidden');
        this.el('versusLoading').classList.add('hidden');
    },
    closeVersusModal() {
        const modal = this.el('versusModal');
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    },
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

    // ── Reset ─────────────────────────────────────────────────────
    resetResults() {
        this.hideMessage();
        this.hide('aiSection');
        this.hide('aiLoading');
        this.hide('setSelector');
        this.hide('communitySuggestions');
        this.hide('genMechanicsBox');
        this.hideVersusCta();
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
};
