export function checkDecision(company, Q, userProfit, env) {
  const realProfit = company.profit(Q, env);
  const diff = Math.abs(realProfit - userProfit);

  return {
    realProfit,
    isCorrect: diff < 1e-2,
    message: diff < 1e-2
      ? " Прибыль рассчитана верно"
      : ` Ошибка. Реальная прибыль: ${realProfit.toFixed(2)}`
  };
}
