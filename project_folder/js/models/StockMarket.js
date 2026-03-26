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
            platinum: {
                name: STOCK_MARKET.platinum.name,
                currentPrice: STOCK_MARKET.platinum.basePrice,
                minPrice: STOCK_MARKET.platinum.minPrice,
                maxPrice: STOCK_MARKET.platinum.maxPrice,
                volatility: STOCK_MARKET.platinum.volatility,
                quantity: 0
            }
        };
        this.insiderInfo = {
            hasInfo: false,
            roundsRemaining: 0,
            revealedShock: null,
            purchaseRound: null
        };
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
            insiderInfo: this.insiderInfo,
            currentRound: this.currentRound
        };
    }
}

export { StockMarket };

if (typeof window !== "undefined") {
    window.StockMarket = StockMarket;
}
