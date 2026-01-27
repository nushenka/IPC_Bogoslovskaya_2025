export class CostFunction {
  constructor(fixed, marginalBase, sector) {
    this.fixed = fixed;
    this.marginalBase = marginalBase;
    this.sector = sector;
  }

  total(Q, env) {
    return this.fixed + this.marginalBase * env.costMultiplier(this.sector) * Q;
  }

  toString() {
    return `C(Q) = ${this.fixed} + ${this.marginalBase}Q`;
  }
}
