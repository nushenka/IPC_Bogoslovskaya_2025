import { checkDecision } from "./decisionChecker.js";

export function nextRound(player, companies, env) {
  companies.forEach(c => {
    if (!c.ownedByPlayer) return;

    const userProfit = Number(
      prompt(`Введите рассчитанную прибыль для ${c.name}`)
    );

    const result = checkDecision(
      c,
      c.currentProduction,
      userProfit,
      env
    );

    alert(result.message);
    if (result.isCorrect) {
      player.capital += result.realProfit;
    }
  });

  env.roundNum++;
  player.updateBank(env.interestRate());
}
