/**
 * translator.js — Módulo centralizado de traducción y localización.
 * Encapsula TODOS los diccionarios de texto para mantener limpio el resto del código.
 * Expone window.PokeAnalyzer.translator
 */

window.PokeAnalyzer = window.PokeAnalyzer || {};

window.PokeAnalyzer.translator = {

    // ================================================================
    // STATS: inglés → castellano
    // ================================================================
    STATS_ES: {
        'hp':              'PS',
        'attack':          'Ataque',
        'defense':         'Defensa',
        'special-attack':  'Ataque Esp.',
        'special-defense': 'Defensa Esp.',
        'speed':           'Velocidad',
    },

    STATS_SHORT_ES: {
        'hp':              'PS',
        'attack':          'Atq',
        'defense':         'Def',
        'special-attack':  'At.Esp',
        'special-defense': 'Def.Esp',
        'speed':           'Vel',
    },

    // ================================================================
    // TIERS: código → nombre completo en castellano
    // ================================================================
    TIERS_ES: {
        'OU':        'OU (Overused)',
        'UBERS':     'Ubers',
        'UU':        'UU (Underused)',
        'RU':        'RU (Rarely Used)',
        'NU':        'NU (Never Used)',
        'PU':        'PU (Partially Used)',
        'ZU':        'ZU (Zero Usage)',
        'LC':        'LC (Little Cup)',
        'DOUBLESOU': 'Dobles OU',
        'AG':        'AG (Anything Goes)',
    },

    // ================================================================
    // CATEGORÍAS DE MOVIMIENTO
    // ================================================================
    MOVE_CATEGORIES_ES: {
        'physical': 'Físico',
        'special':  'Especial',
        'status':   'Estado',
    },

    // ================================================================
    // OBJETOS COMPETITIVOS: Smogon (inglés) → castellano
    // ================================================================
    ITEMS_ES: {
        'Choice Specs':       'Lentes Elegidas',
        'Choice Band':        'Cinta Elegida',
        'Choice Scarf':       'Pañuelo Elegido',
        'Life Orb':           'Orbe Vital',
        'Leftovers':          'Restos',
        'Rocky Helmet':       'Casco Rocky',
        'Heavy-Duty Boots':   'Botas Seguras',
        'Eviolite':           'Eviolita',
        'Assault Vest':       'Chaleco de Asalto',
        'Focus Sash':         'Banda Focus',
        'Air Balloon':        'Globo Aerostático',
        'Black Sludge':       'Cieno Negro',
        'Covert Cloak':       'Capa Oculta',
        'Clear Amulet':       'Amuleto Limpio',
        'Booster Energy':     'Turboenergía',
        'Throat Spray':       'Spray Garganta',
        'Expert Belt':        'Cinturón Experto',
        'Flame Orb':          'Orbe Llama',
        'Toxic Orb':          'Orbe Tóxico',
        'White Herb':         'Hierba Blanca',
        'Power Herb':         'Hierba Poder',
        'Light Clay':         'Arcilla Luz',
        'Loaded Dice':        'Dado Cargado',
        'Wide Lens':          'Lente Amplio',
        'Scope Lens':         'Lente Visión',
        'Shell Bell':         'Cascabel Concha',
        'Light Ball':         'Bola Luz',
        'Thick Club':         'Maza Gruesa',
        'Metal Coat':         'Revestimiento Metálico',
        'Charcoal':           'Carbón',
        'Mystic Water':       'Agua Mística',
        'Miracle Seed':       'Semilla Milagro',
        'Magnet':             'Imán',
        'Black Belt':         'Cinturón Negro',
        'Silk Scarf':         'Pañuelo Seda',
        'Never-Melt Ice':     'Hielo Eterno',
        'Poison Barb':        'Espina Venenosa',
        'Soft Sand':          'Arena Fina',
        'Sharp Beak':         'Pico Afilado',
        'Hard Stone':         'Piedra Dura',
        'Silver Powder':      'Polvo Plata',
        'Spell Tag':          'Etiqueta Mágica',
        'Pink Bow':           'Lazo Rosa',
        'Lum Berry':          'Baya Ziuela',
        'Sitrus Berry':       'Baya Zidra',
        'Salac Berry':        'Baya Ziena',
        'Custap Berry':       'Baya Rindula',
        'Sticky Barb':        'Púas Adhesivas',
        'Weakness Policy':    'Seguro Debilidad',
        'Mental Herb':        'Hierba Mental',
        'Terrain Extender':   'Extensión Terreno',
        'Protective Pads':    'Guantes Protectores',
        'Shed Shell':         'Caparazón Muda',
        'Red Card':           'Tarjeta Roja',
        'Razor Claw':         'Garra Afilada',
        'Razor Fang':         'Colmillo Afilado',
        'King\'s Rock':       'Roca del Rey',
        'Colbur Berry':       'Baya Yecana',
        'Shuca Berry':        'Baya Acardo',
        'Yache Berry':        'Baya Chardón',
        'Chople Berry':       'Baya Amichan',
        'Occa Berry':         'Baya Monli',
        'Wacan Berry':        'Baya Gualot',
        'Charti Berry':       'Baya Saurio',
        'Kasib Berry':        'Baya Bsjal',
        'Rindo Berry':        'Baya Kebia',
        'Passho Berry':       'Baya Yeniu',
        'Aguav Berry':        'Baya Aguav',
        'Figy Berry':         'Baya Higog',
        'Iapapa Berry':       'Baya Papaya',
        'Mago Berry':         'Baya Taperus',
        'Wiki Berry':         'Baya Wiki',
        'Petaya Berry':       'Baya Yapati',
        'Liechi Berry':       'Baya Zanama',
        'Grassy Seed':        'Semilla Hierba',
        'Electric Seed':      'Semilla Eléctrica',
        'Psychic Seed':       'Semilla Psíquica',
        'Misty Seed':         'Semilla Bruma',
        'Utility Umbrella':   'Parasol Multiusos',
        'Safety Goggles':     'Gafas Protectoras',
        'Bright Powder':      'Polvo Brillo',
        'Quick Claw':         'Garra Veloz',
        'Ring Target':        'Diana',
        'Lagging Tail':       'Cola Lenta',
        'Iron Ball':          'Bola de Hierro',
        'Muscle Band':        'Cinta Musculosa',
        'Wise Glasses':       'Gafas Inteligentes',
        'Metronome':          'Metrónomo',
        'Ability Shield':     'Escudo Habilidad',
        'Mirror Herb':        'Hierba Espejo',
        'Punching Glove':     'Guante de Boxeo',
    },

    // ================================================================
    // ETIQUETAS DE EVs: clave Smogon → castellano corto
    // ================================================================
    EV_LABELS: {
        hp: 'PS', atk: 'Atq', def: 'Def',
        spa: 'At.Esp', spd: 'Def.Esp', spe: 'Vel',
    },

    // ================================================================
    // RAZONES DE MOVIMIENTO (plantillas)
    // ================================================================
    MOVE_REASONS: {
        pivot:    'Pivote — genera momentum saliendo tras atacar.',
        recovery: 'Recuperación — mantiene la presencia en el campo.',
        hazard:   'Hazard — daño pasivo en cada cambio del rival.',
        setup:    'Potenciación — aumenta el daño para barrer al equipo rival.',
        utility:  'Utilidad — control o soporte al equipo.',
    },

    // ================================================================
    // MÉTODOS DE TRADUCCIÓN
    // ================================================================

    translateItem(itemEn) {
        return this.ITEMS_ES[itemEn] ?? itemEn;
    },

    translateStat(statKey) {
        return this.STATS_ES[statKey] ?? statKey;
    },

    translateStatShort(statKey) {
        return this.STATS_SHORT_ES[statKey] ?? statKey;
    },

    translateTier(tierCode) {
        return this.TIERS_ES[tierCode] ?? tierCode;
    },

    translateMoveCategory(category) {
        return this.MOVE_CATEGORIES_ES[category] ?? category;
    },

    formatSmogonEvs(evs) {
        const parts = Object.entries(evs)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `${v} ${this.EV_LABELS[k] ?? k.toUpperCase()}`);
        return parts.length > 0 ? parts.join(' / ') : '—';
    },

    formatTierDisplay(genNum, tier) {
        const g = `Gen ${genNum}`;
        if (tier) return `${g} — ${this.translateTier(tier)}`;
        return g;
    },
};
