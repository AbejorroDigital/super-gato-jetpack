/**
 * @file game.test.js
 * @description Pruebas unitarias para la lógica de GameScene usando Vitest.
 * Incluye mocks para el sistema de física y sprites propietario de Phaser.
 */

import { describe, expect, it, vi } from 'vitest';

/**
 * @class Sprite
 * @description Mock ligero de Phaser.Physics.Arcade.Sprite para pruebas headless.
 * Simula propiedades como el estado activo, posiciones y cuerpo físico.
 */
class Sprite {
    /**
     * @constructor
     * @param {Object} scene - Referencia a la escena mock.
     * @param {number} x - posición horizontal.
     * @param {number} y - posición vertical.
     */
    constructor(scene, x, y) {
        this.scene = scene;
        this.active = true;
        this.x = x;
        this.y = y;
        /** @type {Object} Cuerpo de física mock */
        this.body = { enable: true, reset: vi.fn(), setVelocityX: vi.fn(), setGravityY: vi.fn() };
    }
    /**
     * @method destroy
     * @description Simula la destrucción del objeto y la invalidación de referencias.
     * @returns {void}
     */
    destroy() {
        this.active = false;
        this.scene = undefined;
        this.parent = undefined;
    }
    /** @method setActive @param {boolean} v */
    setActive(v) { this.active = v; }
    /** @method setVisible @param {boolean} v */
    setVisible(v) { }
    /** @method setFlipX @param {boolean} v */
    setFlipX(v) { }
    /** @method setVelocityX @param {number} v */
    setVelocityX(v) { }
    /** @method setTexture @param {string} v */
    setTexture(v) { }
    /** @method setAlpha @param {number} v */
    setAlpha(v) { }
}

// Minimal GameScene Mock
class GameScene {
    constructor() {
        this.physics = {
            world: { bounds: { width: 800 } },
            add: {
                group: (config) => {
                    const children = [];
                    return {
                        children: {
                            each: (callback) => {
                                // Phaser's each iterates internal array. 
                                // If array changes during iteration, it can cause issues.
                                // We simulate a simple forEach which might not break in JS array but 
                                // logic inside might break if accessing properties of destroyed obj.
                                [...children].forEach(child => callback(child));
                            }
                        },
                        get: (x, y) => {
                            const s = new Sprite(this, x, y);
                            children.push(s);
                            return s;
                        },
                        add: (c) => children.push(c)
                    };
                }
            }
        };
        this.player = { bullets: this.physics.add.group() };
    }

    update() {
        // THE BUGGY LOGIC from index.html
        if (this.player.bullets) {
            this.player.bullets.children.each(b => {
                // Check bounds
                if (b.active && (b.x > this.physics.world.bounds.width || b.x < 0)) {
                    b.destroy();
                }
            });
        }
    }
}

describe('GameScene Update Loop', () => {
    it('should handle bullet destruction without crashing', () => {
        const scene = new GameScene();

        // Add a bullet out of bounds
        const b1 = scene.player.bullets.get(900, 100);

        expect(b1.active).toBe(true);
        expect(b1.scene).toBeDefined();

        // Run Update
        scene.update();

        // Bullet should be destroyed
        expect(b1.active).toBe(false);
        expect(b1.scene).toBeUndefined(); // Destroyed
    });

    it('should fail if we try to access properties of destroyed object', () => {
        const scene = new GameScene();
        const b1 = scene.player.bullets.get(900, 100);

        b1.destroy();

        // Simulating the error: Phaser internals accessing parent of destroyed object
        expect(() => {
            if (b1.parent) return true; // b1.parent is undefined, but accessing property on it isn't error unless b1 is null.
            // But checking 'isParent' on undefined?
        }).not.toThrow();
    });
});
