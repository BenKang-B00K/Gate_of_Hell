/**
 * entities.js
 * Phaser 3 classes for Gate of Hell
 */

/**
 * Guardian Class - Represents an Ally (Tower/Unit)
 */
export class Guardian extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, unitData) {
        super(scene, x, y, 'unit_placeholder');
        
        this.scene = scene;
        this.data = unitData;
        
        // Add to scene and physics (Static body for towers)
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        
        // Emoji Icon Overlay
        this.iconText = scene.add.text(x, y, unitData.icon, {
            fontSize: '40px',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Stats from allies_data.js
        this.type = unitData.type;
        this.name = unitData.name;
        this.damage = unitData.damage;
        this.range = unitData.range;
        this.cooldown = unitData.cooldown;
        
        // State
        this.lastShot = 0;
        this.isStunned = false;
        this.stunEndTime = 0;
        this.isFrozenTomb = false;
        
        this.setDepth(10);
        this.iconText.setDepth(11);
    }

    update(time, delta) {
        if (this.isFrozenTomb) return;
        if (this.isStunned && time < this.stunEndTime) return;
        this.isStunned = false;

        this.iconText.setPosition(this.x, this.y);
        
        // Shooting logic handled by MainScene to coordinate with Projectiles group
    }

    destroy() {
        this.iconText.destroy();
        super.destroy();
    }
}

/**
 * Projectile Class - Homing projectile
 */
export class Projectile extends Phaser.GameObjects.Arc {
    constructor(scene, x, y, target, source) {
        super(scene, x, y, 5, 0, 360, false, 0xffffff);
        
        this.scene = scene;
        this.target = target;
        this.source = source;
        this.speed = 400;
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set color based on unit type
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
        
        // Initial homing
        this.scene.physics.moveToObject(this, this.target, this.speed);
    }

    update(time, delta) {
        if (!this.target || !this.target.active || this.target.hp <= 0) {
            this.destroy();
            return;
        }

        // Continually update homing movement (homing/guided missile effect)
        this.scene.physics.moveToObject(this, this.target, this.speed);
    }
}

/**
 * Specter Class - Represents an Enemy
 */
export class Specter extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, enemyData) {
        super(scene, x, y, 'enemy_placeholder');
        
        this.scene = scene;
        this.type = enemyData.type;
        this.icon = enemyData.icon;
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.iconText = scene.add.text(x, y, enemyData.icon, {
            fontSize: '32px',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.hpBar = scene.add.graphics();
        
        this.maxHp = enemyData.hp;
        this.hp = enemyData.hp;
        this.baseSpeed = enemyData.speed;
        this.speed = enemyData.speed;
        this.defense = enemyData.defense || 0;
        
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
        this.iconText.setDepth(6);
        this.hpBar.setDepth(7);
        
        // Adjust physics body size to match emoji
        this.body.setSize(30, 30);
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

        this.iconText.setPosition(this.x, this.y);
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
            this.scene.events.emit('enemyKilled', this);
            this.destroy();
        }
    }

    drawHpBar() {
        this.hpBar.clear();
        const width = 40;
        const height = 4;
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
        this.scene.events.emit('enemyReachedPortal', this);
        this.destroy();
    }

    destroy() {
        this.iconText.destroy();
        this.hpBar.destroy();
        super.destroy();
    }
}
