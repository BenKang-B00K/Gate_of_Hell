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
let money = 100;
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
let treasureChance = 0.01;

let isTimeFrozen = false;
let timeFreezeEndTime = 0;
let sealedGhostCount = 0;
let draggedUnit = null; // Currently dragged unit

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
        { type: 'normal', speed: 1.5, hp: 100, defense: 0, probability: 0.6 }, // Lost Soul (60%)
        { type: 'tank', speed: 0.75, hp: 300, defense: 10, probability: 0.2 },  // Sin-Heavy Wraith (20%)
        { type: 'runner', speed: 3.0, hp: 40, defense: 0, probability: 0.2 }   // Hasty Shadow (20%)
    ],
    pattern: [
        { type: 'greedy', speed: 1.2, hp: 150, defense: 5, probability: 0.34 }, // Greedy Spirit
        { type: 'dimension', speed: 1.8, hp: 80, defense: 0, probability: 0.33 }, // Dimensional Shifter
        { type: 'deceiver', speed: 1.4, hp: 120, defense: 5, probability: 0.33 }  // Deceiving Seductress
    ],
    enhanced: [
        { type: 'boar', speed: 0.5, hp: 250, defense: 8, probability: 0.34 }, // Charging Boar
        { type: 'frost', speed: 1.0, hp: 180, defense: 5, probability: 0.33 }, // Frost-Bitten Wraith
        { type: 'lightspeed', speed: 4.0, hp: 60, defense: 0, probability: 0.33 } // Lightspeed Shadow
    ],
    armoured: [
        { type: 'heavy', speed: 0.4, hp: 600, defense: 20, probability: 0.34, knockbackResist: 0.8 }, // Massive Sinner
        { type: 'lava', speed: 1.3, hp: 200, defense: 15, probability: 0.33 }, // Lava's Craving
        { type: 'burning', speed: 1.0, hp: 350, defense: 10, probability: 0.33 } // Burning Vengeance
    ],
    treasure: [
        { type: 'gold', speed: 2.5, hp: 80, defense: 50, probability: 1.0, reward: 300 } // Golden Echo (Bonus SE)
    ]
};

// Boss data
const bossData = {
    10: { name: "Cerberus", type: "cerberus", hp: 5000, speed: 0.3, size: 60, rewardName: "Cerberus's Fang", rewardEffect: 0.1 },
    20: { name: "Charon", type: "charon", hp: 8000, speed: 0.2, size: 60, rewardName: "Stygian Oar", rewardEffect: 0.15 }, 
    30: { name: "Beelzebub", type: "beelzebub", hp: 15000, speed: 0.2, size: 60, rewardName: "Crown of Gluttony", rewardEffect: 0.01 }, 
    40: { name: "Lucifer", type: "lucifer", hp: 25000, speed: 0.15, size: 70, rewardName: "Fallen Angel's Wings", rewardEffect: 0.1 } 
};

// Initialize stage
function initStage() {
    isBossStage = (stage % 10 === 0); // Boss stage every 10 levels
    bossSpawned = false;
    bossInstance = null;
    
    // Unseal Gatekeeper
    sealedGhostCount = 0; 

    if (isBossStage) {
        totalStageEnemies = 999; 
        const bossName = bossData[stage] ? bossData[stage].name : "Unknown Boss";
        alert(`⚠️ Warning! Boss [${bossName}] appeared! ⚠️`);
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

// Update stage information display
function updateStageInfo() {
    const info = document.getElementById('stage-info');
    const stageDisplay = document.getElementById('stage-display');
    if (info) {
        info.innerText = `STAGE ${stage}\nEnemies Left: ${totalStageEnemies - currentStageSpawned} / ${totalStageEnemies}`;
    }
    if (stageDisplay) stageDisplay.innerText = stage;
}

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
    } else if (stage <= 10) { 
        min = 1; max = 4; 
    }
    
    let count = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!isBossStage && count > totalStageEnemies - currentStageSpawned) {
        count = totalStageEnemies - currentStageSpawned;
    }

    for(let i=0; i<count; i++) {
        spawnEnemy();
    }
    lastSpawnTime = Date.now();
}

// Spawn boss
function spawnBoss() {
    const road = document.getElementById('road');
    const frozenOverlay = document.getElementById('frozen-overlay');
    const data = bossData[stage] || { name: "Boss", type: "cerberus", hp: 3000, speed: 0.3, size: 60 };
    
    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy', 'boss', data.type);
    enemyDiv.innerText = "BOSS"; 
    
    road.appendChild(enemyDiv);
    enemyDiv.style.left = '50%';
    enemyDiv.style.top = '0px';

    const { hpMult, speedMult } = getCorruptionMultipliers();

    const boss = {
        element: enemyDiv,
        initialX: 50,
        x: 50,
        y: 0,
        baseSpeed: data.speed * speedMult,
        speed: data.speed * speedMult,
        maxHp: data.hp * hpMult,
        hp: data.hp * hpMult,
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
                    alert("🥶 Lucifer's [Absolute Zero]! An exorcist has been permanently frozen!");
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
        probs = { basic: 0.90, pattern: 0.03, enhanced: 0.03, armoured: 0.03, treasure: treasureChance };
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

    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy');
    enemyDiv.classList.add(selectedType.type);
    
    road.appendChild(enemyDiv);
    const randomX = Math.random() * 80 + 10;
    enemyDiv.style.left = `${randomX}%`;
    enemyDiv.style.top = '0px';

    const { hpMult, speedMult } = getCorruptionMultipliers();

    const enemy = {
        element: enemyDiv,
        initialX: randomX,
        x: randomX,
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
    enemyDiv.classList.add('enemy', 'normal', 'boarded');
    road.appendChild(enemyDiv);
    
    const offsetX = (Math.random() - 0.5) * 30; 
    const offsetY = (Math.random() - 0.5) * 40;

    const { hpMult, speedMult } = getCorruptionMultipliers();

    const enemy = {
        element: enemyDiv,
        initialX: boss.x,
        x: boss.x,
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
function spawnCorruptedEnemy(tower) {
    totalCorruptedCount++;
    const road = document.getElementById('road');
    const slotRect = tower.slotElement.getBoundingClientRect();
    
    const gameWidth = gameContainer.offsetWidth;
    const centerX = slotRect.left + slotRect.width / 2;
    const gameRect = gameContainer.getBoundingClientRect();
    const relX = (centerX - gameRect.left) / gameWidth * 100;

    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy', 'corrupted');
    enemyDiv.style.backgroundColor = '#4a0000'; 
    enemyDiv.style.boxShadow = '0 0 15px #ff0000';
    enemyDiv.innerText = "CORRUPT";
    enemyDiv.style.fontSize = '8px';
    enemyDiv.style.color = 'white';
    enemyDiv.style.display = 'flex';
    enemyDiv.style.alignItems = 'center';
    enemyDiv.style.justifyContent = 'center';
    
    road.appendChild(enemyDiv);
    enemyDiv.style.left = `${relX}%`;
    enemyDiv.style.top = `0px`;

    const { hpMult, speedMult } = getCorruptionMultipliers();
    const hpValue = (tower.data.hp || (tower.data.damage * 10)) * hpMult;

    const enemy = {
        element: enemyDiv,
        initialX: relX,
        x: relX,
        y: 0,
        baseSpeed: 0.5 * speedMult, 
        speed: 0.5 * speedMult,
        maxHp: hpValue, 
        hp: hpValue,
        defense: 5,
        reward: 0, 
        type: 'corrupted',
        isCorrupted: true 
    };
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

// Update Corrupted Shards UI
function updateShardUI() {
    const fill = document.getElementById('shard-gauge-fill');
    const text = document.getElementById('shards-display-text');
    const debuffDesc = document.getElementById('active-debuffs');
    
    if (!fill || !text || !debuffDesc) return;

    const percentage = (corruptedShards / 99) * 100;
    fill.style.width = `${percentage}%`;
    text.innerText = `${corruptedShards} / 99`;

    let desc = "Normal Souls";
    if (corruptedShards >= 50) desc = "⚠️ 70% HP, +2% SPD (FATAL)";
    else if (corruptedShards >= 41) desc = "🔥 +2% HP/shard, +0.02% SPD/shard";
    else if (corruptedShards >= 21) desc = "🌑 +1.5% HP/shard, +0.01% SPD/shard";
    else if (corruptedShards >= 1) desc = "☁️ +1% HP/shard";
    
    debuffDesc.innerText = `Current Debuff: ${desc}`;
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
        target.element.remove();
        enemies.splice(idx, 1);
        
        // Boss death rewards
        if (target.isBoss) {
            if (target.data.type === 'cerberus') {
                damageMultiplier += target.data.rewardEffect;
                alert(`🎉 Boss Defeated! Obtained [${target.data.rewardName}]!\n⚔️ Ally attack power increased by 10%! (Current Multiplier: ${damageMultiplier.toFixed(1)}x)`);
            } else if (target.data.type === 'charon') {
                globalSpeedFactor -= target.data.rewardEffect;
                alert(`🎉 Boss Defeated! Obtained [${target.data.rewardName}]!\n🐢 Enemy movement speed reduced by 15%! (Current Multiplier: ${globalSpeedFactor.toFixed(2)}x)`);
            } else if (target.data.type === 'beelzebub') {
                treasureChance += target.data.rewardEffect;
                alert(`🎉 Boss Defeated! Obtained [${target.data.rewardName}]!\n💰 Treasure ghost spawn rate increased! (Current: ${(treasureChance * 100).toFixed(0)}%)`);
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
                alert(`🎉 Boss Defeated! Obtained [${target.data.rewardName}]!\n⚡ Ally critical hit chance increased by 10%! (Current: ${(critChance * 100).toFixed(0)}%)`);
            }
            
            bossInstance = null;
        }

        // Corruption reward: Corrupted Shards
        if (target.isCorrupted) {
            if (corruptedShards < 99) {
                corruptedShards += 1;
                updateShardUI();
                alert("💠 Obtained a [Corrupted Shard]!");
            }
        }

        // SE Reward
        money += target.reward;
        const seDisplay = document.getElementById('se-display');
        if(seDisplay) seDisplay.innerText = money;
        if (typeof window.updateSummonButtonState === 'function') {
            window.updateSummonButtonState();
        }
    }
}
