/**
 * @file Config.js
 * @description Repositorio central de constantes de configuración, rutas de recursos y estado inicial del juego.
 */

/**
 * @typedef {Object} PhysicsConfig
 * @property {string} default - Motor de física por defecto ('arcade').
 * @property {Object} arcade - Configuración específica de arcade.
 * @property {Object} arcade.gravity - Ajustes de gravedad global.
 * @property {number} arcade.gravity.y - Fuerza de gravedad vertical.
 * @property {boolean} arcade.debug - Si es verdadero, renderiza hitboxes y vectores de velocidad.
 */

/** @type {Phaser.Types.Core.GameConfig} Configuración básica del motor Phaser */
const CONFIG = {
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    }
};

/** 
 * @type {Object<string, string>} 
 * @description Mapa de claves de recursos a sus respectivas rutas de archivo.
 * Centraliza la carga de recursos para BootScene.
 */
const ASSETS = {
    gato: 'assets/gato.PNG',
    gatoVuelo: 'assets/gato-vuelo.PNG',
    enemy1: 'assets/enemy1.PNG',
    enemy2: 'assets/enemy2.PNG',
    boss: 'assets/boss.PNG',
    perro: 'assets/perro.PNG',
    murcielago: 'assets/murcielago.png',
    suelo: 'assets/suelo.PNG',
    plataforma: 'assets/plataformas.PNG',
    background: 'assets/background.PNG',
    flare: 'assets/flare.png',
    caja1: 'assets/caja1.PNG',
    caja2: 'assets/caja2.PNG',
    caja3: 'assets/caja3.PNG',
    jetpack: 'assets/jetpack.png',
    vida: 'assets/vida.png',
    shotHero: 'assets/shot-hero.png',
    shotEnemy: 'assets/shot-enemy.png',
    music: 'assets/Intergalactic Odyssey.ogg',
    explosion: 'assets/boss-explosion.ogg'
};

/**
 * @typedef {Object} GameState
 * @property {string} difficulty - Nivel de dificultad actual.
 * @property {number} lives - Conteo actual de vidas del jugador.
 * @property {number} level - El índice de nivel actual (basado en 1).
 * @property {number} maxLevels - Nivel máximo antes de la secuencia de victoria.
 * @property {number} score - Puntuación acumulada del jugador.
 */

/** @type {GameState} Almacenamiento mutable para el estado actual de la sesión de juego */
const GAME_STATE = {
    difficulty: 'NORMAL',
    lives: 7,
    level: 1,
    maxLevels: 3,
    score: 0
};

/**
 * @typedef {Object} DifficultySetting
 * @property {number} enemySpeed - Velocidad de movimiento base para patrullas.
 * @property {number} shootDelay - Milisegundos entre disparos de enemigos.
 * @property {number} bossHp - HP total de la entidad Jefe.
 * @property {number} enemyDist - Factor de distancia para la aparición o comportamiento de enemigos.
 */

/** @type {Object<string, DifficultySetting>} Ajustes que escalan la dificultad del juego */
const DIFFICULTY_SETTINGS = {
    'EASY': {
        enemySpeed: 50,
        shootDelay: 5000,
        bossHp: 5,
        enemyDist: 500
    },
    'NORMAL': {
        enemySpeed: 100,
        shootDelay: 4000,
        bossHp: 10,
        enemyDist: 300
    },
    'HARD': {
        enemySpeed: 180,
        shootDelay: 3000,
        bossHp: 20,
        enemyDist: 150
    }
};

/**
 * Manejador de errores global para prevenir fallos silenciosos y facilitar la depuración.
 * @param {string} msg - Mensaje de error.
 * @param {string} url - Archivo fuente donde ocurrió el error.
 * @param {number} line - Número de línea del error.
 */
window.onerror = function (msg, url, line) {
    console.error(`[GAME ERROR] ${msg} en ${url}:${line}`);
    return false;
};
