import { Guardian, Specter, Projectile } from './entities.js';
import { DataManager } from './data_manager.js';
import { VFXManager } from './VFXManager.js';

class PreloadScene extends Phaser.Scene {
    constructor() { super('PreloadScene'); }

    preload() {
        // [수정] Graphics로 실시간 텍스처 생성 (base64 에러 및 회색박스 방지)
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // Guardian용 푸른색 플레이스홀더
        graphics.fillStyle(0x00aaff, 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokeRect(0, 0, 32, 32);
        graphics.generateTexture('unit_placeholder', 32, 32);
        graphics.clear();

        // Specter용 붉은색 플레이스홀더
        graphics.fillStyle(0xff4444, 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.lineStyle(2, 0xffff00, 1);
        graphics.strokeRect(0, 0, 32, 32);
        graphics.generateTexture('enemy_placeholder', 32, 32);

        this.load.on('filecomplete', (key, type) => {
            if (type === 'spritesheet') {
                const tex = this.textures.get(key);
                if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
            }
        });

        const tierPaths = {
            'apprentice': 'ImageSample/Tier1/견습퇴마사.png',
            'knight': 'ImageSample/Tier2/퇴마 기사.png',
            'archer': 'ImageSample/Tier2/신성한 궁수.png',
            'fire': 'ImageSample/Tier2/화염 마법사.png',
            'ice': 'ImageSample/Tier2/빙결 도사.png',
            'necromancer': 'ImageSample/Tier2/강령술사.png',
            'mirror': 'ImageSample/Tier2/거울 예언자.png',
            'assassin': 'ImageSample/Tier2/그림자 암살자.png',
            'talisman': 'ImageSample/Tier2/부적술사.png',
            'guardian_unit': 'ImageSample/Tier2/성소 수호자.png',
            'tracker': 'ImageSample/Tier2/영혼 추적자.png',
            'chainer': 'ImageSample/Tier2/영혼의 결박자.png',
            'monk': 'ImageSample/Tier2/철퇴 승려.png',
            'alchemist': 'ImageSample/Tier2/퇴마 연금술사.png'
        };

        Object.entries(tierPaths).forEach(([key, path]) => {
            this.load.spritesheet(key, path, { frameWidth: 30, frameHeight: 34 });
        });

        this.load.spritesheet('ghost_basic', 'ImageSample/Tier1/견습퇴마사.png', { frameWidth: 30, frameHeight: 34 });
    }

    create() {
        const keys = ['apprentice', 'knight', 'archer', 'fire', 'ice', 'necromancer', 'mirror', 'assassin', 'talisman', 'guardian_unit', 'tracker', 'chainer', 'monk', 'alchemist', 'ghost_basic'];
        keys.forEach(k => {
            if (this.textures.exists(k)) {
                this.anims.create({ key: `${k}_idle`, frames: this.anims.generateFrameNumbers(k, { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
                this.anims.create({ key: `${k}_walk`, frames: this.anims.generateFrameNumbers(k, { start: 0, end: 1 }), frameRate: 6, repeat: -1 });
                this.anims.create({ key: `${k}_attack`, frames: this.anims.generateFrameNumbers(k, { start: 2, end: 3 }), frameRate: 10 });
                this.anims.create({ key: `${k}_dead`, frames: this.anims.generateFrameNumbers(k, { start: 4, end: 5 }), frameRate: 8 });
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
        this.dataManager = new DataManager(this);
        this.vfx = new VFXManager(this);

        this.registry.set('towerCost', 30);
        this.registry.set('maxTowers', 16);

        if (window.syncUIWithRegistry) window.syncUIWithRegistry();

        this.allies = this.add.group({ runChildUpdate: true });
        this.enemies = this.physics.add.group({ classType: Specter, runChildUpdate: true });
        this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });
        
        this.slots = this.add.group();
        this.createSlots();

        this.setupCombat();
        this.setupInteractions();
        this.initWaveState();

        this.time.addEvent({
            delay: 2000,
            callback: this.spawnWave,
            callbackScope: this,
            loop: true
        });
    }

    initWaveState() {
        this.waveSpawnedCount = 0;
        const total = 10 + (this.registry.get('stage') * 2);
        this.totalWaveEnemies = total;
        
        // Registry에 스테이지 총 적 수와 현재 남은 스폰 수 저장
        this.registry.set('totalEnemiesInStage', total);
        this.registry.set('enemiesLeft', total);
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
            // [수정] 도로 정중앙 부근(140~220)에서 스폰 강제
            const x = Phaser.Math.Between(140, 220);
            enemy.spawn(x, -50, data, 'ghost_basic');
            this.waveSpawnedCount++;
            
            // [수정] 스폰될 때마다 남은 대기 수 감소
            const currentLeft = this.registry.get('enemiesLeft');
            this.registry.set('enemiesLeft', Math.max(0, currentLeft - 1));
            
            this.dataManager.recordEncounter(data.type);
        }
    }

    setupInteractions() {
        const summonBtn = document.getElementById('tower-card');
        if (summonBtn) {
            summonBtn.onclick = () => this.trySummon();
        }

        this.input.on('drag', (ptr, obj, dragX, dragY) => { obj.x = dragX; obj.y = dragY; });
        this.input.on('drop', (ptr, obj, zone) => {
            if (zone.isOccupied) {
                const other = this.allies.getChildren().find(a => a.currentSlot === zone);
                if (other) {
                    const oldSlot = obj.currentSlot;
                    other.x = oldSlot.x; other.y = oldSlot.y;
                    other.currentSlot = oldSlot;
                    if (other.altarEffect) other.altarEffect.setPosition(oldSlot.x, oldSlot.y);
                }
            } else { obj.currentSlot.isOccupied = false; }
            obj.x = zone.x; obj.y = zone.y;
            obj.currentSlot = zone;
            zone.isOccupied = true;
            if (obj.altarEffect) obj.altarEffect.setPosition(zone.x, zone.y);
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
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 3; col++) {
                this.addSlot(20 + col * 40, 80 + row * 50, 'left');
                this.addSlot(260 + col * 40, 80 + row * 50, 'right');
            }
        }
    }

    addSlot(x, y, side) {
        const slot = this.add.zone(x, y, 35, 35).setRectangleDropZone(35, 35);
        slot.isOccupied = false;
        slot.side = side;
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

    showDamageText(x, y, amount, isCrit) {
        const txt = this.add.text(x, y, amount === "MISS" ? "MISS" : Math.floor(amount), {
            fontSize: isCrit ? '24px' : '16px',
            color: isCrit ? '#ff4444' : '#ffffff',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(100);
        this.tweens.add({ targets: txt, y: y - 50, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
    }

    onPortalHit() {
        this.vfx.shake('heavy');
        this.cameras.main.flash(200, 150, 0, 0);
    }

    leaveDecayTrail(x, y) {
        const stain = this.add.circle(x, y, 3, 0x2e0854, 0.2).setDepth(1);
        this.tweens.add({ targets: stain, scale: 2, alpha: 0, duration: 1500, onComplete: () => stain.destroy() });
    }

    update(time, delta) {
        const pe = this.registry.get('portalEnergy');
        if (pe >= this.registry.get('maxPortalEnergy')) {
            this.scene.pause();
            const over = document.getElementById('game-over-overlay');
            if (over) over.style.display = 'flex';
            return;
        }

        const activeEnemies = this.enemies.countActive(true);
        if (this.waveSpawnedCount >= this.totalWaveEnemies && activeEnemies === 0) {
            this.startNextStage();
        }
    }

    startNextStage() {
        const nextStage = this.registry.get('stage') + 1;
        this.registry.set('stage', nextStage);
        this.showFloatingText(180, 200, `DEPTH ${nextStage}`, '#ffd700');
        this.registry.set('money', this.registry.get('money') + 50 + (nextStage * 5));
        this.initWaveState();
    }

    showFloatingText(x, y, message, color) {
        const txt = this.add.text(x, y, message, {
            fontSize: '20px', color: color, fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(100);
        this.tweens.add({ targets: txt, y: y - 100, alpha: 0, duration: 2000, ease: 'Cubic.easeOut', onComplete: () => txt.destroy() });
    }

    trySummon() {
        const cost = this.registry.get('towerCost');
        const money = this.registry.get('money');
        const activeUnits = this.allies.countActive(true);
        const maxUnits = this.registry.get('maxTowers');

        if (activeUnits >= maxUnits) {
            this.showMaxLimitWarning();
            return;
        }

        if (money >= cost) {
            const slot = this.slots.getChildren().find(s => !s.isOccupied);
            if (slot) {
                this.registry.set('money', money - cost);
                this.spawnGuardian(slot);
                const nextCost = Math.min(200, cost + 5);
                this.registry.set('towerCost', nextCost);
            }
        }
    }

    showMaxLimitWarning() {
        const warn = document.getElementById('max-units-warning');
        if (warn) {
            warn.innerText = "???: 지옥의 문이 거부한다... 더이상의 퇴마사는 안돼!";
            warn.style.display = 'block';
            warn.style.animation = 'cursePulse 0.5s infinite';
            this.vfx.shake('light');
            this.time.delayedCall(1500, () => {
                warn.style.display = 'none';
            });
        }
    }

    tryCorrupt(guardian) {
        if (!guardian) return;
        const slot = guardian.currentSlot;
        const tier = guardian.unitData.tier || 1;
        const refund = Math.floor((guardian.spentSE || 30) * 0.5);
        this.registry.set('money', this.registry.get('money') + refund);
        if (guardian.altarEffect) guardian.altarEffect.destroy();
        slot.isOccupied = false;
        this.vfx.triggerCorruption(guardian.x, guardian.y);
        this.showFloatingText(guardian.x, guardian.y, '성스러운 서약이 깨졌습니다', '#ff4444');
        const fallenMap = { 1: ['traitorous_neophyte', 'broken_zealot'], 2: ['abyssal_eulogist', 'shadow_apostate'], 3: ['soul_starved_priest', 'fallen_paladin'], 4: ['avatar_void', 'harbinger_doom'] };
        const selectedType = fallenMap[tier][Math.random() < 0.5 ? 0 : 1];
        const enemyData = window.enemyCategories.fallen.find(e => e.type === selectedType);
        const fallen = this.enemies.get();
        if (fallen) {
            const spawnX = Phaser.Math.Between(130, 230);
            const stageMult = window.getStageMultipliers ? window.getStageMultipliers().hpStageMult : 1;
            fallen.spawnFallenAtStart(spawnX, -50, guardian.unitData, enemyData, stageMult);
        }
        guardian.destroy();
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
    type: Phaser.AUTO,
    width: 360, height: 640,
    parent: 'game-container',
    transparent: true, // [수정] 배경 투명화
    pixelArt: true,
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
                window.gameInstance = new Phaser.Game(config);
            }, 800);
        };
    }
});
