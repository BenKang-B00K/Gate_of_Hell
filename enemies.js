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
let corruptedShards = 0;
let totalCorruptedCount = 0;
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
const maxPortalEnergy = 2000;
let draggedUnit = null; // Currently dragged unit
window.encounteredEnemies = new Set();

// --- Exorcism Records Data ---
const killCounts = {}; // Track kills by type

function recordKill(type) {
    killCounts[type] = (killCounts[type] || 0) + 1;
}

function getBestiaryBonus(type) {
    const kills = killCounts[type] || 0;
    // Every 50 kills = +10% Damage bonus (Max 50%)
    const bonusLevel = Math.min(Math.floor(kills / 50), 5);
    return 1 + (bonusLevel * 0.1);
}

// Calculate debuff multipliers based on corrupted shards
function getCorruptionMultipliers() {
    let hpMult = 1.0;
    let speedMult = 1.0;
    const s = corruptedShards;

    if (s >= 50) {
        hpMult = 1.70; // Fixed +70%
        speedMult = 1.02; // Fixed +2%
    } else if (s >= 41) {
        hpMult = 1 + (s * 0.02); // +2% per shard
        speedMult = 1 + (s * 0.0002); // +0.02% per shard
    } else if (s >= 21) {
        hpMult = 1 + (s * 0.015); // +1.5% per shard
        speedMult = 1 + (s * 0.0001); // +0.01% per shard
    } else if (s >= 1) {
        hpMult = 1 + (s * 0.01); // +1% per shard
    }
    
    return { hpMult, speedMult };
}

// Enemy data (Categorized)
const enemyCategories = {
    basic: [
        { type: 'normal', icon: '👻', speed: 1.5, hp: 110, defense: 0, probability: 0.5, reward: 5, desc: "A common soul lingering in the abyss. No special traits.", effectiveness: "Standard exorcism attacks.", lore: "A soul that couldn't let go of earthly regrets, now aimlessly wandering the dark." }, 
        { type: 'shade', icon: '👤', speed: 2.2, hp: 60, defense: 0, probability: 0.1, reward: 4, desc: "A weak but fast spirit that moves in a blurring motion.", effectiveness: "Rapid-fire units.", lore: "The faintest remains of a soul, barely holding onto existence." },
        { type: 'tank', icon: '💀', speed: 0.75, hp: 300, defense: 10, probability: 0.2, desc: "A soul hardened by sin. High HP and moderate defense.", effectiveness: "Critical hits and defense-ignoring assassins.", lore: "The weight of their heavy sins in life has manifested as an unbreakable iron shell." },  
        { type: 'runner', icon: '⚡', speed: 3.0, hp: 40, defense: 0, probability: 0.2, desc: "An agile shadow that rushes toward the portal at high speed.", effectiveness: "Slowing chains or frost energy.", lore: "A thief who spent a lifetime fleeing from justice, now cursed to run for eternity." }   
    ],
    pattern: [
        { type: 'greedy', icon: '🧛', speed: 1.2, hp: 150, defense: 5, probability: 0.3, desc: "Forcibly relocates the attacking unit to a random slot on hit (10% chance).", effectiveness: "High range snipers to minimize movement.", lore: "Driven mad by avarice, this spirit tries to steal the very ground the exorcists stand on." }, 
        { type: 'mimic', icon: '📦', speed: 1.1, hp: 180, defense: 15, probability: 0.1, desc: "Occasionally blinks forward when targeted (20% chance).", effectiveness: "AOE or slow effects.", lore: "It takes the form of what you desire most, only to reveal its true, hollow self." },
        { type: 'dimension', icon: '🌀', speed: 1.8, hp: 80, defense: 0, probability: 0.3, desc: "Occasionally phases out of existence, becoming immune to attacks (1% chance per frame).", effectiveness: "Truth-seeking seers or rapid-fire units.", lore: "A hermit who sought to hide from the world, now drifting between dimensions of pain." }, 
        { type: 'deceiver', icon: '🎭', speed: 1.4, hp: 120, defense: 5, probability: 0.3, desc: "Backsteps and evades when an exorcist first targets them (100% chance, once).", effectiveness: "Area damage or multiple hunters.", lore: "A master of lies whose face was never seen, now eternally hiding behind a spectral mask." }  
    ],
    enhanced: [
        { type: 'boar', icon: '🐗', speed: 0.5, hp: 250, defense: 8, probability: 0.3, desc: "Accelerates exponentially as it nears the portal.", effectiveness: "Knockback and heavy stuns near the gate.", lore: "A violent hunter who enjoyed the thrill of the chase, now driven by an uncontrollable bloodlust." }, 
        { type: 'soul_eater', icon: '🧿', speed: 1.2, hp: 220, defense: 12, probability: 0.1, desc: "Gains a short burst of speed whenever it takes damage.", effectiveness: "High damage single hits.", lore: "It hungers not for flesh, but for the very essence of your exorcists' power." },
        { type: 'frost', icon: '❄️', speed: 1.0, hp: 180, defense: 5, probability: 0.3, desc: "Emits a freezing aura that boosts the speed of nearby specters.", effectiveness: "Priority targeting and fire energy.", lore: "Died alone in a blizzard, their heart frozen by isolation and cold resentment." }, 
        { type: 'lightspeed', icon: '✨', speed: 4.0, hp: 60, defense: 0, probability: 0.3, desc: "Moves at incredible speed and ignores speed-boosting auras.", effectiveness: "Instant-kill guardians or void snipers.", lore: "A messenger who failed to deliver a life-saving word, now desperate to reach the end." } 
    ],
    armoured: [
        { type: 'heavy', icon: '⛓️', speed: 0.4, hp: 600, defense: 20, probability: 0.34, knockbackResist: 0.8, desc: "An massive behemoth with high defense and knockback resistance.", effectiveness: "Soul link shared damage or high-penetration strikes.", lore: "An executioner who took pride in their cruelty, now bound by the very chains they once used." }, 
        { type: 'lava', icon: '🌋', speed: 1.3, hp: 200, defense: 15, probability: 0.33, desc: "Cleanses freeze effects and leaps forward when hit by cold energy.", effectiveness: "Avoid frost; use standard magic or fire.", lore: "A soul consumed by a fiery temper, now literally burning with an unquenchable rage." }, 
        { type: 'burning', icon: '💢', speed: 1.0, hp: 350, defense: 10, probability: 0.33, desc: "Consumes its own vengeful energy to heal every time it is struck.", effectiveness: "High single-hit damage to overwhelm recovery.", lore: "A martyr whose sacrifice was forgotten, their pain now fueling a cycle of endless regrowth." } 
    ],
    treasure: [
        { type: 'gold', icon: '💎', speed: 2.5, hp: 80, defense: 50, probability: 1.0, reward: 300, desc: "A rare spirit that grants a massive amount of Soul Energy upon defeat.", effectiveness: "Rapid-fire assassins to bypass high defense.", lore: "The residual essence of a king's hoard, still sparkling with the vanity of the past." } 
    ],
    corrupted: [
        { type: 'defiled_apprentice', icon: '🥀', speed: 0.6, hp: 400, defense: 5, probability: 0, desc: "A trainee who touched forbidden arts. 10% chance to curse attacker's damage (-3, lasts 5s, No refresh while active).", effectiveness: "Avoid using high-tier units to minimize curse risk.", lore: "One moment of weakness, one forbidden scroll, and a soul is lost forever to the shadows." },
        { type: 'abyssal_acolyte', icon: '🌑', speed: 0.4, hp: 1200, defense: 15, probability: 0, desc: "A servant of the void. Reduces hit source's damage by 4 per hit (Max 3 stacks, resets on hit, lasts 2s).", effectiveness: "Burst damage or stuns to prevent stack accumulation.", lore: "The shadow arms are not theirs; they are the grip of the abyss pulling them deeper." },
        { type: 'bringer_of_doom', icon: '⛓️‍💥', speed: 0.3, hp: 3000, defense: 30, probability: 0, desc: "[Master Corruption] Permanently reduces damage of 2 random slots near the road by 7.", effectiveness: "Kill as far from the portal as possible to protect inner slots.", lore: "Where they walk, the ground itself weeps. No sanctity remains in their wake." }
    ]
};

// Boss data
const bossData = {
    10: { name: "Cerberus", type: "cerberus", icon: '🐕', hp: 5000, speed: 0.3, size: 60, rewardName: "Cerberus's Fang", rewardEffect: 0.1, lore: "The triple-headed guardian of the gate, driven mad by the endless flow of corrupt souls." },
    20: { name: "Charon", type: "charon", icon: '🛶', hp: 8000, speed: 0.2, size: 60, rewardName: "Stygian Oar", rewardEffect: 0.15, lore: "The ferryman of the dead, now harvesting souls for himself instead of delivering them." }, 
    30: { name: "Beelzebub", type: "beelzebub", icon: '🪰', hp: 15000, speed: 0.2, size: 60, rewardName: "Crown of Gluttony", rewardEffect: 0.01, lore: "The Lord of the Flies, spawned from the rot of every broken promise in history." }, 
    40: { name: "Lucifer", type: "lucifer", icon: '👑', hp: 25000, speed: 0.15, size: 70, rewardName: "Fallen Angel's Wings", rewardEffect: 0.1, lore: "The first to fall, seeking to drag every other light into the same bottomless abyss." } 
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
        totalStageEnemies = 999; 
        const bossName = bossData[stage] ? bossData[stage].name : "Unknown Boss";
        
        const tutorialToggle = document.getElementById('tutorial-toggle');
        if (tutorialToggle && tutorialToggle.checked) {
            showBossWarning(bossName);
        }
    }
    else if (stage <= 10) {
        totalStageEnemies = Math.floor(Math.random() * 31) + 20;
    } else {
        totalStageEnemies = 30 + (stage * 2) + Math.floor(Math.random() * 21);
    }
    currentStageSpawned = 0;
    updateStageInfo();

    // Stage start delay (5s)
    isStageStarting = true;
    let countdown = 5;
    const timerElement = document.getElementById('start-timer');
    timerElement.style.display = 'block';
    timerElement.innerText = countdown;

    const timerInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            timerElement.innerText = countdown;
        } else {
            clearInterval(timerInterval);
            timerElement.innerText = "START!";
            
            // [Master] King of the Forsaken logic
            if (typeof towers !== 'undefined') {
                const forsakenKings = towers.filter(t => t.data.type === 'forsaken_king');
                if (forsakenKings.length > 0) {
                    const spawnCount = Math.floor(totalCorruptedCount / 2);
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

// Update All Gauges (Soul Energy, Portal Energy, & Corrupted Shards)
function updateGauges() {
    // Shard Gauge
    const shardFill = document.getElementById('shard-gauge-fill');
    const shardText = document.getElementById('shards-display-text');
    const debuffDesc = document.getElementById('active-debuffs');
    
    if (shardFill && shardText && debuffDesc) {
        const shardPercent = (corruptedShards / 99) * 100;
        shardFill.style.width = `${shardPercent}%`;
        shardText.innerText = `${corruptedShards} / 99`;

        let desc = "Normal";
        if (corruptedShards >= 50) desc = "⚠️ 70% HP, +2% SPD (FATAL)";
        else if (corruptedShards >= 41) desc = "🔥 +2% HP/shard, +0.02% SPD/shard";
        else if (corruptedShards >= 21) desc = "🌑 +1.5% HP/shard, +0.01% SPD/shard";
        else if (corruptedShards >= 1) desc = "☁️ +1% HP/shard";
        debuffDesc.innerText = `Corruption Level: ${desc}`;
    }

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
    const enemiesLeft = document.getElementById('enemies-left');
    
    if (stageDisplay) stageDisplay.innerText = stage;
    if (enemiesLeft) {
        const remainingToSpawn = Math.max(0, totalStageEnemies - currentStageSpawned);
        enemiesLeft.innerText = remainingToSpawn + enemies.length;
    }
}

// Attach to window for other scripts
window.updateGauges = updateGauges;
window.updateStageInfo = updateStageInfo;

// Spawn wave
function spawnWave() {
    if (!isBossStage && currentStageSpawned >= totalStageEnemies) return;

    if (isBossStage && !bossSpawned) {
        spawnBoss();
        bossSpawned = true;
    }

    let min = 2, max = 10;
    if (isBossStage) {
        min = 5; max = 10;
    } else if (stage <= 5) { 
        min = 1; max = 2; 
    } else if (stage <= 10) {
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

    const { hpMult, speedMult } = getCorruptionMultipliers();

    const boss = {
        element: enemyDiv,
        hpFill: hpFill,
        initialX: 50,
        x: 50,
        targetX: 50, // Bosses go to center
        y: 0,
        baseSpeed: data.speed * speedMult,
        speed: data.speed * speedMult,
        maxHp: data.hp * hpMult,
        hp: data.hp * hpMult,
        reward: 500,         // Add reward for boss
        isBoss: true,
        data: data,
        lastAbilityTime: Date.now()
    };
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

    let probs = { basic: 0.96, pattern: 0.01, enhanced: 0.01, armoured: 0.01, treasure: treasureChance };
    
    if (stage >= 51) {
        probs = { basic: 0.30, pattern: 0.23, enhanced: 0.23, armoured: 0.23, treasure: treasureChance };
    } else if (stage >= 31) {
        probs = { basic: 0.55, pattern: 0.14, enhanced: 0.15, armoured: 0.15, treasure: treasureChance };
    } else if (stage >= 16) {
        probs = { basic: 0.75, pattern: 0.08, enhanced: 0.08, armoured: 0.08, treasure: treasureChance };
    } else if (stage >= 6) {
        probs = { basic: 0.94, pattern: 0.02, enhanced: 0.02, armoured: 0.02, treasure: treasureChance };
    } else {
        // Stage 1-5: Very low chance for special ghosts
        probs = { basic: 0.985, pattern: 0.005, enhanced: 0.005, armoured: 0.005, treasure: treasureChance };
    }

    probs.basic -= (treasureChance - 0.01);

    const randCat = Math.random();
    let accumulatedProbability = 0;
    let category = 'basic';

    for (const [key, value] of Object.entries(probs)) {
        accumulatedProbability += value;
        if (randCat < accumulatedProbability) {
            category = key;
            break;
        }
    }

    const enemyTypes = enemyCategories[category];
    const rand = Math.random();
    let selectedType = enemyTypes[0];

    for (const enemyType of enemyTypes) {
        accumulatedProbability += enemyType.probability;
        if (rand < accumulatedProbability) {
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

    // Enemy click event
    enemyDiv.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (typeof window.showEnemyInfo === 'function') {
            window.showEnemyInfo({...selectedType, hp: enemy.hp}); // Pass current state
        }
    });

    road.appendChild(enemyDiv);
    const randomX = Math.random() * 80 + 10;
    enemyDiv.style.left = `${randomX}%`;
    enemyDiv.style.top = '0px';

    const { hpMult, speedMult } = getCorruptionMultipliers();

    const enemy = {
        element: enemyDiv,
        hpFill: hpFill,
        initialX: randomX,
        x: randomX,
        targetX: Math.random() * 50 + 25, // Narrower range (25% to 75%) to fit portal arch
        y: 0,
        baseSpeed: selectedType.speed * speedMult,
        speed: selectedType.speed * speedMult,
        maxHp: selectedType.hp * hpMult,
        defense: selectedType.defense || 0,
        hp: selectedType.hp * hpMult,
        reward: selectedType.reward || 10,
        type: selectedType.type,
        isPhasing: false,
        isSilenced: false,
        isFrozen: false,
        isSlowed: false,
        hasBackstepped: false
    };
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

    const { hpMult, speedMult } = getCorruptionMultipliers();

    const enemy = {
        element: enemyDiv,
        initialX: boss.x,
        x: boss.x,
        targetX: 50, // Converge to center with boss
        y: boss.y,
        baseSpeed: 1.5 * speedMult,
        speed: 1.5 * speedMult,
        maxHp: 100 * hpMult,
        hp: 100 * hpMult,
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

// [Corruption] System: Ally becomes an enemy
const corruptedTypes = {
    1: { type: 'defiled_apprentice', name: 'Defiled Apprentice', icon: '🥀', speed: 0.6, hp: 400, defense: 5, desc: "A trainee who touched forbidden arts. 10% chance to curse attacker's damage (-3)." },
    2: { type: 'abyssal_acolyte', name: 'Abyssal Acolyte', icon: '🌑', speed: 0.4, hp: 1200, defense: 15, desc: "A servant of the void. Reduces hit source's damage by 4 (Max 3 stacks)." },
    3: { type: 'bringer_of_doom', name: 'Bringer of Doom', icon: '⛓️‍💥', speed: 0.3, hp: 3000, defense: 30, desc: "[Master Corruption] Permanently reduces damage of 2 random slots near the road by 7." }
};

function spawnCorruptedEnemy(tower) {
    totalCorruptedCount++;
    const road = document.getElementById('road');
    const slotRect = tower.slotElement.getBoundingClientRect();
    
    const gameWidth = gameContainer.offsetWidth;
    const centerX = slotRect.left + slotRect.width / 2;
    const gameRect = gameContainer.getBoundingClientRect();
    const relX = (centerX - gameRect.left) / gameWidth * 100;

    const tier = Math.min(tower.data.tier, 3);
    const data = corruptedTypes[tier];

    if (typeof recordUnlock === 'function') {
        recordUnlock(data.type, true);
    }

    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy', 'corrupted', 'spawning', data.type);
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

    road.appendChild(enemyDiv);
    enemyDiv.style.left = `${relX}%`;
    enemyDiv.style.top = `0px`;

    const { hpMult, speedMult } = getCorruptionMultipliers();
    const hpValue = data.hp * hpMult;

    const enemy = {
        element: enemyDiv,
        hpFill: hpFill,
        initialX: relX,
        x: relX,
        targetX: Math.random() * 50 + 25, // Within portal arch
        y: 0,
        baseSpeed: data.speed * speedMult, 
        speed: data.speed * speedMult,
        maxHp: hpValue, 
        hp: hpValue,
        defense: data.defense,
        reward: 0, 
        type: data.type,
        isCorrupted: true 
    };

    // Bringer of Doom Special Ability: Master Corruption
    if (data.type === 'bringer_of_doom') {
        // Find 2 random inner slots (closest to road)
        // Left inner: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29
        // Right inner: 30, 33, 36, 39, 42, 45, 48, 51, 54, 57
        const innerIndices = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57];
        const shuffled = innerIndices.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);
        
        selected.forEach(idx => {
            const slot = slots[idx];
            if (slot) {
                slot.classList.add('corrupted-slot');
                slot.dataset.corruption = (parseInt(slot.dataset.corruption) || 0) + 7;
                // Visual feedback for the slot
                const effect = document.createElement('div');
                effect.style.cssText = 'position:absolute; width:100%; height:100%; background:rgba(139,0,0,0.3); box-shadow:inset 0 0 10px #f00; pointer-events:none;';
                slot.appendChild(effect);
            }
        });
    }

    enemies.push(enemy);
}

// Spawns a friendly ghost (Forsaken King ability)
function spawnFriendlyGhost() {
    const road = document.getElementById('road');
    const ghostDiv = document.createElement('div');
    ghostDiv.classList.add('friendly-ghost');
    road.appendChild(ghostDiv);
    
    const randomX = Math.random() * 80 + 10;
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

    // Cursed Sect: Explosion on death
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
                    window.applyDamage(e, target.maxHp * 0.5, null); // 50% max HP damage
                }
            }
        });
    }

    // Hellfire Alchemist: Explosion on death
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

    // Wraith Lord: Resurrect enemy as skeleton
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
        updateStageInfo(); // Update enemy counter
        
        // Boss death rewards
        if (target.isBoss) {
            const tutorialToggle = document.getElementById('tutorial-toggle');
            const showMsg = tutorialToggle && tutorialToggle.checked;

            if (target.data.type === 'cerberus') {
                damageMultiplier += target.data.rewardEffect;
                if (showMsg) alert(`🎉 Boss Defeated! Obtained [${target.data.rewardName}]!\n⚔️ Ally attack power increased by 10%! (Current Multiplier: ${damageMultiplier.toFixed(1)}x)`);
            } else if (target.data.type === 'charon') {
                globalSpeedFactor -= target.data.rewardEffect;
                if (showMsg) alert(`🎉 Boss Defeated! Obtained [${target.data.rewardName}]!\n🐢 Enemy movement speed reduced by 15%! (Current Multiplier: ${globalSpeedFactor.toFixed(2)}x)`);
            } else if (target.data.type === 'beelzebub') {
                treasureChance += target.data.rewardEffect;
                if (showMsg) alert(`🎉 Boss Defeated! Obtained [${target.data.rewardName}]!\n💰 Treasure ghost spawn rate increased! (Current: ${(treasureChance * 100).toFixed(0)}%)`);
            } else if (target.data.type === 'lucifer') {
                critChance += target.data.rewardEffect;
                const frozenOverlay = document.getElementById('frozen-overlay');
                if(frozenOverlay) frozenOverlay.style.opacity = 0; 
                towers.forEach(t => {
                    if (t.isFrozenTomb) {
                        t.isFrozenTomb = false;
                        t.element.classList.remove('frozen-tomb');
                    }
                });
                if (showMsg) alert(`🎉 Boss Defeated! Obtained [${target.data.rewardName}]!\n⚡ Ally critical hit chance increased by 10%! (Current: ${(critChance * 100).toFixed(0)}%)`);
            }
            
            bossInstance = null;
        }

        // Corruption reward: Corrupted Shards
        if (target.isCorrupted) {
            if (corruptedShards < 99) {
                corruptedShards += 1;
                updateGauges();
                
                const tutorialToggle = document.getElementById('tutorial-toggle');
                if (tutorialToggle && tutorialToggle.checked) {
                    alert("💠 Obtained a [Corrupted Shard]!");
                }
            }
        }

        // SE Reward
        let reward = target.reward;
        if (killer && killer.data && killer.data.type === 'abyssal') {
            reward = Math.floor(reward * 1.5);
        }
        money = Math.min(1000, money + reward);
        updateGauges();
        if (typeof window.updateSummonButtonState === 'function') {
            window.updateSummonButtonState();
        }
    }
}
