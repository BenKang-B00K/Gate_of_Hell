/* script.js */
let thunderInterval;

let spawnInterval = 4800; 
let isPaused = false;

function applyDamage(target, amount, sourceTower, isShared = false, ignoreFreeze = false, isCrit = false) {
    if (!target || target.hp <= 0) return;
    
    // [Hit-Flash] Track when enemy was hit for visual feedback
    target.lastHitTime = Date.now();

    // [Particles] Spark particles on hit
    if (typeof spawnParticles === 'function') {
        const lx = (target.x / 100) * LOGICAL_WIDTH;
        const ly = target.y;
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
    if (typeof GameLogger !== 'undefined') GameLogger.warn("🔄 Game State Reset.");
    enemies = [];
    towers = [];
    friendlySkeletons = [];
    friendlyGhosts = [];
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
    window.shrineCost = 100;
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
        d.innerHTML = `
            <div class="info-default-text" style="font-size:36px; opacity:0.6;">GATE OF HELL</div>
            <div style="color:#555; font-size:24px; margin-top:10px; letter-spacing:8px; font-weight:bold;">SACRED TABLET</div>
            <div style="width:60%; height:1px; background:linear-gradient(90deg, transparent, #ffd70044, transparent); margin:15px 0;"></div>
            <div style="color:#444; font-size:18px; font-style:italic;">"영혼을 정화하는 성스러운 기록이 이곳에 새겨집니다."</div>
        `;
    }
}

let gameStarted = false;

function applyShrineBuffs() {
    towers.forEach(t => { if (!t.isShrine) t.shrineDmgBonus = 0; });

    const mastery = (typeof getRelicBonus === 'function') ? getRelicBonus('shrine_mastery') : 0;
    const shrines = towers.filter(t => t.isShrine);

    shrines.forEach(shrine => {
        const data = shrine.data;
        const isGlobal = data.rangeType === 'all';
        const effectMult = isGlobal ? (1.0 + mastery) : 1.0;

        if (isGlobal) {
            towers.forEach(t => {
                if (!t.isShrine) {
                    const multiplier = shrine.isDemolishing ? -1 : 1;
                    if (data.bonus.type === 'damage') {
                        t.shrineDmgBonus = (t.shrineDmgBonus || 0) + (data.bonus.value * effectMult * multiplier);
                    }
                }
            });
            return;
        }

        const rangeThreshold = (mastery > 0) ? 80 : 55; 

        towers.forEach(t => {
            if (t === shrine || t.isShrine) return;
            const dist = Math.sqrt(Math.pow(t.lx - shrine.lx, 2) + Math.pow(t.ly - shrine.ly, 2));
            if (dist < rangeThreshold) {
                const multiplier = shrine.isDemolishing ? -1 : 1;
                if (data.bonus.type === 'damage') {
                    t.shrineDmgBonus = (t.shrineDmgBonus || 0) + (data.bonus.value * effectMult * multiplier);
                }
            }
        });
    });
}

function gameLoop() {
    if (typeof renderGraphics === 'function') renderGraphics();

    if (!gameStarted || isPaused) { requestAnimationFrame(gameLoop); return; }

    applyShrineBuffs();

    const targetY = LOGICAL_HEIGHT; 
    const nowTime = Date.now();

    if (isTimeFrozen && nowTime > timeFreezeEndTime) {
        isTimeFrozen = false;
        enemies.forEach(e => { if (e.accumulatedDamage) { applyDamage(e, e.accumulatedDamage * 2, null, false, true); e.accumulatedDamage = 0; }});
        const fo = document.getElementById('frozen-overlay'); if (fo) fo.style.opacity = 0;
    }

    enemies.forEach(e => {
        e.isSilenced = false; e.inBlizzard = false; e.inPurgatory = false;
        if (e.type === 'betrayer_blade') {
            const cycle = (nowTime % 3000); 
            let shouldBeStealthed = (cycle < 1000);
            
            const seers = towers.filter(t => t.data.type === 'seer');
            const ex = (e.x / 100) * LOGICAL_WIDTH;
            const revealed = seers.some(s => {
                return Math.sqrt(Math.pow(ex - s.lx, 2) + Math.pow(e.y - s.ly, 2)) < 120;
            });
            
            e.isStealthed = shouldBeStealthed && !revealed;
        }
    });

    towers.forEach(t => {
        t.speedBonus = (typeof getRelicBonus === 'function' ? getRelicBonus('cooldown') : 0) + (typeof getEquipBonus === 'function' ? getEquipBonus('cooldown') : 0);
        t.rangeBonus = (typeof getRelicBonus === 'function' ? getRelicBonus('range') : 0) + (typeof getEquipBonus === 'function' ? getEquipBonus('aura_range') : 0);
        t.damageBonus = (typeof getEquipBonus === 'function' ? getEquipBonus('damage') : 0);

        const peRatio = portalEnergy / maxPortalEnergy;
        if (peRatio >= 0.75) t.speedBonus -= 0.2; 
        else if (peRatio >= 0.5) t.speedBonus -= 0.1; 
        else if (peRatio >= 0.3) t.speedBonus -= 0.05; 

        const tx = t.lx;
        const ty = t.ly;

        enemies.forEach(e => {
            if (e.type === 'frost_outcast' && e.hp > 0) {
                const ex = (e.x / 100) * LOGICAL_WIDTH;
                const dist = Math.sqrt(Math.pow(ex - tx, 2) + Math.pow(e.y - ty, 2));
                if (dist < 120) t.speedBonus -= 0.2; 
            }
        });

        towers.forEach(other => {
            if (other === t) return;
            const ox = other.lx;
            const oy = other.ly;
            const dist = Math.sqrt(Math.pow(ox - tx, 2) + Math.pow(oy - ty, 2));

            const relicAuraBonus = (typeof getRelicBonus === 'function' ? getRelicBonus('aura_range') : 0) + (typeof getEquipBonus === 'function' ? getEquipBonus('aura_range') : 0);
            if (dist < (65 + relicAuraBonus)) { 
                if (other.data.type === 'tracker') {
                    t.rangeBonus += 30; 
                } else if (other.data.type === 'seer') {
                    t.rangeBonus += 50; 
                } else if (other.data.type === 'commander') {
                    t.speedBonus += 0.2; 
                    t.damageBonus += 0.2; 
                }
            }
        });
    });

    for (let i = groundEffects.length - 1; i >= 0; i--) {
        const effect = groundEffects[i];
        if (nowTime > effect.endTime) { groundEffects.splice(i, 1); continue; }
        if (effect.type === 'seal') {
            enemies.forEach(e => {
                const ex = (e.x / 100) * LOGICAL_WIDTH;
                const dist = Math.sqrt(Math.pow(ex - effect.lx, 2) + Math.pow(e.y - effect.ly, 2));
                if (dist <= effect.lRadius) { e.isSilenced = true; }
            });
        } else if (effect.type === 'fire') {
            enemies.forEach(e => {
                const ex = (e.x / 100) * LOGICAL_WIDTH;
                const dist = Math.sqrt(Math.pow(ex - effect.lx, 2) + Math.pow(e.y - effect.ly, 2));
                if (dist <= effect.lRadius) applyDamage(e, 20 / 60, null);
            });
        } else if (effect.type === 'blizzard') {
            enemies.forEach(e => {
                const ex = (e.x / 100) * LOGICAL_WIDTH;
                const dist = Math.sqrt(Math.pow(ex - effect.lx, 2) + Math.pow(e.y - effect.ly, 2));
                if (dist <= effect.lRadius) e.inBlizzard = true;
            });
        }
    }

    if (!isStageStarting) {
        const canSpawnMore = currentStageSpawned < totalStageEnemies;
        const noEnemiesLeft = enemies.length === 0;
        const timeElapsed = Date.now() - lastSpawnTime > spawnInterval;

        if (canSpawnMore) {
            if (isBossStage) {
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
            if (Date.now() > enemy.burnEndTime) { enemy.isBurning = false; }
            else { applyDamage(enemy, (enemy.maxHp * 0.01) / 60, null); if (enemy.hp <= 0) continue; }
        }
        if (enemy.isBoarded && enemy.parentBoss && enemy.parentBoss.hp > 0) {
            enemy.y = enemy.parentBoss.y + enemy.offsetY;
            enemy.x = enemy.parentBoss.x + (enemy.offsetX / 3.6);
        } else {
            if (enemy.isBoarded) { enemy.isBoarded = false; enemy.invincible = false; }
            enemy.y += enemy.speed;
        }
        
        const progress = Math.min(enemy.y / targetY, 1);
        const targetX = enemy.targetX || 50; 
        if (enemy.type === 'boar') {
            const hf = 0.6;
            if (enemy.y < targetY * 0.85) {
                enemy.x += (enemy.vxSign || 1) * enemy.speed * hf;
                if (enemy.x <= 35) { enemy.x = 35; enemy.vxSign = 1; }
                else if (enemy.x >= 65) { enemy.x = 65; enemy.vxSign = -1; }
            } else { enemy.x += (targetX - enemy.x) * 0.1; }
        } else {
            let baseX = enemy.initialX + (targetX - enemy.initialX) * progress;
            if (enemy.type === 'runner' || enemy.type === 'dimension') {
                baseX += Math.sin(enemy.y * 0.04) * 5;
            } else if (['normal', 'mist', 'memory', 'shade', 'tank'].includes(enemy.type)) {
                enemy.swayPhase = (enemy.swayPhase || 0) + (enemy.swaySpeed || 0.03);
                baseX += Math.sin(enemy.swayPhase) * 3;
            }
            enemy.x = baseX;
        }

        if (enemy.y >= targetY) {
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
            enemies.splice(i, 1); 
            updateStageInfo(); 
            continue;
        }
    }

    [...friendlySkeletons, ...friendlyGhosts].forEach((summon, index, array) => {
        summon.y -= summon.speed || 1.0;
        if (summon.y < -50) {
            if (friendlySkeletons.includes(summon)) friendlySkeletons.splice(friendlySkeletons.indexOf(summon), 1);
            else friendlyGhosts.splice(friendlyGhosts.indexOf(summon), 1);
            return;
        }
        const now = Date.now();
        if (now - (summon.lastAttack || 0) > 1000) {
            const target = enemies.find(e => {
                const ex = (e.x / 100) * LOGICAL_WIDTH;
                const sx = (summon.x / 100) * LOGICAL_WIDTH;
                return Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(e.y - summon.y, 2)) < 40;
            });
            if (target) {
                const baseDmg = friendlySkeletons.includes(summon) ? 20 : 40;
                const summonBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_damage') : 0;
                applyDamage(target, baseDmg * (1.0 + summonBonus), null);
                summon.lastAttack = now;
            }
        }
    });

    towers.forEach(tower => {
        if (tower.isShrine || tower.data.type === 'void_gatekeeper' || tower.isFeared || tower.isFrozenTomb) return;
        
        let sm = 1.0 + (tower.speedBonus || 0);
        let cd = tower.cooldown / sm;
        
        if (nowTime - (tower.lastShot || 0) >= cd) {
            const inRange = enemies.filter(e => {
                if (e.hp <= 0 || e.isStealthed) return false;
                const ex = (e.x / 100) * LOGICAL_WIDTH;
                const dist = Math.sqrt(Math.pow(ex - tower.lx, 2) + Math.pow(e.y - tower.ly, 2));
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
    tower.lastShot = Date.now();
    if (typeof spawnProjectile === 'function') {
        spawnProjectile(tower, target);
    } else {
        setTimeout(() => {
            if (target && target.hp > 0) {
                handleHit(tower, target);
            }
        }, 200);
    }
}

function handleHit(tower, target) {
    if (typeof createAttackEffect === 'function') createAttackEffect(tower.data.type, target);
    
    if (target.type === 'cursed_vajra' && Math.random() < 0.15) {
        tower.isStunned = true; tower.stunEndTime = Date.now() + 1000;
        setTimeout(() => { tower.isStunned = false; }, 1000);
    }
    if (target.type === 'void_piercer' && tower.range > 150 && Math.random() < 0.5) return;
    if (target.type === 'mimic' && Math.random() < 0.2) { target.y += 40; }
    if (target.type === 'soul_eater') target.lastHitTime = Date.now();
    
    handleSpecialAblities(tower, target);
    const relicDmgBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('damage') : 0;
    const shrineDmg = tower.shrineDmgBonus || 0;
    let finalDamageMultiplier = 1.0 * (1.0 + (tower.damageBonus || 0) + relicDmgBonus + shrineDmg);
    
    const relicCritChance = (typeof getRelicBonus === 'function') ? getRelicBonus('crit_chance') : 0;
    const totalCritChance = 0.05 + relicCritChance + (tower.data.type === 'vajra' ? 0.2 : 0);
    let isCritShot = false;
    if (Math.random() < totalCritChance) {
        isCritShot = true;
        const relicCritBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('crit_damage') : 0;
        const totalCritMultiplier = 2.0 + relicCritBonus;
        finalDamageMultiplier *= totalCritMultiplier;
        if (tower.data.type === 'vajra') {
            const nearby = enemies.filter(e => {
                const ex = (e.x / 100) * LOGICAL_WIDTH;
                const tx = (target.x / 100) * LOGICAL_WIDTH;
                const dist = Math.sqrt(Math.pow(ex - tx, 2) + Math.pow(e.y - target.y, 2));
                return dist < 80;
            });
            nearby.forEach(e => {
                e.y = Math.max(0, e.y - 40);
            });
        }
    }
    applyDamage(target, tower.data.damage * finalDamageMultiplier, tower, false, false, isCritShot);
}

function createDamageText(target, amount, isCrit) {
    if (!target) return;
    const lx = (target.x / 100) * LOGICAL_WIDTH;
    const ly = target.y;
    const color = isCrit ? '#ff4500' : '#fff';
    const size = isCrit ? 24 : 18;
    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(Math.round(amount), lx, ly, color, size);
        if (isCrit) spawnFloatingText("CRITICAL", lx, ly - 25, "#ff0000", 14);
    }
}

function createStatusEffectText(x, y, text, type = '') {
    // This could also use spawnFloatingText
    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(text, x, y - 30, '#ffd700', 16);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-game-btn');
    const startScreen = document.getElementById('start-screen');
    const unlockModal = document.getElementById('unlock-modal');
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) retryBtn.onclick = () => window.location.reload();

    const restartBtnTop = document.getElementById('restart-btn-top');
    const quitModal = document.getElementById('quit-modal');
    const quitConfirm = document.getElementById('quit-confirm-btn');
    const quitCancel = document.getElementById('quit-cancel-btn');

    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    const gaugeToggle = document.getElementById('gauge-detail-toggle');
    const gaugeGrid = document.getElementById('gauges-grid');

    if (gaugeToggle && gaugeGrid) {
        gaugeToggle.onclick = () => {
            gaugeGrid.classList.toggle('detailed');
            gaugeToggle.innerText = gaugeGrid.classList.contains('detailed') ? '➖' : 'ℹ️';
        };
    }

    if (settingsBtn && settingsModal && closeSettingsBtn) {
        settingsBtn.onclick = () => {
            settingsModal.style.display = 'flex';
            isPaused = true;
        };
        closeSettingsBtn.onclick = () => {
            settingsModal.style.display = 'none';
            isPaused = false;
        };
    }

    if (restartBtnTop && quitModal && quitConfirm && quitCancel) {
        restartBtnTop.onclick = () => { 
            settingsModal.style.display = 'none';
            quitModal.style.display = 'flex'; 
            isPaused = true; 
        };
        quitConfirm.onclick = () => window.location.reload();
        quitCancel.onclick = () => { quitModal.style.display = 'none'; isPaused = false; };
    }
    if (unlockModal) unlockModal.addEventListener('click', () => { unlockModal.style.display = 'none'; isPaused = false; });
    
    if (startBtn && startScreen) {
        const tutorialToggle = document.getElementById('tutorial-toggle');
        const tutorialStatus = document.getElementById('tutorial-status');
        const tutorialContainer = document.getElementById('tutorial-toggle-container');
        const gameTutorialToggle = document.getElementById('game-tutorial-toggle');
        const gameTutorialStatusText = document.getElementById('game-tutorial-status-text');
        const tutorialToggleBtn = document.getElementById('tutorial-toggle-btn');

        const syncToggles = (state) => {
            if (tutorialToggle) tutorialToggle.checked = state;
            if (gameTutorialToggle) gameTutorialToggle.checked = state;
            if (tutorialStatus) tutorialStatus.innerText = state ? 'ON' : 'OFF';
            if (gameTutorialStatusText) gameTutorialStatusText.innerText = state ? 'ON' : 'OFF';
            localStorage.setItem('goh_tutorial_enabled', state);
        };

        const savedTutorial = localStorage.getItem('goh_tutorial_enabled');
        if (savedTutorial !== null) syncToggles(savedTutorial === 'true');

        if (tutorialToggle) tutorialToggle.addEventListener('change', () => syncToggles(tutorialToggle.checked));
        if (tutorialToggleBtn) {
            tutorialToggleBtn.onclick = () => {
                const newState = localStorage.getItem('goh_tutorial_enabled') !== 'true';
                syncToggles(newState);
            };
        }

        if (tutorialContainer) tutorialContainer.addEventListener('click', (e) => { if (e.target !== tutorialToggle && !e.target.closest('.slider')) syncToggles(!tutorialToggle.checked); });

        startBtn.addEventListener('click', async () => {
            await window.gameDataLoaded;
            startScreen.classList.add('shrink-to-info');
            setTimeout(() => {
                startScreen.style.display = 'none';
                gameStarted = true;
                if (typeof initLogicalSlots === 'function') initLogicalSlots();
                initStage(); 
                initAllies();
                updateSummonButtonState();
                if (typeof updateGauges === 'function') updateGauges();
            }, 800);
        });
    }

    const pauseBtn = document.getElementById('game-pause-btn');
    const pauseOverlay = document.getElementById('pause-overlay');
    const resumeBtn = document.getElementById('pause-resume-btn');

    if (pauseBtn && pauseOverlay && resumeBtn) {
        const togglePause = () => {
            if (!gameStarted) return;
            isPaused = !isPaused;
            
            // If opening from settings, we might need special handling
            if (settingsModal.style.display === 'flex') {
                settingsModal.style.display = 'none';
            }

            pauseOverlay.style.display = isPaused ? 'flex' : 'none';
            pauseBtn.innerText = isPaused ? "재개" : "일시정지";
            if (isPaused) {
                const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
                const ai = document.getElementById('aura-indicator'); if (ai) ai.remove();
            }
        };
        pauseBtn.addEventListener('click', togglePause);
        resumeBtn.addEventListener('click', togglePause);
    }
    gameLoop();

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const mods = ['relics-overlay', 'collections-overlay', 'equip-overlay', 'unlock-modal', 'settings-modal', 'quit-modal'];
            let closed = false;
            mods.forEach(m => { const el = document.getElementById(m); if(el && el.style.display === 'flex'){ el.style.display='none'; closed=true; }});
            if (closed) isPaused = false;
            const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
            const ai = document.getElementById('aura-indicator'); if (ai) ai.remove();
        }
    });

    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.tower-card') && !e.target.closest('.job-btn') && !e.target.closest('.info-promo-btn') && !e.target.closest('#settings-btn')) {
            const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
            const ai = document.getElementById('aura-indicator'); if (ai) ai.remove();
        }
    });
});
