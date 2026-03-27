class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.selectedCompany = null;
        this.chartInstance = null;
        this.marketCharts = {};
    }

    initialize() {
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        document.getElementById("btnNextRound")?.addEventListener("click", () => {
            const result = this.gameEngine.nextRound();
            this.updateUI();
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
        const info = company.getDetailedInfo();
        const decision = company.getPlayerDecision();
        const unitTax = this.gameEngine.getGameState().economy.taxRate;

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
            <div class="detail-item formula-item">
                <span class="detail-label">Функция спроса:</span>
                <span class="detail-value formula-demand">${info.demandFormula}</span>
            </div>
            <div class="detail-item formula-item">
                <span class="detail-label">Функция издержек:</span>
                <span class="detail-value formula-cost">${info.costFormula}</span>
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

    showCompanyDetails() {
        this.updateCompanyDetails();
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
        if (result?.newShock) {
            this.showToast(`Новый шок: ${result.newShock.name}`, "error");
        }

        const companyNameById = new Map(
            [...this.gameEngine.player.companies, ...this.gameEngine.availableCompanies]
                .map((company) => [company.id, company.name])
        );

        result?.marketChanges?.companyChanges?.slice(0, 4).forEach((change, index) => {
            const companyName = companyNameById.get(change.companyId) || change.companyId;
            const diffPercent = Math.round(((change.after - change.before) / Math.max(change.before, 1)) * 100);
            setTimeout(() => {
                this.showToast(`Цена компании ${companyName}: ${diffPercent >= 0 ? "+" : ""}${diffPercent}%`, diffPercent >= 0 ? "success" : "error");
            }, 300 + index * 700);
        });

        result?.marketChanges?.assetChanges?.forEach((change, index) => {
            const assetName = change.asset === "gold" ? "золото" : "серебро";
            const diffPercent = Math.round(((change.after - change.before) / Math.max(change.before, 1)) * 100);
            setTimeout(() => {
                this.showToast(`Котировка ${assetName}: ${diffPercent >= 0 ? "+" : ""}${diffPercent}%`, diffPercent >= 0 ? "success" : "error");
            }, 500 + index * 700);
        });

        if (result?.marketChanges?.interestRateChanged) {
            const { before, after } = result.marketChanges.interestRateChanged;
            const diff = (after - before).toFixed(1);
            this.showToast(`Ставка ЦБ изменилась: ${before.toFixed(1)}% → ${after.toFixed(1)}% (${Number(diff) >= 0 ? "+" : ""}${diff} п.п.)`, Number(diff) >= 0 ? "error" : "success");
        }

        if (result?.loanReports?.length) {
            result.loanReports.forEach((loanReport, index) => {
                setTimeout(() => {
                    this.showToast(`Автосписание по займу: ${Math.round(loanReport.totalDue).toLocaleString("ru-RU")} ₽`, "error");
                }, index * 700);
            });
        }

        if (!result?.decisionReports?.length) return;

        result.decisionReports
            .filter((report) => report.submitted)
            .forEach((report, index) => {
                const amount = Math.round(report.actualProfit).toLocaleString("ru-RU");
                const outcome = report.actualProfit >= 0 ? `+${amount} ₽ к капиталу` : `${amount} ₽ к капиталу`;
                const message = report.isCorrect
                    ? `${report.companyName}: решение верное, ${outcome}`
                    : `${report.companyName}: решение неверное, фактический результат ${outcome}`;
                setTimeout(() => this.showToast(message, report.actualProfit >= 0 ? "success" : "error"), index * 900);
            });
    }

    showToast(message, type = "success") {
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
        }, 2600);
    }

}

export { UIManager };

if (typeof window !== "undefined") {
    window.UIManager = UIManager;
}
