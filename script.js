/* script.js */
const sounds = {
    thunder: new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_c350677d07.mp3'), // Thunder sound
    hover: new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3'),   // UI Hover
    start: new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_2ba65f912e.mp3')    // Deep cinematic start
};

// Configure sounds
sounds.thunder.volume = 0.4;
sounds.hover.volume = 0.3;
sounds.start.volume = 0.6;

function playThunder() {
    if (gameStarted) return;
    // Play thunder at random intervals matching the 'lightningStrike' animation cycle (2s)
    sounds.thunder.currentTime = 0;
    sounds.thunder.play().catch(e => console.log("Audio play blocked until interaction"));
}

let thunderInterval;

let spawnInterval = 1200; 
let isPaused = false;
let gameWidth = 360; 

function applyDamage(target, amount, sourceTower, isShared = false, ignoreFreeze = false) {
    if (!target || target.hp <= 0) return;
    if (isTimeFrozen && !ignoreFreeze && !target.isBoss) {
        target.accumulatedDamage = (target.accumulatedDamage || 0) + amount;
        return;
    }
    if (target.type && typeof getBestiaryBonus === 'function') {
        amount *= getBestiaryBonus(target.type);
    }
    target.hp -= amount;
    if (target.hpFill) {
        const hpPercent = Math.max(0, (target.hp / target.maxHp) * 100);
        target.hpFill.style.width = `${hpPercent}%`;
    }
    if (!isShared && target.linkId && target.linkEndTime > Date.now()) {
        const linkedEnemies = enemies.filter(e => e !== target && e.linkId === target.linkId && e.hp > 0);
        const sharedAmount = amount * 0.5;
        linkedEnemies.forEach(e => applyDamage(e, sharedAmount, sourceTower, true));
    }
    if (target.hp <= 0) {
        if (sourceTower && sourceTower.data.type === 'midas') {
            money = Math.min(1000, money + 15);
            if (typeof updateGauges === 'function') updateGauges();
        }
        if (sourceTower && sourceTower.data.type === 'transmuter') {
            money = Math.min(1000, money + 25);
            if (typeof updateGauges === 'function') updateGauges();
        }
        if (typeof handleEnemyDeath === 'function') handleEnemyDeath(target, sourceTower);
        else { const idx = enemies.indexOf(target); if(idx>-1){ target.element.remove(); enemies.splice(idx,1); }}
    }
}

function handleSpecialAblities(tower, target) {
    const type = tower.data.type;
    if (type === 'alchemist' && Math.random() < 0.05) {
        money = Math.min(1000, money + 2);
        if (typeof updateGauges === 'function') updateGauges();
    }
    if (type === 'mirror') {
        const others = enemies.filter(e => e !== target && e.hp > 0);
        if (others.length > 0) {
            const secondary = others[Math.floor(Math.random() * others.length)];
            applyDamage(secondary, tower.data.damage * 0.3 * damageMultiplier, tower, true);
        }
    }
    if (type === 'guardian' && Math.random() < 0.05 && !target.isBoss) {
        applyDamage(target, target.hp + 1, tower);
    }
    if (type === 'philosopher') {
        target.defense = Math.max(0, (target.defense || 0) - 1);
    }
    if (type === 'reflection') {
        const others = enemies.filter(e => e !== target && e.hp > 0);
        if (others.length > 0) {
            const secondary = others[Math.floor(Math.random() * others.length)];
            setTimeout(() => {
                if (secondary.hp > 0) applyDamage(secondary, tower.data.damage * 0.5 * damageMultiplier, tower);
            }, 100);
        }
    }
    if (type === 'illusion' && Math.random() < 0.2) {
        target.vxSign = (Math.random() < 0.5 ? -1 : 1);
        target.swayPhase = Math.random() * Math.PI * 2;
    }
    if (type === 'oracle') {
        target.speed *= 0.5;
        setTimeout(() => { if (target.hp > 0) target.speed = target.baseSpeed; }, 1000);
    }
}

let gameStarted = false;

function gameLoop() {
    if (!gameStarted || isPaused) { requestAnimationFrame(gameLoop); return; }
    const roadRect = road.getBoundingClientRect();
    const targetY = roadRect.height + 10; 
    gameWidth = gameContainer.offsetWidth;
    const nowTime = Date.now();

    if (isTimeFrozen && nowTime > timeFreezeEndTime) {
        isTimeFrozen = false;
        enemies.forEach(e => { if (e.accumulatedDamage) { applyDamage(e, e.accumulatedDamage * 2, null, false, true); e.accumulatedDamage = 0; }});
        const fo = document.getElementById('frozen-overlay'); if (fo) fo.style.opacity = 0;
    }

    enemies.forEach(e => {
        e.isSilenced = false; e.inBlizzard = false; e.inPurgatory = false;
        if(e.element) e.element.classList.remove('silenced');
        if (e.type === 'betrayer_blade') {
            const cycle = (nowTime % 3000); e.isStealthed = (cycle < 1000);
            if (e.element) e.element.style.opacity = e.isStealthed ? 0.1 : 1;
        }
    });

    towers.forEach(t => {
        t.speedBonus = 0; t.rangeBonus = 0; t.damageBonus = 0;
        if (!t.slotElement) return;
        const gameW = gameContainer.offsetWidth;
        const tRect = t.slotElement.getBoundingClientRect();
        const tX = tRect.left + tRect.width / 2;
        const tY = tRect.top + tRect.height / 2;
        enemies.forEach(e => {
            if (e.type === 'frost_outcast' && e.hp > 0) {
                const exPx = (e.x / 100) * gameW;
                const dist = Math.sqrt(Math.pow(exPx - tX, 2) + Math.pow(e.y - tY, 2));
                if (dist < 120) t.speedBonus -= 0.2;
            }
        });
    });

    for (let i = groundEffects.length - 1; i >= 0; i--) {
        const effect = groundEffects[i];
        if (nowTime > effect.endTime) { effect.element.remove(); groundEffects.splice(i, 1); continue; }
        if (effect.type === 'seal') {
            enemies.forEach(e => {
                const exPx = (e.x / 100) * gameWidth;
                const dist = Math.sqrt(Math.pow(exPx - effect.x, 2) + Math.pow(e.y - effect.y, 2));
                if (dist <= effect.radius) { e.isSilenced = true; if (e.element) e.element.classList.add('silenced'); }
            });
        } else if (effect.type === 'fire') {
            enemies.forEach(e => {
                const exPx = (e.x / 100) * gameWidth;
                const dist = Math.sqrt(Math.pow(exPx - effect.x, 2) + Math.pow(e.y - effect.y, 2));
                if (dist <= effect.radius) applyDamage(e, 20 / 60, null);
            });
        } else if (effect.type === 'blizzard') {
            enemies.forEach(e => {
                const exPx = (e.x / 100) * gameWidth;
                const dist = Math.sqrt(Math.pow(exPx - effect.x, 2) + Math.pow(e.y - effect.y, 2));
                if (dist <= effect.radius) e.inBlizzard = true;
            });
        }
    }

    if (!isStageStarting) {
        if (isBossStage) {
            // Spawn boss first, then minions until limit - Slower spawn for boss stage
            if (!bossSpawned || (bossInstance && bossInstance.hp > 0 && currentStageSpawned < totalStageEnemies)) {
                if (Date.now() - lastSpawnTime > spawnInterval) {
                    spawnWave(); 
                    spawnInterval = Math.random() * 2000 + 2000; // Much slower: 2-4 seconds
                }
            }
        } else {
            if (currentStageSpawned < totalStageEnemies) {
                if (Date.now() - lastSpawnTime > spawnInterval) {
                    spawnWave(); spawnInterval = Math.random() * 800 + 400;
                }
            }
        }

        // Global Stage Progression Check
        const allSpawned = isBossStage ? (bossSpawned && currentStageSpawned >= totalStageEnemies) : (currentStageSpawned >= totalStageEnemies);
        if (allSpawned && enemies.length === 0) {
            stage++; 
            initStage(); 
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (isTimeFrozen && !enemy.isBoss) continue;
        if (enemy.isBurning) {
            if (Date.now() > enemy.burnEndTime) { enemy.isBurning = false; if (enemy.element) enemy.element.classList.remove('burning'); }
            else { applyDamage(enemy, (enemy.maxHp * 0.01) / 60, null); if (enemy.hp <= 0) continue; }
        }
        if (enemy.isBoarded && enemy.parentBoss && enemy.parentBoss.hp > 0) {
            enemy.y = enemy.parentBoss.y + enemy.offsetY;
            enemy.x = enemy.parentBoss.x + (enemy.offsetX / 3.6);
        } else {
            if (enemy.isBoarded) { enemy.isBoarded = false; enemy.invincible = false; if(enemy.element) enemy.element.classList.remove('boarded'); }
            enemy.y += enemy.speed;
        }
        
        const progress = Math.min(enemy.y / targetY, 1);
        const targetX = enemy.targetX || 50; 
        if (enemy.type === 'boar') {
            const hf = 0.6;
            if (enemy.y < targetY * 0.85) {
                enemy.x += (enemy.vxSign || 1) * enemy.speed * hf;
                if (enemy.x <= 10) { enemy.x = 10; enemy.vxSign = 1; }
                else if (enemy.x >= 90) { enemy.x = 90; enemy.vxSign = -1; }
            } else { enemy.x += (targetX - enemy.x) * 0.1; }
        } else {
            let baseX = enemy.initialX + (targetX - enemy.initialX) * progress;
            if (enemy.type === 'runner' || enemy.type === 'dimension') {
                baseX += Math.sin(enemy.y * 0.04) * 8;
            } else if (['normal', 'mist', 'memory', 'shade', 'tank'].includes(enemy.type)) {
                enemy.swayPhase = (enemy.swayPhase || 0) + (enemy.swaySpeed || 0.03);
                baseX += Math.sin(enemy.swayPhase) * 3;
            }
            enemy.x = baseX;
        }

        if(enemy.element) {
            enemy.element.style.top = `${enemy.y}px`;
            enemy.element.style.left = `${enemy.x}%`;
            const ap = Math.max(0, (enemy.y - (targetY - 60)) / 60);
            if (ap > 0) {
                enemy.element.style.opacity = (1 - ap) * (enemy.isStealthed ? 0.1 : 1);
                enemy.element.style.transform = `translate(-50%, -50%) scale(${1 - ap * 0.5})`;
            }
        }

        if (enemy.y >= targetY) {
            portalEnergy += enemy.hp + (enemy.isBoss ? 200 : (enemy.isCorrupted ? 50 : 0));
            if (enemy.isBoss) bossInstance = null; // Important: Clear instance if boss escapes
            if (portalEnergy >= maxPortalEnergy) { portalEnergy = maxPortalEnergy; isPaused = true; document.getElementById('game-over-overlay').style.display = 'flex'; return; }
            updateGauges(); enemy.element.remove(); enemies.splice(i, 1); updateStageInfo(); continue;
        }
    }

    towers.forEach(tower => {
        const overlay = tower.element.querySelector('.cooldown-overlay');
        let sm = 1.0 + (tower.speedBonus || 0);
        let cd = tower.cooldown / sm;
        if (overlay) {
            const elapsed = nowTime - (tower.lastShot || 0);
            const ratio = Math.min(1, elapsed / cd);
            overlay.style.background = `conic-gradient(rgba(0, 0, 0, 0.6) ${(1 - ratio) * 360}deg, transparent 0deg)`;
        }
        if (tower.data.type === 'void_gatekeeper' || tower.isFeared || tower.isFrozenTomb) return;
        if (nowTime - (tower.lastShot || 0) >= cd) {
            const tr = tower.slotElement.getBoundingClientRect();
            const tx = tr.left + tr.width / 2;
            const ty = tr.top + tr.height / 2;
            const inRange = enemies.filter(e => {
                if (e.hp <= 0 || e.isStealthed) return false;
                const er = e.element.getBoundingClientRect();
                const dist = Math.sqrt(Math.pow((er.left + er.width / 2) - tx, 2) + Math.pow((er.top + er.height / 2) - ty, 2));
                return dist <= (tower.range + (tower.rangeBonus || 0));
            });
            if (inRange.length > 0) {
                const target = inRange.sort((a, b) => b.y - a.y)[0];
                shoot(tower, target); tower.lastShot = nowTime;
            }
        }
    });
    requestAnimationFrame(gameLoop);
}

function shoot(tower, target) {
    const proj = document.createElement('div');
    proj.className = `projectile ${tower.data.type}`;
    const tr = tower.element.getBoundingClientRect();
    const gr = gameContainer.getBoundingClientRect();
    const sx = (tr.left + tr.width / 2) - gr.left;
    const sy = (tr.top + tr.height / 2) - gr.top;
    proj.style.left = `${sx}px`; proj.style.top = `${sy}px`;
    gameContainer.appendChild(proj);
    setTimeout(() => {
        if (target && target.element && target.element.isConnected) {
            const ter = target.element.getBoundingClientRect();
            proj.style.left = `${(ter.left + ter.width / 2) - gr.left}px`;
            proj.style.top = `${(ter.top + ter.height / 2) - gr.top}px`;
        } else if (target) {
            proj.style.left = `${(target.x / 100) * gameWidth}px`;
            proj.style.top = `${target.y}px`;
        } else proj.remove();
    }, 10);
    setTimeout(() => {
        proj.remove();
        if (typeof createAttackEffect === 'function') createAttackEffect(tower.data.type, target, gameContainer);
        if (target.type === 'cursed_vajra' && Math.random() < 0.15) {
            tower.isStunned = true; tower.stunEndTime = Date.now() + 1000;
            if (tower.element) tower.element.classList.add('feared');
            setTimeout(() => { tower.isStunned = false; if (tower.element) tower.element.classList.remove('feared'); }, 1000);
        }
        if (target.type === 'void_piercer' && tower.range > 150 && Math.random() < 0.5) return;
        if (target.type === 'mimic' && Math.random() < 0.2) { target.y += 40; if (target.element) target.element.style.top = `${target.y}px`; }
        if (target.type === 'soul_eater') target.lastHitTime = Date.now();
        
        handleSpecialAblities(tower, target);
        applyDamage(target, tower.data.damage * damageMultiplier, tower);
    }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
    gameContainer = document.getElementById('game-container');
    road = document.getElementById('road');
    
    const startBtn = document.getElementById('start-game-btn');
    const startScreen = document.getElementById('start-screen');
    
    // Start thunder sound loop (will be blocked by browser until first click anywhere)
    thunderInterval = setInterval(() => {
        if (!gameStarted) playThunder();
        else clearInterval(thunderInterval);
    }, 2000);

    if (startBtn && startScreen) {
        startBtn.addEventListener('mouseenter', () => {
            if (!gameStarted) {
                sounds.hover.currentTime = 0;
                sounds.hover.play().catch(() => {});
            }
        });

        startBtn.addEventListener('click', () => {
            clearInterval(thunderInterval);
            sounds.start.play().catch(() => {});
            startScreen.classList.add('shrink-to-info');
            
            setTimeout(() => {
                startScreen.style.display = 'none';
                gameStarted = true;
                initStage(); 
                initAllies();
                updateSummonButtonState();
                if (typeof updateGauges === 'function') updateGauges();
            }, 800); // Match animation duration
        });
    }
    
    gameLoop();
});
