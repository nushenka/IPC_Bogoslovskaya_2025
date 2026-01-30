// js/config/businessConfig.js
const BUSINESS_TYPES = [
    {
        id: 'vshe_neft',
        name: 'ВШЭнефть',
        icon: '🛢️',
        basePrice: 3000000,
        marketType: 'monopoly',
        
        // Спрос: P = a - bQ
        demandA: 10000,
        demandB: 2.5,
        
        // Издержки: TC = aQ² + bQ + c
        costA: 0.3,      // квадратичный коэффициент
        costB: 800,      // линейный коэффициент
        costC: 5,   // постоянные издержки
        costFormula: 'TC = 0.3Q² + 800Q + 5',
        
        description: 'Нефтедобывающая компания. Естественная монополия на рынке нефтепродуктов.',
        minPrice: 2000,
        maxPrice: 8000
    },
    
    {
        id: 'vshe_stroy',
        name: 'ВШЭстрой',
        icon: '🏗️',
        basePrice: 500000,
        marketType: 'perfect_competition',
        competitors: 15,
        
        demandA: 2000,
        demandB: 0.4,
        
        // Линейные издержки: TC = bQ + c
        costA: 0,        // нет квадратичной части
        costB: 100,      // переменные издержки на единицу
        costC: 0,   // постоянные издержки
        costFormula: 'TC = 100Q',
        
        description: 'Строительная компания. Работает в условиях совершенной конкуренции.',
        minPrice: 100,
        maxPrice: 1000
    },
    
    {
        id: 'vshe_sklad',
        name: 'ВШЭсклад',
        icon: '📦',
        basePrice: 400000,
        marketType: 'perfect_competition',
        competitors: 12,
        
        demandA: 1500,
        demandB: 0.3,
        
        costA: 0,
        costB: 60,
        costC: 8,
        costFormula: 'TC = 60Q + 8',
        
        description: 'Складской комплекс. Услуги хранения в условиях высокой конкуренции.',
        minPrice: 50,
        maxPrice: 500
    },
    
    {
        id: 'vshe_magazin',
        name: 'ВШЭМагазин',
        icon: '🛒',
        basePrice: 600000,
        marketType: 'stackelberg_follower',
        competitors: 2,
        
        demandA: 1200,
        demandB: 0.25,
        
        // Ваши издержки
        costA: 0.0004,
        costB: 40,
        costC: 12,
        costFormula: 'TC = 0.0004Q² + 40Q + 12',
        
        // Издержки конкурентов (для Штакельберга)
        competitorCosts: [
            { costFormula: 'TC = 0.00035Q² + 38Q + 110,000', name: 'МегаМарт (лидер)' },
            { costFormula: 'TC = 0.00045Q² + 42Q + 130,000', name: 'СуперТорг' }
        ],
        
        description: 'Сеть магазинов. Олигополия Штакельберга (вы - последователь).',
        minPrice: 10,
        maxPrice: 100
    },
    
    {
        id: 'vshe_line',
        name: 'ВШЭЛайн',
        icon: '📱',
        basePrice: 700000,
        marketType: 'cournot',
        competitors: 2,
        
        demandA: 1800,
        demandB: 0.35,
        
        // Все фирмы имеют одинаковые издержки (Курно)
        costA: 0.0006,
        costB: 70,
        costC: 9,
        costFormula: 'TC = 0.0006Q² + 70Q + 9',
        
        // Общие издержки для конкурентов
        commonCompetitorFormula: 'TC = 0.0006Q² + 70Q + 9',
        
        description: 'Мобильный оператор. Олигополия Курно (3 фирмы на рынке, одинаковые издержки).',
        minPrice: 100,
        maxPrice: 500
    },
    
    {
        id: 'vshe_taxi',
        name: 'ВШЭТакси',
        icon: '🚕',
        basePrice: 800000,
        marketType: 'monopoly',
        
        demandA: 800,
        demandB: 0.2,
        
        costA: 0.0002,
        costB: 50,
        costC: 15,
        costFormula: 'TC = 0.0002Q² + 50Q + 15',
        
        description: 'Таксомоторная служба. Монополия в городе благодаря эксклюзивной лицензии.',
        minPrice: 50,
        maxPrice: 300
    }
];

// Делаем доступным глобально
window.BUSINESS_TYPES = BUSINESS_TYPES;