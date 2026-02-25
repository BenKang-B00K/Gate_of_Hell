/* script.js */
let spawnInterval = 1200; // Reduced from 2000
let isPaused = false;

// Apply damage function (Handles shared damage)
function applyDamage(target, amount, sourceTower, isShared = false, ignoreFreeze = false) {
    if (!target || target.hp <= 0) return;

    // [Abyss] Ruler of Cocytus: Accumulate damage during time freeze
    if (isTimeFrozen && !ignoreFreeze && !target.isBoss) {
        target.accumulatedDamage = (target.accumulatedDamage || 0) + amount;
        return;
    }

    // Bestiary bonus
    if (target.type) {
        amount *= getBestiaryBonus(target.type);
    }

    target.hp -= amount;

    // Update HP Bar
    if (target.hpFill) {
        const hpPercent = Math.max(0, (target.hp / target.maxHp) * 100);
        target.hpFill.style.width = `${hpPercent}%`;
    }

    // [Master] Soul Binder: Shared damage
    // Shared damage (isShared=true) is not shared again (to prevent infinite loops)
    if (!isShared && target.linkId && target.linkEndTime > Date.now()) {
        const linkedEnemies = enemies.filter(e => e !== target && e.linkId === target.linkId && e.hp > 0);
        const sharedAmount = amount * 0.5; // 50% shared
        linkedEnemies.forEach(e => {
            applyDamage(e, sharedAmount, sourceTower, true);
        });
    }

    if (target.hp <= 0) {
        handleEnemyDeath(target, sourceTower);
    }
}

// Game Loop
function gameLoop() {
    if (isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }
    const roadRect = road.getBoundingClientRect();
    const targetY = roadRect.height - 60; // Portal reach Y position
    const gameWidth = gameContainer.offsetWidth;

    const nowTime = Date.now();

    // --- Time Freeze End ---
    if (isTimeFrozen && nowTime > timeFreezeEndTime) {
        isTimeFrozen = false;
        enemies.forEach(e => {
            if (e.accumulatedDamage) {
                applyDamage(e, e.accumulatedDamage * 2, null, false, true); // ignoreFreeze = true
                e.accumulatedDamage = 0;
            }
        });
        const frozenOverlay = document.getElementById('frozen-overlay');
        if (frozenOverlay) frozenOverlay.style.opacity = 0;
    }

    // Reset enemy status (Statuses recalculated every frame)
    enemies.forEach(e => {
        e.isSilenced = false; // Silence only maintained while on the zone
        e.inBlizzard = false; // Blizzard effect reset
        e.inPurgatory = false; // Purgatory effect reset
        if(e.element) e.element.classList.remove('silenced');
    });

    // --- Wall Management ---
    for (let i = walls.length - 1; i >= 0; i--) {
        if (nowTime > walls[i].endTime) {
            walls[i].element.remove();
            walls.splice(i, 1);
        }
    }

    // --- Ground Effects (Zones) Management ---
    for (let i = groundEffects.length - 1; i >= 0; i--) {
        const effect = groundEffects[i];
        if (nowTime > effect.endTime) {
            effect.element.remove();
            groundEffects.splice(i, 1);
            continue;
        }

        // Apply effect
        if (effect.type === 'seal') {
            // Grand Sealer: Silence enemies in range
            enemies.forEach(e => {
                const exPx = (e.x / 100) * gameWidth;
                const dist = Math.sqrt(Math.pow(exPx - effect.x, 2) + Math.pow(e.y - effect.y, 2));
                if (dist <= effect.radius) {
                    e.isSilenced = true;
                    if (e.element) e.element.classList.add('silenced');
                    // Reveal stealth
                    if (e.isPhasing) {
                        e.isPhasing = false;
                        if (e.element) e.element.style.opacity = 1;
                    }
                }
            });
        } else if (effect.type === 'fire') {
            // Fire Talisman Master: Range damage (20 per second)
            enemies.forEach(e => {
                const exPx = (e.x / 100) * gameWidth;
                const dist = Math.sqrt(Math.pow(exPx - effect.x, 2) + Math.pow(e.y - effect.y, 2));
                if (dist <= effect.radius) {
                    applyDamage(e, 20 / 60, null); // 60fps frame damage
                }
            });
        } else if (effect.type === 'blizzard') {
            // Ice Maiden: Range speed reduction
            enemies.forEach(e => {
                const exPx = (e.x / 100) * gameWidth;
                const dist = Math.sqrt(Math.pow(exPx - effect.x, 2) + Math.pow(e.y - effect.y, 2));
                if (dist <= effect.radius) {
                    e.inBlizzard = true;
                }
            });
        } else if (effect.type === 'purgatory_row') {
            // [Abyss] Eternal Purgatory Fire
            // Dynamic position update: Follow the parent tower's row
            if (effect.parentTower && effect.parentTower.slotElement) {
                const towerRect = effect.parentTower.slotElement.getBoundingClientRect();
                const gameRect = gameContainer.getBoundingClientRect();
                effect.y = (towerRect.top + towerRect.height / 2) - gameRect.top;
                effect.element.style.top = `${effect.y - 30}px`;
            }

            enemies.forEach(e => {
                if (Math.abs(e.y - effect.y) < 30) {
                    e.inPurgatory = true;
                    applyDamage(e, (e.maxHp * 0.08) / 60, null); // Buffed from 5% to 8% max HP per sec
                }
            });
        }
    }

    // --- Ally Skeleton Soldiers (Wraith Lord) ---
    for (let i = friendlySkeletons.length - 1; i >= 0; i--) {
        const skel = friendlySkeletons[i];
        skel.y -= skel.speed; // Move up

        // Remove if off-screen
        if (skel.y < 0) {
            skel.element.remove();
            friendlySkeletons.splice(i, 1);
            continue;
        }

        skel.element.style.top = `${skel.y}px`;

        // Collision check with enemies
        const hitEnemy = enemies.find(e => Math.abs(e.y - skel.y) < 15 && Math.abs(e.x - skel.x) < 5 && e.hp > 0);
        if (hitEnemy) {
            // Damage proportional to enemy health (e.g., 50% max HP)
            const dmg = hitEnemy.maxHp * 0.5;
            applyDamage(hitEnemy, dmg, null);
            
            skel.element.remove();
            friendlySkeletons.splice(i, 1);
        }
    }

    // --- Friendly Ghosts (Forsaken King) ---
    if (typeof friendlyGhosts !== 'undefined') {
        for (let i = friendlyGhosts.length - 1; i >= 0; i--) {
            const ghost = friendlyGhosts[i];
            ghost.y -= ghost.speed; 
            if (ghost.y < 0) {
                ghost.element.remove();
                friendlyGhosts.splice(i, 1);
                continue;
            }
            ghost.element.style.top = `${ghost.y}px`;
            const hitEnemy = enemies.find(e => Math.abs(e.y - ghost.y) < 20 && Math.abs(e.x - ghost.x) < 10 && e.hp > 0);
            if (hitEnemy) {
                applyDamage(hitEnemy, ghost.maxHp, null); 
                ghost.element.remove();
                friendlyGhosts.splice(i, 1);
            }
        }
    }

    // 0. Spawn logic (Wave System)
    if (!isStageStarting) {
        if (isBossStage) {
            // Boss stage: Spawn minions every 2 seconds while boss is alive
            if (bossInstance && bossInstance.hp > 0) {
                if (Date.now() - lastSpawnTime > spawnInterval) {
                    spawnWave();
                    spawnInterval = Math.random() * (2000 - 800) + 800; // 0.8 ~ 2.0s random
                }
            } else if (enemies.length === 0) {
                // Clear when boss and minions are all gone
                stage++;
                initStage();
            }
        } else if (currentStageSpawned < totalStageEnemies) {
            // Normal stage: Spawn if no enemies or interval passed
            if (enemies.length === 0 || Date.now() - lastSpawnTime > spawnInterval) {
                spawnWave();
                spawnInterval = Math.random() * (2000 - 800) + 800; // 0.8 ~ 2.0s random
            }
        } else if (enemies.length === 0) {
            // Stage Clear (All enemies defeated)
            stage++;
            initStage();
        }
    }

    // --- Enemy Status Update (Speed, Aura, etc.) ---
    const frosts = enemies.filter(e => e.type === 'frost');
    
    // [Class Characteristic] Buff Totem (Soul Tracker series): Buff calculation
    // 1. Reset all tower buffs
    towers.forEach(t => {
        t.rangeBonus = 0;
        t.damageBonus = 0;
        t.speedBonus = 0;
    });
    
    // 2. Apply neighbor tower buffs
    towers.forEach(t => {
        if (['tracker', 'seer', 'commander'].includes(t.data.type)) {
            const idx = slots.indexOf(t.slotElement);
            if (idx === -1) return;
            
            const isLeft = idx < 27; // Skipping top 3 slots means 27 slots per side
            const localIdx = isLeft ? idx : idx - 27;
            const row = Math.floor(localIdx / 3);
            const col = localIdx % 3;
            
            // Calculate neighbors (within same grid only)
            const neighbors = [];
            if (row > 0) neighbors.push(idx - 3); // Up
            if (row < 8) neighbors.push(idx + 3); // Down (Total 9 rows: 0 to 8)
            if (col > 0) neighbors.push(idx - 1); // Left
            if (col < 2) neighbors.push(idx + 1); // Right

            neighbors.forEach(nIdx => {
                const neighborTower = towers.find(nt => nt.slotElement === slots[nIdx]);
                if (neighborTower) {
                    if (t.data.type === 'tracker') neighborTower.rangeBonus = (neighborTower.rangeBonus || 0) + 50; // Range +50
                    if (t.data.type === 'seer') neighborTower.damageBonus = (neighborTower.damageBonus || 0) + 10; // DMG +10
                    if (t.data.type === 'commander') neighborTower.speedBonus = (neighborTower.speedBonus || 0) + 0.2; // Attack Speed +20%
                }
            });
        }
    });

    enemies.forEach(e => {
        // 1. Base speed reset and unique behaviors
        if (e.type === 'boar') {
            // Charging Boar: Exponential acceleration based on distance
            const progress = Math.max(0, Math.min(e.y / targetY, 1));
            e.speed = e.baseSpeed * (1 + Math.pow(progress, 2) * 5) * globalSpeedFactor; // Up to 6x acceleration
        } else {
            e.speed = e.baseSpeed * globalSpeedFactor;
        }

        // [Status Effect] Soul Chainer: Movement speed -10%
        if (e.isSlowed) {
            e.speed *= 0.9;
        }

        // [Status Effect] Blizzard: Movement speed -50%
        if (e.inBlizzard) {
            e.speed *= 0.5;
        }
        
        // [Status Effect] Stunned (Cannot move)
        if (e.isStunned) {
            if (Date.now() > e.stunEndTime) {
                e.isStunned = false;
                if (e.element) e.element.classList.remove('stunned');
            } else {
                e.speed = 0;
            }
        }

        // 2. Aura Application (Lightspeed Shadow ignores)
        if (e.type !== 'lightspeed' && !e.isBoarded && frosts.length > 0) {
            let multiplier = 1;
            for (const frost of frosts) {
                if (e !== frost) { // Exclude self
                    const exPx = (e.x / 100) * gameWidth;
                    const fxPx = (frost.x / 100) * gameWidth;
                    const dist = Math.sqrt(Math.pow(exPx - fxPx, 2) + Math.pow(e.y - frost.y, 2));
                    
                    if (dist < 100) multiplier += 0.15; // 15% increase (Stackable)
                }
            }
            e.speed *= multiplier;
        }

        // [Special Ability] Lava's Craving: Cleanse freeze and jump
        if (e.type === 'lava' && e.isFrozen) {
            e.isFrozen = false; // Cleanse freeze
            e.y += 50; // Jump forward 0.5 units (~50px)
        }

        // [Boss Ability] Beelzebub: Slime of Plague (Every 5s)
        if (e.isBoss && e.data.type === 'beelzebub') {
            if (Date.now() - e.lastAbilityTime > 5000) {
                e.lastAbilityTime = Date.now();
                // Contaminate 4 random slots
                const targets = slots.sort(() => 0.5 - Math.random()).slice(0, 4);
                targets.forEach(slot => {
                    slot.classList.add('plagued');
                    // Clear after 4s
                    setTimeout(() => { slot.classList.remove('plagued'); }, 4000);
                });
            }
        }

        // [Boss Ability] Cerberus: Three-Headed Roar (Every 5s)
        if (e.isBoss && e.data.type === 'cerberus') {
            if (Date.now() - e.lastAbilityTime > 5000) {
                e.lastAbilityTime = Date.now();
                // Fear 3 random towers
                const activeTowers = towers.filter(t => !t.isFeared);
                if (activeTowers.length > 0) {
                    // Shuffle and select 3
                    const targets = activeTowers.sort(() => 0.5 - Math.random()).slice(0, 3);
                    targets.forEach(t => {
                        t.isFeared = true;
                        t.element.classList.add('feared');
                        // Clear after 2s
                        setTimeout(() => { t.isFeared = false; if(t.element) t.element.classList.remove('feared'); }, 2000);
                    });
                }
            }
        }
    });

    // 1. Enemy Movement Processing
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // [Abyss] Ruler of Cocytus: Skip movement if time frozen
        if (isTimeFrozen && !enemy.isBoss) {
            continue;
        }

        // [Abyss] Warden of the Abyss: Pulled to center
        if (enemy.isPulled) {
            if (nowTime > enemy.pullEndTime) {
                enemy.isPulled = false;
            } else {
                const centerY = gameContainer.offsetHeight / 2;
                enemy.y += (centerY - enemy.y) * 0.05;
                enemy.x += (50 - enemy.x) * 0.05;
                applyDamage(enemy, (enemy.maxHp * 0.05) / 60, null); // 5% max HP per sec DOT
                enemy.element.style.top = `${enemy.y}px`;
                enemy.element.style.left = `${enemy.x}%`;
                continue; // Skip regular movement
            }
        }

        // [Class Characteristic] Fire Mage: Burn damage (1% MaxHP per sec)
        if (enemy.isBurning) {
            if (Date.now() > enemy.burnEndTime) {
                enemy.isBurning = false;
                if (enemy.element) enemy.element.classList.remove('burning');
            } else {
                // Frame damage based on 60fps
                const burnDmg = (enemy.maxHp * 0.01) / 60;
                applyDamage(enemy, burnDmg, null);
                if (enemy.hp <= 0) continue;
            }
        }

        // [Special Ability] Charon's Passenger: Move with boss
        if (enemy.isBoarded) {
            if (enemy.parentBoss && enemy.parentBoss.hp > 0) {
                // Fixed relative to boss
                enemy.y = enemy.parentBoss.y + enemy.offsetY;
                // X-axis is % units, convert pixel offset roughly (Based on 360px width)
                enemy.x = enemy.parentBoss.x + (enemy.offsetX / 3.6);
            } else {
                // Debark if boss dies (Invincibility removed)
                enemy.isBoarded = false;
                enemy.invincible = false;
                enemy.element.classList.remove('boarded');
            }
        } else {
            enemy.y += enemy.speed;

            // [Class Characteristic] Necromancer: Wall collision check
            // Road pixels for enemy.y. Cancel movement if wall present.
            if (walls.some(w => Math.abs(w.y - enemy.y) < 15 && Math.abs(w.x - enemy.x) < 15)) {
                enemy.y -= enemy.speed; // Revert movement (Stop)
            }
        }
        
        // [Special Ability] Dimensional Shifter: Chance to phase (Attack ignore)
        if (enemy.type === 'dimension' && !enemy.isPhasing && !enemy.isSilenced) {
            if (Math.random() < 0.01) { // 1% chance per frame (Silence immune)
                enemy.isPhasing = true;
                enemy.element.style.opacity = 0.3; // Translucent
                // Release after 2s
                setTimeout(() => { enemy.isPhasing = false; if(enemy.element) enemy.element.style.opacity = 1; }, 2000);
            }
        }

        // [Master] Seeker of Truth: Reveal stealth (Clear stealth in range)
        if (enemy.isPhasing) {
            const revealed = towers.some(t => {
                if (t.data.type !== 'seer') return false;
                const tRect = t.slotElement.getBoundingClientRect();
                const dist = Math.sqrt(Math.pow(enemy.x - (tRect.left + tRect.width/2)/gameWidth*100, 2) + Math.pow(enemy.y - (tRect.top + tRect.height/2), 2));
                return dist <= (t.range + (t.rangeBonus || 0)); // Approx distance calculation
            });
            if (revealed) {
                enemy.isPhasing = false;
                if(enemy.element) enemy.element.style.opacity = 1;
            }
        }

        // Move X-axis towards center (50%) based on progress
        const progress = Math.min(enemy.y / targetY, 1);
        enemy.x = enemy.initialX + (50 - enemy.initialX) * progress;

        // Portal Reach Confirmation
        if (enemy.y >= targetY) {
            // [Abyss] Gatekeeper of the Void
            const hasVoidGatekeeper = towers.some(t => t.data.type === 'void_gatekeeper');
            if (hasVoidGatekeeper && sealedGhostCount < 30) {
                enemy.y = targetY - 5;
                enemy.element.style.top = `${enemy.y}px`;
                sealedGhostCount++;
                if (sealedGhostCount === 30) {
                    const portal = document.getElementById('portal');
                    if (portal) portal.style.border = '2px solid red';
                }
                continue;
            }

            // [Abyss] Guide of Doom
            const hasDoomGuide = towers.some(t => t.data.type === 'doom_guide');
            if (hasDoomGuide) {
                money = Math.min(1000, money + Math.floor((enemy.reward || 10) * 0.9));
                const seDisplay = document.getElementById('se-display');
                if (seDisplay) seDisplay.innerText = money;
            }

            // [Master] Holy Rampart: Gate Defense (Updated indices for skipped top row)
            const rampart = towers.find(t => {
                if (t.data.type !== 'rampart' || (t.charges || 0) <= 0) return false;
                const idx = slots.indexOf(t.slotElement);
                // Bottom left (originally 27~29) -> now 24~26
                // Bottom right (originally 57~59) -> now 51~53
                return (idx >= 24 && idx <= 26) || (idx >= 51 && idx <= 53);
            });

            if (rampart) {
                rampart.charges--;
                enemy.y = 0; // To starting point
                enemy.element.style.top = '0px';
                // Effect (Instant move)
                enemy.element.style.transition = 'none';
                setTimeout(() => enemy.element.style.transition = '', 50);
                
                if (rampart.charges <= 0) rampart.element.style.filter = 'grayscale(100%)'; // Depletion marker
                continue;
            }

            // Portal Energy Accumulation
            portalEnergy += enemy.hp;
            if (portalEnergy >= maxPortalEnergy) {
                portalEnergy = maxPortalEnergy;
                if (typeof updateGauges === 'function') updateGauges();
                isPaused = true;
                
                // Show Spooky Game Over
                const goOverlay = document.getElementById('game-over-overlay');
                const title = document.getElementById('game-over-title');
                const msg = document.getElementById('game-over-msg');
                const finalStageText = document.getElementById('final-stage');
                const cancelBtn = document.getElementById('cancel-restart-btn');

                const spookyMessages = [
                    "The abyss claims another soul... The gate has fallen, and eternal darkness awaits.",
                    "Your light has flickered out. The Underworld consumes all that remains.",
                    "Silence falls over the abyss. The gate is breached, and hope is but a memory.",
                    "The spirits dance upon your failure. Darkness is the only truth left.",
                    "The descent ends here. Your name will be forgotten in the echoes of the void.",
                    "Death was not the end... but it was the only way out. The gate is lost."
                ];

                if (goOverlay) {
                    if (title) title.innerText = "YOU HAVE BEEN CONSUMED";
                    if (msg) msg.innerText = spookyMessages[Math.floor(Math.random() * spookyMessages.length)];
                    if (finalStageText) finalStageText.innerText = stage;
                    if (cancelBtn) cancelBtn.style.display = 'none';
                    goOverlay.style.display = 'flex';
                } else {
                    alert("Game Over! The portal has been overwhelmed by spirits.");
                    location.reload(); 
                }
                return;
            }
            if (typeof updateGauges === 'function') updateGauges();

            enemy.element.remove();
            enemies.splice(i, 1);
            if (typeof updateStageInfo === 'function') {
                updateStageInfo();
            }
            continue;
        }

        enemy.element.style.top = `${enemy.y}px`;
        enemy.element.style.left = `${enemy.x}%`;
    }

    // 2. Tower Attack Processing
    const now = Date.now();
    towers.forEach(tower => {
        // Update Cooldown Overlay
        const overlay = tower.element.querySelector('.cooldown-overlay');
        if (overlay) {
            let speedMult = 1.0 + (tower.speedBonus || 0);
            if (tower.slotElement.classList.contains('plagued')) speedMult *= 0.6;
            const currentCooldown = tower.cooldown / speedMult;
            
            const elapsed = now - (tower.lastShot || 0);
            const ratio = Math.min(1, elapsed / currentCooldown);
            const degree = (1 - ratio) * 360;
            overlay.style.background = `conic-gradient(rgba(0, 0, 0, 0.6) ${degree}deg, transparent 0deg)`;
        }

        if (tower.data.type === 'void_gatekeeper') return; // Cannot attack

        // Cannot attack if feared or frozen
        if (tower.isFeared || tower.isFrozenTomb) return;

        // [Abyss] Warden of the Abyss: Pull ability (15s cooldown)
        if (tower.data.type === 'warden' && now - (tower.lastShot || 0) > tower.cooldown) {
            tower.lastShot = now;
            enemies.forEach(e => {
                if (!e.isBoss) {
                    e.isPulled = true;
                    e.pullEndTime = now + 5000;
                }
            });
            // Visual effect
            const bh = document.createElement('div');
            bh.style.cssText = 'position:absolute; left:50%; top:50%; width:150px; height:150px; background:radial-gradient(circle, #000, #4b0082, transparent); border-radius:50%; transform:translate(-50%,-50%); z-index:5;';
            gameContainer.appendChild(bh);
            setTimeout(() => bh.remove(), 5000);
            return;
        }

        // [Abyss] Ruler of Cocytus: Time Freeze (30s cooldown)
        if (tower.data.type === 'cocytus' && now - (tower.lastShot || 0) > tower.cooldown) {
            tower.lastShot = now;
            isTimeFrozen = true;
            timeFreezeEndTime = now + 10000;
            const frozenOverlay = document.getElementById('frozen-overlay');
            if (frozenOverlay) {
                frozenOverlay.style.background = 'radial-gradient(circle, transparent 50%, rgba(138, 43, 226, 0.4) 100%)';
                frozenOverlay.style.opacity = 1;
            }
            return;
        }

        // [Abyss] Nightmare Reaper: Instakill (5s cooldown)
        if (tower.data.type === 'reaper' && now - (tower.lastShot || 0) > tower.cooldown) {
            const valid = enemies.filter(e => !e.isBoss && e.hp > 0).sort((a,b) => b.hp - a.hp);
            if (valid.length > 0) {
                const target = valid[0];
                target.reward = (target.reward || 10) * 3; // 3x SE
                applyDamage(target, target.hp + 9999, tower);
                tower.lastShot = now;
                // Visual effect
                const scythe = document.createElement('div');
                scythe.innerText = "🗡️";
                scythe.style.cssText = `position:absolute; left:${target.x}%; top:${target.y}px; font-size:30px; transform:translate(-50%,-50%); z-index:20;`;
                gameContainer.appendChild(scythe);
                setTimeout(() => scythe.remove(), 300);
            }
            return;
        }

        // [Abyss] Eternal Purgatory Fire: Permanent Row
        if (tower.data.type === 'purgatory' && !tower.hasCreatedRow) {
            tower.hasCreatedRow = true;
            const towerRect = tower.slotElement.getBoundingClientRect();
            const gameRect = gameContainer.getBoundingClientRect();
            const rowY = (towerRect.top + towerRect.height / 2) - gameRect.top;
            
            const pZone = document.createElement('div');
            pZone.style.cssText = `position:absolute; left:0; width:100%; height:60px; top:${rowY - 30}px; background:linear-gradient(to bottom, transparent, rgba(139,0,0,0.5), transparent); pointer-events:none; z-index:4; transition: top 0.2s;`;
            gameContainer.appendChild(pZone);

            groundEffects.push({
                type: 'purgatory_row',
                y: rowY,
                element: pZone,
                endTime: Infinity,
                parentTower: tower // Reference to tower
            });
        }

        // Attack speed calculation (Base + Buff)
        let speedMult = 1.0 + (tower.speedBonus || 0);
        // Speed -40% (0.6x) if plagued
        if (tower.slotElement.classList.contains('plagued')) speedMult *= 0.6;
        let currentCooldown = tower.cooldown / speedMult;

        if (now - tower.lastShot >= currentCooldown) {
            // Get current tower position on screen
            const towerRect = tower.slotElement.getBoundingClientRect();
            const towerX = towerRect.left + towerRect.width / 2;
            const towerY = towerRect.top + towerRect.height / 2;

            // [Abyss] Hell Crushing Asura
            if (tower.data.type === 'asura') {
                const effectiveRange = tower.range + (tower.rangeBonus || 0);
                const validEnemies = enemies.filter(e => !e.isPhasing && !e.invincible && Math.sqrt(Math.pow((e.element.getBoundingClientRect().left + e.element.getBoundingClientRect().width / 2) - towerX, 2) + Math.pow((e.element.getBoundingClientRect().top + e.element.getBoundingClientRect().height / 2) - towerY, 2)) <= effectiveRange).sort((a,b) => b.y - a.y);
                
                if (validEnemies.length > 0) {
                    const targets = validEnemies.slice(0, 2);
                    targets.forEach(t => {
                        for(let i=0; i<12; i++) {
                            setTimeout(() => {
                                if (t && t.hp > 0) applyDamage(t, tower.data.damage, tower);
                            }, i * 50);
                        }
                        // Knockback to start
                        if (!t.isBoss) {
                            t.y = 0;
                            if(t.element) t.element.style.top = '0px';
                        }
                    });
                    tower.lastShot = now;
                }
                return;
            }

            // [Abyss] Soul Piercing Shadow
            if (tower.data.type === 'piercing_shadow') {
                const targets = enemies.filter(e => !e.isPhasing && !e.invincible);
                if (targets.length > 0) {
                    targets.forEach((t, idx) => {
                        setTimeout(() => {
                            if (t && t.hp > 0) {
                                applyDamage(t, tower.data.damage, tower);
                                // Visual projectile effect bouncing
                                const p = document.createElement('div');
                                p.classList.add('projectile');
                                p.style.backgroundColor = '#4b0082';
                                p.style.left = t.element.style.left;
                                p.style.top = t.element.style.top;
                                gameContainer.appendChild(p);
                                setTimeout(() => p.remove(), 100);
                            }
                        }, idx * 50); // Ricochet delay
                    });
                    tower.lastShot = now;
                }
                return;
            }

            // [Master] Thousand-Hand Archer: Multi-shot (6 shots, up to 4 targets)
            if (tower.data.type === 'thousandhand') {
                const effectiveRange = tower.range + (tower.rangeBonus || 0);
                
                // Find enemies in range
                const validEnemies = enemies.filter(e => {
                    if (e.isPhasing || e.invincible) return false;
                    
                    const enemyRect = e.element.getBoundingClientRect();
                    const enemyX = enemyRect.left + enemyRect.width / 2;
                    const enemyY = enemyRect.top + enemyRect.height / 2;
                    const dist = Math.sqrt(Math.pow(enemyX - towerX, 2) + Math.pow(enemyY - towerY, 2));
                    
                    // Store distance for sorting
                    e._dist = dist;
                    
                    return dist <= effectiveRange;
                });

                if (validEnemies.length > 0) {
                    // Sort by proximity
                    validEnemies.sort((a, b) => a._dist - b._dist);
                    
                    // Select up to 4
                    const targets = validEnemies.slice(0, 4);
                    
                    // Fire 6 shots (0.1s interval)
                    for(let i=0; i<6; i++) {
                        const t = targets[i % targets.length];
                        setTimeout(() => { if(t && t.hp > 0) shoot(tower, t, towerX, towerY); }, i * 100);
                    }
                    tower.lastShot = now;
                }
                return; // Next tower
            }

            // Find target in range
            const target = enemies.find(e => {
                // [Special Ability] Dimensional Shifter: Stealth targets untargetable
                if (e.isPhasing) return false;
                
                // [Special Ability] Charon's Passenger: Boarded targets invincible
                if (e.invincible) return false;

                // [Class Characteristic] Soul Chainer & Ice Daoist: Ignore already slowed targets
                if ((tower.data.type === 'chainer' || tower.data.type === 'ice' || tower.data.type === 'absolutezero' || tower.data.type === 'permafrost') && e.isSlowed) {
                    return false;
                }

                // [Master] Void Sniper: Range ignore (Full map)
                if (tower.data.type === 'voidsniper') {
                    return true; // Candidate for targeting (Sorted later)
                }

                const enemyRect = e.element.getBoundingClientRect();
                const enemyX = enemyRect.left + enemyRect.width / 2;
                const enemyY = enemyRect.top + enemyRect.height / 2;
                
                const dist = Math.sqrt(Math.pow(enemyX - towerX, 2) + Math.pow(enemyY - towerY, 2));
                const effectiveRange = tower.range + (tower.rangeBonus || 0);
                
                // [Special Ability] Deceiving Seductress: Evasion on range entry
                if (dist <= effectiveRange && e.type === 'deceiver' && !e.hasBackstepped && !e.isSilenced) {
                    e.hasBackstepped = true;
                    // Dodge 20% width (Random direction)
                    const dodgeDir = Math.random() < 0.5 ? -20 : 20;
                    e.x = Math.max(10, Math.min(90, e.x + dodgeDir)); 
                    e.element.style.left = `${e.x}%`;
                    return false; // Targeting failed this tick
                }

                return dist <= effectiveRange;
            });

            // [Master] Void Sniper: Re-targeting (Target closest to gate = Largest Y)
            let finalTarget = target;
            if (tower.data.type === 'voidsniper') {
                const validEnemies = enemies.filter(e => !e.isPhasing && !e.invincible);
                if (validEnemies.length > 0) {
                    validEnemies.sort((a, b) => b.y - a.y); // Descending Y (Larger Y is bottom)
                    finalTarget = validEnemies[0];
                } else {
                    finalTarget = null;
                }
            }

            if (finalTarget && finalTarget.element.isConnected) {
                shoot(tower, finalTarget, towerX, towerY);
                tower.lastShot = now;
            }
        }
    });

    requestAnimationFrame(gameLoop);
}

// Projectile generation and damage processing
function shoot(tower, target, startX, startY) {
    const gameRect = gameContainer.getBoundingClientRect();
    const relStartX = startX - gameRect.left;
    const relStartY = startY - gameRect.top;

    const proj = document.createElement('div');
    proj.classList.add('projectile');
    
    // Projectile colors by class
    if (tower.data.type === 'chainer') proj.style.backgroundColor = '#9370db';
    else if (tower.data.type === 'talisman') proj.style.backgroundColor = '#ffa500';
    else if (tower.data.type === 'monk') proj.style.backgroundColor = '#a52a2a';
    else if (tower.data.type === 'archer') proj.style.backgroundColor = '#228b22';
    else if (tower.data.type === 'ice') proj.style.backgroundColor = '#00ffff';
    else if (tower.data.type === 'fire') proj.style.backgroundColor = '#ff4500';
    else if (tower.data.type === 'assassin') proj.style.backgroundColor = '#333333';
    else if (tower.data.type === 'tracker') proj.style.backgroundColor = '#ffffff';
    else if (tower.data.type === 'necromancer') proj.style.backgroundColor = '#8a2be2';
    else if (tower.data.type === 'guardian') proj.style.backgroundColor = '#ffd700';
    else if (tower.data.type === 'executor') proj.style.backgroundColor = '#483d8b';
    else if (tower.data.type === 'binder') proj.style.backgroundColor = '#8b008b';
    else if (tower.data.type === 'grandsealer') proj.style.backgroundColor = '#191970';
    else if (tower.data.type === 'flamemaster') proj.style.backgroundColor = '#ff4500';
    else if (tower.data.type === 'vajra') proj.style.backgroundColor = '#ffd700';
    else if (tower.data.type === 'saint') proj.style.backgroundColor = '#cd853f';
    else if (tower.data.type === 'absolutezero') proj.style.backgroundColor = '#00ffff';
    else if (tower.data.type === 'permafrost') proj.style.backgroundColor = '#f0ffff';
    else if (tower.data.type === 'hellfire') proj.style.backgroundColor = '#8b0000';
    else if (tower.data.type === 'phoenix') proj.style.backgroundColor = '#ff8c00';
    else if (tower.data.type === 'abyssal') proj.style.backgroundColor = '#4b0082';
    else if (tower.data.type === 'spatial') proj.style.backgroundColor = '#c0c0c0';
    else if (tower.data.type === 'wraithlord') proj.style.backgroundColor = '#00ff00';
    else if (tower.data.type === 'cursedshaman') proj.style.backgroundColor = '#483d8b';
    else if (tower.data.type === 'seer') proj.style.backgroundColor = '#9932cc';
    else if (tower.data.type === 'commander') proj.style.backgroundColor = '#dc143c';
    else if (tower.data.type === 'voidsniper') proj.style.backgroundColor = '#006400';
    else if (tower.data.type === 'thousandhand') proj.style.backgroundColor = '#32cd32';
    else if (tower.data.type === 'rampart') proj.style.backgroundColor = '#f5f5f5';
    else if (tower.data.type === 'judgment') proj.style.backgroundColor = '#daa520';

    proj.style.left = `${relStartX}px`;
    proj.style.top = `${relStartY}px`;
    gameContainer.appendChild(proj);

    // Transition to target position
    setTimeout(() => {
        if (target.element.isConnected) {
            const targetRect = target.element.getBoundingClientRect();
            const relTargetX = (targetRect.left + targetRect.width/2) - gameRect.left;
            const relTargetY = (targetRect.top + targetRect.height/2) - gameRect.top;
            
            proj.style.left = `${relTargetX}px`;
            proj.style.top = `${relTargetY}px`;
        } else {
            proj.remove(); 
        }
    }, 10);

    // Hit event (0.2s later)
    setTimeout(() => {
        proj.remove();
        
        // [Special Ability] Greedy Spirit: Chance to forcibly move attacking tower
        if (target.type === 'greedy' && Math.random() < 0.1 && !target.isSilenced) { // 10% chance (Silence immune)
            const validSlots = slots.filter(c => !c.classList.contains('occupied'));
            if (validSlots.length > 0) {
                const newSlot = validSlots[Math.floor(Math.random() * validSlots.length)];
                const oldSlot = tower.slotElement;
                const unitElement = tower.element;

                // Move DOM
                newSlot.appendChild(unitElement);
                
                // Update state
                oldSlot.classList.remove('occupied');
                newSlot.classList.add('occupied');
                tower.slotElement = newSlot;
            }
        }

        // [Special Ability] Burning Vengeance: Heal on hit
        if (target.type === 'burning') {
            target.hp += target.maxHp * 0.02; // 2% heal
            if (target.hp > target.maxHp) target.hp = target.maxHp;
        }

        // [Class Characteristic] Soul Chainer & Ice Daoist: Movement speed reduction (3s)
        if (tower.data.type === 'chainer' || tower.data.type === 'ice' || tower.data.type === 'absolutezero' || tower.data.type === 'permafrost') {
            if (!target.isSlowed) {
                target.isSlowed = true;
                if (target.element) target.element.classList.add('slowed');
                setTimeout(() => {
                    if (target && target.element) { 
                        target.isSlowed = false;
                        target.element.classList.remove('slowed');
                    }
                }, 3000);
            }
        }

        let isCritical = Math.random() < critChance;

        // [Class Characteristic] Mace Monk & Vajrapani: Knockback
        if (tower.data.type === 'monk' || tower.data.type === 'vajra') {
            let knockback = 30;
            
            // [Master] Vajrapani: Strong knockback on critical hit
            if (tower.data.type === 'vajra' && isCritical) {
                if (target.isBoss) {
                    knockback = 100; // Boss pushed back moderately
                } else {
                    knockback = 1000; // Normal enemies off-screen (Instakill)
                }
            }

            if (target.data && target.data.knockbackResist) {
                knockback *= (1 - target.data.knockbackResist);
            }
            target.y = Math.max(-100, target.y - knockback); 
            target.element.style.top = `${target.y}px`;
        }

        // [Class Characteristic] Fire Mage & Hellfire Alchemist: Apply burn (3s)
        if (tower.data.type === 'fire' || tower.data.type === 'hellfire') {
            target.isBurning = true;
            target.burnEndTime = Date.now() + 3000;
            if (tower.data.type === 'hellfire') target.isHellfireBurn = true; // Explosion trigger
            if (target.element) target.element.classList.add('burning');
        }

        // [Master] Underworld Executor: Forced return (10%)
        if (tower.data.type === 'executor' && Math.random() < 0.1 && !target.isBoss) {
            const roadHeight = road.offsetHeight;
            if (target.y > roadHeight * 0.5) {
                target.y = 0; // To start
                target.element.style.top = '0px';
                target.element.style.transition = 'none'; 
                setTimeout(() => target.element.style.transition = '', 50);
            }
        }

        // [Master] Soul Binder: Soul Link
        if (tower.data.type === 'binder') {
            // Link target and 4 nearby
            const nearby = enemies.filter(e => e !== target && !e.isBoss && e.hp > 0)
                .sort((a, b) => Math.abs(a.y - target.y) - Math.abs(b.y - target.y))
                .slice(0, 4);
            const linkId = Date.now() + Math.random();
            [target, ...nearby].forEach(e => {
                e.linkId = linkId;
                e.linkEndTime = Date.now() + 5000; // Duration 5s
                if(e.element) e.element.classList.add('soul-linked');
                setTimeout(() => { if(e.element) e.element.classList.remove('soul-linked'); }, 5000);
            });
        }

        // [Master] Saint of Vibration: AOE Stun
        if (tower.data.type === 'saint') {
            // Shockwave effect
            const shockwave = document.createElement('div');
            shockwave.style.position = 'absolute';
            shockwave.style.left = target.element ? target.element.style.left : `${target.x}%`;
            shockwave.style.top = target.element ? target.element.style.top : `${target.y}px`;
            shockwave.style.width = '100px'; shockwave.style.height = '100px';
            shockwave.style.border = '2px solid #cd853f'; shockwave.style.borderRadius = '50%';
            shockwave.style.transform = 'translate(-50%, -50%)';
            shockwave.style.zIndex = '19';
            gameContainer.appendChild(shockwave);
            setTimeout(() => shockwave.remove(), 200);

            const aoeTargets = enemies.filter(e => Math.abs(e.y - target.y) < 80 && Math.abs(e.x - target.x) < 20);
            aoeTargets.forEach(e => {
                e.isStunned = true;
                e.stunEndTime = Date.now() + 2000; // 2s stun
                if (e.element) e.element.classList.add('stunned');
                if (e !== target) applyDamage(e, tower.data.damage * 0.5, tower); // 50% DMG to surrounding
            });
        }

        // Damage processing
        let baseDmg = tower.data.damage + (tower.damageBonus || 0);
        
        // Handle temporary Acolyte debuff
        if (tower.acolyteDebuffTime && Date.now() > tower.acolyteDebuffTime) {
            tower.acolyteStacks = 0;
            tower.acolyteDebuffTime = 0;
            tower.element.style.boxShadow = '';
        }

        const acolyteDmgLoss = (tower.acolyteStacks || 0) * 4;
        const defiledDmgLoss = tower.defiledDebuff || 0;
        const slotCorruption = parseInt(tower.slotElement.dataset.corruption) || 0;
        
        let damage = Math.max(1, baseDmg - acolyteDmgLoss - defiledDmgLoss - slotCorruption);
        
        // Apply defense (Shadow Assassin series ignores)
        if (tower.data.type !== 'assassin' && tower.data.type !== 'abyssal' && tower.data.type !== 'spatial') {
            let defense = target.defense || 0;
            damage = Math.max(1, damage - defense);
        }

        damage *= damageMultiplier;

        // [Class Characteristic] Sanctuary Guardian: Instakill (5%)
        if (tower.data.type === 'guardian' && Math.random() < 0.05 && !target.isBoss) {
            damage = target.hp; // Full HP DMG
        }

        // Critical Hit calculation
        if (isCritical) {
            damage *= 2; // 2x DMG
            if (target.element) target.element.style.transform += " scale(1.2)";
            setTimeout(() => { if(target.element) target.element.style.transform = target.element.style.transform.replace(" scale(1.2)", ""); }, 100);
        }
        
        // [Master] Vajrapani: Instakill non-boss on crit
        if (tower.data.type === 'vajra' && isCritical && !target.isBoss) {
            damage = target.hp + 9999;
        }
        
        // [Master] Absolute Zero Mage: Instakill frozen targets below 30% HP
        if (tower.data.type === 'absolutezero' && target.isSlowed && target.hp < target.maxHp * 0.3 && !target.isBoss) {
            damage = target.hp + 9999;
        }

        applyDamage(target, damage, tower);

        // [Corruption Abilities] When hit by a tower, these enemies retaliate
        if (target.isCorrupted) {
            if (target.type === 'defiled_apprentice') {
                // 10% chance to curse attacker's damage (-3, No stack)
                if (Math.random() < 0.1 && !tower.defiledDebuff) {
                    tower.defiledDebuff = 3;
                    tower.element.style.filter = 'sepia(1) hue-rotate(300deg)'; // Reddish tint for curse
                }
            } else if (target.type === 'abyssal_acolyte') {
                // Reduces hit source's damage by 4 (Max 3 stacks, resets on hit, lasts 2s)
                if (!tower.acolyteDebuffTime || Date.now() > tower.acolyteDebuffTime) {
                    tower.acolyteStacks = 1;
                } else if (tower.acolyteStacks < 3) {
                    tower.acolyteStacks++;
                }
                tower.acolyteDebuffTime = Date.now() + 2000;
                tower.element.style.boxShadow = `0 0 ${tower.acolyteStacks * 10}px #4b0082`;
            }
        }

        // [Class Characteristic] Talismanist series: AOE and Zones
        if (tower.data.type === 'talisman' || tower.data.type === 'flamemaster' || tower.data.type === 'grandsealer') {
            const explosion = document.createElement('div');
            explosion.style.position = 'absolute';
            explosion.style.left = target.element ? target.element.style.left : `${target.x}%`; 
            explosion.style.top = target.element ? target.element.style.top : `${target.y}px`;
            explosion.style.width = '60px';
            explosion.style.height = '60px';
            explosion.style.background = 'radial-gradient(circle, rgba(255,165,0,0.8), transparent)';
            explosion.style.transform = 'translate(-50%, -50%)';
            explosion.style.pointerEvents = 'none';
            explosion.style.zIndex = '19';
            gameContainer.appendChild(explosion);
            setTimeout(() => explosion.remove(), 200);

            // Talismanist & Fire Talisman Master: Instant AOE DMG
            if (tower.data.type !== 'grandsealer') {
                const aoeTargets = enemies.filter(e => e !== target && Math.abs(e.y - target.y) < 50 && Math.abs(e.x - target.x) < 15);
                aoeTargets.forEach(e => {
                    applyDamage(e, damage * 0.5, tower);
                });
            }

            // [Master] Grand Sealer: Sealing Zone (4s)
            if (tower.data.type === 'grandsealer') {
                const zone = document.createElement('div');
                zone.classList.add('zone-seal');
                zone.style.width = '120px'; zone.style.height = '120px';
                zone.style.left = target.element ? target.element.style.left : `${target.x}%`;
                zone.style.top = target.element ? target.element.style.top : `${target.y}px`;
                road.appendChild(zone);
                
                groundEffects.push({
                    type: 'seal', element: zone,
                    x: (target.element ? parseFloat(target.element.style.left) / 100 * gameContainer.offsetWidth : (target.x / 100 * gameContainer.offsetWidth)),
                    y: (target.element ? parseFloat(target.element.style.top) : target.y),
                    radius: 60, endTime: Date.now() + 4000
                });
            }

            // [Master] Fire Talisman Master: Fire Zone (3s)
            if (tower.data.type === 'flamemaster') {
                const zone = document.createElement('div');
                zone.classList.add('zone-fire');
                zone.style.left = target.element ? target.element.style.left : `${target.x}%`;
                zone.style.top = target.element ? target.element.style.top : `${target.y}px`;
                road.appendChild(zone);
                
                groundEffects.push({
                    type: 'fire', element: zone,
                    x: (target.element ? parseFloat(target.element.style.left) / 100 * gameContainer.offsetWidth : (target.x / 100 * gameContainer.offsetWidth)),
                    y: (target.element ? parseFloat(target.element.style.top) : target.y),
                    radius: 40, endTime: Date.now() + 3000
                });
            }
        }

        // [Master] Ice Maiden: Blizzard Zone (3s)
        if (tower.data.type === 'permafrost') {
            const zone = document.createElement('div');
            zone.classList.add('zone-blizzard');
            zone.style.width = '120px'; zone.style.height = '120px';
            zone.style.left = target.element ? target.element.style.left : `${target.x}%`;
            zone.style.top = target.element ? target.element.style.top : `${target.y}px`;
            road.appendChild(zone);
            
            groundEffects.push({
                type: 'blizzard', element: zone,
                x: (target.element ? parseFloat(target.element.style.left) / 100 * gameContainer.offsetWidth : (target.x / 100 * gameContainer.offsetWidth)),
                y: (target.element ? parseFloat(target.element.style.top) : target.y),
                radius: 60, endTime: Date.now() + 3000
            });
        }

        // [Master] Phoenix Summoner: Path of Fire (3s)
        if (tower.data.type === 'phoenix') {
            const startX = parseFloat(proj.style.left) || 0;
            const startY = parseFloat(proj.style.top) || 0;
            
            const targetRect = target.element.getBoundingClientRect();
            const gameRect = gameContainer.getBoundingClientRect();
            const endX = (targetRect.left + targetRect.width/2) - gameRect.left;
            const endY = (targetRect.top + targetRect.height/2) - gameRect.top;

            const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const steps = Math.floor(dist / 30); // Fire every 30px

            for(let i=0; i<=steps; i++) {
                const t = i / steps;
                const x = startX + (endX - startX) * t;
                const y = startY + (endY - startY) * t;

                const zone = document.createElement('div');
                zone.classList.add('zone-fire');
                zone.style.left = `${x}px`;
                zone.style.top = `${y}px`;
                gameContainer.appendChild(zone); 
                
                groundEffects.push({
                    type: 'fire', element: zone,
                    x: x, y: y,
                    radius: 30, endTime: Date.now() + 3000
                });
            }
        }

        // [Master] Spatial Slasher: Clone Summon (15% chance)
        if (tower.data.type === 'spatial' && Math.random() < 0.15) {
            const validSlots = slots.filter(c => !c.classList.contains('occupied'));
            if (validSlots.length > 0) {
                const cloneSlot = validSlots[Math.floor(Math.random() * validSlots.length)];
                
                const cloneUnit = document.createElement('div');
                cloneUnit.classList.add('unit', 'spatial', 'clone');
                cloneSlot.appendChild(cloneUnit);
                cloneSlot.classList.add('occupied'); // Temp occupy

                const threat = enemies.filter(e => !e.isPhasing && !e.invincible && e.hp > 0)
                                      .sort((a, b) => b.y - a.y)[0];

                if (threat) {
                    const cloneRect = cloneSlot.getBoundingClientRect();
                    const cloneX = cloneRect.left + cloneRect.width / 2;
                    const cloneY = cloneRect.top + cloneRect.height / 2;
                    
                    const cloneTower = { data: tower.data, element: cloneUnit, slotElement: cloneSlot, range: 9999, cooldown: 0 };
                    shoot(cloneTower, threat, cloneX, cloneY);
                }

                // Remove clone after 0.5s
                setTimeout(() => {
                    cloneUnit.remove();
                    cloneSlot.classList.remove('occupied');
                }, 500);
            }
        }

        // [Master] Cursed Shaman: AOE Max HP Reduction Curse
        if (tower.data.type === 'cursedshaman') {
            const curseZone = document.createElement('div');
            curseZone.style.position = 'absolute';
            curseZone.style.left = target.element ? target.element.style.left : `${target.x}%`;
            curseZone.style.top = target.element ? target.element.style.top : `${target.y}px`;
            curseZone.style.width = '120px'; curseZone.style.height = '120px';
            curseZone.style.background = 'radial-gradient(circle, rgba(72, 61, 139, 0.6), transparent)';
            curseZone.style.transform = 'translate(-50%, -50%)';
            curseZone.style.zIndex = '19';
            gameContainer.appendChild(curseZone);
            setTimeout(() => curseZone.remove(), 300);

            const aoeTargets = enemies.filter(e => Math.abs(e.y - target.y) < 60 && Math.abs(e.x - target.x) < 15);
            aoeTargets.forEach(e => {
                if (!e.isCursed && !e.isBoss) { 
                    e.maxHp *= 0.7; // Max HP -30%
                    e.hp = Math.min(e.hp, e.maxHp); 
                    e.isCursed = true;
                    if (e.element) e.element.classList.add('cursed');
                }
            });
        }

        // [Master] Knight of Judgment: Holy DMG (15%)
        if (tower.data.type === 'judgment' && Math.random() < 0.15) {
            const flash = document.createElement('div');
            flash.classList.add('holy-flash');
            gameContainer.appendChild(flash);
            setTimeout(() => flash.remove(), 200);

            enemies.forEach(e => {
                if (e.hp > 0) applyDamage(e, tower.data.damage, tower);
            });
        }

        // [Class Characteristic] Necromancer: Wall Summon (30%)
        if (tower.data.type === 'necromancer' && Math.random() < 0.3) {
            const wall = document.createElement('div');
            wall.classList.add('spirit-wall');
            wall.style.left = target.element.style.left;
            wall.style.top = target.element.style.top;
            road.appendChild(wall);
            
            walls.push({
                element: wall,
                x: target.x, // % units
                y: target.y, // px units
                endTime: Date.now() + 1500 // 1.5s duration
            });
        }
    }, 200);
}

// Game Start
document.addEventListener('DOMContentLoaded', () => {
    gameContainer = document.getElementById('game-container');
    road = document.getElementById('road');
    initStage();
    initAllies();
    updateSummonButtonState();
    if (typeof updateGauges === 'function') {
        updateGauges();
    }
    gameLoop();
});
