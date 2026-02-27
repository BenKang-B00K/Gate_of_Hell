import { Guardian, Specter, Projectile } from './entities.js';

class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        this.load.on('filecomplete', (key, type, data) => {
            if (type === 'image' || type === 'spritesheet') {
                const texture = this.textures.get(key);
                texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
            }
        });

        this.load.image('unit_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
        this.load.image('enemy_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');

        // Loading Ally SpriteSheets
        this.load.spritesheet('apprentice', 'ImageSample/Tier1/견습퇴마사.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('necromancer', 'ImageSample/Tier2/강령술사.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('mirror', 'ImageSample/Tier2/거울 예언자.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('assassin', 'ImageSample/Tier2/그림자 암살자.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('talisman', 'ImageSample/Tier2/부적술사.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('ice', 'ImageSample/Tier2/빙결 도사.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('guardian_unit', 'ImageSample/Tier2/성소 수호자.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('archer', 'ImageSample/Tier2/신성한 궁수.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('tracker', 'ImageSample/Tier2/영혼 추적자.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('chainer', 'ImageSample/Tier2/영혼의 결박자.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('monk', 'ImageSample/Tier2/철퇴 승려.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('knight', 'ImageSample/Tier2/퇴마 기사.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('alchemist', 'ImageSample/Tier2/퇴마 연금술사.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('fire', 'ImageSample/Tier2/화염 마법사.png', { frameWidth: 30, frameHeight: 34 });

        // Enemy SpriteSheets (Mapping placeholders or real files if they existed)
        // For demonstration, we assume enemies follow the same spritesheet format
        this.load.spritesheet('ghost_basic', 'ImageSample/Tier1/견습퇴마사.png', { frameWidth: 30, frameHeight: 34 }); // Placeholder
    }

    create() {
        // Define Global Animation Data
        const unitKeys = [
            'apprentice', 'necromancer', 'mirror', 'assassin', 'talisman', 'ice', 
            'guardian_unit', 'archer', 'tracker', 'chainer', 'monk', 'knight', 
            'alchemist', 'fire', 'ghost_basic'
        ];

        unitKeys.forEach(key => {
            if (this.textures.exists(key)) {
                // Idle Animation
                this.anims.create({
                    key: `${key}_idle`,
                    frames: this.anims.generateFrameNumbers(key, { start: 0, end: 1 }),
                    frameRate: 4,
                    repeat: -1
                });

                // Walk Animation (using idle frames if specific walk frames aren't available)
                this.anims.create({
                    key: `${key}_walk`,
                    frames: this.anims.generateFrameNumbers(key, { start: 0, end: 1 }),
                    frameRate: 6,
                    repeat: -1
                });

                // Attack Animation
                this.anims.create({
                    key: `${key}_attack`,
                    frames: this.anims.generateFrameNumbers(key, { start: 2, end: 3 }),
                    frameRate: 10,
                    repeat: 0
                });

                // Dead Animation (Assuming frames 4-5 are special/death)
                this.anims.create({
                    key: `${key}_dead`,
                    frames: this.anims.generateFrameNumbers(key, { start: 4, end: 5 }),
                    frameRate: 8,
                    repeat: 0
                });
            }
        });

        this.scene.start('MainScene');
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.LOGICAL_WIDTH = 360;
        this.LOGICAL_HEIGHT = 640;
    }

    create() {
        // 1. Initialize Physics Groups for Enemies and Allies
        this.allies = this.physics.add.group({ runChildUpdate: true });
        this.enemies = this.physics.add.group({ runChildUpdate: true });
        this.projectiles = this.physics.add.group({ runChildUpdate: true });
        
        // 2. Setup Card Slots (Zones)
        this.slots = this.add.group();
        this.createSlots();

        // 3. Setup Drag and Drop
        this.setupDragAndDrop();

        // 4. Setup Collision/Overlap Handling
        this.physics.add.overlap(this.projectiles, this.enemies, (projectile, enemy) => {
            enemy.takeDamage(projectile.source.damage);
            projectile.destroy();
        });

        // 5. Connect UI Controls
        const summonBtn = document.getElementById('tower-card');
        if (summonBtn) {
            summonBtn.onclick = () => {
                const emptySlot = this.slots.getChildren().find(s => !s.isOccupied);
                if (emptySlot) {
                    this.summonGuardian(emptySlot, window.unitTypes[0]);
                }
            };
        }

        // 6. Start Spawning Loop based on enemies.js categories
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnWave,
            callbackScope: this,
            loop: true
        });
    }

    createSlots() {
        for (let i = 0; i < 8; i++) {
            this.addSlot(50, 100 + i * 60, 'left');
            this.addSlot(310, 100 + i * 60, 'right');
        }
    }

    addSlot(x, y, side) {
        const slot = this.add.zone(x, y, 50, 50).setRectangleDropZone(50, 50);
        slot.isOccupied = false;
        slot.side = side;
        this.add.rectangle(x, y, 40, 40, 0x555555, 0.3).setStrokeStyle(2, 0x888888);
        this.slots.add(slot);
    }

    setupDragAndDrop() {
        this.input.on('dragstart', (pointer, gameObject) => {
            this.children.bringToTop(gameObject);
            gameObject.setAlpha(0.8);
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragend', (pointer, gameObject, dropped) => {
            gameObject.setAlpha(1);
            if (!dropped) {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        });

        this.input.on('drop', (pointer, gameObject, dropZone) => {
            if (dropZone.isOccupied) {
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

    summonGuardian(slot, unitData) {
        if (slot.isOccupied) return;
        const textureKey = unitData.type === 'guardian' ? 'guardian_unit' : unitData.type;
        const guardian = new Guardian(this, slot.x, slot.y, unitData, textureKey);
        guardian.setInteractive();
        this.input.setDraggable(guardian);
        guardian.currentSlot = slot;
        slot.isOccupied = true;
        this.allies.add(guardian);
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

    spawnWave() {
        const categories = ['basic'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const types = window.enemyCategories[category];
        const typeData = types[Math.floor(Math.random() * types.length)];
        this.spawnEnemy(typeData);
    }

    spawnEnemy(data) {
        const x = Phaser.Math.Between(100, 260);
        const y = -50;
        // All specters start with their 'walk' animation
        const enemy = new Specter(this, x, y, data, 'ghost_basic');
        this.enemies.add(enemy);
    }

    update(time, delta) {}
}

const config = {
    type: Phaser.AUTO,
    width: 360,
    height: 640,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [PreloadScene, MainScene]
};

// Start Game Logic
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-game-btn');
    const startScreen = document.getElementById('start-screen');

    if (startBtn && startScreen) {
        startBtn.addEventListener('click', () => {
            // Start screen transition
            startScreen.classList.add('shrink-to-info');
            
            setTimeout(() => {
                startScreen.style.display = 'none';
                
                // Initialize Phaser Game
                new Phaser.Game(config);

                // Initialize UI Gauges (from enemies.js)
                if (typeof window.updateGauges === 'function') window.updateGauges();
                if (typeof window.updateStageInfo === 'function') window.updateStageInfo();
            }, 800);
        });
    }
});
