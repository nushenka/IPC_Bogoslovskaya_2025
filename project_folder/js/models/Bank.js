// js/models/Bank.js
class Bank {
    constructor() {
        this.loans = [];
        this.interestRate = 9;
        this.loanMarkup = 1;
        this.maxLoanAmount = 5000000;
        this.defaultDuration = 4;
        this.currentRound = 1;
    }
    
    takeLoan(player, amount, centralBankRate) {
        if (amount <= 0) {
            return { success: false, message: "Введите корректную сумму кредита" };
        }

        if (amount > this.maxLoanAmount) {
            return { success: false, message: 'Сумма превышает максимальный лимит' };
        }

        const interestRate = Math.round((centralBankRate + this.loanMarkup) * 100) / 100;
        const duration = this.defaultDuration;
        const totalDue = this.calculateTotalDue(amount, interestRate);

        const loan = {
            id: 'loan_' + Date.now(),
            amount: amount,
            duration: duration,
            interestRate,
            startRound: this.currentRound,
            dueRound: this.currentRound + duration,
            totalDue,
            remainingBalance: totalDue
        };

        this.loans.push(loan);
        player.capital += amount;

        return {
            success: true,
            loan: loan,
            message: `Кредит одобрен: ${amount.toLocaleString()}₽, к возврату через 4 раунда ${Math.round(totalDue).toLocaleString()}₽`
        };
    }

    calculateTotalDue(amount, interestRate) {
        return Math.round(amount * (1 + interestRate / 100));
    }

    update(player, centralBankRate) {
        this.currentRound++;
        this.interestRate = Math.round((centralBankRate + this.loanMarkup) * 100) / 100;

        const reports = [];
        const activeLoans = [];

        this.loans.forEach((loan) => {
            if (loan.dueRound <= this.currentRound) {
                player.capital -= loan.totalDue;
                loan.remainingBalance = 0;
                reports.push({
                    loanId: loan.id,
                    amount: loan.amount,
                    totalDue: loan.totalDue,
                    paid: true
                });
            } else {
                activeLoans.push(loan);
            }
        });

        this.loans = activeLoans;
        return reports;
    }

    getLoanInfo() {
        return {
            interestRate: Math.round(this.interestRate * 100) / 100,
            maxLoanAmount: this.maxLoanAmount,
            defaultDuration: this.defaultDuration,
            activeLoans: this.loans.length,
            totalDebt: this.loans.reduce((sum, loan) => sum + loan.remainingBalance, 0),
            loans: this.loans
        };
    }
}

export { Bank };

if (typeof window !== "undefined") {
    window.Bank = Bank;
}
