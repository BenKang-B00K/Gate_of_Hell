import { Guardian, Specter, Projectile } from './entities.js';

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.LOGICAL_WIDTH = 360;
        this.LOGICAL_HEIGHT = 640;
    }

    preload() {
        // Placeholder textures for physics bodies
        this.load.image('unit_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
        this.load.image('enemy_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
    }

    create() {
        this.allies = this.add.group({ runChildUpdate: true });
        this.enemies = this.add.group({ runChildUpdate: true });
        this.projectiles = this.add.group({ runChildUpdate: true });
        this.slots = this.add.group();

        this.createSlots();
        this.setupDragAndDrop();
        this.setupPhysics();

        // Connect DOM UI
        const summonBtn = document.getElementById('tower-card');
        if (summonBtn) {
            summonBtn.addEventListener('click', () => {
                const emptySlot = this.slots.getChildren().find(s => !s.isOccupied);
                if (emptySlot) {
                    this.summonGuardian(emptySlot, window.unitTypes[0]);
                }
            });
        }

        // Enemy spawning loop
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnWave,
            callbackScope: this,
            loop: true
        });
    }

    spawnWave() {
        const categories = ['basic']; // Expand based on stage later
        const category = categories[Math.floor(Math.random() * categories.length)];
        const types = window.enemyCategories[category];
        const typeData = types[Math.floor(Math.random() * types.length)];

        this.spawnEnemy(typeData);
    }

    spawnEnemy(data) {
        const x = Phaser.Math.Between(100, 260); // Centered on road
        const y = -50;
        const enemy = new Specter(this, x, y, data);
        this.enemies.add(enemy);
    }

    createSlots() {
        // Create 16 slots (8 left, 8 right) matching the logical layout
        // Left slots (Area 1)
        for (let i = 0; i < 8; i++) {
            const x = 50;
            const y = 100 + i * 60;
            this.addSlot(x, y, 'left');
        }
        // Right slots (Area 2)
        for (let i = 0; i < 8; i++) {
            const x = 310;
            const y = 100 + i * 60;
            this.addSlot(x, y, 'right');
        }
    }

    addSlot(x, y, side) {
        const slot = this.add.zone(x, y, 50, 50).setRectangleDropZone(50, 50);
        slot.isOccupied = false;
        slot.side = side;
        
        // Visual indicator for slot
        this.add.rectangle(x, y, 40, 40, 0x555555, 0.3).setStrokeStyle(2, 0x888888);
        
        this.slots.add(slot);
    }

    setupDragAndDrop() {
        this.input.on('dragstart', (pointer, gameObject) => {
            this.children.bringToTop(gameObject);
            if (gameObject.iconText) this.children.bringToTop(gameObject.iconText);
            gameObject.setAlpha(0.8);
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragend', (pointer, gameObject, dropped) => {
            gameObject.setAlpha(1);
            if (!dropped) {
                // Return to original slot if not dropped on a zone
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        });

        this.input.on('drop', (pointer, gameObject, dropZone) => {
            if (dropZone.isOccupied) {
                // Swap logic if target is occupied
                const occupyingUnit = this.allies.getChildren().find(u => u.currentSlot === dropZone);
                const oldSlot = gameObject.currentSlot;

                if (occupyingUnit) {
                    occupyingUnit.x = oldSlot.x;
                    occupyingUnit.y = oldSlot.y;
                    occupyingUnit.currentSlot = oldSlot;
                    oldSlot.isOccupied = true;
                }
            } else {
                gameObject.currentSlot.isOccupied = false;
            }

            gameObject.x = dropZone.x;
            gameObject.y = dropZone.y;
            gameObject.currentSlot = dropZone;
            dropZone.isOccupied = true;
        });
    }

    setupPhysics() {
        this.physics.add.overlap(this.projectiles, this.enemies, (projectile, enemy) => {
            enemy.takeDamage(projectile.source.damage);
            projectile.destroy();
        });
    }

    summonGuardian(slot, unitData) {
        if (slot.isOccupied) return;

        const guardian = new Guardian(this, slot.x, slot.y, unitData);
        guardian.setInteractive();
        this.input.setDraggable(guardian);
        guardian.currentSlot = slot;
        slot.isOccupied = true;
        
        this.allies.add(guardian);
        return guardian;
    }

    getNearestEnemy(source) {
        let nearest = null;
        let minDist = Infinity;

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(source.x, source.y, enemy.x, enemy.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });

        return nearest;
    }

    update(time, delta) {
        // Scene-wide updates (targeting logic)
        this.allies.getChildren().forEach(guardian => {
            if (time - guardian.lastShot >= guardian.cooldown) {
                const target = this.getNearestEnemy(guardian);
                if (target) {
                    const dist = Phaser.Math.Distance.Between(guardian.x, guardian.y, target.x, target.y);
                    if (dist <= guardian.range) {
                        const projectile = new Projectile(this, guardian.x, guardian.y, target, guardian);
                        this.projectiles.add(projectile);
                        guardian.lastShot = time;
                    }
                }
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 360,
    height: 640,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: MainScene
};

const game = new Phaser.Game(config);
export default game;
