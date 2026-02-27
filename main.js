import { Guardian, Specter, Projectile } from './entities.js';
import { DataManager } from './data_manager.js';

class PreloadScene extends Phaser.Scene {
// ... (PreloadScene content remains same)
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
        // 1. 데이터 매니저 초기화 (Registry 데이터 로드)
        this.dataManager = new DataManager(this);

        // 2. 경제 및 상태 시스템 초기화
        this.initEconomy();

        // 3. 물리 그룹 및 풀링 초기화
        this.allies = this.add.group({ runChildUpdate: true });
        this.enemies = this.physics.add.group({ classType: Specter, runChildUpdate: true });
        this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });
        
        // 4. 필드 레이아웃 (슬롯)
        this.slots = this.add.group();
        this.createSlots();

        // 5. 상호작용 및 물리 설정
        this.setupInteractions();
        this.physics.add.overlap(this.projectiles, this.enemies, this.handleCombat, null, this);

        // 6. 스폰 루프
        this.time.addEvent({ delay: 2000, callback: this.spawnWave, callbackScope: this, loop: true });
    }

    initEconomy() {
        // DataManager가 로드하지 않는 세션 전용 변수 설정
        if (!this.registry.has('portalEnergy')) this.registry.set('portalEnergy', 0);
        this.registry.set('maxPortalEnergy', 1500);
        this.registry.set('enemiesLeft', 0);
        this.registry.set('critChance', 0.1);
        this.registry.set('isTimeFrozen', false);
        this.registry.set('globalSpeedMult', 1.0);

        // Registry -> DOM UI 싱크 리스너 설정
        this.setupUIListeners();
        
        // 초기 UI 강제 업데이트
        this.updateAllUI();
    }

    setupUIListeners() {
        this.registry.events.on('changedata-money', (p, v) => {
            document.getElementById('se-display-text').innerText = Math.floor(v);
            document.getElementById('se-gauge-fill').style.width = `${Math.min(v/10, 100)}%`;
        });
        this.registry.events.on('changedata-portalEnergy', (p, v) => {
            const max = this.registry.get('maxPortalEnergy');
            document.getElementById('portal-energy-label').innerText = `${Math.floor(v)} / ${max}`;
            document.getElementById('portal-gauge-fill').style.width = `${(v/max)*100}%`;
            if (v >= max) this.gameOver();
        });
        this.registry.events.on('changedata-stage', (p, v) => document.getElementById('stage-display').innerText = v);
        this.registry.events.on('changedata-enemiesLeft', (p, v) => document.getElementById('enemies-left').innerText = v);
    }

    updateAllUI() {
        const money = this.registry.get('money');
        const pe = this.registry.get('portalEnergy');
        const stage = this.registry.get('stage');
        const el = this.registry.get('enemiesLeft');

        document.getElementById('se-display-text').innerText = Math.floor(money);
        document.getElementById('stage-display').innerText = stage;
        document.getElementById('enemies-left').innerText = el;
        
        const max = this.registry.get('maxPortalEnergy');
        document.getElementById('portal-energy-label').innerText = `${Math.floor(pe)} / ${max}`;
    }

    handleCombat(projectile, enemy) {
        if (this.registry.get('isTimeFrozen')) return;
        const isCrit = Math.random() < this.registry.get('critChance');
        const damage = projectile.source.damage * (isCrit ? 2 : 1);
        
        enemy.takeDamage(damage, isCrit);
        projectile.disableBody(true, true);

        this.createHitEffect(enemy.x, enemy.y, projectile.source.type);
    }

    createBlackHoleEffect(x, y) {
        const hole = this.add.circle(x, y, 10, 0x000000).setDepth(20);
        const aura = this.add.circle(x, y, 100, 0x9400d3, 0.2).setDepth(19);
        this.tweens.add({
            targets: hole, scale: 5, alpha: 0.8, duration: 500, yoyo: true, hold: 1000,
            onComplete: () => { hole.destroy(); aura.destroy(); }
        });
        this.tweens.add({ targets: aura, scale: 1.5, alpha: 0, duration: 1500 });
    }

    applyTimeFreezeVisuals(isFrozen) {
        if (isFrozen) {
            this.freezeOverlay = this.add.rectangle(180, 320, 360, 640, 0x00aaff, 0.2)
                .setDepth(100).setOrigin(0.5);
        } else {
            if (this.freezeOverlay) this.freezeOverlay.destroy();
        }
    }

    createReapEffect(x, y) {
        const scythe = this.add.text(x, y, '☠️', { fontSize: '64px' }).setOrigin(0.5).setDepth(30);
        this.tweens.add({
            targets: scythe, angle: 360, scale: 2, alpha: 0, duration: 500,
            onComplete: () => scythe.destroy()
        });
    }

    createHitEffect(x, y, type) {
        const emojis = { 'fire': '🔥', 'ice': '❄️', 'apprentice': '✨' };
        const txt = this.add.text(x, y, emojis[type] || '💥', { fontSize: '24px' }).setOrigin(0.5);
        this.tweens.add({ targets: txt, y: y - 60, alpha: 0, duration: 600, onComplete: () => txt.destroy() });
    }

    showDamageText(x, y, amount, isCrit) {
        const txt = this.add.text(x, y, Math.floor(amount), {
            fontSize: isCrit ? '24px' : '18px',
            color: isCrit ? '#ff4444' : '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
    }

    setupInteractions() {
        const summonBtn = document.getElementById('tower-card');
        if (summonBtn) summonBtn.onclick = () => this.trySummon();

        this.input.on('drag', (pointer, obj, dragX, dragY) => { obj.x = dragX; obj.y = dragY; });
        this.input.on('drop', (pointer, obj, zone) => {
            if (zone.isOccupied) {
                const other = this.allies.getChildren().find(a => a.currentSlot === zone);
                if (other) {
                    other.x = obj.currentSlot.x; other.y = obj.currentSlot.y;
                    other.currentSlot = obj.currentSlot;
                }
            } else {
                obj.currentSlot.isOccupied = false;
            }
            obj.x = zone.x; obj.y = zone.y;
            obj.currentSlot = zone;
            zone.isOccupied = true;
        });
    }

    trySummon() {
        const cost = 30;
        if (this.registry.get('money') >= cost) {
            const slot = this.slots.getChildren().find(s => !s.isOccupied);
            if (slot) {
                this.registry.set('money', this.registry.get('money') - cost);
                this.spawnGuardian(slot);
            }
        }
    }

    spawnGuardian(slot) {
        const unitData = window.unitTypes[0];
        const unit = new Guardian(this, slot.x, slot.y, unitData, 'apprentice');
        unit.currentSlot = slot;
        slot.isOccupied = true;
        this.input.setDraggable(unit);
        this.allies.add(unit);

        // 전역 잠금 해제 데이터 기록
        this.dataManager.unlockUnit(unitData.type);
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
        this.add.rectangle(x, y, 40, 40, 0x555555, 0.3).setStrokeStyle(2, 0x888888);
        this.slots.add(slot);
    }

    spawnWave() {
        const types = window.enemyCategories.basic;
        const data = types[Phaser.Math.Between(0, types.length - 1)];
        this.spawnEnemy(data);
    }

    spawnEnemy(data) {
        const x = Phaser.Math.Between(100, 260);
        const enemy = this.enemies.get();
        if (enemy) {
            enemy.spawn(x, -50, data, 'ghost_basic');
            this.registry.set('enemiesLeft', this.registry.get('enemiesLeft') + 1);
            
            // 조우한 적 기록
            this.dataManager.recordEncounter(data.type);
        }
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

    gameOver() {
        document.getElementById('game-over-overlay').style.display = 'flex';
        this.scene.pause();
    }
}

const config = {
    type: Phaser.AUTO,
    width: 360,
    height: 640,
    parent: 'game-container',
    pixelArt: true,
    physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
    scene: [PreloadScene, MainScene]
};

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            document.getElementById('start-screen').style.display = 'none';
            new Phaser.Game(config);
        };
    }
});
