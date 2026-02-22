/**
 * @class Enemy
 * @extends Phaser.Physics.Arcade.Sprite
 * @description Clase base para todas las entidades enemigas. Gestiona la física básica, 
 * los puntos de vida y la retroalimentación de daño (tinte).
 */
class Enemy extends Phaser.Physics.Arcade.Sprite {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - La escena propietaria.
     * @param {number} x - posición horizontal.
     * @param {number} y - posición vertical.
     * @param {string} texture - Clave del recurso para el sprite.
     */
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        /** @type {number} Puntos de vida del enemigo */
        this.hp = 1;
        this.setCollideWorldBounds(true);
    }

    /**
     * @method takeDamage
     * @description Reduce los HP y gestiona la muerte o la retroalimentación de golpe.
     * @returns {void}
     */
    takeDamage() {
        this.hp--;
        if (this.hp <= 0) {
            this.disableBody(true, true);
        } else {
            this.setTint(0xff0000);
            this.scene.time.delayedCall(100, () => { if (this.active) this.clearTint(); });
        }
    }
}

/**
 * @class PatrolEnemy
 * @extends Enemy
 * @description Un enemigo que se mueve horizontalmente de un lado a otro entre obstáculos o límites del mundo.
 */
class PatrolEnemy extends Enemy {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - La escena propietaria.
     * @param {number} x - posición horizontal.
     * @param {number} y - posición vertical.
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy1');
        /** @type {number} Velocidad de movimiento sincronizada con la configuración de dificultad */
        this.speed = DIFFICULTY_SETTINGS[GAME_STATE.difficulty].enemySpeed;
        this.setVelocityX(this.speed);
    }

    /** @method update 
     * Gestiona el cambio de dirección al chocar con paredes.
     */
    update() {
        if (!this.body) return;
        if (this.body.blocked.right) this.setVelocityX(-this.speed);
        else if (this.body.blocked.left) this.setVelocityX(this.speed);
        this.setFlipX(this.body.velocity.x > 0);
    }
}

/**
 * @class ShooterEnemy
 * @extends Enemy
 * @description Un enemigo estático o semi-estático que dispara proyectiles al jugador cuando está dentro del alcance.
 */
class ShooterEnemy extends Enemy {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - La escena propietaria.
     * @param {number} x - posición horizontal.
     * @param {number} y - posición vertical.
     * @param {Phaser.Physics.Arcade.Group} bulletGroup - Pool de proyectiles para disparar.
     */
    constructor(scene, x, y, bulletGroup) {
        super(scene, x, y, 'enemy2');
        /** @type {Phaser.Physics.Arcade.Group} Referencia al pool de proyectiles */
        this.bulletGroup = bulletGroup;

        // Evento de auto-disparo
        this.scene.time.addEvent({
            delay: DIFFICULTY_SETTINGS[GAME_STATE.difficulty].shootDelay,
            callback: this.shoot, callbackScope: this, loop: true
        });
    }

    /**
     * @method shoot
     * @description Dispara una bala hacia el jugador si está dentro de la distancia (600px).
     * @returns {void}
     */
    shoot() {
        if (!this.active || !this.scene.player) return;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
        if (dist > 600) return;

        /** @type {Bullet} Instancia del proyectil */
        const bullet = this.bulletGroup.get(this.x, this.y, 'shotEnemy');
        if (bullet) {
            const dir = (this.scene.player.x < this.x) ? -300 : 300;
            bullet.fire(this.x, this.y, dir);
        }
    }
}

/**
 * @class Boss
 * @extends Enemy
 * @description Enemigo con mucha vida, patrones de ataque avanzados (disparo disperso) y movimiento flotante.
 */
class Boss extends Enemy {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - La escena propietaria.
     * @param {number} x - posición horizontal.
     * @param {number} y - posición vertical.
     * @param {Phaser.Physics.Arcade.Group} bulletGroup - Pool de proyectiles.
     */
    constructor(scene, x, y, bulletGroup) {
        super(scene, x, y, 'boss');
        /** @override Sincroniza los HP con la dificultad */
        this.hp = DIFFICULTY_SETTINGS[GAME_STATE.difficulty].bossHp;
        this.setImmovable(true);
        this.body.allowGravity = false;
        this.bulletGroup = bulletGroup;

        // Animación de flotado
        this.scene.tweens.add({
            targets: this,
            y: y - 100,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Ciclo de ataque periódico
        this.scene.time.addEvent({
            delay: 2500,
            callback: this.attack,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * @method attack
     * @description Realiza un ataque de disparo disperso (3 balas) dirigido al jugador.
     * @returns {void}
     */
    attack() {
        if (!this.active || !this.bulletGroup || !this.scene.player) return;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
        const speed = 300;

        /** Dispara 3 balas en un cono */
        [-0.3, 0, 0.3].forEach(offset => {
            const bullet = this.bulletGroup.get(this.x, this.y, 'shotEnemy');
            if (bullet) {
                bullet.enableBody(true, this.x, this.y, true, true);
                bullet.body.allowGravity = false;
                this.scene.physics.velocityFromRotation(angle + offset, speed, bullet.body.velocity);
                bullet.setRotation(angle + offset);
            }
        });
    }
}

/**
 * @class PerroEnemy
 * @extends Enemy
 * @description Un enemigo terrestre rápido que arremete hacia la izquierda una vez que detecta al jugador.
 */
class PerroEnemy extends Enemy {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - Escena propietaria.
     * @param {number} x - posición horizontal.
     * @param {number} y - posición vertical.
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'perro');
        /** @type {number} Velocidad de arremetida */
        this.speed = 300;
        /** @type {number} Distancia para la activación */
        this.detectionRange = 400;
        /** @type {boolean} La detección persiste una vez activada */
        this.hasDetected = false;

        // --- HITBOX REDUCIDA ---
        this.setBodySize(this.width - 15, this.height);
        this.setOffset(7.5, 0);

        this.body.setGravityY(900);
    }

    /**
     * @method update
     * @description Verifica la proximidad del jugador. Si lo detecta, arremete hacia la izquierda.
     * @returns {void}
     */
    update() {
        if (!this.body || !this.active || !this.scene.player) return;

        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);

        if (dist < this.detectionRange || this.hasDetected) {
            this.hasDetected = true;
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
        }
    }
}

/**
 * @class MurcielagoEnemy
 * @extends Enemy
 * @description Un enemigo aéreo que patrulla horizontalmente y oscila verticalmente usando una onda senoidal.
 * IGNORA la gravedad y las plataformas del entorno para el movimiento.
 */
class MurcielagoEnemy extends Enemy {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - Escena propietaria.
     * @param {number} x - posición horizontal.
     * @param {number} y - posición vertical.
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'murcielago');
        /** @type {number} Velocidad de patrulla */
        this.speed = 180;
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        /** @type {number} Ancla para el cálculo de la distancia de patrulla */
        this.startX = x;
        /** @type {number} Ancla para la oscilación vertical */
        this.startY = y;
        /** @type {number} Distancia máxima de recorrido de patrulla */
        this.patrolRange = 300;
        /** @type {number} Dirección horizontal actual (1 o -1) */
        this.direction = -1;
    }

    /**
     * @method update
     * @description Mantiene la velocidad horizontal constante y el movimiento vertical en onda senoidal.
     * Cambia de dirección al alcanzar el rango de patrulla.
     * @param {number} time - Tiempo global del juego para la oscilación.
     * @returns {void}
     */
    update(time) {
        if (!this.body || !this.active) return;

        this.setVelocityX(this.speed * this.direction);

        // Flotado vertical sinusoidal
        if (time) {
            this.y = this.startY + Math.sin(time / 300) * 40;
        }

        const traveled = Math.abs(this.x - this.startX);
        if (traveled >= this.patrolRange) {
            this.direction *= -1;
            this.startX = this.x;
            this.setFlipX(this.direction > 0);
        }
    }
}
