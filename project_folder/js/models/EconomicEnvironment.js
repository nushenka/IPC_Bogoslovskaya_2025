export class EconomicEnvironment {
  constructor(activeShocks = [], baseInterestRate = 0.08, roundNum = 1) {
    this.activeShocks = activeShocks;
    this.baseInterestRate = baseInterestRate;
    this.roundNum = roundNum;
  }

  demandMultiplier(sector) {
    return this.activeShocks.reduce(
      (m, s) => m * (s.demandEffects?.[sector] || 1),
      1
    );
  }

  costMultiplier(sector) {
    return this.activeShocks.reduce(
      (m, s) => m * (s.costEffects?.[sector] || 1),
      1
    );
  }

  interestRate() {
    return Math.max(this.baseInterestRate, 0);
  }
}
