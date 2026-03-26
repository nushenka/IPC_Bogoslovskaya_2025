export const STOCK_MARKET = {
    gold: {
        name: "Золото",
        basePrice: 5000,
        volatility: 0.1,
        minPrice: 2500,
        maxPrice: 10000
    },
    platinum: {
        name: "Платина",
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

export const SHOCKS = [
    {
        name: "Цены на нефть упали на 15%",
        description: "Мировые цены на нефть резко снизились",
        effects: {
            vshe_neft: { demand: 0.85, cost: 1.1 }
        },
        duration: 2
    },
    {
        name: "Строительный бум",
        description: "Правительство запустило программу доступного жилья",
        effects: {
            vshe_stroy: { demand: 1.3, cost: 0.95 }
        },
        duration: 3
    },
    {
        name: "Кризис на рынке такси",
        description: "Новые правила лицензирования ужесточились",
        effects: {
            vshe_taxi: { demand: 0.7, cost: 1.2 }
        },
        duration: 2
    },
    {
        name: "Технологический прорыв",
        description: "Новые технологии снизили издержки связи",
        effects: {
            vshe_line: { cost: 0.8 }
        },
        duration: 4
    },
    {
        name: "Рост налогов на торговлю",
        description: "Правительство повысило НДС для ритейла",
        effects: {
            vshe_magazin: { tax: 1.3 }
        },
        duration: 2
    }
];
