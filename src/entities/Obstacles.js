/**
 * @class Crate
 * @extends Phaser.Physics.Arcade.Sprite
 * @description Objetos ambientales interactivos que pueden ser destruidos por el jugador.
 * Soporta diferentes tipos con contenidos o propiedades variadas.
 * 
 * @example
 * // Creado en la generación procedimental de GameScene
 * this.crates.add(new Crate(this, x, y, 'caja2'));
 */
class Crate extends Phaser.Physics.Arcade.Sprite {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - Escena propietaria.
     * @param {number} x - Posición horizontal.
     * @param {number} y - Posición vertical.
     * @param {string} [type='caja1'] - Variante de clave de recurso.
     */
    constructor(scene, x, y, type = 'caja1') {
        super(scene, x, y, type);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setImmovable(true);
        this.body.allowGravity = true;
        /** @type {string} Distingue los drops de botín o la durabilidad */
        this.type = type;
    }

    /**
     * @method onDestroy
     * @description Desactiva las físicas y oculta el objeto. 
     * Los efectos visuales de nivel superior son gestionados por la escena padre vía handleCrateDestruction.
     * @returns {void}
     */
    onDestroy() {
        this.disableBody(true, true);
    }
}
