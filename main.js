import { Guardian, Specter, Projectile } from './entities.js';
import { DataManager } from './data_manager.js';
import { VFXManager } from './VFXManager.js';

class PreloadScene extends Phaser.Scene {
    constructor() { super('PreloadScene'); }

    preload() {
        this.load.on('filecomplete', (key, type, data) => {
            if (type === 'image' || type === 'spritesheet') {
                const texture = this.textures.get(key);
                texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
            }
        });

        this.load.image('unit_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
        this.load.image('enemy_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');

        const tierPaths = {
            'apprentice': 'ImageSample/Tier1/견습퇴마사.png',
            'necromancer': 'ImageSample/Tier2/강령술사.png',
            'mirror': 'ImageSample/Tier2/거울 예언자.png',
            'assassin': 'ImageSample/Tier2/그림자 암살자.png',
            'talisman': 'ImageSample/Tier2/부적술사.png',
            'ice': 'ImageSample/Tier2/빙결 도사.png',
            'guardian_unit': 'ImageSample/Tier2/성소 수호자.png',
            'archer': 'ImageSample/Tier2/신성한 궁수.png',
            'tracker': 'ImageSample/Tier2/영혼 추적자.png',
            'chainer': 'ImageSample/Tier2/영혼의 결박자.png',
            'monk': 'ImageSample/Tier2/철퇴 승려.png',
            'knight': 'ImageSample/Tier2/퇴마 기사.png',
            'alchemist': 'ImageSample/Tier2/퇴마 연금술사.png',
            'fire': 'ImageSample/Tier2/화염 마법사.png'
        };

        Object.entries(tierPaths).forEach(([key, path]) => {
            this.load.spritesheet(key, path, { frameWidth: 30, frameHeight: 34 });
        });

        this.load.spritesheet('ghost_basic', 'ImageSample/Tier1/견습퇴마사.png', { frameWidth: 30, frameHeight: 34 });
    }

    create() {
        const unitKeys = ['apprentice', 'necromancer', 'mirror', 'assassin', 'talisman', 'ice', 'guardian_unit', 'archer', 'tracker', 'chainer', 'monk', 'knight', 'alchemist', 'fire', 'ghost_basic'];
        unitKeys.forEach(key => {
            if (this.textures.exists(key)) {
                this.anims.create({ key: `${key}_idle`, frames: this.anims.generateFrameNumbers(key, { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
                this.anims.create({ key: `${key}_walk`, frames: this.anims.generateFrameNumbers(key, { start: 0, end: 1 }), frameRate: 6, repeat: -1 });
                this.anims.create({ key: `${key}_attack`, frames: this.anims.generateFrameNumbers(key, { start: 2, end: 3 }), frameRate: 10, repeat: 0 });
                this.anims.create({ key: `${key}_dead`, frames: this.anims.generateFrameNumbers(key, { start: 4, end: 5 }), frameRate: 8, repeat: 0 });
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
        // 1. 매니저 초기화 (Registry 데이터 로드 포함)
        this.dataManager = new DataManager(this);
        this.vfx = new VFXManager(this);

        // 2. 물리 그룹 및 풀링
        this.allies = this.add.group({ runChildUpdate: true });
        this.enemies = this.physics.add.group({ classType: Specter, runChildUpdate: true });
        this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });
        
        // 3. 레이아웃 (슬롯)
        this.slots = this.add.group();
        this.createSlots();

        // 4. 시스템 설정
        this.setupCombat();
        this.setupInteractions();
        this.initWaveState();

        // 5. 스폰 루프
        this.spawnEvent = this.time.addEvent({
            delay: 2000,
            callback: this.spawnWave,
            callbackScope: this,
            loop: true
        });
    }

    initWaveState() {
        this.waveSpawnedCount = 0;
        this.totalWaveEnemies = 10 + (this.registry.get('stage') * 2);
        this.registry.set('enemiesLeft', 0);
    }

    setupCombat() {
        this.physics.add.overlap(this.projectiles, this.enemies, (projectile, enemy) => {
            if (this.registry.get('isTimeFrozen') || !enemy.active) return;
            const isCrit = Math.random() < this.registry.get('critChance');
            const damage = projectile.source.damage * (isCrit ? 2 : 1);
            enemy.takeDamage(damage, isCrit);
            this.vfx.triggerHitEffect(enemy.x, enemy.y, projectile.source.type);
            projectile.disableBody(true, true);
        }, null, this);
    }

    spawnWave() {
        if (this.waveSpawnedCount >= this.totalWaveEnemies) return;

        const stage = this.registry.get('stage');
        const categories = ['basic', 'pattern', 'enhanced'];
        const cat = stage < 3 ? 'basic' : categories[Phaser.Math.Between(0, categories.length - 1)];
        const types = window.enemyCategories[cat] || window.enemyCategories.basic;
        const data = types[Phaser.Math.Between(0, types.length - 1)];

        const enemy = this.enemies.get();
        if (enemy) {
            const x = Phaser.Math.Between(130, 230);
            enemy.spawn(x, -50, data, 'ghost_basic');
            this.waveSpawnedCount++;
            this.registry.set('enemiesLeft', this.registry.get('enemiesLeft') + 1);
            this.dataManager.recordEncounter(data.type);
        }
    }

    setupInteractions() {
        const summonBtn = document.getElementById('tower-card');
        if (summonBtn) {
            summonBtn.onclick = () => {
                const cost = 30; // 기본 소환 비용
                if (this.registry.get('money') >= cost) {
                    const slot = this.slots.getChildren().find(s => !s.isOccupied);
                    if (slot) {
                        this.registry.set('money', this.registry.get('money') - cost);
                        this.spawnGuardian(slot);
                    }
                }
            };
        }

        this.input.on('drag', (ptr, obj, dragX, dragY) => { obj.x = dragX; obj.y = dragY; });
        this.input.on('drop', (ptr, obj, zone) => {
            if (zone.isOccupied) {
                const other = this.allies.getChildren().find(a => a.currentSlot === zone);
                if (other) {
                    other.x = obj.currentSlot.x; other.y = obj.currentSlot.y;
                    other.currentSlot = obj.currentSlot;
                }
            } else { obj.currentSlot.isOccupied = false; }
            obj.x = zone.x; obj.y = zone.y;
            obj.currentSlot = zone;
            zone.isOccupied = true;
        });
    }

    spawnGuardian(slot) {
        const unitData = window.unitTypes[0];
        const unit = new Guardian(this, slot.x, slot.y, unitData, 'apprentice');
        unit.currentSlot = slot;
        slot.isOccupied = true;
        this.input.setDraggable(unit);
        this.allies.add(unit);
        unit.altarEffect = this.drawSacredPattern(slot);
        this.dataManager.unlockUnit(unitData.type);
    }

    createSlots() {
        // 전장 영역 120-120-120 분할에 맞춘 슬롯 배치 (상단 UI 피함)
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 2; col++) {
                this.addSlot(30 + col * 40, 100 + row * 55, 'left');
                this.addSlot(290 + col * 40, 100 + row * 55, 'right');
            }
        }
    }

    addSlot(x, y, side) {
        const slot = this.add.zone(x, y, 35, 35).setRectangleDropZone(35, 35);
        slot.isOccupied = false;
        this.add.rectangle(x, y, 30, 30, 0x555555, 0.2).setStrokeStyle(1, 0xffd700, 0.2);
        this.slots.add(slot);
    }

    drawSacredPattern(slot) {
        const pattern = this.add.graphics({ x: slot.x, y: slot.y }).setDepth(1);
        pattern.lineStyle(1, 0xffd700, 0.3);
        pattern.strokeCircle(0, 0, 15);
        this.tweens.add({ targets: pattern, angle: 360, duration: 10000, repeat: -1 });
        return pattern;
    }

    getNearestEnemy(source) {
        let nearest = null;
        let minDist = Infinity;
        this.enemies.getChildren().forEach(e => {
            if (!e.active) return;
            const d = Phaser.Math.Distance.Between(source.x, source.y, e.x, e.y);
            if (d < minDist) { minDist = d; nearest = e; }
        });
        return nearest;
    }

    update(time, delta) {
        // 1. 게임 오버 체크
        const pe = this.registry.get('portalEnergy');
        const maxPe = this.registry.get('maxPortalEnergy');
        if (pe >= maxPe) {
            this.scene.pause();
            document.getElementById('game-over-overlay').style.display = 'flex';
            return;
        }

        // 2. 스테이지 진행 체크 (그룹 내 활성화된 적이 없고 스폰이 끝났을 때)
        const activeEnemies = this.enemies.countActive(true);
        if (this.waveSpawnedCount >= this.totalWaveEnemies && activeEnemies === 0) {
            this.startNextStage();
        }
    }

    startNextStage() {
        const nextStage = this.registry.get('stage') + 1;
        this.registry.set('stage', nextStage);
        
        // 시각적 알림 (Floating Text)
        this.showFloatingText(180, 200, `DEPTH ${nextStage} REACHED`, '#ffd700');
        
        // 보너스 SE 지급
        const bonus = 50 + (nextStage * 10);
        this.registry.set('money', this.registry.get('money') + bonus);

        this.initWaveState();
    }
}

function handleResize() {
    const container = document.getElementById('game-container');
    if (!container) return;
    const scale = Math.min(window.innerWidth / 360, window.innerHeight / 640);
    container.style.transform = `scale(${scale})`;
    container.style.left = `${(window.innerWidth - 360 * scale) / 2}px`;
    container.style.top = `${(window.innerHeight - 640 * scale) / 2}px`;
    container.style.position = 'absolute';
}

const config = {
    type: Phaser.AUTO, width: 360, height: 640, parent: 'game-container', pixelArt: true,
    physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
    scene: [PreloadScene, MainScene]
};

document.addEventListener('DOMContentLoaded', () => {
    handleResize();
    window.addEventListener('resize', handleResize);
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            document.getElementById('start-screen').classList.add('shrink-to-info');
            setTimeout(() => {
                document.getElementById('start-screen').style.display = 'none';
                new Phaser.Game(config);
            }, 800);
        };
    }
});
