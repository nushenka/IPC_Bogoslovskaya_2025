// js/utils/helpers.js
const Helpers = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },
    
    formatNumber: (num) => {
        return new Intl.NumberFormat('ru-RU').format(num);
    },
    
    randomBetween: (min, max) => {
        return min + Math.random() * (max - min);
    }
};

// Делаем доступным глобально
window.Helpers = Helpers;