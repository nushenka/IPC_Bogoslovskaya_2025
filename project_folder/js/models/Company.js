// js/models/Company.js
class Company {
    constructor(config) {
        this.id = 'company_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.name = config.name || 'Компания';
        this.icon = config.icon || '🏢';
        this.basePrice = config.basePrice || 100000;
        
        // Параметры спроса
        this.demandA = config.demandA || 100;
        this.demandB = config.demandB || 0.01;
        
        //  ОРИГИНАЛЬНЫЕ коэффициенты из конфига (неизменяемые)
        this.originalCostA = config.costA || 0;
        this.originalCostB = config.costB || 10;
        this.originalCostC = config.costC || 100;
        
        //  ТЕКУЩИЕ коэффициенты (будут рандомизированы при покупке)
        this.costA = config.costA || 0;
        this.costB = config.costB || 10;
        this.costC = config.costC || 1;
        
        //  Определяем тип издержек
        this.hasQuadraticCosts = config.costA && config.costA > 0;
        
        // Рыночная структура
        this.marketStructure = config.marketType || 'perfect_competition';
        this.competitors = config.competitors || 0;
        this.competitorCosts = config.competitorCosts || [];
        this.commonCompetitorCosts = config.commonCompetitorCosts || null;
        this.description = config.description || '';
        this.specialType = config.specialType || null;
        
        // Текущие значения
        this.productPrice = this.calculateInitialPrice();
        this.production = this.calculateInitialProduction();
        this.profit = 0;
        this.revenue = 0;
        this.totalCost = 0;
        this.demand = 0;
        this.marketShare = 0;
        
        // Шоки и модификаторы
        this.activeShocks = [];
        this.demandMultiplier = 1.0;
        this.costMultiplier = 1.0;
        this.taxMultiplier = 1.0;
        
        // Статус
        this.ownedByPlayer = false;
        this.config = config;
        
        console.log(`Создана компания: ${this.name} (${this.marketStructure})`);
    }
    
    //  МЕТОД ДЛЯ РАНДОМИЗАЦИИ КОЭФФИЦИЕНТОВ (вызывается при покупке)
    randomizeCosts() {
        const variation = 0.2; // ±20% вариация
        
        // Случайное изменение коэффициентов
        this.costA = this.originalCostA * (0.8 + Math.random() * variation);
        this.costB = this.originalCostB * (0.8 + Math.random() * variation);
        this.costC = this.originalCostC * (0.8 + Math.random() * variation);
        
        // Округляем для читаемости
        if (this.costA > 0) {
            this.costA = Math.round(this.costA * 10000) / 10000; // 4 знака
        }
        this.costB = Math.round(this.costB * 100) / 100; // 2 знака
        this.costC = Math.round(this.costC);
        
        // Обновляем флаг квадратичных издержек
        this.hasQuadraticCosts = this.costA > 0;
        
        console.log(`Коэффициенты издержек для ${this.name} рандомизированы:`);
        console.log(`A: ${this.costA}, B: ${this.costB}, C: ${this.costC}`);
    }
    
    //  МЕТОД ДЛЯ ПОЛУЧЕНИЯ ФОРМУЛЫ ИЗДЕРЖЕК
    getCostFormula() {
        if (!this.ownedByPlayer) {
            return "TC = ? (купите компанию, чтобы увидеть формулу)";
        }
        
        if (this.hasQuadraticCosts && this.costA > 0) {
            return `TC = ${this.costA.toFixed(4)}·Q² + ${this.costB.toFixed(2)}·Q + ${this.costC.toLocaleString()}`;
        } else {
            return `TC = ${this.costB.toFixed(2)}·Q + ${this.costC.toLocaleString()}`;
        }
    }
    
    //  МЕТОД ДЛЯ ПОЛУЧЕНИЯ ФОРМУЛЫ СПРОСА
    getDemandFormula() {
        return `P = ${this.demandA.toFixed(2)} - ${this.demandB.toFixed(4)}·Q`;
    }
    
    calculateInitialPrice() {
        switch(this.marketStructure) {
            case 'monopoly':
                // Монополия: MR = MC
                return this.demandA / 2 + this.costB / 2;
            case 'stackelberg_follower':
                // Последователь в Штакельберге
                return this.demandA * 0.4;
            default:
                return 50; // Базовая цена
        }
    }
    
    calculateInitialProduction() {
        switch(this.marketStructure) {
            case 'monopoly':
                return (this.demandA - this.costB) / (2 * this.demandB);
            case 'cournot':
                const n = this.competitors + 1;
                return (this.demandA - this.costB) / (this.demandB * (n + 1));
            case 'stackelberg_follower':
                return (this.demandA - this.costB) / (4 * this.demandB);
            default:
                return 1000;
        }
    }
    
    calculateDemand() {
        let marketDemand = 0;
        
        switch(this.marketStructure) {
            case 'monopoly':
                // Q = (a - P) / b
                marketDemand = (this.demandA - this.productPrice) / this.demandB;
                break;
                
            case 'perfect_competition':
                // В совершенной конкуренции спрос на фирму = ее производство
                marketDemand = this.production;
                break;
                
            case 'cournot':
                // В Курно рыночный спрос делится между фирмами
                const totalFirms = this.competitors + 1;
                const marketPrice = this.demandA - (this.demandB * this.production * totalFirms);
                marketDemand = (this.demandA - marketPrice) / this.demandB / totalFirms;
                break;
                
            case 'stackelberg_follower':
                // Последователь получает остаточный спрос
                const leaderProduction = (this.demandA - this.costB) / (2 * this.demandB);
                marketDemand = (this.demandA - this.productPrice) / this.demandB - leaderProduction;
                break;
                
            default:
                marketDemand = (this.demandA - this.productPrice) / this.demandB;
        }
        
        // Применяем шоки
        marketDemand *= this.demandMultiplier;
        
        // Не может быть отрицательным
        this.demand = Math.max(0, Math.floor(marketDemand));
        return this.demand;
    }
    
    calculateCosts() {
        // TC = aQ² + bQ + c
        let costs = (this.costA * this.production * this.production) + 
                   (this.costB * this.production) + 
                   this.costC;
        
        // Применяем шоки
        costs *= this.costMultiplier;
        
        this.totalCost = costs;
        return costs;
    }
    
    calculateProfit(taxRate = 20) {
        const demand = this.calculateDemand();
        const actualSales = Math.min(demand, this.production);
        
        // Выручка
        this.revenue = actualSales * this.productPrice;
        
        // Издержки
        this.calculateCosts();
        
        // Прибыль до налогов
        let profit = this.revenue - this.totalCost;
        
        // Применяем налоги
        profit *= (1 - (taxRate * this.taxMultiplier) / 100);
        
        this.profit = profit;
        return profit;
    }
    
    // Применить шок
    applyShock(shock) {
        if (shock.effects.all) {
            if (shock.effects.all.demand) this.demandMultiplier *= shock.effects.all.demand;
            if (shock.effects.all.cost) this.costMultiplier *= shock.effects.all.cost;
            if (shock.effects.all.tax) this.taxMultiplier *= shock.effects.all.tax;
        }
        
        if (shock.effects[this.config.id]) {
            const effect = shock.effects[this.config.id];
            if (effect.demand) this.demandMultiplier *= effect.demand;
            if (effect.cost) this.costMultiplier *= effect.cost;
        }
        
        this.activeShocks.push({
            shock: shock,
            roundsRemaining: shock.duration || 1
        });
        
        console.log(`Шок применен к ${this.name}: ${shock.name}`);
    }
    
    // Обновить шоки
    updateShocks() {
        this.activeShocks = this.activeShocks.filter(shock => {
            shock.roundsRemaining--;
            return shock.roundsRemaining > 0;
        });
        
        // Сбрасываем модификаторы если нет активных шоков
        if (this.activeShocks.length === 0) {
            this.demandMultiplier = 1.0;
            this.costMultiplier = 1.0;
            this.taxMultiplier = 1.0;
        }
    }
    
    // Получить детальную информацию
    getDetailedInfo() {
        return {
            id: this.id,
            name: this.name,
            icon: this.icon,
            type: this.marketStructure,
            description: this.description,
            
            // Формулы
            demandFormula: this.getDemandFormula(),
            costFormula: this.getCostFormula(),
            
            // Текущие значения
            productPrice: this.productPrice,
            production: this.production,
            demand: this.demand,
            revenue: this.revenue,
            totalCost: this.totalCost,
            profit: this.profit,
            marketShare: this.marketShare,
            
            // Рыночная структура
            marketStructure: this.getMarketStructureName(),
            competitors: this.competitors,
            
            // Шоки
            activeShocks: this.activeShocks.map(s => s.shock.name),
            demandMultiplier: this.demandMultiplier,
            costMultiplier: this.costMultiplier,
            
            // Особенности
            specialType: this.specialType,
            isMonopoly: this.marketStructure === 'monopoly',
            isOligopoly: ['cournot', 'stackelberg_follower'].includes(this.marketStructure),
            
            // Коэффициенты (только для купленных компаний)
            coefficients: this.ownedByPlayer ? {
                costA: this.costA,
                costB: this.costB,
                costC: this.costC,
                demandA: this.demandA,
                demandB: this.demandB
            } : null
        };
    }
    
    getMarketStructureName() {
        const names = {
            'monopoly': 'Монополия',
            'perfect_competition': 'Совершенная конкуренция',
            'cournot': 'Олигополия Курно',
            'stackelberg_follower': 'Олигополия Штакельберга (Последователь)',
            'monopolistic_competition': 'Монополистическая конкуренция'
        };
        return names[this.marketStructure] || this.marketStructure;
    }
    
    setPrice(newPrice) {
        this.productPrice = newPrice;
        return true;
    }
    
    setProduction(newProduction) {
        this.production = newProduction;
        return true;
    }
}

// Делаем доступным глобально
window.Company = Company;