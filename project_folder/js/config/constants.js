export const STOCK_MARKET = {
    gold: {
        name: "Золото",
        basePrice: 5000,
        volatility: 0.1,
        minPrice: 2500,
        maxPrice: 10000
    },
    silver: {
        name: "Серебро",
        basePrice: 1200,
        volatility: 0.14,
        minPrice: 700,
        maxPrice: 3000
    },
    insiderInfo: {
        basePrice: 50000,
        duration: 3
    }
};

export const SHOCKS = [
    {
        id: "oil_accident",
        name: "Авария на месторождении",
        target: "vshe_neft",
        description: "Сбой добычи повышает производственные издержки и немного снижает спрос.",
        changes: {
            costA: 1.25,
            costB: 1.2,
            demandA: 0.95
        },
        economy: {
            interestRateDelta: 1,
            globalDemandDelta: -4
        },
        duration: 2
    },
    {
        id: "oil_price_growth",
        name: "Рост мировых цен на нефть",
        target: "vshe_neft",
        description: "Рынок легче принимает высокую цену, спрос становится менее чувствительным.",
        changes: {
            demandA: 1.2,
            demandB: 0.9
        },
        economy: {
            interestRateDelta: 1,
            inflationDelta: 1
        },
        duration: 2
    },
    {
        id: "oil_green_tax",
        name: "Экологический сбор",
        target: "vshe_neft",
        description: "Для нефтяников растут регуляторные и производственные издержки.",
        changes: {
            costA: 1.15,
            costB: 1.1
        },
        economy: {
            taxRateDelta: 2
        },
        duration: 2
    },
    {
        id: "construction_subsidy",
        name: "Субсидии на строительство",
        target: "vshe_stroy",
        description: "Госпрограмма поддержки расширяет спрос на строительные услуги.",
        changes: {
            demandA: 1.25,
            demandB: 0.95
        },
        economy: {
            globalDemandDelta: 6
        },
        duration: 3
    },
    {
        id: "construction_materials",
        name: "Рост цен на материалы",
        target: "vshe_stroy",
        description: "Подрядчики сталкиваются с ростом затрат на цемент и металл.",
        changes: {
            costB: 1.3
        },
        economy: {
            inflationDelta: 2
        },
        duration: 2
    },
    {
        id: "new_builders",
        name: "Приход новых застройщиков",
        target: "vshe_stroy",
        description: "Конкуренция усиливается, а спрос становится более чувствительным к цене.",
        changes: {
            demandA: 0.9,
            demandB: 1.15
        },
        economy: {
            globalDemandDelta: -2
        },
        duration: 2
    },
    {
        id: "warehouse_fire",
        name: "Сбой логистики",
        target: "vshe_sklad",
        description: "Логистические сбои повышают издержки и сокращают спрос на складские услуги.",
        changes: {
            costA: 1.1,
            costB: 1.2,
            demandA: 0.85
        },
        economy: {
            globalDemandDelta: -3
        },
        duration: 2
    },
    {
        id: "warehouse_ecommerce",
        name: "Бум онлайн-торговли",
        target: "vshe_sklad",
        description: "Спрос на складские мощности резко увеличивается.",
        changes: {
            demandA: 1.3,
            demandB: 0.9
        },
        economy: {
            globalDemandDelta: 5
        },
        duration: 3
    },
    {
        id: "warehouse_automation",
        name: "Автоматизация склада",
        target: "vshe_sklad",
        description: "Новые технологии снижают переменные издержки хранения.",
        changes: {
            costA: 0.9,
            costB: 0.8
        },
        economy: {
            interestRateDelta: -1
        },
        duration: 2
    },
    {
        id: "retail_panic_buying",
        name: "Паническая скупка",
        target: "vshe_magazin",
        description: "Спрос на товары резко растет, рынок легче принимает более высокие цены.",
        changes: {
            demandA: 1.25,
            demandB: 0.9
        },
        economy: {
            globalDemandDelta: 7
        },
        duration: 2
    },
    {
        id: "retail_strike",
        name: "Забастовка работников магазинов",
        target: "vshe_magazin",
        description: "Издержки растут, а часть покупателей уходит к альтернативам.",
        changes: {
            costA: 1.2,
            costB: 1.15,
            demandA: 0.9
        },
        duration: 2
    },
    {
        id: "retail_competitor_supply",
        name: "Сбой поставок у конкурента",
        target: "vshe_magazin",
        description: "Конкуренту становится сложнее торговать, лидер получает преимущество.",
        changes: {
            demandA: 1.15,
            competitorCostA: 1.25,
            competitorCostB: 1.2
        },
        duration: 2
    },
    {
        id: "retail_price_war",
        name: "Агрессивная акция конкурента",
        target: "vshe_magazin",
        description: "Спрос лидера снижается, а конкурирующая фирма временно эффективнее.",
        changes: {
            demandA: 0.85,
            demandB: 1.2,
            competitorCostA: 0.9
        },
        duration: 2
    },
    {
        id: "telecom_cost_growth",
        name: "Рост затрат на сеть",
        target: "vshe_line",
        description: "Обслуживание инфраструктуры дорожает.",
        changes: {
            costA: 1.15,
            costB: 1.2
        },
        duration: 3
    },
    {
        id: "telecom_competitor_failure",
        name: "Потери оборудования у конкурента",
        target: "vshe_line",
        description: "Проблемы конкурента улучшают положение фирмы игрока.",
        changes: {
            demandA: 1.1,
            competitorCostA: 1.2,
            competitorCostB: 1.25
        },
        duration: 2
    },
    {
        id: "telecom_substitute",
        name: "Новый мессенджер",
        target: "vshe_line",
        description: "Часть спроса уходит к заменителям, а чувствительность к цене растет.",
        changes: {
            demandA: 0.8,
            demandB: 1.15
        },
        duration: 3
    },
    {
        id: "taxi_driver_shortage",
        name: "Дефицит водителей",
        target: "vshe_taxi",
        description: "Не хватает водителей, поэтому обслуживание дорожает.",
        changes: {
            costA: 1.2,
            costB: 1.25,
            demandA: 0.95
        },
        duration: 2
    },
    {
        id: "taxi_tourism",
        name: "Рост туризма",
        target: "vshe_taxi",
        description: "Город привлекает больше клиентов, спрос на поездки растет.",
        changes: {
            demandA: 1.3,
            demandB: 0.9
        },
        economy: {
            globalDemandDelta: 5
        },
        duration: 2
    },
    {
        id: "taxi_tariff_cap",
        name: "Регулирование тарифов",
        target: "vshe_taxi",
        description: "Тарифы ограничиваются, а административные издержки растут.",
        changes: {
            demandA: 1.1,
            costB: 1.1
        },
        duration: 2
    },
    {
        id: "inflation_all",
        name: "Общий инфляционный скачок",
        target: "all",
        description: "Издержки бизнеса растут во всех отраслях.",
        changes: {
            costA: 1.1,
            costB: 1.12
        },
        economy: {
            inflationDelta: 3,
            interestRateDelta: 2,
            globalDemandDelta: -4
        },
        duration: 3
    },
    {
        id: "key_rate_cut",
        name: "Снижение ключевой ставки",
        target: "all",
        description: "Спрос в экономике оживляется благодаря более дешевым деньгам.",
        changes: {
            demandA: 1.08
        },
        economy: {
            interestRateDelta: -2,
            globalDemandDelta: 6
        },
        duration: 2
    },
    {
        id: "credit_crunch",
        name: "Кредитное сжатие",
        target: "all",
        description: "Банки ужесточают условия, спрос в экономике снижается.",
        changes: {
            demandA: 0.92,
            demandB: 1.05
        },
        economy: {
            interestRateDelta: 3,
            globalDemandDelta: -8
        },
        duration: 2
    },
    {
        id: "gold_mine_strike",
        name: "Забастовка на золотых рудниках",
        target: "market",
        description: "Добыча золота сокращается, предложение падает, цена металла растет.",
        marketEffects: {
            gold: {
                costA: 1.2,
                costB: 1.25,
                demandA: 1.05
            }
        },
        duration: 2
    },
    {
        id: "silver_solar_demand",
        name: "Рост спроса на серебро в электронике",
        target: "market",
        description: "Производители солнечных панелей увеличивают спрос на серебро.",
        marketEffects: {
            silver: {
                demandA: 1.3,
                demandB: 0.9
            }
        },
        duration: 3
    },
    {
        id: "gold_reserve_sale",
        name: "Продажа золотых резервов страной",
        target: "market",
        description: "На рынок выбрасывается дополнительное золото, цена снижается.",
        marketEffects: {
            gold: {
                demandA: 0.9,
                costA: 0.95
            }
        },
        duration: 2
    },
    {
        id: "silver_tech_substitution",
        name: "Технология экономии серебра",
        target: "market",
        description: "Новая технология снижает промышленный спрос на серебро.",
        marketEffects: {
            silver: {
                demandA: 0.75,
                demandB: 1.1
            }
        },
        duration: 3
    },
    {
        id: "mining_geopolitical_conflict",
        name: "Геополитический конфликт в регионе добычи",
        target: "market",
        description: "Риски поставок повышают цены на золото и серебро.",
        marketEffects: {
            gold: {
                costA: 1.15,
                costB: 1.2
            },
            silver: {
                costA: 1.1,
                costB: 1.15
            }
        },
        duration: 3
    },
    {
        id: "eco_mining_regulation",
        name: "Ужесточение экологических норм в добыче",
        target: "market",
        description: "Издержки добычи растут из-за новых природоохранных требований.",
        marketEffects: {
            gold: {
                costC: 1.25
            },
            silver: {
                costC: 1.3
            }
        },
        duration: 3
    }
];
