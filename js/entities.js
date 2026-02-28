/**
 * entities.js - Abyss 등급 유닛 궁극기 및 타락 변이 로직 통합본
 */

/**
 * Guardian: 가디언(타워) 클래스
 */
export class Guardian extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, unitData, textureKey) {
        // [수정] 텍스처 유효성 검사 및 플레이스홀더 적용
        const finalKey = scene.textures.exists(textureKey) ? textureKey : 'unit_placeholder';
        super(scene, x, y, finalKey);
        
        this.scene = scene;
        this.unitData = unitData;
        this.textureKey = textureKey;

        scene.add.existing(this);
        scene.physics.add.existing(this, true); 

        // [수정] 중심점, 스케일, 깊이 보정
        this.setOrigin(0.5, 0.5);
        this.setScale(1.5);
        this.setDepth(20); // 캐릭터를 도로 UI보다 높게 설정
        this.setInteractive();

        this.setupUnit();
    }

    setupUnit() {
        this.type = this.unitData.type;
        this.damage = this.unitData.damage;
        this.range = this.unitData.range;
        this.cooldown = this.unitData.cooldown;
        
        // 애니메이션 안전 재생
        this.playSafe(`${this.textureKey}_idle`);

        if (this.attackTimer) this.attackTimer.remove();
        this.attackTimer = this.scene.time.addEvent({
            delay: this.cooldown,
            callback: this.autoAttack,
            callbackScope: this,
            loop: true
        });
    }

    playSafe(animKey) {
        if (this.scene.anims.exists(animKey)) {
            this.play(animKey);
        } else {
            this.setFrame(0); // 애니메이션 없으면 정지 프레임
        }
    }

    autoAttack() {
        if (!this.active || this.isFrozenTomb || this.isStunned) return;
        if (!this.scene || !this.scene.enemies) return;

        const abyssTypes = ['warden', 'cocytus', 'reaper', 'eternal_wall'];
        if (abyssTypes.includes(this.type)) {
            this.executeAbyssSkill();
            return;
        }

        const target = this.scene.getNearestEnemy(this);
        if (target && target.active && Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) <= this.range) {
            this.fireProjectile(target);
        }
    }

    executeAbyssSkill() {
        if (this.type === 'warden') this.skillWarden();
        else if (this.type === 'cocytus') this.skillCocytus();
        else if (this.type === 'reaper') this.skillReaper();
        else if (this.type === 'eternal_wall') this.skillEternalWall();

        if (this.scene.anims.exists(`${this.textureKey}_attack`)) {
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
            this.playSafe(`${this.textureKey}_attack`);
            this.once('animationcomplete', () => this.playSafe(`${this.textureKey}_idle`));
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
 * Enemy: 기본 적 클래스
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, 'enemy_placeholder');
    }

    spawn(x, y, enemyData, textureKey) {
        this.enableBody(true, x, y, true, true);
        this.setActive(true);
        this.setVisible(true);
        this.setTint(0xffffff); 
        this.setAlpha(1.0);
        
        const finalKey = this.scene.textures.exists(textureKey) ? textureKey : 'enemy_placeholder';
        this.setTexture(finalKey);

        this.enemyData = enemyData;
        this.textureKey = textureKey;
        this.hp = enemyData.hp;
        this.maxHp = enemyData.hp;
        this.speed = enemyData.speed;
        this.type = enemyData.type;
        this.y_px = y;
        
        this.baseX_pct = (x / 360) * 100;
        this.initialX_pct = this.baseX_pct;
        this.vxSign = Math.random() < 0.5 ? -1 : 1;
        this.hasBackstepped = false;

        this.setScale(1.1);
        this.setDepth(15); 
        this.setOrigin(0.5, 0.5);
        
        this.body.setSize(20, 20);
        if (this.scene.anims.exists(`${textureKey}_walk`)) this.play(`${textureKey}_walk`);
    }

    spawnFallenAtStart(x, y, originalUnitData, fallenData, difficultyMult) {
        this.enableBody(true, x, y, true, true);
        this.setActive(true);
        this.setVisible(true);

        this.type = fallenData.type;
        this.enemyData = fallenData;
        const tex = originalUnitData.type === 'guardian' ? 'guardian_unit' : originalUnitData.type;
        this.textureKey = tex;
        
        const finalKey = this.scene.textures.exists(tex) ? tex : 'enemy_placeholder';
        this.setTexture(finalKey);
        
        this.setTint(0xff0000); 
        this.setAlpha(0.85);
        this.setDepth(15);
        this.setOrigin(0.5, 0.5);

        this.maxHp = fallenData.hp * difficultyMult;
        this.hp = this.maxHp;
        this.speed = fallenData.speed;
        
        this.y_px = y;
        this.baseX_pct = (x / 360) * 100;
        this.initialX_pct = this.baseX_pct;
        this.vxSign = Math.random() < 0.5 ? -1 : 1;
        this.hasBackstepped = false;

        this.setScale(1.1);
        this.body.setSize(30, 30);
        if (this.scene.anims.exists(`${this.textureKey}_walk`)) this.play(`${this.textureKey}_walk`);

        this.scene.tweens.add({
            targets: this, scale: 1.5, duration: 300, yoyo: true, ease: 'Quad.easeIn'
        });
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

        if (this.type === 'abyssal_eulogist' && time % 1000 < 20) {
            this.scene.enemies.getChildren().forEach(e => {
                if (e !== this && e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) < 60) {
                    e.speed *= 1.005; 
                }
            });
        }

        if (this.type === 'harbinger_doom' && time % 4000 < 20) {
            this.scene.spawnEnemy(window.enemyCategories.basic[0]);
        }

        if (this.scene.time.now % 500 < 20) this.scene.leaveDecayTrail(this.x, this.y);

        let currentX_pct = this.baseX_pct;

        if (this.type === 'boar') {
            if (this.y_px < 640 * 0.85) {
                this.baseX_pct += this.vxSign * currentSpeed * 0.6;
                if (this.baseX_pct <= 35) { this.baseX_pct = 35; this.vxSign = 1; }
                else if (this.baseX_pct >= 65) { this.baseX_pct = 65; this.vxSign = -1; }
                currentX_pct = this.baseX_pct;
            } else {
                this.baseX_pct += (50 - this.baseX_pct) * 0.1; 
                currentX_pct = this.baseX_pct;
            }
        } else if (this.type === 'runner' || this.type === 'dimension') {
            currentX_pct = this.baseX_pct + Math.sin(this.y_px * 0.05) * 5;
        }

        this.y_px += currentSpeed;
        this.y = this.y_px;
        this.x = (currentX_pct / 100) * 360;

        if (this.y >= 650) this.reachPortal();
    }

    takeDamage(amount, isCrit) {
        if (this.type === 'shadow_apostate' && Math.random() < 0.1) {
            this.scene.showDamageText(this.x, this.y, "MISS", false);
            return;
        }
        if (this.type === 'avatar_void') amount *= 0.8;

        this.hp -= amount;
        this.setTint(isCrit ? 0xff0000 : 0xffffff); 
        this.scene.time.delayedCall(50, () => { 
            if (this.active) {
                const isFallen = ['traitorous_neophyte', 'broken_zealot', 'abyssal_eulogist', 'shadow_apostate', 'soul_starved_priest', 'fallen_paladin', 'avatar_void', 'harbinger_doom'].includes(this.type);
                this.setTint(isFallen ? 0x333333 : 0xffffff); 
            }
        });

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
        if (this.scene.anims.exists(`${this.textureKey}_dead`)) {
            this.play(`${this.textureKey}_dead`);
            this.body.stop();
            if (this.hpBar) this.hpBar.destroy();
            this.once('animationcomplete', () => this.kill());
        } else { this.kill(); }
    }

    reachPortal() {
        this.scene.registry.set('portalEnergy', this.scene.registry.get('portalEnergy') + (this.maxHp * 0.1));
        if (this.scene.onPortalHit) this.scene.onPortalHit();
        this.kill();
    }

    kill() {
        this.setActive(false);
        this.setVisible(false);
        this.disableBody(true, true);
    }
}

/**
 * Specter: 신규 유령 클래스 (Enemy 상속)
 */
export class Specter extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.wigglePhase = Math.random() * Math.PI * 2;
    }

    spawn(x, y, enemyData, textureKey) {
        super.spawn(x, y, enemyData, textureKey);
        this.isBoss = enemyData.isBoss || false;
        if (this.isBoss) {
            this.setScale(1.5);
            this.fearTimer = this.scene.time.addEvent({
                delay: 5000,
                callback: this.emitFearAura,
                callbackScope: this,
                loop: true
            });
        }
    }

    update(time, delta) {
        if (!this.active) return;
        if (this.scene.registry.get('isTimeFrozen')) {
            this.body.setVelocity(0, 0);
            return;
        }

        const frameAdjust = delta / 16.66;
        const globalSpeed = this.scene.registry.get('globalSpeedMult') || 1.0;
        const currentSpeed = this.speed * globalSpeed * frameAdjust;
        
        this.y_px += currentSpeed;
        this.wigglePhase += 0.05 * frameAdjust;
        
        // Wiggle movement (Sin 곡선 좌우 흔들림)
        const wiggleX = Math.sin(this.wigglePhase) * 25;
        this.x = (this.baseX_pct / 100) * 360 + wiggleX;
        this.y = this.y_px;

        if (this.y >= 650) this.reachPortal();
    }

    emitFearAura() {
        if (!this.active) return;
        // 시각 효과 호출 (VFXManager에 triggerFearRipple이 있다고 가정)
        if (this.scene.vfx && this.scene.vfx.triggerFearRipple) {
            this.scene.vfx.triggerFearRipple(this.x, this.y);
        }

        this.scene.allies.getChildren().forEach(unit => {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, unit.x, unit.y);
            if (dist < 150) {
                // 공격 속도 20% 감소 효과 (Stun/Slow 로직 활용)
                unit.isStunned = true; 
                unit.setTint(0x555555);
                this.scene.time.delayedCall(2000, () => {
                    if (unit.active) {
                        unit.isStunned = false;
                        unit.clearTint();
                    }
                });
            }
        });
    }

    kill() {
        if (this.fearTimer) this.fearTimer.remove();
        super.kill();
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
        this.setOrigin(0.5, 0.5);
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
