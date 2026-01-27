export class Company {
  constructor(name, sector, demand, costs, structure, competitors, price) {
    this.name = name;
    this.price = price;
    this.ownedByPlayer = false;
  }

  buy(player) {
    if (this.ownedByPlayer) return false;
    if (player.capital < this.price) return false;

    player.capital -= this.price;
    this.ownedByPlayer = true;
    return true;
  }
}
