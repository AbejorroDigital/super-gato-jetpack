/**
 * @class HealthManager
 * @description Componente desacoplado para gestionar la lógica de vida del jugador y la sincronización con GAME_STATE.
 * Evita que las vidas salgan del rango [0, 7].
 */
class HealthManager {
    /**
     * @constructor
     * @param {Phaser.Scene} gameScene - La GameScene activa.
     */
    constructor(gameScene) {
        /** @type {Phaser.Scene} Referencia a la escena que lo llama para la emisión de eventos */
        this.scene = gameScene;
    }

    /**
     * @method updateLives
     * @description Modifica el estado global de vidas y emite una señal para que el HUD se actualice.
     * @param {number} delta - La cantidad a cambiar (ej., +1 para curar, -1 para daño).
     * @fires Phaser.Events.EventEmitter#updateLives
     * @returns {void}
     */
    updateLives(delta) {
        GAME_STATE.lives = Math.max(0, Math.min(GAME_STATE.lives + delta, 7));
        this.scene.events.emit('updateLives');
    }

    /**
     * @method heal
     * @description Método público para aumentar la vida en 1.
     * @returns {void}
     */
    heal() {
        this.updateLives(1);
    }

    /**
     * @method damage
     * @description Método público para reducir la vida en 1.
     * @returns {void}
     */
    damage() {
        this.updateLives(-1);
    }
}
