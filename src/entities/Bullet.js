/**
 * @class Bullet
 * @extends Phaser.Physics.Arcade.Sprite
 * @description Clase base para proyectiles utilizada tanto por el Jugador como por los Enemigos.
 * Gestiona el movimiento lineal, el volteo direccional y la limpieza automática de los límites del mundo.
 * 
 * @example
 * // Uso típico en una llamada group.get()
 * let bullet = bulletGroup.get(x, y, 'shotHero');
 * bullet.fire(x, y, 700);
 */
class Bullet extends Phaser.Physics.Arcade.Sprite {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - La escena propietaria.
     * @param {number} x - Coordenada X inicial.
     * @param {number} y - Coordenada Y inicial.
     * @param {string} texture - Clave del recurso para el sprite de la bala.
     */
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
    }

    /**
     * @method fire
     * @description Activa la bala con una velocidad y dirección específicas.
     * @param {number} x - Punto de lanzamiento horizontal.
     * @param {number} y - Punto de lanzamiento vertical.
     * @param {number} direction - Valor de velocidad horizontal (positivo para derecha, negativo para izquierda).
     * @returns {void}
     */
    fire(x, y, direction) {
        this.enableBody(true, x, y, true, true);
        this.body.allowGravity = false;
        this.setVelocityX(direction);
        this.setFlipX(direction < 0);

        /** @description Hitbox ajustada para una detección de colisiones precisa */
        this.setBodySize(this.width * 0.5, this.height * 0.5);
    }

    /**
     * @method update
     * @description Bucle de actualización interno de Phaser. Desactiva la bala si viaja más allá de los límites del mundo.
     * @returns {void}
     */
    update() {
        if (this.x < 0 || this.x > this.scene.physics.world.bounds.width) {
            this.disableBody(true, true);
        }
    }
}
