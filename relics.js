/* relics.js */

const relicsData = {
    'cursed_mask': { 
        name: "Cursed Hannya Mask", icon: '👺', 
        effect: "Allies deal +1% damage per stack.", 
        lore: "A mask that vibrates with the screams of a thousand forgotten souls.", 
        bonus: { type: 'damage', value: 0.01 },
        maxStack: 20, dropSource: 'basic'
    },
    'spectral_lantern': { 
        name: "Spectral Lantern", icon: '🏮', 
        effect: "Increases attack range of all units by 10.", 
        lore: "Its light doesn't illuminate the path, it reveals the prey.", 
        bonus: { type: 'range', value: 10 },
        maxStack: 1, dropSource: 'specialized'
    },
    'ancient_beads': { 
        name: "Corrupted Prayer Beads", icon: '📿', 
        effect: "Reduces all cooldowns by 1% per stack.", 
        lore: "Each bead is carved from the bone of a fallen saint.", 
        bonus: { type: 'cooldown', value: 0.01 },
        maxStack: 10, dropSource: 'all'
    },
    'soul_urn': { 
        name: "Soul-Binding Urn", icon: '⚱️', 
        effect: "Gain +1 Soul Energy from kills per stack.", 
        lore: "It hungers for the essence of the departed.", 
        bonus: { type: 'se_gain', value: 1 },
        maxStack: 10, dropSource: 'all'
    },
    'withered_bell': { 
        name: "Withered Temple Bell", icon: '🔔', 
        effect: "Stuns enemies 2% longer per stack.", 
        lore: "Its toll sounds like a funeral dirge for the living.", 
        bonus: { type: 'stun_duration', value: 0.02 },
        maxStack: 5, dropSource: 'all'
    },
    'broken_talisman': { 
        name: "Blood-Stained Talisman", icon: '📜', 
        effect: "Crit Multiplier +0.5% per stack.", 
        lore: "The ink was mixed with the blood of a thousand sacrifices.", 
        bonus: { type: 'crit_damage', value: 0.005 },
        maxStack: 50, dropSource: 'all'
    },
    'obsidian_mirror': { 
        name: "Obsidian Mirror", icon: '🪞', 
        effect: "Projectiles gain 2% pierce chance per stack.", 
        lore: "Reflects a world where the sun never rises.", 
        bonus: { type: 'pierce_chance', value: 0.02 },
        maxStack: 10, dropSource: 'all'
    },
    'rusted_scythe': { 
        name: "Rusted Reaper Scythe", icon: '🧹', 
        effect: "Enemies have 2% less Max HP per stack.", 
        lore: "Even rust cannot dull the edge that harvests souls.", 
        bonus: { type: 'enemy_hp', value: -0.02 },
        maxStack: 10, dropSource: 'all'
    },
    'spectral_chain': { 
        name: "Chains of the Damned", icon: '⛓️', 
        effect: "Slow effects are 2% stronger per stack.", 
        lore: "The more they struggle, the tighter they bind.", 
        bonus: { type: 'slow_strength', value: 0.02 },
        maxStack: 10, dropSource: 'fast'
    },
    'unholy_grail': { 
        name: "Unholy Grail", icon: '🏆', 
        effect: "Portal Energy increases 5% slower per stack.", 
        lore: "Fills with the tears of those who failed to guard the gate.", 
        bonus: { type: 'portal_dmg_reduction', value: 0.05 },
        maxStack: 5, dropSource: 'specialized'
    },
    // Boss Artifacts
    'cerberus_fang': { 
        name: "Cerberus's Fang", icon: '🦴', 
        effect: "Global ATK +10%.", 
        lore: "A jagged tooth from the triple-headed guardian. It still carries the heat of hellfire.", 
        bonus: { type: 'damage', value: 0.1 },
        maxStack: 1, dropSource: 'boss'
    },
    'stygian_oar': { 
        name: "Stygian Oar", icon: '🛶', 
        effect: "Global Enemy Speed -15%.", 
        lore: "Used to ferry souls across the river Styx. Now it slows the very essence of time.", 
        bonus: { type: 'enemy_speed', value: -0.15 },
        maxStack: 1, dropSource: 'boss'
    },
    'gluttony_crown': { 
        name: "Crown of Gluttony", icon: '👑', 
        effect: "Treasure Specter Spawn Rate +1%.", 
        lore: "A crown that smells of decay. It draws out the greediest spirits from the shadows.", 
        bonus: { type: 'treasure_chance', value: 0.01 },
        maxStack: 1, dropSource: 'boss'
    },
    'fallen_wings': { 
        name: "Fallen Angel's Wings", icon: '🪽', 
        effect: "Global Crit Chance +10%.", 
        lore: "Feathers of pure darkness. They guides strikes toward the most vulnerable parts of a soul.", 
        bonus: { type: 'crit_chance', value: 0.1 },
        maxStack: 1, dropSource: 'boss'
    },
    // Balanced Normal Relics
    'soul_candle': { 
        name: "Soul Candle", icon: '🕯️', 
        effect: "Apprentice summon cost -2 SE per stack.", 
        lore: "A faint light that guides wandering souls at a cheaper price.", 
        bonus: { type: 'summon_cost_reduction', value: 2 },
        maxStack: 10, dropSource: 'basic'
    },
    'blood_ring': { 
        name: "Bloodstone Ring", icon: '🩸', 
        effect: "Global Crit Chance +0.5% per stack.", 
        lore: "Pulses in sync with the wearer's heartbeat, seeking vital spots.", 
        bonus: { type: 'crit_chance', value: 0.005 },
        maxStack: 20, dropSource: 'all'
    },
    'execution_mark': { 
        name: "Executioner's Mark", icon: '🗡️', 
        effect: "Executes enemies below 1% HP per stack.", 
        lore: "To those marked, the judgment of the abyss is inevitable.", 
        bonus: { type: 'execute_threshold', value: 0.01 },
        maxStack: 5, dropSource: 'specialized'
    },
    'foresight_eye': { 
        name: "Eye of Foresight", icon: '🧿', 
        effect: "Increases aura range of support units by 5 per stack.", 
        lore: "Reads the invisible threads of causality to strengthen bonds.", 
        bonus: { type: 'aura_range', value: 5 },
        maxStack: 10, dropSource: 'specialized'
    },
    'cursed_coin': { 
        name: "Cursed Gold Coin", icon: '🪙', 
        effect: "Increases SE refund when selling units by 2% per stack.", 
        lore: "Betrayer has a price, and this coin makes it a bit sweeter.", 
        bonus: { type: 'sell_refund', value: 0.02 },
        maxStack: 5, dropSource: 'all'
    }
};

let collectedRelics = {}; // ID: count
let totalRelicBonuses = {
    damage: 0,
    range: 0,
    cooldown: 0,
    se_gain: 0,
    stun_duration: 0,
    crit_damage: 0,
    crit_chance: 0,
    pierce_chance: 0,
    enemy_hp: 0,
    enemy_speed: 0,
    treasure_chance: 0,
    slow_strength: 0,
    portal_dmg_reduction: 0,
    summon_cost_reduction: 0,
    execute_threshold: 0,
    aura_range: 0,
    sell_refund: 0
};

function initRelics() {
    const relicsBtn = document.getElementById('relics-btn');
    const relicsOverlay = document.getElementById('relics-overlay');
    const closeRelics = document.getElementById('close-relics');

    if (relicsBtn) {
        relicsBtn.addEventListener('click', () => {
            renderRelicsGrid();
            relicsOverlay.style.display = 'flex';
            if (typeof isPaused !== 'undefined') isPaused = true;
        });
        relicsBtn.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d) {
                d.innerHTML = `
                    <div style="color:#ff4500; font-weight:bold; font-size:39px; margin-bottom:6px;">Abyssal Relics</div>
                    <div style="display:inline-block; background:#8b2200; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">COLLECTION</div>
                    <div style="font-size:27px; color:#bbb; line-height:1.2;">Permanent global bonuses found by defeating enemies. Collect them all to dominate the abyss.</div>
                    <div style="color:#555; font-size:25px; margin-top:18px; font-style:italic; line-height:1.2;">"Artifacts of power that survived the fall. Each one carries the weight of a legendary soul."</div>
                `;
            }
        });
    }

    if (closeRelics) {
        closeRelics.addEventListener('click', () => {
            relicsOverlay.style.display = 'none';
            if (typeof isPaused !== 'undefined') isPaused = false;
        });
    }

    relicsOverlay.addEventListener('click', (e) => {
        if (e.target === relicsOverlay) {
            relicsOverlay.style.display = 'none';
            if (typeof isPaused !== 'undefined') isPaused = false;
        }
    });
}

function renderRelicsGrid() {
    const grid = document.getElementById('relics-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const allRelicIds = Object.keys(relicsData);
    const normalRelics = allRelicIds.filter(id => relicsData[id].dropSource !== 'boss');
    const bossArtifacts = allRelicIds.filter(id => relicsData[id].dropSource === 'boss');

    // Helper to create slots
    const createSlot = (id) => {
        const slot = document.createElement('div');
        const count = collectedRelics[id] || 0;
        const isCollected = count > 0;
        slot.className = `relic-slot ${isCollected ? '' : 'empty'}`;
        
        let inner = relicsData[id].icon;
        if (count > 1) {
            inner += `<div style="position:absolute; bottom:3px; right:6px; font-size:21px; color:#fff; text-shadow:3px 3px 6px #000;">x${count}</div>`;
        }
        slot.innerHTML = inner;
        slot.style.position = 'relative';
        
        if (isCollected) {
            slot.addEventListener('click', () => {
                document.querySelectorAll('.relic-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                showRelicDetail(id);
            });
        }
        return slot;
    };

    // Normal Section
    const normalHeader = document.createElement('div');
    normalHeader.style.cssText = 'grid-column: 1 / -1; color: #aaa; font-size: 30px; font-weight: bold; margin-top: 15px; border-bottom: 3px solid #333; padding-bottom: 6px;';
    normalHeader.innerText = 'NORMAL RELICS';
    grid.appendChild(normalHeader);
    normalRelics.forEach(id => grid.appendChild(createSlot(id)));

    // Boss Section
    const bossHeader = document.createElement('div');
    bossHeader.style.cssText = 'grid-column: 1 / -1; color: #ff4500; font-size: 30px; font-weight: bold; margin-top: 45px; border-bottom: 3px solid #ff4500; padding-bottom: 6px;';
    bossHeader.innerText = 'BOSS ARTIFACTS';
    grid.appendChild(bossHeader);
    bossArtifacts.forEach(id => grid.appendChild(createSlot(id)));

    renderTotalBonuses();
}

function renderTotalBonuses() {
    const details = document.getElementById('relic-details');
    if (!details || document.querySelector('.relic-slot.selected')) return;

    let bonusHtml = '<div class="relic-detail-title">Total Relic Buffs</div>';
    let hasAnyBonus = false;

    const labels = {
        damage: "Global Damage",
        range: "Global Range",
        cooldown: "Cooldown Reduction",
        se_gain: "Flat SE Bonus",
        stun_duration: "Stun Duration",
        crit_damage: "Crit Multiplier",
        crit_chance: "Crit Chance",
        pierce_chance: "Pierce Chance",
        enemy_hp: "Enemy HP Reduction",
        enemy_speed: "Enemy Speed Reduction",
        treasure_chance: "Treasure Spawn Rate",
        slow_strength: "Slow Intensity",
        portal_dmg_reduction: "Portal Stability",
        summon_cost_reduction: "Summon Cost Reduc.",
        execute_threshold: "Execute Threshold",
        aura_range: "Aura Range Bonus",
        sell_refund: "Sell Refund Bonus"
    };

    for (let key in totalRelicBonuses) {
        const val = totalRelicBonuses[key];
        if (val !== 0) {
            hasAnyBonus = true;
            let dispVal = val > 0 ? `+${(val * 100).toFixed(1)}%` : `${(val * 100).toFixed(1)}%`;
            if (['range', 'se_gain', 'summon_cost_reduction', 'aura_range'].includes(key)) {
                dispVal = val > 0 ? `+${val.toFixed(0)}` : `${val.toFixed(0)}`;
            }
            
            bonusHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:27px;">
                <span>${labels[key]}</span>
                <span style="color:#00ff00;">${dispVal}</span>
            </div>`;
        }
    }

    if (!hasAnyBonus) {
        bonusHtml += '<div style="color:#666; font-style:italic; margin-top:30px; font-size:24px;">No relics collected yet. Defeat specters to find them.</div>';
    }

    details.innerHTML = bonusHtml;
}

function showRelicDetail(id) {
    const details = document.getElementById('relic-details');
    if (!details) return;
    const data = relicsData[id];
    const count = collectedRelics[id] || 0;
    
    details.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="relic-detail-title">${data.name} ${count > 1 ? '(x' + count + ')' : ''}</div>
            <button onclick="document.querySelectorAll('.relic-slot').forEach(s=>s.classList.remove('selected')); renderRelicsGrid();" style="background:#333; border:none; color:#888; font-size:21px; cursor:pointer; padding:6px 12px; border-radius:9px;">BACK</button>
        </div>
        <div class="relic-detail-effect">${data.effect} (Max Stack: ${data.maxStack})</div>
        <div class="relic-detail-lore">"${data.lore}"</div>
    `;
}

function collectRelic(id) {
    const data = relicsData[id];
    const currentCount = collectedRelics[id] || 0;
    
    if (currentCount < data.maxStack) {
        collectedRelics[id] = currentCount + 1;
        updateRelicBonuses();
        showRelicInfoInPanel(data);
        return true;
    }
    return false;
}

function updateRelicBonuses() {
    for (let key in totalRelicBonuses) totalRelicBonuses[key] = 0;
    
    for (let id in collectedRelics) {
        const count = collectedRelics[id];
        const bonus = relicsData[id].bonus;
        totalRelicBonuses[bonus.type] += (bonus.value * count);
    }
}

function showRelicInfoInPanel(relic) {
    const d = document.getElementById('unit-info');
    if (!d) return;
    
    // Set lock for 4 seconds
    window.infoPanelLockedUntil = Date.now() + 4000;
    
    d.innerHTML = `
        <div style="color:#ffd700; font-weight:bold; font-size:39px; margin-bottom:6px;">✨ RELIC FOUND!</div>
        <div style="color:#ff4500; font-size:33px; font-weight:bold; margin-bottom:12px;">${relic.icon} ${relic.name}</div>
        <div style="display:inline-block; background:#00ff00; color:#000; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">NEW POWER ACQUIRED</div>
        <div style="font-size:27px; color:#bbb; line-height:1.2;">${relic.effect}</div>
        <div style="color:#555; font-size:25px; margin-top:18px; font-style:italic; line-height:1.2;">"${relic.lore}"</div>
    `;
    
    // Auto reset after lock expires
    setTimeout(() => {
        if (typeof window.startInfoResetTimer === 'function') {
            window.infoPanelLockedUntil = 0; 
            window.startInfoResetTimer();
        }
    }, 4050);
}

function checkRelicDrop(enemy) {
    // 1% drop chance
    if (Math.random() > 0.01) return;

    const basicSpecters = ['normal', 'mist', 'memory', 'shade', 'tank', 'defiled_apprentice'];
    const specializedWraiths = ['greedy', 'mimic', 'dimension', 'deceiver', 'boar', 'soul_eater', 'frost', 'heavy', 'lava', 'burning', 'abyssal_acolyte', 'bringer_of_doom', 'cursed_vajra', 'frost_outcast', 'ember_hatred', 'betrayer_blade'];
    const FastSpecters = ['runner', 'lightspeed', 'void_piercer'];

    let possibleIds = [];
    const allIds = Object.keys(relicsData);

    allIds.forEach(id => {
        const data = relicsData[id];
        const currentCount = collectedRelics[id] || 0;
        if (currentCount >= data.maxStack) return;

        let canDrop = false;
        if (data.dropSource === 'all') canDrop = true;
        else if (data.dropSource === 'basic' && basicSpecters.includes(enemy.type)) canDrop = true;
        else if (data.dropSource === 'specialized' && specializedWraiths.includes(enemy.type)) canDrop = true;
        else if (data.dropSource === 'fast' && FastSpecters.includes(enemy.type)) canDrop = true;
        else if (enemy.isBoss) canDrop = true; // Bosses can drop anything

        if (canDrop) possibleIds.push(id);
    });

    if (possibleIds.length > 0) {
        const randomId = possibleIds[Math.floor(Math.random() * possibleIds.length)];
        collectRelic(randomId);
    }
}

// Global expose
window.checkRelicDrop = checkRelicDrop;
window.totalRelicBonuses = totalRelicBonuses;
window.collectRelic = collectRelic;

/**
 * Get the total bonus value for a specific relic effect type.
 * @param {string} type - The bonus type (e.g., 'damage', 'range')
 * @returns {number} The sum of all collected relic bonuses for this type.
 */
function getRelicBonus(type) {
    if (typeof totalRelicBonuses !== 'undefined' && totalRelicBonuses[type] !== undefined) {
        return totalRelicBonuses[type];
    }
    return 0;
}
window.getRelicBonus = getRelicBonus;

// Initialize when DOM loaded
document.addEventListener('DOMContentLoaded', initRelics);
