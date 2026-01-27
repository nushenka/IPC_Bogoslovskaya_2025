// js/config/marketStructures.js
export const MARKET_STRUCTURES = {
    PERFECT_COMPETITION: 'perfect_competition',    // Совершенная конкуренция
    MONOPOLY: 'monopoly',                         // Монополия
    CARTEL: 'cartel',                             // Картель (Олигополия по Карно)
    STACKELBERG: 'stackelberg',                   // Штакельберг (лидер-последователь)
    COURNOT: 'cournot'                            // Курно (одновременные решения)
};

export const COMPETITION_CONFIG = {
    [MARKET_STRUCTURES.PERFECT_COMPETITION]: {
        name: 'Совершенная конкуренция',
        description: 'Много фирм, однородный продукт, свободный вход',
        competitors: 20,
        priceTaker: true
    },
    [MARKET_STRUCTURES.MONOPOLY]: {
        name: 'Монополия',
        description: 'Одна фирма на рынке',
        competitors: 0,
        priceTaker: false
    },
    [MARKET_STRUCTURES.CARTEL]: {
        name: 'Картель (Кооперация)',
        description: 'Фирмы координируют цены и объемы',
        competitors: 3,
        priceTaker: false,
        cooperationLevel: 0.8 // Уровень кооперации (0-1)
    },
    [MARKET_STRUCTURES.STACKELBERG]: {
        name: 'Штакельберг',
        description: 'Лидер устанавливает объем, последователи подстраиваются',
        competitors: 2,
        priceTaker: false,
        isLeader: true // Игрок может быть лидером
    },
    [MARKET_STRUCTURES.COURNOT]: {
        name: 'Курно',
        description: 'Фирмы одновременно выбирают объемы производства',
        competitors: 3,
        priceTaker: false
    }
};

export default MARKET_STRUCTURES;