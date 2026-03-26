// js/models/Company.js
class Company {
    constructor(config) {
        this.id = config.id || ('company_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
        this.name = config.name || 'Компания';
        this.icon = config.icon || '🏢';
        this.basePrice = config.basePrice || 100000;
        this.config = config;

        // Параметры спроса (целые)
        this.demandA = Math.round(config.demandA || 100);
        this.demandB = Math.round(config.demandB || 1);

        // Оригинальные коэффициенты издержек (целые)
        this.originalCostA = Math.round(config.costA || 0);
        this.originalCostB = Math.round(config.costB || 10);
        this.originalCostC = Math.round(config.costC || 0);

        // Текущие коэффициенты
        this.costA = this.originalCostA;
        this.costB = this.originalCostB;
        this.costC = this.originalCostC;

        // Коэффициенты конкурентов (для Курно / Штакельберга)
        this.competitorCostA = Math.round(config.competitorCostA || 0);
        this.competitorCostB = Math.round(config.competitorCostB || this.costB);
        this.competitorCostC = Math.round(config.competitorCostC || 0);

        // Рыночная структура
        this.marketStructure = config.marketType || 'perfect_competition';
        this.competitors = config.competitors || 0;

        this.description = config.description || '';

        // Текущие значения (будут пересчитаны)
        this.productPrice = 0;
        this.production = 0;
        this.competitorProduction = 0;   // Q конкурента (для олигополий)
        this.profit = 0;
        this.revenue = 0;
        this.totalCost = 0;
        this.demand = 0;

        // Шоки
        this.activeShocks = [];
        this.demandMultiplier = 1.0;
        this.costMultiplier = 1.0;
        this.taxMultiplier = 1.0;

        this.ownedByPlayer = false;

        // Начальный расчёт
        this._recalculate();

        console.log(`Создана компания: ${this.name} (${this.marketStructure})`);
    }

    // ─── Рандомизация при покупке (±20%, только целые) ─────────────────────────
    randomizeCosts() {
        const r = () => Math.round(0.85 + Math.random() * 0.3, 2); // 0.85..1.15
        this.costA = Math.max(0, Math.round(this.originalCostA * r()));
        this.costB = Math.max(1, Math.round(this.originalCostB * r()));
        this.costC = Math.max(0, Math.round(this.originalCostC * r()));
        this._recalculate();
        console.log(`Коэффициенты для ${this.name}: TC = ${this.costA}Q² + ${this.costB}Q + ${this.costC}`);
        console.log(`Спрос: P = ${this.demandA} - ${this.demandB}Q`);
    }

    // ─── Формулы ────────────────────────────────────────────────────────────────
    getCostFormula() {
        if (!this.ownedByPlayer) return 'TC = ? (купите компанию)';
        if (this.costA > 0) {
            return `TC = ${this.costA}Q² + ${this.costB}Q + ${this.costC}`;
        }
        return this.costC > 0
            ? `TC = ${this.costB}Q + ${this.costC}`
            : `TC = ${this.costB}Q`;
    }

    getDemandFormula() {
        return `P = ${this.demandA} - ${this.demandB}Q`;
    }

    getCompetitorCostFormula() {
        if (this.competitorCostA > 0) {
            return `TC = ${this.competitorCostA}Q² + ${this.competitorCostB}Q + ${this.competitorCostC}`;
        }
        return this.competitorCostC > 0
            ? `TC = ${this.competitorCostB}Q + ${this.competitorCostC}`
            : `TC = ${this.competitorCostB}Q`;
    }

    // ─── Вспомогательные расчёты ────────────────────────────────────────────────
    _tc(Q) {
        return this.costA * Q * Q + this.costB * Q + this.costC;
    }
    _mc(Q) {
        return 2 * this.costA * Q + this.costB;
    }
    // Обратный спрос с учётом шока
    _price(Q) {
        const a = this.demandA * this.demandMultiplier;
        return Math.max(0, a - this.demandB * Q);
    }

    // ─── Совершенная конкуренция: P = MC ────────────────────────────────────────
    // P = a - b*Q (рыночный спрос), MC = 2c*Q + d
    // a - b*Q = 2c*Q + d  =>  Q = (a - d) / (b + 2c)
    // При линейных издержках (c=0): Q = (a - d) / b
    // Прибыль → 0 в LR, но в SR может быть ненулевой
    _solvePerfectCompetition() {
        const a = Math.round(this.demandA * this.demandMultiplier);
        const b = this.demandB;
        const cA = this.costA;
        const cB = this.costB;
        const cC = this.costC;

        // P = MC: a - b*Q = 2*cA*Q + cB
        const denom = b + 2 * cA;
        let Q = denom > 0 ? (a - cB) / denom : 0;
        Q = Math.max(0, Q);

        const P = this._price(Q);
        const tc = this._tc(Q) * this.costMultiplier;
        const rev = P * Q;
        const profit = rev - tc;

        return { Q: Math.round(Q), P: Math.round(P), tc: Math.round(tc), rev: Math.round(rev), profit: Math.round(profit) };
    }

    // ─── Монополия: MR = MC ─────────────────────────────────────────────────────
    // TR = P*Q = (a - b*Q)*Q = a*Q - b*Q²
    // MR = a - 2b*Q
    // MC = 2*cA*Q + cB
    // MR = MC: a - 2b*Q = 2*cA*Q + cB  => Q = (a - cB) / (2b + 2*cA)
    _solveMonopoly() {
        const a = Math.round(this.demandA * this.demandMultiplier);
        const b = this.demandB;
        const cA = this.costA;
        const cB = this.costB;
        const cC = this.costC;

        const denom = 2 * b + 2 * cA;
        let Q = denom > 0 ? (a - cB) / denom : 0;
        Q = Math.max(0, Q);

        const P = this._price(Q);
        const MR = a - 2 * b * Q;
        const MC = this._mc(Q);
        const tc = this._tc(Q) * this.costMultiplier;
        const rev = P * Q;
        const profit = rev - tc;

        return {
            Q: Math.round(Q), P: Math.round(P),
            MR: Math.round(MR), MC: Math.round(MC),
            tc: Math.round(tc), rev: Math.round(rev), profit: Math.round(profit)
        };
    }

    // ─── Курно: Nash-равновесие ─────────────────────────────────────────────────
    // P = a - b*(Q1+Q2)
    // Фирма 1: pi1 = (a - b*(Q1+Q2))*Q1 - TC1
    // dpi1/dQ1 = a - b*Q2 - 2b*Q1 - MC1 = 0
    // Если TC1 = cA1*Q1² + cB1*Q1: MC1 = 2*cA1*Q1 + cB1
    // => a - b*Q2 - 2b*Q1 - 2*cA1*Q1 - cB1 = 0
    // => Q1 = (a - cB1 - b*Q2) / (2b + 2*cA1)   ... линия реакции 1
    // Аналогично Q2 = (a - cB2 - b*Q1) / (2b + 2*cA2)
    // Решаем систему 2×2
    _solveCournot() {
        const a = Math.round(this.demandA * this.demandMultiplier);
        const b = this.demandB;

        const cA1 = this.costA, cB1 = this.costB;
        const cA2 = this.competitorCostA, cB2 = this.competitorCostB;

        // Q1 = (a - cB1 - b*Q2) / (2b + 2*cA1)
        // Q2 = (a - cB2 - b*Q1) / (2b + 2*cA2)
        // Подставляем Q2 в Q1:
        const k1 = 2 * b + 2 * cA1;  // знаменатель реакции 1
        const k2 = 2 * b + 2 * cA2;  // знаменатель реакции 2

        // Q1 = (a - cB1)/k1 - b/k1 * Q2
        // Q2 = (a - cB2)/k2 - b/k2 * Q1
        // Q1 = (a-cB1)/k1 - (b/k1)*[(a-cB2)/k2 - (b/k2)*Q1]
        // Q1*(1 - b²/(k1*k2)) = (a-cB1)/k1 - b*(a-cB2)/(k1*k2)
        const alpha1 = (a - cB1) / k1;
        const alpha2 = (a - cB2) / k2;
        const ratio = b * b / (k1 * k2);

        let Q1 = (alpha1 - b * alpha2 / k2) / (1 - ratio);
        let Q2 = (alpha2 - b * Q1 / k2);      // уже точная после Q1
        // Пересчитываем Q2 точно из линии реакции
        Q2 = (a - cB2 - b * Q1) / k2;

        Q1 = Math.max(0, Q1);
        Q2 = Math.max(0, Q2);

        const Qtotal = Q1 + Q2;
        const P = Math.max(0, a - b * Qtotal);
        const tc1 = this._tc(Q1) * this.costMultiplier;
        const rev1 = P * Q1;
        const profit1 = rev1 - tc1;

        // Реакция-строки для отображения
        const reaction1 = `Q₁ = (${a} - ${cB1} - ${b}·Q₂) / ${k1}`;
        const reaction2 = `Q₂ = (${a} - ${cB2} - ${b}·Q₁) / ${k2}`;

        return {
            Q: Math.round(Q1), Q2: Math.round(Q2),
            P: Math.round(P), Qtotal: Math.round(Qtotal),
            tc: Math.round(tc1), rev: Math.round(rev1), profit: Math.round(profit1),
            reaction1, reaction2
        };
    }

    // ─── Штакельберг (последователь) ────────────────────────────────────────────
    // Лидер (конкурент): TC_L = cBL*QL  (линейные или квадратичные — задаём через config)
    // Последователь (игрок): TC_F = cA*QF² + cB*QF
    // P = a - b*(QL+QF)
    //
    // Шаг 1. Линия реакции последователя:
    //   dpi_F/dQF = a - b*QL - 2b*QF - MC_F = 0
    //   QF* = (a - cBF - b*QL) / (2b + 2*cAF)
    //
    // Шаг 2. Лидер подставляет QF*(QL) в свою прибыль и максимизирует:
    //   pi_L = (a - b*(QL + QF*(QL)))*QL - cBL*QL
    //   Подставляем QF*:
    //   QL* = (a - cBL - b*(a-cBF)/(2b+2cAF)) * (1/(2b - b²/(2b+2cAF) + 0))
    //   Упрощение для линейных издержек лидера (cAL=0, MCL=cBL):
    //   pi_L = [a - b*QL - b*(a-cBF-b*QL)/(2b+2cAF)]*QL - cBL*QL  => max по QL
    _solveStackelberg() {
        const a = Math.round(this.demandA * this.demandMultiplier);
        const b = this.demandB;

        // Последователь (игрок)
        const cAF = this.costA, cBF = this.costB;
        // Лидер (конкурент) — упрощаем до линейных
        const cBL = this.competitorCostB;

        const kF = 2 * b + 2 * cAF;   // знаменатель реакции последователя

        // QF*(QL) = (a - cBF - b*QL) / kF
        // pi_L = (a - b*QL - b*QF*(QL))*QL - cBL*QL
        //       = (a - b*QL - b*(a-cBF-b*QL)/kF)*QL - cBL*QL
        // Раскроем:
        // pi_L = [a - b*QL - b*(a-cBF)/kF + b²*QL/kF]*QL - cBL*QL
        // pi_L = (a - b*(a-cBF)/kF - cBL)*QL - (b - b²/kF)*QL²
        const A_L = a - b * (a - cBF) / kF - cBL;
        const B_L = b - b * b / kF;

        let QL = B_L > 0 ? A_L / (2 * B_L) : 0;
        QL = Math.max(0, QL);

        let QF = (a - cBF - b * QL) / kF;
        QF = Math.max(0, QF);

        const Qtotal = QL + QF;
        const P = Math.max(0, a - b * Qtotal);
        const tcF = this._tc(QF) * this.costMultiplier;
        const revF = P * QF;
        const profitF = revF - tcF;

        const reactionFollower = `QF = (${a} - ${cBF} - ${b}·QL) / ${kF}`;

        return {
            Q: Math.round(QF), QL: Math.round(QL),
            P: Math.round(P), Qtotal: Math.round(Qtotal),
            tc: Math.round(tcF), rev: Math.round(revF), profit: Math.round(profitF),
            reactionFollower
        };
    }

    // ─── Пересчёт при любом изменении ───────────────────────────────────────────
    _recalculate() {
        let res;
        switch (this.marketStructure) {
            case 'perfect_competition':
                res = this._solvePerfectCompetition();
                break;
            case 'monopoly':
                res = this._solveMonopoly();
                break;
            case 'cournot':
                res = this._solveCournot();
                this.competitorProduction = res.Q2 || 0;
                break;
            case 'stackelberg_follower':
                res = this._solveStackelberg();
                this.competitorProduction = res.QL || 0;
                break;
            default:
                res = this._solvePerfectCompetition();
        }
        this.production    = res.Q;
        this.productPrice  = res.P;
        this.revenue       = res.rev;
        this.totalCost     = res.tc;
        this.profit        = res.profit;
        this.demand        = res.Q;
        this._lastResult   = res;
    }

    // ─── Основной метод расчёта прибыли (вызывается каждый раунд) ───────────────
    calculateProfit(taxRate = 20, inflationRate = 0) {
        // Инфляция увеличивает все издержки
        const inflation = 1 + inflationRate / 100;
        const savedCostA = this.costA;
        const savedCostB = this.costB;
        const savedCostC = this.costC;

        this.costA = Math.round(this.costA * inflation * this.costMultiplier);
        this.costB = Math.round(this.costB * inflation * this.costMultiplier);
        this.costC = Math.round(this.costC * inflation * this.costMultiplier);

        this._recalculate();

        this.costA = savedCostA;
        this.costB = savedCostB;
        this.costC = savedCostC;

        // Налог на прибыль
        const effectiveTax = taxRate * this.taxMultiplier / 100;
        const afterTax = Math.round(this.profit * (1 - effectiveTax));
        this.profit = afterTax;

        return this.profit;
    }

    // ─── Данные для графика ──────────────────────────────────────────────────────
    getChartData() {
        const a = Math.round(this.demandA * this.demandMultiplier);
        const b = this.demandB;
        const points = 30;
        const maxQ = Math.round(a / b); // Q при P=0

        const demand = [], mc = [], mr = [], tc = [];

        for (let i = 0; i <= points; i++) {
            const Q = Math.round((maxQ / points) * i);
            demand.push({ Q, P: Math.max(0, a - b * Q) });
            mc.push({ Q, MC: Math.round(this._mc(Q)) });
            mr.push({ Q, MR: Math.round(a - 2 * b * Q) });
            tc.push({ Q, TC: Math.round(this._tc(Q)) });
        }

        return {
            demand, mc, mr, tc,
            optimalQ: this.production,
            optimalP: this.productPrice,
            marketStructure: this.marketStructure
        };
    }

    // ─── Применить шок ───────────────────────────────────────────────────────────
    applyShock(shock) {
        if (shock.effects && shock.effects.all) {
            if (shock.effects.all.demand) this.demandMultiplier *= shock.effects.all.demand;
            if (shock.effects.all.cost)   this.costMultiplier   *= shock.effects.all.cost;
            if (shock.effects.all.tax)    this.taxMultiplier    *= shock.effects.all.tax;
        }
        if (shock.effects && shock.effects[this.config.id]) {
            const eff = shock.effects[this.config.id];
            if (eff.demand) this.demandMultiplier *= eff.demand;
            if (eff.cost)   this.costMultiplier   *= eff.cost;
            if (eff.tax)    this.taxMultiplier    *= eff.tax;
        }
        this.activeShocks.push({ shock, roundsRemaining: shock.duration || 1 });
        this._recalculate();
    }

    updateShocks() {
        this.activeShocks = this.activeShocks.filter(s => {
            s.roundsRemaining--;
            return s.roundsRemaining > 0;
        });
        if (this.activeShocks.length === 0) {
            this.demandMultiplier = 1.0;
            this.costMultiplier   = 1.0;
            this.taxMultiplier    = 1.0;
        }
        this._recalculate();
    }

    // ─── Дополнительные методы ───────────────────────────────────────────────────
    getMarketStructureName() {
        const names = {
            'monopoly':              'Монополия',
            'perfect_competition':   'Совершенная конкуренция',
            'cournot':               'Олигополия Курно',
            'stackelberg_follower':  'Олигополия Штакельберга',
            'monopolistic_competition': 'Монополистическая конкуренция'
        };
        return names[this.marketStructure] || this.marketStructure;
    }

    setPrice(newPrice) {
        // В совершенной конкуренции цена задаётся рынком
        if (this.marketStructure === 'perfect_competition') return false;
        // Для монополии/олигополии — просто пересчитываем через Q
        // (цена определяется из оптимального Q, не задаётся напрямую)
        return false; // цена всегда рассчитывается автоматически
    }

    setProduction(newProduction) {
        // Разрешаем ручное задание только для монополий/олигополий
        if (this.marketStructure === 'perfect_competition') return false;
        this.production = Math.max(0, Math.round(newProduction));
        // Пересчитываем цену и прибыль по заданному Q
        this.productPrice = this._price(this.production);
        this.totalCost    = Math.round(this._tc(this.production) * this.costMultiplier);
        this.revenue      = Math.round(this.productPrice * this.production);
        this.profit       = this.revenue - this.totalCost;
        return true;
    }

    getDetailedInfo() {
        const res = this._lastResult || {};
        return {
            id: this.id,
            name: this.name,
            icon: this.icon,
            type: this.marketStructure,
            description: this.description,
            demandFormula: this.getDemandFormula(),
            costFormula: this.getCostFormula(),
            competitorCostFormula: this.getCompetitorCostFormula(),
            productPrice: this.productPrice,
            production: this.production,
            competitorProduction: this.competitorProduction,
            demand: this.demand,
            revenue: this.revenue,
            totalCost: this.totalCost,
            profit: this.profit,
            marketStructure: this.getMarketStructureName(),
            competitors: this.competitors,
            activeShocks: this.activeShocks.map(s => s.shock.name),
            isMonopoly: this.marketStructure === 'monopoly',
            isOligopoly: ['cournot', 'stackelberg_follower'].includes(this.marketStructure),
            isPerfectComp: this.marketStructure === 'perfect_competition',
            extraInfo: res,
            coefficients: this.ownedByPlayer ? {
                costA: this.costA, costB: this.costB, costC: this.costC,
                demandA: this.demandA, demandB: this.demandB,
                competitorCostA: this.competitorCostA,
                competitorCostB: this.competitorCostB
            } : null
        };
    }
}

window.Company = Company;