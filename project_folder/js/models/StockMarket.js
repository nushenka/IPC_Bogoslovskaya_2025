// js/models/StockMarket.js
class StockMarket {
    constructor() {
        this.stocks = {};
        this.metals = {};
        this.insiderInfo = {};
        this.history = [];
        this.currentRound = 1;
        this.initialize();
    }
    
    initialize() {
        // Инициализируем металлы
        this.metals = {
            gold: {
                name: 'Золото',
                icon: '🥇',
                currentPrice: STOCK_MARKET.gold.basePrice,
                basePrice: STOCK_MARKET.gold.basePrice,
                volatility: STOCK_MARKET.gold.volatility,
                quantity: 0
            },
            platinum: {
                name: 'Платина',
                icon: '🥈',
                currentPrice: STOCK_MARKET.platinum.basePrice,
                basePrice: STOCK_MARKET.platinum.basePrice,
                volatility: STOCK_MARKET.platinum.volatility,
                quantity: 0
            }
        };
        
        // Инициализируем инсайдерскую информацию
        this.insiderInfo = {
            hasInfo: false,
            roundsRemaining: 0,
            revealedShock: null
        };
        
        console.log('Биржа инициализирована');
    }
    
    // Обновить цены на бирже
    update() {
        // Обновляем цены металлов
        Object.keys(this.metals).forEach(metal => {
            const change = (Math.random() - 0.5) * 2 * this.metals[metal].volatility;
            this.metals[metal].currentPrice *= (1 + change);
            this.metals[metal].currentPrice = Math.max(
                this.metals[metal].basePrice * 0.5,
                Math.min(this.metals[metal].basePrice * 2, this.metals[metal].currentPrice)
            );
        });
        
        // Обновляем инсайдерскую информацию
        if (this.insiderInfo.hasInfo && this.insiderInfo.roundsRemaining > 0) {
            this.insiderInfo.roundsRemaining--;
            if (this.insiderInfo.roundsRemaining === 0) {
                this.insiderInfo.hasInfo = false;
                this.insiderInfo.revealedShock = null;
            }
        }
        
        this.currentRound++;
    }
    
    // Купить металл
    buyMetal(metalType, quantity, playerCapital) {
        const metal = this.metals[metalType];
        if (!metal) return false;
        
        const totalCost = metal.currentPrice * quantity;
        if (playerCapital >= totalCost) {
            metal.quantity += quantity;
            return {
                success: true,
                cost: totalCost,
                newPrice: metal.currentPrice
            };
        }
        return { success: false, cost: totalCost };
    }
    
    // Продать металл
    sellMetal(metalType, quantity) {
        const metal = this.metals[metalType];
        if (!metal || metal.quantity < quantity) return false;
        
        const totalValue = metal.currentPrice * quantity;
        metal.quantity -= quantity;
        
        return {
            success: true,
            value: totalValue,
            newPrice: metal.currentPrice
        };
    }
    
    // Купить инсайдерскую информацию
    buyInsiderInfo(playerCapital) {
        const cost = STOCK_MARKET.insiderInfo.basePrice;
        
        if (playerCapital >= cost && !this.insiderInfo.hasInfo) {
            // Выбираем случайный будущий шок
            const futureShock = SHOCKS[Math.floor(Math.random() * SHOCKS.length)];
            
            this.insiderInfo = {
                hasInfo: true,
                roundsRemaining: 3,
                revealedShock: futureShock,
                purchaseRound: this.currentRound
            };
            
            return {
                success: true,
                cost: cost,
                shock: futureShock
            };
        }
        
        return { success: false, cost: cost };
    }
    
    // Получить состояние биржи
    getState() {
        return {
            metals: this.metals,
            insiderInfo: this.insiderInfo,
            currentRound: this.currentRound
        };
    }
    
    // Получить портфель игрока
    getPlayerPortfolio() {
        let totalValue = 0;
        const portfolio = {};
        
        Object.keys(this.metals).forEach(metal => {
            portfolio[metal] = {
                quantity: this.metals[metal].quantity,
                currentPrice: this.metals[metal].currentPrice,
                totalValue: this.metals[metal].quantity * this.metals[metal].currentPrice
            };
            totalValue += portfolio[metal].totalValue;
        });
        
        return {
            portfolio: portfolio,
            totalValue: totalValue,
            hasInsiderInfo: this.insiderInfo.hasInfo,
            insiderInfo: this.insiderInfo.revealedShock
        };
    }
}

// Делаем доступным глобально
window.StockMarket = StockMarket;