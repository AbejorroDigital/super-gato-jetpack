/**
 * @class MainMenuScene
 * @extends Phaser.Scene
 * @description Escena que muestra el menú principal, el título y los botones de selección de dificultad.
 * Gestiona la interacción del jugador para iniciar el juego con diferentes niveles de dificultad.
 * 
 * @example
 * // Transición típica desde BootScene
 * this.scene.start('MainMenuScene');
 */
class MainMenuScene extends Phaser.Scene {
    /**
     * @constructor
     * Crea una instancia de MainMenuScene.
     */
    constructor() {
        super('MainMenuScene');
    }

    /**
     * @method create
     * @description Inicializa los elementos de la interfaz: fondo, texto del título y botones interactivos de dificultad.
     * 
     * @listens Phaser.Input.Events#POINTER_DOWN
     * @listens Phaser.Input.Events#POINTER_OVER
     * @listens Phaser.Input.Events#POINTER_OUT
     * 
     * @fires Phaser.Scenes.Events#CREATE
     * @returns {void}
     */
    create() {
        /** @type {Phaser.GameObjects.TileSprite} Sprite de fondo que cubre la pantalla */
        this.add.tileSprite(0, 0, 800, 600, 'background').setOrigin(0);

        /** @type {Phaser.GameObjects.Text} Título principal del juego */
        this.add.text(400, 150, 'Super Gato Jetpack', {
            fontSize: '48px',
            fill: '#0ff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        /** @type {string[]} Lista de configuraciones de dificultad disponibles */
        const difficulties = ['EASY', 'NORMAL', 'HARD'];

        difficulties.forEach((diff, i) => {
            /** @type {Phaser.GameObjects.Text} Botón de selección de dificultad */
            let btn = this.add.text(400, 300 + (i * 70), diff, {
                fontSize: '32px',
                fill: '#fff',
                stroke: '#000',
                strokeThickness: 3
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            /**
             * Manejador de evento para el clic en el botón.
             * Inicia la GameScene con la dificultad seleccionada.
             */
            btn.on('pointerdown', () => {
                this.scene.start('GameScene', { difficulty: diff });
            });

            /** Efecto hover: resalta el texto en amarillo */
            btn.on('pointerover', () => btn.setStyle({ fill: '#ff0' }));
            /** Efecto reset: devuelve el texto a blanco */
            btn.on('pointerout', () => btn.setStyle({ fill: '#fff' }));
        });
    }
}
