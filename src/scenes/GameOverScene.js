/**
 * @class GameOverScene
 * @extends Phaser.Scene
 * @description Escena que muestra la pantalla de fin de juego, indicando si el jugador ganó o perdió.
 * Proporciona un mensaje de retroalimentación y una opción para reiniciar el juego.
 * 
 * @example
 * // Activado desde GameScene cuando las vidas llegan a 0 o el Jefe es derrotado
 * this.scene.start('GameOverScene', { win: true });
 */
class GameOverScene extends Phaser.Scene {
    /**
     * @constructor
     * Crea una instancia de GameOverScene.
     */
    constructor() {
        super('GameOverScene');
    }

    /**
     * @method init
     * @description Recibe datos de la escena anterior para determinar el resultado del juego.
     * @param {Object} data - Datos pasados a la escena.
     * @param {boolean} data.win - Indica si el jugador ganó (true) o perdió (false).
     * @returns {void}
     */
    init(data) {
        /** @type {boolean} Indicador interno del estado de victoria */
        this.win = data.win;
    }

    /**
     * @method create
     * @description Renderiza el texto de fin de juego y configura el escucha para reiniciar.
     * 
     * @listens Phaser.Input.Events#POINTER_DOWN
     * @fires Phaser.Scenes.Events#CREATE
     * @returns {void}
     */
    create() {
        /** @type {string} Mensaje dinámico basado en el estado de victoria/derrota */
        const text = this.win ? 'Miaaau... que bien!' : 'Ja, ja, ja, perdiste!';
        /** @type {string} Código de color: Verde para victoria, Rojo para derrota */
        const color = this.win ? '#0f0' : '#f00';

        /** @type {Phaser.GameObjects.Text} Texto principal del resultado */
        this.add.text(400, 300, text, {
            fontSize: '64px',
            fill: color,
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        /** @type {Phaser.GameObjects.Text} Texto de ayuda para reiniciar */
        this.add.text(400, 400, 'Click to Restart', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        /** Regresa a MainMenuScene al hacer clic o tocar con el ratón */
        this.input.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }
}
