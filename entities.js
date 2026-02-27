/**
 * entities.js
 * Phaser 3 classes for Gate of Hell
 */

/**
 * Guardian Class - Represents an Ally (Tower/Unit)
 */
export class Guardian extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, unitData) {
        // We use a blank texture or a placeholder since we mainly use the emoji icon
        super(scene, x, y, 'unit_placeholder');
        
        this.scene = scene;
        this.data = unitData;
        
        // Add to scene
        scene.add.existing(this);
        
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
        
        // Scaling and logical positioning
        this.setDepth(10);
        this.iconText.setDepth(11);
    }

    /**
     * Logic to update the Guardian (cooldowns, etc.)
     */
    update(time, delta) {
        if (this.isFrozenTomb) return;
        if (this.isStunned && time < this.stunEndTime) return;
        this.isStunned = false;

        // Sync icon position if sprite moves (though towers are usually static)
        this.iconText.setPosition(this.x, this.y);
    }

    destroy() {
        this.iconText.destroy();
        super.destroy();
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
        
        // Add to scene
        scene.add.existing(this);

        // Emoji Icon Overlay
        this.iconText = scene.add.text(x, y, enemyData.icon, {
            fontSize: '32px',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // HP Bar (Simplified Phaser Graphics)
        this.hpBar = scene.add.graphics();
        
        // Movement & Stats
        this.maxHp = enemyData.hp;
        this.hp = enemyData.hp;
        this.baseSpeed = enemyData.speed;
        this.speed = enemyData.speed;
        this.defense = enemyData.defense || 0;
        
        // Movement state
        // In Phaser, x is 0-360 (logical). In original, x was 10-90 (percent).
        // x is passed in as logical pixels.
        this.initialX_pct = (x / 360) * 100;
        this.targetX_pct = enemyData.targetX || 50; 
        this.y_px = y;
        
        this.swayPhase = enemyData.swayPhase || (Math.random() * Math.PI * 2);
        this.swaySpeed = enemyData.swaySpeed || (0.02 + Math.random() * 0.03);
        this.vxSign = Math.random() < 0.5 ? -1 : 1;
        
        // Constants for logic
        this.LOGICAL_WIDTH = 360;
        this.LOGICAL_HEIGHT = 640;
        this.TARGET_Y = this.LOGICAL_HEIGHT + 10;

        // Visual depth
        this.setDepth(5);
        this.iconText.setDepth(6);
        this.hpBar.setDepth(7);
    }

    /**
     * Movement logic converted from enemies.js / script.js
     */
    update(time, delta) {
        if (this.hp <= 0) return;

        // Delta-based speed adjustment
        const frameAdjust = delta / 16.66;
        
        // Handle Soul Eater speed decay if applicable
        if (this.type === 'soul_eater' && this.speed > this.baseSpeed) {
            this.speed -= 0.05 * frameAdjust;
            if (this.speed < this.baseSpeed) this.speed = this.baseSpeed;
        }

        this.y_px += this.speed * frameAdjust;

        const progress = Math.min(this.y_px / this.TARGET_Y, 1);
        
        let currentX_pct;

        // Type-specific movement patterns
        if (this.type === 'boar') {
            const hf = 0.6;
            if (this.y_px < this.TARGET_Y * 0.85) {
                this.initialX_pct += (this.vxSign) * this.speed * hf * frameAdjust;
                if (this.initialX_pct <= 10) { 
                    this.initialX_pct = 10; 
                    this.vxSign = 1; 
                } else if (this.initialX_pct >= 90) { 
                    this.initialX_pct = 90; 
                    this.vxSign = -1; 
                }
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

    /**
     * Reactive behavior: Take damage
     */
    takeDamage(amount) {
        this.hp -= amount;
        
        // Mimic special: Jump forward
        if (this.type === 'mimic' && Math.random() < 0.2) {
            this.y_px += 40;
        }

        // Soul Eater special: Speed burst
        if (this.type === 'soul_eater') {
            this.speed = this.baseSpeed * 2;
        }

        // Deceiver special: Backstep (once)
        if (this.type === 'deceiver' && !this.hasBackstepped) {
            this.y_px = Math.max(0, this.y_px - 50);
            this.hasBackstepped = true;
        }

        if (this.hp <= 0) {
            this.destroy();
        }
    }

    drawHpBar() {
        this.hpBar.clear();
        const width = 40;
        const height = 4;
        const x = this.x - width / 2;
        const y = this.y - 25;

        // Background
        this.hpBar.fillStyle(0x000000, 0.7);
        this.hpBar.fillRect(x, y, width, height);

        // Fill
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        const fillColor = hpPercent > 0.5 ? 0x00ff00 : (hpPercent > 0.2 ? 0xffff00 : 0ff0000);
        this.hpBar.fillStyle(fillColor, 1);
        this.hpBar.fillRect(x, y, width * hpPercent, height);
    }

    onReachPortal() {
        // Emit event or call scene method
        this.scene.events.emit('enemyReachedPortal', this);
        this.destroy();
    }

    destroy() {
        this.iconText.destroy();
        this.hpBar.destroy();
        super.destroy();
    }
}
