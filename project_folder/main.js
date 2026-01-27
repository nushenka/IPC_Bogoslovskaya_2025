// main.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, начинаем инициализацию...');
    
    try {
        // Создаем экземпляры
        const gameEngine = new GameEngine();
        const uiManager = new UIManager(gameEngine);
        
        // Инициализируем игру
        gameEngine.initialize();
        uiManager.initialize();
        
        // Делаем глобально доступными для отладки
        window.gameEngine = gameEngine;
        window.uiManager = uiManager;
        
        console.log('Игра успешно запущена!');
        
    } catch (error) {
        console.error('Критическая ошибка при запуске игры:', error);
        alert('Ошибка загрузки игры: ' + error.message);
    }
});