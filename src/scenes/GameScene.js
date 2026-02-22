/**
 * @class GameScene
 * @extends Phaser.Scene
 * @description La escena de juego principal donde ocurre la acción. 
 * Gestiona al jugador, enemigos, generación del mundo, colisiones e interfaz (HUD).
 * 
 * @example
 * // Transición desde MainMenuScene
 * this.scene.start('GameScene', { difficulty: 'NORMAL' });
 */
class GameScene extends Phaser.Scene {
    /**
     * @constructor
     * Crea una instancia de GameScene.
     */
    constructor() {
        super('GameScene');
    }

    /**
     * @method init
     * @description Inicializa el estado de la escena basado en la dificultad proporcionada.
     * @param {Object} data - Datos de inicialización.
     * @param {string} [data.difficulty='NORMAL'] - Nivel de dificultad ('EASY', 'NORMAL', 'HARD').
     * @returns {void}
     */
    init(data) {
        GAME_STATE.difficulty = data.difficulty || 'NORMAL';
        GAME_STATE.level = 1;
        GAME_STATE.lives = 7;
        GAME_STATE.score = 0;
    }

    /**
     * @method create
     * @description Configura todo el mundo del juego, incluyendo grupos de físicas, límites del mundo,
     * generación de terreno procedimental (semi-aleatorio), inicialización del jugador y sistemas de colisión.
     * 
     * @fires Phaser.Scenes.Events#CREATE
     * @returns {void}
     */
    create() {
        /** @type {AudioManager} Gestiona los efectos de sonido y la música */
        this.audioManager = new AudioManager(this);
        /** @type {HealthManager} Gestiona la lógica de vida y daño */
        this.healthManager = new HealthManager(this);

        // Lógica de control de música
        let music = this.sound.get('music');
        if (!music) {
            this.sound.play('music', { loop: true, volume: 0.5 });
        } else if (!music.isPlaying) {
            music.play();
        }

        /** @constant {number} Longitud horizontal total del nivel */
        const worldWidth = 18000;
        /** @constant {number} Coordenada X donde comienza el área del jefe */
        const bossAreaStart = 17500;

        // Establece los límites de la física y la cámara
        this.physics.world.setBounds(0, -100, worldWidth, 900);
        this.cameras.main.setBounds(0, 0, worldWidth, 600);

        /** @type {Phaser.GameObjects.TileSprite} Fondo con efecto parallax */
        this.add.tileSprite(0, 0, worldWidth, 600, 'background').setOrigin(0).setScrollFactor(0.1);

        /** @type {Phaser.Physics.Arcade.StaticGroup} Plataformas estáticas y suelos */
        this.platforms = this.physics.add.staticGroup();
        /** @type {Phaser.Physics.Arcade.Group} Cajas rompibles */
        this.crates = this.physics.add.group();
        /** @type {Phaser.Physics.Arcade.Group} Proyectiles disparados por enemigos */
        this.enemyBullets = this.physics.add.group({ classType: Bullet, maxSize: 50, runChildUpdate: true });
        /** @type {Phaser.Physics.Arcade.Group} Enemigos activos en la escena */
        this.enemies = this.physics.add.group({ runChildUpdate: true });
        /** @type {Phaser.Physics.Arcade.Group} Objetos coleccionables (vida, jetpack) */
        this.items = this.physics.add.group();

        // --- CONSTRUCCIÓN DEL TERRENO ---
        // Genera el suelo con fosos estratégicos
        for (let x = 0; x < bossAreaStart; x += 70) {
            if ((x > 1200 && x < 1400) || (x > 3000 && x < 3230) ||
                (x > 5500 && x < 5730) || (x > 6200 && x < 6430) ||
                (x > 9000 && x < 9230) || (x > 12000 && x < 12400) ||
                (x > 15000 && x < 15230)) continue;

            this.platforms.create(x, 568, 'suelo').refreshBody();
        }

        // Suelo plano para el área del jefe
        for (let x = bossAreaStart; x < worldWidth; x += 70) {
            this.platforms.create(x, 568, 'suelo').refreshBody();
        }

        // --- GENERADOR DE ISLAS Y OBSTÁCULOS ---
        const platformHeights = [450, 310, 170];
        let nextStructureX = 600;

        while (nextStructureX < (bossAreaStart - 500)) {
            const islandLength = Phaser.Math.Between(3, 8);
            const heightIndex = Phaser.Math.Between(0, 2);
            const y = platformHeights[heightIndex];

            // Escalón de ayuda para plataformas altas
            if (heightIndex === 2) {
                this.platforms.create(nextStructureX - 80, platformHeights[1], 'plataforma').refreshBody();
            }

            for (let i = 0; i < islandLength; i++) {
                let blockX = nextStructureX + (i * 70);
                this.platforms.create(blockX, y, 'plataforma').refreshBody();

                // Probabilidad de generar cajas sobre plataformas
                if (Math.random() < 0.3) {
                    const r = Math.random();
                    let crateType = 'caja1';
                    if (r < 0.2) crateType = 'caja2';
                    else if (r < 0.5) crateType = 'caja3';
                    this.crates.add(new Crate(this, blockX, y - 50, crateType));
                }
            }

            const centerX = nextStructureX + (islandLength * 35);
            const topY = y - 60;
            const roll = Math.random();

            // Poblar plataformas con enemigos u objetos
            if (roll < 0.30) {
                this.enemies.add(new ShooterEnemy(this, centerX, topY, this.enemyBullets));
            } else if (roll < 0.45) {
                let j = this.items.create(centerX, topY, 'jetpack');
                j.type = 'jetpack';
                this.tweens.add({ targets: j, y: topY - 20, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            } else if (roll < 0.55) {
                let v = this.items.create(centerX, topY, 'vida');
                v.type = 'vida';
                this.tweens.add({ targets: v, scale: 1.2, duration: 800, yoyo: true, repeat: -1 });
            } else if (roll < 0.85) {
                this.enemies.add(new PatrolEnemy(this, centerX, topY));
            }

            nextStructureX += (islandLength * 70) + Phaser.Math.Between(250, 450);
        }

        // Cajas en el suelo
        for (let x = 1000; x < bossAreaStart; x += 1200) {
            if (Math.random() > 0.3) {
                this.crates.add(new Crate(this, x, 500, 'caja1'));
            }
        }

        /** @type {Player} El personaje principal */
        this.player = new Player(this, 100, 450);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // --- RELACIONES DE COLISIÓN Y OVERLAP ---
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms, null, (e, p) => {
            // Los murciélagos vuelan a través de las plataformas, otros colisionan
            return !(e instanceof MurcielagoEnemy);
        }, this);
        this.physics.add.collider(this.items, this.platforms);
        this.physics.add.collider(this.crates, this.platforms);
        this.physics.add.collider(this.player, this.crates);

        this.physics.add.overlap(this.player, this.enemies, (p, e) => p.takeDamage());
        this.physics.add.overlap(this.player.bullets, this.enemies, (b, e) => { b.disableBody(true, true); e.takeDamage(); });
        this.physics.add.overlap(this.player, this.enemyBullets, (p, eb) => { eb.disableBody(true, true); p.takeDamage(); });

        /** Destrucción de cajas por disparo */
        this.physics.add.overlap(this.player.bullets, this.crates, (bullet, crate) => {
            bullet.disableBody(true, true);
            this.handleCrateDestruction(crate);
        });

        /** Recolección de items */
        this.physics.add.overlap(this.player, this.items, (p, item) => {
            if (item.type === 'vida') {
                this.healthManager.heal();
            } else if (item.type === 'jetpack') {
                p.activateJetpack();
            }
            item.disableBody(true, true);
        });

        this.createHUD();
        this.spawnSpecialEnemies();
        /** @type {boolean} Flag para asegurar que el jefe solo aparezca una vez */
        this.bossSpawned = false;
    }

    /**
     * @method handleCrateDestruction
     * @description Gestiona las consecuencias visuales y lógicas de destruir una caja.
     * Activa el sonido, un efecto de destello de partículas y potencialmente genera objetos.
     * @param {Crate} crate - El objeto caja que está siendo destruido.
     * @returns {void}
     */
    handleCrateDestruction(crate) {
        this.audioManager.playExplosion();

        /** @type {Phaser.GameObjects.Sprite} Efecto de destello de la explosión */
        let flare = this.add.sprite(crate.x, crate.y, 'flare');
        this.tweens.add({
            targets: flare, alpha: 0, scale: 2, duration: 500,
            onComplete: () => flare.destroy()
        });

        // Generación de objetos especiales para tipos específicos de cajas
        if (crate.type === 'caja2') {
            let v = this.items.create(crate.x, crate.y - 20, 'vida');
            v.type = 'vida';
            this.tweens.add({ targets: v, scale: 1.2, duration: 800, yoyo: true, repeat: -1 });
        }

        crate.onDestroy();
    }

    /**
     * @method spawnSpecialEnemies
     * @description Puebla el nivel con tipos de enemigos especiales (Perros y Murciélagos) 
     * en posiciones aleatorias válidas.
     * @returns {void}
     */
    spawnSpecialEnemies() {
        // 12 Perros (enemigos terrestres)
        for (let i = 0; i < 12; i++) {
            let pos = this.getValidSpawnPosition(true);
            if (pos) {
                this.enemies.add(new PerroEnemy(this, pos.x, pos.y));
            }
        }

        // 9 Murciélagos (enemigos aéreos)
        for (let i = 0; i < 9; i++) {
            let pos = this.getValidSpawnPosition(false);
            if (pos) {
                this.enemies.add(new MurcielagoEnemy(this, pos.x, pos.y));
            }
        }
    }

    /**
     * @method getValidSpawnPosition
     * @description Encuentra una coordenada de aparición que no se solape con plataformas existentes, cajas o enemigos.
     * @param {boolean} grounded - Si es verdadero, restringe la Y al nivel del suelo.
     * @returns {?{x: number, y: number}} - Un objeto de coordenadas válido o null después de 30 intentos fallidos.
     */
    getValidSpawnPosition(grounded) {
        const bossAreaStart = 17500;
        let attempts = 0;

        while (attempts < 30) {
            attempts++;
            let rx = Phaser.Math.Between(1000, bossAreaStart - 500);
            let ry = grounded ? 500 : Phaser.Math.Between(50, 350);

            // Verificaciones de solapamiento basadas en distancia
            const overlapPlat = this.platforms.getChildren().some(p => Phaser.Math.Distance.Between(rx, ry, p.x, p.y) < 100);
            if (overlapPlat) continue;

            const overlapCrate = this.crates.getChildren().some(c => Phaser.Math.Distance.Between(rx, ry, c.x, c.y) < 100);
            if (overlapCrate) continue;

            const overlapEnemy = this.enemies.getChildren().some(e => Phaser.Math.Distance.Between(rx, ry, e.x, e.y) < 200);
            if (overlapEnemy) continue;

            return { x: rx, y: ry };
        }
        return null;
    }

    /**
     * @method createHUD
     * @description Inicializa la interfaz de usuario (HUD): contador de vidas y barra de combustible del jetpack.
     * @listens updateLives - Evento personalizado para actualizar la interfaz de vidas.
     * @returns {void}
     */
    createHUD() {
        /** @type {Phaser.GameObjects.Text} Texto de visualización de vidas */
        this.livesText = this.add.text(20, 20, 'LIVES: ' + GAME_STATE.lives, {
            fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4
        }).setScrollFactor(0);

        this.events.on('updateLives', () => {
            this.livesText.setText('LIVES: ' + GAME_STATE.lives);
        });

        // --- BARRA DE JETPACK ---
        /** @type {Phaser.GameObjects.Graphics} Fondo de la barra de combustible */
        this.fuelBarBg = this.add.graphics().setScrollFactor(0);
        /** @type {Phaser.GameObjects.Graphics} Parte de relleno de la barra de combustible */
        this.fuelBar = this.add.graphics().setScrollFactor(0);
        this.drawFuelBar(0);
    }

    /**
     * @method drawFuelBar
     * @description Actualiza la representación visual del combustible del jetpack.
     * @param {number} percentage - Porcentaje de combustible de 0 a 1.
     * @returns {void}
     */
    drawFuelBar(percentage) {
        this.fuelBarBg.clear();
        this.fuelBar.clear();

        if (percentage <= 0) return;

        // Contenedor
        this.fuelBarBg.fillStyle(0x000000, 0.5);
        this.fuelBarBg.fillRect(20, 55, 150, 20);

        // Lógica de llenado (Cambio de gradiente Verde -> Rojo)
        let color = percentage > 0.3 ? 0x00ff00 : 0xff0000;
        this.fuelBar.fillStyle(color, 1);
        this.fuelBar.fillRect(22, 57, 146 * percentage, 16);
    }

    /**
     * @method update
     * @description El bucle principal de lógica de la escena. Gestiona las actualizaciones por frame para el jugador, enemigos,
     * HUD, detección de abismo y activadores de aparición del jefe.
     * @param {number} time - Tiempo actual del juego.
     * @returns {void}
     */
    update(time) {
        this.player.update(time);
        this.enemies.children.iterate(e => { if (e && e.update) e.update(time); });

        // --- ACTUALIZAR BARRA DE JETPACK ---
        if (this.player.isFlying) {
            this.drawFuelBar(this.player.jetpackTimer / 8000);
        } else {
            this.drawFuelBar(0);
        }

        // --- SENSOR DE ABISMO (Muerte inmediata) ---
        if (this.player.y > 600) {
            this.player.setVelocity(0, 0);
            this.player.takeDamage();

            if (GAME_STATE.lives > 0) {
                const respawnX = Math.max(100, this.player.x - 200);
                this.player.setPosition(respawnX, 100);
                this.player.setAlpha(0.5);
                this.time.delayedCall(1000, () => {
                    if (this.player.active) this.player.setAlpha(1);
                });
            }
        }

        // --- LÓGICA DEL JEFE ---
        if (this.player.x >= 17500 && !this.bossSpawned) {
            this.bossSpawned = true;
            this.cameras.main.stopFollow();
            this.cameras.main.pan(17750, 300, 1500, 'Power2');

            /** @type {Boss} El jefe final del nivel */
            this.boss = new Boss(this, 17850, 300, this.enemyBullets);
            this.enemies.add(this.boss);
        }

        // Condición de victoria: Jefe destruido
        if (this.bossSpawned && this.boss && !this.boss.active) {
            this.time.delayedCall(1500, () => this.scene.start('GameOverScene', { win: true }));
        }
    }
}
