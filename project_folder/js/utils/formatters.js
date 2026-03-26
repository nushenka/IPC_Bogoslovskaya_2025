export function formatCurrency(value) {
    return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

export function formatNumber(value) {
    return Math.round(value).toLocaleString('ru-RU');
}