/**
 * @file main.js
 * @description Punto de entrada de la aplicación. Configura la instancia de Phaser Game con la 
 * configuración centralizada y la lista de escenas.
 */

/**
 * @type {Phaser.Types.Core.GameConfig}
 * @description Objeto de configuración principal que fusiona la CONFIG global y el registro de escenas.
 */
const config = {
    ...CONFIG,
    scene: [BootScene, MainMenuScene, GameScene, GameOverScene],
    parent: 'game-container'
};

/**
 * @constant {Phaser.Game} game
 * @description La instancia global de Phaser Game.
 */
const game = new Phaser.Game(config);
