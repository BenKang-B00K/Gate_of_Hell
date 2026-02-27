/**
 * VFXManager.js - 파티클 시스템 및 카메라 연출 통합 관리
 */
export class VFXManager {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        
        this.emitters = {};
        this.initParticles();
    }

    initParticles() {
        // 공통 파티클용 텍스처 생성
        const dot = this.scene.add.graphics();
        dot.fillStyle(0xffffff);
        dot.fillRect(0, 0, 4, 4);
        dot.generateTexture('vfx_dot', 4, 4);
        dot.destroy();

        // 1. Fire (불꽃)
        this.emitters.fire = this.scene.add.particles(0, 0, 'vfx_dot', {
            color: [0xff4400, 0xff8800, 0xffff00],
            speed: { min: 50, max: 150 },
            scale: { start: 1, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            emitting: false
        });

        // 2. Ice (냉기)
        this.emitters.ice = this.scene.add.particles(0, 0, 'vfx_dot', {
            color: [0x00aaff, 0xffffff],
            alpha: { start: 0.8, end: 0 },
            speed: { min: 30, max: 80 },
            scale: { start: 1.5, end: 0.5 },
            lifespan: 600,
            emitting: false
        });

        // 3. Holy (신성/기본)
        this.emitters.apprentice = this.scene.add.particles(0, 0, 'vfx_dot', {
            color: [0xffd700, 0xffffff],
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 300,
            blendMode: 'ADD',
            emitting: false
        });

        // 4. Corruption (타락 폭발)
        this.emitters.corruption = this.scene.add.particles(0, 0, 'vfx_dot', {
            color: [0x000000, 0x440000, 0x000000],
            alpha: { start: 1, end: 0 },
            speed: { min: 20, max: 120 },
            scale: { start: 2, end: 0.5 },
            lifespan: 1000,
            blendMode: 'NORMAL',
            emitting: false
        });
    }

    triggerHitEffect(x, y, type) {
        const emitter = this.emitters[type] || this.emitters.apprentice;
        emitter.explode(8, x, y);
    }

    triggerCorruption(x, y) {
        this.emitters.corruption.explode(40, x, y);
        this.shake('medium');
    }

    shake(intensity = 'light') {
        const config = {
            light: { duration: 100, intensity: 0.005 },
            medium: { duration: 200, intensity: 0.01 },
            heavy: { duration: 300, intensity: 0.02 }
        };
        const { duration, intensity: strength } = config[intensity];
        this.camera.shake(duration, strength);
    }
}
