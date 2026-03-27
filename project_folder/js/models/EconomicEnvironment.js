class EconomicEnvironment {
    constructor() {
        this.baseInflation = 5;
        this.baseInterestRate = 8;
        this.baseTaxRate = 2;
        this.baseGlobalDemand = 85;

        this.inflation = this.baseInflation;
        this.interestRate = this.baseInterestRate;
        this.taxRate = this.baseTaxRate;
        this.globalDemand = this.baseGlobalDemand;
        this.activeShocks = [];
    }
    
    update() {
        this.baseInflation += Math.round((Math.random() - 0.5) * 2);
        this.baseInterestRate += Math.round((Math.random() - 0.5) * 2);
        this.baseGlobalDemand += Math.round((Math.random() - 0.5) * 4);

        this.baseInflation = Math.max(0, Math.min(20, this.baseInflation));
        this.baseInterestRate = Math.max(4, Math.min(20, this.baseInterestRate));
        this.baseGlobalDemand = Math.max(20, Math.min(120, this.baseGlobalDemand));

        this.activeShocks = this.activeShocks.filter((item) => {
            item.roundsRemaining -= 1;
            return item.roundsRemaining > 0;
        });

        this.recalculateState();
    }

    applyShock(shock) {
        this.activeShocks.push({
            shock,
            roundsRemaining: shock.duration || 1
        });
        this.recalculateState();
    }

    recalculateState() {
        let inflationDelta = 0;
        let interestRateDelta = 0;
        let taxRateDelta = 0;
        let globalDemandDelta = 0;

        this.activeShocks.forEach(({ shock }) => {
            const economy = shock.economy || {};
            inflationDelta += economy.inflationDelta || 0;
            interestRateDelta += economy.interestRateDelta || 0;
            taxRateDelta += economy.taxRateDelta || 0;
            globalDemandDelta += economy.globalDemandDelta || 0;
        });

        this.inflation = Math.max(0, Math.min(25, this.baseInflation + inflationDelta));
        this.interestRate = Math.max(4, Math.min(25, this.baseInterestRate + interestRateDelta));
        this.taxRate = Math.max(0, Math.min(8, this.baseTaxRate + taxRateDelta));
        this.globalDemand = Math.max(20, Math.min(140, this.baseGlobalDemand + globalDemandDelta));
    }
    
    getCurrentState() {
        return {
            inflation: this.inflation,
            interestRate: this.interestRate,
            taxRate: this.taxRate,
            globalDemand: this.globalDemand,
            activeShocks: this.activeShocks.map((item) => item.shock.name)
        };
    }
}

export { EconomicEnvironment };

if (typeof window !== "undefined") {
    window.EconomicEnvironment = EconomicEnvironment;
}
