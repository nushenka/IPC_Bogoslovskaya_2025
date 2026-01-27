export class LinearDemand {
  constructor(aBase, b, sector) {
    this.aBase = aBase;
    this.b = b;
    this.sector = sector;
  }

  price(Q, env) {
    return Math.max(
      0,
      this.aBase * env.demandMultiplier(this.sector) - this.b * Q
    );
  }

  toString() {
    return `P = ${this.aBase} − ${this.b}Q`;
  }
}
