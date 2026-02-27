/**
 * entities.js
 * Phaser 3 classes for Gate of Hell
 */

/**
 * Guardian Class - Represents an Ally (Tower/Unit)
 */
export class Guardian extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, unitData, textureKey) {
        super(scene, x, y, textureKey);
        
        this.scene = scene;
        this.data = unitData;
        this.textureKey = textureKey;
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        
        // Scale for 360x640 logical resolution (1.5x based on 30x34 base)
        this.setScale(1.5);
        
        // Start idle animation based on unit type
        if (this.anims.exists(`${textureKey}_idle`)) {
            this.play(`${textureKey}_idle`);
        }

        // Stats
        this.type = unitData.type;
        this.name = unitData.name;
        this.damage = unitData.damage;
        this.range = unitData.range;
        this.cooldown = unitData.cooldown;
        
        this.isStunned = false;
        this.stunEndTime = 0;
        this.isFrozenTomb = false;
        
        this.setDepth(10);

        // Phaser Time Event for Auto Attack
        this.attackTimer = this.scene.time.addEvent({
            delay: this.cooldown,
            callback: this.autoAttack,
            callbackScope: this,
            loop: true
        });
    }

    autoAttack() {
        if (this.isFrozenTomb) return;
        
        // Stun check
        if (this.isStunned) {
            if (this.scene.time.now < this.stunEndTime) return;
            this.isStunned = false;
        }

        const target = this.scene.getNearestEnemy(this);
        if (target) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
            if (dist <= this.range) {
                this.shoot(target);
            }
        }
    }

    shoot(target) {
        // Create and add projectile to scene's projectile group
        const projectile = new Projectile(this.scene, this.x, this.y, target, this);
        if (this.scene.projectiles) {
            this.scene.projectiles.add(projectile);
        }
        
        // Play attack animation
        if (this.anims.exists(`${this.textureKey}_attack`)) {
            this.play(`${this.textureKey}_attack`).chain(`${this.textureKey}_idle`);
        }
    }

    update(time, delta) {
        // Face the road
        if (this.x < 180) {
            this.setFlipX(false); // Face right
        } else {
            this.setFlipX(true); // Face left
        }
    }

    destroy(fromScene) {
        if (this.attackTimer) {
            this.attackTimer.remove();
        }
        super.destroy(fromScene);
    }
}

/**
 * Projectile Class - Homing projectile
 */
export class Projectile extends Phaser.GameObjects.Arc {
    constructor(scene, x, y, target, source) {
        super(scene, x, y, 4, 0, 360, false, 0xffffff);
        
        this.scene = scene;
        this.target = target;
        this.source = source;
        this.speed = 400;
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        const colors = {
            'apprentice': 0x00ffff,
            'chainer': 0x888888,
            'talisman': 0xffa500,
            'monk': 0xffff00,
            'archer': 0x00ff00,
            'ice': 0x00aaff,
            'fire': 0xff4400,
            'assassin': 0xff00ff
        };
        this.setFillStyle(colors[source.type] || 0xffffff);
        this.setDepth(15);
        this.scene.physics.moveToObject(this, this.target, this.speed);
    }

    update(time, delta) {
        if (!this.target || !this.target.active || this.target.hp <= 0) {
            this.destroy();
            return;
        }
        this.scene.physics.moveToObject(this, this.target, this.speed);
    }
}

/**
 * Specter Class - Represents an Enemy
 */
export class Specter extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, enemyData, textureKey) {
        super(scene, x, y, textureKey);
        
        this.scene = scene;
        this.type = enemyData.type;
        this.textureKey = textureKey;
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.hpBar = scene.add.graphics();
        
        this.maxHp = enemyData.hp;
        this.hp = enemyData.hp;
        this.baseSpeed = enemyData.speed;
        this.speed = enemyData.speed;
        
        this.initialX_pct = (x / 360) * 100;
        this.targetX_pct = enemyData.targetX || 50; 
        this.y_px = y;
        
        this.swayPhase = enemyData.swayPhase || (Math.random() * Math.PI * 2);
        this.swaySpeed = enemyData.swaySpeed || (0.02 + Math.random() * 0.03);
        this.vxSign = Math.random() < 0.5 ? -1 : 1;
        this.hasBackstepped = false;
        
        this.LOGICAL_WIDTH = 360;
        this.LOGICAL_HEIGHT = 640;
        this.TARGET_Y = this.LOGICAL_HEIGHT + 10;

        this.setDepth(5);
        this.hpBar.setDepth(7);
        this.setScale(1.5);
        this.body.setSize(20, 20);

        if (this.anims.exists(`${textureKey}_walk`)) {
            this.play(`${textureKey}_walk`);
        }
    }

    update(time, delta) {
        if (this.hp <= 0) return;
        const frameAdjust = delta / 16.66;
        if (this.type === 'soul_eater' && this.speed > this.baseSpeed) {
            this.speed -= 0.05 * frameAdjust;
            if (this.speed < this.baseSpeed) this.speed = this.baseSpeed;
        }
        this.y_px += this.speed * frameAdjust;
        const progress = Math.min(this.y_px / this.TARGET_Y, 1);
        let currentX_pct;

        if (this.type === 'boar') {
            const hf = 0.6;
            if (this.y_px < this.TARGET_Y * 0.85) {
                this.initialX_pct += (this.vxSign) * this.speed * hf * frameAdjust;
                if (this.initialX_pct <= 10) { this.initialX_pct = 10; this.vxSign = 1; }
                else if (this.initialX_pct >= 90) { this.initialX_pct = 90; this.vxSign = -1; }
                currentX_pct = this.initialX_pct;
            } else {
                this.initialX_pct += (this.targetX_pct - this.initialX_pct) * 0.1 * frameAdjust;
                currentX_pct = this.initialX_pct;
            }
        } else if (this.type === 'runner' || this.type === 'dimension') {
            currentX_pct = this.initialX_pct + (this.targetX_pct - this.initialX_pct) * progress;
            currentX_pct += Math.sin(this.y_px * 0.04) * 8;
        } else if (['normal', 'mist', 'memory', 'shade', 'tank'].includes(this.type)) {
            this.swayPhase += this.swaySpeed * frameAdjust;
            currentX_pct = this.initialX_pct + (this.targetX_pct - this.initialX_pct) * progress;
            currentX_pct += Math.sin(this.swayPhase) * 3;
        } else {
            currentX_pct = this.initialX_pct + (this.targetX_pct - this.initialX_pct) * progress;
        }

        this.x = (currentX_pct / 100) * this.LOGICAL_WIDTH;
        this.y = this.y_px;
        
        this.drawHpBar();
        if (this.y >= this.TARGET_Y) {
            this.onReachPortal();
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.type === 'mimic' && Math.random() < 0.2) { this.y_px += 40; }
        if (this.type === 'soul_eater') { this.speed = this.baseSpeed * 2; }
        if (this.type === 'deceiver' && !this.hasBackstepped) { this.y_px = Math.max(0, this.y_px - 50); this.hasBackstepped = true; }
        
        if (this.hp <= 0) {
            // Reward Soul Energy via Registry
            const currentMoney = this.scene.registry.get('money');
            this.scene.registry.set('money', currentMoney + 10); // Base reward 10
            
            // Decrement enemies left
            const enemiesLeft = this.scene.registry.get('enemiesLeft');
            this.scene.registry.set('enemiesLeft', Math.max(0, enemiesLeft - 1));

            this.scene.events.emit('enemyKilled', this);
            
            // Play death animation
            if (this.anims.exists(`${this.textureKey}_dead`)) {
                this.play(`${this.textureKey}_dead`);
                this.body.stop();
                this.hpBar.destroy();
                this.once('animationcomplete', () => {
                    this.destroy();
                });
            } else {
                this.destroy();
            }
        }
    }

    drawHpBar() {
        this.hpBar.clear();
        const width = 40; const height = 4;
        const x = this.x - width / 2;
        const y = this.y - 25;
        this.hpBar.fillStyle(0x000000, 0.7);
        this.hpBar.fillRect(x, y, width, height);
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        const fillColor = hpPercent > 0.5 ? 0x00ff00 : (hpPercent > 0.2 ? 0xffff00 : 0xff0000);
        this.hpBar.fillStyle(fillColor, 1);
        this.hpBar.fillRect(x, y, width * hpPercent, height);
    }

    onReachPortal() {
        // Update Portal Energy via Registry
        const currentEnergy = this.scene.registry.get('portalEnergy');
        this.scene.registry.set('portalEnergy', currentEnergy + this.maxHp * 0.1);
        
        // Decrement enemies left
        const enemiesLeft = this.scene.registry.get('enemiesLeft');
        this.scene.registry.set('enemiesLeft', Math.max(0, enemiesLeft - 1));

        this.scene.events.emit('enemyReachedPortal', this);
        this.destroy();
    }

    destroy(fromScene) {
        this.hpBar.destroy();
        super.destroy(fromScene);
    }
}
