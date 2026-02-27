import { Guardian, Specter, Projectile } from './entities.js';

class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // Pixel Art Filter Setting (Global for loaded textures)
        this.load.on('filecomplete', (key, type, data) => {
            if (type === 'image' || type === 'spritesheet') {
                const texture = this.textures.get(key);
                texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
            }
        });

        // Placeholder textures
        this.load.image('unit_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
        this.load.image('enemy_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');

        // Loading SpriteSheets (30x34 based on guidelines)
        // Mapping Tier 1
        this.load.spritesheet('apprentice', 'ImageSample/Tier1/견습퇴마사.png', { frameWidth: 30, frameHeight: 34 });
        
        // Mapping Tier 2
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

        // Mapping Tier 3
        this.load.spritesheet('blood_knight', 'ImageSample/Tier3/혈기사.png', { frameWidth: 30, frameHeight: 34 });
        this.load.spritesheet('illusionist', 'ImageSample/Tier3/환영술사.png', { frameWidth: 30, frameHeight: 34 });
        // ... Load others as needed
    }

    create() {
        // Define Animations
        // Assuming 6 frames: 0:Idle-L, 1:Idle-R, 2:Attack-L, 3:Attack-R, 4:Special-L, 5:Special-R
        const units = ['apprentice', 'necromancer', 'mirror', 'assassin', 'talisman', 'ice', 'guardian_unit', 'archer', 'tracker', 'chainer', 'monk', 'knight', 'alchemist', 'fire'];
        
        units.forEach(key => {
            if (this.textures.exists(key)) {
                this.anims.create({
                    key: `${key}_idle`,
                    frames: this.anims.generateFrameNumbers(key, { start: 0, end: 1 }),
                    frameRate: 4,
                    repeat: -1
                });
                this.anims.create({
                    key: `${key}_attack`,
                    frames: this.anims.generateFrameNumbers(key, { start: 2, end: 3 }),
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

    createSlots() {
        for (let i = 0; i < 8; i++) {
            const x = 50;
            const y = 100 + i * 60;
            this.addSlot(x, y, 'left');
        }
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

    setupPhysics() {
        this.physics.add.overlap(this.projectiles, this.enemies, (projectile, enemy) => {
            enemy.takeDamage(projectile.source.damage);
            projectile.destroy();
        });
    }

    summonGuardian(slot, unitData) {
        if (slot.isOccupied) return;

        // Use 'guardian_unit' key for Sanctuary Guardian to avoid conflict with class name
        const textureKey = unitData.type === 'guardian' ? 'guardian_unit' : unitData.type;
        const guardian = new Guardian(this, slot.x, slot.y, unitData, textureKey);
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
        // For now, Specters use enemy_placeholder or same mapping if exists
        const enemy = new Specter(this, x, y, data, 'enemy_placeholder');
        this.enemies.add(enemy);
    }

    update(time, delta) {
        // Individual logic for allies and enemies is handled in their respective update() methods
    }
}

const config = {
    type: Phaser.AUTO,
    width: 360,
    height: 640,
    parent: 'game-container',
    pixelArt: true, // Crucial for dot art
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [PreloadScene, MainScene]
};

const game = new Phaser.Game(config);
export default game;
