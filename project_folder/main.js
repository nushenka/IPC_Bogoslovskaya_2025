import { Player } from "./js/models/Player.js";
import { Company } from "./js/models/Company.js";
import { LinearDemand } from "./js/models/Demand.js";
import { CostFunction } from "./js/models/Cost.js";
import { EconomicEnvironment } from "./js/models/EconomicEnvironment.js";

import { displayCompanies } from "./js/ui/displayCompanies.js";

// ===== ГЛОБАЛЬНО =====
let player;
let env;
let companies = [];

// ===== СТАРТ ИГРЫ =====
function startGame() {
  player = new Player("Игрок");
  env = new EconomicEnvironment([]);

  companies = [
    new Company(
      "ВШЭнефть",
      "ENERGY",
      new LinearDemand(900, 2, "ENERGY"),
      new CostFunction(200, 50, "ENERGY"),
      "MONOPOLY",
      0,
      1500
    )
  ];

  displayCompanies(companies, player);
}

document
  .getElementById("startButton")
  .addEventListener("click", startGame);
