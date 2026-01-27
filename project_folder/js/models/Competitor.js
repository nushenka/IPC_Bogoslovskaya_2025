// js/models/Competitor.js
class Competitor {
    constructor(config, marketStructure, isLeader = false) {
        this.id = `competitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = `Конкурент ${Math.floor(Math.random() * 1000)}`;
        this.marketStructure = marketStructure;
        this.isLeader = isLeader;
        
        // Параметры издержек конкурента (могут отличаться от игрока)
        this.costA = config.costA * (0.8 + Math.random() * 0.4); // ±20% от игрока
        this.costB = config.costB * (0.8 + Math.random() * 0.4);
        this.costC = config.costC * (0.8 + Math.random() * 0.4);
        
        // Текущие значения
        this.production = 0;
        this.productPrice = 0;
        this.profit = 0;
        
        // Поведенческие параметры
        this.aggressiveness = Math.random(); // 0-1: как агрессивно конкурирует
        this.reactionDelay = Math.floor(Math.random() * 3) + 1; // Задержка реакции в раундах
        this.memory = []; // История действий игрока
        
        this.initializeProduction();
    }
    
    initializeProduction() {
        // Начальный объем производства в зависимости от структуры рынка
        switch(this.marketStructure) {
            case 'cournot':
                this.production = 500 + Math.random() * 1000;
                break;
            case 'stackelberg':
                this.production = this.isLeader ? 800 : 400;
                break;
            case 'cartel':
                this.production = 600 + Math.random() * 400;
                break;
            default:
                this.production = 300 + Math.random() * 700;
        }
    }
    
    // Реакция на действия игрока (Курно)
    reactToCournot(playerProduction, totalMarketProduction) {
        // Кривая реакции: Qi = (a - c - b*∑Qj) / 2b
        // Упрощенная версия
        const reaction = (1 - this.aggressiveness) * playerProduction * 0.5;
        this.production = Math.max(100, this.production + (Math.random() - 0.5) * reaction);
    }
    
    // Реакция для Штакельберга (последователь)
    reactToStackelberg(leaderProduction, marketDemand) {
        // Последователь принимает производство лидера как данность
        // Оптимальный ответ: Qf = (a - c - b*Ql) / 2b
        const optimalProduction = (marketDemand - this.costB - this.costA * leaderProduction) / 
                                 (2 * this.costA + this.costB);
        
        // Плавное движение к оптимальному объему
        const adjustment = (optimalProduction - this.production) * 0.3;
        this.production = Math.max(100, this.production + adjustment);
        
        return this.production;
    }
    
    // Реакция для картеля
    reactToCartel(playerProduction, cooperationLevel) {
        // В картеле фирмы координируют производство
        const targetProduction = playerProduction * cooperationLevel;
        const deviation = Math.random() * 0.2 - 0.1; // Случайное отклонение ±10%
        
        this.production = targetProduction * (1 + deviation);
        
        // Вероятность "жульничества" в картеле
        const cheatProbability = 0.2; // 20% вероятность нарушить соглашение
        if (Math.random() < cheatProbability) {
            this.production *= 1.3; // Производит больше согласованного
        }
    }
    
    // Рассчитать прибыль конкурента
    calculateProfit(marketPrice, totalCost) {
        const revenue = this.production * marketPrice;
        // Издержки: TC = aQ² + bQ + c
        const costs = (this.costA * this.production * this.production) + 
                     (this.costB * this.production) + 
                     this.costC;
        
        this.profit = revenue - costs;
        return this.profit;
    }
    
    // Получить данные о конкуренте
    getDetails() {
        return {
            id: this.id,
            name: this.name,
            production: this.production,
            profit: this.profit,
            costFormula: `TC = ${this.costA.toFixed(4)}Q² + ${this.costB.toFixed(2)}Q + ${this.costC.toFixed(0)}`,
            marketStructure: this.marketStructure,
            isLeader: this.isLeader
        };
    }
}

export default Competitor;