class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
    }

    fire(x, y, direction) {
        this.enableBody(true, x, y, true, true);
        this.body.allowGravity = false;
        this.setVelocityX(direction);
        this.setFlipX(direction < 0);
        // Hitbox de bala ajustada para precisión
        this.setBodySize(this.width * 0.5, this.height * 0.5);
    }

    update() {
        if (this.x < 0 || this.x > this.scene.physics.world.bounds.width) {
            this.disableBody(true, true);
        }
    }
}

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'gato');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);

        // --- HITBOX OPTIMIZADA ---
        this.setBodySize(this.width * 0.5, this.height * 0.4);
        this.setOffset(this.width * 0.25, this.height * 0.5);

        this.body.setGravityY(900);

        this.lives = GAME_STATE.lives;
        this.isInvulnerable = false;
        this.isFlying = false;
        this.lastFired = 0;

        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            x: Phaser.Input.Keyboard.KeyCodes.X
        });

        this.bullets = scene.physics.add.group({
            classType: Bullet,
            maxSize: 10,
            runChildUpdate: true
        });

        this.jetpackTimer = 0;
    }

    update(time) {
        if (!this.body || !this.active) return;

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

            this.jetpackTimer -= 16;
            if (this.jetpackTimer <= 0) this.deactivateJetpack();
        } else {
            // Salto normal con comprobación de contacto con suelo
            if (Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
                if (this.body.blocked.down || this.body.touching.down) {
                    this.setVelocityY(-950);
                }
            }
        }

        // Sistema de Disparo
        if (Phaser.Input.Keyboard.JustDown(this.keys.x) && time > this.lastFired) {
            let bullet = this.bullets.get(this.x, this.y, 'shotHero');
            if (bullet) {
                bullet.fire(this.x, this.y, this.flipX ? -700 : 700);
                this.lastFired = time + 250;
            }
        }

        /* NOTA: Se ha eliminado la lógica de "this.y > 580" de aquí 
           para que no entre en conflicto con el sensor global de GameScene.
        */
    }

    activateJetpack() {
        this.setTexture('gatoVuelo');
        this.isFlying = true;
        this.jetpackTimer = 8000;
        this.body.allowGravity = false;
    }

    deactivateJetpack() {
        this.isFlying = false;
        this.setTexture('gato');
        this.body.allowGravity = true;
    }

    takeDamage() {
        if (this.isInvulnerable || !this.active) return;

        this.lives--;
        GAME_STATE.lives = this.lives;
        this.scene.events.emit('updateLives');

        if (this.lives <= 0) {
            this.disableBody(true, false); // Desactivamos física pero no el sprite aún
            this.scene.scene.start('GameOverScene', { win: false });
        } else {
            // Feedback visual de daño
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
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.hp = 1;
        this.setCollideWorldBounds(true);
    }
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

class PatrolEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy1');
        this.speed = DIFFICULTY_SETTINGS[GAME_STATE.difficulty].enemySpeed;
        this.setVelocityX(this.speed);
    }
    update() {
        if (!this.body) return;
        if (this.body.blocked.right) this.setVelocityX(-this.speed);
        else if (this.body.blocked.left) this.setVelocityX(this.speed);
        this.setFlipX(this.body.velocity.x > 0);
    }
}

class ShooterEnemy extends Enemy {
    constructor(scene, x, y, bulletGroup) {
        super(scene, x, y, 'enemy2');
        this.bulletGroup = bulletGroup;
        this.scene.time.addEvent({
            delay: DIFFICULTY_SETTINGS[GAME_STATE.difficulty].shootDelay,
            callback: this.shoot, callbackScope: this, loop: true
        });
    }
    shoot() {
        if (!this.active || !this.scene.player) return;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
        if (dist > 600) return;

        // Sincronizado con ASSETS.shotEnemy
        const bullet = this.bulletGroup.get(this.x, this.y, 'shotEnemy');
        if (bullet) {
            const dir = (this.scene.player.x < this.x) ? -300 : 300;
            bullet.fire(this.x, this.y, dir);
        }
    }
}

class Boss extends Enemy {
    constructor(scene, x, y, bulletGroup) {
        super(scene, x, y, 'boss');
        this.hp = DIFFICULTY_SETTINGS[GAME_STATE.difficulty].bossHp;
        this.setImmovable(true);
        this.body.allowGravity = false;
        this.bulletGroup = bulletGroup;

        this.scene.tweens.add({
            targets: this,
            y: y - 100,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.time.addEvent({
            delay: 2500,
            callback: this.attack,
            callbackScope: this,
            loop: true
        });
    }

    attack() {
        if (!this.active || !this.bulletGroup || !this.scene.player) return;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
        const speed = 300;

        [-0.3, 0, 0.3].forEach(offset => {
            // Sincronizado con ASSETS.shotEnemy
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