/**
 * enemies.js - Pure Data Definitions for Specters and Bosses
 */

window.enemyCategories = {
    basic: [
        { type: 'normal', icon: '👻', speed: 1.5, hp: 110, reward: 4, desc: "Common soul lingering in the abyss." }, 
        { type: 'mist', icon: '🌫️', speed: 1.2, hp: 140, reward: 4, desc: "Spectral fog that drifts slowly." },
        { type: 'memory', icon: '👣', speed: 1.8, hp: 90, reward: 4, desc: "Faint trace of a once-living being." },
        { type: 'shade', icon: '👤', speed: 2.2, hp: 60, reward: 5, desc: "Weak but fast spirit." },
        { type: 'tank', icon: '💀', speed: 0.8, hp: 160, defense: 8, reward: 7, desc: "Soul hardened by sin." },
        { type: 'runner', icon: '⚡', speed: 2.5, hp: 35, reward: 6, desc: "Agile shadow rushing the portal." }
    ],
    pattern: [
        { type: 'mimic', icon: '📦', speed: 1.1, hp: 180, defense: 15, reward: 12, desc: "Occasionally blinks forward when targeted." },
        { type: 'dimension', icon: '🌀', speed: 1.8, hp: 80, reward: 12, desc: "Occasionally phases out of existence." }
    ],
    enhanced: [
        { type: 'boar', icon: '🐗', speed: 0.5, hp: 250, defense: 8, reward: 15, desc: "Accelerates as it nears the portal." }, 
        { type: 'soul_eater', icon: '🧿', speed: 1.2, hp: 220, defense: 12, reward: 15, desc: "Gains speed burst when damaged." }
    ],
    fallen: [
        { type: 'traitorous_neophyte', icon: '👤', speed: 2.5, hp: 300, reward: 20 },
        { type: 'broken_zealot', icon: '⛪', speed: 0.8, hp: 600, defense: 15, reward: 20 },
        { type: 'abyssal_eulogist', icon: '🕯️', speed: 1.2, hp: 1000, reward: 60 },
        { type: 'shadow_apostate', icon: '🗡️', speed: 1.8, hp: 800, reward: 60 },
        { type: 'soul_starved_priest', icon: '🩸', speed: 1.0, hp: 2500, reward: 150 },
        { type: 'fallen_paladin', icon: '🛡️', speed: 0.7, hp: 4000, reward: 150 },
        { type: 'avatar_void', icon: '💠', speed: 0.9, hp: 8000, reward: 400 },
        { type: 'harbinger_doom', icon: '🛶', speed: 0.6, hp: 12000, reward: 400 }
    ]
};

window.bossData = {
    10: { name: "Cerberus", type: "cerberus", icon: '👺', hp: 2500, speed: 0.35 },
    20: { name: "Charon", type: "charon", icon: '🛶', hp: 4500, speed: 0.25 }, 
    30: { name: "Beelzebub", type: "beelzebub", icon: '🪰', hp: 8000, speed: 0.25 }, 
    40: { name: "Lucifer", type: "lucifer", icon: '👑', hp: 15000, speed: 0.2 } 
};

// TTK Optimized Multipliers (Log-Linear Hybrid)
window.getStageMultipliers = function() {
    const stage = (Phaser.Gdx && Phaser.Gdx.registry) ? Phaser.Gdx.registry.get('stage') : 1;
    let hpMult = (stage <= 50) ? (1 + (stage * 0.25) + Math.log2(stage)) : (13.5 * (1 + (stage - 50) * 0.08));
    return { hpStageMult: hpMult, speedStageMult: 1 + (Math.atan(stage / 20) * 0.5) };
};
