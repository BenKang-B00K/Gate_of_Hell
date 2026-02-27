/**
 * entities.js - Abyss 등급 유닛 궁극기 및 타락 변이 로직 통합본
 */

/**
 * Guardian: 가디언(타워) 클래스
 */
export class Guardian extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, unitData, textureKey) {
        super(scene, x, y, textureKey);
        this.scene = scene;
        this.unitData = unitData;
        this.textureKey = textureKey;

        scene.add.existing(this);
        scene.physics.add.existing(this, true); 

        this.setScale(1.5);
        this.setDepth(10);
        this.setInteractive();

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

        if (this.attackTimer) this.attackTimer.remove();
        this.attackTimer = this.scene.time.addEvent({
            delay: this.cooldown,
            callback: this.autoAttack,
            callbackScope: this,
            loop: true
        });
    }

    autoAttack() {
        if (this.isFrozenTomb || this.isStunned) return;

        const abyssTypes = ['warden', 'cocytus', 'reaper', 'eternal_wall'];
        if (abyssTypes.includes(this.type)) {
            this.executeAbyssSkill();
            return;
        }

        const target = this.scene.getNearestEnemy(this);
        if (target && Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <= this.range) {
            this.fireProjectile(target);
        }
    }

    executeAbyssSkill() {
        if (this.type === 'warden') this.skillWarden();
        else if (this.type === 'cocytus') this.skillCocytus();
        else if (this.type === 'reaper') this.skillReaper();
        else if (this.type === 'eternal_wall') this.skillEternalWall();

        if (this.anims.exists(`${this.textureKey}_attack`)) {
            this.play(`${this.textureKey}_attack`).chain(`${this.textureKey}_idle`);
        }
    }

    skillWarden() {
        const centerX = 180;
        const centerY = 320;
        this.scene.createBlackHoleEffect(centerX, centerY);
        this.scene.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, centerX, centerY);
            this.scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), 300, enemy.body.velocity);
            this.scene.tweens.add({
                targets: enemy, x: centerX + Phaser.Math.Between(-20, 20), y: centerY + Phaser.Math.Between(-20, 20),
                duration: 500, ease: 'Power2',
                onComplete: () => { if (enemy.active) enemy.body.setVelocity(0, 0); }
            });
        });
    }

    skillCocytus() {
        if (this.scene.registry.get('isTimeFrozen')) return;
        this.scene.registry.set('isTimeFrozen', true);
        this.scene.applyTimeFreezeVisuals(true);
        this.scene.time.delayedCall(5000, () => {
            this.scene.registry.set('isTimeFrozen', false);
            this.scene.applyTimeFreezeVisuals(false);
        });
    }

    skillReaper() {
        const enemies = this.scene.enemies.getChildren().filter(e => e.active);
        if (enemies.length === 0) return;
        enemies.sort((a, b) => b.hp - a.hp);
        const target = enemies[0];
        this.scene.createReapEffect(target.x, target.y);
        target.takeDamage(target.hp + 999, false);
    }

    skillEternalWall() {
        this.scene.registry.set('globalSpeedMult', 0.2);
    }

    fireProjectile(target) {
        const projectile = this.scene.projectiles.get(this.x, this.y);
        if (projectile) {
            projectile.fire(target, this);
            if (this.anims.exists(`${this.textureKey}_attack`)) {
                this.play(`${this.textureKey}_attack`).chain(`${this.textureKey}_idle`);
            }
        }
    }

    update(time, delta) {
        if (this.x < 180) this.setFlipX(false);
        else this.setFlipX(true);
    }

    destroy(fromScene) {
        if (this.attackTimer) this.attackTimer.remove();
        if (this.altarEffect) this.altarEffect.destroy();
        super.destroy(fromScene);
    }
}

/**
 * Specter: 적 유령 클래스
 */
export class Specter extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
    }

    spawn(x, y, enemyData, textureKey) {
        this.enableBody(true, x, y, true, true);
        this.setActive(true);
        this.setVisible(true);
        this.setTint(0xffffff); 
        this.setAlpha(1.0);
        this.enemyData = enemyData;
        this.textureKey = textureKey;
        this.setTexture(textureKey);
        this.hp = enemyData.hp;
        this.maxHp = enemyData.hp;
        this.speed = enemyData.speed;
        this.type = enemyData.type;
        this.y_px = y;
        this.initialX_pct = (x / 360) * 100;
        this.vxSign = Math.random() < 0.5 ? -1 : 1;
        this.hasBackstepped = false;
        this.setScale(1.5);
        this.body.setSize(20, 20);
        if (this.anims.exists(`${textureKey}_walk`)) this.play(`${textureKey}_walk`);
    }

    spawnFallen(x, y, originalUnitData, fallenData) {
        this.enableBody(true, x, y, true, true);
        this.setActive(true);
        this.setVisible(true);

        this.type = fallenData.type;
        this.enemyData = fallenData;
        const tex = originalUnitData.type === 'guardian' ? 'guardian_unit' : originalUnitData.type;
        this.textureKey = tex;
        this.setTexture(tex);
        
        // 시각 연출: 어두운 그림자
        this.setTint(0x333333); 
        this.setAlpha(0.85);

        this.hp = fallenData.hp;
        this.maxHp = fallenData.hp;
        this.speed = fallenData.speed;
        
        // 도로 난입 애니메이션
        this.scene.tweens.add({
            targets: this, x: 180, y: this.y + 40,
            scale: 2.2, duration: 500, ease: 'Back.easeIn',
            onComplete: () => {
                this.setScale(1.5);
                if (this.anims.exists(`${this.textureKey}_walk`)) this.play(`${this.textureKey}_walk`);
                this.initialX_pct = 50; 
                this.y_px = this.y;
            }
        });

        this.body.setSize(30, 30);
    }

    update(time, delta) {
        if (!this.active) return;
        if (this.scene.registry.get('isTimeFrozen')) {
            this.body.setVelocity(0, 0);
            this.anims.pause();
            return;
        }
        this.anims.resume();

        const frameAdjust = delta / 16.66;
        const globalSpeed = this.scene.registry.get('globalSpeedMult') || 1.0;
        const currentSpeed = this.speed * globalSpeed * frameAdjust;

        // 특수 능력: Abyssal Eulogist 버프
        if (this.type === 'abyssal_eulogist' && time % 1000 < 20) {
            this.scene.enemies.getChildren().forEach(e => {
                if (e !== this && e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) < 100) {
                    e.speed *= 1.005; 
                }
            });
        }

        // 특수 능력: Harbinger of Doom 소환
        if (this.type === 'harbinger_doom' && time % 4000 < 20) {
            this.scene.spawnEnemy(window.enemyCategories.basic[0]);
        }

        if (this.scene.time.now % 500 < 20) this.scene.leaveDecayTrail(this.x, this.y);

        if (this.type === 'boar') {
            if (this.y_px < 640 * 0.85) {
                this.initialX_pct += this.vxSign * currentSpeed * 0.6;
                if (this.initialX_pct <= 10) { this.initialX_pct = 10; this.vxSign = 1; }
                else if (this.initialX_pct >= 90) { this.initialX_pct = 90; this.vxSign = -1; }
            } else { this.initialX_pct += (50 - this.initialX_pct) * 0.1; }
        } else if (this.type === 'runner' || this.type === 'dimension') {
            this.initialX_pct += Math.sin(this.y_px * 0.04) * 2;
        }

        this.y_px += currentSpeed;
        this.y = this.y_px;
        this.x = (this.initialX_pct / 100) * 360;

        if (this.y >= 650) this.reachPortal();
    }

    takeDamage(amount, isCrit) {
        // Shadow Apostate: 10% 회피
        if (this.type === 'shadow_apostate' && Math.random() < 0.1) {
            this.scene.showDamageText(this.x, this.y, "MISS", false);
            return;
        }

        // Avatar of Void: 20% 피해 감소
        if (this.type === 'avatar_void') amount *= 0.8;

        this.hp -= amount;
        this.setTint(isCrit ? 0xff0000 : 0xffffff); 
        this.scene.time.delayedCall(50, () => { if (this.active) this.setTint(this.enemyData.type.startsWith('fallen') || ['traitorous_neophyte', 'broken_zealot', 'abyssal_eulogist', 'shadow_apostate', 'soul_starved_priest', 'fallen_paladin', 'avatar_void', 'harbinger_doom'].includes(this.type) ? 0x333333 : 0xffffff); });

        const kbDist = (this.type === 'fallen_paladin') ? 0 : (isCrit ? 15 : 5);
        this.y_px = Math.max(0, this.y_px - kbDist); 

        this.scene.showDamageText(this.x, this.y, amount, isCrit);
        if (this.type === 'mimic' && Math.random() < 0.2) this.y_px += 40;
        if (this.type === 'soul_eater') this.speed *= 1.1;
        if (this.hp <= 0) this.die();
    }

    die() {
        const reward = (this.enemyData.reward || 10);
        this.scene.registry.set('money', this.scene.registry.get('money') + reward);
        if (this.anims.exists(`${this.textureKey}_dead`)) {
            this.play(`${this.textureKey}_dead`);
            this.body.stop();
            this.once('animationcomplete', () => this.kill());
        } else { this.kill(); }
    }

    reachPortal() {
        this.scene.registry.set('portalEnergy', this.scene.registry.get('portalEnergy') + this.maxHp * 0.1);
        if (this.scene.onPortalHit) this.scene.onPortalHit();
        this.kill();
    }

    kill() {
        this.setActive(false);
        this.setVisible(false);
        this.disableBody(true, true);
        this.scene.registry.set('enemiesLeft', Math.max(0, this.scene.registry.get('enemiesLeft') - 1));
    }
}

/**
 * Projectile: 투사체 클래스
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
