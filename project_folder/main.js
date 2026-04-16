import { GameEngine } from "./js/game/GameEngine.js";
import { UIManager } from "./js/ui/UIManager.js";

document.addEventListener("DOMContentLoaded", () => {
    try {
        const gameEngine = new GameEngine();
        gameEngine.initialize();

        const uiManager = new UIManager(gameEngine);
        uiManager.initialize();

        requestAnimationFrame(() => {
            document.body.classList.add("page-ready");
        });

        console.log("Игра успешно запущена");
    } catch (error) {
        console.error("Критическая ошибка при запуске:", error);
        alert("Ошибка загрузки игры: " + error.message);
    }
});
