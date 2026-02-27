/* enemies.js */
let gameContainer;
let road;

// Global state and variables
const enemies = []; // Enemy list
const towers = []; // Tower list
const slots = []; // Slot elements storage
const walls = []; // Necromancer wall list
const groundEffects = []; // Ground effect list (AOE)
const friendlySkeletons = []; // Ally skeleton soldier list
const friendlyGhosts = []; // Forsaken King ally ghosts

let stage = 1;
let money = 150;
let damageMultiplier = 1.0;
let critChance = 0;
let critMultiplier = 1.5;
let totalStageEnemies = 0;
let currentStageSpawned = 0;
let lastSpawnTime = 0;
let isStageStarting = false;
let isBossStage = false;
let bossSpawned = false;
let bossInstance = null;
let globalSpeedFactor = 1.0;
let treasureChance = 0.0033;

let isTimeFrozen = false;
let timeFreezeEndTime = 0;
let sealedGhostCount = 0;
let portalEnergy = 0;
const maxPortalEnergy = 1500;
let draggedUnit = null; // Currently dragged unit
window.encounteredEnemies = new Set();

// --- Exorcism Records Data ---
window.killCounts = window.killCounts || {}; // Track kills by type

function recordKill(type) {
    window.killCounts[type] = (window.killCounts[type] || 0) + 1;
    if (typeof saveGameData === 'function') saveGameData();
}

function getBestiaryBonus(type) {
    const kills = window.killCounts[type] || 0;
    const basicSpecters = ['normal', 'mist', 'memory', 'shade', 'tank', 'runner'];
    const specializedWraiths = ['greedy', 'mimic', 'dimension', 'deceiver', 'boar', 'soul_eater', 'frost', 'lightspeed', 'heavy', 'lava', 'burning'];
    
    if (basicSpecters.includes(type)) {
        return 1 + (Math.floor(kills / 20) * 0.05); // +5% per 20 kills
    } else if (specializedWraiths.includes(type)) {
        return 1 + (Math.floor(kills / 10) * 0.08); // +8% per 10 kills
    }

    return 1;
}

// Calculate gradual stage-based multipliers
function getStageMultipliers(isBoss = false) {
    if (isBoss) return { hpStageMult: 1.0, speedStageMult: 1.0 };
    
    let hpRate = 1.05;
    let speedRate = 0.003;

    // Difficulty scaling
    if (stage >= 15) {
        hpRate = 1.08; // Increased from 1.06 for late game challenge
        speedRate = 0.008; // Faster specters in late game
    } else if (stage >= 5) {
        hpRate = 1.07; // Increased from 1.06
        speedRate = 0.006; // Increased from 0.005
    }

    // Apply Relic Enemy HP reduction
    let hpStageMult = Math.pow(hpRate, stage - 1);
    const relicHPReduction = (typeof getRelicBonus === 'function') ? getRelicBonus('enemy_hp') : 0;
    if (relicHPReduction < 0) {
        hpStageMult *= (1.0 + relicHPReduction);
    }

    // Apply Relic Enemy Speed reduction
    let speedStageMult = 1 + (stage - 1) * speedRate;
    const relicSpeedReduction = (typeof getRelicBonus === 'function') ? getRelicBonus('enemy_speed') : 0;
    if (relicSpeedReduction < 0) {
        speedStageMult *= (1.0 + relicSpeedReduction);
    }

    return { hpStageMult, speedStageMult };
}

// Enemy data (Categorized)
const enemyCategories = {
    basic: [
        { type: 'normal', icon: '👻', speed: 4.5, hp: 110, defense: 0, probability: 0.35, reward: 4, desc: "A common soul lingering in the abyss. No special traits.", effectiveness: "Standard exorcism attacks.", lore: "A soul that couldn't let go of earthly regrets, now aimlessly wandering the dark." }, 
        { type: 'mist', icon: '🌫️', speed: 3.9, hp: 140, defense: 0, probability: 0.15, reward: 4, desc: "A spectral fog that drifts slowly. No special traits.", effectiveness: "Standard exorcism attacks.", lore: "Condensation of thousands of tiny, forgotten sorrows." },
        { type: 'memory', icon: '👣', speed: 5.1, hp: 90, defense: 0, probability: 0.15, reward: 4, desc: "A faint trace of a once-living being. No special traits.", effectiveness: "Standard exorcism attacks.", lore: "Not even a full soul, just the impression left by a strong desire to live." },
        { type: 'shade', icon: '👤', speed: 6.6, hp: 60, defense: 0, probability: 0.1, reward: 5, desc: "A weak but fast spirit that moves in a blurring motion.", effectiveness: "Rapid-fire units.", lore: "The faintest remains of a soul, barely holding onto existence." },
        { type: 'tank', icon: '💀', speed: 2.25, hp: 160, defense: 8, probability: 0.15, reward: 7, desc: "A soul hardened by sin. High HP and moderate defense.", effectiveness: "Critical hits and defense-ignoring assassins.", lore: "The weight of their heavy sins in life has manifested as an unbreakable iron shell." },  
        { type: 'runner', icon: '⚡', speed: 6.6, hp: 35, defense: 0, probability: 0.1, reward: 6, desc: "An agile shadow that rushes toward the portal at high speed.", effectiveness: "Slowing chains or frost energy.", lore: "A thief who spent a lifetime fleeing from justice, now cursed to run for eternity." },
        { type: 'defiled_apprentice', icon: '🥀', speed: 1.8, hp: 400, defense: 5, probability: 0.05, reward: 15, desc: "A trainee who touched forbidden arts. 10% chance to curse attacker's damage (-3, lasts 5s).", effectiveness: "Holy attacks and high DPS.", lore: "One moment of weakness, one forbidden scroll, and a soul is lost forever." }
    ],
    pattern: [
        { type: 'greedy', icon: '🧛', speed: 3.6, hp: 150, defense: 5, probability: 0.2, reward: 12, desc: "Forcibly relocates the attacking unit to a random slot on hit (10% chance).", effectiveness: "High range snipers to minimize movement.", lore: "Driven mad by avarice, this spirit tries to steal the very ground the exorcists stand on." }, 
        { type: 'mimic', icon: '📦', speed: 3.3, hp: 180, defense: 15, probability: 0.1, reward: 12, desc: "Occasionally blinks forward when targeted (20% chance).", effectiveness: "AOE or slow effects.", lore: "It takes the form of what you desire most, only to reveal its true, hollow self." },
        { type: 'dimension', icon: '🌀', speed: 5.4, hp: 80, defense: 0, probability: 0.2, reward: 12, desc: "Occasionally phases out of existence, becoming immune to attacks (1% chance per frame).", effectiveness: "Truth-seeking seers or rapid-fire units.", lore: "A hermit who sought to hide from the world, now drifting between dimensions of pain." }, 
        { type: 'deceiver', icon: '🎭', speed: 4.2, hp: 120, defense: 5, probability: 0.2, reward: 12, desc: "Backsteps and evades when an exorcist first targets them (100% chance, once).", effectiveness: "Area damage or multiple hunters.", lore: "A master of lies whose face was never seen, now eternally hiding behind a spectral mask." },
        { type: 'betrayer_blade', icon: '🗡️', speed: 5.4, hp: 500, defense: 5, probability: 0.15, reward: 25, desc: "A shadow traitor. Occasionally vanishes, forcing attackers to lose target.", effectiveness: "AOE or rapid-fire units.", lore: "The shadow he hid in became his master, and finally, his prison." },
        { type: 'cursed_vajra', icon: '🏮', speed: 1.5, hp: 1500, defense: 20, probability: 0.1, reward: 40, desc: "A fallen monk. 15% chance to stun the attacker for 1s when hit.", effectiveness: "Long-range units.", lore: "His mace, once used to protect, now only seeks to crush the living." },
        { type: 'void_piercer', icon: '🏹', speed: 3.6, hp: 600, defense: 5, probability: 0.05, reward: 30, desc: "A traitorous archer. Gains 50% dodge chance against long-range units.", effectiveness: "Short-range units.", lore: "The arrows of light have turned into shards of pure nothingness." }
    ],
    enhanced: [
        { type: 'boar', icon: '🐗', speed: 1.5, hp: 250, defense: 8, probability: 0.25, reward: 15, desc: "Accelerates exponentially as it nears the portal.", effectiveness: "Knockback and heavy stuns near the gate.", lore: "A violent hunter who enjoyed the thrill of the chase, now driven by an uncontrollable bloodlust." }, 
        { type: 'soul_eater', icon: '🧿', speed: 3.6, hp: 220, defense: 12, probability: 0.1, reward: 15, desc: "Gains a short burst of speed whenever it takes damage.", effectiveness: "High damage single hits.", lore: "It hungers not for flesh, but for the very essence of your exorcists' power." },
        { type: 'frost', icon: '❄️', speed: 3.0, hp: 180, defense: 5, probability: 0.25, reward: 12, desc: "Emits a freezing aura that boosts the speed of nearby specters.", effectiveness: "Priority targeting and fire energy.", lore: "Died alone in a blizzard, their heart frozen by isolation and cold resentment." }, 
        { type: 'lightspeed', icon: '✨', speed: 9.6, hp: 60, defense: 0, probability: 0.2, reward: 18, desc: "Moves at incredible speed and ignores speed-boosting auras.", effectiveness: "Instant-kill guardians or void snipers.", lore: "A messenger who failed to deliver a life-saving word, now desperate to reach the end." },
        { type: 'frost_outcast', icon: '❄️', speed: 2.1, hp: 800, defense: 10, probability: 0.1, reward: 35, desc: "A cursed daoist. Emits a cold aura that slows nearby allies' attack speed by 20%.", effectiveness: "Kill from outside its aura range.", lore: "Her heart was frozen long before she entered the abyss." },
        { type: 'ember_hatred', icon: '☄️', speed: 2.4, hp: 700, defense: 0, probability: 0.1, reward: 30, desc: "A hateful mage. Explodes on death, speeding up nearby enemies by 50% for 3s.", effectiveness: "Kill when isolated.", lore: "Fueling the fire with the very hatred that consumed his life." }
    ],
    armoured: [
        { type: 'heavy', icon: '⛓️', speed: 1.2, hp: 600, defense: 20, probability: 0.3, knockbackResist: 0.8, reward: 20, desc: "An massive behemoth with high defense and knockback resistance.", effectiveness: "Soul link shared damage or high-penetration strikes.", lore: "An executioner who took pride in their cruelty, now bound by the very chains they once used." }, 
        { type: 'lava', icon: '🌋', speed: 3.9, hp: 200, defense: 15, probability: 0.2, reward: 18, desc: "Cleanses freeze effects and leaps forward when hit by cold energy.", effectiveness: "Avoid frost; use standard magic or fire.", lore: "A soul consumed by a fiery temper, now literally burning with an unquenchable rage." }, 
        { type: 'burning', icon: '💢', speed: 3.0, hp: 350, defense: 10, probability: 0.2, reward: 15, desc: "Consumes its own vengeful energy to heal every time it is struck.", effectiveness: "High single-hit damage to overwhelm recovery.", lore: "A martyr whose sacrifice was forgotten, their pain now fueling a cycle of endless regrowth." },
        { type: 'abyssal_acolyte', icon: '🌑', speed: 1.2, hp: 1200, defense: 15, probability: 0.2, reward: 50, desc: "A servant of the void. Reduces hit source's damage by 4 per hit (Max 3 stacks).", effectiveness: "Burst damage or stuns.", lore: "The shadow arms are the grip of the abyss pulling them deeper." },
        { type: 'bringer_of_doom', icon: '⛓️‍💥', speed: 0.9, hp: 3000, defense: 30, probability: 0.1, reward: 150, desc: "[Rare Behemoth] Permanently reduces damage of 2 random slots by 7.", effectiveness: "Kill as fast as possible!", lore: "Where they walk, the ground itself weeps. No sanctity remains." }
    ],
    treasure: [
        { type: 'gold', icon: '💎', speed: 7.5, hp: 80, defense: 50, probability: 1.0, reward: 200, desc: "A rare spirit that grants a massive amount of Soul Energy upon defeat.", effectiveness: "Rapid-fire assassins to bypass high defense.", lore: "The residual essence of a king's hoard, still sparkling with the vanity of the past." } 
    ]
};

// Boss data
const bossData = {
    10: { name: "Cerberus", type: "cerberus", icon: '👺', hp: 2500, speed: 1.05, size: 180, rewardName: "Cerberus's Fang", rewardEffect: 0.1, lore: "The triple-headed guardian of the gate, driven mad by the endless flow of corrupt souls." },
    20: { name: "Charon", type: "charon", icon: '🛶', hp: 4500, speed: 0.75, size: 180, rewardName: "Stygian Oar", rewardEffect: 0.15, lore: "The ferryman of the dead, now harvesting souls for himself instead of delivering them." }, 
    30: { name: "Beelzebub", type: "beelzebub", icon: '🪰', hp: 8000, speed: 0.75, size: 180, rewardName: "Crown of Gluttony", rewardEffect: 0.01, lore: "The Lord of the Flies, spawned from the rot of every broken promise in history." }, 
    40: { name: "Lucifer", type: "lucifer", icon: '👑', hp: 15000, speed: 0.6, size: 210, rewardName: "Fallen Angel's Wings", rewardEffect: 0.1, lore: "The first to fall, seeking to drag every other light into the same bottomless abyss." } 
};

function showBossWarning(bossName) {
    const modal = document.getElementById('unlock-modal');
    const header = document.getElementById('unlock-header');
    const icon = document.getElementById('unlock-icon');
    const name = document.getElementById('unlock-name');
    const desc = document.getElementById('unlock-desc');
    
    if (modal && header && icon && name && desc) {
        header.innerText = "⚠️ WARNING! BOSS APPEARED!";
        header.style.color = "#ff0000";
        icon.innerText = "👿";
        name.innerText = bossName;
        desc.innerText = "A powerful entity has emerged from the depths! Prepare for a fierce battle.";
        modal.style.display = 'flex';
        isPaused = true;
    }
}

// Initialize stage
function initStage() {
    isBossStage = (stage % 10 === 0); // Boss stage every 10 levels
    bossSpawned = false;
    bossInstance = null;
    
    // Check for difficulty increase message
    const diffMsgContainer = document.getElementById('difficulty-msg-container');
    const diffMsg = document.getElementById('difficulty-msg');
    if (diffMsg && diffMsgContainer) {
        let msg = "";
        if (stage === 6) msg = "SHADOWS DEEPEN...";
        else if (stage === 16) msg = "ABYSS AWAKENS!";
        else if (stage === 31) msg = "ETERNAL NIGHTFALL";
        else if (stage === 51) msg = "THE VOID CONSUMES ALL";

        if (msg) {
            diffMsg.innerText = msg;
            diffMsg.classList.remove('difficulty-anim');
            void diffMsg.offsetWidth; // Trigger reflow
            diffMsg.classList.add('difficulty-anim');
            
            // Make clickable to close
            diffMsgContainer.style.pointerEvents = 'auto';
            diffMsgContainer.onclick = () => {
                diffMsg.classList.remove('difficulty-anim');
                diffMsg.style.opacity = 0;
                diffMsgContainer.style.pointerEvents = 'none';
            };
        }
    }

    // Unseal Gatekeeper
    sealedGhostCount = 0; 

    if (isBossStage) {
        totalStageEnemies = 15; 
        const bossName = bossData[stage] ? bossData[stage].name : "Unknown Boss";
        
        const tutorialToggle = document.getElementById('tutorial-toggle');
        if (tutorialToggle && tutorialToggle.checked) {
            showBossWarning(bossName);
        }
    }
    else if (stage <= 2) {
        totalStageEnemies = Math.floor(Math.random() * 6) + 12; // 12-17 (Reduced from 20-30)
    } else {
        // Gradually increase, then cap at 40-45 from stage 20 (Reduced from 60-70)
        const baseMin = Math.min(40, 15 + (stage - 2) * 1.5);
        totalStageEnemies = Math.floor(Math.random() * 6) + Math.floor(baseMin);
    }
    currentStageSpawned = 0;
    updateStageInfo();

    // Stage start delay (5s for stage 1, 3s for others)
    isStageStarting = true;
    let countdown = (stage === 1) ? 5 : 3;
    const timerElement = document.getElementById('start-timer');
    timerElement.style.display = 'block';
    timerElement.innerText = countdown;

    const timerInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            timerElement.innerText = countdown;
        } else {
            clearInterval(timerInterval);
            timerElement.innerText = "SPECTERS INCOMING!";
            
            // [Master] King of the Forsaken logic
            if (typeof towers !== 'undefined') {
                const forsakenKings = towers.filter(t => t.data.type === 'forsaken_king');
                if (forsakenKings.length > 0) {
                    const spawnCount = 3; // Fixed count or other logic
                    for(let i=0; i<spawnCount; i++) {
                        spawnFriendlyGhost();
                    }
                }
            }

            setTimeout(() => {
                timerElement.style.display = 'none';
                isStageStarting = false;
            }, 1000);
        }
    }, 1000);
}

// Update All Gauges (Soul Energy & Portal Energy)
function updateGauges() {
    // Portal Energy Gauge (Below Portal)
    const portalFill = document.getElementById('portal-gauge-fill');
    const portalText = document.getElementById('portal-energy-label');
    const portalElement = document.getElementById('portal');
    if (portalFill && portalText) {
        const portalRatio = Math.min(portalEnergy / maxPortalEnergy, 1);
        const portalPercent = portalRatio * 100;
        portalFill.style.width = `${portalPercent}%`;
        portalText.innerText = `${Math.floor(portalEnergy)} / ${maxPortalEnergy}`;

        // Portal Glow Effect: Transitions to dark red as it fills
        if (portalElement) {
            const glowStrength = 25 + (portalRatio * 50);
            
            // Purple base glow (Lower priority as it fills)
            let shadow = `0 -5px ${glowStrength}px rgba(148, 0, 211, ${0.7 - portalRatio * 0.4})`;
            
            // Strong Dark Red / Black "Corruption" Aura
            if (portalRatio > 0.2) {
                const redIntensity = (portalRatio - 0.2) * 1.25; 
                // Layer multiple shadows for "spreading" effect
                shadow += `, 0 -10px ${glowStrength * 1.5}px rgba(139, 0, 0, ${redIntensity})`;
                shadow += `, 0 -15px ${glowStrength * 2.5}px rgba(255, 0, 0, ${redIntensity * 0.4})`;
                shadow += `, 0 -5px 40px rgba(0, 0, 0, ${redIntensity})`;
            }
            
            if (portalRatio > 0.8) {
                shadow += `, 0 0 15px white`;
            }

            portalElement.style.boxShadow = shadow;
            portalElement.style.filter = `brightness(${1 + portalRatio * 0.3})`;

            // Intense shaking when near death (Fixed to not dislocate)
            if (portalRatio > 0.85) {
                portalElement.style.animation = 'portalShake 0.1s infinite';
            } else {
                portalElement.style.animation = 'none';
            }
        }
    }

    // Soul Energy Gauge
    const seFill = document.getElementById('se-gauge-fill');
    const seText = document.getElementById('se-display-text');
    if (seFill && seText) {
        // Max cap for display (e.g., 1000 Soul Energy for 100% fill)
        const displayMax = 1000;
        const sePercent = Math.min((money / displayMax) * 100, 100);
        seFill.style.width = `${sePercent}%`;
        seText.innerText = Math.floor(money); // Ensure floor
    }
}

// Update stage information display
function updateStageInfo() {
    const stageDisplay = document.getElementById('stage-display');
    const stageNameElem = document.getElementById('stage-name');
    const enemiesLeft = document.getElementById('enemies-left');
    
    if (stageDisplay) stageDisplay.innerText = stage;
    
    if (stageNameElem) {
        let name = "Whispering Gates";
        if (stage >= 51) name = "Nightmare Realm";
        else if (stage >= 41) name = "The Eternal Abyss";
        else if (stage >= 31) name = "Shadow Sanctum";
        else if (stage >= 21) name = "Wailing Corridors";
        else if (stage >= 11) name = "Desolate Path";
        stageNameElem.innerText = name;
    }

    if (enemiesLeft) {
        if (isBossStage) {
            enemiesLeft.innerText = "BOSS";
        } else {
            const remainingToSpawn = Math.max(0, totalStageEnemies - currentStageSpawned);
            enemiesLeft.innerText = remainingToSpawn + enemies.length;
        }
    }
}

// Attach to window for other scripts
window.updateGauges = updateGauges;
window.updateStageInfo = updateStageInfo;

// Spawn wave
function spawnWave() {
    if (currentStageSpawned >= totalStageEnemies && !isBossStage) return;
    if (isBossStage && bossSpawned && currentStageSpawned >= totalStageEnemies) return;

    if (isBossStage && !bossSpawned) {
        spawnBoss();
        bossSpawned = true;
    }

    let min = 1, max = 2; // Default small wave
    if (isBossStage) {
        min = 1; max = 2; 
    } else if (stage >= 20) {
        min = 2; max = 4; // Max 4 even in late game
    } else if (stage >= 10) {
        min = 1; max = 3;
    }
    
    let count = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!isBossStage && count > totalStageEnemies - currentStageSpawned) {
        count = totalStageEnemies - currentStageSpawned;
    }

    for(let i=0; i<count; i++) {
        setTimeout(() => {
            if (isPaused) return; // Don't spawn if game paused during sequence
            spawnEnemy();
        }, i * 350); // 0.35s delay between each enemy
    }
    lastSpawnTime = Date.now() + (count * 350); // Adjust lastSpawnTime to account for sequence duration
}

// Spawn boss
function spawnBoss() {
    const road = document.getElementById('road');
    const frozenOverlay = document.getElementById('frozen-overlay');
    const data = bossData[stage] || { name: "Boss", type: "cerberus", hp: 3000, speed: 0.3, size: 60 };
    
    if (typeof recordUnlock === 'function') {
        recordUnlock(data.type, true);
    }

    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy', 'boss', 'spawning', data.type);
    enemyDiv.innerText = data.icon; 
    
    // Remove spawning class after animation
    setTimeout(() => {
        enemyDiv.classList.remove('spawning');
    }, 500);

    // HP Bar
    const hpBg = document.createElement('div');
    hpBg.className = 'hp-bar-bg';
    const hpFill = document.createElement('div');
    hpFill.className = 'hp-bar-fill';
    hpBg.appendChild(hpFill);
    enemyDiv.appendChild(hpBg);
    
    const { hpStageMult, speedStageMult } = getStageMultipliers(true);

    const boss = {
        element: enemyDiv,
        hpFill: hpFill,
        initialX: 50,
        x: 50,
        targetX: 50, // Bosses go to center
        y: 0,
        baseSpeed: data.speed * speedStageMult,
        speed: data.speed * speedStageMult,
        maxHp: data.hp * hpStageMult,
        hp: data.hp * hpStageMult,
        reward: 500,         // Add reward for boss
        isBoss: true,
        data: data,
        lastAbilityTime: Date.now()
    };

    // Enemy click event
    enemyDiv.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (typeof window.showEnemyInfo === 'function') {
            window.showEnemyInfo(boss);
        }
    });

    road.appendChild(enemyDiv);
    enemyDiv.style.left = '50%';
    enemyDiv.style.top = '0px';

    enemies.push(boss);
    bossInstance = boss;

    if (data.type === 'charon') {
        for(let i=0; i<5; i++) spawnPassenger(boss);
    }

    if (data.type === 'lucifer') {
        frozenOverlay.style.opacity = 1; 
        
        // Absolute Zero ability
        setTimeout(() => {
            if (boss.hp > 0) {
                const activeTowers = towers.filter(t => !t.isFrozenTomb);
                if (activeTowers.length > 0) {
                    const target = activeTowers[0]; 
                    target.isFrozenTomb = true;
                    target.element.classList.add('frozen-tomb');
                    
                    const tutorialToggle = document.getElementById('tutorial-toggle');
                    if (tutorialToggle && tutorialToggle.checked) {
                        alert("🥶 Lucifer's [Absolute Zero]! An exorcist has been permanently frozen!");
                    }
                }
            }
        }, 3000);
    }
}

// Spawn individual enemy
function spawnEnemy() {
    const road = document.getElementById('road');
    currentStageSpawned++;
    updateStageInfo();

    const relicTreasureBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('treasure_chance') : 0;
    const finalTreasureChance = treasureChance + relicTreasureBonus;
    
    let probs;
    if (stage === 1) {
        probs = { basic: 1.0, pattern: 0, enhanced: 0, armoured: 0, treasure: 0 };
    } else if (stage >= 51) {
        // Nightmare (50+) - Adjusted basic from 0.20 to 0.30
        probs = { basic: 0.30, pattern: 0.23, enhanced: 0.23, armoured: 0.23, treasure: finalTreasureChance };
    } else if (stage >= 41) {
        // Late (41-50) - Adjusted basic from 0.40 to 0.50
        probs = { basic: 0.50, pattern: 0.17, enhanced: 0.17, armoured: 0.15, treasure: finalTreasureChance };
    } else if (stage >= 31) {
        // Mid-Late (31-40) - Adjusted basic from 0.55 to 0.65
        probs = { basic: 0.65, pattern: 0.12, enhanced: 0.12, armoured: 0.10, treasure: finalTreasureChance };
    } else if (stage >= 21) {
        // Mid (21-30) - Adjusted basic from 0.70 to 0.80
        probs = { basic: 0.80, pattern: 0.07, enhanced: 0.07, armoured: 0.05, treasure: finalTreasureChance };
    } else if (stage >= 11) {
        // Early-Mid (11-20) - Adjusted basic from 0.85 to 0.90
        probs = { basic: 0.90, pattern: 0.03, enhanced: 0.04, armoured: 0.02, treasure: finalTreasureChance };
    } else {
        // Early (2-10)
        probs = { basic: 0.95, pattern: 0.015, enhanced: 0.015, armoured: 0.01, treasure: finalTreasureChance };
    }

    // Adjust basic to accommodate treasure chance correctly
    const actualTreasure = probs.treasure;
    probs.basic = Math.max(0, probs.basic - actualTreasure);

    const randCat = Math.random();
    let accumulatedCatProb = 0;
    let category = 'basic';

    for (const [key, value] of Object.entries(probs)) {
        accumulatedCatProb += value;
        if (randCat < accumulatedCatProb) {
            category = key;
            break;
        }
    }

    let enemyTypes = enemyCategories[category];
    
    // Stage 1 special restriction: Only Normal and Shade
    if (stage === 1 && category === 'basic') {
        enemyTypes = enemyTypes.filter(e => e.type === 'normal' || e.type === 'shade');
    }

    const randEnemy = Math.random();
    let accumulatedEnemyProb = 0;
    let selectedType = enemyTypes[0];

    // Calculate total probability of current set to normalize
    const totalSetProb = enemyTypes.reduce((sum, e) => sum + e.probability, 0);
    let currentRand = Math.random() * totalSetProb;

    for (const enemyType of enemyTypes) {
        currentRand -= enemyType.probability;
        if (currentRand <= 0) {
            selectedType = enemyType;
            break;
        }
    }

    if (typeof recordUnlock === 'function') {
        recordUnlock(selectedType.type, true);
    }

    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy', 'spawning');
    enemyDiv.classList.add(selectedType.type);
    enemyDiv.innerText = selectedType.icon;
    
    // Remove spawning class after animation
    setTimeout(() => {
        enemyDiv.classList.remove('spawning');
    }, 500);

    // HP Bar
    const hpBg = document.createElement('div');
    hpBg.className = 'hp-bar-bg';
    const hpFill = document.createElement('div');
    hpFill.className = 'hp-bar-fill';
    hpBg.appendChild(hpFill);
    enemyDiv.appendChild(hpBg);

    const { hpStageMult, speedStageMult } = getStageMultipliers();

    // Road is 340px wide, centered in 1080px (approx 34.2% to 65.8%)
    const randomX = Math.random() * 20 + 40; 
    const enemy = {
        element: enemyDiv,
        hpFill: hpFill,
        initialX: randomX,
        x: randomX,
        targetX: Math.random() * 20 + 40, // Narrower range to stay within the 340px road
        y: -40, // Spawn higher up inside the mist
        swayPhase: Math.random() * Math.PI * 2, // Random starting phase for swaying
        swaySpeed: 0.02 + Math.random() * 0.03, // Unique swaying speed
        baseSpeed: selectedType.speed * speedStageMult,
        speed: selectedType.speed * speedStageMult,
        maxHp: selectedType.hp * hpStageMult,
        defense: selectedType.defense || 0,
        hp: selectedType.hp * hpStageMult,
        reward: selectedType.reward || 10,
        type: selectedType.type,
        icon: selectedType.icon,
        desc: selectedType.desc,
        isPhasing: false,
        isSilenced: false,
        isFrozen: false,
        isSlowed: false,
        hasBackstepped: false
    };

    // Enemy click event
    enemyDiv.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (typeof window.showEnemyInfo === 'function') {
            window.showEnemyInfo(enemy); 
        }
    });

    road.appendChild(enemyDiv);
    enemyDiv.style.left = `${randomX}%`;
    enemyDiv.style.top = '-40px';

    // Special initialization for Boar (Feral Revenant)
    if (selectedType.type === 'boar') {
        enemy.vxSign = Math.random() < 0.5 ? -1 : 1; 
    }

    enemies.push(enemy);
}

// Charon's passengers
function spawnPassenger(boss) {
    const road = document.getElementById('road');
    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy', 'normal', 'boarded', 'spawning');
    road.appendChild(enemyDiv);
    
    // Remove spawning class after animation
    setTimeout(() => {
        enemyDiv.classList.remove('spawning');
    }, 500);

    const offsetX = (Math.random() - 0.5) * 30; 
    const offsetY = (Math.random() - 0.5) * 40;

    const { hpStageMult, speedStageMult } = getStageMultipliers();

    const enemy = {
        element: enemyDiv,
        initialX: boss.x,
        x: boss.x,
        targetX: 50, // Converge to center with boss
        y: boss.y,
        baseSpeed: 1.5 * speedStageMult,
        speed: 1.5 * speedStageMult,
        maxHp: 100 * hpStageMult,
        hp: 100 * hpStageMult,
        type: 'normal',
        isBoarded: true,     
        parentBoss: boss,    
        offsetX: offsetX,
        offsetY: offsetY,
        reward: 5,           // Add default reward
        invincible: true     
    };
    enemies.push(enemy);
}

// Spawns a friendly ghost (Forsaken King ability)
function spawnFriendlyGhost() {
    const road = document.getElementById('road');
    const ghostDiv = document.createElement('div');
    ghostDiv.classList.add('friendly-ghost');
    road.appendChild(ghostDiv);
    
    // Road is 340px wide, centered in 1080px (approx 34.2% to 65.8%)
    const randomX = Math.random() * 20 + 40; 
    ghostDiv.style.left = `${randomX}%`;
    
    // Start at bottom
    const roadRect = road.getBoundingClientRect();
    const startY = roadRect.height - 60;
    ghostDiv.style.top = `${startY}px`;

    friendlyGhosts.push({
        element: ghostDiv,
        x: randomX, 
        y: startY, 
        speed: 0.5, // Slow speed moving UP
        maxHp: 500
    });
}

// Handle enemy death
function handleEnemyDeath(target, killer = null) {
    if (target.hp > 0) return;

    // Cursed Mark: Explosion on death
    if (target.isCursedMark) {
        const explosion = document.createElement('div');
        explosion.style.position = 'absolute';
        explosion.style.left = target.element.style.left;
        explosion.style.top = target.element.style.top;
        explosion.style.width = '120px'; explosion.style.height = '120px';
        explosion.style.background = 'radial-gradient(circle, #2e003e, transparent)';
        explosion.style.transform = 'translate(-50%, -50%)';
        explosion.style.zIndex = '19';
        explosion.style.borderRadius = '50%';
        explosion.style.opacity = '0.8';
        gameContainer.appendChild(explosion);
        setTimeout(() => explosion.remove(), 400);

        const gameW = gameContainer.offsetWidth;
        const tX = (target.x / 100) * gameW;
        const tY = target.y;

        enemies.forEach(e => {
            if (e === target || e.hp <= 0) return;
            const eX = (e.x / 100) * gameW;
            const dist = Math.sqrt(Math.pow(eX - tX, 2) + Math.pow(e.y - tY, 2));
            if (dist < 100) { 
                if (typeof window.applyDamage === 'function') {
                    window.applyDamage(e, target.maxHp * 0.5, null); 
                }
            }
        });
    }

    // Hellfire Explosion
    if (target.isHellfireBurn) {
        const explosion = document.createElement('div');
        explosion.style.position = 'absolute';
        explosion.style.left = target.element.style.left;
        explosion.style.top = target.element.style.top;
        explosion.style.width = '100px'; explosion.style.height = '100px';
        explosion.style.background = 'radial-gradient(circle, #ff4500, transparent)';
        explosion.style.transform = 'translate(-50%, -50%)';
        explosion.style.zIndex = '19';
        explosion.style.borderRadius = '50%';
        explosion.style.opacity = '0.8';
        gameContainer.appendChild(explosion);
        setTimeout(() => explosion.remove(), 400);

        const gameW = gameContainer.offsetWidth;
        const tX = (target.x / 100) * gameW;
        const tY = target.y;

        enemies.forEach(e => {
            if (e === target || e.hp <= 0) return;
            const eX = (e.x / 100) * gameW;
            const dist = Math.sqrt(Math.pow(eX - tX, 2) + Math.pow(e.y - tY, 2));
            if (dist < 80) { 
                if (typeof window.applyDamage === 'function') {
                    window.applyDamage(e, 30, null); 
                }
                e.isBurning = true;
                e.burnEndTime = Date.now() + 3000;
                e.isHellfireBurn = true; 
                if(e.element) e.element.classList.add('burning');
            }
        });
    }

    // Embers of Hatred: Explosion on death
    if (target.type === 'ember_hatred') {
        const explosion = document.createElement('div');
        explosion.style.position = 'absolute';
        explosion.style.left = target.element.style.left;
        explosion.style.top = target.element.style.top;
        explosion.style.width = '150px'; explosion.style.height = '150px';
        explosion.style.background = 'radial-gradient(circle, rgba(255, 69, 0, 0.6), transparent)';
        explosion.style.transform = 'translate(-50%, -50%)';
        explosion.style.zIndex = '19';
        explosion.style.borderRadius = '50%';
        gameContainer.appendChild(explosion);
        setTimeout(() => explosion.remove(), 500);

        const gameW = gameContainer.offsetWidth;
        const tX = (target.x / 100) * gameW;
        const tY = target.y;

        enemies.forEach(e => {
            if (e === target || e.hp <= 0) return;
            const eX = (e.x / 100) * gameW;
            const dist = Math.sqrt(Math.pow(eX - tX, 2) + Math.pow(e.y - tY, 2));
            if (dist < 100) { 
                e.speed *= 1.5; // 50% Speed boost
                setTimeout(() => { e.speed = e.baseSpeed; }, 3000);
            }
        });
    }

    // Wraith Lord Resurrect
    if (killer && killer.data.type === 'wraithlord') {
        const road = document.getElementById('road');
        const skeletonDiv = document.createElement('div');
        skeletonDiv.classList.add('friendly-skeleton');
        road.appendChild(skeletonDiv);
        skeletonDiv.style.left = target.element.style.left;
        skeletonDiv.style.top = target.element.style.top;

        friendlySkeletons.push({
            element: skeletonDiv,
            x: target.x, 
            y: target.y, 
            speed: 2.0 
        });
    }

    const idx = enemies.indexOf(target);
    if (idx > -1) {
        if (target.type) recordKill(target.type);
        target.element.remove();
        enemies.splice(idx, 1);
        if (typeof checkRelicDrop === 'function') checkRelicDrop(target);
        updateStageInfo(); 
        
        if (target.isBoss) {
            let rewardMsg = "";
            let bonusDetail = "";
            let relicId = "";

            if (target.data.type === 'cerberus') {
                relicId = 'cerberus_fang';
                rewardMsg = `Obtained [${target.data.rewardName}]`;
                bonusDetail = "Global ATK +10%";
            } else if (target.data.type === 'charon') {
                relicId = 'stygian_oar';
                rewardMsg = `Obtained [${target.data.rewardName}]`;
                bonusDetail = "Enemy Speed -15%";
            } else if (target.data.type === 'beelzebub') {
                relicId = 'gluttony_crown';
                rewardMsg = `Obtained [${target.data.rewardName}]`;
                bonusDetail = "Treasure Spawn Rate Up";
            } else if (target.data.type === 'lucifer') {
                relicId = 'fallen_wings';
                rewardMsg = `Obtained [${target.data.rewardName}]`;
                bonusDetail = "Crit Chance +10%";
                
                const frozenOverlay = document.getElementById('frozen-overlay');
                if(frozenOverlay) frozenOverlay.style.opacity = 0; 
                towers.forEach(t => {
                    if (t.isFrozenTomb) {
                        t.isFrozenTomb = false;
                        t.element.classList.remove('frozen-tomb');
                    }
                });
            }
            
            if (relicId && typeof collectRelic === 'function') {
                collectRelic(relicId);
            }
            
            showBossVictory(target.data.name, rewardMsg, bonusDetail);
            bossInstance = null;
        }

        let reward = target.reward;
        if (killer && killer.data && killer.data.type === 'abyssal') {
            reward = Math.floor(reward * 1.5);
        }
        
        // Add Relic SE Gain Bonus
        const relicSEBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('se_gain') : 0;
        if (relicSEBonus > 0) {
            reward = Math.floor(reward * (1.0 + relicSEBonus));
        }

        money = Math.min(1000, money + reward);
        updateGauges();

        if (typeof createSEGainEffect === 'function' && target.element) {
            const rect = target.element.getBoundingClientRect();
            const gameRect = gameContainer.getBoundingClientRect();
            createSEGainEffect((rect.left + rect.width / 2) - gameRect.left, (rect.top + rect.height / 2) - gameRect.top, reward, gameContainer);
        }

        if (typeof window.updateSummonButtonState === 'function') {
            window.updateSummonButtonState();
        }
    }
}

function showBossVictory(bossName, rewardMsg, bonusDetail) {
    const container = document.getElementById('game-container');
    const overlay = document.createElement('div');
    overlay.className = 'boss-victory-overlay';
    
    overlay.innerHTML = `
        <div class="boss-victory-content">
            <div class="boss-victory-header">ABYSSAL ENTITY BANISHED</div>
            <div class="boss-victory-name">${bossName} DEFEATED</div>
            <div class="boss-victory-reward">${rewardMsg}</div>
            <div class="boss-victory-bonus">${bonusDetail}</div>
            <div class="boss-victory-hint">(Click to continue)</div>
        </div>
    `;
    
    container.appendChild(overlay);
    isPaused = true;
    
    overlay.addEventListener('click', () => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.remove();
            isPaused = false;
        }, 500);
    });
}

function createSEGainEffect(x, y, amount, container) {
    if (!container) return;
    const effect = document.createElement('div');
    effect.className = 'se-gain-effect';
    effect.innerText = `+${amount}`;
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
}
