// js/models/Company.js
class Company {
    constructor(config) {
        this.id = config.id || `company_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        this.name = config.name || "Компания";
        this.icon = config.icon || "🏢";
        this.basePrice = config.basePrice || 100000;
        this.config = config;

        this.demandA = Number(config.demandA || 100);
        this.demandB = Number(config.demandB || 1);

        this.originalCostA = Number(config.costA || 0);
        this.originalCostB = Number(config.costB || 0);
        this.originalCostC = Number(config.costC || 0);

        this.costA = this.originalCostA;
        this.costB = this.originalCostB;
        this.costC = this.originalCostC;

        this.competitorCostA = Number(config.competitorCostA || 0);
        this.competitorCostB = Number(config.competitorCostB || 0);
        this.competitorCostC = Number(config.competitorCostC || 0);

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

    _tc(Q) {
        return (this.costA * Q * Q + this.costB * Q + this.costC) * this.costMultiplier;
    }

    _mc(Q) {
        return 2 * this.costA * Q + this.costB;
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

    randomizeCosts() {
        const factor = () => 0.85 + Math.random() * 0.3;
        this.costA = this._round(this.originalCostA * factor());
        this.costB = this._round(this.originalCostB * factor());
        this.costC = this._round(this.originalCostC * factor());
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

    _solvePerfectCompetition() {
        const a = this.demandA * this.demandMultiplier;
        const b = this.demandB;
        const denominator = b + 2 * this.costA;
        const Q = denominator > 0 ? Math.max(0, (a - this.costB) / denominator) : 0;
        const P = this._price(Q);
        const tc = this._tc(Q);
        const rev = P * Q;

        return this._normalizeOutcome({
            Q,
            P,
            tc,
            rev,
            profit: 0,
            MC: this._mc(Q),
            condition: `P = MC: ${a} - ${b}Q = ${this.costA !== 0 ? `${2 * this.costA}Q + ${this.costB}` : this.costB}`
        });
    }

    _solveMonopoly() {
        const a = this.demandA * this.demandMultiplier;
        const b = this.demandB;
        const denominator = 2 * b + 2 * this.costA;
        const Q = denominator > 0 ? Math.max(0, (a - this.costB) / denominator) : 0;
        const P = this._price(Q);
        const MR = a - 2 * b * Q;
        const MC = this._mc(Q);
        const tc = this._tc(Q);
        const rev = P * Q;

        return this._normalizeOutcome({
            Q,
            P,
            tc,
            rev,
            profit: rev - tc,
            MR,
            MC,
            condition: `MR = MC: ${a} - ${2 * b}Q = ${this.costA !== 0 ? `${2 * this.costA}Q + ${this.costB}` : this.costB}`
        });
    }

    _solveCournot() {
        const a = this.demandA * this.demandMultiplier;
        const b = this.demandB;
        const d1 = this._reactionDenominator(this.costA);
        const d2 = this._reactionDenominator(this.competitorCostA);

        const numeratorQ1 = d2 * (a - this.costB) - b * (a - this.competitorCostB);
        const denominatorQ1 = d1 * d2 - b * b;
        const Q1 = denominatorQ1 !== 0 ? Math.max(0, numeratorQ1 / denominatorQ1) : 0;
        const Q2 = d2 !== 0 ? Math.max(0, (a - this.competitorCostB - b * Q1) / d2) : 0;
        const Qtotal = Q1 + Q2;
        const P = Math.max(0, a - b * Qtotal);
        const tc = this._tc(Q1);
        const rev = P * Q1;

        return this._normalizeOutcome({
            Q: Q1,
            Q2,
            P,
            Qtotal,
            tc,
            rev,
            profit: rev - tc,
            reaction1: `Q₁ = (${a} - ${this.costB} - ${b}Q₂) / ${d1}`,
            reaction2: `Q₂ = (${a} - ${this.competitorCostB} - ${b}Q₁) / ${d2}`
        });
    }

    _solveStackelbergLeader() {
        const a = this.demandA * this.demandMultiplier;
        const b = this.demandB;
        const followerDenominator = this._reactionDenominator(this.competitorCostA);
        const followerReaction = (Q1) => {
            if (followerDenominator <= 0) return 0;
            return Math.max(0, (a - this.competitorCostB - b * Q1) / followerDenominator);
        };

        const maxQ = Math.max(1, Math.ceil(a / Math.max(b, 1)));
        let best = null;

        for (let step = 0; step <= maxQ * 20; step++) {
            const Q1 = step / 2;
            const Q2 = followerReaction(Q1);
            const Qtotal = Q1 + Q2;
            const P = Math.max(0, a - b * Qtotal);
            const tc = this._tc(Q1);
            const rev = P * Q1;
            const profit = rev - tc;

            if (!best || profit > best.profit) {
                best = { Q1, Q2, Qtotal, P, tc, rev, profit };
            }
        }

        return this._normalizeOutcome({
            Q: best.Q1,
            Q2: best.Q2,
            P: best.P,
            Qtotal: best.Qtotal,
            tc: best.tc,
            rev: best.rev,
            profit: best.profit,
            reactionFollower: `Q₂ = max(0, (${a} - ${this.competitorCostB} - ${b}Q₁) / ${followerDenominator})`
        });
    }

    getTheoreticalOutcome() {
        switch (this.marketStructure) {
            case "monopoly":
                return { ...this._solveMonopoly(), marketStructure: this.marketStructure };
            case "cournot":
                return { ...this._solveCournot(), marketStructure: this.marketStructure };
            case "stackelberg_leader":
            case "stackelberg_follower":
                return { ...this._solveStackelbergLeader(), marketStructure: this.marketStructure };
            case "perfect_competition":
            default:
                return { ...this._solvePerfectCompetition(), marketStructure: this.marketStructure };
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
        this._recalculate();
        const effectiveTax = (taxRate * this.taxMultiplier) / 100;
        const baseProfit = this.marketStructure === "perfect_competition" ? 0 : this.profit;
        this.profit = this._round(baseProfit * (1 - effectiveTax));
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
        const companyEffects = shock.effects?.[this.config.id];
        const allEffects = shock.effects?.all;
        const effects = [allEffects, companyEffects].filter(Boolean);

        effects.forEach((effect) => {
            if (effect.demand) this.demandMultiplier *= effect.demand;
            if (effect.cost) this.costMultiplier *= effect.cost;
            if (effect.tax) this.taxMultiplier *= effect.tax;
        });

        this.activeShocks.push({ shock, roundsRemaining: shock.duration || 1 });
        this._recalculate();
    }

    updateShocks() {
        this.activeShocks = this.activeShocks.filter((item) => {
            item.roundsRemaining -= 1;
            return item.roundsRemaining > 0;
        });

        if (this.activeShocks.length === 0) {
            this.demandMultiplier = 1;
            this.costMultiplier = 1;
            this.taxMultiplier = 1;
        }

        this._recalculate();
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
        const tolerance = 0.25;
        const result = {
            isComplete: true,
            expected,
            priceCorrect: Math.abs(price - expected.P) <= tolerance,
            quantityCorrect: Math.abs(quantity - expected.Q) <= tolerance,
            profitCorrect: Math.abs(profit - expected.profit) <= tolerance
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

        const expected = this.getTheoreticalOutcome();
        const effectiveTax = (taxRate * this.taxMultiplier) / 100;
        const actualProfitBeforeTax = expected.profit;
        const actualProfit = this._round(actualProfitBeforeTax * (1 - effectiveTax));
        const tolerance = 0.25;
        const isCorrect =
            Math.abs(submission.price - expected.P) <= tolerance &&
            Math.abs(submission.quantity - expected.Q) <= tolerance &&
            Math.abs(submission.expectedProfit - actualProfit) <= tolerance;

        this.production = expected.Q;
        this.productPrice = expected.P;
        this.competitorProduction = expected.Q2 || 0;
        this.totalCost = expected.tc;
        this.revenue = expected.rev;
        this.profit = this.marketStructure === "perfect_competition" ? 0 : actualProfit;
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
