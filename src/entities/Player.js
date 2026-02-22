/**
 * @class Player
 * @extends Phaser.Physics.Arcade.Sprite
 * @description El protagonista principal del juego. Gestiona el vuelo vertical con jetpack, 
 * saltos estándar, movimiento horizontal y combate (disparar y recibir daño).
 * 
 * @example
 * // Instanciación dentro de GameScene
 * this.player = new Player(this, 100, 450);
 */
class Player extends Phaser.Physics.Arcade.Sprite {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - La escena a la que pertenece este jugador.
     * @param {number} x - Posición inicial horizontal.
     * @param {number} y - Posición inicial vertical.
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'gato');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);

        // --- HITBOX OPTIMIZADA ---
        /** @description Hitbox personalizada para que las colisiones se sientan más justas para el jugador. */
        this.setBodySize(this.width * 0.5, this.height * 0.4);
        this.setOffset(this.width * 0.25, this.height * 0.5);

        this.body.setGravityY(900);

        /** @type {number} Copia local de las vidas del jugador sincronizada con GAME_STATE */
        this.lives = GAME_STATE.lives;
        /** @type {boolean} Evita recibir daño durante los frames de recuperación */
        this.isInvulnerable = false;
        /** @type {boolean} Indicador de estado para el uso del jetpack */
        this.isFlying = false;
        /** @type {number} Marca de tiempo del último disparo para gestionar la cadencia de fuego */
        this.lastFired = 0;

        /** @type {Object<string, Phaser.Input.Keyboard.Key>} Mapeo de controles del teclado */
        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            x: Phaser.Input.Keyboard.KeyCodes.X
        });

        /** @type {Phaser.Physics.Arcade.Group} Pool de objetos para los proyectiles del jugador */
        this.bullets = scene.physics.add.group({
            classType: Bullet,
            maxSize: 10,
            runChildUpdate: true
        });

        /** @type {number} Tiempo restante del jetpack activo en milisegundos */
        this.jetpackTimer = 0;
    }

    /**
     * @method update
     * @description Bucle principal de actualización para el jugador. Procesa la entrada y actualiza las físicas/estado.
     * @param {number} time - Tiempo actual del juego.
     * @returns {void}
     */
    update(time) {
        if (!this.body || !this.active) return;

        /** @type {Phaser.Types.Input.Keyboard.CursorKeys} Teclas de flecha estándar para el movimiento */
        const cursors = this.scene.input.keyboard.createCursorKeys();

        // Movimiento Horizontal
        let speed = this.isFlying ? 350 : 250;
        if (cursors.left.isDown) {
            this.setVelocityX(-speed);
            this.setFlipX(true);
        } else if (cursors.right.isDown) {
            this.setVelocityX(speed);
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }

        // --- SALTO Y VUELO ---
        const isJumpPressed = cursors.up.isDown || this.keys.space.isDown;

        if (this.isFlying) {
            if (isJumpPressed) {
                this.setVelocityY(-300);
            } else {
                this.setVelocityY(80);
            }

            // Resta aproximada del delta de frame (16ms)
            this.jetpackTimer -= 16;
            if (this.jetpackTimer <= 0) this.deactivateJetpack();
        } else {
            // Lógica de salto estándar con verificación de suelo
            if (Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
                if (this.body.blocked.down || this.body.touching.down) {
                    this.setVelocityY(-950);
                }
            }
        }

        // Sistema de Disparo
        if (Phaser.Input.Keyboard.JustDown(this.keys.x) && time > this.lastFired) {
            /** @type {Bullet} Bala reciclada del pool */
            let bullet = this.bullets.get(this.x, this.y, 'shotHero');
            if (bullet) {
                bullet.fire(this.x, this.y, this.flipX ? -700 : 700);
                this.lastFired = time + 250;
            }
        }
    }

    /**
     * @method activateJetpack
     * @description Activa el modo de vuelo y cambia la textura del jugador a la variante voladora.
     * Dura 8 segundos.
     * @returns {void}
     */
    activateJetpack() {
        this.setTexture('gatoVuelo');
        this.isFlying = true;
        this.jetpackTimer = 8000;
        this.body.allowGravity = false;
    }

    /**
     * @method deactivateJetpack
     * @description Desactiva el vuelo, devuelve la gravedad a la normalidad y restablece la apariencia.
     * @returns {void}
     */
    deactivateJetpack() {
        this.isFlying = false;
        this.setTexture('gato');
        this.body.allowGravity = true;
        this.setVelocityY(100);
    }

    /**
     * @method takeDamage
     * @description Reduce las vidas, activa frames de invulnerabilidad y verifica el fin del juego.
     * @fires Phaser.Scenes.Events#updateLives
     * @returns {void}
     */
    takeDamage() {
        if (this.isInvulnerable || !this.active) return;

        this.lives--;
        GAME_STATE.lives = this.lives;
        this.scene.events.emit('updateLives');

        if (this.lives <= 0) {
            this.disableBody(true, false);
            this.scene.scene.start('GameOverScene', { win: false });
        } else {
            this.isInvulnerable = true;
            this.setAlpha(0.5);
            this.setTint(0xff0000);

            this.scene.time.delayedCall(1500, () => {
                if (this.active) {
                    this.isInvulnerable = false;
                    this.setAlpha(1);
                    this.clearTint();
                }
            });
        }
    }
}
