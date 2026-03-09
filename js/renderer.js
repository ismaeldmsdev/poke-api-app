/**
 * renderer.js — Todo lo que toca el DOM.
 * No hace fetch ni contiene lógica de negocio.
 * Expone window.PokeAnalyzer.renderer
 */

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.renderer = {

    // ── Helpers DOM ──────────────────────────────────────────────
    el:   id => document.getElementById(id),
    show: id => document.getElementById(id).classList.remove('hidden'),
    hide: id => document.getElementById(id).classList.add('hidden'),

    showMessage(text, type = 'error') {
        const node = this.el('msgBox');
        node.className  = `msg msg-${type}`;
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

    renderPokemon(pokemon, evoData) {
        const { pokeAPI } = window.PokeAnalyzer;

        this._renderHeader(pokemon, pokeAPI);
        this._renderTypes(pokemon);
        this._renderStats(pokemon);
        this._renderAbilities(pokemon);
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
        this.el('pokeName').textContent = pokemon.name;
    },

    _renderTypes(pokemon) {
        const { TYPE_ES } = window.PokeAnalyzer.config;
        this.el('pokeTypes').innerHTML = pokemon.types
            .map(t => {
                const es = TYPE_ES[t.type.name] || t.type.name;
                return `<span class="type-badge t-${t.type.name}">${es.toUpperCase()}</span>`;
            })
            .join('');
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

    _renderAbilities(pokemon) {
        this.el('abilitiesRow').innerHTML = pokemon.abilities.map(a => {
            const name = a.ability.name.replace(/-/g, ' ');
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

        this._renderNatures(analysis.naturalezas ?? []);
        this._renderAbilityRec(analysis.habilidad ?? {});
        this._renderMovesetCard('movContent1', 'nat1Label', analysis.moveset_1 ?? [], analysis.naturalezas?.[0]);
        this._renderMovesetCard('movContent2', 'nat2Label', analysis.moveset_2 ?? [], analysis.naturalezas?.[1]);
        this._renderRol(analysis.rol, analysis.formato);
        this._renderExtra(analysis.consejo_extra ?? '');

        this.show('aiSection');
        this._animateAICards();
    },

    _renderNatures(naturalezas) {
        this.el('natContent').innerHTML = naturalezas.map(n => `
            <div class="nature-item">
                <p class="nature-name">${(n.nombre ?? '').toUpperCase()}</p>
                <p class="nature-reason">${n.razon ?? ''}</p>
            </div>`).join('');
    },

    _renderAbilityRec(habilidad) {
        this.el('habContent').innerHTML = `
            <div class="ability-rec">
                <p class="ability-rec-name">${(habilidad.nombre ?? '').toUpperCase()}</p>
                <p class="ability-rec-reason">${habilidad.razon ?? ''}</p>
            </div>`;
    },

    _renderMovesetCard(contentId, labelId, moveset, naturaleza) {
        const { TYPE_COLORS, TYPE_ES } = window.PokeAnalyzer.config;
        const label = naturaleza?.nombre && naturaleza.nombre !== 'N/A'
            ? naturaleza.nombre.toUpperCase()
            : (labelId === 'nat1Label' ? 'PRINCIPAL' : 'ALTERNATIVO');

        this.el(labelId).textContent = label;

        if (!moveset.length) {
            this.el(contentId).innerHTML = `<p style="font-family:'VT323',monospace;font-size:17px;color:var(--muted)">Sin movimientos disponibles para esta generación.</p>`;
            return;
        }

        this.el(contentId).innerHTML = moveset.map((m, i) => {
            const typeKey = (m.tipo ?? '').toLowerCase();
            const colors  = TYPE_COLORS[typeKey] ?? { bg: '#888', fg: '#111' };
            const typeEs  = (TYPE_ES[typeKey] || m.tipo || '').toUpperCase();
            return `
                <div class="move-item">
                    <span class="move-n">${i + 1}.</span>
                    <div class="move-body">
                        <div class="move-header">
                            <span class="move-name">${m.movimiento ?? ''}</span>
                            <span class="move-type" style="background:${colors.bg};color:${colors.fg}">
                                ${typeEs}
                            </span>
                        </div>
                        <p class="move-why">${m.razon ?? ''}</p>
                    </div>
                </div>`;
        }).join('');
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
        ['cardNat', 'cardHab', 'cardMov1', 'cardMov2', 'cardRol', 'cardExtra'].forEach((id, i) => {
            setTimeout(() => this.el(id).classList.add('show'), i * 100);
        });
    },

    // ── Reset ─────────────────────────────────────────────────────

    resetResults() {
        this.hideMessage();
        this.hide('aiSection');
        this.hide('aiLoading');

        const card = this.el('pokeCard');
        card.classList.add('hidden');
        card.classList.remove('show');

        ['cardNat', 'cardHab', 'cardMov1', 'cardMov2', 'cardRol', 'cardExtra'].forEach(id => {
            this.el(id).classList.remove('show');
        });
    },

    // Resetea solo el análisis IA (sin tocar la card del Pokémon)
    resetAnalysis() {
        this.hide('aiSection');
        this.hide('aiLoading');
        ['cardNat', 'cardHab', 'cardMov1', 'cardMov2', 'cardRol', 'cardExtra'].forEach(id => {
            this.el(id).classList.remove('show');
        });
    },

    // ── Estados de carga ──────────────────────────────────────────
    showPokeLoading() { this.show('pokeLoading'); },
    hidePokeLoading() { this.hide('pokeLoading'); },
    showAILoading()   { this.show('aiLoading');   },
    hideAILoading()   { this.hide('aiLoading');   },
};
