/**
 * @class AudioManager
 * @description Envoltorio para el sistema de sonido de Phaser para proporcionar una API simplificada 
 * y un registro de errores consistente para los recursos faltantes.
 */
class AudioManager {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - El contexto de la escena para la reproducción de sonido.
     */
    constructor(scene) {
        /** @type {Phaser.Scene} Referencia interna a la escena */
        this.scene = scene;
    }

    /**
     * @method play
     * @description Reproduce un sonido si la clave existe en la caché.
     * @param {string} key - Clave del recurso definida en ASSETS.
     * @param {Phaser.Types.Sound.SoundConfig} [config={}] - Volumen, bucle y otros ajustes.
     * @returns {void}
     */
    play(key, config = {}) {
        if (this.scene.sound.get(key)) {
            this.scene.sound.play(key, config);
        } else {
            console.warn(`Audio key ${key} not found`);
        }
    }

    /**
     * @method playExplosion
     * @description Ayudante específico de contexto para reproducir el sfx de 'explosion' con volumen predefinido.
     * @returns {void}
     */
    playExplosion() {
        this.play('explosion', { volume: 0.6 });
    }
}
