// js/game/GameEngine.js
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
        
        // Создаем экономическую среду
        this.economy = new EconomicEnvironment();
        
        // Создаем игрока
        this.player = new Player({
            capital: 1000000,
            netWorth: 1000000
        });
        
        // Создаем банк и биржу
        this.bank = new Bank();
        this.stockMarket = new StockMarket();
        
        // Создаем доступные компании
        this.initializeCompanies();
        
        console.log('Игра инициализирована!');
        console.log('Доступно компаний:', this.availableCompanies.length);
        
        return true;
    }
    
    initializeCompanies() {
        this.availableCompanies = [];
        
        BUSINESS_TYPES.forEach(config => {
            // Исправляем marketType → marketStructure
            const companyConfig = {
                ...config,
                marketStructure: config.marketType // Исправление!
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
        // Делаем копию компании для игрока
        const playerCompany = new Company(company.config);
        playerCompany.ownedByPlayer = true;
        
        //  ВАЖНО: Рандомизируем коэффициенты издержек
        playerCompany.randomizeCosts();
        
        // Добавляем игроку
        this.player.addCompany(playerCompany);
        this.player.capital -= company.basePrice;
        this.player.netWorth = this.player.calculateNetWorth();
        
        // Удаляем из доступных
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
    
    // Продаем за 70% от базовой цены
    const sellPrice = Math.round(company.basePrice * 0.7);
    
    // Возвращаем деньги игроку
    this.player.capital += sellPrice;
    
    // Возвращаем компанию в доступные (со стандартными коэффициентами)
    const availableCompany = new Company(company.config);
    availableCompany.ownedByPlayer = false;
    // НЕ вызываем randomizeCosts() - для непокупных компаний стандартные коэффициенты
    this.availableCompanies.push(availableCompany);
    
    // Удаляем у игрока
    this.player.companies.splice(companyIndex, 1);
    
    // Обновляем чистую стоимость
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
    
    // Взять кредит
    takeLoan(amount, duration) {
        return this.bank.takeLoan(this.player, amount, duration);
    }
    
    // Погасить кредит
    repayLoan(loanId) {
        return this.bank.makePayment(this.player, loanId);
    }
    
    // Купить металл на бирже
    buyMetal(metalType, quantity) {
        return this.stockMarket.buyMetal(metalType, quantity, this.player.capital);
    }
    
    // Продать металл
    sellMetal(metalType, quantity) {
        return this.stockMarket.sellMetal(metalType, quantity);
    }
    
    // Купить инсайдерскую информацию
    buyInsiderInfo() {
        return this.stockMarket.buyInsiderInfo(this.player.capital);
    }
    
    // Применить шок ко всем компаниям
    applyShock(shock) {
        console.log(`Применяется шок: ${shock.name}`);
        
        this.activeShocks.push({
            ...shock,
            appliedRound: this.currentRound,
            roundsRemaining: shock.duration || 1
        });
        
        // Применяем шок к компаниям игрока
        this.player.companies.forEach(company => {
            company.applyShock(shock);
        });
        
        return shock;
    }
    
    // Получить случайный шок
    getRandomShock() {
        if (!SHOCKS || SHOCKS.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * SHOCKS.length);
        return { ...SHOCKS[randomIndex] };
    }
    
    nextRound() {
        console.log(`=== Начало раунда ${this.currentRound} ===`);
        
        // 1. Обновляем экономику
        this.economy.update();
        
        // 2. Обновляем банк и биржу
        this.bank.update();
        this.stockMarket.update();
        
        // 3. Проверяем, нужно ли применить новый шок (30% вероятность)
        if (Math.random() < 0.3 && SHOCKS && SHOCKS.length > 0) {
            const shock = this.getRandomShock();
            if (shock) {
                this.applyShock(shock);
            }
        }
        
        // 4. Рассчитываем результаты компаний по сохранённым решениям игрока
        let totalProfit = 0;
        const companyProfits = [];
        const decisionReports = [];
        
        this.player.companies.forEach(company => {
            company.updateShocks();

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
        
        // 5. Обновляем капитал игрока
        this.player.capital += totalProfit;
        this.player.netWorth = this.player.calculateNetWorth();
        
        // 6. Обновляем активные шоки
        this.updateActiveShocks();
        
        console.log(`Итог раунда ${this.currentRound}:`);
        console.log(`Общая прибыль: ${totalProfit.toLocaleString()}₽`);
        console.log(`Капитал игрока: ${this.player.capital.toLocaleString()}₽`);
        
        this.currentRound++;
        
        return {
            round: this.currentRound - 1,
            totalProfit: totalProfit,
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
    
    // Получить детали компании по ID
    getCompanyDetails(companyId) {
        // Ищем в компаниях игрока
        let company = this.player.companies.find(c => c.id === companyId);
        
        // Если не нашли, ищем в доступных
        if (!company) {
            company = this.availableCompanies.find(c => c.id === companyId);
        }
        
        return company ? company.getDetailedInfo() : null;
    }
    
    // Получить финансовый отчет
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
