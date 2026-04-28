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
        this.previousRoundCompanyFunctions = {};
    }

    initialize() {
        console.log('Инициализация игры...');
        
        this.economy = new EconomicEnvironment();
        this.player = new Player({
            capital: 1500,
            netWorth: 1500
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

    formatCostFormula(costState) {
        if (!costState) return "TC = —";

        const { costA, costB, costC, costMultiplier } = costState;
        const fmt = (value) => Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 });

        let formula = "";
        if (costA !== 0) {
            formula = `TC = ${fmt(costA)}Q² + ${fmt(costB)}Q + ${fmt(costC)}`;
        } else if (costC !== 0) {
            formula = `TC = ${fmt(costB)}Q + ${fmt(costC)}`;
        } else {
            formula = `TC = ${fmt(costB)}Q`;
        }

        if (costMultiplier !== 1) {
            return `${formula} × ${fmt(costMultiplier)}`;
        }

        return formula;
    }

    formatDemandFormula(demandState) {
        if (!demandState) return "P = —";

        const { demandA, demandB, demandMultiplier } = demandState;
        const fmt = (value) => Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
        const effectiveDemandA = Number(demandA) * Number(demandMultiplier);

        return `P = ${fmt(effectiveDemandA)} - ${fmt(demandB)}Q`;
    }

    doesShockChangeCompanyCosts(shock, companyId) {
        if (!shock) return false;

        const directChanges = shock.changes || {};
        const hasDirectCostChange = ["costA", "costB", "costC", "costMultiplier"]
            .some((key) => typeof directChanges[key] === "number" && directChanges[key] !== 1);
        const appliesByTarget = shock.target === "all" || shock.target === companyId;

        if (appliesByTarget && hasDirectCostChange) {
            return true;
        }

        const hasEffectCostChange = Boolean(shock.effects?.all?.cost || shock.effects?.[companyId]?.cost);
        return hasEffectCostChange;
    }

    doesShockChangeCompanyDemand(shock, companyId) {
        if (!shock) return false;

        const directChanges = shock.changes || {};
        const hasDirectDemandChange = ["demandA", "demandB", "demandMultiplier"]
            .some((key) => typeof directChanges[key] === "number" && directChanges[key] !== 1);
        const appliesByTarget = shock.target === "all" || shock.target === companyId;

        if (appliesByTarget && hasDirectDemandChange) {
            return true;
        }

        const hasEffectDemandChange = Boolean(shock.effects?.all?.demand || shock.effects?.[companyId]?.demand);
        return hasEffectDemandChange;
    }

    snapshotMarketState() {
        const companies = [...this.player.companies, ...this.availableCompanies];
        const companyPrices = Object.fromEntries(
            companies.map((company) => [company.id, Math.round(company.basePrice)])
        );

        const assetPrices = Object.fromEntries(
            Object.entries(this.stockMarket.metals).map(([key, metal]) => [key, Math.round(metal.currentPrice)])
        );

        const companyCosts = Object.fromEntries(
            this.player.companies.map((company) => {
                const costState = {
                    costA: Number(company.costA || 0),
                    costB: Number(company.costB || 0),
                    costC: Number(company.costC || 0),
                    costMultiplier: Number(company.costMultiplier || 1)
                };

                return [company.id, {
                    ...costState,
                    formula: this.formatCostFormula(costState)
                }];
            })
        );

        const companyDemands = Object.fromEntries(
            this.player.companies.map((company) => {
                const demandState = {
                    demandA: Number(company.demandA || 0),
                    demandB: Number(company.demandB || 0),
                    demandMultiplier: Number(company.demandMultiplier || 1)
                };

                return [company.id, {
                    ...demandState,
                    formula: this.formatDemandFormula(demandState)
                }];
            })
        );

        return {
            companyPrices,
            assetPrices,
            companyCosts,
            companyDemands,
            interestRate: this.economy.interestRate
        };
    }

    applyCompanyValueShock(shock) {
        const effects = shock.companyValueEffects;
        if (!effects) return;

        [...this.player.companies, ...this.availableCompanies].forEach((company) => {
            const multiplier = effects[company.id];
            if (!multiplier) return;
            company.basePrice = Math.max(50000, Math.round(company.basePrice * multiplier));
        });
    }

    buildChangeNotifications(beforeState, afterState, newShock = null) {
        const companyChanges = Object.entries(afterState.companyPrices)
            .filter(([companyId, price]) => beforeState.companyPrices[companyId] !== undefined && beforeState.companyPrices[companyId] !== price)
            .map(([companyId, price]) => ({
                companyId,
                before: beforeState.companyPrices[companyId],
                after: price
            }));

        const companyCostChanges = Object.entries(afterState.companyCosts || {})
            .filter(([companyId, costState]) => {
                const beforeCost = beforeState.companyCosts?.[companyId];
                if (!beforeCost) return false;

                return beforeCost.costA !== costState.costA
                    || beforeCost.costB !== costState.costB
                    || beforeCost.costC !== costState.costC
                    || beforeCost.costMultiplier !== costState.costMultiplier;
            })
            .map(([companyId, costState]) => {
                const beforeCost = beforeState.companyCosts[companyId];
                return {
                    companyId,
                    before: beforeCost,
                    after: costState,
                    beforeFormula: beforeCost.formula,
                    afterFormula: costState.formula,
                    causedByNewShock: this.doesShockChangeCompanyCosts(newShock, companyId)
                };
            });

        const companyDemandChanges = Object.entries(afterState.companyDemands || {})
            .filter(([companyId, demandState]) => {
                const beforeDemand = beforeState.companyDemands?.[companyId];
                if (!beforeDemand) return false;

                return beforeDemand.demandA !== demandState.demandA
                    || beforeDemand.demandB !== demandState.demandB
                    || beforeDemand.demandMultiplier !== demandState.demandMultiplier;
            })
            .map(([companyId, demandState]) => {
                const beforeDemand = beforeState.companyDemands[companyId];
                return {
                    companyId,
                    before: beforeDemand,
                    after: demandState,
                    beforeFormula: beforeDemand.formula,
                    afterFormula: demandState.formula,
                    causedByNewShock: this.doesShockChangeCompanyDemand(newShock, companyId)
                };
            });

        const assetChanges = Object.entries(afterState.assetPrices)
            .filter(([asset, price]) => beforeState.assetPrices[asset] !== undefined && beforeState.assetPrices[asset] !== price)
            .map(([asset, price]) => ({
                asset,
                before: beforeState.assetPrices[asset],
                after: price
            }));

        return {
            companyChanges,
            companyCostChanges,
            companyDemandChanges,
            assetChanges,
            interestRateChanged: beforeState.interestRate !== afterState.interestRate
                ? {
                    before: beforeState.interestRate,
                    after: afterState.interestRate
                }
                : null
        };
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
        this.applyCompanyValueShock(shock);
        
        return shock;
    }
    
    getRandomShock() {
        if (!SHOCKS || SHOCKS.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * SHOCKS.length);
        return { ...SHOCKS[randomIndex] };
    }
    
    nextRound() {
        console.log(`=== Начало раунда ${this.currentRound} ===`);
        const upcomingRound = this.currentRound + 1;
        const beforeState = this.snapshotMarketState();
        this.economy.update();
        const loanReports = this.bank.update(this.player, this.economy.interestRate);
        this.stockMarket.update();
        this.player.companies.forEach(company => {
            company.updateShocks();
        });
        this.updateActiveShocks();

        let newShock = null;
        if (upcomingRound >= 2 && SHOCKS && SHOCKS.length > 0) {
            const shock = this.stockMarket.consumeInsiderShock(upcomingRound) || this.getRandomShock();
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
            const profit = report.capitalDelta ?? report.actualProfit ?? 0;
            totalProfit += profit;
            decisionReports.push(report);

            companyProfits.push({
                name: company.name,
                profit: profit,
                actualProfit: report.actualProfit ?? 0,
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
        
        const afterState = this.snapshotMarketState();
        const marketChanges = this.buildChangeNotifications(beforeState, afterState, newShock);
        this.previousRoundCompanyFunctions = Object.fromEntries(
            Object.entries(beforeState.companyCosts || {}).map(([companyId, costState]) => [
                companyId,
                {
                    demandFormula: beforeState.companyDemands?.[companyId]?.formula || null,
                    costFormula: costState?.formula || null
                }
            ])
        );
        this.currentRound++;
        
        return {
            round: this.currentRound - 1,
            totalProfit: totalProfit,
            newShock: newShock,
            marketChanges,
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
            activeShocks: this.activeShocks.filter(s => s.roundsRemaining > 0),
            previousRoundCompanyFunctions: this.previousRoundCompanyFunctions
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
