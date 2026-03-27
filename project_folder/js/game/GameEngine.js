import { BUSINESS_TYPES } from "../config/businessConfig.js";
import { SHOCKS } from "../config/constants.js";
import { Bank } from "../models/Bank.js";
import { Company } from "../models/Company.js";
import { EconomicEnvironment } from "../models/EconomicEnvironment.js";
import { Player } from "../models/Player.js";
import { StockMarket } from "../models/StockMarket.js";

class GameEngine {
    constructor() {
        this.currentRound = 1;
        this.player = null;
        this.economy = null;
        this.availableCompanies = [];
        this.bank = null;
        this.stockMarket = null;
        this.activeShocks = [];
    }

    initialize() {
        console.log('Инициализация игры...');
        
        this.economy = new EconomicEnvironment();
        this.player = new Player({
            capital: 1000000,
            netWorth: 1000000
        });
        this.bank = new Bank();
        this.stockMarket = new StockMarket();
        this.initializeCompanies();
        
        console.log('Игра инициализирована!');
        console.log('Доступно компаний:', this.availableCompanies.length);
        
        return true;
    }
    
    initializeCompanies() {
        this.availableCompanies = [];
        
        BUSINESS_TYPES.forEach(config => {
            const companyConfig = {
                ...config,
                marketStructure: config.marketType
            };
            const company = new Company(companyConfig);
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
        const playerCompany = new Company(company.config);
        playerCompany.ownedByPlayer = true;
        playerCompany.randomizeCosts();
        this.player.addCompany(playerCompany);
        this.player.capital -= company.basePrice;
        this.player.netWorth = this.player.calculateNetWorth();
        this.availableCompanies.splice(companyIndex, 1);
        
        console.log('Компания куплена:', playerCompany.name);
        console.log('Формула издержек:', playerCompany.getCostFormula());
        
        return true;
    } else {
        console.log('Недостаточно средств');
        return false;
    }
}
    
    sellCompany(companyId) {
    const companyIndex = this.player.companies.findIndex(c => c.id === companyId);
    if (companyIndex === -1) {
        console.error('Компания не найдена у игрока');
        return false;
    }
    
    const company = this.player.companies[companyIndex];
    
    const sellPrice = Math.round(company.basePrice * 0.7);
    this.player.capital += sellPrice;
    const availableCompany = new Company(company.config);
    availableCompany.ownedByPlayer = false;
    this.availableCompanies.push(availableCompany);
    this.player.companies.splice(companyIndex, 1);
    this.player.netWorth = this.player.calculateNetWorth();
    
    console.log(`Компания "${company.name}" продана за ${sellPrice.toLocaleString()}₽`);
    
    return sellPrice;
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

        if (updates.expectedProfit !== undefined) {
            company.setExpectedProfit(updates.expectedProfit);
        }
        
        return true;
    }
    
    takeLoan(amount) {
        return this.bank.takeLoan(this.player, amount, this.economy.interestRate);
    }

    buyMetal(metalType, quantity) {
        return this.stockMarket.buyMetal(metalType, quantity, this.player.capital);
    }

    sellMetal(metalType, quantity) {
        return this.stockMarket.sellMetal(metalType, quantity);
    }

    buyInsiderInfo() {
        return this.stockMarket.buyInsiderInfo(this.player.capital);
    }

    applyShock(shock) {
        console.log(`Применяется шок: ${shock.name}`);
        
        this.activeShocks.push({
            ...shock,
            appliedRound: this.currentRound,
            roundsRemaining: shock.duration || 1
        });
        
        this.player.companies.forEach(company => {
            company.applyShock(shock);
        });

        this.economy.applyShock(shock);
        this.stockMarket.applyShock(shock);
        
        return shock;
    }
    
    getRandomShock() {
        if (!SHOCKS || SHOCKS.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * SHOCKS.length);
        return { ...SHOCKS[randomIndex] };
    }
    
    nextRound() {
        console.log(`=== Начало раунда ${this.currentRound} ===`);
        
        this.economy.update();
        const loanReports = this.bank.update(this.player, this.economy.interestRate);
        this.stockMarket.update();
        this.player.companies.forEach(company => {
            company.updateShocks();
        });
        this.updateActiveShocks();

        let newShock = null;
        if (this.currentRound >= 2 && SHOCKS && SHOCKS.length > 0) {
            const shock = this.getRandomShock();
            if (shock) {
                this.applyShock(shock);
                newShock = shock;
            }
        }
        
        let totalProfit = 0;
        const companyProfits = [];
        const decisionReports = [];
        
        this.player.companies.forEach(company => {
            const report = company.resolveRoundDecision(this.economy.taxRate, this.currentRound);
            const profit = report.actualProfit || 0;
            totalProfit += profit;
            decisionReports.push(report);

            companyProfits.push({
                name: company.name,
                profit: profit,
                revenue: company.revenue,
                cost: company.totalCost,
                demand: company.demand
            });
        });
        
        this.player.capital += totalProfit;
        this.player.netWorth = this.player.calculateNetWorth();
        
        console.log(`Итог раунда ${this.currentRound}:`);
        console.log(`Общая прибыль: ${totalProfit.toLocaleString()}₽`);
        console.log(`Капитал игрока: ${this.player.capital.toLocaleString()}₽`);
        
        this.currentRound++;
        
        return {
            round: this.currentRound - 1,
            totalProfit: totalProfit,
            newShock: newShock,
            loanReports: loanReports,
            companyProfits: companyProfits,
            decisionReports: decisionReports,
            companies: this.player.companies,
            economy: this.economy.getCurrentState(),
            bank: this.bank.getLoanInfo(),
            stockMarket: this.stockMarket.getState(),
            activeShocks: this.activeShocks.filter(s => s.roundsRemaining > 0)
        };
    }
    
    updateActiveShocks() {
        this.activeShocks = this.activeShocks.filter(shock => {
            shock.roundsRemaining--;
            return shock.roundsRemaining > 0;
        });
    }
    
    getGameState() {
        return {
            round: this.currentRound,
            player: {
                capital: this.player.capital,
                netWorth: this.player.netWorth,
                companies: this.player.companies,
                companiesCount: this.player.companies.length
            },
            economy: this.economy.getCurrentState(),
            bank: this.bank ? this.bank.getLoanInfo() : null,
            stockMarket: this.stockMarket ? this.stockMarket.getState() : null,
            availableCompanies: this.availableCompanies,
            availableCompaniesCount: this.availableCompanies.length,
            activeShocks: this.activeShocks.filter(s => s.roundsRemaining > 0)
        };
    }
    
    getCompanyDetails(companyId) {
        let company = this.player.companies.find(c => c.id === companyId);
        if (!company) {
            company = this.availableCompanies.find(c => c.id === companyId);
        }
        
        return company ? company.getDetailedInfo() : null;
    }
    
    getFinancialReport() {
        const state = this.getGameState();
        
        return {
            round: state.round,
            player: {
                capital: state.player.capital,
                netWorth: state.player.netWorth,
                companiesCount: state.player.companiesCount
            },
            companies: state.player.companies.map(company => ({
                name: company.name,
                profit: company.profit,
                revenue: company.revenue,
                cost: company.totalCost,
                profitMargin: company.revenue > 0 ? (company.profit / company.revenue * 100) : 0
            })),
            economy: state.economy,
            activeShocks: state.activeShocks
        };
    }
}

export { GameEngine };

if (typeof window !== "undefined") {
    window.GameEngine = GameEngine;
}
