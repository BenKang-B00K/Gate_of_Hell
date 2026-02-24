/* allies.js */

// Ally-related global variables
const towers = []; // Tower list
const slots = []; // Slot elements storage
let draggedUnit = null; // Currently dragged unit

const towerCost = 50;
const jobChangeCost = 100; // Promotion cost
const masterJobCost = 200; // Master promotion cost
const maxTowers = 12; // Maximum summon count

// Ally unit data
const unitTypes = [
    { type: 'apprentice', name: 'Apprentice Exorcist', tier: 1, damage: 35, range: 120, cooldown: 1000, desc: "An apprentice with basic exorcism abilities." },
    { type: 'chainer', name: 'Soul Chainer', tier: 2, damage: 15, range: 130, cooldown: 1000, desc: "Uses soul chains to slow down enemies.", upgrades: ['executor', 'binder'] },
    { type: 'talisman', name: 'Talismanist', tier: 2, damage: 25, range: 120, cooldown: 1500, desc: "Throws exploding talismans to deal area damage.", upgrades: ['grandsealer', 'flamemaster'] },
    { type: 'monk', name: 'Mace Monk', tier: 2, damage: 40, range: 100, cooldown: 1200, desc: "Knocks back enemies with a powerful mace.", upgrades: ['vajra', 'saint'] },
    { type: 'archer', name: 'Divine Archer', tier: 2, damage: 80, range: 250, cooldown: 1500, desc: "Has the longest range and snipes single targets.", upgrades: ['voidsniper', 'thousandhand'] },
    { type: 'ice', name: 'Ice Daoist', tier: 2, damage: 20, range: 130, cooldown: 1000, desc: "Slows down ghosts with cold energy. (10% speed reduction)", upgrades: ['absolutezero', 'permafrost'] },
    { type: 'fire', name: 'Fire Mage', tier: 2, damage: 10, range: 120, cooldown: 1000, desc: "Burns ghosts to deal damage based on max HP per second.", upgrades: ['hellfire', 'phoenix'] },
    { type: 'assassin', name: 'Shadow Assassin', tier: 2, damage: 20, range: 100, cooldown: 300, desc: "Attacks very quickly, ignoring enemy defense.", upgrades: ['abyssal', 'spatial'] },
    { type: 'tracker', name: 'Soul Tracker', tier: 2, damage: 10, range: 100, cooldown: 1000, desc: "Increases the range of nearby allies (up, down, left, right).", upgrades: ['seer', 'commander'] },
    { type: 'necromancer', name: 'Necromancer', tier: 2, damage: 30, range: 120, cooldown: 1200, desc: "Chance to summon spirit walls that block enemy paths.", upgrades: ['wraithlord', 'cursedshaman'] },
    { type: 'guardian', name: 'Sanctuary Guardian', tier: 2, damage: 50, range: 120, cooldown: 1500, desc: "Chance to instantly kill enemies on hit.", upgrades: ['rampart', 'judgment'] },
    // Master Classes
    { type: 'executor', name: 'Underworld Executor', tier: 3, damage: 40, range: 150, cooldown: 1000, desc: "[Master] 10% chance to return enemies near the gate to the starting point." },
    { type: 'binder', name: 'Soul Binder', tier: 3, damage: 30, range: 140, cooldown: 1000, desc: "[Master] Links up to 5 enemies to share 50% of damage taken." },
    { type: 'grandsealer', name: 'Grand Sealer', tier: 3, damage: 30, range: 130, cooldown: 1500, desc: "[Master] Attaches large talismans to neutralize enemy special abilities (stealth, teleport, etc.)." },
    { type: 'flamemaster', name: 'Fire Talisman Master', tier: 3, damage: 35, range: 130, cooldown: 1500, desc: "[Master] Leaves persistent flames where talismans explode to deal damage." },
    { type: 'vajra', name: 'Vajrapani', tier: 3, damage: 50, range: 100, cooldown: 1200, desc: "[Master] Knocks enemies off-screen on critical hit. (Bosses are knocked back)" },
    { type: 'saint', name: 'Saint of Vibration', tier: 3, damage: 45, range: 100, cooldown: 1500, desc: "[Master] Attacks stun enemies in a wide area." },
    { type: 'voidsniper', name: 'Void Sniper', tier: 3, damage: 120, range: 9999, cooldown: 2000, desc: "[Master] Prioritizes sniping the enemy closest to the gate regardless of distance." },
    { type: 'thousandhand', name: 'Thousand-Hand Archer', tier: 3, damage: 40, range: 250, cooldown: 1500, desc: "[Master] Fires 6 arrows at once to attack up to 4 enemies." },
    { type: 'absolutezero', name: 'Absolute Zero Mage', tier: 3, damage: 30, range: 140, cooldown: 1000, desc: "[Master] Instantly kills frozen enemies with less than 30% HP." },
    { type: 'permafrost', name: 'Ice Maiden', tier: 3, damage: 25, range: 140, cooldown: 1000, desc: "[Master] Creates a blizzard that reduces enemy speed by 50% in the area." },
    { type: 'hellfire', name: 'Hellfire Alchemist', tier: 3, damage: 20, range: 130, cooldown: 1000, desc: "[Master] Burning enemies explode on death, spreading the burn to nearby enemies." },
    { type: 'phoenix', name: 'Phoenix Summoner', tier: 3, damage: 40, range: 180, cooldown: 2000, desc: "[Master] Summons a phoenix that leaves a trail of fire." },
    { type: 'abyssal', name: 'Abyssal Killer', tier: 3, damage: 30, range: 100, cooldown: 300, desc: "[Master] Increases soul energy gain from kills by 1.5x." },
    { type: 'spatial', name: 'Spatial Slasher', tier: 3, damage: 25, range: 120, cooldown: 300, desc: "[Master] Summons clones in empty slots to assassinate the most threatening enemies." },
    { type: 'seer', name: 'Seeker of Truth', tier: 3, damage: 15, range: 120, cooldown: 1000, desc: "[Master] Increases nearby allies' damage and detects stealthed enemies." },
    { type: 'commander', name: 'Battlefield Commander', tier: 3, damage: 15, range: 120, cooldown: 1000, desc: "[Master] Increases nearby allies' attack speed by 20%." },
    { type: 'wraithlord', name: 'Wraith Lord', tier: 3, damage: 40, range: 130, cooldown: 1200, desc: "[Master] Reanimates killed enemies as ally skeleton soldiers." },
    { type: 'cursedshaman', name: 'Cursed Shaman', tier: 3, damage: 20, range: 130, cooldown: 1500, desc: "[Master] Curses a wide area to permanently reduce enemies' maximum HP." },
    { type: 'rampart', name: 'Holy Rampart', tier: 3, damage: 40, range: 120, cooldown: 1500, desc: "[Master] When placed near the gate, returns enemies reaching the gate to the start (up to 5 times)." },
    { type: 'judgment', name: 'Knight of Judgment', tier: 3, damage: 60, range: 130, cooldown: 1500, desc: "[Master] 15% chance to deal holy damage to all enemies on attack." }
];

// Slot creation function
function createSlots(containerId, count) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Initialize slots (prevent duplicates)
    for (let i = 0; i < count; i++) {
    const cell = document.createElement('div');
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
    const seDisplay = document.getElementById('se-display');
    // Consume resource
    money -= towerCost;
    seDisplay.innerText = money;

    // Summon always starts as Apprentice Exorcist
    const selectedUnit = unitTypes[0];

    // Create unit visual element
    const unit = document.createElement('div');
    unit.classList.add('unit', selectedUnit.type);
    unit.title = selectedUnit.name; // Show name on hover
    unit.draggable = true; // Enable dragging

    // Unit drag start event
    unit.addEventListener('dragstart', function(e) {
        draggedUnit = this;
        e.dataTransfer.setData("type", "move-unit");
        e.dataTransfer.effectAllowed = "move";
    });

    // Unit click event (promotion menu)
    unit.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Display info
        const tower = towers.find(t => t.element === this);
        if (tower) showUnitInfo(tower);
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
function showUnitInfo(tower) {
    const unitInfoDisplay = document.getElementById('unit-info');
    const data = tower.data;
    let titleHtml = `<span style="color: #ffd700; font-weight: bold;">${data.name}</span>`;

    // Add promotion button for Apprentice Exorcist
    if (data.type === 'apprentice') {
        const canAfford = money >= jobChangeCost;
        const btnClass = canAfford ? 'active' : 'locked';
        const btnText = canAfford ? `Promote (${jobChangeCost})` : `🔒 Not enough SE (${jobChangeCost})`;
        
        titleHtml += `<span id="info-job-btn" class="job-btn active" style="background: linear-gradient(to bottom, #4CAF50, #2E7D32);">${btnText}</span>`;
    } else if (data.upgrades) {
        // Master class promotion buttons
        const canAfford = money >= masterJobCost;
        const btnClass = canAfford ? 'active' : 'locked';
        
        let upgradeBtns = `<div class="master-btn-container">`;
        data.upgrades.forEach((uType, idx) => {
            const uData = unitTypes.find(u => u.type === uType);
            const btnId = `master-btn-${idx}`;
            upgradeBtns += `<div id="${btnId}" class="job-btn ${btnClass}" style="flex:1; margin:0 2px;" data-type="${uType}">
                ${uData.name}<br>(${masterJobCost})
            </div>`;
        });
        upgradeBtns += `</div>`;
        
        // Add buttons below description
        setTimeout(() => { // Add after DOM rendering
            const container = document.createElement('div');
            container.innerHTML = upgradeBtns;
            unitInfoDisplay.appendChild(container);

            // Connect events
            data.upgrades.forEach((uType, idx) => {
                const btn = document.getElementById(`master-btn-${idx}`);
                if (btn) {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        if (money >= masterJobCost) {
                            performMasterJobChange(tower, uType);
                            showUnitInfo(tower);
                        } else {
                            alert("Not enough soul energy!");
                        }
                    });
                }
            });
        }, 0);
    }

    // [Corruption] (Sell) button
    const sellRefund = Math.floor(tower.spentSE * 0.7);
    titleHtml += `<span id="info-sell-btn" class="job-btn active" style="background: linear-gradient(to bottom, #8b0000, #4a0000); margin-left: 5px;">[Corrupt] (+${sellRefund} SE)</span>`;

    unitInfoDisplay.innerHTML = `
        <div style="margin-bottom: 4px;">${titleHtml}</div>
        <div>ATK: ${data.damage} | Range: ${data.range} | CD: ${(data.cooldown/1000).toFixed(1)}s</div>
        <div style="color: #aaa; font-size: 11px; margin-top: 4px;">${data.desc}</div>
    `;

    // Connect button events
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
            sellTower(tower);
            unitInfoDisplay.innerHTML = "Select a unit to view information.";
        });
    }
}

// Sell tower (Corruption)
function sellTower(tower) {
    const sellRefund = Math.floor(tower.spentSE * 0.7);
    money += sellRefund;
    document.getElementById('se-display').innerText = money;
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
    spawnCorruptedEnemy(tower);
}

// Perform job change
function performJobChange(unitElement) {
    const seDisplay = document.getElementById('se-display');
    if (money < jobChangeCost) {
        alert("Not enough soul energy!");
        return;
    }
    
    money -= jobChangeCost;
    seDisplay.innerText = money;
    updateSummonButtonState();
    
    // Random promotion (Random among Tier 2 classes)
    const advancedUnits = unitTypes.filter(u => u.tier === 2);
    const newType = advancedUnits[Math.floor(Math.random() * advancedUnits.length)];
    
    // Update unit
    unitElement.classList.remove('apprentice');
    unitElement.classList.add(newType.type);
    unitElement.title = newType.name;
    
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
    const seDisplay = document.getElementById('se-display');
    money -= masterJobCost;
    seDisplay.innerText = money;
    updateSummonButtonState();

    const newType = unitTypes.find(u => u.type === newTypeStr);
    const unitElement = tower.element;

    // Replace class
    unitElement.className = `unit ${newType.type}`; // Overwrite existing classes
    unitElement.title = newType.name;

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

// Update summon button state
function updateSummonButtonState() {
    const towerCard = document.getElementById('tower-card');
    const costDiv = towerCard.querySelector('div:last-child');
    
    if (towers.length >= maxTowers) {
        towerCard.classList.add('locked');
        costDiv.innerText = "MAX";
    } else if (money < towerCost) {
        towerCard.classList.add('locked');
        costDiv.innerText = "LACK";
    } else {
        towerCard.classList.remove('locked');
        costDiv.innerText = "50 SE";
    }
}

// Initialize allies
function initAllies() {
    const towerCard = document.getElementById('tower-card');
    towerCard.addEventListener('click', function() {
        if (money < towerCost) {
            alert("Not enough soul energy!");
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
}
