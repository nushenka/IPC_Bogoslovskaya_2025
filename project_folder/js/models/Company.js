// js/models/Company.js
class Company {
    constructor(config) {
        this.id = config.id || `company_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        this.name = config.name || "Компания";
        this.icon = config.icon || "🏢";
        this.basePrice = config.basePrice || 100000;
        this.config = config;

        this.baseDemandA = Number(config.demandA || 100);
        this.baseDemandB = Number(config.demandB || 1);
        this.demandA = this.baseDemandA;
        this.demandB = this.baseDemandB;

        this.originalCostA = Number(config.costA || 0);
        this.originalCostB = Number(config.costB || 0);
        this.originalCostC = Number(config.costC || 0);

        this.baseCostA = this.originalCostA;
        this.baseCostB = this.originalCostB;
        this.baseCostC = this.originalCostC;
        this.costA = this.baseCostA;
        this.costB = this.baseCostB;
        this.costC = this.baseCostC;

        this.originalCompetitorCostA = Number(config.competitorCostA || 0);
        this.originalCompetitorCostB = Number(config.competitorCostB || 0);
        this.originalCompetitorCostC = Number(config.competitorCostC || 0);
        this.baseCompetitorCostA = this.originalCompetitorCostA;
        this.baseCompetitorCostB = this.originalCompetitorCostB;
        this.baseCompetitorCostC = this.originalCompetitorCostC;
        this.competitorCostA = this.baseCompetitorCostA;
        this.competitorCostB = this.baseCompetitorCostB;
        this.competitorCostC = this.baseCompetitorCostC;

        this.marketStructure = config.marketStructure || config.marketType || "perfect_competition";
        this.competitors = config.competitors || 0;
        this.description = config.description || "";

        this.productPrice = 0;
        this.production = 0;
        this.competitorProduction = 0;
        this.profit = 0;
        this.revenue = 0;
        this.totalCost = 0;
        this.demand = 0;

        this.activeShocks = [];
        this.demandMultiplier = 1;
        this.costMultiplier = 1;
        this.taxMultiplier = 1;
        this.ownedByPlayer = false;

        this.playerDecision = {
            price: "",
            quantity: "",
            expectedProfit: "",
            lastCheck: null,
            pendingSubmission: null,
            lastResolved: null
        };

        this._recalculate();
    }

    _round(value) {
        return Math.round(value * 100) / 100;
    }

    _getUnitTax(taxRate = 0) {
        return taxRate * this.taxMultiplier;
    }

    _tc(Q, taxRate = 0) {
        const baseCost = (this.costA * Q * Q + this.costB * Q + this.costC) * this.costMultiplier;
        return baseCost + this._getUnitTax(taxRate) * Q;
    }

    _mc(Q, taxRate = 0) {
        return (2 * this.costA * Q + this.costB) * this.costMultiplier + this._getUnitTax(taxRate);
    }

    _price(Q) {
        const a = this.demandA * this.demandMultiplier;
        return Math.max(0, a - this.demandB * Q);
    }

    _reactionDenominator(costA) {
        return 2 * this.demandB + 2 * costA;
    }

    _normalizeOutcome(result) {
        return {
            ...result,
            Q: this._round(result.Q),
            P: this._round(result.P),
            tc: this._round(result.tc),
            rev: this._round(result.rev),
            profit: this._round(result.profit),
            MR: result.MR === undefined ? undefined : this._round(result.MR),
            MC: result.MC === undefined ? undefined : this._round(result.MC),
            Q2: result.Q2 === undefined ? undefined : this._round(result.Q2),
            Qtotal: result.Qtotal === undefined ? undefined : this._round(result.Qtotal)
        };
    }

    _applyShutdownRule(result, taxRate = 0) {
        if (result.profit < 0) {
            const shutdownPrice = this._round(this.demandA * this.demandMultiplier);
            return this._normalizeOutcome({
                ...result,
                Q: 0,
                P: shutdownPrice,
                tc: 0,
                rev: 0,
                profit: 0,
                MC: this._mc(0, taxRate),
                Q2: result.Q2,
                Qtotal: result.Q2 !== undefined ? this._round(result.Q2) : 0
            });
        }

        return this._normalizeOutcome(result);
    }

    _matchesStudentValue(studentValue, actualValue, baseTolerance = 1) {
        const roundedActual = Math.round(actualValue);
        return Math.abs(studentValue - actualValue) <= baseTolerance
            || Math.abs(studentValue - roundedActual) <= baseTolerance;
    }

    randomizeCosts() {
        if (this.marketStructure === "perfect_competition") {
            this.recalculateShockEffects();
            this._recalculate();
            return;
        }

        const vary = (value, minValue = 0) => {
            const delta = Math.floor(Math.random() * 3) - 1;
            return Math.max(minValue, Math.round(value + delta));
        };
        this.baseCostA = vary(this.originalCostA, 0);
        this.baseCostB = vary(this.originalCostB, 1);
        this.baseCostC = vary(this.originalCostC, 0);
        this.recalculateShockEffects();
        this._recalculate();
    }

    getCostFormula() {
        if (!this.ownedByPlayer) return "TC = ? (купите компанию)";
        if (this.costA !== 0) {
            return `TC = ${this.costA}Q² + ${this.costB}Q + ${this.costC}`;
        }
        if (this.costC !== 0) {
            return `TC = ${this.costB}Q + ${this.costC}`;
        }
        return `TC = ${this.costB}Q`;
    }

    getDemandFormula() {
        return `P = ${this.demandA} - ${this.demandB}Q`;
    }

    getCompetitorCostFormula() {
        if (this.competitorCostA !== 0) {
            return `TC = ${this.competitorCostA}Q² + ${this.competitorCostB}Q + ${this.competitorCostC}`;
        }
        if (this.competitorCostC !== 0) {
            return `TC = ${this.competitorCostB}Q + ${this.competitorCostC}`;
        }
        return `TC = ${this.competitorCostB}Q`;
    }

    _solvePerfectCompetition(taxRate = 0) {
        const a = this.demandA * this.demandMultiplier;
        const b = this.demandB;
        const unitTax = this._getUnitTax(taxRate);
        const denominator = b + 2 * this.costA * this.costMultiplier;
        const numerator = a - this.costB * this.costMultiplier - unitTax;
        const Q = denominator > 0 ? Math.max(0, numerator / denominator) : 0;
        const P = this._price(Q);
        const tc = this._tc(Q, taxRate);
        const rev = P * Q;

        return this._applyShutdownRule({
            Q,
            P,
            tc,
            rev,
            profit: rev - tc,
            MC: this._mc(Q, taxRate),
            condition: `P = MC`
        }, taxRate);
    }

    _solveMonopoly(taxRate = 0) {
        const a = this.demandA * this.demandMultiplier;
        const b = this.demandB;
        const unitTax = this._getUnitTax(taxRate);
        const denominator = 2 * b + 2 * this.costA * this.costMultiplier;
        const numerator = a - this.costB * this.costMultiplier - unitTax;
        const Q = denominator > 0 ? Math.max(0, numerator / denominator) : 0;
        const P = this._price(Q);
        const MR = a - 2 * b * Q;
        const MC = this._mc(Q, taxRate);
        const tc = this._tc(Q, taxRate);
        const rev = P * Q;

        return this._applyShutdownRule({
            Q,
            P,
            tc,
            rev,
            profit: rev - tc,
            MR,
            MC,
            condition: `MR = MC`
        }, taxRate);
    }

    _solveCournot(taxRate = 0) {
        const a = this.demandA * this.demandMultiplier;
        const b = this.demandB;
        const unitTax = this._getUnitTax(taxRate);
        const d1 = 2 * b + 2 * this.costA * this.costMultiplier;
        const d2 = 2 * b + 2 * this.competitorCostA;

        const numeratorQ1 = d2 * (a - this.costB * this.costMultiplier - unitTax) - b * (a - this.competitorCostB - unitTax);
        const denominatorQ1 = d1 * d2 - b * b;
        const Q1 = denominatorQ1 !== 0 ? Math.max(0, numeratorQ1 / denominatorQ1) : 0;
        const Q2 = d2 !== 0 ? Math.max(0, (a - this.competitorCostB - unitTax - b * Q1) / d2) : 0;
        const Qtotal = Q1 + Q2;
        const P = Math.max(0, a - b * Qtotal);
        const tc = this._tc(Q1, taxRate);
        const rev = P * Q1;

        return this._applyShutdownRule({
            Q: Q1,
            Q2,
            P,
            Qtotal,
            tc,
            rev,
            profit: rev - tc,
            reaction1: `Q₁ = (${this._round(a)} - ${this._round(this.costB * this.costMultiplier + unitTax)} - ${b}Q₂) / ${this._round(d1)}`,
            reaction2: `Q₂ = (${this._round(a)} - ${this._round(this.competitorCostB + unitTax)} - ${b}Q₁) / ${this._round(d2)}`
        }, taxRate);
    }

    _solveStackelbergLeader(taxRate = 0) {
        const a = this.demandA * this.demandMultiplier;
        const b = this.demandB;
        const unitTax = this._getUnitTax(taxRate);
        const followerDenominator = 2 * b + 2 * this.competitorCostA;
        const followerReaction = (Q1) => {
            if (followerDenominator <= 0) return 0;
            return Math.max(0, (a - this.competitorCostB - unitTax - b * Q1) / followerDenominator);
        };

        const maxQ = Math.max(1, Math.ceil(a / Math.max(b, 1)));
        let best = null;

        for (let step = 0; step <= maxQ * 20; step++) {
            const Q1 = step / 2;
            const Q2 = followerReaction(Q1);
            const Qtotal = Q1 + Q2;
            const P = Math.max(0, a - b * Qtotal);
            const tc = this._tc(Q1, taxRate);
            const rev = P * Q1;
            const profit = rev - tc;

            if (!best || profit > best.profit) {
                best = { Q1, Q2, Qtotal, P, tc, rev, profit };
            }
        }

        return this._applyShutdownRule({
            Q: best.Q1,
            Q2: best.Q2,
            P: best.P,
            Qtotal: best.Qtotal,
            tc: best.tc,
            rev: best.rev,
            profit: best.profit,
            reactionFollower: `Q₂ = max(0, (${this._round(a)} - ${this._round(this.competitorCostB + unitTax)} - ${b}Q₁) / ${this._round(followerDenominator)})`
        }, taxRate);
    }

    getTheoreticalOutcome(taxRate = 0) {
        switch (this.marketStructure) {
            case "monopoly":
                return { ...this._solveMonopoly(taxRate), marketStructure: this.marketStructure };
            case "cournot":
                return { ...this._solveCournot(taxRate), marketStructure: this.marketStructure };
            case "stackelberg_leader":
            case "stackelberg_follower":
                return { ...this._solveStackelbergLeader(taxRate), marketStructure: this.marketStructure };
            case "perfect_competition":
            default:
                return { ...this._solvePerfectCompetition(taxRate), marketStructure: this.marketStructure };
        }
    }

    _recalculate() {
        const result = this.getTheoreticalOutcome();
        this.production = result.Q;
        this.productPrice = result.P;
        this.competitorProduction = result.Q2 || 0;
        this.totalCost = result.tc;
        this.revenue = result.rev;
        this.profit = result.profit;
        this.demand = result.Q;
        this._lastResult = result;
    }

    calculateProfit(taxRate = 20) {
        const result = this.getTheoreticalOutcome(taxRate);
        this.production = result.Q;
        this.productPrice = result.P;
        this.competitorProduction = result.Q2 || 0;
        this.totalCost = result.tc;
        this.revenue = result.rev;
        this.profit = result.profit;
        this.demand = result.Q;
        this._lastResult = result;
        return this.profit;
    }

    getChartData() {
        const a = this.demandA * this.demandMultiplier;
        const points = 30;
        const maxQ = Math.max(1, Math.round(a / Math.max(this.demandB, 1)));
        const demand = [];
        const mc = [];
        const mr = [];
        const tc = [];

        for (let i = 0; i <= points; i++) {
            const Q = this._round((maxQ / points) * i);
            demand.push({ Q, P: this._round(this._price(Q)) });
            mc.push({ Q, MC: this._round(this._mc(Q)) });
            mr.push({ Q, MR: this._round(a - 2 * this.demandB * Q) });
            tc.push({ Q, TC: this._round(this._tc(Q)) });
        }

        return {
            demand,
            mc,
            mr,
            tc,
            optimalQ: this.production,
            optimalP: this.productPrice,
            marketStructure: this.marketStructure
        };
    }

    applyShock(shock) {
        this.activeShocks.push({ shock, roundsRemaining: shock.duration || 1 });
        this.recalculateShockEffects();
        this._recalculate();
    }

    updateShocks() {
        this.activeShocks = this.activeShocks.filter((item) => {
            item.roundsRemaining -= 1;
            return item.roundsRemaining > 0;
        });
        this.recalculateShockEffects();
        this._recalculate();
    }

    recalculateShockEffects() {
        this.demandMultiplier = 1;
        this.costMultiplier = 1;
        this.taxMultiplier = 1;

        this.demandA = this.baseDemandA;
        this.demandB = this.baseDemandB;
        this.costA = this.baseCostA;
        this.costB = this.baseCostB;
        this.costC = this.baseCostC;
        this.competitorCostA = this.baseCompetitorCostA;
        this.competitorCostB = this.baseCompetitorCostB;
        this.competitorCostC = this.baseCompetitorCostC;

        this.activeShocks.forEach(({ shock }) => {
            const appliesToCompany = shock.target === "all" || shock.target === this.config.id;
            if (appliesToCompany && shock.changes) {
                Object.entries(shock.changes).forEach(([key, multiplier]) => {
                    if (typeof this[key] === "number") {
                        this[key] = this._round(this[key] * multiplier);
                    }
                });
            }

            const companyEffects = shock.effects?.[this.config.id];
            const allEffects = shock.effects?.all;
            const effects = [allEffects, companyEffects].filter(Boolean);

            effects.forEach((effect) => {
                if (effect.demand) this.demandMultiplier *= effect.demand;
                if (effect.cost) this.costMultiplier *= effect.cost;
                if (effect.tax) this.taxMultiplier *= effect.tax;
            });
        });
    }

    getMarketStructureName() {
        const names = {
            monopoly: "Монополия",
            perfect_competition: "Совершенная конкуренция",
            cournot: "Олигополия Курно",
            stackelberg_leader: "Олигополия Штакельберга",
            stackelberg_follower: "Олигополия Штакельберга"
        };
        return names[this.marketStructure] || this.marketStructure;
    }

    setPrice(newPrice) {
        this.playerDecision.price = newPrice === "" ? "" : this._round(Number(newPrice));
        return true;
    }

    setProduction(newProduction) {
        this.playerDecision.quantity = newProduction === "" ? "" : this._round(Math.max(0, Number(newProduction)));
        return true;
    }

    setExpectedProfit(value) {
        this.playerDecision.expectedProfit = value === "" ? "" : this._round(Number(value));
        return true;
    }

    hasCompleteDecision() {
        return ![this.playerDecision.price, this.playerDecision.quantity, this.playerDecision.expectedProfit]
            .some((value) => value === "" || Number.isNaN(Number(value)));
    }

    submitDecision(round) {
        if (!this.hasCompleteDecision()) {
            return { success: false, message: "Введите цену, количество и прибыль." };
        }

        this.playerDecision.pendingSubmission = {
            price: Number(this.playerDecision.price),
            quantity: Number(this.playerDecision.quantity),
            expectedProfit: Number(this.playerDecision.expectedProfit),
            round
        };

        return { success: true };
    }

    evaluatePlayerDecision() {
        const price = Number(this.playerDecision.price);
        const quantity = Number(this.playerDecision.quantity);
        const profit = Number(this.playerDecision.expectedProfit);

        if ([price, quantity, profit].some((value) => Number.isNaN(value))) {
            return { isComplete: false, message: "Введите цену, количество и прибыль." };
        }

        const expected = this.getTheoreticalOutcome();
        const result = {
            isComplete: true,
            expected,
            priceCorrect: this._matchesStudentValue(price, expected.P, 1),
            quantityCorrect: this._matchesStudentValue(quantity, expected.Q, 1),
            profitCorrect: this._matchesStudentValue(profit, expected.profit, 2)
        };

        result.isCorrect = result.priceCorrect && result.quantityCorrect && result.profitCorrect;
        result.actualLoss = expected.profit < 0 ? Math.abs(expected.profit) : 0;
        this.playerDecision.lastCheck = result;
        return result;
    }

    resolveRoundDecision(taxRate, round) {
        const submission = this.playerDecision.pendingSubmission;
        if (!submission) {
            this.profit = 0;
            this.revenue = 0;
            this.totalCost = 0;
            return {
                submitted: false,
                round,
                companyId: this.id,
                companyName: this.name,
                actualProfit: 0
            };
        }

        const expected = this.getTheoreticalOutcome(taxRate);
        const actualProfit = expected.profit;
        const isCorrect =
            this._matchesStudentValue(submission.price, expected.P, 1) &&
            this._matchesStudentValue(submission.quantity, expected.Q, 1) &&
            this._matchesStudentValue(submission.expectedProfit, actualProfit, 2);

        this.production = expected.Q;
        this.productPrice = expected.P;
        this.competitorProduction = expected.Q2 || 0;
        this.totalCost = expected.tc;
        this.revenue = expected.rev;
        this.profit = actualProfit;
        this.demand = expected.Q;

        const report = {
            submitted: true,
            round,
            companyId: this.id,
            companyName: this.name,
            isCorrect,
            actualProfit: this.profit,
            playerProfit: submission.expectedProfit,
            playerPrice: submission.price,
            playerQuantity: submission.quantity
        };

        this.playerDecision.lastResolved = report;
        this.playerDecision.lastCheck = { isCorrect };
        this.playerDecision.pendingSubmission = null;
        this.playerDecision.price = "";
        this.playerDecision.quantity = "";
        this.playerDecision.expectedProfit = "";

        return report;
    }

    getPlayerDecision() {
        return { ...this.playerDecision };
    }

    getDetailedInfo() {
        return {
            id: this.id,
            name: this.name,
            icon: this.icon,
            type: this.marketStructure,
            description: this.description,
            demandFormula: this.getDemandFormula(),
            costFormula: this.getCostFormula(),
            competitorCostFormula: this.getCompetitorCostFormula(),
            marketStructure: this.getMarketStructureName(),
            competitors: this.competitors,
            activeShocks: this.activeShocks.map((item) => item.shock.name),
            playerDecision: this.getPlayerDecision(),
            extraInfo: this.getTheoreticalOutcome()
        };
    }
}

export { Company };

if (typeof window !== "undefined") {
    window.Company = Company;
}
