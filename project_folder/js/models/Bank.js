// js/models/Bank.js
class Bank {
    constructor() {
        this.loans = [];
        this.interestRate = 7.5; // Базовая ставка
        this.maxLoanAmount = 5000000;
        this.currentRound = 1;
    }
    
    // Взять кредит
    takeLoan(player, amount, duration) {
        if (amount > this.maxLoanAmount) {
            return { success: false, message: 'Сумма превышает максимальный лимит' };
        }
        
        if (player.capital < amount * 0.1) {
            return { success: false, message: 'Недостаточно средств для залога' };
        }
        
        const loan = {
            id: 'loan_' + Date.now(),
            amount: amount,
            duration: duration,
            interestRate: this.interestRate,
            startRound: this.currentRound,
            paymentsMade: 0,
            totalPayments: duration,
            monthlyPayment: this.calculateMonthlyPayment(amount, duration),
            remainingBalance: amount
        };
        
        this.loans.push(loan);
        player.capital += amount;
        
        return {
            success: true,
            loan: loan,
            message: `Кредит одобрен на сумму ${amount.toLocaleString()}₽`
        };
    }
    
    // Рассчитать ежемесячный платеж
    calculateMonthlyPayment(amount, duration) {
        const monthlyRate = this.interestRate / 100 / 12;
        return amount * monthlyRate * Math.pow(1 + monthlyRate, duration) / 
               (Math.pow(1 + monthlyRate, duration) - 1);
    }
    
    // Выплатить кредит
    makePayment(player, loanId) {
        const loanIndex = this.loans.findIndex(l => l.id === loanId);
        if (loanIndex === -1) return { success: false, message: 'Кредит не найден' };
        
        const loan = this.loans[loanIndex];
        const paymentAmount = loan.monthlyPayment;
        
        if (player.capital >= paymentAmount) {
            player.capital -= paymentAmount;
            loan.paymentsMade++;
            loan.remainingBalance -= paymentAmount;
            
            if (loan.paymentsMade >= loan.totalPayments) {
                this.loans.splice(loanIndex, 1);
                return { 
                    success: true, 
                    message: 'Кредит полностью погашен!',
                    loanFullyPaid: true 
                };
            }
            
            return { 
                success: true, 
                message: `Платеж ${paymentAmount.toLocaleString()}₽ принят`,
                paymentsRemaining: loan.totalPayments - loan.paymentsMade
            };
        }
        
        return { 
            success: false, 
            message: 'Недостаточно средств для платежа',
            requiredAmount: paymentAmount
        };
    }
    
    // Обновить кредиты (каждый раунд)
    update() {
        this.currentRound++;
        
        // Увеличиваем ставку если много кредитов
        if (this.loans.length > 5) {
            this.interestRate *= 1.05;
        }
        
        // Снижаем ставку если мало кредитов
        if (this.loans.length < 2) {
            this.interestRate *= 0.98;
        }
        
        this.interestRate = Math.max(5, Math.min(20, this.interestRate));
    }
    
    // Получить информацию о кредитах
    getLoanInfo(playerId) {
        const playerLoans = this.loans; // В будущем можно фильтровать по игроку
        
        return {
            interestRate: this.interestRate,
            maxLoanAmount: this.maxLoanAmount,
            activeLoans: playerLoans.length,
            totalDebt: playerLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0),
            monthlyPayment: playerLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0),
            loans: playerLoans
        };
    }
}

// Делаем доступным глобально
window.Bank = Bank;