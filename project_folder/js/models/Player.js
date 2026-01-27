// js/models/Player.js
class Player {
    constructor(config = {}) {
        this.capital = config.capital || 1000000;
        this.netWorth = config.netWorth || this.capital;
        this.companies = [];
    }
    
    addCompany(company) {
        this.companies.push(company);
    }
    
    removeCompany(companyId) {
        this.companies = this.companies.filter(c => c.id !== companyId);
    }
    
    calculateNetWorth() {
        let worth = this.capital;
        
        // Добавляем стоимость компаний
        this.companies.forEach(company => {
            worth += company.basePrice;
        });
        
        return worth;
    }
}

// Делаем доступным глобально
window.Player = Player;