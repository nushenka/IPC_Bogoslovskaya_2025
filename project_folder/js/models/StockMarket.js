import { SHOCKS, STOCK_MARKET } from "../config/constants.js";

class StockMarket {
    constructor() {
        this.currentRound = 1;
        this.metals = {
            gold: {
                name: STOCK_MARKET.gold.name,
                currentPrice: STOCK_MARKET.gold.basePrice,
                minPrice: STOCK_MARKET.gold.minPrice,
                maxPrice: STOCK_MARKET.gold.maxPrice,
                volatility: STOCK_MARKET.gold.volatility,
                quantity: 0
            },
            silver: {
                name: STOCK_MARKET.silver.name,
                currentPrice: STOCK_MARKET.silver.basePrice,
                minPrice: STOCK_MARKET.silver.minPrice,
                maxPrice: STOCK_MARKET.silver.maxPrice,
                volatility: STOCK_MARKET.silver.volatility,
                quantity: 0
            }
        };
        this.activeShocks = [];
        this.priceHistory = {
            gold: [STOCK_MARKET.gold.basePrice],
            silver: [STOCK_MARKET.silver.basePrice]
        };
        this.insiderInfo = {
            hasInfo: false,
            roundsRemaining: 0,
            revealedShock: null,
            purchaseRound: null
        };
    }

    _round(value) {
        return Math.round(value);
    }

    _getShockPriceFactor(effects = {}) {
        let factor = 1;

        if (effects.demandA) factor *= effects.demandA;
        if (effects.costA) factor *= effects.costA;
        if (effects.costB) factor *= effects.costB;
        if (effects.costC) factor *= effects.costC;
        if (effects.demandB) factor *= (2 - effects.demandB);

        return Math.max(0.6, Math.min(1.8, factor));
    }

    _applyActiveShockPressure() {
        this.activeShocks.forEach(({ shock }) => {
            const marketEffects = shock.marketEffects || {};

            Object.entries(marketEffects).forEach(([metalKey, effects]) => {
                const metal = this.metals[metalKey];
                if (!metal) return;

                const factor = this._getShockPriceFactor(effects);
                metal.currentPrice = this._round(
                    Math.max(metal.minPrice, Math.min(metal.maxPrice, metal.currentPrice * factor))
                );
            });
        });
    }

    _recordHistory() {
        Object.entries(this.metals).forEach(([metalKey, metal]) => {
            if (!this.priceHistory[metalKey]) {
                this.priceHistory[metalKey] = [];
            }

            this.priceHistory[metalKey].push(metal.currentPrice);

            if (this.priceHistory[metalKey].length > 12) {
                this.priceHistory[metalKey].shift();
            }
        });
    }

    update() {
        this.currentRound += 1;

        Object.values(this.metals).forEach((metal) => {
            const delta = (Math.random() * 2 - 1) * metal.volatility;
            const nextPrice = metal.currentPrice * (1 + delta);
            metal.currentPrice = Math.round(
                Math.max(metal.minPrice, Math.min(metal.maxPrice, nextPrice))
            );
        });

        this._applyActiveShockPressure();
        this._recordHistory();

        this.activeShocks = this.activeShocks.filter((item) => {
            item.roundsRemaining -= 1;
            return item.roundsRemaining > 0;
        });

        if (this.insiderInfo.hasInfo) {
            this.insiderInfo.roundsRemaining -= 1;
            if (this.insiderInfo.roundsRemaining <= 0) {
                this.insiderInfo = {
                    hasInfo: false,
                    roundsRemaining: 0,
                    revealedShock: null,
                    purchaseRound: null
                };
            }
        }
    }

    applyShock(shock) {
        if (!shock?.marketEffects) return;

        this.activeShocks.push({
            shock,
            roundsRemaining: shock.duration || 1
        });

        this._applyActiveShockPressure();
        this._recordHistory();
    }

    buyMetal(metalType, quantity, playerCapital) {
        const metal = this.metals[metalType];
        if (!metal || quantity <= 0) {
            return { success: false, message: "Металл не найден" };
        }

        const totalCost = metal.currentPrice * quantity;
        if (playerCapital < totalCost) {
            return { success: false, cost: totalCost };
        }

        metal.quantity += quantity;
        return {
            success: true,
            cost: totalCost,
            newPrice: metal.currentPrice
        };
    }

    sellMetal(metalType, quantity) {
        const metal = this.metals[metalType];
        if (!metal || quantity <= 0 || metal.quantity < quantity) {
            return { success: false };
        }

        const totalValue = metal.currentPrice * quantity;
        metal.quantity -= quantity;

        return {
            success: true,
            value: totalValue,
            newPrice: metal.currentPrice
        };
    }

    buyInsiderInfo(playerCapital) {
        const cost = STOCK_MARKET.insiderInfo.basePrice;

        if (playerCapital < cost || this.insiderInfo.hasInfo || SHOCKS.length === 0) {
            return { success: false, cost };
        }

        const futureShock = SHOCKS[Math.floor(Math.random() * SHOCKS.length)];
        this.insiderInfo = {
            hasInfo: true,
            roundsRemaining: STOCK_MARKET.insiderInfo.duration,
            revealedShock: futureShock,
            purchaseRound: this.currentRound
        };

        return {
            success: true,
            cost,
            shock: futureShock
        };
    }

    getState() {
        return {
            metals: this.metals,
            priceHistory: this.priceHistory,
            activeShocks: this.activeShocks.map((item) => ({
                name: item.shock.name,
                roundsRemaining: item.roundsRemaining
            })),
            insiderInfo: this.insiderInfo,
            currentRound: this.currentRound
        };
    }
}

export { StockMarket };

if (typeof window !== "undefined") {
    window.StockMarket = StockMarket;
}
