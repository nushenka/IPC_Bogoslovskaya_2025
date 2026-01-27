// js/game/GameEngine.js
class GameEngine {
    constructor() {
        this.currentRound = 1;
        this.player = null;
        this.economy = null;
        this.availableCompanies = [];
    }

    initialize() {
        console.log('Инициализация игры...');
        
        // Создаем экономическую среду
        this.economy = new EconomicEnvironment();
        
        // Создаем игрока
        this.player = new Player({
            capital: 1000000,
            netWorth: 1000000
        });
        
        // Создаем доступные компании
        this.initializeCompanies();
        
        console.log('Игра инициализирована!');
        console.log('Доступно компаний:', this.availableCompanies.length);
        
        return true;
    }
    
    initializeCompanies() {
        this.availableCompanies = [];
        
        BUSINESS_TYPES.forEach(config => {
            const company = new Company(config);
            this.availableCompanies.push(company);
        });
    }
    
    buyCompany(companyId) {
        const companyIndex = this.availableCompanies.findIndex(c => c.id === companyId);
        
        if (companyIndex === -1) {
            console.error('Компания не найдена');
            return false;
        }
        
        const company = this.availableCompanies[companyIndex];
        
        if (this.player.capital >= company.basePrice) {
            // Делаем копию компании для игрока
            const playerCompany = new Company(company.config);
            playerCompany.ownedByPlayer = true;
            
            // Добавляем игроку
            this.player.addCompany(playerCompany);
            this.player.capital -= company.basePrice;
            
            // Удаляем из доступных
            this.availableCompanies.splice(companyIndex, 1);
            
            console.log('Компания куплена:', playerCompany.name);
            return true;
        } else {
            console.log('Недостаточно средств');
            return false;
        }
    }
    
    updateCompany(companyId, updates) {
        const company = this.player.companies.find(c => c.id === companyId);
        if (!company) return false;
        
        if (updates.price !== undefined) {
            company.setPrice(updates.price);
        }
        
        if (updates.production !== undefined) {
            company.setProduction(updates.production);
        }
        
        return true;
    }
    
    nextRound() {
        console.log('Начало раунда', this.currentRound);
        
        // Обновляем экономику
        this.economy.update();
        
        // Рассчитываем прибыль для каждой компании
        let totalProfit = 0;
        this.player.companies.forEach(company => {
            const profit = company.calculateProfit();
            totalProfit += profit;
        });
        
        // Обновляем капитал игрока
        this.player.capital += totalProfit;
        this.player.netWorth = this.player.calculateNetWorth();
        
        this.currentRound++;
        
        return {
            round: this.currentRound - 1,
            totalProfit: totalProfit,
            companies: this.player.companies
        };
    }
    
    getGameState() {
        return {
            round: this.currentRound,
            player: {
                capital: this.player.capital,
                netWorth: this.player.netWorth,
                companies: this.player.companies
            },
            economy: this.economy.getCurrentState(),
            availableCompanies: this.availableCompanies
        };
    }
}

// Делаем доступным глобально
window.GameEngine = GameEngine;