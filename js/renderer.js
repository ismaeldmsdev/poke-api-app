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
            btn.title       = `${gen.games} (${gen.years})`;
            grid.appendChild(btn);
        });
    },

    setActiveGenButton(num) {
        document.querySelectorAll('.gen-btn').forEach(btn => {
            btn.classList.toggle('active', Number(btn.dataset.gen) === num);
        });
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
        pokemon.stats.forEach(s => {
            bst += s.base_stat;
            const meta = STAT_META[s.stat.name] ?? { label: s.stat.name, cls: '' };
            const pct  = ((s.base_stat / 255) * 100).toFixed(1);
            container.insertAdjacentHTML('beforeend', `
                <div class="stat-row">
                    <span class="stat-lbl">${meta.label}</span>
                    <span class="stat-num">${s.base_stat}</span>
                    <div class="stat-bg">
                        <div class="stat-bar ${meta.cls}" data-w="${pct}"></div>
                    </div>
                </div>`);
        });
        this.el('bstNum').textContent = bst;
    },

    _animateStatBars() {
        document.querySelectorAll('.stat-bar').forEach(bar => {
            bar.style.width = bar.dataset.w + '%';
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

    // ── AI Analysis ───────────────────────────────────────────────
    renderAnalysis(analysis, generation) {
        this.el('aiHeading').textContent =
            `- ANALISIS GEN ${generation.num}: ${generation.games.toUpperCase()} -`;

        const builds = analysis.builds ?? [];

        ['cardBuild1','cardBuild2','cardBuild3'].forEach((id, i) => {
            const build = builds[i];
            if (build) {
                this.el(`buildLabel${i + 1}`).textContent = build.etiqueta;
                this._renderBuildCard(`buildContent${i + 1}`, build);
                this.el(id).classList.remove('hidden');
            } else {
                this.el(id).classList.add('hidden');
            }
        });

        this._renderRol(analysis.rol, analysis.formato);
        this._renderExtra(analysis.consejo_extra ?? '');

        this.show('aiSection');
        this._animateAICards(builds.length);
    },

    _renderBuildCard(contentId, build) {
        const { TYPE_COLORS, TYPE_ES } = window.PokeAnalyzer.config;

        const movesHtml = (build.moveset ?? []).map((m, i) => {
            const typeKey = (m.tipo ?? '').toLowerCase();
            const colors  = TYPE_COLORS[typeKey] ?? { bg: '#888', fg: '#111' };
            const typeEs  = (TYPE_ES[typeKey] || m.tipo || '').toUpperCase();
            return `
                <div class="move-item">
                    <span class="move-n">${i + 1}.</span>
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
                <span class="build-nature">${(build.nature ?? '').toUpperCase()}</span>
                <span class="build-item">&#9670; ${build.item ?? ''}</span>
                <span class="build-ability">&#9670; ${build.ability ?? ''}</span>
                <span class="build-role">${build.role ?? ''}</span>
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

    _animateAICards(buildCount) {
        const ids = [];
        for (let i = 1; i <= buildCount; i++) ids.push(`cardBuild${i}`);
        ids.push('cardRol', 'cardExtra');
        ids.forEach((id, i) => {
            setTimeout(() => {
                const el = document.getElementById(id);
                if (el) el.classList.add('show');
            }, i * 100);
        });
    },

    // ── Comparador ────────────────────────────────────────────────
    showCompareSection() {
        this.el('compareSection').classList.add('active');
    },
    hideCompareSection() {
        this.el('compareSection').classList.remove('active');
        this.el('compareResult').classList.add('hidden');
    },

    renderComparison(poke1, poke2) {
        const { STAT_META, TYPE_ES, TYPE_COLORS } = window.PokeAnalyzer.config;
        const { pokeAPI } = window.PokeAnalyzer;

        const sprite1 = pokeAPI.getBestSprite(poke1);
        const sprite2 = pokeAPI.getBestSprite(poke2);

        const stats1 = {};
        const stats2 = {};
        let bst1 = 0, bst2 = 0;
        poke1.stats.forEach(s => { stats1[s.stat.name] = s.base_stat; bst1 += s.base_stat; });
        poke2.stats.forEach(s => { stats2[s.stat.name] = s.base_stat; bst2 += s.base_stat; });

        const typeBadges = (pokemon) => pokemon.types.map(t => {
            const es = TYPE_ES[t.type.name] || t.type.name;
            return `<span class="type-badge t-${t.type.name}">${es.toUpperCase()}</span>`;
        }).join('');

        const statNames = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
        const maxStat = 255;

        const statsHtml = statNames.map(name => {
            const v1 = stats1[name] || 0;
            const v2 = stats2[name] || 0;
            const meta = STAT_META[name] ?? { label: name, cls: '' };
            const pct1 = ((v1 / maxStat) * 100).toFixed(1);
            const pct2 = ((v2 / maxStat) * 100).toFixed(1);
            const w1 = v1 > v2 ? 'winner' : '';
            const w2 = v2 > v1 ? 'winner' : '';

            return `
                <div class="compare-stat-row">
                    <span class="compare-val left ${w1}">${v1}</span>
                    <div class="compare-bar-wrap left">
                        <div class="compare-bar-fill bar-red" data-w="${pct1}"></div>
                    </div>
                    <span class="compare-stat-label">${meta.label}</span>
                    <div class="compare-bar-wrap">
                        <div class="compare-bar-fill bar-yellow" data-w="${pct2}"></div>
                    </div>
                    <span class="compare-val right ${w2}">${v2}</span>
                </div>`;
        }).join('');

        const bstW1 = bst1 > bst2 ? 'winner' : '';
        const bstW2 = bst2 > bst1 ? 'winner' : '';

        const container = this.el('compareResult');
        container.innerHTML = `
            <div class="compare-header">
                <div class="compare-poke">
                    <img src="${sprite1}" alt="${poke1.name}">
                    <p class="compare-poke-name">${poke1.name}</p>
                </div>
                <span class="compare-vs">VS</span>
                <div class="compare-poke">
                    <img src="${sprite2}" alt="${poke2.name}">
                    <p class="compare-poke-name">${poke2.name}</p>
                </div>
            </div>
            <div class="compare-types-row">
                <div class="compare-types">${typeBadges(poke1)}</div>
                <div class="compare-types right">${typeBadges(poke2)}</div>
            </div>
            ${statsHtml}
            <div class="compare-bst-row">
                <span class="compare-bst left ${bstW1}">${bst1}</span>
                <span class="compare-bst-label">BST TOTAL</span>
                <span class="compare-bst right ${bstW2}">${bst2}</span>
            </div>`;

        container.classList.remove('hidden');

        // Animar barras
        requestAnimationFrame(() => requestAnimationFrame(() => {
            container.querySelectorAll('.compare-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.w + '%';
            });
        }));
    },

    // ── Reset ─────────────────────────────────────────────────────
    resetResults() {
        this.hideMessage();
        this.hide('aiSection');
        this.hide('aiLoading');
        const card = this.el('pokeCard');
        card.classList.add('hidden');
        card.classList.remove('show');
        ['cardBuild1','cardBuild2','cardBuild3','cardRol','cardExtra'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('show');
        });
    },

    resetAnalysis() {
        this.hide('aiSection');
        this.hide('aiLoading');
        ['cardBuild1','cardBuild2','cardBuild3','cardRol','cardExtra'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('show');
        });
    },

    showPokeLoading() { this.show('pokeLoading'); },
    hidePokeLoading() { this.hide('pokeLoading'); },
    showAILoading()   { this.show('aiLoading');   },
    hideAILoading()   { this.hide('aiLoading');   },
};
