// js/ui/UIManager.js
class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.selectedCompany = null;
    }

    initialize() {
        console.log('Инициализация UI...');
        
        // Проверяем, что элементы существуют
        if (!document.getElementById('playerCapital')) {
            console.error('Элемент playerCapital не найден!');
            return;
        }
        
        this.bindEvents();
        this.updateUI();
        
        console.log('UI инициализирован');
    }

    bindEvents() {
        // Кнопка следующего раунда
        const btnNextRound = document.getElementById('btnNextRound');
        if (btnNextRound) {
            btnNextRound.addEventListener('click', () => {
                const result = this.gameEngine.nextRound();
                this.updateUI();
                console.log('Раунд завершен:', result);
            });
        }

        // Кнопка покупки компании
        const btnBuyCompany = document.getElementById('btnBuyCompany');
        if (btnBuyCompany) {
            btnBuyCompany.addEventListener('click', () => {
                this.showBuyCompanyModal();
            });
        }
        
        // Кнопка применения цены
        const btnApplyPrice = document.getElementById('btnApplyPrice');
        if (btnApplyPrice) {
            btnApplyPrice.addEventListener('click', () => {
                this.applyPriceChange();
            });
        }
        
        // Кнопка применения производства
        const btnApplyProduction = document.getElementById('btnApplyProduction');
        if (btnApplyProduction) {
            btnApplyProduction.addEventListener('click', () => {
                this.applyProductionChange();
            });
        }
        
        // Кнопка продажи компании
        const btnSellCompany = document.getElementById('btnSellCompany');
        if (btnSellCompany) {
            btnSellCompany.addEventListener('click', () => {
                this.sellSelectedCompany();
            });
        }
        
        // Кнопка деталей компании (если есть)
        const btnCompanyDetails = document.getElementById('btnCompanyDetails');
        if (btnCompanyDetails) {
            btnCompanyDetails.addEventListener('click', () => {
                this.showCompanyDetails();
            });
        }
    }

    updateUI() {
        const state = this.gameEngine.getGameState();
        
        // Обновляем статистику игрока
        this.updatePlayerStats(state);
        
        // Обновляем список компаний
        this.updateCompaniesList(state);
        
        // Обновляем экономическую статистику
        this.updateEconomyStats(state);
        
        // Обновляем панель управления
        this.updateControlPanel(state);
    }
    
    updatePlayerStats(state) {
        const capitalEl = document.getElementById('playerCapital');
        const roundEl = document.getElementById('currentRound');
        const netWorthEl = document.getElementById('netWorth');
        
        if (capitalEl) capitalEl.textContent = state.player.capital.toLocaleString() + ' ₽';
        if (roundEl) roundEl.textContent = state.round;
        if (netWorthEl) netWorthEl.textContent = state.player.netWorth.toLocaleString() + ' ₽';
    }
    
    updateEconomyStats(state) {
        const inflationEl = document.getElementById('inflationRate');
        const interestEl = document.getElementById('interestRate');
        const taxEl = document.getElementById('taxRate');
        const globalDemandEl = document.getElementById('globalDemand');
        
        if (inflationEl) inflationEl.textContent = state.economy.inflation.toFixed(1) + '%';
        if (interestEl) interestEl.textContent = state.economy.interestRate.toFixed(1) + '%';
        if (taxEl) taxEl.textContent = state.economy.taxRate + '%';
        if (globalDemandEl) globalDemandEl.textContent = state.economy.globalDemand.toFixed(0) + '%';
    }
    
    updateCompaniesList(state) {
        const container = document.getElementById('companiesList');
        if (!container) {
            console.error('Контейнер companiesList не найден!');
            return;
        }
        
        let html = '';
        
        if (state.player.companies && state.player.companies.length > 0) {
            state.player.companies.forEach(company => {
                const profitClass = company.profit >= 0 ? 'profit-positive' : 'profit-negative';
                const profitSign = company.profit >= 0 ? '+' : '';
                
                html += `
                <div class="company-card ${this.selectedCompany?.id === company.id ? 'selected' : ''}" data-id="${company.id}">
                    <div class="company-header">
                        <span class="company-icon">${company.icon || '🏢'}</span>
                        <div class="company-title">
                            <h4>${company.name}</h4>
                            <span class="company-type">${company.type || ''}</span>
                        </div>
                        <span class="company-profit ${profitClass}">
                            ${profitSign}${Math.round(company.profit).toLocaleString()}₽
                        </span>
                    </div>
                    <div class="company-details">
                        <div class="detail-row">
                            <span>Цена:</span>
                            <span class="detail-value">${company.productPrice}₽</span>
                        </div>
                        <div class="detail-row">
                            <span>Производство:</span>
                            <span class="detail-value">${company.production.toLocaleString()} ед.</span>
                        </div>
                        <div class="detail-row">
                            <span>Спрос:</span>
                            <span class="detail-value">${company.demand ? company.demand.toLocaleString() : '?'} ед.</span>
                        </div>
                    </div>
                    <button class="btn-select-company" data-id="${company.id}">
                        Выбрать
                    </button>
                </div>
                `;
            });
        } else {
            html = '<div class="empty-message">У вас пока нет компаний. Купите первую!</div>';
        }
        
        container.innerHTML = html;
        
        // Добавляем обработчики выбора компаний
        container.querySelectorAll('.btn-select-company').forEach(button => {
            button.addEventListener('click', (e) => {
                const companyId = e.target.dataset.id;
                this.selectCompany(companyId);
                e.stopPropagation();
            });
        });
        
        // Добавляем обработчики клика по карточке
        container.querySelectorAll('.company-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-select-company')) {
                    const companyId = card.dataset.id;
                    this.selectCompany(companyId);
                }
            });
        });
    }
    
    updateControlPanel(state) {
        const controlPanel = document.getElementById('businessControls');
        const noCompanyMessage = document.getElementById('noCompanySelected');
        const detailsPanel = document.getElementById('companyDetails');
        
        if (this.selectedCompany && controlPanel && noCompanyMessage) {
            // Показываем панель управления
            controlPanel.style.display = 'block';
            noCompanyMessage.style.display = 'none';
            
            document.getElementById('selectedCompanyName').textContent = this.selectedCompany.name;
            document.getElementById('priceInput').value = this.selectedCompany.productPrice;
            document.getElementById('productionInput').value = this.selectedCompany.production;
            
            // Обновляем детали если панель существует
            if (detailsPanel) {
                this.updateCompanyDetails();
            }
        } else if (controlPanel && noCompanyMessage) {
            // Скрываем панель управления
            controlPanel.style.display = 'none';
            noCompanyMessage.style.display = 'block';
            if (detailsPanel) detailsPanel.style.display = 'none';
        }
    }
    
    updateCompanyDetails() {
        if (!this.selectedCompany) return;
        
        const detailsPanel = document.getElementById('companyDetails');
        if (!detailsPanel) return;
        
        // Простые детали без сложных формул
        detailsPanel.style.display = 'block';
        detailsPanel.innerHTML = `
            <h4>📊 Информация о компании</h4>
            <div class="simple-details">
                <div class="detail-item">
                    <span class="detail-label">Название:</span>
                    <span class="detail-value">${this.selectedCompany.name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Цена товара:</span>
                    <span class="detail-value">${this.selectedCompany.productPrice} ₽</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Объем производства:</span>
                    <span class="detail-value">${this.selectedCompany.production.toLocaleString()} ед.</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Прибыль:</span>
                    <span class="detail-value ${this.selectedCompany.profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                        ${this.selectedCompany.profit >= 0 ? '+' : ''}${Math.round(this.selectedCompany.profit).toLocaleString()} ₽
                    </span>
                </div>
            </div>
        `;
    }
    
    selectCompany(companyId) {
        const state = this.gameEngine.getGameState();
        const company = state.player.companies.find(c => c.id === companyId);
        
        if (company) {
            this.selectedCompany = company;
            this.updateUI();
        }
    }
    
    applyPriceChange() {
        if (!this.selectedCompany) return;
        
        const newPrice = parseFloat(document.getElementById('priceInput').value);
        if (isNaN(newPrice)) return;
        
        const success = this.gameEngine.updateCompany(this.selectedCompany.id, {
            price: newPrice
        });
        
        if (success) {
            this.selectedCompany.productPrice = newPrice;
            this.updateCompaniesList(this.gameEngine.getGameState());
            this.updateCompanyDetails();
        }
    }
    
    applyProductionChange() {
        if (!this.selectedCompany) return;
        
        const newProduction = parseInt(document.getElementById('productionInput').value);
        if (isNaN(newProduction)) return;
        
        const success = this.gameEngine.updateCompany(this.selectedCompany.id, {
            production: newProduction
        });
        
        if (success) {
            this.selectedCompany.production = newProduction;
            this.updateCompaniesList(this.gameEngine.getGameState());
            this.updateCompanyDetails();
        }
    }
    
    sellSelectedCompany() {
        if (!this.selectedCompany) return;
        
        if (confirm(`Продать компанию "${this.selectedCompany.name}"?`)) {
            const sellPrice = this.gameEngine.sellCompany(this.selectedCompany.id);
            if (sellPrice) {
                alert(`Компания продана за ${Math.round(sellPrice).toLocaleString()}₽`);
                this.selectedCompany = null;
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
        
        if (state.availableCompanies.length === 0) {
            alert('Все компании уже куплены!');
            return;
        }
        
        const modalHtml = `
            <div class="modal-overlay" id="buyCompanyModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🛒 Купить компанию</h3>
                        <p class="modal-subtitle">Ваш капитал: ${state.player.capital.toLocaleString()}₽</p>
                    </div>
                    
                    <div class="modal-body">
                        <div class="companies-grid">
                            ${state.availableCompanies.map(company => {
                                const canAfford = state.player.capital >= company.basePrice;
                                return `
                                <div class="company-option ${canAfford ? '' : 'disabled'}">
                                    <div class="company-option-header">
                                        <span class="company-icon">${company.icon || '🏢'}</span>
                                        <div>
                                            <h4>${company.name}</h4>
                                            <p class="company-price">${company.basePrice.toLocaleString()}₽</p>
                                        </div>
                                    </div>
                                    <p class="company-description">${company.description || 'Бизнес в экономическом симуляторе'}</p>
                                    <button class="btn ${canAfford ? 'btn-primary' : 'btn-disabled'} btn-buy-company" 
                                            data-id="${company.id}"
                                            ${!canAfford ? 'disabled' : ''}>
                                        ${canAfford ? 'Купить компанию' : 'Недостаточно средств'}
                                    </button>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary btn-close-modal">Закрыть</button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем модалку
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Обработчики событий
        document.querySelectorAll('.btn-buy-company:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const companyId = e.target.dataset.id;
                this.buyCompany(companyId);
                this.closeModal();
            });
        });
        
        document.querySelector('.btn-close-modal').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });
    }
    
    buyCompany(companyId) {
        const success = this.gameEngine.buyCompany(companyId);
        if (success) {
            this.updateUI();
            alert('Компания успешно куплена!');
        } else {
            alert('Не удалось купить компанию. Проверьте, хватает ли средств.');
        }
    }
    
    closeModal() {
        const modal = document.getElementById('buyCompanyModal');
        if (modal) {
            modal.remove();
        }
    }
}

// Делаем доступным глобально
window.UIManager = UIManager;