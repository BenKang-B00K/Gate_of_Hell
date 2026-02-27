/**
 * entities.js - 통합 전투 시스템 및 객체 클래스
 */

/**
 * Guardian: 가디언(타워) 클래스
 * 전직(Job Change) 및 자동 공격 로직 포함
 */
export class Guardian extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, unitData, textureKey) {
        super(scene, x, y, textureKey);
        this.scene = scene;
        this.unitData = unitData;
        this.textureKey = textureKey;

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // 정적 물리 바디

        this.setScale(1.5);
        this.setDepth(10);
        this.setInteractive();

        // 초기 상태 설정
        this.setupUnit();
    }

    setupUnit() {
        this.type = this.unitData.type;
        this.damage = this.unitData.damage;
        this.range = this.unitData.range;
        this.cooldown = this.unitData.cooldown;
        
        if (this.anims.exists(`${this.textureKey}_idle`)) {
            this.play(`${this.textureKey}_idle`);
        }

        // 기존 타이머 제거 후 재설정 (전직 시 필요)
        if (this.attackTimer) this.attackTimer.remove();
        this.attackTimer = this.scene.time.addEvent({
            delay: this.cooldown,
            callback: this.autoAttack,
            callbackScope: this,
            loop: true
        });
    }

    // 전직(Job Change) 로직 통합
    evolve(newUnitData, newTextureKey) {
        this.unitData = newUnitData;
        this.textureKey = newTextureKey;
        this.setTexture(newTextureKey);
        this.setupUnit(); // 능력치 및 애니메이션 갱신
        
        // 시각적 피드백 (전직 이펙트)
        this.scene.tweens.add({
            targets: this,
            scale: { from: 2.2, to: 1.5 },
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    autoAttack() {
        if (this.isFrozenTomb) return;
        const target = this.scene.getNearestEnemy(this);
        if (target && Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <= this.range) {
            this.fireProjectile(target);
        }
    }

    fireProjectile(target) {
        // 객체 풀에서 투사체 가져오기
        const projectile = this.scene.projectiles.get(this.x, this.y);
        if (projectile) {
            projectile.fire(target, this);
            if (this.anims.exists(`${this.textureKey}_attack`)) {
                this.play(`${this.textureKey}_attack`).chain(`${this.textureKey}_idle`);
            }
        }
    }

    update(time, delta) {
        // Face the road
        if (this.x < 180) {
            this.setFlipX(false);
        } else {
            this.setFlipX(true);
        }
    }

    destroy(fromScene) {
        if (this.attackTimer) this.attackTimer.remove();
        super.destroy(fromScene);
    }
}

/**
 * Specter: 적 유닛 클래스
 * Boar, Runner 등 특수 이동 로직 통합 및 풀링 지원
 */
export class Specter extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
    }

    // 풀링을 위한 초기화 메서드
    spawn(x, y, enemyData, textureKey) {
        this.enableBody(true, x, y, true, true);
        this.setActive(true);
        this.setVisible(true);
        
        this.enemyData = enemyData;
        this.textureKey = textureKey;
        this.setTexture(textureKey);
        
        this.hp = enemyData.hp;
        this.maxHp = enemyData.hp;
        this.speed = enemyData.speed;
        this.type = enemyData.type;
        
        this.y_px = y;
        this.initialX_pct = (x / 360) * 100;
        this.swayPhase = Math.random() * Math.PI * 2;
        this.vxSign = Math.random() < 0.5 ? -1 : 1;
        this.hasBackstepped = false;

        this.setScale(1.5);
        this.body.setSize(20, 20);

        if (this.anims.exists(`${textureKey}_walk`)) {
            this.play(`${textureKey}_walk`);
        }
    }

    update(time, delta) {
        if (!this.active) return;

        const frameAdjust = delta / 16.66;
        const targetY = 650; // 포탈 위치
        
        // 1. 특수 이동 로직 (script.js 이식)
        if (this.type === 'boar') {
            if (this.y_px < targetY * 0.85) {
                this.initialX_pct += this.vxSign * this.speed * 0.6 * frameAdjust;
                if (this.initialX_pct <= 10) { this.initialX_pct = 10; this.vxSign = 1; }
                else if (this.initialX_pct >= 90) { this.initialX_pct = 90; this.vxSign = -1; }
            } else {
                this.initialX_pct += (50 - this.initialX_pct) * 0.1 * frameAdjust; 
            }
        } else if (this.type === 'runner' || this.type === 'dimension') {
            this.initialX_pct += Math.sin(this.y_px * 0.04) * 2;
        }

        this.y_px += this.speed * frameAdjust;
        this.y = this.y_px;
        this.x = (this.initialX_pct / 100) * 360;

        if (this.y >= targetY) this.reachPortal();
    }

    takeDamage(amount, isCrit) {
        this.hp -= amount;
        
        // 데미지 팝업 효과
        this.scene.showDamageText(this.x, this.y, amount, isCrit);

        if (this.type === 'mimic' && Math.random() < 0.2) { this.y_px += 40; }
        if (this.type === 'soul_eater') { this.speed *= 1.1; }

        if (this.hp <= 0) this.die();
    }

    die() {
        const currentMoney = this.scene.registry.get('money');
        this.scene.registry.set('money', currentMoney + (this.enemyData.reward || 10));
        
        if (this.anims.exists(`${this.textureKey}_dead`)) {
            this.play(`${this.textureKey}_dead`);
            this.body.stop();
            this.once('animationcomplete', () => this.kill());
        } else {
            this.kill();
        }
    }

    reachPortal() {
        const pe = this.scene.registry.get('portalEnergy');
        this.scene.registry.set('portalEnergy', pe + this.maxHp * 0.1);
        this.kill();
    }

    kill() {
        this.setActive(false);
        this.setVisible(false);
        this.disableBody(true, true);
        const left = this.scene.registry.get('enemiesLeft');
        this.scene.registry.set('enemiesLeft', Math.max(0, left - 1));
    }
}

/**
 * Projectile: 최적화된 투사체 클래스
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'unit_placeholder');
        scene.add.existing(this);
        scene.physics.add.existing(this);
    }

    fire(target, source) {
        this.enableBody(true, source.x, source.y, true, true);
        this.setActive(true);
        this.setVisible(true);
        this.target = target;
        this.source = source;
        this.speed = 400;
        
        // Visual setup (Arcade Sprite used instead of Arc for pooling)
        this.setScale(0.5);
        this.setTint(this.getProjectileColor(source.type));
    }

    update() {
        if (!this.active) return;
        if (!this.target || !this.target.active) {
            this.disableBody(true, true);
            return;
        }
        this.scene.physics.moveToObject(this, this.target, this.speed);
    }

    getProjectileColor(type) {
        const colors = { 'apprentice': 0x00ffff, 'fire': 0xff4400, 'ice': 0x00aaff };
        return colors[type] || 0xffffff;
    }
}
