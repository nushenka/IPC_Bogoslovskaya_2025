// js/models/EconomicEnvironment.js
class EconomicEnvironment {
    constructor() {
        this.inflation = 5.0;
        this.interestRate = 7.5;
        this.taxRate = 20;
        this.globalDemand = 85;
    }
    
    update() {
        // Случайные изменения
        this.inflation += (Math.random() - 0.5) * 0.5;
        this.globalDemand += (Math.random() - 0.5) * 2;
        
        // Ограничения
        this.inflation = Math.max(0, Math.min(20, this.inflation));
        this.globalDemand = Math.max(20, Math.min(120, this.globalDemand));
    }
    
    getCurrentState() {
        return {
            inflation: this.inflation,
            interestRate: this.interestRate,
            taxRate: this.taxRate,
            globalDemand: this.globalDemand
        };
    }
}

export { EconomicEnvironment };

if (typeof window !== "undefined") {
    window.EconomicEnvironment = EconomicEnvironment;
}
