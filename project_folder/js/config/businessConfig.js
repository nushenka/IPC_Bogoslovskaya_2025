// js/config/businessConfig.js
const BUSINESS_TYPES = [
    {
        id: 'vshe_neft',
        name: 'ВШЭнефть',
        icon: '🛢️',
        basePrice: 3000000,
        marketType: 'monopoly',

        // Спрос: P = a - bQ
        demandA: 200,
        demandB: 2,

        // Издержки: TC = aQ² + bQ + c
        costA: 1,
        costB: 20,
        costC: 500,

        description: 'Нефтедобывающая компания. Естественная монополия на рынке нефтепродуктов.',
        minPrice: 20,
        maxPrice: 190
    },

    {
        id: 'vshe_stroy',
        name: 'ВШЭстрой',
        icon: '🏗️',
        basePrice: 500000,
        marketType: 'perfect_competition',
        competitors: 15,

        // Спрос: P = a - bQ (рыночный)
        demandA: 100,
        demandB: 1,

        // TC = bQ + c (линейные)
        costA: 0,
        costB: 10,
        costC: 0,

        description: 'Строительная компания. Работает в условиях совершенной конкуренции.',
        minPrice: 10,
        maxPrice: 90
    },

    {
        id: 'vshe_sklad',
        name: 'ВШЭсклад',
        icon: '📦',
        basePrice: 400000,
        marketType: 'perfect_competition',
        competitors: 12,

        demandA: 80,
        demandB: 1,

        costA: 0,
        costB: 8,
        costC: 100,

        description: 'Складской комплекс. Услуги хранения в условиях высокой конкуренции.',
        minPrice: 8,
        maxPrice: 72
    },

    {
        id: 'vshe_magazin',
        name: 'ВШЭМагазин',
        icon: '🛒',
        basePrice: 600000,
        marketType: 'stackelberg_follower',
        competitors: 1,

        // Спрос: P = a - b*(Q1+Q2)
        demandA: 120,
        demandB: 1,

        // Ваши издержки: TC = bQ + c (линейные для чистоты формул)
        costA: 0,
        costB: 20,
        costC: 0,

        // Издержки лидера
        competitorCostB: 15,
        competitorCostC: 0,

        description: 'Сеть магазинов. Олигополия Штакельберга (вы — последователь).',
        minPrice: 5,
        maxPrice: 115
    },

    {
        id: 'vshe_line',
        name: 'ВШЭЛайн',
        icon: '📱',
        basePrice: 700000,
        marketType: 'cournot',
        competitors: 1,

        // Спрос: P = a - b*(Q1+Q2)
        demandA: 100,
        demandB: 1,

        // Ваши издержки
        costA: 2,
        costB: 4,
        costC: 0,

        // Издержки конкурента (для отображения)
        competitorCostA: 1,
        competitorCostB: 4,
        competitorCostC: 0,

        description: 'Мобильный оператор. Олигополия Курно (2 фирмы на рынке).',
        minPrice: 5,
        maxPrice: 95
    },

    {
        id: 'vshe_taxi',
        name: 'ВШЭТакси',
        icon: '🚕',
        basePrice: 800000,
        marketType: 'monopoly',

        demandA: 150,
        demandB: 3,

        costA: 2,
        costB: 30,
        costC: 200,

        description: 'Таксомоторная служба. Монополия в городе благодаря эксклюзивной лицензии.',
        minPrice: 5,
        maxPrice: 145
    }
];

window.BUSINESS_TYPES = BUSINESS_TYPES;