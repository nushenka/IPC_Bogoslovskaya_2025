class Player {
    constructor(config = {}) {
        this.capital = config.capital || 1500;
        this.netWorth = config.netWorth || this.capital;
        this.companies = [];
    }
    
    addCompany(company) {
        this.companies.push(company);
    }
    
    calculateNetWorth() {
        let worth = this.capital;
        
        this.companies.forEach(company => {
            worth += company.basePrice;
        });
        
        return worth;
    }
}

export { Player };

if (typeof window !== "undefined") {
    window.Player = Player;
}
