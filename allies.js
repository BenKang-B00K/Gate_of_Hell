/* allies.js */

const towerCost = 50;
const jobChangeCost = 100; // Promotion cost
const masterJobCost = 200; // Master promotion cost
const maxTowers = 12; // Maximum summon count

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

    // Summon always starts as Apprentice Exorcist
    const selectedUnit = unitTypes[0];

    // Create unit visual element
    const unit = document.createElement('div');
    unit.classList.add('unit', selectedUnit.type);
    unit.title = selectedUnit.name; // Show name on hover
    unit.innerText = selectedUnit.icon; // Set icon
    unit.draggable = true; // Enable dragging

    // Unit drag start event
    unit.addEventListener('dragstart', function(e) {
        draggedUnit = this;
        e.dataTransfer.setData("type", "move-unit");
        e.dataTransfer.effectAllowed = "move";
    });

    // Unit click event (promotion menu & range display)
    unit.addEventListener('click', function(e) {
        e.stopPropagation();
        
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
    towers.push({
        data: selectedUnit, // Unit stats
        element: unit,
        slotElement: targetSlot, 
        range: selectedUnit.range,
        cooldown: selectedUnit.cooldown,
        lastShot: 0,
        spentSE: towerCost // Track spent SE
    });
    updateSummonButtonState();
}

// Unit information display function
let infoResetTimeout = null;

function showUnitInfo(tower) {
    const unitInfoDisplay = document.getElementById('unit-info');
    const data = tower.data;
    
    // Clear existing timeout
    if (infoResetTimeout) clearTimeout(infoResetTimeout);

    // 1. Title section (Name only)
    let titleHtml = `<div style="color: #ffd700; font-weight: bold; font-size: 13px; margin-bottom: 4px;">${data.name}</div>`;
    
    // 2. Buttons section
    let buttonsHtml = `<div id="info-buttons-container" style="margin-bottom: 6px; display: flex; flex-wrap: wrap; justify-content: center; gap: 4px;">`;

    // Add promotion button for Apprentice Exorcist
    if (data.type === 'apprentice') {
        const canAfford = money >= jobChangeCost;
        const btnClass = canAfford ? 'active' : 'locked';
        // 1st Promotion: Ascend
        buttonsHtml += `<span id="info-job-btn" class="job-btn ${btnClass}">Ascend</span>`;
    }

    // [Corruption] (Sell) button - only for Tier 1-3
    if (data.tier < 4) {
        buttonsHtml += `<span id="info-sell-btn" class="job-btn active">[Corrupt]</span>`;
    }
    
    buttonsHtml += `</div>`;

    // Abyss Promotion button
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

    let abyssType = null;
    let abyssBtnHtml = '';
    if (data.tier === 3) {
        abyssType = abyssMapping[data.type];
        if (abyssType) {
            const uData = unitTypes.find(u => u.type === abyssType);
            const canAfford = typeof corruptedShards !== 'undefined' && corruptedShards >= 50;
            const btnClass = canAfford ? 'active' : 'locked';
            // Abyss Promotion: Descent
            abyssBtnHtml = `<div style="margin-bottom: 6px;"><span id="info-abyss-btn" class="job-btn ${btnClass}">Descent to ${uData.name}</span></div>`;
        }
    }

    // Render basic info
    unitInfoDisplay.innerHTML = `
        ${titleHtml}
        ${buttonsHtml}
        ${abyssBtnHtml}
        <div style="font-size: 9px; color: #bbb;">ATK: ${data.damage} | Range: ${data.range} | CD: ${(data.cooldown/1000).toFixed(1)}s</div>
        <div style="color: #888; font-size: 9px; margin-top: 4px; line-height: 1.2;">${data.desc}</div>
    `;

    // Master class promotion buttons (Special handling as they are multiple)
    if (data.upgrades) {
        const canAfford = money >= masterJobCost;
        const btnClass = canAfford ? 'active' : 'locked';
        
        const upgradeContainer = document.createElement('div');
        upgradeContainer.className = "master-btn-container";
        upgradeContainer.style.marginBottom = "6px";
        
        data.upgrades.forEach((uType, idx) => {
            const uData = unitTypes.find(u => u.type === uType);
            const btn = document.createElement('div');
            btn.id = `master-btn-${idx}`;
            btn.className = `job-btn ${btnClass}`;
            // Master Promotion: Unleash
            btn.innerText = `Unleash ${uData.name}`;
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (money >= masterJobCost) {
                    performMasterJobChange(tower, uType);
                    showUnitInfo(tower);
                }
            });
            upgradeContainer.appendChild(btn);
        });
        
        // Insert after the buttons container
        const buttonsContainer = document.getElementById('info-buttons-container');
        buttonsContainer.after(upgradeContainer);
    }

    // Connect standard button events
    const jobBtn = document.getElementById('info-job-btn');
    if (jobBtn) {
        jobBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (money >= jobChangeCost) {
                performJobChange(tower.element);
                showUnitInfo(tower); // Refresh info
            }
        });
    }

    const sellBtn = document.getElementById('info-sell-btn');
    if (sellBtn) {
        sellBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm(`Do you want to corrupt this unit and return ${Math.floor(tower.spentSE * 0.7)} SE?`)) {
                sellTower(tower);
                resetUnitInfo();
            }
        });
    }

    const abyssBtn = document.getElementById('info-abyss-btn');
    if (abyssBtn && abyssType) {
        abyssBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof corruptedShards !== 'undefined' && corruptedShards >= 50) {
                performAbyssJobChange(tower, abyssType);
                showUnitInfo(tower);
            }
        });
    }

    // Auto-reset after 7 seconds
    infoResetTimeout = setTimeout(resetUnitInfo, 7000);
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

// Sell tower (Corruption)
function sellTower(tower) {
    const sellRefund = Math.floor(tower.spentSE * 0.7);
    money += sellRefund;
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
    
    const costDiv = towerCard.querySelector('div:last-child');
    if (!costDiv) return;
    
    if (towers.length >= maxTowers) {
        towerCard.classList.add('locked');
        costDiv.innerText = "MAX";
    } else if (money < towerCost) {
        towerCard.classList.add('locked');
        costDiv.innerText = "50 Energy"; // Changed from LACK to keep cost visible
    } else {
        towerCard.classList.remove('locked');
        costDiv.innerText = "50 Energy";
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
        const bonusText = bonus > 1 ? `DMG Bonus<br>+${((bonus - 1) * 100).toFixed(0)}%` : 'No Bonus<br>(Need 50)';
        const dispName = enemyNames[enemy.type] || enemy.type.toUpperCase();

        const item = document.createElement('div');
        item.className = 'bestiary-item';
        item.innerHTML = `
            <div class="specter-tooltip">
                <strong style="color:#ffd700;">[TRAIT]</strong><br>
                ${enemy.desc}
            </div>
            <div class="bestiary-icon enemy ${enemy.type}" style="position:static; transform:none; display:flex; justify-content:center; align-items:center;">${enemy.icon}</div>
            <div class="bestiary-info">
                <div class="bestiary-name">${dispName}</div>
                <div class="bestiary-stats">💀 ${kills} Kills</div>
                <div class="bestiary-bonus">${bonusText}</div>
            </div>
        `;
        bestiaryTab.appendChild(item);
    });
}

function renderPromotionTree() {
    const treeTab = document.getElementById('tree-tab');
    treeTab.innerHTML = '<h3 style="color:#ffd700; font-size:14px; text-align:center; margin-bottom:20px;">Unit Evolution Path</h3>';

    // Clear any leftover content
    const existingContainer = treeTab.querySelector('.tree-main-container');
    if (existingContainer) existingContainer.remove();

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
    treeContainer.style.gap = '15px';

    // Root: Apprentice
    const rootDiv = document.createElement('div');
    rootDiv.style.textAlign = 'center';
    const apprenticeData = unitTypes.find(u => u.type === 'apprentice');
    rootDiv.innerHTML = `<div class="unit-node tier1" style="display:inline-block;" title="${apprenticeData.desc}\nATK: ${apprenticeData.damage} | CD: ${apprenticeData.cooldown/1000}s">${apprenticeData.icon} Apprentice Exorcist</div>`;
    treeContainer.appendChild(rootDiv);

    const arrow = document.createElement('div');
    arrow.innerText = '↓';
    arrow.style.textAlign = 'center';
    treeContainer.appendChild(arrow);

    paths.forEach(p => {
        const pathRow = document.createElement('div');
        pathRow.style.display = 'flex';
        pathRow.style.alignItems = 'center';
        pathRow.style.justifyContent = 'center';
        pathRow.style.gap = '8px';
        pathRow.style.marginBottom = '5px';
        pathRow.style.borderBottom = '1px solid #333';
        pathRow.style.paddingBottom = '8px';

        // Tier 2
        const tier2 = document.createElement('div');
        tier2.className = 'unit-node tier2';
        tier2.style.minWidth = '70px';
        const t2Data = unitTypes.find(u => u.type === p.type);
        tier2.innerText = `${t2Data.icon} ${p.name}`;
        tier2.title = `${t2Data.desc}\nATK: ${t2Data.damage} | CD: ${t2Data.cooldown/1000}s`;
        
        const mArrow = document.createElement('div');
        mArrow.innerText = '→';
        mArrow.style.fontSize = '10px';

        // Tier 3 (Masters)
        const mastersDiv = document.createElement('div');
        mastersDiv.style.display = 'flex';
        mastersDiv.style.flexDirection = 'column';
        mastersDiv.style.gap = '3px';

        p.masters.forEach(m => {
            const mNode = document.createElement('div');
            mNode.className = 'unit-node tier3';
            mNode.style.minWidth = '90px';
            mNode.style.fontSize = '8px';
            const mData = unitTypes.find(u => u.type === m);
            if (mData) {
                mNode.innerText = `${mData.icon} ${mData.name}`;
                mNode.title = `${mData.desc}\nATK: ${mData.damage} | CD: ${mData.cooldown/1000}s`;
            } else {
                mNode.innerText = m;
            }
            mastersDiv.appendChild(mNode);
        });

        const aArrow = document.createElement('div');
        aArrow.innerText = '→';
        aArrow.style.fontSize = '10px';

        // Tier 4 (Abyss)
        const abyssNode = document.createElement('div');
        abyssNode.className = 'unit-node tier4';
        abyssNode.style.minWidth = '90px';
        abyssNode.style.fontSize = '8px';
        const aData = unitTypes.find(u => u.type === p.abyss);
        if (aData) {
            abyssNode.innerText = `${aData.icon} ${aData.name}`;
            abyssNode.title = `${aData.desc}\nATK: ${aData.damage} | CD: ${aData.cooldown/1000}s`;
        } else {
            abyssNode.innerText = p.abyss;
        }

        pathRow.appendChild(tier2);
        pathRow.appendChild(mArrow);
        pathRow.appendChild(mastersDiv);
        pathRow.appendChild(aArrow);
        pathRow.appendChild(abyssNode);
        treeContainer.appendChild(pathRow);
    });

    treeTab.appendChild(treeContainer);
}
