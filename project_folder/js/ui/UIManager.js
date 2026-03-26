// js/ui/UIManager.js
class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.selectedCompany = null;
        this.chartInstance = null;
    }

    initialize() {
        console.log('Инициализация UI...');
        if (!document.getElementById('playerCapital')) {
            console.error('Элемент playerCapital не найден!');
            return;
        }
        this.bindEvents();
        this.updateUI();
        console.log('UI инициализирован');
    }

    bindEvents() {
        const btnNextRound = document.getElementById('btnNextRound');
        if (btnNextRound) {
            btnNextRound.addEventListener('click', () => {
                const result = this.gameEngine.nextRound();
                this.updateUI();
                this.updateRoundStatus(result);
                this.updateQuickAnalytics(result);
            });
        }

        const btnBuyCompany = document.getElementById('btnBuyCompany');
        if (btnBuyCompany) {
            btnBuyCompany.addEventListener('click', () => this.showBuyCompanyModal());
        }

        const btnApplyProduction = document.getElementById('btnApplyProduction');
        if (btnApplyProduction) {
            btnApplyProduction.addEventListener('click', () => this.applyProductionChange());
        }

        const btnSellCompany = document.getElementById('btnSellCompany');
        if (btnSellCompany) {
            btnSellCompany.addEventListener('click', () => this.sellSelectedCompany());
        }

        const btnCompanyDetails = document.getElementById('btnCompanyDetails');
        if (btnCompanyDetails) {
            btnCompanyDetails.addEventListener('click', () => this.showCompanyDetails());
        }

        const btnCheckProfit = document.getElementById('btnCheckProfit');
        if (btnCheckProfit) {
            btnCheckProfit.addEventListener('click', () => this.checkPlayerProfit());
        }

        // Золотовалютный рынок
        const btnBuyGold = document.getElementById('btnBuyGold');
        if (btnBuyGold) btnBuyGold.addEventListener('click', () => this.buyMetal('gold'));
        const btnSellGold = document.getElementById('btnSellGold');
        if (btnSellGold) btnSellGold.addEventListener('click', () => this.sellMetal('gold'));
        const btnBuyPlatinum = document.getElementById('btnBuyPlatinum');
        if (btnBuyPlatinum) btnBuyPlatinum.addEventListener('click', () => this.buyMetal('platinum'));
        const btnSellPlatinum = document.getElementById('btnSellPlatinum');
        if (btnSellPlatinum) btnSellPlatinum.addEventListener('click', () => this.sellMetal('platinum'));
        const btnInsiderInfo = document.getElementById('btnInsiderInfo');
        if (btnInsiderInfo) btnInsiderInfo.addEventListener('click', () => this.buyInsiderInfo());

        // Сохранить/загрузить
        const btnSaveGame = document.getElementById('btnSaveGame');
        if (btnSaveGame) btnSaveGame.addEventListener('click', () => this.saveGame());
        const btnLoadGame = document.getElementById('btnLoadGame');
        if (btnLoadGame) btnLoadGame.addEventListener('click', () => this.loadGame());
    }

    updateUI() {
        const state = this.gameEngine.getGameState();
        this.updatePlayerStats(state);
        this.updateCompaniesList(state);
        this.updateEconomyStats(state);
        this.updateControlPanel(state);
        this.updateStockMarketPanel(state);
    }

    updatePlayerStats(state) {
        const el = id => document.getElementById(id);
        const fmt = n => Math.round(n).toLocaleString('ru-RU');
        if (el('playerCapital')) el('playerCapital').textContent = `${fmt(state.player.capital)} ₽`;
        if (el('currentRound'))  el('currentRound').textContent  = state.round;
        if (el('netWorth'))      el('netWorth').textContent      = `${fmt(state.player.netWorth)} ₽`;
    }

    updateEconomyStats(state) {
        const el = id => document.getElementById(id);
        if (el('inflationRate')) el('inflationRate').textContent = `${state.economy.inflation.toFixed(1)}%`;
        if (el('interestRate'))  el('interestRate').textContent  = `${state.economy.interestRate.toFixed(1)}%`;
        if (el('taxRate'))       el('taxRate').textContent       = `${state.economy.taxRate}%`;
    }

    updateCompaniesList(state) {
        const container = document.getElementById('companiesList');
        if (!container) return;

        if (!state.player.companies || state.player.companies.length === 0) {
            container.innerHTML = '<div class="empty-message">У вас пока нет компаний. Купите первую!</div>';
            return;
        }

        let html = '';
        state.player.companies.forEach(company => {
            const profitClass = company.profit >= 0 ? 'profit-positive' : 'profit-negative';
            const profitSign  = company.profit >= 0 ? '+' : '';
            const costFormula = company.getCostFormula ? company.getCostFormula() : 'TC = ?';
            const mktName     = company.getMarketStructureName ? company.getMarketStructureName() : '';

            html += `
            <div class="company-card ${this.selectedCompany?.id === company.id ? 'selected' : ''}" data-id="${company.id}">
                <div class="company-header">
                    <span class="company-icon">${company.icon || '🏢'}</span>
                    <div class="company-title">
                        <h4>${company.name}</h4>
                        <span class="company-type">${mktName}</span>
                    </div>
                    <span class="company-profit ${profitClass}">
                        ${profitSign}${Math.round(company.profit).toLocaleString('ru-RU')}₽
                    </span>
                </div>
                <div class="company-details">
                    <div class="detail-row">
                        <span>Цена:</span>
                        <span class="detail-value">${Math.round(company.productPrice).toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div class="detail-row">
                        <span>Выпуск Q*:</span>
                        <span class="detail-value">${Math.round(company.production).toLocaleString('ru-RU')} ед.</span>
                    </div>
                    <div class="detail-row formula-row">
                        <span class="formula-label">Издержки:</span>
                        <span class="formula-value">${costFormula}</span>
                    </div>
                </div>
                <button class="btn-select-company" data-id="${company.id}">Выбрать</button>
            </div>`;
        });

        container.innerHTML = html;

        container.querySelectorAll('.btn-select-company').forEach(btn => {
            btn.addEventListener('click', e => {
                this.selectCompany(e.target.dataset.id);
                e.stopPropagation();
            });
        });
        container.querySelectorAll('.company-card').forEach(card => {
            card.addEventListener('click', e => {
                if (!e.target.classList.contains('btn-select-company')) {
                    this.selectCompany(card.dataset.id);
                }
            });
        });
    }

    updateControlPanel() {
        const controlPanel    = document.getElementById('businessControls');
        const noCompanyMsg    = document.getElementById('noCompanySelected');
        if (!controlPanel || !noCompanyMsg) return;

        if (!this.selectedCompany) {
            controlPanel.style.display = 'none';
            noCompanyMsg.style.display = 'block';
            return;
        }

        const company = this.selectedCompany;
        const isPerfect = company.marketStructure === 'perfect_competition';

        controlPanel.style.display = 'block';
        noCompanyMsg.style.display = 'none';

        const nameEl = document.getElementById('selectedCompanyName');
        if (nameEl) nameEl.textContent = company.name;

        // Цену нельзя менять вручную — она всегда рассчитывается
        const priceInput = document.getElementById('priceInput');
        if (priceInput) {
            priceInput.value    = Math.round(company.productPrice);
            priceInput.disabled = true;
            priceInput.title    = 'Цена рассчитывается автоматически из условия оптимума';
        }

        // Производство можно менять только для монополий/олигополий
        const prodInput = document.getElementById('productionInput');
        const btnProd   = document.getElementById('btnApplyProduction');
        if (prodInput) {
            prodInput.value    = Math.round(company.production);
            prodInput.disabled = isPerfect;
            prodInput.title    = isPerfect
                ? 'В совершенной конкуренции объём задаётся рынком (P=MC)'
                : '';
        }
        if (btnProd) {
            btnProd.disabled = isPerfect;
            btnProd.className = isPerfect ? 'btn btn-small btn-disabled' : 'btn btn-small';
        }

        this.updateCompanyDetails();
        this.renderChart(company);
    }

    updateCompanyDetails() {
        if (!this.selectedCompany) return;
        const panel = document.getElementById('companyDetails');
        if (!panel) return;

        const company = this.selectedCompany;
        const info = company.getDetailedInfo();
        const isPerfect  = company.marketStructure === 'perfect_competition';
        const isMonopoly = company.marketStructure === 'monopoly';
        const isCournot  = company.marketStructure === 'cournot';
        const isStack    = company.marketStructure === 'stackelberg_follower';

        let extraHtml = '';

        if (isMonopoly) {
            const res = company._lastResult || {};
            extraHtml = `
            <div class="detail-item formula-item">
                <span class="detail-label">MR = MC условие:</span>
                <span class="detail-value formula-cost">MR = ${res.MR ?? '?'} | MC = ${res.MC ?? '?'}</span>
            </div>`;
        }

        if (isCournot) {
            const res = company._lastResult || {};
            extraHtml = `
            <div class="detail-item formula-item">
                <span class="detail-label">Линия реакции 1 (вы):</span>
                <span class="detail-value formula-cost">${res.reaction1 ?? ''}</span>
            </div>
            <div class="detail-item formula-item">
                <span class="detail-label">Линия реакции 2 (конкурент):</span>
                <span class="detail-value formula-cost">${res.reaction2 ?? ''}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Выпуск конкурента Q₂:</span>
                <span class="detail-value">${Math.round(company.competitorProduction)} ед.</span>
            </div>
            <div class="detail-item formula-item">
                <span class="detail-label">Издержки конкурента:</span>
                <span class="detail-value formula-cost">${company.getCompetitorCostFormula()}</span>
            </div>`;
        }

        if (isStack) {
            const res = company._lastResult || {};
            extraHtml = `
            <div class="detail-item formula-item">
                <span class="detail-label">Реакция последователя (вы):</span>
                <span class="detail-value formula-cost">${res.reactionFollower ?? ''}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Выпуск лидера Q_L:</span>
                <span class="detail-value">${Math.round(company.competitorProduction)} ед.</span>
            </div>
            <div class="detail-item formula-item">
                <span class="detail-label">Издержки лидера:</span>
                <span class="detail-value formula-cost">${company.getCompetitorCostFormula()}</span>
            </div>`;
        }

        if (isPerfect) {
            extraHtml = `
            <div class="detail-item formula-item">
                <span class="detail-label">Условие оптимума:</span>
                <span class="detail-value formula-cost">P = MC (цена = предельные издержки)</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Примечание:</span>
                <span class="detail-value" style="font-size:0.85em;color:#7f8c8d;">В долгосрочном периоде прибыль → 0</span>
            </div>`;
        }

        panel.style.display = 'block';
        panel.innerHTML = `
        <h4>📊 Информация о компании</h4>
        <div class="simple-details">
            <div class="detail-item">
                <span class="detail-label">Структура рынка:</span>
                <span class="detail-value">${info.marketStructure}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Оптимальный Q*:</span>
                <span class="detail-value">${Math.round(company.production).toLocaleString('ru-RU')} ед.</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Цена P*:</span>
                <span class="detail-value">${Math.round(company.productPrice).toLocaleString('ru-RU')} ₽</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Выручка TR:</span>
                <span class="detail-value">${Math.round(company.revenue).toLocaleString('ru-RU')} ₽</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Издержки TC:</span>
                <span class="detail-value">${Math.round(company.totalCost).toLocaleString('ru-RU')} ₽</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Прибыль π:</span>
                <span class="detail-value ${company.profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                    ${company.profit >= 0 ? '+' : ''}${Math.round(company.profit).toLocaleString('ru-RU')} ₽
                </span>
            </div>
            <div class="detail-item formula-item">
                <span class="detail-label">Функция спроса:</span>
                <span class="detail-value formula-demand">${info.demandFormula}</span>
            </div>
            <div class="detail-item formula-item">
                <span class="detail-label">Функция издержек:</span>
                <span class="detail-value formula-cost">${info.costFormula}</span>
            </div>
            ${extraHtml}
        </div>

        <!-- Проверка ответа игрока -->
        <div class="profit-checker" style="margin-top:20px;">
            <h4>🧮 Проверить свой расчёт</h4>
            <div class="input-with-button" style="margin-top:10px;">
                <input type="number" id="playerProfitInput" placeholder="Введите вашу прибыль...">
                <button id="btnCheckProfit" class="btn btn-small btn-warning">Проверить</button>
            </div>
            <div id="profitCheckResult" style="margin-top:10px;"></div>
        </div>`;

        // Перепривязываем кнопку проверки (она создалась заново)
        const btnCheck = document.getElementById('btnCheckProfit');
        if (btnCheck) btnCheck.addEventListener('click', () => this.checkPlayerProfit());
    }

    checkPlayerProfit() {
        if (!this.selectedCompany) return;
        const input = document.getElementById('playerProfitInput');
        const resultEl = document.getElementById('profitCheckResult');
        if (!input || !resultEl) return;

        const playerAnswer = parseFloat(input.value);
        if (isNaN(playerAnswer)) {
            resultEl.innerHTML = '<span style="color:#e74c3c;">Введите числовое значение</span>';
            return;
        }

        const correct = this.selectedCompany.profit;
        const diff    = Math.abs(correct - playerAnswer);
        const tolerance = Math.max(5, Math.abs(correct) * 0.01); // 1% допуск

        if (diff <= tolerance) {
            resultEl.innerHTML = `<div class="check-correct">✅ Верно! Прибыль = ${correct.toLocaleString('ru-RU')} ₽</div>`;
        } else {
            const company = this.selectedCompany;
            const isPerfect = company.marketStructure === 'perfect_competition';
            const isMonopoly = company.marketStructure === 'monopoly';

            let hint = '';
            if (isPerfect) {
                hint = `Подсказка: P = MC → ${company.demandA} - ${company.demandB}Q = ${company.costB}${company.costA ? ' + ' + (2*company.costA) + 'Q' : ''}, найдите Q*, затем π = TR - TC`;
            } else if (isMonopoly) {
                hint = `Подсказка: MR = MC → ${company.demandA} - ${2*company.demandB}Q = ${company.costB}${company.costA ? ' + ' + (2*company.costA) + 'Q' : ''}, найдите Q*, P*, π = P·Q - TC`;
            } else {
                hint = `Подсказка: используйте линии реакции для нахождения Nash-равновесия, затем π = P·Q₁ - TC₁`;
            }

            resultEl.innerHTML = `
            <div class="check-wrong">
                ❌ Неверно. Ваш ответ: ${playerAnswer.toLocaleString('ru-RU')} ₽<br>
                Правильный ответ: ${correct.toLocaleString('ru-RU')} ₽<br>
                <small>${hint}</small>
            </div>`;
        }
    }

    // ─── Графики (Chart.js) ──────────────────────────────────────────────────────
    renderChart(company) {
        const canvas = document.getElementById('companyChart');
        if (!canvas) return;

        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }

        const data = company.getChartData();
        const labels = data.demand.map(d => d.Q);

        const datasets = [
            {
                label: 'Спрос (D)',
                data: data.demand.map(d => d.P),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52,152,219,0.08)',
                borderWidth: 2,
                pointRadius: 0,
                fill: false
            },
            {
                label: 'MC',
                data: data.mc.map(d => Math.max(0, d.MC)),
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231,76,60,0.08)',
                borderWidth: 2,
                pointRadius: 0,
                fill: false
            }
        ];

        // Для монополий добавляем MR
        if (company.marketStructure === 'monopoly' || company.marketStructure.includes('oligopoly') || company.marketStructure === 'cournot' || company.marketStructure === 'stackelberg_follower') {
            datasets.push({
                label: 'MR',
                data: data.mr.map(d => d.MR),
                borderColor: '#9b59b6',
                backgroundColor: 'rgba(155,89,182,0.08)',
                borderWidth: 2,
                borderDash: [6, 3],
                pointRadius: 0,
                fill: false
            });
        }

        this.chartInstance = new Chart(canvas, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Nunito', size: 12 }, boxWidth: 20 } },
                    tooltip: {
                        callbacks: {
                            afterBody: items => {
                                const Q = labels[items[0].dataIndex];
                                if (Q === company.production) return [`── Q* = ${Q} (оптимум)`];
                                return [];
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            optLine: {
                                type: 'line',
                                xMin: company.production,
                                xMax: company.production,
                                borderColor: '#27ae60',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: { content: `Q*=${company.production}`, enabled: true, position: 'start', color: '#27ae60', font: { size: 11 } }
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Q (выпуск)', font: { family: 'Nunito' } }, grid: { color: 'rgba(0,0,0,0.05)' } },
                    y: { title: { display: true, text: 'Цена / Издержки', font: { family: 'Nunito' } }, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
                }
            }
        });
    }

    // ─── Золотовалютный рынок ─────────────────────────────────────────────────
    updateStockMarketPanel(state) {
        const smState = state.stockMarket;
        if (!smState) return;

        const fmt = n => Math.round(n).toLocaleString('ru-RU');

        const goldPrice  = document.getElementById('goldPrice');
        const platPrice  = document.getElementById('platinumPrice');
        const goldQty    = document.getElementById('goldQty');
        const platQty    = document.getElementById('platinumQty');
        const insiderEl  = document.getElementById('insiderInfoDisplay');

        if (goldPrice)  goldPrice.textContent  = `${fmt(smState.metals.gold.currentPrice)} ₽/ед.`;
        if (platPrice)  platPrice.textContent  = `${fmt(smState.metals.platinum.currentPrice)} ₽/ед.`;
        if (goldQty)    goldQty.textContent    = `В портфеле: ${smState.metals.gold.quantity} ед.`;
        if (platQty)    platQty.textContent    = `В портфеле: ${smState.metals.platinum.quantity} ед.`;

        if (insiderEl) {
            if (smState.insiderInfo.hasInfo) {
                const shock = smState.insiderInfo.revealedShock;
                insiderEl.innerHTML = `<div class="insider-active">
                    🔍 Инсайд активен (${smState.insiderInfo.roundsRemaining} раунда)<br>
                    <strong>${shock?.name || '?'}</strong><br>
                    <small>${shock?.description || ''}</small>
                </div>`;
            } else {
                insiderEl.innerHTML = `<div class="insider-inactive">ℹ️ Нет активной инсайдерской информации</div>`;
            }
        }
    }

    buyMetal(type) {
        const qtyInput = document.getElementById(`${type}BuyQty`);
        const qty = parseInt(qtyInput?.value || '1');
        const result = this.gameEngine.buyMetal(type, qty);
        if (result && result.success) {
            this.gameEngine.player.capital -= result.cost;
            this.gameEngine.player.netWorth = this.gameEngine.player.calculateNetWorth();
            this.updateUI();
            this.showToast(`Куплено ${qty} ед. ${type === 'gold' ? 'золота' : 'платины'} за ${Math.round(result.cost).toLocaleString('ru-RU')} ₽`);
        } else {
            this.showToast('Недостаточно средств', 'error');
        }
    }

    sellMetal(type) {
        const qtyInput = document.getElementById(`${type}SellQty`);
        const qty = parseInt(qtyInput?.value || '1');
        const result = this.gameEngine.sellMetal(type, qty);
        if (result && result.success) {
            this.gameEngine.player.capital += result.value;
            this.gameEngine.player.netWorth = this.gameEngine.player.calculateNetWorth();
            this.updateUI();
            this.showToast(`Продано ${qty} ед. за ${Math.round(result.value).toLocaleString('ru-RU')} ₽`);
        } else {
            this.showToast('Недостаточно активов для продажи', 'error');
        }
    }

    buyInsiderInfo() {
        const result = this.gameEngine.buyInsiderInfo();
        if (result && result.success) {
            this.gameEngine.player.capital -= result.cost;
            this.gameEngine.player.netWorth = this.gameEngine.player.calculateNetWorth();
            this.updateUI();
            this.showToast(`Инсайд куплен! Будущий шок: "${result.shock.name}"`);
        } else {
            this.showToast('Недостаточно средств или информация уже куплена', 'error');
        }
    }

    // ─── Прочие методы ───────────────────────────────────────────────────────────
    selectCompany(companyId) {
        const state   = this.gameEngine.getGameState();
        const company = state.player.companies.find(c => c.id === companyId);
        if (company) {
            this.selectedCompany = company;
            this.updateUI();
        }
    }

    applyProductionChange() {
        if (!this.selectedCompany) return;
        if (this.selectedCompany.marketStructure === 'perfect_competition') {
            this.showToast('В совершенной конкуренции выпуск задаётся рынком (P = MC)', 'error');
            return;
        }
        const input = document.getElementById('productionInput');
        if (!input) return;
        const newProd = parseInt(input.value, 10);
        if (isNaN(newProd) || newProd < 0) { this.showToast('Введите корректный объём', 'error'); return; }
        this.gameEngine.updateCompany(this.selectedCompany.id, { production: newProd });
        this.updateUI();
    }

    sellSelectedCompany() {
        if (!this.selectedCompany) return;
        if (confirm(`Продать компанию "${this.selectedCompany.name}"?`)) {
            const sellPrice = this.gameEngine.sellCompany(this.selectedCompany.id);
            if (sellPrice) {
                this.showToast(`Компания продана за ${Math.round(sellPrice).toLocaleString('ru-RU')} ₽`);
                this.selectedCompany = null;
                if (this.chartInstance) { this.chartInstance.destroy(); this.chartInstance = null; }
                this.updateUI();
            }
        }
    }

    showCompanyDetails() {
        if (!this.selectedCompany) return;
        this.updateCompanyDetails();
    }

    showBuyCompanyModal() {
        const state = this.gameEngine.getGameState();
        if (!state.availableCompanies || state.availableCompanies.length === 0) {
            this.showToast('Все компании уже куплены!', 'error');
            return;
        }

        const modalHtml = `
        <div class="modal-overlay" id="buyCompanyModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🛒 Купить компанию</h3>
                    <p class="modal-subtitle">Ваш капитал: ${Math.round(state.player.capital).toLocaleString('ru-RU')} ₽</p>
                </div>
                <div class="modal-body">
                    <div class="companies-grid">
                        ${state.availableCompanies.map(company => {
                            const canAfford = state.player.capital >= company.basePrice;
                            const mktName   = company.getMarketStructureName ? company.getMarketStructureName() : '';
                            return `
                            <div class="company-option ${canAfford ? '' : 'disabled'}">
                                <div class="company-option-header">
                                    <span class="company-icon">${company.icon || '🏢'}</span>
                                    <div>
                                        <h4>${company.name}</h4>
                                        <p class="company-price">${Math.round(company.basePrice).toLocaleString('ru-RU')} ₽</p>
                                        <p class="company-structure">${mktName}</p>
                                    </div>
                                </div>
                                <p class="company-description">${company.description || ''}</p>
                                <button class="btn ${canAfford ? 'btn-primary' : 'btn-disabled'} btn-buy-company"
                                    data-id="${company.id}" ${!canAfford ? 'disabled' : ''}>
                                    ${canAfford ? 'Купить компанию' : 'Недостаточно средств'}
                                </button>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-close-modal">Закрыть</button>
                </div>
            </div>
        </div>`;

        this.closeModal();
        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        document.body.appendChild(div.firstElementChild);

        document.querySelectorAll('.btn-buy-company:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', e => {
                this.buyCompany(e.target.dataset.id);
                this.closeModal();
            });
        });
        document.querySelector('.btn-close-modal')?.addEventListener('click', () => this.closeModal());
        document.querySelector('.modal-overlay')?.addEventListener('click', e => {
            if (e.target.classList.contains('modal-overlay')) this.closeModal();
        });
    }

    buyCompany(companyId) {
        const success = this.gameEngine.buyCompany(companyId);
        if (success) {
            this.updateUI();
            this.showToast('Компания успешно куплена!');
        } else {
            this.showToast('Не удалось купить компанию. Проверьте баланс.', 'error');
        }
    }

    closeModal() {
        document.getElementById('buyCompanyModal')?.remove();
    }

    updateRoundStatus(result) {
        const el = document.getElementById('roundStatus');
        if (!el || !result) return;
        const p = Math.round(result.totalProfit || 0);
        el.textContent = `Раунд ${result.round} завершён. Прибыль: ${p >= 0 ? '+' : ''}${p.toLocaleString('ru-RU')} ₽`;
    }

    updateQuickAnalytics(result) {
        const el = document.getElementById('quickAnalytics');
        if (!el || !result) return;

        const total = Math.round(result.totalProfit || 0);
        const cls   = total >= 0 ? 'profit-positive' : 'profit-negative';
        const sign  = total >= 0 ? '+' : '';

        const rows = (result.companyProfits || []).map(c => {
            const p  = Math.round(c.profit || 0);
            const pc = p >= 0 ? 'profit-positive' : 'profit-negative';
            const ps = p >= 0 ? '+' : '';
            return `<div class="detail-row">
                <span>${c.name}</span>
                <span class="${pc}">${ps}${p.toLocaleString('ru-RU')} ₽</span>
            </div>`;
        }).join('');

        el.innerHTML = `
        <div class="analytics-summary">
            <h3 style="margin-bottom:15px;">Итоги раунда ${result.round}</h3>
            <div class="detail-row">
                <span>Общая прибыль</span>
                <span class="${cls}">${sign}${total.toLocaleString('ru-RU')} ₽</span>
            </div>
            ${rows || '<p style="margin-top:12px;color:#7f8c8d;">Нет компаний</p>'}
        </div>`;
    }

    showToast(message, type = 'success') {
        const existing = document.getElementById('gameToast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'gameToast';
        toast.className = `game-toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('toast-visible'), 50);
        setTimeout(() => { toast.classList.remove('toast-visible'); setTimeout(() => toast.remove(), 300); }, 3000);
    }

    saveGame() {
        const state = this.gameEngine.getGameState();
        localStorage.setItem('econSave', JSON.stringify({
            round: state.round,
            capital: state.player.capital,
            netWorth: state.player.netWorth
        }));
        this.showToast('Игра сохранена');
    }

    loadGame() {
        this.showToast('Загрузка пока недоступна', 'error');
    }
}

window.UIManager = UIManager;