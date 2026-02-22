/**
 * @class BootScene
 * @extends Phaser.Scene
 * @description Escena inicial encargada de la precarga de todos los recursos del juego y la configuración del entorno global.
 * Actúa como el punto de entrada para el pipeline de recursos de Phaser, iterando a través de la configuración definida en ASSETS.
 * 
 * @example
 * // La escena es instanciada automáticamente por el motor en main.js
 * game.scene.add('BootScene', BootScene, true);
 */
class BootScene extends Phaser.Scene {
    /**
     * @constructor
     * Crea una instancia de BootScene.
     */
    constructor() {
        super('BootScene');
    }

    /**
     * @method preload
     * @description Precarga todas las imágenes y archivos de audio requeridos para el juego.
     * Lógica: Itera sobre el objeto `ASSETS` de Config.js. Si la clave es 'music' o 'explosion', 
     * lo carga como audio; de lo contrario, lo carga como imagen.
     * 
     * @returns {void}
     * @throws {Error} Registra en consola si un recurso no logra cargarse según el manejador interno de Phaser.
     */
    preload() {
        // Carga todos los recursos definidos en ASSETS (Config.js)
        Object.keys(ASSETS).forEach(key => {
            if (key === 'music' || key === 'explosion') {
                this.load.audio(key, ASSETS[key]);
            } else {
                this.load.image(key, ASSETS[key]);
            }
        });
    }

    /**
     * @method create
     * @description Transiciona el juego a la escena MainMenuScene una vez que todos los recursos han sido cargados.
     * @fires Phaser.Scenes.Events#CREATE
     * @returns {void}
     */
    create() {
        this.scene.start('MainMenuScene');
    }
}
