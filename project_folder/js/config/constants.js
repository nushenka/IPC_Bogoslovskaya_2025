// js/config/constants.js
const STOCK_MARKET = {
    gold: {
        name: 'Золото',
        basePrice: 5000,
        volatility: 0.1,
        minPrice: 2500,
        maxPrice: 10000
    },
    platinum: {
        name: 'Платина',
        basePrice: 3000,
        volatility: 0.15,
        minPrice: 1500,
        maxPrice: 6000
    },
    insiderInfo: {
        basePrice: 50000,
        duration: 3
    }
};

// Базовые шоки для системы
const SHOCKS = [
    {
        name: "Цены на нефть упали на 15%",
        description: "Мировые цены на нефть резко снизились",
        effects: {
            vshe_neft: { 
                demand: 0.85,  // -15% спроса
                cost: 1.1      // +10% издержек
            }
        },
        duration: 2
    },
    {
        name: "Строительный бум",
        description: "Правительство запустило программу доступного жилья",
        effects: {
            vshe_stroy: { 
                demand: 1.3,   // +30% спроса
                cost: 0.95     // -5% издержек
            }
        },
        duration: 3
    },
    {
        name: "Кризис на рынке такси",
        description: "Новые правила лицензирования ужесточились",
        effects: {
            vshe_taxi: { 
                demand: 0.7,   // -30% спроса
                cost: 1.2      // +20% издержек
            }
        },
        duration: 2
    },
    {
        name: "Технологический прорыв",
        description: "Новые технологии снизили издержки связи",
        effects: {
            vshe_line: { 
                cost: 0.8      // -20% издержек
            }
        },
        duration: 4
    },
    {
        name: "Рост налогов на торговлю",
        description: "Правительство повысило НДС для ритейла",
        effects: {
            vshe_magazin: { 
                tax: 1.3       // +30% налогов
            }
        },
        duration: 2
    }
];

// Делаем доступными глобально
window.STOCK_MARKET = STOCK_MARKET;
window.SHOCKS = SHOCKS;