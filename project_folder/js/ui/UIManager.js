class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.selectedCompany = null;
        this.chartInstance = null;
        this.marketCharts = {};
        this.instructionStepIndex = 0;
        this.isGameOver = false;
    }

    initialize() {
        this.bindEvents();
        this.updateUI();
        this.initializeInstruction();
    }
//обработчик кнопок
    bindEvents() {
        document.getElementById("btnNextRound")?.addEventListener("click", () => {
            if (this.isGameOver) return;
            const result = this.gameEngine.nextRound();
            this.updateUI();
            if (this.isGameOver) return;
            this.updateRoundStatus(result);
            this.updateQuickAnalytics(result);
            this.showDecisionNotifications(result);
        });

        document.getElementById("btnBuyCompany")?.addEventListener("click", () => this.showBuyCompanyModal());
        document.getElementById("btnSellCompany")?.addEventListener("click", () => this.sellSelectedCompany());

        document.getElementById("btnBuyGold")?.addEventListener("click", () => this.buyMetal("gold"));
        document.getElementById("btnSellGold")?.addEventListener("click", () => this.sellMetal("gold"));
        document.getElementById("btnBuySilver")?.addEventListener("click", () => this.buyMetal("silver"));
        document.getElementById("btnSellSilver")?.addEventListener("click", () => this.sellMetal("silver"));
        document.getElementById("btnInsiderInfo")?.addEventListener("click", () => this.buyInsiderInfo());
        document.getElementById("btnTakeLoan")?.addEventListener("click", () => this.takeLoan());
        document.getElementById("btnOpenInstruction")?.addEventListener("click", () => this.openInstructionPage());
    }

    initializeInstruction() {
        this.openInstructionPage();
    }

    getInstructionSteps() {
        return [
            {
                title: "Добро пожаловать",
                body: `
                    <p>Нажимай на далее, чтобы узнать, как пользоваться игрой.</p>
                `
            },
            {
                title: "Прибыль и базовые формулы",
                body: `
                    <p><strong>Выручка:</strong> <code>R = P × Q</code></p>
                    <p><strong>Прибыль:</strong> <code>π = P × Q − TC − tax × Q</code></p>
                    <p>Налог: <strong>2</strong> на единицу продукции. Налог не входит в <code>TC</code>.</p>
                    <p class="instruction-note">Если прибыль отрицательная, иногда оптимально выбрать <code>Q = 0</code>.</p>
                `
            },
            {
                title: "Как принимать решение в раунде",
                body: `
                    <ol>
                        <li>Посмотрите функции спроса и издержек.</li>
                        <li>Найдите оптимальные <code>P</code>, <code>Q</code> и оцените <code>π</code>.</li>
                        <li>Проверьте влияние налога, шоков и долгов.</li>
                        <li>Сохраните решение до кнопки «Следующий раунд».</li>
                    </ol>
                `
            },
            {
                title: "Совершенная конкуренция и монополия",
                body: `
                    <p><strong>Совершенная конкуренция:</strong> <code>P = MC</code></p>
                    <ol>
                        <li>Цена задается рынком.</li>
                        <li>Найдите <code>MC = dTC/dQ</code>.</li>
                        <li>Из <code>P = MC</code> получите выпуск <code>Q</code>.</li>
                        <li>Если <code>P &lt; AVC</code>, выбирайте <code>Q = 0</code>.</li>
                    </ol>
                    <p><strong>Монополия:</strong> максимум прибыли при <code>MR = MC</code>, затем находите <code>Q*</code>, <code>P*</code>, <code>π</code>.</p>
                    <p><code>TR = Demand × Q</code>, <code>MR = d(TR)/dQ</code>.</p>
                    <p>Например, если спрос <code>P = 100 - Q</code>, то <code>TR = (100 - Q)Q</code>, а <code>MR = 100 - 2Q</code>.</p>
                `
            },
            {
                title: "Олигополия Курно",
                body: `
                    <p>Пусть есть спрос <code>Q = 180 − P</code>, <code>P = 180 − Q</code>.</p>
                    <p><code>Π<sub>1</sub> = P·Q<sub>1</sub> − TC<sub>1</sub> = (180 − Q)Q<sub>1</sub> − TC<sub>1</sub> = (180 − (Q<sub>1</sub> + Q<sub>2</sub>))Q<sub>1</sub> − 150Q<sub>1</sub> = 30Q<sub>1</sub> − Q<sub>2</sub>Q<sub>1</sub> − Q<sub>1</sub><sup>2</sup> → max</code>.</p>
                    <p>Аналогично выписывайте прибыль <code>Π<sub>2</sub></code>.</p>
                    <p>Максимизируя прибыль первой фирмы, воспринимаем <code>Q<sub>2</sub></code> как константу, а максимизируя прибыль второй фирмы, воспринимаем <code>Q<sub>1</sub></code> как константу.</p>
                    <p>Отсюда выражается зависимость <code>Q<sub>1</sub>(Q<sub>2</sub>)</code> и <code>Q<sub>2</sub>(Q<sub>1</sub>)</code>.</p>
                    <p>Из этого получаются линии реакций, и их пересечение — ответ задачи максимизации олигополии по Курно.</p>
                `
            },
            {
                title: "Олигополия Штакельберга",
                body: `
                    <p>Так как вторая фирма (последователь) воспринимает выпуск лидера как константу, сначала максимизируем прибыль фирмы-последователя, отсюда получается зависимость:</p>
                    <p><code>Q<sub>2</sub>(Q<sub>1</sub>)</code> - то, сколько будет фирма-последователь производить в зависимости от того, сколько произведет лидер, то есть подстраивается под лидера.</p>
                    <p>Подставляем в прибыль лидера эту зависимость и красиво максимизируем по <code>Q<sub>1</sub></code>.</p>
                `
            },
            {
                title: "Шоки, инсайды и финансы",
                body: `
                    <p><strong>Шоки</strong> меняют спрос и издержки на несколько раундов.</p>
                    <p><strong>Инсайды</strong> дают информацию о будущем шоке и помогают подготовить решение заранее.</p>
                    <p><strong>Банк и активы:</strong> кредиты нужно возвращать со ставкой, активы (золото/серебро) учитывайте в общей стратегии капитала.</p>
                    <p class="instruction-note"><strong>Важно:</strong> иногда лучше не производить, чем работать в убыток.</p>
                `
            }
        ];
    }

    getInstructionTemplate() {
        return `
        <div class="instruction-overlay" id="instructionOverlay">
            <div class="instruction-page">
                <div class="instruction-hero">
                    <div class="instruction-hero-text">
                        <p class="instruction-kicker">Добро пожаловать</p>
                        <h2>ВШЭ Экономический Симулятор</h2>
                        <p>Здесь вы учитесь принимать управленческие решения в разных рыночных структурах и будете прокачивать экономическую интуицию.</p>
                    </div>
                    <img src="./assets/crow.png" alt="Ворон-наставник" class="instruction-crow">
                </div>

                <div class="instruction-stepper">
                    <div class="instruction-step-meta">
                        <span id="instructionStepCounter" class="instruction-step-counter"></span>
                        <div id="instructionStepDots" class="instruction-step-dots"></div>
                    </div>
                    <article id="instructionStepCard" class="instruction-step-card"></article>
                </div>

                <div class="instruction-actions">
                    <button id="btnPrevInstruction" class="btn btn-secondary btn-large">Назад</button>
                    <button id="btnNextInstruction" class="btn btn-info btn-large">Далее</button>
                    <button id="btnStartGame" class="btn btn-primary btn-large">Начать игру</button>
                </div>
            </div>
        </div>`;
    }

    renderInstructionStep() {
        const steps = this.getInstructionSteps();
        const total = steps.length;
        const step = steps[this.instructionStepIndex];

        const card = document.getElementById("instructionStepCard");
        const counter = document.getElementById("instructionStepCounter");
        const dots = document.getElementById("instructionStepDots");
        const prevBtn = document.getElementById("btnPrevInstruction");
        const nextBtn = document.getElementById("btnNextInstruction");
        const startBtn = document.getElementById("btnStartGame");
        if (!card || !counter || !dots || !prevBtn || !nextBtn || !startBtn || !step) return;

        card.innerHTML = `
            <h3>${step.title}</h3>
            <div class="instruction-step-body">${step.body}</div>
        `;

        counter.textContent = `Шаг ${this.instructionStepIndex + 1} из ${total}`;
        dots.innerHTML = steps.map((_, idx) => `
            <span class="instruction-dot ${idx === this.instructionStepIndex ? "active" : ""}"></span>
        `).join("");

        const isLast = this.instructionStepIndex === total - 1;
        const isFirst = this.instructionStepIndex === 0;
        prevBtn.style.display = isFirst ? "none" : "inline-flex";
        nextBtn.style.display = isLast ? "none" : "inline-flex";
        startBtn.style.display = "inline-flex";
    }

    openInstructionPage() {
        if (document.getElementById("instructionOverlay")) return;

        const wrapper = document.createElement("div");
        wrapper.innerHTML = this.getInstructionTemplate();
        document.body.appendChild(wrapper.firstElementChild);
        document.body.classList.add("instruction-open");
        this.instructionStepIndex = 0;
        this.renderInstructionStep();

        document.getElementById("btnPrevInstruction")?.addEventListener("click", () => {
            if (this.instructionStepIndex > 0) {
                this.instructionStepIndex -= 1;
                this.renderInstructionStep();
            }
        });

        document.getElementById("btnNextInstruction")?.addEventListener("click", () => {
            const total = this.getInstructionSteps().length;
            if (this.instructionStepIndex < total - 1) {
                this.instructionStepIndex += 1;
                this.renderInstructionStep();
            }
        });

        document.getElementById("btnStartGame")?.addEventListener("click", () => {
            this.closeInstructionPage();
        });
    }

    closeInstructionPage() {
        document.getElementById("instructionOverlay")?.remove();
        document.body.classList.remove("instruction-open");
    }

    updateUI() {
        const state = this.gameEngine.getGameState();
        this.updatePlayerStats(state);
        this.updateEconomyStats(state);
        this.updateCompaniesList(state);
        this.updateControlPanel();
        this.updateShockPanel(state);
        this.updateBankPanel(state);
        this.updateStockMarketPanel(state);
        this.checkGameOver(state);
    }

    checkGameOver(state) {
        if (this.isGameOver) return;
        if (!state?.player) return;
        if (state.player.capital >= 0) return;

        this.isGameOver = true;
        this.showGameOverOverlay(state.player.capital);
    }

    showGameOverOverlay(capital) {
        if (document.getElementById("gameOverOverlay")) return;

        const wrapper = document.createElement("div");
        wrapper.innerHTML = `
        <div class="game-over-overlay" id="gameOverOverlay">
            <div class="game-over-card">
                <h2>Game Over</h2>
                <p>Ваш капитал стал отрицательным.</p>
                <p>Игра завершена. Нажмите кнопку ниже, чтобы начать заново.</p>
                <button id="btnRestartGame" class="btn btn-primary btn-large">Играть заново</button>
            </div>
        </div>`;
        document.body.appendChild(wrapper.firstElementChild);

        document.getElementById("btnRestartGame")?.addEventListener("click", () => {
            window.location.reload();
        });
    }

    updatePlayerStats(state) {
        const fmt = (value) => Math.round(value).toLocaleString("ru-RU");
        const set = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        set("playerCapital", `${fmt(state.player.capital)} ₽`);
        set("currentRound", String(state.round));
        set("netWorth", `${fmt(state.player.netWorth)} ₽`);
    }

    updateEconomyStats(state) {
        const set = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        set("inflationRate", `${state.economy.inflation.toFixed(1)}%`);
        set("interestRate", `${state.economy.interestRate.toFixed(1)}%`);
        set("taxRate", `${state.economy.taxRate} ден. ед. / ед.`);
    }

    updateShockPanel(state) {
        const container = document.getElementById("shockSidebar");
        if (!container) return;

        const shocks = state.activeShocks || [];
        if (!shocks.length) {
            container.innerHTML = `
            <div class="analytics-placeholder">
                <p>${state.round < 2 ? "Со второго раунда здесь будут появляться рыночные шоки" : "Сейчас активных шоков нет"}</p>
            </div>`;
            return;
        }

        container.innerHTML = shocks.map((shock) => `
            <div class="shock-card">
                <h4>${shock.name}</h4>
                <p>${shock.description || "Рыночный шок влияет на коэффициенты компаний и макроэкономику."}</p>
                <div class="shock-meta">
                    <span>${shock.target === "all" ? "Вся экономика" : "Цель: " + shock.target}</span>
                    <span class="shock-badge">Ещё ${shock.roundsRemaining} раунд.</span>
                </div>
            </div>
        `).join("");
    }

    updateCompaniesList(state) {
        const container = document.getElementById("companiesList");
        if (!container) return;

        if (!state.player.companies.length) {
            container.innerHTML = '<div class="empty-message">У вас пока нет компаний. Купите первую!</div>';
            return;
        }

        container.innerHTML = state.player.companies.map((company) => {
            const decision = company.getPlayerDecision();
            const status = decision.pendingSubmission ? "Решение сохранено" : "Ожидает решение";
            const marketValue = Math.round(company.basePrice);
            const sellValue = Math.round(company.basePrice);

            return `
            <div class="company-card ${this.selectedCompany?.id === company.id ? "selected" : ""}" data-id="${company.id}">
                <div class="company-header">
                    <span class="company-icon">${company.icon || "🏢"}</span>
                    <div class="company-title">
                        <h4>${company.name}</h4>
                        <span class="company-type">${company.getMarketStructureName()}</span>
                        <span class="company-profit">${status}</span>
                    </div>
                </div>
                <div class="company-details">
                    <div class="detail-row">
                        <span>Стоимость:</span>
                        <span class="detail-value">${marketValue.toLocaleString("ru-RU")} ₽</span>
                    </div>
                    <div class="detail-row">
                        <span>Продажа:</span>
                        <span class="detail-value">${sellValue.toLocaleString("ru-RU")} ₽</span>
                    </div>
                    <div class="detail-row">
                        <span>Ваш P:</span>
                        <span class="detail-value">${decision.price === "" ? "—" : `${decision.price} ₽`}</span>
                    </div>
                    <div class="detail-row">
                        <span>Ваш Q:</span>
                        <span class="detail-value">${decision.quantity === "" ? "—" : `${decision.quantity} ед.`}</span>
                    </div>
                    <div class="detail-row">
                        <span>Ваша π:</span>
                        <span class="detail-value">${decision.expectedProfit === "" ? "—" : `${decision.expectedProfit} ₽`}</span>
                    </div>
                    <div class="detail-row formula-row">
                        <span class="formula-label">Издержки:</span>
                        <span class="formula-value">${company.getCostFormula()}</span>
                    </div>
                </div>
                <button class="btn-select-company" data-id="${company.id}">Выбрать</button>
            </div>`;
        }).join("");

        container.querySelectorAll(".btn-select-company").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                this.selectCompany(button.dataset.id);
            });
        });

        container.querySelectorAll(".company-card").forEach((card) => {
            card.addEventListener("click", () => this.selectCompany(card.dataset.id));
        });
    }

    updateControlPanel() {
        const panel = document.getElementById("businessControls");
        const empty = document.getElementById("noCompanySelected");
        if (!panel || !empty) return;

        if (!this.selectedCompany) {
            panel.style.display = "none";
            empty.style.display = "block";
            return;
        }

        panel.style.display = "block";
        empty.style.display = "none";

        const title = document.getElementById("selectedCompanyName");
        if (title) title.textContent = this.selectedCompany.name;

        this.updateCompanyDetails();
        this.renderChart(this.selectedCompany);
    }

    updateCompanyDetails() {
        if (!this.selectedCompany) return;
        const panel = document.getElementById("companyDetails");
        if (!panel) return;

        const company = this.selectedCompany;
        const state = this.gameEngine.getGameState();
        const info = company.getDetailedInfo();
        const decision = company.getPlayerDecision();
        const unitTax = state.economy.taxRate;
        const previousRoundInfo = state.previousRoundCompanyFunctions?.[company.id] || {};
        const oldDemandFormula = previousRoundInfo.demandFormula || "— (появится после следующего раунда)";
        const oldCostFormula = previousRoundInfo.costFormula || "— (появится после следующего раунда)";
        const marketValue = Math.round(company.basePrice);
        const sellValue = Math.round(company.basePrice);

        const competitorHtml = (company.marketStructure === "cournot" || company.marketStructure === "stackelberg_leader" || company.marketStructure === "stackelberg_follower")
            ? `
            <div class="detail-item formula-item">
                <span class="detail-label">Издержки конкурента:</span>
                <span class="detail-value formula-cost">${company.getCompetitorCostFormula()}</span>
            </div>`
            : "";

        const pendingText = decision.pendingSubmission
            ? `
            <div class="detail-item">
                <span class="detail-label">Статус:</span>
                <span class="detail-value">Решение сохранено. Итог будет в следующем раунде.</span>
            </div>`
            : "";

        panel.style.display = "block";
        panel.innerHTML = `
        <h4>📊 Ваше решение</h4>
        <div class="simple-details">
            <div class="detail-item">
                <span class="detail-label">Структура рынка:</span>
                <span class="detail-value">${info.marketStructure}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Описание:</span>
                <span class="detail-value">${company.description}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Стоимость компании:</span>
                <span class="detail-value">${marketValue.toLocaleString("ru-RU")} ₽</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Цена продажи:</span>
                <span class="detail-value">${sellValue.toLocaleString("ru-RU")} ₽</span>
            </div>
            <div class="detail-item formula-item">
                <span class="detail-label">Функция спроса:</span>
                <div class="formula-compare">
                    <div class="formula-entry">
                        <span class="formula-chip formula-chip-new">Новая</span>
                        <span class="detail-value formula-demand">${info.demandFormula}</span>
                    </div>
                    <div class="formula-entry">
                        <span class="formula-chip formula-chip-old">Старая</span>
                        <span class="detail-value formula-demand formula-demand-old">${oldDemandFormula}</span>
                    </div>
                </div>
            </div>
            <div class="detail-item formula-item">
                <span class="detail-label">Функция издержек:</span>
                <div class="formula-compare">
                    <div class="formula-entry">
                        <span class="formula-chip formula-chip-new">Новая</span>
                        <span class="detail-value formula-cost">${info.costFormula}</span>
                    </div>
                    <div class="formula-entry">
                        <span class="formula-chip formula-chip-old">Старая</span>
                        <span class="detail-value formula-cost formula-cost-old">${oldCostFormula}</span>
                    </div>
                </div>
            </div>
            <div class="detail-item">
                <span class="detail-label">Важно:</span>
                <span class="detail-value">Не забудьте учесть налог: ${unitTax} ден. ед. на 1 единицу продукции.</span>
            </div>
            ${competitorHtml}
            ${pendingText}
        </div>

        <div class="profit-checker" style="margin-top:20px;">
            <h4>🧮 Цена, объём и прибыль</h4>
            <div class="input-with-button" style="margin-top:10px;">
                <input type="number" id="playerPriceInput" step="0.1" placeholder="Введите цену P" value="${decision.price}">
            </div>
            <div class="input-with-button" style="margin-top:10px;">
                <input type="number" id="playerQuantityInput" step="0.1" placeholder="Введите объём Q" value="${decision.quantity}">
            </div>
            <div class="input-with-button" style="margin-top:10px;">
                <input type="number" id="playerProfitInput" step="0.1" placeholder="Введите прибыль π" value="${decision.expectedProfit}">
                <button id="btnSaveDecision" class="btn btn-small btn-warning">Сохранить</button>
            </div>
            <div id="profitCheckResult" style="margin-top:10px;"></div>
        </div>`;

        document.getElementById("btnSaveDecision")?.addEventListener("click", () => this.savePlayerDecision());
    }

    savePlayerDecision() {
        if (!this.selectedCompany) return;

        const priceInput = document.getElementById("playerPriceInput");
        const quantityInput = document.getElementById("playerQuantityInput");
        const profitInput = document.getElementById("playerProfitInput");
        const resultEl = document.getElementById("profitCheckResult");
        if (!priceInput || !quantityInput || !profitInput || !resultEl) return;

        const price = Number(priceInput.value);
        const quantity = Number(quantityInput.value);
        const profit = Number(profitInput.value);

        if ([price, quantity, profit].some((value) => Number.isNaN(value))) {
            resultEl.innerHTML = '<span style="color:#e74c3c;">Введите цену, количество и прибыль.</span>';
            return;
        }

        this.selectedCompany.setPrice(price);
        this.selectedCompany.setProduction(quantity);
        this.selectedCompany.setExpectedProfit(profit);

        const submit = this.selectedCompany.submitDecision(this.gameEngine.currentRound);
        if (!submit.success) {
            resultEl.innerHTML = `<span style="color:#e74c3c;">${submit.message}</span>`;
            return;
        }

        resultEl.innerHTML = '<div class="check-correct">Решение сохранено. Проверка будет в следующем раунде.</div>';
        this.updateUI();
    }

    renderChart(company) {
        const canvas = document.getElementById("companyChart");
        if (!canvas) return;

        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }

        const data = company.getChartData();
        const labels = data.demand.map((item) => item.Q);
        const datasets = [
            {
                label: "Спрос (D)",
                data: data.demand.map((item) => item.P),
                borderColor: "#3498db",
                borderWidth: 2,
                pointRadius: 0,
                fill: false
            },
            {
                label: "MC",
                data: data.mc.map((item) => item.MC),
                borderColor: "#e74c3c",
                borderWidth: 2,
                pointRadius: 0,
                fill: false
            }
        ];

        if (["monopoly", "cournot", "stackelberg_leader", "stackelberg_follower"].includes(company.marketStructure)) {
            datasets.push({
                label: "MR",
                data: data.mr.map((item) => item.MR),
                borderColor: "#9b59b6",
                borderWidth: 2,
                borderDash: [6, 3],
                pointRadius: 0,
                fill: false
            });
        }

        this.chartInstance = new Chart(canvas, {
            type: "line",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "top",
                        labels: { font: { family: "Nunito", size: 12 } }
                    }
                },
                scales: {
                    x: { title: { display: true, text: "Q (выпуск)" } },
                    y: { title: { display: true, text: "Цена / издержки" }, beginAtZero: true }
                }
            }
        });
    }

    updateStockMarketPanel(state) {
        const market = state.stockMarket;
        if (!market) return;

        const fmt = (value) => Math.round(value).toLocaleString("ru-RU");
        const set = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        set("goldPrice", `${fmt(market.metals.gold.currentPrice)} ₽/ед.`);
        set("silverPrice", `${fmt(market.metals.silver.currentPrice)} ₽/ед.`);
        set("goldQty", `В портфеле: ${market.metals.gold.quantity} ед.`);
        set("silverQty", `В портфеле: ${market.metals.silver.quantity} ед.`);
        this.renderMarketChart("gold", market.priceHistory?.gold || [], "#d4a017");
        this.renderMarketChart("silver", market.priceHistory?.silver || [], "#8c97a8");

        const insiderEl = document.getElementById("insiderInfoDisplay");
        if (!insiderEl) return;

        if (market.insiderInfo.hasInfo) {
            if (market.insiderInfo.revealedShock) {
                insiderEl.innerHTML = `
                <div class="insider-active">
                    🔍 Инсайд активен (${market.insiderInfo.roundsRemaining} раунда)<br>
                    <strong>${market.insiderInfo.revealedShock.name}</strong><br>
                    <small>${market.insiderInfo.revealedShock.description || ""}</small>
                </div>`;
            } else {
                insiderEl.innerHTML = `
                <div class="insider-active">
                    🔍 Инсайд куплен. Следующий шок будет раскрыт в следующем раунде.
                </div>`;
            }
        } else {
            insiderEl.innerHTML = '<div class="insider-inactive">ℹ️ Нет активной инсайдерской информации</div>';
        }
    }

    renderMarketChart(metalType, history, color) {
        const canvas = document.getElementById(`${metalType}Chart`);
        if (!canvas || !history.length) return;

        if (this.marketCharts[metalType]) {
            this.marketCharts[metalType].destroy();
        }

        this.marketCharts[metalType] = new Chart(canvas, {
            type: "line",
            data: {
                labels: history.map((_, index) => `R${index + 1}`),
                datasets: [{
                    label: metalType === "gold" ? "Золото" : "Серебро",
                    data: history,
                    borderColor: color,
                    backgroundColor: `${color}22`,
                    borderWidth: 2,
                    pointRadius: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }

    updateBankPanel(state) {
        const bank = state.bank;
        if (!bank) return;

        const set = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        set("bankLoanRate", `Ставка: ${(bank.interestRate).toFixed(1)}%`);
        set("bankLoanInfo", `К возврату через ${bank.defaultDuration} раунда по ставке ЦБ + 1 п.п.`);

        const loansEl = document.getElementById("bankLoansList");
        if (!loansEl) return;

        if (!bank.loans?.length) {
            loansEl.innerHTML = "Активных займов нет";
            return;
        }

        loansEl.innerHTML = bank.loans.map((loan) => `
            <div class="detail-row">
                <span>${Math.round(loan.amount).toLocaleString("ru-RU")} ₽ до раунда ${loan.dueRound}</span>
                <span>${Math.round(loan.totalDue).toLocaleString("ru-RU")} ₽</span>
            </div>
        `).join("");
    }

    buyMetal(type) {
        const qty = parseInt(document.getElementById(`${type}BuyQty`)?.value || "1", 10);
        const result = this.gameEngine.buyMetal(type, qty);
        if (result?.success) {
            this.gameEngine.player.capital -= result.cost;
            this.gameEngine.player.netWorth = this.gameEngine.player.calculateNetWorth();
            this.updateUI();
            this.showToast(`Куплено ${qty} ед. за ${Math.round(result.cost).toLocaleString("ru-RU")} ₽`);
        } else {
            this.showToast("Недостаточно средств", "error");
        }
    }

    sellMetal(type) {
        const qty = parseInt(document.getElementById(`${type}SellQty`)?.value || "1", 10);
        const result = this.gameEngine.sellMetal(type, qty);
        if (result?.success) {
            this.gameEngine.player.capital += result.value;
            this.gameEngine.player.netWorth = this.gameEngine.player.calculateNetWorth();
            this.updateUI();
            this.showToast(`Продано ${qty} ед. за ${Math.round(result.value).toLocaleString("ru-RU")} ₽`);
        } else {
            this.showToast("Недостаточно активов для продажи", "error");
        }
    }

    buyInsiderInfo() {
        const result = this.gameEngine.buyInsiderInfo();
        if (result?.success) {
            this.gameEngine.player.capital -= result.cost;
            this.gameEngine.player.netWorth = this.gameEngine.player.calculateNetWorth();
            this.updateUI();
            this.showToast(`Инсайд куплен: ${result.shock.name}`);
        } else {
            this.showToast("Недостаточно средств или информация уже куплена", "error");
        }
    }

    takeLoan() {
        const amount = Number(document.getElementById("loanAmountInput")?.value || "0");
        const result = this.gameEngine.takeLoan(amount);

        if (result?.success) {
            this.gameEngine.player.netWorth = this.gameEngine.player.calculateNetWorth();
            this.updateUI();
            this.showToast(result.message);
        } else {
            this.showToast(result?.message || "Не удалось оформить займ", "error");
        }
    }

    selectCompany(companyId) {
        const company = this.gameEngine.player.companies.find((item) => item.id === companyId);
        if (company) {
            this.selectedCompany = company;
            this.updateUI();
        }
    }

    sellSelectedCompany() {
        if (!this.selectedCompany) return;
        if (!confirm(`Продать компанию "${this.selectedCompany.name}"?`)) return;

        const value = this.gameEngine.sellCompany(this.selectedCompany.id);
        if (value) {
            this.selectedCompany = null;
            if (this.chartInstance) {
                this.chartInstance.destroy();
                this.chartInstance = null;
            }
            this.updateUI();
            this.showToast(`Компания продана за ${Math.round(value).toLocaleString("ru-RU")} ₽`);
        }
    }

    showBuyCompanyModal() {
        const state = this.gameEngine.getGameState();
        if (!state.availableCompanies.length) {
            this.showToast("Все компании уже куплены", "error");
            return;
        }

        const html = `
        <div class="modal-overlay" id="buyCompanyModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🛒 Купить компанию</h3>
                    <p class="modal-subtitle">Ваш капитал: ${Math.round(state.player.capital).toLocaleString("ru-RU")} ₽</p>
                </div>
                <div class="modal-body">
                    <div class="companies-grid">
                        ${state.availableCompanies.map((company) => {
                            const canAfford = state.player.capital >= company.basePrice;
                            return `
                            <div class="company-option ${canAfford ? "" : "disabled"}">
                                <div class="company-option-header">
                                    <span class="company-icon">${company.icon}</span>
                                    <div>
                                        <h4>${company.name}</h4>
                                        <p class="company-price">${Math.round(company.basePrice).toLocaleString("ru-RU")} ₽</p>
                                        <p class="company-structure">${company.getMarketStructureName()}</p>
                                    </div>
                                </div>
                                <p class="company-description">${company.description}</p>
                                <button class="btn ${canAfford ? "btn-primary" : "btn-disabled"} btn-buy-company" data-id="${company.id}" ${canAfford ? "" : "disabled"}>
                                    ${canAfford ? "Купить компанию" : "Недостаточно средств"}
                                </button>
                            </div>`;
                        }).join("")}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-close-modal">Закрыть</button>
                </div>
            </div>
        </div>`;

        this.closeModal();
        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        document.body.appendChild(wrapper.firstElementChild);

        document.querySelectorAll(".btn-buy-company:not(:disabled)").forEach((button) => {
            button.addEventListener("click", () => {
                this.buyCompany(button.dataset.id);
                this.closeModal();
            });
        });
        document.querySelector(".btn-close-modal")?.addEventListener("click", () => this.closeModal());
        document.querySelector(".modal-overlay")?.addEventListener("click", (event) => {
            if (event.target.classList.contains("modal-overlay")) this.closeModal();
        });
    }

    buyCompany(companyId) {
        const success = this.gameEngine.buyCompany(companyId);
        if (success) {
            this.updateUI();
            this.showToast("Компания куплена");
        } else {
            this.showToast("Не удалось купить компанию", "error");
        }
    }

    closeModal() {
        document.getElementById("buyCompanyModal")?.remove();
    }

    updateRoundStatus(result) {
        const el = document.getElementById("roundStatus");
        if (!el || !result) return;
        const profit = Math.round(result.totalProfit || 0);
        el.textContent = `Раунд ${result.round} завершён. Прибыль: ${profit >= 0 ? "+" : ""}${profit.toLocaleString("ru-RU")} ₽`;
    }

    updateQuickAnalytics(result) {
        const el = document.getElementById("quickAnalytics");
        if (!el || !result) return;

        const total = Math.round(result.totalProfit || 0);
        const cls = total >= 0 ? "profit-positive" : "profit-negative";
        const sign = total >= 0 ? "+" : "";
        const rows = (result.companyProfits || []).map((company) => {
            const value = Math.round(company.profit || 0);
            return `<div class="detail-row">
                <span>${company.name}</span>
                <span class="${value >= 0 ? "profit-positive" : "profit-negative"}">${value >= 0 ? "+" : ""}${value.toLocaleString("ru-RU")} ₽</span>
            </div>`;
        }).join("");

        el.innerHTML = `
        <div class="analytics-summary">
            <h3 style="margin-bottom:15px;">Итоги раунда ${result.round}</h3>
            <div class="detail-row">
                <span>Общая прибыль</span>
                <span class="${cls}">${sign}${total.toLocaleString("ru-RU")} ₽</span>
            </div>
            ${rows || '<p style="margin-top:12px;color:#7f8c8d;">Нет компаний</p>'}
        </div>`;
    }

    showDecisionNotifications(result) {
        const companyNameById = new Map(
            [...this.gameEngine.player.companies, ...this.gameEngine.availableCompanies]
                .map((company) => [company.id, company.name])
        );
        const shockAndWarningDuration = 15000;

        let delay = 0;
        const queueToast = (message, type = "success", durationMs = 5200) => {
            setTimeout(() => this.showToast(message, type, durationMs), delay);
            delay += durationMs + 450;
        };

        (result?.decisionReports || [])
            .filter((report) => report.submitted)
            .forEach((report) => {
                const capitalDelta = report.capitalDelta ?? report.actualProfit ?? 0;
                const amount = Math.round(capitalDelta).toLocaleString("ru-RU");
                const outcome = capitalDelta >= 0 ? `+${amount} ₽ к капиталу` : `${amount} ₽ к капиталу`;

                let message = `${report.companyName}: решение верное, ${outcome}`;
                if (!report.isCorrect) {
                    const actualProfit = report.actualProfit ?? 0;
                    const actualAmount = Math.round(actualProfit).toLocaleString("ru-RU");
                    const actualText = actualProfit >= 0 ? `+${actualAmount} ₽` : `${actualAmount} ₽`;
                    message = report.capitalDelta !== report.actualProfit
                        ? `${report.companyName}: решение неверное, фактический результат ${actualText}, начислено ${outcome}`
                        : `${report.companyName}: решение неверное, ${outcome}`;
                }

                queueToast(message, capitalDelta >= 0 ? "success" : "error");
            });

        (result?.loanReports || []).forEach((loanReport) => {
            queueToast(`Автосписание по займу: ${Math.round(loanReport.totalDue).toLocaleString("ru-RU")} ₽`, "error");
        });

        if (result?.marketChanges?.interestRateChanged) {
            const { before, after } = result.marketChanges.interestRateChanged;
            const diff = (after - before).toFixed(1);
            queueToast(
                `Ставка ЦБ изменилась: ${before.toFixed(1)}% → ${after.toFixed(1)}% (${Number(diff) >= 0 ? "+" : ""}${diff} п.п.)`,
                Number(diff) >= 0 ? "error" : "success"
            );
        }

        if (result?.newShock) {
            queueToast(`Новый шок: ${result.newShock.name}`, "error", shockAndWarningDuration);
        }

        (result?.marketChanges?.companyCostChanges || []).forEach((change) => {
            const companyName = companyNameById.get(change.companyId) || change.companyId;
            queueToast(
                `Внимание! Издержки компании "${companyName}" изменились.\n${change.beforeFormula} -> ${change.afterFormula}`,
                "error",
                shockAndWarningDuration
            );

            if (change.causedByNewShock && result?.newShock?.name) {
                queueToast(`Причина изменения издержек: шок "${result.newShock.name}".`, "error", shockAndWarningDuration);
            }
        });

        (result?.marketChanges?.companyDemandChanges || []).forEach((change) => {
            const companyName = companyNameById.get(change.companyId) || change.companyId;
            queueToast(
                `Внимание! Спрос компании "${companyName}" изменился.\n${change.beforeFormula} -> ${change.afterFormula}`,
                "error",
                shockAndWarningDuration
            );

            if (change.causedByNewShock && result?.newShock?.name) {
                queueToast(`Причина изменения спроса: шок "${result.newShock.name}".`, "error", shockAndWarningDuration);
            }
        });

        if ((result?.marketChanges?.companyCostChanges || []).length > 0 && !result?.newShock) {
            queueToast("Издержки изменились из-за активных или завершившихся шоков.", "error", shockAndWarningDuration);
        }

        if ((result?.marketChanges?.companyDemandChanges || []).length > 0 && !result?.newShock) {
            queueToast("Спрос изменился из-за активных или завершившихся шоков.", "error", shockAndWarningDuration);
        }

        (result?.marketChanges?.companyChanges || []).slice(0, 4).forEach((change) => {
            const companyName = companyNameById.get(change.companyId) || change.companyId;
            const diffPercent = Math.round(((change.after - change.before) / Math.max(change.before, 1)) * 100);
            queueToast(
                `Цена компании ${companyName}: ${diffPercent >= 0 ? "+" : ""}${diffPercent}%`,
                diffPercent >= 0 ? "success" : "error"
            );
        });

        (result?.marketChanges?.assetChanges || []).forEach((change) => {
            const assetName = change.asset === "gold" ? "золото" : "серебро";
            const diffPercent = Math.round(((change.after - change.before) / Math.max(change.before, 1)) * 100);
            queueToast(
                `Котировка ${assetName}: ${diffPercent >= 0 ? "+" : ""}${diffPercent}%`,
                diffPercent >= 0 ? "success" : "error"
            );
        });
    }

    showToast(message, type = "success", durationMs = 5200) {
        document.getElementById("gameToast")?.remove();
        const toast = document.createElement("div");
        toast.id = "gameToast";
        toast.className = `game-toast ${type === "error" ? "toast-error" : "toast-success"}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add("toast-visible"), 20);
        setTimeout(() => {
            toast.classList.remove("toast-visible");
            setTimeout(() => toast.remove(), 300);
        }, durationMs);
    }

}

export { UIManager };

if (typeof window !== "undefined") {
    window.UIManager = UIManager;
}
