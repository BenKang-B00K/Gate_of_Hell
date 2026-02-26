/* relics.js */

const relicsData = {
    'cursed_mask': { name: "Cursed Hannya Mask", icon: '👺', effect: "Allies deal +5% damage.", lore: "A mask that vibrates with the screams of a thousand forgotten souls.", bonus: { type: 'damage', value: 0.05 } },
    'spectral_lantern': { name: "Spectral Lantern", icon: '🏮', effect: "Increases attack range of all units by 10.", lore: "Its light doesn't illuminate the path, it reveals the prey.", bonus: { type: 'range', value: 10 } },
    'ancient_beads': { name: "Corrupted Prayer Beads", icon: '📿', effect: "Reduces all cooldowns by 5%.", lore: "Each bead is carved from the bone of a fallen saint.", bonus: { type: 'cooldown', value: 0.05 } },
    'soul_urn': { name: "Soul-Binding Urn", icon: '⚱️', effect: "Gain 5% more Soul Energy from kills.", lore: "It hungers for the essence of the departed.", bonus: { type: 'se_gain', value: 0.05 } },
    'withered_bell': { name: "Withered Temple Bell", icon: '🔔', effect: "Stuns enemies 10% longer.", lore: "Its toll sounds like a funeral dirge for the living.", bonus: { type: 'stun_duration', value: 0.1 } },
    'broken_talisman': { name: "Blood-Stained Talisman", icon: '📜', effect: "Crits deal +20% more damage.", lore: "The ink was mixed with the blood of a thousand sacrifices.", bonus: { type: 'crit_damage', value: 0.2 } },
    'obsidian_mirror': { name: "Obsidian Mirror", icon: '🪞', effect: "Projectiles have a 5% chance to pierce.", lore: "Reflects a world where the sun never rises.", bonus: { type: 'pierce_chance', value: 0.05 } },
    'rusted_scythe': { name: "Rusted Reaper Scythe", icon: '🧹', effect: "Enemies have 5% less Max HP.", lore: "Even rust cannot dull the edge that harvests souls.", bonus: { type: 'enemy_hp', value: -0.05 } },
    'spectral_chain': { name: "Chains of the Damned", icon: '⛓️', effect: "Slow effects are 10% stronger.", lore: "The more they struggle, the tighter they bind.", bonus: { type: 'slow_strength', value: 0.1 } },
    'unholy_grail': { name: "Unholy Grail", icon: '🏆', effect: "Portal Energy increases 10% slower.", lore: "Fills with the tears of those who failed to guard the gate.", bonus: { type: 'portal_dmg_reduction', value: 0.1 } }
};

let collectedRelics = [];
let totalRelicBonuses = {
    damage: 0,
    range: 0,
    cooldown: 0,
    se_gain: 0,
    stun_duration: 0,
    crit_damage: 0,
    pierce_chance: 0,
    enemy_hp: 0,
    slow_strength: 0,
    portal_dmg_reduction: 0
};

function initRelics() {
    const relicsBtn = document.getElementById('relics-btn');
    const relicsOverlay = document.getElementById('relics-overlay');
    const closeRelics = document.getElementById('close-relics');

    if (relicsBtn) {
        relicsBtn.addEventListener('click', () => {
            renderRelicsGrid();
            relicsOverlay.style.display = 'flex';
        });
    }

    if (closeRelics) {
        closeRelics.addEventListener('click', () => {
            relicsOverlay.style.display = 'none';
        });
    }

    // Close on clicking outside content
    relicsOverlay.addEventListener('click', (e) => {
        if (e.target === relicsOverlay) relicsOverlay.style.display = 'none';
    });
}

function renderRelicsGrid() {
    const grid = document.getElementById('relics-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const allRelicIds = Object.keys(relicsData);
    
    allRelicIds.forEach(id => {
        const slot = document.createElement('div');
        const isCollected = collectedRelics.includes(id);
        slot.className = `relic-slot ${isCollected ? '' : 'empty'}`;
        slot.innerHTML = relicsData[id].icon;
        
        if (isCollected) {
            slot.addEventListener('click', () => {
                // Highlight selection
                document.querySelectorAll('.relic-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                showRelicDetail(id);
            });
        }
        
        grid.appendChild(slot);
    });
}

function showRelicDetail(id) {
    const details = document.getElementById('relic-details');
    if (!details) return;
    const data = relicsData[id];
    
    details.innerHTML = `
        <div class="relic-detail-title">${data.name}</div>
        <div class="relic-detail-effect">${data.effect}</div>
        <div class="relic-detail-lore">"${data.lore}"</div>
    `;
}

function collectRelic(id) {
    if (!collectedRelics.includes(id)) {
        collectedRelics.push(id);
        updateRelicBonuses();
        showRelicToast(relicsData[id]);
        if (typeof playSound === 'function') playSound('start'); // Use start sound for now
        return true;
    }
    return false;
}

function updateRelicBonuses() {
    // Reset bonuses
    for (let key in totalRelicBonuses) totalRelicBonuses[key] = 0;
    
    // Sum up from collected relics
    collectedRelics.forEach(id => {
        const bonus = relicsData[id].bonus;
        totalRelicBonuses[bonus.type] += bonus.value;
    });
}

function showRelicToast(relic) {
    const container = document.getElementById('game-container');
    const toast = document.createElement('div');
    toast.className = 'relic-toast';
    toast.innerHTML = `✨ RELIC FOUND: ${relic.icon} ${relic.name}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);
}

function checkRelicDrop(enemy) {
    // 2% chance for a relic drop from any enemy
    if (Math.random() < 0.02) {
        const allIds = Object.keys(relicsData);
        const uncollected = allIds.filter(id => !collectedRelics.includes(id));
        
        if (uncollected.length > 0) {
            const randomId = uncollected[Math.floor(Math.random() * uncollected.length)];
            collectRelic(randomId);
        }
    }
}

// Global expose
window.checkRelicDrop = checkRelicDrop;
window.totalRelicBonuses = totalRelicBonuses;

// Initialize when DOM loaded
document.addEventListener('DOMContentLoaded', initRelics);
