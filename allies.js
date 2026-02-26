/* allies.js */

let towerCost = 30;
const jobChangeCost = 200; 
const maxTowers = 16; 

// Track unlocked classes for Records
// --- Persistence System ---
const unlockedUnits = new Set(['apprentice']);

function saveGameData() {
    const data = {
        unlockedUnits: Array.from(unlockedUnits),
        encounteredEnemies: Array.from(window.encounteredEnemies || [])
    };
    localStorage.setItem('gateOfHell_saveData', JSON.stringify(data));
}

function loadGameData() {
    const saved = localStorage.getItem('gateOfHell_saveData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.unlockedUnits) {
                data.unlockedUnits.forEach(u => unlockedUnits.add(u));
            }
            if (data.encounteredEnemies) {
                if (!window.encounteredEnemies) window.encounteredEnemies = new Set();
                data.encounteredEnemies.forEach(e => window.encounteredEnemies.add(e));
            }
        } catch (e) {
            console.error("Failed to load save data:", e);
        }
    }
}

// Initial load
loadGameData();

function recordUnlock(type, isEnemy = false) {
    const tutorialToggle = document.getElementById('tutorial-toggle');
    const isTutorialEnabled = tutorialToggle ? tutorialToggle.checked : true;
    
    if (isEnemy) {
        if (!window.encounteredEnemies) window.encounteredEnemies = new Set();
        if (window.encounteredEnemies.has(type)) return;
        window.encounteredEnemies.add(type);
        saveGameData();

        if (!isTutorialEnabled) return;

        let enemyData = null;
        for (const cat in enemyCategories) {
            const found = enemyCategories[cat].find(e => e.type === type);
            if (found) { enemyData = found; break; }
        }
        if (!enemyData) {
            for (const key in bossData) {
                if (bossData[key].type === type) { enemyData = bossData[key]; break; }
            }
        }
        if (!enemyData && typeof corruptedTypes !== 'undefined') {
            enemyData = corruptedTypes[type];
        }

        if (enemyData) {
            const modal = document.getElementById('unlock-modal');
            const header = document.getElementById('unlock-header');
            const icon = document.getElementById('unlock-icon');
            const name = document.getElementById('unlock-name');
            const desc = document.getElementById('unlock-desc');
            
            const enemyNames = {
                'normal': 'Whispering Soul', 'mist': 'Wandering Mist', 'memory': 'Faded Memory',
                'shade': 'Flickering Shade', 'tank': 'Ironclad Wraith', 'runner': 'Haste-Cursed Shadow',
                'greedy': 'Gluttonous Poltergeist', 'mimic': 'Mimic Soul', 'dimension': 'Void-Step Phantasm',
                'deceiver': 'Siren of Despair', 'boar': 'Feral Revenant', 'soul_eater': 'Soul Eater',
                'frost': 'Cocytus Drifter', 'lightspeed': 'Ethereal Streak', 'heavy': 'Grave-Bound Behemoth',
                'lava': 'Magma-Veined Terror', 'burning': 'Eternal Zealot', 'gold': 'Gilded Apparition',
                'defiled_apprentice': 'Defiled Apprentice', 'abyssal_acolyte': 'Abyssal Acolyte', 'bringer_of_doom': 'Bringer of Doom',
                'cursed_vajra': 'Cursed Vajra', 'void_piercer': 'Void-Piercing Shade', 'frost_outcast': 'Frost-Bitten Outcast',
                'ember_hatred': 'Embers of Hatred', 'betrayer_blade': "Betrayer's Blade"
            };

            if (modal && header && icon && name && desc) {
                header.innerText = `${enemyData.icon} NEW SPECTER ENCOUNTERED!`;
                header.style.color = "#ff4500";
                icon.innerText = enemyData.icon;
                const hpVal = Math.floor(enemyData.hp || 110);
                const fullName = enemyData.name || enemyNames[enemyData.type] || enemyData.type;
                name.innerHTML = `${fullName}<br><span style="font-size:10px; color:#aaa;">(HP: ${hpVal})</span>`;
                desc.innerText = enemyData.desc || enemyData.lore;
                modal.style.display = 'flex';
                isPaused = true;
            }
        }
        return;
    }

            if (!unlockedUnits.has(type)) {
                unlockedUnits.add(type);
                saveGameData();
    
                if (!isTutorialEnabled) return;

        const data = unitTypes.find(u => u.type === type);
        if (data && type !== 'apprentice') {
            const modal = document.getElementById('unlock-modal');
            const header = document.getElementById('unlock-header');
            const icon = document.getElementById('unlock-icon');
            const name = document.getElementById('unlock-name');
            const desc = document.getElementById('unlock-desc');
            
            if (modal && header && icon && name && desc) {
                header.innerText = "🆕 NEW CLASS UNLOCKED!";
                header.style.color = "#ffd700";
                icon.innerText = data.icon;
                name.innerText = data.name;
                desc.innerText = data.desc;
                modal.style.display = 'flex';
                isPaused = true;
            }
        }
    }
}

const unitTypes = [
    { type: 'apprentice', name: 'Apprentice Exorcist', role: 'Basic', tier: 1, icon: '🧙', damage: 35, range: 120, cooldown: 833, desc: "Fires a basic bolt of purified energy at a single target." },
    { type: 'chainer', name: 'Soul Chainer', role: 'Support', tier: 2, icon: '⛓️', damage: 15, range: 130, cooldown: 1000, desc: "Launches spiritual chains that damage and slow the target by 30%.", upgrades: ['executor', 'binder'] },
    { type: 'talisman', name: 'Talismanist', role: 'Attack', tier: 2, icon: '📜', damage: 25, range: 120, cooldown: 1500, desc: "Throws an explosive seal that deals area-of-effect damage on impact.", upgrades: ['grandsealer', 'flamemaster'] },
    { type: 'monk', name: 'Mace Monk', role: 'Support', tier: 2, icon: '⛪', damage: 40, range: 100, cooldown: 1200, desc: "Strikes with a heavy mace, knocking back spirits away from the gate.", upgrades: ['vajra', 'saint'] },
    { type: 'archer', name: 'Divine Archer', role: 'Attack', tier: 2, icon: '🏹', damage: 80, range: 250, cooldown: 1500, desc: "Shoots long-range precision arrows that ignore minor enemy defenses.", upgrades: ['voidsniper', 'thousandhand'] },
    { type: 'ice', name: 'Ice Daoist', role: 'Support', tier: 2, icon: '❄️', damage: 20, range: 130, cooldown: 1000, desc: "Casts a freezing spell that reduces enemy movement speed for 2 seconds.", upgrades: ['absolutezero', 'permafrost'] },
    { type: 'fire', name: 'Fire Mage', role: 'Attack', tier: 2, icon: '🔥', damage: 10, range: 120, cooldown: 1000, desc: "Ignites enemies, dealing 1% of their max HP as burn damage every second.", upgrades: ['hellfire', 'phoenix'] },
    { type: 'assassin', name: 'Shadow Assassin', role: 'Attack', tier: 2, icon: '🗡️', damage: 20, range: 100, cooldown: 300, desc: "Rapidly stabs with dual blades, bypassing all enemy defense points.", upgrades: ['abyssal', 'spatial'] },
    { type: 'tracker', name: 'Soul Tracker', role: 'Support', tier: 2, icon: '👁️', damage: 10, range: 100, cooldown: 1000, desc: "Projects a guiding light that expands the attack range of all nearby allies.", upgrades: ['seer', 'commander'] },
    { type: 'necromancer', name: 'Necromancer', role: 'Support', tier: 2, icon: '🔮', damage: 30, range: 120, cooldown: 1200, desc: "Summons a temporary wall of spectral energy to physically block ghosts.", upgrades: ['wraithlord', 'cursedshaman'] },
    { type: 'guardian', name: 'Sanctuary Guardian', role: 'Special', tier: 2, icon: '🛡️', damage: 50, range: 120, cooldown: 1500, desc: "Attacks with holy force, having a 5% chance to instantly banish the target.", upgrades: ['rampart', 'judgment'] },
    { type: 'alchemist', name: 'Exorcist Alchemist', role: 'Special', tier: 2, icon: '🧪', damage: 30, range: 110, cooldown: 1200, desc: "Transmutes enemy essence, with a 5% chance to gain 2 Soul Energy per hit.", upgrades: ['midas', 'philosopher'] },
    { type: 'mirror', name: 'Mirror Oracle', role: 'Special', tier: 2, icon: '🪞', damage: 25, range: 130, cooldown: 1500, desc: "Uses reflective magic to bounce 30% of hit damage onto another nearby enemy.", upgrades: ['illusion', 'reflection'] },
    { type: 'knight', name: 'Exorcist Knight', role: 'Attack', tier: 2, icon: '⚔️', damage: 45, range: 110, cooldown: 1000, desc: "Swings a blessed broadsword dealing balanced physical and holy damage.", upgrades: ['paladin', 'crusader'] },
    { type: 'paladin', name: 'Holy Paladin', role: 'Attack', tier: 3, icon: '⛪', damage: 55, range: 130, cooldown: 1000, desc: "Every 5th attack triggers a Divine Smite dealing 3x damage and stunning.", upgrades: ['eternal_wall'] },
    { type: 'crusader', name: 'Blood Crusader', role: 'Attack', tier: 3, icon: '🚩', damage: 80, range: 120, cooldown: 1500, desc: "Inflicts execution damage, dealing more pain as the enemy's HP gets lower.", upgrades: ['eternal_wall'] },
    { type: 'midas', name: 'Golden Midas', role: 'Special', tier: 3, icon: '💰', damage: 40, range: 120, cooldown: 1200, desc: "Coats strikes in gold, granting a massive 15 Soul Energy upon target kill.", upgrades: ['transmuter'] },
    { type: 'philosopher', name: 'Philosopher of Void', role: 'Special', tier: 3, icon: '💎', damage: 50, range: 130, cooldown: 1500, desc: "Each hit applies an acidic curse that permanently reduces enemy defense by 1.", upgrades: ['transmuter'] },
    { type: 'illusion', name: 'Illusion Weaver', role: 'Special', tier: 3, icon: '🎭', damage: 35, range: 140, cooldown: 1200, desc: "Strikes confuse the mind, with a 20% chance to make enemies wander aimlessly.", upgrades: ['oracle'] },
    { type: 'reflection', name: 'Reflection Master', role: 'Special', tier: 3, icon: '🪩', damage: 45, range: 150, cooldown: 1500, desc: "Fires crystalline shards that bounce between multiple enemies on impact.", upgrades: ['oracle'] },
    { type: 'executor', name: 'Underworld Executor', role: 'Special', tier: 3, icon: '⚖️', damage: 40, range: 150, cooldown: 1000, desc: "Swing the scales of fate, having a 10% chance to warp enemies back to start.", upgrades: ['warden'] },
    { type: 'binder', name: 'Soul Binder', role: 'Support', tier: 3, icon: '🔗', damage: 30, range: 140, cooldown: 1000, desc: "Links the souls of multiple enemies, making them share a portion of damage taken.", upgrades: ['warden'] },
    { type: 'grandsealer', name: 'Grand Sealer', role: 'Support', tier: 3, icon: '🛐', damage: 30, range: 130, cooldown: 1500, desc: "Fires sealing charms that neutralize the special abilities of hit enemies.", upgrades: ['cursed_talisman'] },
    { type: 'flamemaster', name: 'Fire Talisman Master', role: 'Attack', tier: 3, icon: '🌋', damage: 35, range: 130, cooldown: 1500, desc: "Leaves a persistent carpet of fire on the ground that deals continuous burn damage.", upgrades: ['cursed_talisman'] },
    { type: 'vajra', name: 'Vajrapani', role: 'Special', tier: 3, icon: '🔱', damage: 50, range: 100, cooldown: 1200, desc: "Crits with a divine trident, causing a massive knockback to all nearby enemies.", upgrades: ['asura'] },
    { type: 'saint', name: 'Saint of Vibration', role: 'Support', tier: 3, icon: '🔔', damage: 45, range: 100, cooldown: 1500, desc: "Strikes a holy bell, creating a shockwave that stuns all enemies in a small area.", upgrades: ['asura'] },
    { type: 'voidsniper', name: 'Void Sniper', role: 'Attack', tier: 3, icon: '🎯', damage: 120, range: 9999, cooldown: 2000, desc: "Fires a projectile that travels across the entire map to hit the enemy nearest to the gate.", upgrades: ['piercing_shadow'] },
    { type: 'thousandhand', name: 'Thousand-Hand Archer', role: 'Attack', tier: 3, icon: '🍃', damage: 40, range: 250, cooldown: 1500, desc: "Releases a volley of multiple arrows simultaneously at various targets.", upgrades: ['piercing_shadow'] },
    { type: 'absolutezero', name: 'Absolute Zero Mage', role: 'Special', tier: 3, icon: '💎', damage: 30, range: 140, cooldown: 1000, desc: "Attacks have a chance to instantly banish any frozen enemy below 20% HP.", upgrades: ['cocytus'] },
    { type: 'permafrost', name: 'Ice Maiden', role: 'Support', tier: 3, icon: '🌬️', damage: 25, range: 140, cooldown: 1000, desc: "Summons a persistent blizzard that significantly slows all enemies in a wide radius.", upgrades: ['cocytus'] },
    { type: 'hellfire', name: 'Hellfire Alchemist', role: 'Attack', tier: 3, icon: '🧪', damage: 20, range: 130, cooldown: 1000, desc: "Targets already on fire will explode upon death, damaging others nearby.", upgrades: ['purgatory'] },
    { type: 'phoenix', name: 'Phoenix Summoner', role: 'Attack', tier: 3, icon: '🐦‍🔥', damage: 40, range: 180, cooldown: 2000, desc: "Calls down a phoenix that leaves a trail of high-damage fire behind its target.", upgrades: ['purgatory'] },
    { type: 'abyssal', name: 'Abyssal Killer', role: 'Special', tier: 3, icon: '🌑', damage: 30, range: 100, cooldown: 300, desc: "Harvests souls with precision, granting 1.5x Soul Energy for every kill.", upgrades: ['reaper'] },
    { type: 'spatial', name: 'Spatial Slasher', role: 'Attack', tier: 3, icon: '🌌', damage: 25, range: 120, cooldown: 300, desc: "Summons spectral clones that mimic his attacks, hitting multiple enemies at once.", upgrades: ['reaper'] },
    { type: 'seer', name: 'Seeker of Truth', role: 'Support', tier: 3, icon: '🔭', damage: 15, range: 120, cooldown: 1000, desc: "Projects a revealing aura that exposes stealthed or phased enemies to all allies.", upgrades: ['doom_guide'] },
    { type: 'commander', name: 'Battlefield Commander', role: 'Support', tier: 3, icon: '🚩', damage: 15, range: 120, cooldown: 1000, desc: "Inspires nearby allies, increasing their attack speed by 20%.", upgrades: ['doom_guide'] },
    { type: 'wraithlord', name: 'Wraith Lord', role: 'Support', tier: 3, icon: '🧟', damage: 40, range: 130, cooldown: 1200, desc: "Each kill has a chance to resurrect the spirit as a friendly skeleton to fight for you.", upgrades: ['forsaken_king'] },
    { type: 'cursedshaman', name: 'Cursed Shaman', role: 'Support', tier: 3, icon: '🎭', damage: 20, range: 130, cooldown: 1500, desc: "Curses enemies, permanently reducing their Max HP by 5% each time they are hit.", upgrades: ['forsaken_king'] },
    { type: 'rampart', name: 'Holy Rampart', role: 'Support', tier: 3, icon: '🏰', damage: 40, range: 120, cooldown: 1500, desc: "Defends the portal, with a 100% chance to warp reaching enemies back to the start (5 charges).", upgrades: ['void_gatekeeper'] },
    { type: 'judgment', name: 'Knight of Judgment', role: 'Attack', tier: 3, icon: '⚔️', damage: 60, range: 130, cooldown: 1500, desc: "Calls down a holy light that deals area damage to all enemies around the target.", upgrades: ['void_gatekeeper'] },
    { type: 'transmuter', name: 'Void Transmuter', role: 'Special', tier: 4, icon: '⚛️', damage: 60, range: 140, cooldown: 1000, desc: "Completely transmutes spirits, granting 25 Soul Energy for every kill." },
    { type: 'oracle', name: 'Oracle of Eternity', role: 'Special', tier: 4, icon: '💠', damage: 70, range: 160, cooldown: 1200, desc: "Shoots cosmic projectiles that temporarily freeze enemy movement on impact." },
    { type: 'warden', name: 'Warden of the Abyss', role: 'Support', tier: 4, icon: '🗝️', damage: 100, range: 200, cooldown: 10000, desc: "Periodically opens a black hole that pulls all enemies on screen to the center." },
    { type: 'cursed_talisman', name: 'Cursed Sect', role: 'Attack', tier: 4, icon: '⛩️', damage: 80, range: 150, cooldown: 1200, desc: "Marks enemies for death; they explode with massive damage when their soul is extinguished." },
    { type: 'asura', name: 'Hell Crushing Asura', role: 'Attack', tier: 4, icon: '👹', damage: 60, range: 120, cooldown: 400, desc: "Unleashes a rapid flurry of 12 strikes in quick succession at nearby targets." },
    { type: 'piercing_shadow', name: 'Soul Piercing Shadow', role: 'Attack', tier: 4, icon: '🌠', damage: 300, range: 9999, cooldown: 2000, desc: "Fires a massive beam of light that pierces through all enemies in its path." },
    { type: 'cocytus', name: 'Ruler of Cocytus', role: 'Special', tier: 4, icon: '⏳', damage: 20, range: 200, cooldown: 20000, desc: "Ultimate ice magic that freezes time for all enemies on screen for 5 seconds." },
    { type: 'purgatory', name: 'Eternal Purgatory Fire', role: 'Attack', tier: 4, icon: '🕯️', damage: 20, range: 150, cooldown: 800, desc: "Ignites an entire row of the map, dealing permanent burn damage to anyone stepping there." },
    { type: 'reaper', name: 'Nightmare Reaper', role: 'Special', tier: 4, icon: '☠️', damage: 0, range: 0, cooldown: 3000, desc: "Immediately reaps the soul of the enemy with the highest current HP on the map." },
    { type: 'doom_guide', name: 'Guide of Doom', role: 'Special', tier: 4, icon: '🛶', damage: 40, range: 150, cooldown: 800, desc: "Purifies the gate; enemies reaching the portal actually restore 5% Portal Energy instead of damage." },
    { type: 'forsaken_king', name: 'King of the Forsaken', role: 'Support', tier: 4, icon: '👑', damage: 100, range: 150, cooldown: 1000, desc: "Summons friendly ghosts at the start of each stage to fight alongside your exorcists." },
    { type: 'void_gatekeeper', name: 'Gatekeeper of the Void', role: 'Support', tier: 4, icon: '🚪', damage: 0, range: 0, cooldown: 0, desc: "Passively seals the portal, reducing all incoming Portal Energy damage by 50%." },
    { type: 'eternal_wall', name: 'Guardian of Eternity', role: 'Support', tier: 4, icon: '🗿', damage: 150, range: 150, cooldown: 2000, desc: "Emits a powerful stabilizing aura that slows all enemies on the map by 80%." }
];

let isMovingUnit = false;

function executeMove(unit, targetSlot) {
    const oldSlot = unit.parentElement;
    if (oldSlot === targetSlot) { cancelMovement(); return; }
    if (targetSlot.classList.contains('occupied')) {
        const targetUnit = targetSlot.querySelector('.unit');
        if (targetUnit) {
            oldSlot.appendChild(targetUnit);
            targetSlot.appendChild(unit);
            const u1 = towers.find(t => t.element === unit);
            const u2 = towers.find(t => t.element === targetUnit);
            if (u1) u1.slotElement = targetSlot;
            if (u2) u2.slotElement = oldSlot;
        }
    } else {
        targetSlot.appendChild(unit);
        oldSlot.classList.remove('occupied');
        targetSlot.classList.add('occupied');
        const ud = towers.find(t => t.element === unit);
        if (ud) ud.slotElement = targetSlot;
    }
    cancelMovement();
}

function createSlots(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const cell = document.createElement('div');
        cell.classList.add('card-slot');
        
        // Store column index (0, 1, or 2). Columns are 3 wide.
        // For Left Slots: 0 is leftmost (outer), 2 is rightmost (inner)
        // For Right Slots: 0 is leftmost (inner), 2 is rightmost (outer)
        cell.dataset.col = i % 3;
        cell.dataset.area = containerId;

        slots.push(cell);
        container.appendChild(cell);
        cell.addEventListener('click', function() { if (isMovingUnit && draggedUnit) executeMove(draggedUnit, this); });
        cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('drag-over'); });
        cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
        cell.addEventListener('drop', e => { e.preventDefault(); cell.classList.remove('drag-over'); if (draggedUnit) executeMove(draggedUnit, cell); });
    }
}

function cancelMovement() { if (draggedUnit) draggedUnit.classList.remove('move-ready'); draggedUnit = null; isMovingUnit = false; }

function summonTower(targetSlot) {
    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, towerCost - reduction);

    money -= finalTowerCost;
    if (typeof updateGauges === 'function') updateGauges();
    towerCost = Math.min(200, towerCost + 5);
    const s = unitTypes[0];
    recordUnlock(s.type);
    const unit = document.createElement('div');
    unit.classList.add('unit', s.type);
    unit.title = s.name; unit.innerText = s.icon; unit.draggable = true;
    const cd = document.createElement('div');
    cd.className = 'cooldown-overlay'; cd.style.pointerEvents = 'none';
    unit.appendChild(cd);
    let ds;
    unit.addEventListener('dragstart', function() { 
        draggedUnit = this; 
        isMovingUnit = true; 
        this.classList.add('selected'); 
        const t = towers.find(x => x.element === this); 
        if(t){
            showUnitInfo(t); 
            showRangeIndicator(t);
            startInfoResetTimer();
        } 
    });
    unit.addEventListener('mousedown', function(e) { if(e.button!==0)return; ds=Date.now(); });
    unit.addEventListener('click', function(e) { 
        e.stopPropagation(); 
        if(Date.now()-ds<400) { 
            document.querySelectorAll('.unit').forEach(u=>u.classList.remove('selected')); 
            this.classList.add('selected'); 
            const t=towers.find(x=>x.element===this); 
            if(t){
                showUnitInfo(t); 
                showRangeIndicator(t);
                startInfoResetTimer(); // Ensure reset timer starts when unit is selected
            } 
        } 
    });
    targetSlot.appendChild(unit); targetSlot.classList.add('occupied');
    const tower = { data: s, element: unit, slotElement: targetSlot, range: s.range, cooldown: s.cooldown, lastShot: 0, spentSE: finalTowerCost - 5 };
    towers.push(tower); updateUnitOverlayButtons(tower); updateSummonButtonState();
}

let infoResetTimer = null;
let infoPanelLockedUntil = 0;

function startInfoResetTimer() {
    if (Date.now() < infoPanelLockedUntil) return;
    if (infoResetTimer) clearTimeout(infoResetTimer);
    infoResetTimer = setTimeout(() => {
        if (Date.now() < infoPanelLockedUntil) return;
        const d = document.getElementById('unit-info');
        if (d) d.innerHTML = '<div class="info-default-text">GUARDIANS<br><span style="font-size:10px; opacity:0.8;">of the</span><br>UNDERWORLD</div>';
        
        // Deselect units to hide overlay buttons
        document.querySelectorAll('.unit').forEach(u => u.classList.remove('selected'));
        // Hide range indicator if active
        const ri = document.getElementById('range-indicator');
        if (ri) ri.remove();
    }, 10000); // 10 seconds
}

function showRangeIndicator(tower) {
    // Remove existing indicator if any
    const existing = document.getElementById('range-indicator');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.id = 'range-indicator';
    indicator.className = 'range-indicator';
    
    // Calculate total range including bonuses
    const totalRange = tower.range + (tower.rangeBonus || 0);
    const size = totalRange * 2;
    
    indicator.style.width = `${size}px`;
    indicator.style.height = `${size}px`;
    
    // Position it centered on the unit's slot
    const slotRect = tower.slotElement.getBoundingClientRect();
    const gameRect = gameContainer.getBoundingClientRect();
    
    const centerX = (slotRect.left + slotRect.width / 2) - gameRect.left;
    const centerY = (slotRect.top + slotRect.height / 2) - gameRect.top;
    
    indicator.style.left = `${centerX}px`;
    indicator.style.top = `${centerY}px`;
    
    gameContainer.appendChild(indicator);
    
    // Auto-remove after some time
    setTimeout(() => {
        if (indicator.parentElement) indicator.remove();
    }, 3000);
}

function showUnitInfo(tower) {
    if (Date.now() < infoPanelLockedUntil) return;
    const d = document.getElementById('unit-info');
    const data = tower.data;
    let rc = '#ff4500'; if(data.role==='Basic') rc='#00ff00'; else if(data.role==='Support') rc='#00e5ff'; else if(data.role==='Special') rc='#ffd700';
    
    // Calculate display bonuses
    const rb = tower.rangeBonus || 0;
    const sb = Math.round((tower.speedBonus || 0) * 100);
    const db = Math.round((tower.damageBonus || 0) * 100);
    
    let bonusText = '';
    if (rb > 0) bonusText += `<span style="color:#00ff00; font-size:8px;"> +${rb} Range</span>`;
    if (sb > 0) bonusText += `<span style="color:#00ff00; font-size:8px;"> +${sb}% ATK SPD</span>`;
    if (sb < 0) bonusText += `<span style="color:#ff4444; font-size:8px;"> ${sb}% ATK SPD</span>`;
    if (db > 0) bonusText += `<span style="color:#00ff00; font-size:8px;"> +${db}% DMG</span>`;
    
    const finalDmg = Math.round(data.damage * damageMultiplier * (1.0 + (tower.damageBonus || 0)));
    
    let th = `<div style="color:#ffd700; font-weight:bold; font-size:13px; margin-bottom:2px;">${data.name}</div><div style="display:inline-block; background:${rc}; color:#000; padding:1px 4px; border-radius:3px; font-size:8px; font-weight:bold; margin-bottom:4px;">${data.role}</div>`;
    let ih = `<div style="font-size:9px; color:#bbb; margin-bottom:4px;">ATK: ${finalDmg} | Range: ${data.range}${rb > 0 ? '(+' + rb + ')' : ''} | CD: ${((tower.cooldown / (1.0 + (tower.speedBonus || 0))) / 1000).toFixed(1)}s</div>`;
    if (bonusText) th += `<div style="margin-bottom:4px;">${bonusText}</div>`;
    
    let ch = ''; 
    if(data.type==='apprentice') {
        ch = `
            <div style="font-size:8px; color:#ffd700; margin-bottom:4px; font-weight:bold;">Promotion Paths (200 SE):</div>
            <div style="font-size:10px; display:flex; gap:12px; justify-content:center; margin-bottom:6px;">
                <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Attack', true)" title="Ascend to Attack Path" style="background:#442222; border:1px solid #ff4500; color:#fff; border-radius:4px; cursor:pointer; padding:2px 6px;">⚔️</button>
                    <div style="font-size:7px; color:#ff4500;">Attack</div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Support', true)" title="Ascend to Support Path" style="background:#224444; border:1px solid #00e5ff; color:#fff; border-radius:4px; cursor:pointer; padding:2px 6px;">🪄</button>
                    <div style="font-size:7px; color:#00e5ff;">Support</div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Special', true)" title="Ascend to Special Path" style="background:#444422; border:1px solid #ffd700; color:#fff; border-radius:4px; cursor:pointer; padding:2px 6px;">💠</button>
                    <div style="font-size:7px; color:#ffd700;">Special</div>
                </div>
            </div>
        `;
    }
    else if(data.upgrades) { 
        const isToAbyssal = unitTypes.find(x=>x.type===data.upgrades[0]).tier === 4;
        const costLabel = isToAbyssal ? "Unleash Master (10 Shards):" : "Unleash Master (400 SE):";
        ch=`<div style="font-size:8px; color:#ffd700; margin-bottom:4px;">${costLabel}</div>
           <div style="display:flex; gap:10px; justify-content:center; margin-bottom:6px;">`; 
        data.upgrades.forEach((u,i)=>{
            const ud=unitTypes.find(x=>x.type===u); 
            const costTip = ud.tier === 4 ? "10 Shards" : "400 SE";
            ch+=`
                <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                    <button class="info-promo-btn" onclick="performMasterJobChange(null, '${u}', true)" title="Unleash ${ud.name} (${costTip})" style="background:#222; border:1px solid #aaa; color:#fff; border-radius:4px; cursor:pointer; padding:2px 8px; font-size:10px;">${i===0?'↖️':'↗️'}</button>
                    <div style="font-size:7px; color:#aaa; max-width:50px; text-align:center; line-height:1;">${ud.name}</div>
                </div>
            `;
        }); 
        ch+=`</div>`;
    }
    d.innerHTML = `${th}${ch}${ih}<div style="color:#888; font-size:9px; margin-top:2px; line-height:1.2;">${data.desc}</div>`;
    startInfoResetTimer();
}

function showEnemyInfo(enemy) {
    if (Date.now() < infoPanelLockedUntil) return;
    const d = document.getElementById('unit-info');
    const names = { 'normal': 'Whispering Soul', 'mist': 'Wandering Mist', 'memory': 'Faded Memory', 'shade': 'Flickering Shade', 'tank': 'Ironclad Wraith', 'runner': 'Haste-Cursed Shadow', 'greedy': 'Gluttonous Poltergeist', 'mimic': 'Mimic Soul', 'dimension': 'Void-Step Phantasm', 'deceiver': 'Siren of Despair', 'boar': 'Feral Revenant', 'soul_eater': 'Soul Eater', 'frost': 'Cocytus Drifter', 'lightspeed': 'Ethereal Streak', 'heavy': 'Grave-Bound Behemoth', 'lava': 'Magma-Veined Terror', 'burning': 'Eternal Zealot', 'gold': 'Gilded Apparition', 'defiled_apprentice': 'Defiled Apprentice', 'abyssal_acolyte': 'Abyssal Acolyte', 'bringer_of_doom': 'Bringer of Doom', 'cursed_vajra': 'Cursed Vajra', 'void_piercer': 'Void-Piercing Shade', 'frost_outcast': 'Frost-Bitten Outcast', 'ember_hatred': 'Embers of Hatred', 'betrayer_blade': "Betrayer's Blade", 'cerberus': 'Cerberus', 'charon': 'Charon', 'beelzebub': 'Beelzebub', 'lucifer': 'Lucifer' };
    
    const dispName = enemy.name || names[enemy.type] || enemy.type;
    const hp = Math.floor(enemy.hp);
    const maxHp = Math.floor(enemy.maxHp || hp);

    const bonus = typeof getBestiaryBonus === 'function' ? getBestiaryBonus(enemy.type) : 1;
    const bonusText = bonus > 1 ? `<div style="color: #00ff00; font-size: 8px; margin-bottom: 4px;">Bestiary Bonus: +${((bonus-1)*100).toFixed(0)}% DMG</div>` : '';

    d.innerHTML = `
        <div style="color: #ff4500; font-weight: bold; font-size: 13px; margin-bottom: 2px;">${dispName}</div>
        <div style="display:inline-block; background:#444; color:#fff; padding:1px 4px; border-radius:3px; font-size:8px; font-weight:bold; margin-bottom:4px;">SPECTER</div>
        ${bonusText}
        <div style="font-size: 9px; color: #ff0000; margin-bottom: 4px;">HP: ${hp} / ${maxHp}</div>
        <div style="color: #888; font-size: 9px; margin-top: 2px; line-height: 1.2;">${enemy.desc || 'A wandering soul from the abyss.'}</div>
    `;
    startInfoResetTimer();
}
window.showEnemyInfo = showEnemyInfo;

function showResourceInfo(type) {
    if (Date.now() < infoPanelLockedUntil) return;
    const d = document.getElementById('unit-info');
    if (type === 'se') {
        d.innerHTML = `
            <div style="color:#00e5ff; font-weight:bold; font-size:13px; margin-bottom:2px;">Soul Energy (SE)</div>
            <div style="display:inline-block; background:#008ba3; color:#fff; padding:1px 4px; border-radius:3px; font-size:8px; font-weight:bold; margin-bottom:4px;">ESSENCE</div>
            <div style="font-size:9px; color:#bbb; line-height:1.2;">Used to summon and promote exorcists. Obtained by defeating specters.</div>
            <div style="color:#555; font-size:8.5px; margin-top:6px; font-style:italic; line-height:1.2;">"The crystalline fragments of purified regrets, fueling the sacred arts of those who guard the living world."</div>
        `;
    } else if (type === 'shards') {
        d.innerHTML = `
            <div style="color:#ff4444; font-weight:bold; font-size:13px; margin-bottom:2px;">Corrupted Shards</div>
            <div style="display:inline-block; background:#8b0000; color:#fff; padding:1px 4px; border-radius:3px; font-size:8px; font-weight:bold; margin-bottom:4px;">CURSE</div>
            <div style="font-size:9px; color:#bbb; line-height:1.2;">Increases enemy HP and Speed as they accumulate. Obtained by corrupting (selling) your units.</div>
            <div style="color:#555; font-size:8.5px; margin-top:6px; font-style:italic; line-height:1.2;">"Echoes of betrayal left behind when an exorcist succumbs to the dark. The abyss hungers for more of its own kind."</div>
        `;
    } else if (type === 'purge') {
        d.innerHTML = `
            <div style="color:#9400d3; font-weight:bold; font-size:13px; margin-bottom:2px;">Purge Portal</div>
            <div style="display:inline-block; background:#4b0082; color:#fff; padding:1px 4px; border-radius:3px; font-size:8px; font-weight:bold; margin-bottom:4px;">SANCTIFICATION</div>
            <div style="font-size:9px; color:#bbb; line-height:1.2;">Instantly removes 50% of current Portal Energy accumulation. Costs 800 SE.</div>
            <div style="color:#555; font-size:8.5px; margin-top:6px; font-style:italic; line-height:1.2;">"A sacred ritual to cleanse the gate of encroaching spirits. It demands a heavy sacrifice of Soul Energy."</div>
        `;
    }
    startInfoResetTimer();
}
window.showResourceInfo = showResourceInfo;
window.startInfoResetTimer = startInfoResetTimer;

// Expose lock variable via getter/setter or directly
Object.defineProperty(window, 'infoPanelLockedUntil', {
    get: function() { return infoPanelLockedUntil; },
    set: function(val) { infoPanelLockedUntil = val; },
    configurable: true
});

function initAllies() {
    const tc = document.getElementById('tower-card');
    if(tc) {
        tc.addEventListener('click', () => { 
            if (towers.length >= maxTowers) {
                const warning = document.getElementById('max-units-warning');
                if (warning) {
                    warning.style.display = 'block';
                    setTimeout(() => { warning.style.display = 'none'; }, 1500);
                }
                return;
            }
            
            const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
            const finalTowerCost = Math.max(5, towerCost - reduction);

            if(money < finalTowerCost) return; 
            
            // Filter slots to only innermost and second innermost rows
            // Left area: col 1 and 2 (inner)
            // Right area: col 0 and 1 (inner)
            const vs = slots.filter(c => {
                if (c.classList.contains('occupied')) return false;
                const col = parseInt(c.dataset.col);
                const area = c.dataset.area;
                if (area === 'left-slots') return col >= 1;
                if (area === 'right-slots') return col <= 1;
                return false;
            });

            if(vs.length === 0) {
                // If inner slots are full, allow summoning anywhere available
                const fallbackVs = slots.filter(c => !c.classList.contains('occupied'));
                if (fallbackVs.length === 0) return;
                summonTower(fallbackVs[Math.floor(Math.random()*fallbackVs.length)]);
            } else {
                summonTower(vs[Math.floor(Math.random()*vs.length)]); 
            }
        });

        tc.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d && Date.now() >= infoPanelLockedUntil) {
                const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
                const finalTowerCost = Math.max(5, towerCost - reduction);
                d.innerHTML = `
                    <div style="color:#00ff00; font-weight:bold; font-size:13px; margin-bottom:2px;">🪄 Summon Exorcist</div>
                    <div style="display:inline-block; background:#006400; color:#fff; padding:1px 4px; border-radius:3px; font-size:8px; font-weight:bold; margin-bottom:4px;">SUMMON</div>
                    <div style="font-size:9px; color:#bbb; line-height:1.2;">Calls a basic Exorcist Apprentice to a random available slot. Base cost increases with each summon.</div>
                    <div style="color:#ffd700; font-size:9px; margin-top:4px;">Current Cost: ${finalTowerCost} SE</div>
                    <div style="color:#555; font-size:8.5px; margin-top:6px; font-style:italic; line-height:1.2;">"To stand against the night, one must first call upon those who do not fear the dark."</div>
                `;
            }
        });
    }
    const pc = document.getElementById('purge-card'); 
    if(pc) {
        pc.addEventListener('click', () => purgePortal());
        pc.addEventListener('mouseenter', () => showResourceInfo('purge'));
    }
    
    // Resource Label Events
    const sel = document.getElementById('se-label');
    if(sel) sel.addEventListener('mouseenter', () => showResourceInfo('se'));
    const shl = document.getElementById('shards-label');
    if(shl) shl.addEventListener('mouseenter', () => showResourceInfo('shards'));

    const sdh = document.getElementById('stage-debuff-header');
    if(sdh) {
        sdh.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d && Date.now() >= infoPanelLockedUntil) {
                d.innerHTML = `
                    <div style="color:#ff0000; font-weight:bold; font-size:13px; margin-bottom:2px;">Stage Debuff</div>
                    <div style="display:inline-block; background:#8b0000; color:#fff; padding:1px 4px; border-radius:3px; font-size:8px; font-weight:bold; margin-bottom:4px;">ENVIRONMENTAL CURSE</div>
                    <div style="font-size:9px; color:#bbb; line-height:1.2;">Every stage may carry a unique curse that hinders your exorcists or empowers the specters.</div>
                    <div style="color:#ff4500; font-size:8px; margin-top:4px;">* Check the active debuff description below the gauges.</div>
                    <div style="color:#555; font-size:8.5px; margin-top:6px; font-style:italic; line-height:1.2;">"The very air of the abyss is thick with the regrets of the dead, choking the will of the living."</div>
                `;
            }
        });
    }

    slots.length = 0; 
    createSlots('left-slots', 24); 
    createSlots('right-slots', 24);
    
    initRecordsUI(); 
    initTutorial();
    
    const modal = document.getElementById('unlock-modal'); 
    if(modal) modal.addEventListener('click', () => { modal.style.display='none'; isPaused=false; });
    
    const retry = document.getElementById('retry-btn'); 
    if(retry) retry.addEventListener('click', () => location.reload());
    
    const rbt = document.getElementById('restart-btn-top'); 
    if(rbt) rbt.addEventListener('click', () => { 
        isPaused=true; 
        const go=document.getElementById('game-over-overlay'); 
        if(go) go.style.display='flex'; 
    });
}

function initRecordsUI() {
        const rb = document.getElementById('records-btn'); const ro = document.getElementById('records-overlay');
        if(rb && ro) {
            rb.addEventListener('click', () => { isPaused = true; ro.style.display = 'flex'; renderBestiary(); });
            rb.addEventListener('mouseenter', () => {
                const d = document.getElementById('unit-info');
                if (d && Date.now() >= infoPanelLockedUntil) {
                    d.innerHTML = `
                        <div style="color:#ffd700; font-weight:bold; font-size:13px; margin-bottom:2px;">Exorcism Records</div>
                        <div style="display:inline-block; background:#8b6b00; color:#fff; padding:1px 4px; border-radius:3px; font-size:8px; font-weight:bold; margin-bottom:4px;">ARCHIVES</div>
                        <div style="font-size:9px; color:#bbb; line-height:1.2;">Contains the Bestiary of all encountered specters and the Ascendency Tree of your exorcists.</div>
                        <div style="color:#00ff00; font-size:8px; margin-top:4px;">* Bestiary bonuses increase damage against known specters.</div>
                        <div style="color:#555; font-size:8.5px; margin-top:6px; font-style:italic; line-height:1.2;">"To defeat your enemy, you must first know their name, their sin, and their sorrow."</div>
                    `;
                }
            });
        }
    const cr = document.getElementById('close-records'); if(cr) cr.addEventListener('click', () => { ro.style.display='none'; isPaused=false; });
    document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active')); this.classList.add('active');
        document.querySelectorAll('.tab-pane').forEach(x=>x.classList.remove('active')); document.getElementById(`${this.dataset.tab}-tab`).classList.add('active');
        if(this.dataset.tab==='bestiary') renderBestiary(); else renderPromotionTree();
    }));
}

function initTutorial() {
    const t = document.getElementById('tutorial-toggle'); const s = document.getElementById('tutorial-status');
    if(t && s) { t.addEventListener('change', () => s.innerText=t.checked?'ON':'OFF'); s.innerText=t.checked?'ON':'OFF'; }
}

function renderBestiary() {
    const bt = document.getElementById('bestiary-tab'); bt.innerHTML = '';
    const names = { 'normal': 'Whispering Soul', 'mist': 'Wandering Mist', 'memory': 'Faded Memory', 'shade': 'Flickering Shade', 'tank': 'Ironclad Wraith', 'runner': 'Haste-Cursed Shadow', 'greedy': 'Gluttonous Poltergeist', 'mimic': 'Mimic Soul', 'dimension': 'Void-Step Phantasm', 'deceiver': 'Siren of Despair', 'boar': 'Feral Revenant', 'soul_eater': 'Soul Eater', 'frost': 'Cocytus Drifter', 'lightspeed': 'Ethereal Streak', 'heavy': 'Grave-Bound Behemoth', 'lava': 'Magma-Veined Terror', 'burning': 'Eternal Zealot', 'gold': 'Gilded Apparition', 'defiled_apprentice': 'Defiled Apprentice', 'abyssal_acolyte': 'Abyssal Acolyte', 'bringer_of_doom': 'Bringer of Doom', 'cursed_vajra': 'Cursed Vajra', 'void_piercer': 'Void-Piercing Shade', 'frost_outcast': 'Frost-Bitten Outcast', 'ember_hatred': 'Embers of Hatred', 'betrayer_blade': "Betrayer's Blade", 'cerberus': 'Cerberus', 'charon': 'Charon', 'beelzebub': 'Beelzebub', 'lucifer': 'Lucifer' };
    const groups = [
        { h: 'Basic Specters', c: '#00e5ff', types: ['normal', 'mist', 'memory', 'shade', 'tank', 'runner'] },
        { h: 'Specialized Wraiths', c: '#ff00ff', types: ['greedy', 'mimic', 'dimension', 'deceiver', 'boar', 'soul_eater', 'frost', 'lightspeed', 'heavy', 'lava', 'burning'] },
        { h: 'Treasure Specters', c: '#ffd700', types: ['gold'] },
        { h: 'Corrupted Specters', c: '#ff0000', types: ['defiled_apprentice', 'abyssal_acolyte', 'bringer_of_doom', 'cursed_vajra', 'void_piercer', 'frost_outcast', 'ember_hatred', 'betrayer_blade'] },
        { h: 'Abyss Bosses', c: '#8b0000', types: ['cerberus', 'charon', 'beelzebub', 'lucifer'] }
    ];
    const corruptInfo = {
        'defiled_apprentice': 'Apprentice',
        'cursed_vajra': 'Monk Path',
        'void_piercer': 'Archer Path',
        'frost_outcast': 'Ice Path',
        'ember_hatred': 'Fire Path',
        'betrayer_blade': 'Assassin Path',
        'abyssal_acolyte': 'Any Tier 3+',
        'bringer_of_doom': 'Any Tier 4'
    };
    const corruptTriggerMap = {
        'defiled_apprentice': ['apprentice'],
        'cursed_vajra': ['monk', 'vajra', 'saint', 'asura'],
        'void_piercer': ['archer', 'voidsniper', 'thousandhand', 'piercing_shadow'],
        'frost_outcast': ['ice', 'absolutezero', 'permafrost', 'cocytus'],
        'ember_hatred': ['fire', 'hellfire', 'phoenix', 'purgatory'],
        'betrayer_blade': ['assassin', 'abyssal', 'spatial', 'reaper'],
        'abyssal_acolyte': ['executor', 'binder', 'grandsealer', 'flamemaster', 'vajra', 'saint', 'voidsniper', 'thousandhand', 'absolutezero', 'permafrost', 'hellfire', 'phoenix', 'abyssal', 'spatial', 'seer', 'commander', 'wraithlord', 'cursedshaman', 'rampart', 'judgment', 'paladin', 'crusader', 'midas', 'philosopher', 'illusion', 'reflection'],
        'bringer_of_doom': ['warden', 'cursed_talisman', 'asura', 'piercing_shadow', 'cocytus', 'purgatory', 'reaper', 'doom_guide', 'forsaken_king', 'void_gatekeeper', 'eternal_wall', 'transmuter', 'oracle']
    };

    groups.forEach(g => {
        const h = document.createElement('h3'); h.innerText=g.h; h.style.cssText=`grid-column:1/-1; color:${g.c}; border-bottom:1px solid #333; margin:15px 0 8px 0; font-size:14px;`; bt.appendChild(h);
        
        g.types.forEach(t => {
            let isKnown = false;
            if (g.h === 'Basic Specters') {
                isKnown = true; 
            } else if (g.h === 'Corrupted Specters') {
                const triggers = corruptTriggerMap[t] || [];
                isKnown = triggers.some(unit => unlockedUnits.has(unit));
            } else {
                isKnown = (window.encounteredEnemies && window.encounteredEnemies.has(t)) || (killCounts[t] > 0);
            }

            let d; 
            if (typeof bossData !== 'undefined' && bossData) {
                for (let k in bossData) { if (bossData[k].type === t) { d = bossData[k]; break; } }
            }
            if (!d) {
                for(let k in enemyCategories) { const f=enemyCategories[k].find(x=>x.type===t); if(f){d=f; break;} }
            }
            if(!d && typeof corruptedTypes!=='undefined') d=corruptedTypes[t]; 
            if(!d) return;

            const kills = killCounts[t] || 0; 
            const bonus = getBestiaryBonus(t); 
            const btx = bonus>1?`<br>DMG +${((bonus-1)*100).toFixed(0)}%`:`<br>No Bonus`;
            
            let rVal = d.reward;
            if (rVal === undefined) {
                if (g.h === 'Abyss Bosses') rVal = 500;
                else if (g.h === 'Corrupted Specters') rVal = 0;
                else rVal = 10;
            }
            const rewardText = ` | ✨ ${rVal}`;
            const originText = (g.h === 'Corrupted Specters' && corruptInfo[t]) ? `<div style="font-size:7px; color:#ff4444; margin-bottom:2px; font-weight:bold;">[ORIGIN: ${corruptInfo[t]}]</div>` : '';
            const traitOriginText = (g.h !== 'Corrupted Specters' && corruptInfo[t]) ? `<br><strong style="color:#ff0000;">[Origin]</strong> ${corruptInfo[t]}` : '';
            
            const item = document.createElement('div'); 
            item.className = `bestiary-item ${isKnown ? '' : 'locked'}`;
            
            if (isKnown) {
                const statsDisplay = g.h === 'Corrupted Specters' ? `💀 ${kills}${rewardText}` : `💀 ${kills}${rewardText}${btx}`;
                item.innerHTML = `
                    <div class="custom-tooltip specter">
                        <strong style="color:#ffd700;">[Trait]</strong><br>${d.desc || d.lore || 'A powerful soul from the abyss.'}${traitOriginText}
                    </div>
                    ${originText}
                    <div class="bestiary-icon enemy ${t}" style="position:static; transform:none; display:flex; justify-content:center; align-items:center;">${d.icon}</div>
                    <div class="bestiary-info">
                        <div class="bestiary-name">${names[t]||t}</div>
                        <div class="bestiary-stats">${statsDisplay}</div>
                    </div>`;
            } else {
                item.innerHTML = `
                    <div class="custom-tooltip specter">
                        <strong style="color:#ffd700;">[Information Unavailable]</strong><br>Defeat this specter or unlock its related class to reveal details.
                    </div>
                    <div class="bestiary-icon" style="position:static; transform:none; display:flex; justify-content:center; align-items:center; background:#222; color:#555; font-size:20px; border:1px dashed #444;">?</div>
                    <div class="bestiary-info">
                        <div class="bestiary-name" style="color:#555;">???</div>
                        <div class="bestiary-stats" style="color:#333;">💀 Locked</div>
                    </div>`;
            }
            bt.appendChild(item);
        });
    });
}

function renderPromotionTree() {
    const tt = document.getElementById('tree-tab'); tt.innerHTML = '';
    const pg = {
        'Attack Paths': [ {n:'Talismanist',t:'talisman',m:['grandsealer','flamemaster'],a:'cursed_talisman'}, {n:'Divine Archer',t:'archer',m:['voidsniper','thousandhand'],a:'piercing_shadow'}, {n:'Fire Mage',t:'fire',m:['hellfire','phoenix'],a:'purgatory'}, {n:'Shadow Assassin',t:'assassin',m:['abyssal','spatial'],a:'reaper'}, {n:'Exorcist Knight',t:'knight',m:['paladin','crusader'],a:'eternal_wall'} ],
        'Support Paths': [ {n:'Soul Chainer',t:'chainer',m:['executor','binder'],a:'warden'}, {n:'Mace Monk',t:'monk',m:['vajra','saint'],a:'asura'}, {n:'Ice Daoist',t:'ice',m:['absolutezero','permafrost'],a:'cocytus'}, {n:'Soul Tracker',t:'tracker',m:['seer','commander'],a:'doom_guide'}, {n:'Necromancer',t:'necromancer',m:['wraithlord','cursedshaman'],a:'forsaken_king'} ],
        'Special Paths': [ 
            {n:'Sanctuary Guardian',t:'guardian',m:['rampart','judgment'],a:'void_gatekeeper'},
            {n:'Exorcist Alchemist',t:'alchemist',m:['midas','philosopher'],a:'transmuter'},
            {n:'Mirror Oracle',t:'mirror',m:['illusion','reflection'],a:'oracle'}
        ]
    };
    Object.keys(pg).forEach(gn => {
        const h = document.createElement('h3'); let c="#ff4500"; if(gn.includes('Support')) c="#00e5ff"; if(gn.includes('Special')) c="#ffd700";
        h.innerText=gn; h.style.cssText=`color:${c}; border-bottom:1px solid #333; margin:8px 0 4px 0; font-size:13px; text-align:center;`; tt.appendChild(h);
        const tc = document.createElement('div'); tc.className='tree-main-container'; tc.style.cssText='display:flex; flex-direction:column; gap:4px;';
        pg[gn].forEach(p => {
            const row = document.createElement('div'); row.style.cssText='display:grid; grid-template-columns:70px 12px 85px 12px 105px 12px 105px; align-items:center; justify-content:center; gap:3px; border-bottom:1px solid #222; padding-bottom:4px;';
            const node = (type,tier) => {
                const d=unitTypes.find(x=>x.type===type); 
                const u=unlockedUnits.has(type);
                const n=document.createElement('div'); n.className=`unit-node tier${tier} ${u?'':'locked'}`; n.style.cssText='position:relative; font-size:7px; padding:2px 4px; min-width:auto;';
                if (u) {
                    n.innerHTML = `<div class="custom-tooltip"><strong>${d.name}</strong><br>${d.desc}</div>${d.icon} ${d.name}`;
                } else {
                    n.innerHTML = `<div class="custom-tooltip"><strong>[Hidden Class]</strong><br>Promote to this class during a mission to unlock its records.</div>? ???`;
                    n.style.color = '#555';
                }
                return n;
            };
            const arrow = () => { const a=document.createElement('div'); a.innerText='→'; a.style.fontSize='8px'; return a; };
            row.appendChild(node('apprentice',1)); row.appendChild(arrow()); row.appendChild(node(p.t,2)); row.appendChild(arrow());
            const mdiv = document.createElement('div'); mdiv.style.cssText='display:flex; flex-direction:column; gap:2px;';
            p.m.forEach(m=>mdiv.appendChild(node(m,3))); row.appendChild(mdiv); row.appendChild(arrow()); row.appendChild(node(p.a,4));
            tc.appendChild(row);
        }); tt.appendChild(tc);
    });
}

function purgePortal() {
    const pc = 800; const pa = portalEnergy * 0.5;
    if(money>=pc && portalEnergy>0) { money-=pc; portalEnergy=Math.max(0,portalEnergy-pa); if(typeof updateGauges==='function')updateGauges(); }
}

function performJobChange(el, targetRole = null, fromInfo = false) {
    if (fromInfo) {
        const selectedTower = towers.find(t => t.element.classList.contains('selected'));
        if (!selectedTower) return;
        el = selectedTower.element;
    }
    const t = towers.find(x=>x.element===el); if(!t) return;
    const paths = [ {from:'apprentice', to:['chainer','talisman','monk','archer','ice','fire','assassin','tracker','necromancer','guardian','knight','alchemist','mirror']} ];
    const p = paths.find(x=>x.from===t.data.type); if(!p) return;

    // Filter paths by role and map limit (Limit 2 for Tier 2)
    const availablePaths = p.to.filter(type => {
        const ud = unitTypes.find(x => x.type === type);
        if (targetRole && ud.role !== targetRole) return false;
        const count = towers.filter(tw => tw.data.type === type).length;
        return count < 2;
    });

    if (availablePaths.length === 0) {
        const msg = targetRole ? `No available ${targetRole} classes!` : "No available classes!";
        alert(msg);
        return;
    }

    if(money<jobChangeCost) return; 
    money-=jobChangeCost; if(typeof updateGauges==='function')updateGauges();
    
    const ntStr = availablePaths[Math.floor(Math.random()*availablePaths.length)]; 
    const nt = unitTypes.find(x=>x.type===ntStr);
    el.className=`unit ${nt.type} selected`; el.title=nt.name; el.innerText=nt.icon;
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);
    recordUnlock(nt.type); t.data=nt; t.range=nt.range; t.cooldown=nt.cooldown; t.spentSE+=jobChangeCost;
    updateUnitOverlayButtons(t); updateSummonButtonState();
    if (fromInfo) showUnitInfo(t);
    startInfoResetTimer();
    showRangeIndicator(t);
}

function performMasterJobChange(tower, ntStr, fromInfo = false) {
    if (fromInfo) {
        tower = towers.find(t => t.element.classList.contains('selected'));
        if (!tower) return;
    }
    const nt = unitTypes.find(x => x.type === ntStr);
    if (!nt) return;

    const existingCount = towers.filter(t => t.data.type === ntStr).length;
    if (existingCount >= 1) {
        alert(`You can only have 1 ${nt.name} at a time!`);
        return;
    }

    // Cost logic based on target tier
    if (nt.tier === 4) {
        const shardCost = 10;
        if(corruptedShards < shardCost) {
            alert(`Not enough Corrupted Shards for [Abyssal]! Need ${shardCost}.`);
            return;
        } 
        corruptedShards -= shardCost;
        tower.spentSE += 500; // Value for selling
    } else {
        const seCost = 400;
        if(money < seCost) {
            alert(`Not enough Soul Energy! Need ${seCost}.`);
            return;
        }
        money -= seCost;
        tower.spentSE += seCost;
    }
    
    if(typeof updateGauges==='function') updateGauges();
    
    const el = tower.element;
    el.className=`unit ${nt.type} selected`; el.title=nt.name; el.innerText=nt.icon;
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);
    recordUnlock(nt.type); tower.data=nt; tower.range=nt.range; tower.cooldown=nt.cooldown; 
    
    if(nt.type==='rampart') tower.charges=5;
    updateUnitOverlayButtons(tower); updateSummonButtonState();
    if (fromInfo) showUnitInfo(tower);
    startInfoResetTimer();
    showRangeIndicator(tower);
}

function updateUnitOverlayButtons(t) {
    const el = t.element; el.querySelectorAll('.unit-overlay-btn').forEach(b=>b.remove());
    const sell = document.createElement('div'); sell.className='unit-overlay-btn sell-btn'; sell.innerHTML='💀'; sell.title='Corrupt Unit (Sell)';
    sell.addEventListener('click', e=>{ e.stopPropagation(); sellTower(t); }); el.appendChild(sell);
    if(t.data.type==='apprentice') {
        // Attack Path (10 o'clock)
        const atk = document.createElement('div'); 
        atk.className='unit-overlay-btn promote-10'; atk.innerHTML='⚔️'; atk.title='Ascend: Attack Path (200 SE)';
        atk.addEventListener('click', e=>{ e.stopPropagation(); performJobChange(el, 'Attack'); }); 
        el.appendChild(atk);

        // Support Path (12 o'clock)
        const sup = document.createElement('div'); 
        sup.className='unit-overlay-btn promote-12'; sup.innerHTML='🪄'; sup.title='Ascend: Support Path (200 SE)';
        sup.addEventListener('click', e=>{ e.stopPropagation(); performJobChange(el, 'Support'); }); 
        el.appendChild(sup);

        // Special Path (2 o'clock)
        const spc = document.createElement('div'); 
        spc.className='unit-overlay-btn promote-2'; spc.innerHTML='💠'; spc.title='Ascend: Special Path (200 SE)';
        spc.addEventListener('click', e=>{ e.stopPropagation(); performJobChange(el, 'Special'); }); 
        el.appendChild(spc);
    } else if(t.data.upgrades) {
        t.data.upgrades.forEach((u,i)=>{
            const ud=unitTypes.find(x=>x.type===u); const b=document.createElement('div');
            const costText = ud.tier === 4 ? "10 Shards" : "400 SE";
            b.className=i===0?'unit-overlay-btn promote-btn':'unit-overlay-btn promote-btn-right'; b.innerHTML=i===0?'↖️':'↗️'; b.title=`Unleash ${ud.name} (${costText})`;
            b.addEventListener('click', e=>{ e.stopPropagation(); performMasterJobChange(t,u); }); el.appendChild(b);
        });
    }
}

function sellTower(t) {
    const s = t.slotElement; s.classList.remove('occupied'); t.element.remove();
    
    // Calculate Refund with Relic Bonus
    const baseRefund = t.spentSE || 0;
    const relicRefundBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('sell_refund') : 0;
    const finalRefund = Math.floor(baseRefund * (1.0 + relicRefundBonus));
    
    money = Math.min(1000, money + finalRefund);
    updateGauges();
    updateSummonButtonState();

    const idx = towers.indexOf(t); if(idx>-1) towers.splice(idx,1);
    if(typeof window.spawnCorruptedEnemy === 'function') {
        let ct = 'defiled_apprentice';
        if(['monk','vajra','saint'].includes(t.data.type)) ct='cursed_vajra';
        else if(['archer','voidsniper','thousandhand'].includes(t.data.type)) ct='void_piercer';
        else if(['ice','absolutezero','permafrost'].includes(t.data.type)) ct='frost_outcast';
        else if(['fire','hellfire','phoenix'].includes(t.data.type)) ct='ember_hatred';
        else if(['assassin','abyssal','spatial'].includes(t.data.type)) ct='betrayer_blade';
        else if(t.data.tier>=3) ct='abyssal_acolyte';
        if(t.data.tier===4) ct='bringer_of_doom';
        window.spawnCorruptedEnemy(t, ct);
    }
}

function updateSummonButtonState() {
    const tc = document.getElementById('tower-card'); if(!tc) return;
    const scd = document.getElementById('summon-cost-display');
    
    // Apply Relic Cost Reduction
    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, towerCost - reduction); // Min cost 5

    if(scd) scd.innerText = `${finalTowerCost} SE`;

    const isMax = towers.length >= maxTowers;

    const sw = document.getElementById('summon-warning');
    if(sw) {
        if (money < finalTowerCost && !isMax) {
            sw.style.display = 'block';
            sw.innerText = 'NOT ENOUGH SE';
        } else {
            sw.style.display = 'none';
        }
    }

    if(money<finalTowerCost || isMax) tc.classList.add('locked'); else tc.classList.remove('locked');
    const pc = document.getElementById('purge-card'); if(!pc) return;
    const pw = document.getElementById('purge-warning');
    if(pw) {
        if (money < 800 && portalEnergy > 0) {
            pw.style.display = 'block';
            pw.innerText = 'NOT ENOUGH SE';
        } else {
            pw.style.display = 'none';
        }
    }

    if(money<800 || portalEnergy<=0) pc.classList.add('locked'); else pc.classList.remove('locked');
    
    // Optional: Add logic here to highlight units that CAN be upgraded if shards >= 25
    // But since this function is about the bottom summon buttons, we'll stop here.
}
