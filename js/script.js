/* script.js */
let thunderInterval;

let spawnInterval = 4800; 
let isPaused = false;
let gameWidth = 360; 

function applyDamage(target, amount, sourceTower, isShared = false, ignoreFreeze = false, isCrit = false) {
    if (!target || target.hp <= 0) return;
    
    // [Hit-Flash] Track when enemy was hit for visual feedback
    target.lastHitTime = Date.now();

    // [Particles] Spark particles on hit
    if (typeof spawnParticles === 'function') {
        const rect = target.element.getBoundingClientRect();
        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        const lx = ((rect.left + rect.width / 2) - containerRect.left) * (360 / containerRect.width);
        const ly = ((rect.top + rect.height / 2) - containerRect.top) * (640 / containerRect.height);
        spawnParticles(lx, ly, target.isBoss ? '#f00' : '#fff', 4);
    }
    if (isTimeFrozen && !ignoreFreeze && !target.isBoss) {
        target.accumulatedDamage = (target.accumulatedDamage || 0) + amount;
        return;
    }
    if (target.type && typeof getBestiaryBonus === 'function') {
        amount *= getBestiaryBonus(target.type);
    }
    target.hp -= amount;

    // Executioner's Mark Relic Logic
    const execThreshold = (typeof getRelicBonus === 'function') ? getRelicBonus('execute_threshold') : 0;
    if (execThreshold > 0 && !target.isBoss) {
        if (target.hp > 0 && (target.hp / target.maxHp) <= execThreshold) {
            target.hp = 0; // Execute!
        }
    }

    if (target.hpFill) {
        const hpPercent = Math.max(0, (target.hp / target.maxHp) * 100);
        target.hpFill.style.width = `${hpPercent}%`;
    }

    // [User Request] Enhanced Damage Text
    createDamageText(target, amount, isCrit);

    if (!isShared && target.linkId && target.linkEndTime > Date.now()) {
        const linkedEnemies = enemies.filter(e => e !== target && e.linkId === target.linkId && e.hp > 0);
        const sharedAmount = amount * 0.5;
        linkedEnemies.forEach(e => applyDamage(e, sharedAmount, sourceTower, true));
    }
    if (target.hp <= 0) {
        const limit = (typeof maxMoney !== 'undefined') ? maxMoney : 1000;
        if (sourceTower && sourceTower.data.type === 'midas') {
            money = Math.min(limit, money + 15);
            if (typeof updateGauges === 'function') updateGauges();
        }
        if (sourceTower && sourceTower.data.type === 'transmuter') {
            money = Math.min(limit, money + 25);
            if (typeof updateGauges === 'function') updateGauges();
        }
        if (typeof handleEnemyDeath === 'function') handleEnemyDeath(target, sourceTower);
        else { 
            const idx = enemies.indexOf(target); 
            if(idx>-1){ 
                target.element.remove(); 
                enemies.splice(idx,1); 
                if (typeof updateStageInfo === 'function') updateStageInfo();
            }
        }
    }
}

function handleSpecialAblities(tower, target) {
    const type = tower.data.type;
    const limit = (typeof maxMoney !== 'undefined') ? maxMoney : 1000;
    if (type === 'alchemist' && Math.random() < 0.05) {
        money = Math.min(limit, money + 2);
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

function resetGameState() {
    // Clear Enemies
    enemies.forEach(e => { if (e.element) e.element.remove(); });
    enemies = [];
    
    // Clear Towers
    towers.forEach(t => { if (t.element) t.element.remove(); });
    towers = [];
    
    // Clear Summons
    friendlySkeletons.forEach(s => { if (s.element) s.element.remove(); });
    friendlySkeletons = [];
    friendlyGhosts.forEach(g => { if (g.element) g.element.remove(); });
    friendlyGhosts = [];
    
    // Clear Ground Effects
    groundEffects.forEach(ge => { if (ge.element) ge.element.remove(); });
    groundEffects = [];
    
    // Reset Globals
    stage = 1;
    money = 150;
    portalEnergy = 0;
    currentStageSpawned = 0;
    isBossStage = false;
    bossSpawned = false;
    bossInstance = null;
    lastSpawnTime = 0;
    isStageStarting = false;
    
    // Reset Stats & Costs
    window.towerCost = 30;
    damageMultiplier = 1.0;
    critChance = 0.05;
    critMultiplier = 2.0;
    treasureChance = 0.01;
    
    // Reset Time Effects
    isTimeFrozen = false;
    timeFreezeEndTime = 0;
    
    // UI Reset
    updateGauges();
    updateStageInfo();
    const fo = document.getElementById('frozen-overlay'); if (fo) fo.style.opacity = 0;
    
    // Reset Sacred Tablet (Unit Info)
    const d = document.getElementById('unit-info');
    if (d && typeof startInfoResetTimer === 'function') {
        // Force immediate reset of the info panel
        d.innerHTML = `
            <div class="info-default-text" style="font-size:36px; opacity:0.6;">GATE OF HELL</div>
            <div style="color:#555; font-size:24px; margin-top:10px; letter-spacing:8px; font-weight:bold;">SACRED TABLET</div>
            <div style="width:60%; height:1px; background:linear-gradient(90deg, transparent, #ffd70044, transparent); margin:15px 0;"></div>
            <div style="color:#444; font-size:18px; font-style:italic;">"영혼을 정화하는 성스러운 기록이 이곳에 새겨집니다."</div>
        `;
    }
}

let gameStarted = false;

function gameLoop() {
    // Render custom canvas graphics (Road effects, etc.) - ALWAYS render for atmosphere
    if (typeof renderGraphics === 'function') renderGraphics();

    if (!gameStarted || isPaused) { requestAnimationFrame(gameLoop); return; }
    
    const targetY = 416; // [User Request] Match portal logical boundary
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
            const cycle = (nowTime % 3000); 
            let shouldBeStealthed = (cycle < 1000);
            
            // Seer check
            const seers = towers.filter(t => t.data.type === 'seer');
            const gameW = gameContainer.offsetWidth;
            const exPx = (e.x / 100) * gameW;
            const revealed = seers.some(s => {
                const sRect = s.slotElement.getBoundingClientRect();
                const sx = sRect.left + sRect.width / 2;
                const sy = sRect.top + sRect.height / 2;
                return Math.sqrt(Math.pow(exPx - sx, 2) + Math.pow(e.y - sy, 2)) < 120;
            });
            
            e.isStealthed = shouldBeStealthed && !revealed;
            if (e.element) e.element.style.opacity = e.isStealthed ? 0.4 : 1;
        }
    });

    towers.forEach(t => {
        t.speedBonus = (typeof getRelicBonus === 'function' ? getRelicBonus('cooldown') : 0) + (typeof getEquipBonus === 'function' ? getEquipBonus('cooldown') : 0);
        t.rangeBonus = (typeof getRelicBonus === 'function' ? getRelicBonus('range') : 0) + (typeof getEquipBonus === 'function' ? getEquipBonus('aura_range') : 0);
        t.damageBonus = (typeof getEquipBonus === 'function' ? getEquipBonus('damage') : 0);

        // Apply Cursed SPD Penalty (Portal Energy based)
        const peRatio = portalEnergy / maxPortalEnergy;
        if (peRatio >= 0.75) t.speedBonus -= 0.2; // -20% speed
        else if (peRatio >= 0.5) t.speedBonus -= 0.1; // -10% speed
        else if (peRatio >= 0.3) t.speedBonus -= 0.05; // -5% speed

        if (!t.slotElement) return;
        const gameW = gameContainer.offsetWidth;
        const tRect = t.slotElement.getBoundingClientRect();
        const tX = tRect.left + tRect.width / 2;
        const tY = tRect.top + tRect.height / 2;

        // Debuffs from enemies
        enemies.forEach(e => {
            if (e.type === 'frost_outcast' && e.hp > 0) {
                const exPx = (e.x / 100) * gameW;
                const dist = Math.sqrt(Math.pow(exPx - tX, 2) + Math.pow(e.y - tY, 2));
                if (dist < 360) t.speedBonus -= 0.2;
            }
        });

        // Buffs from nearby allies (Tracker, Seer, Commander)
        towers.forEach(other => {
            if (other === t || !other.slotElement) return;
            const oRect = other.slotElement.getBoundingClientRect();
            const oX = oRect.left + oRect.width / 2;
            const oY = oRect.top + oRect.height / 2;
            const dist = Math.sqrt(Math.pow(oX - tX, 2) + Math.pow(oY - tY, 2));

            const relicAuraBonus = (typeof getRelicBonus === 'function' ? getRelicBonus('aura_range') : 0) + (typeof getEquipBonus === 'function' ? getEquipBonus('aura_range') : 0);
            if (dist < (195 + relicAuraBonus)) { // Base range 195px covers ~1 tile cardinal in 1080p
                if (other.data.type === 'tracker') {
                    t.rangeBonus += 90; // +90 range (scaled from 30)
                } else if (other.data.type === 'seer') {
                    t.rangeBonus += 150; // +150 range (scaled from 50)
                } else if (other.data.type === 'commander') {
                    t.speedBonus += 0.2; // +20% attack speed
                    t.damageBonus += 0.2; // +20% damage
                }
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
        const canSpawnMore = currentStageSpawned < totalStageEnemies;
        const noEnemiesLeft = enemies.length === 0;
        const timeElapsed = Date.now() - lastSpawnTime > spawnInterval;

        if (canSpawnMore) {
            if (isBossStage) {
                // Spawn boss first, then minions until limit - Slower spawn for boss stage
                if (!bossSpawned || (bossInstance && bossInstance.hp > 0)) {
                    if (timeElapsed || noEnemiesLeft) {
                        spawnWave(); 
                        lastSpawnTime = Date.now();
                    }
                }
            } else {
                if (timeElapsed || noEnemiesLeft) {
                    spawnWave(); 
                    lastSpawnTime = Date.now();
                }
            }
        }

        // Global Stage Progression Check
        const allSpawned = isBossStage ? (currentStageSpawned >= totalStageEnemies || (bossSpawned && !bossInstance)) : (currentStageSpawned >= totalStageEnemies);
        if (allSpawned && enemies.length === 0) {
            if (typeof triggerStageTransition === 'function') triggerStageTransition();
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
                // Road boundaries (approx 35% to 65% of 1080px for a 340px road)
                if (enemy.x <= 35) { enemy.x = 35; enemy.vxSign = 1; }
                else if (enemy.x >= 65) { enemy.x = 65; enemy.vxSign = -1; }
            } else { enemy.x += (targetX - enemy.x) * 0.1; }
        } else {
            let baseX = enemy.initialX + (targetX - enemy.initialX) * progress;
            if (enemy.type === 'runner' || enemy.type === 'dimension') {
                // Reduced sway from 8 to 5 to stay within the 35-65% road area
                baseX += Math.sin(enemy.y * 0.04) * 5;
            } else if (['normal', 'mist', 'memory', 'shade', 'tank'].includes(enemy.type)) {
                enemy.swayPhase = (enemy.swayPhase || 0) + (enemy.swaySpeed || 0.03);
                baseX += Math.sin(enemy.swayPhase) * 3;
            }
            enemy.x = baseX;
        }

        if(enemy.element) {
            // [User Request] Fixed Y-axis pathing: Scale logical coordinates (360x640) to physical container (1080x1920)
            // Logic: 360 * 3 = 1080. We apply a 3x multiplier to the top position.
            enemy.element.style.top = `${enemy.y * 3}px`;
            enemy.element.style.left = `${enemy.x}%`;
            
            // [User Request] Perspective Effects Removed (No scale/opacity reduction near portal)
            enemy.element.style.opacity = enemy.isStealthed ? 0.6 : 1.0;
            enemy.element.style.transform = `translate(-50%, -50%) scale(1)`; 
        }

        if (enemy.y >= targetY) {
            // [Defensive] Ensure portalEnergy does not become negative
            portalEnergy = Math.max(0, portalEnergy + (enemy.hp + (enemy.isBoss ? 200 : 0)));
            if (enemy.isBoss) bossInstance = null;
            
            if (portalEnergy >= maxPortalEnergy) { 
                portalEnergy = maxPortalEnergy; 
                isPaused = true; 
                
                const gameOverOverlay = document.getElementById('game-over-overlay');
                const finalStageText = document.getElementById('final-stage');
                if (finalStageText) finalStageText.innerText = stage;
                if (gameOverOverlay) gameOverOverlay.style.display = 'flex'; 
                return; 
            }
            updateGauges(); 
            enemy.element.remove(); 
            enemies.splice(i, 1); 
            updateStageInfo(); 
            continue;
        }
    }

    // Friendly Skeletons & Ghosts Logic
    const relicSummonBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_damage') : 0;
    
    [...friendlySkeletons, ...friendlyGhosts].forEach((summon, index, array) => {
        // Move Up
        summon.y -= summon.speed || 1.0;
        if (summon.element) {
            // [Bug Fix] Scale logical Y to physical top (3x)
            summon.element.style.top = `${summon.y * 3}px`;
            summon.element.style.left = `${summon.x}%`;
        }

        // Cleanup if they go off screen (top)
        if (summon.y < -50) {
            if (summon.element) summon.element.remove();
            if (friendlySkeletons.includes(summon)) friendlySkeletons.splice(friendlySkeletons.indexOf(summon), 1);
            else friendlyGhosts.splice(friendlyGhosts.indexOf(summon), 1);
            return;
        }

        // Attack Logic (Simple proximity)
        const summonPxX = (summon.x / 100) * gameWidth;
        const now = Date.now();
        if (now - (summon.lastAttack || 0) > 1000) {
            const target = enemies.find(e => {
                const exPx = (e.x / 100) * gameWidth;
                return Math.sqrt(Math.pow(exPx - summonPxX, 2) + Math.pow(e.y - summon.y, 2)) < 40;
            });

            if (target) {
                const baseDmg = friendlySkeletons.includes(summon) ? 20 : 40;
                applyDamage(target, baseDmg * (1.0 + relicSummonBonus), null);
                summon.lastAttack = now;
                
                // Visual feedback
                if (summon.element) {
                    summon.element.style.transform = 'translate(-50%, -50%) scale(1.3)';
                    setTimeout(() => { if(summon.element) summon.element.style.transform = 'translate(-50%, -50%) scale(1)'; }, 200);
                }
            }
        }
    });

    towers.forEach(tower => {
        const overlay = tower.element.querySelector('.cooldown-overlay');
        let sm = 1.0 + (tower.speedBonus || 0);
        let cd = tower.cooldown / sm;
        if (overlay) {
            const elapsed = nowTime - (tower.lastShot || 0);
            const ratio = Math.min(1, elapsed / cd);
            overlay.style.background = `conic-gradient(rgba(0, 0, 0, 0.3) ${(1 - ratio) * 360}deg, transparent 0deg)`;
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

    // Render custom canvas graphics (Road effects, etc.)
    if (typeof renderGraphics === 'function') renderGraphics();

    requestAnimationFrame(gameLoop);
}

function shoot(tower, target) {
    tower.lastShot = Date.now();
    const proj = document.createElement('div');
    proj.className = `projectile ${tower.data.type}`;
    const tr = tower.element.getBoundingClientRect();
    const gr = gameContainer.getBoundingClientRect();
    
    let sx = (tr.left + tr.width / 2) - gr.left;
    let sy = (tr.top + tr.height / 2) - gr.top;

    // Special case: Apprentice staff head origin
    if (tower.data.type === 'apprentice') {
        const LOGICAL_WIDTH = 1080;
        const scaleX = gr.width / LOGICAL_WIDTH;
        const scaleY = gr.height / 1920;
        const cx = ((tr.left + tr.width / 2) - gr.left) / scaleX;
        const cy = ((tr.top + tr.height / 2) - gr.top) / scaleY;
        
        // Logical Jewel Pos (Attacking): staffOX=9, staffOY=-12 -> Jewel is at X=10.5, Y=-13
        // Using S=3.0 scale
        const area = tower.slotElement.dataset.area;
        const isLeft = area === 'left-slots';
        const lx = isLeft ? 10.5 : -10.5; 
        
        sx = (cx + (lx * 3.0)) * scaleX;
        sy = (cy + (-13.0 * 3.0)) * scaleY;
    }

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
        const relicDmgBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('damage') : 0;
        let finalDamageMultiplier = damageMultiplier * (1.0 + (tower.damageBonus || 0) + relicDmgBonus);
        
        // Critical Hit Logic
        const relicCritChance = (typeof getRelicBonus === 'function') ? getRelicBonus('crit_chance') : 0;
        const totalCritChance = critChance + relicCritChance + (tower.data.type === 'vajra' ? 0.2 : 0); // Vajra has 20% innate crit
        let isCritShot = false;
        if (Math.random() < totalCritChance) {
            isCritShot = true;
            const relicCritBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('crit_damage') : 0;
            const totalCritMultiplier = critMultiplier + relicCritBonus;
            finalDamageMultiplier *= totalCritMultiplier;
            
            // Critical Visual Effect
            if (target.element) {
                target.element.classList.add('crit-hit');
                setTimeout(() => target.element && target.element.classList.remove('crit-hit'), 300);
            }
            
            // Vajra Special Crit Effect: Massive Knockback
            if (tower.data.type === 'vajra') {
                const nearby = enemies.filter(e => {
                    const exPx = (e.x / 100) * gameWidth;
                    const ter = target.element.getBoundingClientRect();
                    const tx = (ter.left + ter.width / 2);
                    const ty = (ter.top + ter.height / 2);
                    const dist = Math.sqrt(Math.pow(exPx - tx, 2) + Math.pow(e.y - ty, 2));
                    return dist < 80;
                });
                nearby.forEach(e => {
                    e.y = Math.max(0, e.y - 40);
                    if (e.element) e.element.style.top = `${e.y}px`;
                });
            }
        }

        applyDamage(target, tower.data.damage * finalDamageMultiplier, tower, false, false, isCritShot);
    }, 200);
}

function createDamageText(target, amount, isCrit) {
    if (!target || !target.element) return;
    const rect = target.element.getBoundingClientRect();
    const gameRect = gameContainer.getBoundingClientRect();
    
    const x = (rect.left + rect.width / 2) - gameRect.left;
    const y = (rect.top + rect.height / 2) - gameRect.top;
    
    const div = document.createElement('div');
    div.className = `damage-text${isCrit ? ' crit' : ''}`;
    div.style.left = `${x + (Math.random() * 20 - 10)}px`;
    div.style.top = `${y}px`;
    div.innerText = Math.round(amount);
    
    gameContainer.appendChild(div);
    setTimeout(() => div.remove(), 800);
    
    if (isCrit) createStatusEffectText(x, y, "CRITICAL");
}

function createStatusEffectText(x, y, text, type = '') {
    const div = document.createElement('div');
    div.className = `status-effect-text ${type.toLowerCase()}`;
    div.style.left = `${x}px`;
    div.style.top = `${y - 30}px`;
    div.innerText = text;
    
    gameContainer.appendChild(div);
    setTimeout(() => div.remove(), 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    gameContainer = document.getElementById('game-container');
    road = document.getElementById('road');
    
    // Explicitly set these for enemies.js as well if needed (though they share global scope usually)
    // but some browsers/bundlers might behave differently.
    window.gameContainer = gameContainer;
    window.road = road;
    
    const startBtn = document.getElementById('start-game-btn');
    const startScreen = document.getElementById('start-screen');
    const unlockModal = document.getElementById('unlock-modal');
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.onclick = () => {
            // [User Request] Match "Stop Exorcism" behavior: Full page reload for a guaranteed clean state
            window.location.reload();
        };
    }

    const restartBtnTop = document.getElementById('restart-btn-top');
    const quitModal = document.getElementById('quit-modal');
    const quitConfirm = document.getElementById('quit-confirm-btn');
    const quitCancel = document.getElementById('quit-cancel-btn');

    if (restartBtnTop && quitModal && quitConfirm && quitCancel) {
        restartBtnTop.innerText = "퇴마 중단";
        restartBtnTop.onclick = () => {
            quitModal.style.display = 'flex';
            isPaused = true;
        };

        quitConfirm.onclick = () => {
            window.location.reload();
        };

        quitCancel.onclick = () => {
            quitModal.style.display = 'none';
            isPaused = false;
        };
    }
    
    // [User Request] Re-enable 'click anywhere to resume' for Boss/Unlock modal
    if (unlockModal) {
        unlockModal.addEventListener('click', () => {
            unlockModal.style.display = 'none';
            isPaused = false;
        });
    }
    
    // Start thunder sound loop
    thunderInterval = setInterval(() => {
        if (gameStarted) clearInterval(thunderInterval);
    }, 2000);

    if (startBtn && startScreen) {
        // [User Request] Tutorial Toggle Listener (Start and Game sync)
        const tutorialToggle = document.getElementById('tutorial-toggle');
        const tutorialStatus = document.getElementById('tutorial-status');
        const tutorialContainer = document.getElementById('tutorial-toggle-container');
        
        const gameTutorialToggle = document.getElementById('game-tutorial-toggle');
        const gameTutorialStatus = document.getElementById('game-tutorial-status');
        const gameTutorialContainer = document.getElementById('game-tutorial-toggle-container');

        const syncToggles = (state) => {
            if (tutorialToggle) tutorialToggle.checked = state;
            if (gameTutorialToggle) gameTutorialToggle.checked = state;
            if (tutorialStatus) tutorialStatus.innerText = state ? 'ON' : 'OFF';
            if (gameTutorialStatus) gameTutorialStatus.innerText = state ? 'ON' : 'OFF';
        };

        if (tutorialToggle) {
            tutorialToggle.addEventListener('change', () => syncToggles(tutorialToggle.checked));
        }
        if (gameTutorialToggle) {
            gameTutorialToggle.addEventListener('change', () => syncToggles(gameTutorialToggle.checked));
        }

        // [User Request] Click anywhere on container to toggle
        if (tutorialContainer) {
            tutorialContainer.addEventListener('click', (e) => {
                if (e.target !== tutorialToggle && !e.target.closest('.slider')) {
                    const newState = !tutorialToggle.checked;
                    syncToggles(newState);
                }
            });
        }
        if (gameTutorialContainer) {
            gameTutorialContainer.addEventListener('click', (e) => {
                if (e.target !== gameTutorialToggle && !e.target.closest('.slider')) {
                    const newState = !gameTutorialToggle.checked;
                    syncToggles(newState);
                }
            });
        }

        startBtn.addEventListener('mouseenter', () => {
            // hover sound removed
        });

        startBtn.addEventListener('click', () => {
            clearInterval(thunderInterval);
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

    const pauseBtn = document.getElementById('game-pause-btn');
    const pauseOverlay = document.getElementById('pause-overlay');
    const resumeBtn = document.getElementById('pause-resume-btn');

    if (pauseBtn && pauseOverlay && resumeBtn) {
        const togglePause = () => {
            if (!gameStarted) return;
            isPaused = !isPaused;
            pauseOverlay.style.display = isPaused ? 'flex' : 'none';
            pauseBtn.innerText = isPaused ? "재개" : "일시정지";
            pauseBtn.classList.toggle('active', isPaused);
            
            if (isPaused) {
                const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
                const ai = document.getElementById('aura-indicator'); if (ai) ai.remove();
            }
        };

        pauseBtn.addEventListener('click', togglePause);
        resumeBtn.addEventListener('click', togglePause);
    }
    
    gameLoop();

        // Global ESC Key Listener
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const recordsOverlay = document.getElementById('records-overlay');
                const relicsOverlay = document.getElementById('relics-overlay');
                const collectionsOverlay = document.getElementById('collections-overlay');
                const equipOverlay = document.getElementById('equip-overlay');
                const unlockModal = document.getElementById('unlock-modal');
                const gameOverOverlay = document.getElementById('game-over-overlay');
                
                let closedSomething = false;
    
                if (recordsOverlay && recordsOverlay.style.display === 'flex') {
                    recordsOverlay.style.display = 'none';
                    closedSomething = true;
                }
                if (relicsOverlay && relicsOverlay.style.display === 'flex') {
                    relicsOverlay.style.display = 'none';
                    closedSomething = true;
                }
                if (collectionsOverlay && collectionsOverlay.style.display === 'flex') {
                    collectionsOverlay.style.display = 'none';
                    closedSomething = true;
                }
                if (equipOverlay && equipOverlay.style.display === 'flex') {
                    equipOverlay.style.display = 'none';
                    closedSomething = true;
                }
                if (unlockModal && unlockModal.style.display === 'flex') {
                    unlockModal.style.display = 'none';
                    closedSomething = true;
                }
                
                if (closedSomething) {
                    isPaused = false;
                }
                
                // Also deselect units
                document.querySelectorAll('.unit.selected').forEach(u => u.classList.remove('selected'));
                document.querySelectorAll('.card-slot.selected-slot').forEach(s => s.classList.remove('selected-slot'));
                const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
                const ai = document.getElementById('aura-indicator'); if (ai) ai.remove();
            }
        });
    
        // Deselect when clicking empty space
        document.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.unit') && !e.target.closest('.tower-card') && !e.target.closest('.job-btn') && !e.target.closest('.info-promo-btn')) {
                document.querySelectorAll('.unit.selected').forEach(u => u.classList.remove('selected'));
                document.querySelectorAll('.card-slot.selected-slot').forEach(s => s.classList.remove('selected-slot'));
                const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
                const ai = document.getElementById('aura-indicator'); if (ai) ai.remove();
            }
        });
    });
    
