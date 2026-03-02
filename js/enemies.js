/* enemies.js - Spawning, Logic, and Death Handling */

function getStageMultipliers(isBoss = false) {
    if (isBoss) return { hpStageMult: 1.0, speedStageMult: 1.0 };
    let hpRate = 1.05; let speedRate = 0.003;
    if (stage >= 15) { hpRate = 1.08; speedRate = 0.008; }
    else if (stage >= 5) { hpRate = 1.07; speedRate = 0.006; }
    let hpStageMult = Math.pow(hpRate, stage - 1);
    const relicHPReduction = (typeof getRelicBonus === 'function') ? getRelicBonus('enemy_hp') : 0;
    if (relicHPReduction < 0) hpStageMult *= (1.0 + relicHPReduction);
    let speedStageMult = 1 + (stage - 1) * speedRate;
    const relicSpeedReduction = (typeof getRelicBonus === 'function') ? getRelicBonus('enemy_speed') : 0;
    if (relicSpeedReduction < 0) speedStageMult *= (1.0 + relicSpeedReduction);
    return { hpStageMult, speedStageMult };
}

// enemyCategories and bossData are now populated by data_loader.js from data/enemies.json

function initStage() {
    if (typeof GameLogger !== 'undefined') GameLogger.info(`🚀 Starting DEPTH ${stage}`);
    isBossStage = (stage % 10 === 0); bossSpawned = false; bossInstance = null;
    if (typeof spawnStageFlash === 'function') spawnStageFlash(`DEPTH ${stage}`);
    sealedGhostCount = 0; 
    if (isBossStage) {
        totalStageEnemies = 15; 
        const bossName = bossData[stage] ? bossData[stage].name : "알 수 없는 존재";
        const tutorialToggle = document.getElementById('tutorial-toggle');
        if (tutorialToggle && tutorialToggle.checked) showBossWarning(bossName);
    }
    else if (stage <= 2) { totalStageEnemies = Math.floor(Math.random() * 6) + 12; } 
    else { totalStageEnemies = Math.floor(Math.random() * 6) + Math.floor(Math.min(40, 15 + (stage - 2) * 1.5)); }
    currentStageSpawned = 0; updateStageInfo();
    isStageStarting = true;
    let countdown = (stage === 1) ? 5 : 3;
    const timerElement = document.getElementById('start-timer');
    if (timerElement) {
        timerElement.style.display = 'block'; 
        timerElement.innerText = countdown;
    }
    const timerInterval = setInterval(() => {
        countdown--;
        if (timerElement) {
            if (countdown > 0) timerElement.innerText = countdown;
            else {
                clearInterval(timerInterval); timerElement.innerText = "악령들이 몰려옵니다!";
                if (typeof towers !== 'undefined') {
                    const kings = towers.filter(t => t.data.type === 'forsaken_king');
                    if (kings.length > 0) { for(let i=0; i<3; i++) spawnFriendlyGhost(); }
                }
                setTimeout(() => { timerElement.style.display = 'none'; isStageStarting = false; }, 1000);
            }
        } else {
            clearInterval(timerInterval);
            isStageStarting = false;
        }
    }, 1000);
}

function spawnWave() {
    if (currentStageSpawned >= totalStageEnemies && !isBossStage) return;
    if (isBossStage && bossSpawned && currentStageSpawned >= totalStageEnemies) return;
    if (isBossStage && !bossSpawned) { spawnBoss(); bossSpawned = true; }
    
    let min = 1, max = 3;
    if (stage >= 40) { min = 3; max = 5; }
    else if (stage >= 30) { min = 3; max = 4; }
    else if (stage >= 20) { min = 2; max = 4; }
    else if (stage >= 10) { min = 2; max = 3; }
    
    if (isBossStage) { min = 1; max = 3; } 
    
    let count = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!isBossStage && count > totalStageEnemies - currentStageSpawned) count = totalStageEnemies - currentStageSpawned;
    
    for(let i=0; i<count; i++) {
        setTimeout(() => { if (!isPaused) spawnEnemy(); }, i * 300);
    }
}

function spawnBoss() {
    const road = document.getElementById('road');
    const data = bossData[stage] || { name: "Boss", type: "cerberus", hp: 3000, speed: 0.1, size: 60 };
    if (typeof recordUnlock === 'function') recordUnlock(data.type, true);
    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy',  'abyssal_boss', 'spawning', data.type);
    enemyDiv.innerText = '';
    setTimeout(() => { enemyDiv.classList.remove('spawning'); }, 500);
    const hpBg = document.createElement('div'); hpBg.className = 'hp-bar-bg'; hpBg.style.display = 'none';
    const hpFill = document.createElement('div'); hpFill.className = 'hp-bar-fill';
    hpBg.appendChild(hpFill); enemyDiv.appendChild(hpBg);
    const { hpStageMult, speedStageMult } = getStageMultipliers(true);
    const boss = { element: enemyDiv, hpFill: hpFill, initialX: 50, x: 50, targetX: 50, y: -20, baseSpeed: data.speed * speedStageMult, speed: data.speed * speedStageMult, maxHp: data.hp * hpStageMult, hp: data.hp * hpStageMult, reward: 500, isBoss: true, data: data, lastAbilityTime: Date.now() };
    
    // Improved Event Listener for AA-tier Interactivity
    enemyDiv.addEventListener('mousedown', (e) => { 
        e.preventDefault();
        e.stopPropagation(); 
        if (typeof window.showEnemyInfo === 'function') {
            window.showEnemyInfo(boss); 
        }
    });
    
    road.appendChild(enemyDiv);
    enemies.push(boss); bossInstance = boss;
    if (data.type === 'charon') { for(let i=0; i<5; i++) spawnPassenger(boss); }
    if (data.type === 'lucifer') { 
        const fo = document.getElementById('frozen-overlay'); if(fo) fo.style.opacity = 1;
        setTimeout(() => { if (boss.hp > 0 && typeof towers !== 'undefined') {
            const active = towers.filter(t => !t.isFrozenTomb);
            if (active.length > 0) { active[0].isFrozenTomb = true; active[0].element.classList.add('frozen-tomb'); }
        }}, 3000);
    }
}

function spawnEnemy() {
    const road = document.getElementById('road');
    currentStageSpawned++; updateStageInfo();
    const relicTreasure = (typeof getRelicBonus === 'function') ? getRelicBonus('treasure_chance') : 0;
    const finalTC = treasureChance + relicTreasure;
    let probs = stage === 1 ? { specter: 1.0, wraith: 0, spirit: 0, demon: 0, treasure: 0 } : { specter: 0.3, wraith: 0.23, spirit: 0.23, demon: 0.23, treasure: finalTC };
    const randCat = Math.random(); let acc = 0; let cat = 'specter';
    for (const [k, v] of Object.entries(probs)) { acc += v; if (randCat < acc) { cat = k; break; } }
    let types = enemyCategories[cat];
    if (stage === 1 && cat === 'specter') types = types.filter(e => e.type === 'normal' || e.type === 'shade');
    const totalSetProb = types.reduce((sum, e) => sum + e.probability, 0);
    let currentRand = Math.random() * totalSetProb; let selected = types[0];
    for (const et of types) { currentRand -= et.probability; if (currentRand <= 0) { selected = et; break; } }
    if (typeof recordUnlock === 'function') recordUnlock(selected.type, true);
    if (typeof GameLogger !== 'undefined') GameLogger.debug(`👾 Spawned: ${selected.name || selected.type}`);
    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy', 'spawning', selected.type); enemyDiv.innerText = '';
    setTimeout(() => { enemyDiv.classList.remove('spawning'); }, 500);
    const hpBg = document.createElement('div'); hpBg.className = 'hp-bar-bg'; hpBg.style.display = 'none';
    const hpFill = document.createElement('div'); hpFill.className = 'hp-bar-fill';
    hpBg.appendChild(hpFill); enemyDiv.appendChild(hpBg);
    const { hpStageMult, speedStageMult } = getStageMultipliers();
    const randomX = Math.random() * 20 + 40; 
    const enemy = { 
        element: enemyDiv, 
        hpFill: hpFill, 
        initialX: randomX, 
        x: randomX, 
        targetX: Math.random() * 20 + 40, 
        y: -20, 
        swayPhase: Math.random() * Math.PI * 2, 
        swaySpeed: 0.02 + Math.random() * 0.03, 
        baseSpeed: selected.speed * speedStageMult, 
        speed: selected.speed * speedStageMult, 
        maxHp: selected.hp * hpStageMult, 
        defense: selected.defense || 0, 
        hp: selected.hp * hpStageMult, 
        reward: selected.reward || 10, 
        type: selected.type, 
        icon: selected.icon, 
        desc: selected.desc,
        data: {
            name: selected.name || selected.type,
            lore: selected.lore || "이 영혼에 대한 기록이 없습니다."
        }
    };
    enemyDiv.addEventListener('mousedown', (e) => { 
        e.stopPropagation(); 
        if (typeof window.showEnemyInfo === 'function') {
            window.showEnemyInfo(enemy);
        }
    });
    road.appendChild(enemyDiv);
    if (selected.type === 'boar') enemy.vxSign = Math.random() < 0.5 ? -1 : 1; 
    enemies.push(enemy);
}

function spawnPassenger(boss) {
    const road = document.getElementById('road');
    const div = document.createElement('div'); div.classList.add('enemy', 'normal', 'boarded', 'spawning');
    road.appendChild(div); setTimeout(() => { div.classList.remove('spawning'); }, 500);
    const { hpStageMult, speedStageMult } = getStageMultipliers();
    const enemy = { element: div, initialX: boss.x, x: boss.x, targetX: 50, y: boss.y, baseSpeed: 0.5 * speedStageMult, speed: 0.5 * speedStageMult, maxHp: 100 * hpStageMult, hp: 100 * hpStageMult, type: 'normal', isBoarded: true, parentBoss: boss, offsetX: (Math.random() - 0.5) * 30, offsetY: (Math.random() - 0.5) * 40, reward: 5, invincible: true };
    enemies.push(enemy);
}

function spawnFriendlyGhost() {
    const road = document.getElementById('road'); const div = document.createElement('div'); div.classList.add('friendly-ghost'); road.appendChild(div);
    const randomX = Math.random() * 20 + 40; div.style.left = `${randomX}%`;
    const startY = 416 - 20; div.style.top = `${startY * 3}px`;
    friendlyGhosts.push({ element: div, x: randomX, y: startY, speed: 0.5, maxHp: 500 });
}

function handleEnemyDeath(target, killer = null) {
    if (target.hp > 0) return;
    const idx = enemies.indexOf(target);
    if (idx > -1) {
        if (typeof GameLogger !== 'undefined') GameLogger.success(`💀 Defeated: ${target.data?.name || target.type}`);
        if (!window.killCounts) window.killCounts = {};
        window.killCounts[target.type] = (window.killCounts[target.type] || 0) + 1;

        if (target.isCursedMark) spawnDeathExplosion(target, '#2e003e', 100, 0.5);
        if (target.isHellfireBurn) spawnDeathExplosion(target, '#ff4500', 80, 30, true);
        if (target.type === 'ember_hatred') spawnDeathExplosion(target, 'rgba(255, 69, 0, 0.6)', 100, 0, false, (e) => { e.speed *= 1.5; setTimeout(() => { e.speed = e.baseSpeed; }, 3000); });
        if (killer && killer.data.type === 'wraithlord') spawnFriendlySkeleton(target);

        // [User Request] Soul Essence Sparkle Effect
        if (typeof spawnSoulEssence === 'function') {
            const lx = (target.x / 100) * 360; // Logical X
            const ly = target.y;               // Logical Y
            spawnSoulEssence(lx, ly);
        }

        target.element.remove(); enemies.splice(idx, 1);
        if (typeof checkRelicDrop === 'function') checkRelicDrop(target);
        if (typeof checkEquipmentDrop === 'function') checkEquipmentDrop(target);
        updateStageInfo(); 
        if (enemies.length === 0 && currentStageSpawned >= totalStageEnemies && !isBossStage) triggerStageTransition();

        if (target.isBoss) {
            let rm = "", bd = "", rid = "";
            if (target.data.type === 'cerberus') { rid = 'cerberus_fang'; rm = `Obtained [${target.data.rewardName}]`; bd = "Global ATK +10%"; }
            else if (target.data.type === 'charon') { rid = 'stygian_oar'; rm = `Obtained [${target.data.rewardName}]`; bd = "Enemy Speed -15%"; }
            else if (target.data.type === 'beelzebub') { rid = 'gluttony_crown'; rm = `Obtained [${target.data.rewardName}]`; bd = "Treasure Spawn Rate Up"; }
            else if (target.data.type === 'lucifer') { rid = 'fallen_wings'; rm = `Obtained [${target.data.rewardName}]`; bd = "Crit Chance +10%"; const fo = document.getElementById('frozen-overlay'); if(fo) fo.style.opacity = 0; if(typeof towers !== 'undefined') towers.forEach(t => { if (t.isFrozenTomb) { t.isFrozenTomb = false; t.element.classList.remove('frozen-tomb'); } }); }
            if (rid && typeof collectRelic === 'function') collectRelic(rid);
            showBossVictory(target.data.name, rm, bd); bossInstance = null;
        }

        let reward = target.reward;
        if (killer && killer.data && killer.data.type === 'abyssal') reward = Math.floor(reward * 1.5);
        
        // 1. Apply Equipment Multiplier (%)
        const equipMult = (typeof getEquipBonus === 'function') ? getEquipBonus('se_gain') : 0;
        reward = Math.floor(reward * (1.0 + equipMult));

        // 2. Apply Relic Flat Bonus (e.g., soul_urn gives +1 per stack)
        const relicFlatBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('se_gain') : 0;
        reward += relicFlatBonus;

        // 3. Update money using maxMoney constant
        const limit = (typeof maxMoney !== 'undefined') ? maxMoney : 1000;
        money = Math.min(limit, money + reward); 
        
        updateGauges();
        if (typeof saveGameData === 'function') saveGameData();

        if (typeof createSEGainEffect === 'function' && target.element) {
            const r = target.element.getBoundingClientRect(); 
            const gr = gameContainer.getBoundingClientRect();
            // Centering the effect on the target element
            const centerX = (r.left + r.width / 2) - gr.left;
            const centerY = (r.top + r.height / 2) - gr.top;
            createSEGainEffect(centerX, centerY, reward, gameContainer);
        }
        if (typeof window.updateSummonButtonState === 'function') window.updateSummonButtonState();
    }
}

function spawnDeathExplosion(target, color, radius, dmgVal, isBurn = false, extraEff = null) {
    const exp = document.createElement('div'); exp.style.position = 'absolute'; exp.style.left = target.element.style.left; exp.style.top = target.element.style.top;
    exp.style.width = `${radius*2}px`; exp.style.height = `${radius*2}px`; exp.style.background = `radial-gradient(circle, ${color}, transparent)`;
    exp.style.transform = 'translate(-50%, -50%)'; exp.style.zIndex = '19'; exp.style.borderRadius = '50%'; exp.style.opacity = '0.8';
    gameContainer.appendChild(exp); setTimeout(() => exp.remove(), 400);
    const tX = target.x;
    enemies.forEach(e => {
        if (e === target || e.hp <= 0) return;
        const eX = e.x; const dist = Math.sqrt(Math.pow(eX - tX, 2) + Math.pow(e.y - target.y, 2));
        if (dist < radius / 3) { // scaled logical radius
            if (dmgVal > 0 && typeof window.applyDamage === 'function') window.applyDamage(e, dmgVal, null);
            if (isBurn) { e.isBurning = true; e.burnEndTime = Date.now() + 3000; e.isHellfireBurn = true; if(e.element) e.element.classList.add('burning'); }
            if (extraEff) extraEff(e);
        }
    });
}

function spawnFriendlySkeleton(target) {
    const road = document.getElementById('road'); const div = document.createElement('div'); div.classList.add('friendly-skeleton'); road.appendChild(div);
    div.style.left = target.element.style.left; div.style.top = target.element.style.top;
    friendlySkeletons.push({ element: div, x: target.x, y: target.y, speed: 0.7 });
}

function showBossWarning(bossName) {
    const modal = document.getElementById('unlock-modal');
    if (!modal) return;

    const header = document.getElementById('unlock-header');
    const icon = document.getElementById('unlock-icon');
    const name = document.getElementById('unlock-name');
    const desc = document.getElementById('unlock-desc');

    if (header) header.innerText = "⚠️ [심연의 징조: 마신 강림]";
    if (icon) icon.innerText = "👿";
    if (name) name.innerText = bossName;
    if (desc) desc.innerText = "강력한 심연의 지배자가 다가오고 있습니다. 모든 퇴마사의 힘을 집중하십시오!";

    modal.style.display = 'flex';
    if (typeof isPaused !== 'undefined') isPaused = true;
}

function showBossVictory(bossName, rewardMsg, bonusDetail) {
    const container = document.getElementById('game-container'); const overlay = document.createElement('div'); overlay.className = 'boss-victory-overlay';
    overlay.innerHTML = `<div class="boss-victory-content"><div class="boss-victory-header">심연의 존재가 추방되었습니다</div><div class="boss-victory-name">마왕 [${bossName}]<br>소멸</div><div class="boss-victory-reward">${rewardMsg}</div><div class="boss-victory-bonus">${bonusDetail}</div><div class="boss-victory-hint">(클릭하여 계속)</div></div>`;
    container.appendChild(overlay); isPaused = true;
    overlay.addEventListener('click', () => { overlay.classList.add('fade-out'); setTimeout(() => { overlay.remove(); isPaused = false; }, 500); });
}

function drawEnemies() {
    if (!enemies) return; 
    enemies.forEach(e => {
        if (e.hp <= 0) return; 
        const lx = (e.x / 100) * 360; 
        const ly = e.y;
        if (typeof drawShadow === 'function') drawShadow(lx, ly, e.isBoss ? 24 : 10);
        const floatY = ly + Math.sin(globalAnimTimer * 1.5 + (lx * 0.1)) * 3;
        ctx.save();
        const ba = e.isStealthed ? 0.6 : 1.0; ctx.globalAlpha = ba;
        if (e.lastHitTime && Date.now() - e.lastHitTime < 100) ctx.filter = 'brightness(3) contrast(2) grayscale(1) brightness(5)'; 
        ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; 
        ctx.fillText(e.icon || '?', lx, floatY);
        ctx.restore();
        const bw = e.isBoss ? 40 : 20; const hr = e.hp / e.maxHp; const bx = lx - bw/2; const by = floatY - (e.isBoss ? 30 : 20);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(bx, by, bw, 3);
        const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, '#ff1744'); g.addColorStop(1, '#b71c1c');
        ctx.fillStyle = g; ctx.fillRect(bx, by, bw * hr, 3);
    });
}

function createSEGainEffect(x, y, amount, container) {
    if (!container) return; const div = document.createElement('div'); div.className = 'se-gain-effect'; div.innerText = `+${amount}`;
    div.style.left = `${x}px`; div.style.top = `${y}px`; container.appendChild(div); setTimeout(() => div.remove(), 600);
}

function triggerStageTransition() {
    if (typeof spawnLightPillar !== 'function') return;
    const slots = document.querySelectorAll('.card-slot'); const container = document.getElementById('game-container'); if (!container) return;
    const cr = container.getBoundingClientRect(); const count = 4 + Math.floor(Math.random() * 3);
    const shuffled = Array.from(slots).sort(() => 0.5 - Math.random());
    shuffled.slice(0, count).forEach((s, i) => {
        setTimeout(() => {
            const r = s.getBoundingClientRect();
            spawnLightPillar(((r.left + r.width / 2) - cr.left) * (360 / cr.width), ((r.top + r.height / 2) - cr.top) * (640 / cr.height));
        }, i * 300);
    });
}

// Window Exports
window.drawEnemies = drawEnemies;
window.triggerStageTransition = triggerStageTransition;
window.updateGauges = updateGauges;
window.updateStageInfo = updateStageInfo;
window.initStage = initStage;
window.spawnWave = spawnWave;
window.handleEnemyDeath = handleEnemyDeath;
