/* allies.js */

let towerCost = 40;
const jobChangeCost = 100; // Promotion cost
const masterJobCost = 200; // Master promotion cost
const maxTowers = 12; // Maximum summon count

// Track unlocked classes for Records
const unlockedUnits = new Set(['apprentice']);

function recordUnlock(type) {
    if (!unlockedUnits.has(type)) {
        unlockedUnits.add(type);
        const data = unitTypes.find(u => u.type === type);
        if (data && type !== 'apprentice') {
            alert(`🆕 NEW CLASS UNLOCKED!\n\n[${data.name}]\n${data.desc}`);
        }
    }
}

// Ally unit data
const unitTypes = [
    { type: 'apprentice', name: 'Apprentice Exorcist', tier: 1, icon: '🧑‍🎓', damage: 35, range: 120, cooldown: 1000, desc: "An apprentice with basic exorcism abilities." },
    { type: 'chainer', name: 'Soul Chainer', tier: 2, icon: '⛓️', damage: 15, range: 130, cooldown: 1000, desc: "Uses soul chains to slow down enemies.", upgrades: ['executor', 'binder'] },
    { type: 'talisman', name: 'Talismanist', tier: 2, icon: '📜', damage: 25, range: 120, cooldown: 1500, desc: "Throws exploding talismans to deal area damage.", upgrades: ['grandsealer', 'flamemaster'] },
    { type: 'monk', name: 'Mace Monk', tier: 2, icon: '⛪', damage: 40, range: 100, cooldown: 1200, desc: "Knocks back enemies with a powerful mace.", upgrades: ['vajra', 'saint'] },
    { type: 'archer', name: 'Divine Archer', tier: 2, icon: '🏹', damage: 80, range: 250, cooldown: 1500, desc: "Has the longest range and snipes single targets.", upgrades: ['voidsniper', 'thousandhand'] },
    { type: 'ice', name: 'Ice Daoist', tier: 2, icon: '❄️', damage: 20, range: 130, cooldown: 1000, desc: "Slows down ghosts with cold energy. (10% speed reduction)", upgrades: ['absolutezero', 'permafrost'] },
    { type: 'fire', name: 'Fire Mage', tier: 2, icon: '🔥', damage: 10, range: 120, cooldown: 1000, desc: "Burns ghosts to deal damage based on max HP per second.", upgrades: ['hellfire', 'phoenix'] },
    { type: 'assassin', name: 'Shadow Assassin', tier: 2, icon: '🗡️', damage: 20, range: 100, cooldown: 300, desc: "Attacks very quickly, ignoring enemy defense.", upgrades: ['abyssal', 'spatial'] },
    { type: 'tracker', name: 'Soul Tracker', tier: 2, icon: '👁️', damage: 10, range: 100, cooldown: 1000, desc: "Increases the range of nearby allies (up, down, left, right).", upgrades: ['seer', 'commander'] },
    { type: 'necromancer', name: 'Necromancer', tier: 2, icon: '🔮', damage: 30, range: 120, cooldown: 1200, desc: "Chance to summon spirit walls that block enemy paths.", upgrades: ['wraithlord', 'cursedshaman'] },
    { type: 'guardian', name: 'Sanctuary Guardian', tier: 2, icon: '🛡️', damage: 50, range: 120, cooldown: 1500, desc: "Chance to instantly kill enemies on hit.", upgrades: ['rampart', 'judgment'] },
    // Master Classes
    { type: 'executor', name: 'Underworld Executor', tier: 3, icon: '⚖️', damage: 40, range: 150, cooldown: 1000, desc: "[Master] 10% chance to return enemies near the gate to the starting point." },
    { type: 'binder', name: 'Soul Binder', tier: 3, icon: '🔗', damage: 30, range: 140, cooldown: 1000, desc: "[Master] Links up to 5 enemies to share 50% of damage taken." },
    { type: 'grandsealer', name: 'Grand Sealer', tier: 3, icon: '🛐', damage: 30, range: 130, cooldown: 1500, desc: "[Master] Attaches large talismans to neutralize enemy special abilities (stealth, teleport, etc.)." },
    { type: 'flamemaster', name: 'Fire Talisman Master', tier: 3, icon: '🌋', damage: 35, range: 130, cooldown: 1500, desc: "[Master] Leaves persistent flames where talismans explode to deal damage." },
    { type: 'vajra', name: 'Vajrapani', tier: 3, icon: '🔱', damage: 50, range: 100, cooldown: 1200, desc: "[Master] Knocks enemies off-screen on critical hit. (Bosses are knocked back)" },
    { type: 'saint', name: 'Saint of Vibration', tier: 3, icon: '🔔', damage: 45, range: 100, cooldown: 1500, desc: "[Master] Attacks stun enemies in a wide area." },
    { type: 'voidsniper', name: 'Void Sniper', tier: 3, icon: '🎯', damage: 120, range: 9999, cooldown: 2000, desc: "[Master] Prioritizes sniping the enemy closest to the gate regardless of distance." },
    { type: 'thousandhand', name: 'Thousand-Hand Archer', tier: 3, icon: '🍃', damage: 40, range: 250, cooldown: 1500, desc: "[Master] Fires 6 arrows at once to attack up to 4 enemies." },
    { type: 'absolutezero', name: 'Absolute Zero Mage', tier: 3, icon: '💎', damage: 30, range: 140, cooldown: 1000, desc: "[Master] Instantly kills frozen enemies with less than 30% HP." },
    { type: 'permafrost', name: 'Ice Maiden', tier: 3, icon: '🌬️', damage: 25, range: 140, cooldown: 1000, desc: "[Master] Creates a blizzard that reduces enemy speed by 50% in the area." },
    { type: 'hellfire', name: 'Hellfire Alchemist', tier: 3, icon: '🧪', damage: 20, range: 130, cooldown: 1000, desc: "[Master] Burning enemies explode on death, spreading the burn to nearby enemies." },
    { type: 'phoenix', name: 'Phoenix Summoner', tier: 3, icon: '🐦‍🔥', damage: 40, range: 180, cooldown: 2000, desc: "[Master] Summons a phoenix that leaves a trail of fire." },
    { type: 'abyssal', name: 'Abyssal Killer', tier: 3, icon: '🌑', damage: 30, range: 100, cooldown: 300, desc: "[Master] Increases soul energy gain from kills by 1.5x." },
    { type: 'spatial', name: 'Spatial Slasher', tier: 3, icon: '🌌', damage: 25, range: 120, cooldown: 300, desc: "[Master] Summons clones in empty slots to assassinate the most threatening enemies." },
    { type: 'seer', name: 'Seeker of Truth', tier: 3, icon: '🔭', damage: 15, range: 120, cooldown: 1000, desc: "[Master] Increases nearby allies' damage and detects stealthed enemies." },
    { type: 'commander', name: 'Battlefield Commander', tier: 3, icon: '🚩', damage: 15, range: 120, cooldown: 1000, desc: "[Master] Increases nearby allies' attack speed by 20%." },
    { type: 'wraithlord', name: 'Wraith Lord', tier: 3, icon: '🧟', damage: 40, range: 130, cooldown: 1200, desc: "[Master] Reanimates killed enemies as ally skeleton soldiers." },
    { type: 'cursedshaman', name: 'Cursed Shaman', tier: 3, icon: '🎭', damage: 20, range: 130, cooldown: 1500, desc: "[Master] Curses a wide area to permanently reduce enemies' maximum HP." },
    { type: 'rampart', name: 'Holy Rampart', tier: 3, icon: '🏰', damage: 40, range: 120, cooldown: 1500, desc: "[Master] When placed near the gate, returns enemies reaching the gate to the start (up to 5 times)." },
    { type: 'judgment', name: 'Knight of Judgment', tier: 3, icon: '⚔️', damage: 60, range: 130, cooldown: 1500, desc: "[Master] 15% chance to deal holy damage to all enemies on attack." },
    // Abyss Classes (Tier 4)
    { type: 'warden', name: 'Warden of the Abyss', tier: 4, icon: '🗝️', damage: 50, range: 200, cooldown: 15000, desc: "[Abyss] Pulls all ghosts to center for 5s, causing DOT." },
    { type: 'cursed_talisman', name: 'Cursed Sect', tier: 4, icon: '⛩️', damage: 45, range: 150, cooldown: 1500, desc: "[Abyss] Attacks mark enemies. They explode on death for Max HP damage." },
    { type: 'asura', name: 'Hell Crushing Asura', tier: 4, icon: '👹', damage: 30, range: 120, cooldown: 500, desc: "[Abyss] 12 strikes to 2 targets. Knocks them back to start." },
    { type: 'piercing_shadow', name: 'Soul Piercing Shadow', tier: 4, icon: '🌠', damage: 150, range: 9999, cooldown: 3000, desc: "[Abyss] Infinite range piercing arrow that ricochets." },
    { type: 'cocytus', name: 'Ruler of Cocytus', tier: 4, icon: '⏳', damage: 10, range: 200, cooldown: 30000, desc: "[Abyss] Freezes time for 10s. Damage accumulates and bursts 2x." },
    { type: 'purgatory', name: 'Eternal Purgatory Fire', tier: 4, icon: '🕯️', damage: 10, range: 150, cooldown: 1000, desc: "[Abyss] Turns its horizontal row into permanent hellfire (Slow & % DMG)." },
    { type: 'reaper', name: 'Nightmare Reaper', tier: 4, icon: '☠️', damage: 0, range: 0, cooldown: 5000, desc: "[Abyss] Hidden. Every 5s, instakills highest HP non-boss ghost for 3x Soul Energy." },
    { type: 'doom_guide', name: 'Guide of Doom', tier: 4, icon: '🛶', damage: 20, range: 150, cooldown: 1000, desc: "[Abyss] Inverts portal. Escaping ghosts give 90% Soul Energy instead of failing." },
    { type: 'forsaken_king', name: 'King of the Forsaken', tier: 4, icon: '👑', damage: 50, range: 150, cooldown: 1000, desc: "[Abyss] Spawns allied ghosts at stage start based on total Corrupted units." },
    { type: 'void_gatekeeper', name: 'Gatekeeper of the Void', tier: 4, icon: '🚪', damage: 0, range: 0, cooldown: 0, desc: "[Abyss] Cannot attack. Seals the portal until 30 ghosts gather." }
];

// Slot creation function
function createSlots(containerId, count) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Initialize slots (prevent duplicates)
    for (let i = 0; i < count; i++) {
        const cell = document.createElement('div');
        
        // Skip top 3 slots on each side (Row 1)
        if (i < 3) {
            container.appendChild(cell); // Empty div for the grid space
            continue;
        }

        cell.classList.add('card-slot');
        slots.push(cell);
        container.appendChild(cell);

        // Add drag and drop events
        cell.addEventListener('dragover', allowDrop);
        cell.addEventListener('drop', drop);
        cell.addEventListener('dragenter', dragEnter);
        cell.addEventListener('dragleave', dragLeave);
    }
}

function allowDrop(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    this.style.backgroundColor = 'rgba(0, 255, 255, 0.3)';
}

function dragLeave(e) {
    this.style.backgroundColor = '';
}

function drop(e) {
    e.preventDefault();
    this.style.backgroundColor = '';

    const type = e.dataTransfer.getData("type");
    
    // Handle unit movement
    if (type === "move-unit" && draggedUnit) {
        const oldSlot = draggedUnit.parentElement;
        const targetSlot = this;
        
        if (oldSlot === targetSlot) {
            draggedUnit = null;
            return;
        }
        
        if (targetSlot.classList.contains('occupied')) {
            // Swap units
            const targetUnit = targetSlot.querySelector('.unit');
            if (targetUnit) {
                oldSlot.appendChild(targetUnit);
                targetSlot.appendChild(draggedUnit);
                
                const draggedTower = towers.find(t => t.element === draggedUnit);
                const targetTower = towers.find(t => t.element === targetUnit);
                
                if (draggedTower) draggedTower.slotElement = targetSlot;
                if (targetTower) targetTower.slotElement = oldSlot;
            }
        } else {
            // Move to empty slot
            targetSlot.appendChild(draggedUnit);
            
            // Update state
            oldSlot.classList.remove('occupied');
            targetSlot.classList.add('occupied');
            
            // Update tower data
            const tower = towers.find(t => t.element === draggedUnit);
            if (tower) {
                tower.slotElement = targetSlot;
            }
        }
        
        draggedUnit = null;
    }
}

function summonTower(targetSlot) {
    // Consume resource
    money -= towerCost;
    if (typeof updateGauges === 'function') {
        updateGauges();
    }

    // Increase cost for next summon
    towerCost += 5;

    // Summon always starts as Apprentice Exorcist
    const selectedUnit = unitTypes[0];
    recordUnlock(selectedUnit.type);

    // Create unit visual element
    const unit = document.createElement('div');
    unit.classList.add('unit', selectedUnit.type);
    unit.title = selectedUnit.name; // Show name on hover
    unit.innerText = selectedUnit.icon; // Set icon
    unit.draggable = true; // Enable dragging

    // Cooldown overlay
    const cdOverlay = document.createElement('div');
    cdOverlay.className = 'cooldown-overlay';
    unit.appendChild(cdOverlay);

    // Unit drag start event
    unit.addEventListener('dragstart', function(e) {
        draggedUnit = this;
        e.dataTransfer.setData("type", "move-unit");
        e.dataTransfer.effectAllowed = "move";
    });

    // Unit click event (promotion menu & range display & selection)
    unit.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Handle selection
        document.querySelectorAll('.unit').forEach(u => u.classList.remove('selected'));
        this.classList.add('selected');

        // Display info
        const tower = towers.find(t => t.element === this);
        if (tower) {
            showUnitInfo(tower);
            showRangeIndicator(tower);
        }
    });
    
    targetSlot.appendChild(unit);
    targetSlot.classList.add('occupied');

    // Save tower data
    const tower = {
        data: selectedUnit, // Unit stats
        element: unit,
        slotElement: targetSlot, 
        range: selectedUnit.range,
        cooldown: selectedUnit.cooldown,
        lastShot: 0,
        spentSE: (towerCost - 5) // Track spent SE (before increase)
    };
    towers.push(tower);
    
    updateUnitOverlayButtons(tower);
    updateSummonButtonState();
}

// Unit information display function
let infoResetTimeout = null;

function showUnitInfo(tower) {
    const unitInfoDisplay = document.getElementById('unit-info');
    const data = tower.data;
    
    // Clear existing timeout
    if (infoResetTimeout) clearTimeout(infoResetTimeout);

    // 1. Title section
    let titleHtml = `<div style="color: #ffd700; font-weight: bold; font-size: 13px; margin-bottom: 4px;">${data.name}</div>`;
    
    // 2. Info/Description section (Buttons removed)
    let infoHtml = `<div style="font-size: 9px; color: #bbb; margin-bottom: 4px;">ATK: ${data.damage} | Range: ${data.range} | CD: ${(data.cooldown/1000).toFixed(1)}s</div>`;
    
    // Cost display for next tier
    let costHtml = '';
    if (data.type === 'apprentice') {
        costHtml = `<div style="font-size: 8px; color: #00ff00; margin-bottom: 4px;">↗️ Ascend: 100 SE</div>`;
    } else if (data.upgrades) {
        costHtml = `<div style="font-size: 8px; color: #ffd700; margin-bottom: 2px;">Unleash Master (200 SE):</div>`;
        data.upgrades.forEach((uType, idx) => {
            const uData = unitTypes.find(u => u.type === uType);
            costHtml += `<div style="font-size: 7.5px; color: #aaa;">\${idx === 0 ? '↖️ (Left)' : '↗️ (Right)'}: \${uData.name}</div>`;
        });
    } else if (data.tier === 3) {
        const abyssMapping = {
            'executor': 'warden', 'binder': 'warden',
            'grandsealer': 'cursed_talisman', 'flamemaster': 'cursed_talisman',
            'vajra': 'asura', 'saint': 'asura',
            'voidsniper': 'piercing_shadow', 'thousandhand': 'piercing_shadow',
            'absolutezero': 'cocytus', 'permafrost': 'cocytus',
            'hellfire': 'purgatory', 'phoenix': 'purgatory',
            'abyssal': 'reaper', 'spatial': 'reaper',
            'seer': 'doom_guide', 'commander': 'doom_guide',
            'wraithlord': 'forsaken_king', 'cursedshaman': 'forsaken_king',
            'rampart': 'void_gatekeeper', 'judgment': 'void_gatekeeper'
        };
        const abyssType = abyssMapping[data.type];
        if (abyssType) {
            const uData = unitTypes.find(u => u.type === abyssType);
            costHtml = `<div style="font-size: 8px; color: #9400d3; margin-top: 4px;">↖️ Descent: 50 Shards (${uData.name})</div>`;
        }
    }

    unitInfoDisplay.innerHTML = `
        ${titleHtml}
        ${costHtml}
        ${infoHtml}
        <div style="color: #888; font-size: 9px; margin-top: 2px; line-height: 1.2;">${data.desc}</div>
    `;

    // Auto-reset after 7 seconds
    infoResetTimeout = setTimeout(resetUnitInfo, 7000);
}

// Function to update direct action buttons on the unit
function updateUnitOverlayButtons(tower) {
    const unitElement = tower.element;
    const data = tower.data;

    // Clear existing overlay buttons
    const existingBtns = unitElement.querySelectorAll('.unit-overlay-btn');
    existingBtns.forEach(btn => btn.remove());

    // 1. Corruption (Sell) Button - 9 o'clock position (left)
    if (data.tier < 4) {
        const corruptBtn = document.createElement('div');
        corruptBtn.className = 'unit-overlay-btn corrupt-btn';
        corruptBtn.innerHTML = '💀';
        corruptBtn.title = `Corrupt (Sell for SE & Shards)`;
        corruptBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const shardCount = data.tier;
            const refund = Math.floor(tower.spentSE * 0.7);
            if (confirm(`Do you want to corrupt this unit?\n\nImmediate Gain:\n💰 ${refund} SE (70% Refund)\n\nUpon defeat:\n💠 ${shardCount} Corrupted Shard(s)`)) {
                sellTower(tower);
                resetUnitInfo();
            }
        });
        unitElement.appendChild(corruptBtn);
    }

    // 2. Promotion Buttons - Top positions
    if (data.type === 'apprentice') {
        // Ascend (Tier 1 -> 2)
        const promoteBtn = document.createElement('div');
        promoteBtn.className = 'unit-overlay-btn promote-btn';
        promoteBtn.innerHTML = '↗️';
        promoteBtn.title = `Ascend (100 SE)`;
        promoteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (money >= jobChangeCost) {
                performJobChange(unitElement);
                const updatedTower = towers.find(t => t.element === unitElement);
                if (updatedTower) {
                    showUnitInfo(updatedTower);
                    updateUnitOverlayButtons(updatedTower);
                }
            }
        });
        unitElement.appendChild(promoteBtn);
    } else if (data.upgrades) {
        // Unleash Master (Tier 2 -> 3) - Left and Right options
        data.upgrades.forEach((uType, idx) => {
            const uData = unitTypes.find(u => u.type === uType);
            const promoteBtn = document.createElement('div');
            promoteBtn.className = idx === 0 ? 'unit-overlay-btn promote-btn' : 'unit-overlay-btn promote-btn-right';
            promoteBtn.innerHTML = idx === 0 ? '↖️' : '↗️';
            promoteBtn.title = `Unleash ${uData.name} (200 SE)`;
            promoteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (money >= masterJobCost) {
                    performMasterJobChange(tower, uType);
                    showUnitInfo(tower);
                    updateUnitOverlayButtons(tower);
                }
            });
            unitElement.appendChild(promoteBtn);
        });
    } else if (data.tier === 3) {
        // Descent Abyss (Tier 3 -> 4)
        const abyssMapping = {
            'executor': 'warden', 'binder': 'warden',
            'grandsealer': 'cursed_talisman', 'flamemaster': 'cursed_talisman',
            'vajra': 'asura', 'saint': 'asura',
            'voidsniper': 'piercing_shadow', 'thousandhand': 'piercing_shadow',
            'absolutezero': 'cocytus', 'permafrost': 'cocytus',
            'hellfire': 'purgatory', 'phoenix': 'purgatory',
            'abyssal': 'reaper', 'spatial': 'reaper',
            'seer': 'doom_guide', 'commander': 'doom_guide',
            'wraithlord': 'forsaken_king', 'cursedshaman': 'forsaken_king',
            'rampart': 'void_gatekeeper', 'judgment': 'void_gatekeeper'
        };
        const abyssType = abyssMapping[data.type];
        if (abyssType) {
            const promoteBtn = document.createElement('div');
            promoteBtn.className = 'unit-overlay-btn promote-btn';
            promoteBtn.innerHTML = '↖️';
            promoteBtn.title = `Descent (50 Shards)`;
            promoteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof corruptedShards !== 'undefined' && corruptedShards >= 50) {
                    performAbyssJobChange(tower, abyssType);
                    showUnitInfo(tower);
                    updateUnitOverlayButtons(tower);
                }
            });
            unitElement.appendChild(promoteBtn);
        }
    }
}

function showRangeIndicator(tower) {
    // Remove existing indicators if any
    const existing = document.querySelectorAll('.range-indicator');
    existing.forEach(el => el.remove());

    const range = tower.range + (tower.rangeBonus || 0);
    if (range > 5000) return; // Don't show for infinite range

    const rect = tower.slotElement.getBoundingClientRect();
    const gameRect = gameContainer.getBoundingClientRect();
    
    const centerX = (rect.left + rect.width / 2) - gameRect.left;
    const centerY = (rect.top + rect.height / 2) - gameRect.top;

    const indicator = document.createElement('div');
    indicator.className = 'range-indicator';
    indicator.style.cssText = `
        position: absolute;
        left: ${centerX}px;
        top: ${centerY}px;
        width: ${range * 2}px;
        height: ${range * 2}px;
        border: 2px dashed rgba(0, 229, 255, 0.5);
        background: rgba(0, 229, 255, 0.05);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 100;
        animation: fadeInOut 1s forwards;
    `;
    
    gameContainer.appendChild(indicator);
    setTimeout(() => indicator.remove(), 1000);
}

function resetUnitInfo() {
    const unitInfoDisplay = document.getElementById('unit-info');
    if (unitInfoDisplay) {
        unitInfoDisplay.innerHTML = `
            <div style="color: #444; font-weight: bold; letter-spacing: 1px; font-size: 10px; line-height: 1.4;">
                GUARDIAN<br>
                of the<br>
                UNDERWORLD
            </div>`;
    }
}

function showEnemyInfo(enemyData) {
    const unitInfoDisplay = document.getElementById('unit-info');
    if (!unitInfoDisplay) return;

    // Clear existing timeout
    if (infoResetTimeout) clearTimeout(infoResetTimeout);

    // Enemy Name Mapping
    const enemyNames = {
        'normal': 'Whispering Soul',
        'tank': 'Ironclad Wraith',
        'runner': 'Haste-Cursed Shadow',
        'greedy': 'Gluttonous Poltergeist',
        'dimension': 'Void-Step Phantasm',
        'deceiver': 'Siren of Despair',
        'boar': 'Feral Revenant',
        'frost': 'Cocytus Drifter',
        'lightspeed': 'Ethereal Streak',
        'heavy': 'Grave-Bound Behemoth',
        'lava': 'Magma-Veined Terror',
        'burning': 'Eternal Zealot',
        'gold': 'Gilded Apparition'
    };

    const name = enemyData.name || enemyNames[enemyData.type] || enemyData.type.toUpperCase();
    const lore = enemyData.lore || "A lost soul wandering the abyss.";

    unitInfoDisplay.innerHTML = `
        <div style="color: #ff4500; font-weight: bold; font-size: 13px; margin-bottom: 4px;">${enemyData.icon} ${name}</div>
        <div style="font-size: 9px; color: #bbb; margin-bottom: 6px;">HP: ${Math.floor(enemyData.hp)} | DEF: ${enemyData.defense || 0}</div>
        <div style="color: #ddd; font-size: 9px; line-height: 1.3; font-style: italic; border-top: 1px solid #333; padding-top: 4px;">
            "${lore}"
        </div>
    `;

    // Auto-reset after 7 seconds
    infoResetTimeout = setTimeout(resetUnitInfo, 7000);
}

// Attach to window
window.showEnemyInfo = showEnemyInfo;

function resetUnitInfo() {
    const unitInfoDisplay = document.getElementById('unit-info');
    if (unitInfoDisplay) {
        unitInfoDisplay.innerHTML = `
            <div style="color: #444; font-weight: bold; letter-spacing: 1px; font-size: 10px; line-height: 1.4;">
                GUARDIAN<br>
                of the<br>
                UNDERWORLD
            </div>`;
    }
}

// Sell tower (Corruption)
function sellTower(tower) {
    const data = tower.data;
    const sellRefund = Math.floor(tower.spentSE * 0.7);
    money += sellRefund;

    // Dynamic Shard Return: Tier 1=1, Tier 2=2, Tier 3=3
    const shardRefund = data.tier;
    corruptedShards = Math.min(99, corruptedShards + shardRefund);

    if (typeof updateGauges === 'function') {
        updateGauges();
    }
    updateSummonButtonState();

    const slot = tower.slotElement;
    const unitElement = tower.element;

    // Release slot
    slot.classList.remove('occupied');
    unitElement.remove();

    // Remove from towers array
    const idx = towers.indexOf(tower);
    if (idx > -1) towers.splice(idx, 1);

    // Create [Corrupted Unit] (becomes an enemy)
    if (typeof window.spawnCorruptedEnemy === 'function') {
        window.spawnCorruptedEnemy(tower);
    }
}

// Perform job change
function performJobChange(unitElement) {
    if (money < jobChangeCost) {
        return;
    }
    
    money -= jobChangeCost;
    if (typeof updateGauges === 'function') {
        updateGauges();
    }
    updateSummonButtonState();
    
    // Random promotion (Random among Tier 2 classes)
    const advancedUnits = unitTypes.filter(u => u.tier === 2);
    const newType = advancedUnits[Math.floor(Math.random() * advancedUnits.length)];
    
    // Update unit
    unitElement.classList.remove('apprentice');
    unitElement.classList.add(newType.type);
    unitElement.title = newType.name;
    unitElement.innerText = newType.icon; // Update icon
    
    const cdOverlay = document.createElement('div');
    cdOverlay.className = 'cooldown-overlay';
    unitElement.appendChild(cdOverlay);

    recordUnlock(newType.type);
    const updatedTower = towers.find(t => t.element === unitElement);
    if (updatedTower) updateUnitOverlayButtons(updatedTower);
    
    // Update tower data
    const tower = towers.find(t => t.element === unitElement);
    if (tower) {
        tower.data = newType;
        tower.range = newType.range;
        tower.cooldown = newType.cooldown;
        tower.spentSE += jobChangeCost; // Add spent SE
    }
}

// Perform master job change
function performMasterJobChange(tower, newTypeStr) {
    money -= masterJobCost;
    if (typeof updateGauges === 'function') {
        updateGauges();
    }
    updateSummonButtonState();

    const newType = unitTypes.find(u => u.type === newTypeStr);
    const unitElement = tower.element;

    // Replace class
    unitElement.className = `unit ${newType.type}`; // Overwrite existing classes
    unitElement.title = newType.name;
    unitElement.innerText = newType.icon; // Update icon
    
    const cdOverlay = document.createElement('div');
    cdOverlay.className = 'cooldown-overlay';
    unitElement.appendChild(cdOverlay);

    recordUnlock(newType.type);
    updateUnitOverlayButtons(tower);

    // Update data
    tower.data = newType;
    tower.range = newType.range;
    tower.cooldown = newType.cooldown;
    tower.spentSE += masterJobCost; // Add spent SE

    // [Master] Holy Rampart: Initialize charges
    if (newType.type === 'rampart') {
        tower.charges = 5;
    }
    
    // Effect
    unitElement.style.transform = "scale(1.5)";
    setTimeout(() => unitElement.style.transform = "scale(1)", 300);
}

// Perform Abyss job change
function performAbyssJobChange(tower, newTypeStr) {
    if (typeof corruptedShards === 'undefined' || corruptedShards < 50) return;
    
    corruptedShards -= 50;
    if (typeof updateGauges === 'function') {
        updateGauges();
    }

    const newType = unitTypes.find(u => u.type === newTypeStr);
    const unitElement = tower.element;

    // Replace class
    unitElement.className = `unit abyss ${newType.type}`; 
    unitElement.title = newType.name;
    unitElement.innerText = newType.icon; // Update icon
    
    const cdOverlay = document.createElement('div');
    cdOverlay.className = 'cooldown-overlay';
    unitElement.appendChild(cdOverlay);

    recordUnlock(newType.type);
    updateUnitOverlayButtons(tower);

    // Update data
    tower.data = newType;
    tower.range = newType.range;
    tower.cooldown = newType.cooldown;

    // Visual effect
    unitElement.style.transform = "scale(1.8)";
    unitElement.style.boxShadow = "0 0 30px #9400d3";
    setTimeout(() => unitElement.style.transform = "scale(1)", 500);

    // Initializations for specific Abyss abilities
    if (newType.type === 'purgatory') {
        tower.hasCreatedRow = false;
    } else if (newType.type === 'reaper') {
        unitElement.style.opacity = 0.3; // Hidden appearance
    }
}

// Update summon button state
function updateSummonButtonState() {
    const towerCard = document.getElementById('tower-card');
    if (!towerCard) return;
    
    const nameDiv = towerCard.querySelector('div:first-child');
    const costDiv = towerCard.querySelector('div:last-child');
    if (!nameDiv || !costDiv) return;
    
    nameDiv.innerHTML = "Summon<br>Exorcist";

    if (towers.length >= maxTowers) {
        towerCard.classList.add('locked');
        costDiv.innerText = "MAX";
    } else if (money < towerCost) {
        towerCard.classList.add('locked');
        costDiv.innerText = `${towerCost} SE`;
    } else {
        towerCard.classList.remove('locked');
        costDiv.innerText = `${towerCost} SE`;
    }
}

// Attach to window for other scripts
window.updateSummonButtonState = updateSummonButtonState;

// Initialize allies
function initAllies() {
    const towerCard = document.getElementById('tower-card');
    towerCard.addEventListener('click', function() {
        if (money < towerCost) {
            return;
        }

        // Find available slots
        const validSlots = slots.filter(c => !c.classList.contains('occupied'));

        if (validSlots.length === 0) {
            alert("No more space available!");
            return;
        }

        // Select random slot and summon
        const targetSlot = validSlots[Math.floor(Math.random() * validSlots.length)];
        summonTower(targetSlot);
    });
    
    // Create 30 slots on each side (Total 60)
    slots.length = 0; // Initialize slots array
    createSlots('left-slots', 30);
    createSlots('right-slots', 30);

    initRecordsUI();

    // Deselect units when clicking background
    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.unit') && !e.target.closest('.unit-overlay-btn')) {
            document.querySelectorAll('.unit').forEach(u => u.classList.remove('selected'));
        }
    });
}

// --- Exorcism Records UI Logic ---
function initRecordsUI() {
    const recordsBtn = document.getElementById('records-btn');
    const recordsOverlay = document.getElementById('records-overlay');
    const closeBtn = document.getElementById('close-records');
    const tabBtns = document.querySelectorAll('.tab-btn');

    if (!recordsBtn) return;

    recordsBtn.addEventListener('click', () => {
        isPaused = true;
        recordsOverlay.style.display = 'flex';
        renderBestiary();
        renderPromotionTree();
    });

    closeBtn.addEventListener('click', () => {
        isPaused = false;
        recordsOverlay.style.display = 'none';
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = `${btn.dataset.tab}-tab`;
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function renderBestiary() {
    const bestiaryTab = document.getElementById('bestiary-tab');
    bestiaryTab.innerHTML = '';

    // Enemy Name Mapping
    const enemyNames = {
        'normal': 'Whispering Soul',
        'tank': 'Ironclad Wraith',
        'runner': 'Haste-Cursed Shadow',
        'greedy': 'Gluttonous Poltergeist',
        'dimension': 'Void-Step Phantasm',
        'deceiver': 'Siren of Despair',
        'boar': 'Feral Revenant',
        'frost': 'Cocytus Drifter',
        'lightspeed': 'Ethereal Streak',
        'heavy': 'Grave-Bound Behemoth',
        'lava': 'Magma-Veined Terror',
        'burning': 'Eternal Zealot',
        'gold': 'Gilded Apparition'
    };

    // Flatten enemy data
    const allEnemyTypes = [];
    Object.keys(enemyCategories).forEach(cat => {
        enemyCategories[cat].forEach(e => {
            allEnemyTypes.push(e);
        });
    });

    allEnemyTypes.forEach(enemy => {
        const kills = killCounts[enemy.type] || 0;
        const bonus = getBestiaryBonus(enemy.type);
        const bonusText = bonus > 1 ? `DMG +${((bonus - 1) * 100).toFixed(0)}%` : 'No Bonus';
        const dispName = enemyNames[enemy.type] || enemy.type.toUpperCase();

        const item = document.createElement('div');
        item.className = 'bestiary-item';
        item.innerHTML = `
            <div class="custom-tooltip specter">
                <strong style="color:#ffd700;">[Unique Trait]</strong><br>
                ${enemy.desc}
            </div>
            <div class="bestiary-icon enemy ${enemy.type}" style="position:static; transform:none; display:flex; justify-content:center; align-items:center;">${enemy.icon}</div>
            <div class="bestiary-info">
                <div class="bestiary-name">${dispName}</div>
                <div class="bestiary-stats">💀 ${kills} | ${bonusText}</div>
                <div class="bestiary-effectiveness" style="font-size: 7px; color: #ff4500; margin-top: 4px; border-top: 1px dotted #444; padding-top: 3px; line-height: 1.2;">
                    🎯 ${enemy.effectiveness || 'Standard'}
                </div>
            </div>
        `;
        bestiaryTab.appendChild(item);
    });
}

function renderPromotionTree() {
    const treeTab = document.getElementById('tree-tab');
    treeTab.innerHTML = ''; 

    const apprenticeData = unitTypes.find(u => u.type === 'apprentice');

    const paths = [
        { name: 'Soul Chainer', type: 'chainer', masters: ['executor', 'binder'], abyss: 'warden' },
        { name: 'Talismanist', type: 'talisman', masters: ['grandsealer', 'flamemaster'], abyss: 'cursed_talisman' },
        { name: 'Mace Monk', type: 'monk', masters: ['vajra', 'saint'], abyss: 'asura' },
        { name: 'Divine Archer', type: 'archer', masters: ['voidsniper', 'thousandhand'], abyss: 'piercing_shadow' },
        { name: 'Ice Daoist', type: 'ice', masters: ['absolutezero', 'permafrost'], abyss: 'cocytus' },
        { name: 'Fire Mage', type: 'fire', masters: ['hellfire', 'phoenix'], abyss: 'purgatory' },
        { name: 'Shadow Assassin', type: 'assassin', masters: ['abyssal', 'spatial'], abyss: 'reaper' },
        { name: 'Soul Tracker', type: 'tracker', masters: ['seer', 'commander'], abyss: 'doom_guide' },
        { name: 'Necromancer', type: 'necromancer', masters: ['wraithlord', 'cursedshaman'], abyss: 'forsaken_king' },
        { name: 'Sanctuary Guardian', type: 'guardian', masters: ['rampart', 'judgment'], abyss: 'void_gatekeeper' }
    ];

    const treeContainer = document.createElement('div');
    treeContainer.className = 'tree-main-container';
    treeContainer.style.display = 'flex';
    treeContainer.style.flexDirection = 'column';
    treeContainer.style.gap = '6px';

    paths.forEach(p => {
        const pathRow = document.createElement('div');
        // Adjusted grid columns: wider columns for full names
        pathRow.style.display = 'grid';
        pathRow.style.gridTemplateColumns = '70px 12px 85px 12px 105px 12px 105px';
        pathRow.style.alignItems = 'center';
        pathRow.style.justifyContent = 'center';
        pathRow.style.gap = '3px';
        pathRow.style.borderBottom = '1px solid #222';
        pathRow.style.paddingBottom = '4px';

        // 1. Tier 1 (Apprentice)
        const t1Node = document.createElement('div');
        const t1Unlocked = unlockedUnits.has('apprentice');
        t1Node.className = `unit-node tier1 ${t1Unlocked ? '' : 'locked'}`;
        t1Node.style.position = 'relative';
        t1Node.style.fontSize = '7px';
        t1Node.style.padding = '2px 4px';
        t1Node.style.minWidth = 'auto';
        t1Node.innerHTML = `
            <div class="custom-tooltip">
                <strong style="color:#00e5ff; font-size: 9px;">${apprenticeData.name}</strong><br>
                <span style="font-size: 8px;">${apprenticeData.desc}</span>
            </div>
            ${t1Unlocked ? apprenticeData.icon : '❓'} ${t1Unlocked ? 'Apprentice' : 'Locked'}`;

        // Arrow 1
        const arrow1 = document.createElement('div');
        arrow1.innerText = '→';
        arrow1.style.fontSize = '8px';
        arrow1.style.textAlign = 'center';

        // 2. Tier 2
        const t2Data = unitTypes.find(u => u.type === p.type);
        const t2Unlocked = unlockedUnits.has(p.type);
        const t2Node = document.createElement('div');
        t2Node.className = `unit-node tier2 ${t2Unlocked ? '' : 'locked'}`;
        t2Node.style.position = 'relative';
        t2Node.style.fontSize = '7px';
        t2Node.style.padding = '2px 4px';
        t2Node.style.minWidth = 'auto';
        t2Node.innerHTML = `
            <div class="custom-tooltip">
                <strong style="color:#9370db; font-size: 9px;">${t2Data.name}</strong><br>
                <span style="font-size: 8px;">${t2Data.desc}</span>
            </div>
            ${t2Unlocked ? t2Data.icon : '❓'} ${t2Unlocked ? p.name : 'Unknown'}`;
        
        // Arrow 2
        const arrow2 = document.createElement('div');
        arrow2.innerText = '→';
        arrow2.style.fontSize = '8px';
        arrow2.style.textAlign = 'center';

        // 3. Tier 3 (Masters)
        const mastersDiv = document.createElement('div');
        mastersDiv.style.display = 'flex';
        mastersDiv.style.flexDirection = 'column';
        mastersDiv.style.gap = '2px';

        p.masters.forEach(m => {
            const mData = unitTypes.find(u => u.type === m);
            const mUnlocked = unlockedUnits.has(m);
            const mNode = document.createElement('div');
            mNode.className = `unit-node tier3 ${mUnlocked ? '' : 'locked'}`;
            mNode.style.fontSize = '7px';
            mNode.style.position = 'relative';
            mNode.style.padding = '2px 4px';
            mNode.style.minWidth = 'auto';
            if (mData) {
                mNode.innerHTML = `
                    <div class="custom-tooltip">
                        <strong style="color:#ffd700; font-size: 9px;">${mData.name}</strong><br>
                        <span style="font-size: 8px;">${mData.desc}</span>
                    </div>
                    ${mUnlocked ? mData.icon : '❓'} ${mUnlocked ? mData.name : 'Master Locked'}`;
            } else {
                mNode.innerText = m;
            }
            mastersDiv.appendChild(mNode);
        });

        // Arrow 3
        const arrow3 = document.createElement('div');
        arrow3.innerText = '→';
        arrow3.style.fontSize = '8px';
        arrow3.style.textAlign = 'center';

        // 4. Tier 4 (Abyss)
        const aData = unitTypes.find(u => u.type === p.abyss);
        const aUnlocked = unlockedUnits.has(p.abyss);
        const abyssNode = document.createElement('div');
        abyssNode.className = `unit-node tier4 ${aUnlocked ? '' : 'locked'}`;
        abyssNode.style.fontSize = '7px';
        abyssNode.style.position = 'relative';
        abyssNode.style.padding = '2px 4px';
        abyssNode.style.minWidth = 'auto';
        if (aData) {
            abyssNode.innerHTML = `
                <div class="custom-tooltip" style="border-color:#9400d3;">
                    <strong style="color:#9400d3; font-size: 9px;">${aData.name}</strong><br>
                    <span style="font-size: 8px;">${aData.desc}</span>
                </div>
                ${aUnlocked ? aData.icon : '❓'} ${aUnlocked ? aData.name : 'Abyss Locked'}`;
        } else {
            abyssNode.innerText = p.abyss;
        }

        pathRow.appendChild(t1Node);
        pathRow.appendChild(arrow1);
        pathRow.appendChild(t2Node);
        pathRow.appendChild(arrow2);
        pathRow.appendChild(mastersDiv);
        pathRow.appendChild(arrow3);
        pathRow.appendChild(abyssNode);
        treeContainer.appendChild(pathRow);
    });

    treeTab.appendChild(treeContainer);
}
