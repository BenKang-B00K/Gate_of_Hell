/* js/collections.js - Collections (도감) System */

document.addEventListener('DOMContentLoaded', () => {
    const collectionsBtn = document.getElementById('collections-btn');
    const collectionsOverlay = document.getElementById('collections-overlay');
    const closeBtn = document.getElementById('close-collections');
    const tabBtns = document.querySelectorAll('.col-tab-btn');
    const catBtns = document.querySelectorAll('.col-cat-btn');

    if (collectionsBtn) {
        collectionsBtn.onclick = () => {
            collectionsOverlay.style.display = 'flex';
            isPaused = true;
            renderGhostGrid('normal');
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            collectionsOverlay.style.display = 'none';
            isPaused = false;
        };
    }

    tabBtns.forEach(btn => {
        btn.onclick = () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            document.querySelectorAll('.collections-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${tab}-section`).classList.add('active');
            
            if (tab === 'ghosts') renderGhostGrid('normal');
            else if (tab === 'exorcists') renderExorcistTree();
        };
    });

    catBtns.forEach(btn => {
        btn.onclick = () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderGhostGrid(btn.dataset.cat);
        };
    });
});

function renderGhostGrid(category) {
    const grid = document.getElementById('ghost-grid');
    grid.innerHTML = '';
    
    // Get list of enemies for this category from enemyPool
    const pool = window.enemyPool[category] || [];
    
    pool.forEach(enemy => {
        const item = document.createElement('div');
        const isUnlocked = (window.encounteredEnemies && window.encounteredEnemies.has(enemy.type));
        item.className = `col-item ${isUnlocked ? '' : 'locked'}`;
        item.innerText = enemy.icon;
        
        if (isUnlocked) {
            item.onclick = () => showGhostDetail(enemy);
        }
        
        grid.appendChild(item);
    });
    
    // Fill remaining to maintain 10 columns grid look if needed
    for (let i = pool.length; i < 20; i++) {
        const empty = document.createElement('div');
        empty.className = 'col-item locked';
        empty.innerText = '?';
        grid.appendChild(empty);
    }
}

function showGhostDetail(enemy) {
    const details = document.getElementById('collection-details');
    const killCount = (window.killCounts && window.killCounts[enemy.type]) || 0;
    
    details.innerHTML = `
        <div class="col-detail-header">
            <div class="col-detail-icon">${enemy.icon}</div>
            <div>
                <div class="col-detail-title">${enemy.name || enemy.type}</div>
                <div class="col-detail-stats">HP: ${enemy.hp} | Reward: ${enemy.reward} SE | Total Kills: ${killCount}</div>
            </div>
        </div>
        <div class="col-detail-lore">${enemy.lore || enemy.desc}</div>
    `;
}

function renderExorcistTree() {
    const container = document.getElementById('exorcist-tree-container');
    container.innerHTML = '';
    
    // Define Tree structures based on unitTypes and upgrades
    // Rows: Apprentice -> Tier 2 -> Tier 3 -> Tier 4
    const trees = [
        { apprentice: 'apprentice', t2: 'chainer', t3: ['executor', 'binder'], t4: ['warden'] },
        { apprentice: 'apprentice', t2: 'talisman', t3: ['grandsealer', 'flamemaster'], t4: ['cursed_talisman', 'purgatory'] },
        { apprentice: 'apprentice', t2: 'monk', t3: ['vajra', 'saint'], t4: ['asura'] },
        { apprentice: 'apprentice', t2: 'archer', t3: ['voidsniper', 'thousandhand'], t4: ['piercing_shadow'] },
        { apprentice: 'apprentice', t2: 'ice', t3: ['absolutezero', 'permafrost'], t4: ['cocytus'] },
        { apprentice: 'apprentice', t2: 'assassin', t3: ['abyssal', 'spatial'], t4: ['reaper'] },
        { apprentice: 'apprentice', t2: 'tracker', t3: ['seer', 'commander'], t4: ['doom_guide'] },
        { apprentice: 'apprentice', t2: 'necromancer', t3: ['wraithlord', 'cursedshaman'], t4: ['forsaken_king'] },
        { apprentice: 'apprentice', t2: 'guardian', t3: ['rampart', 'judgment'], t4: ['void_gatekeeper'] },
        { apprentice: 'apprentice', t2: 'alchemist', t3: ['midas', 'philosopher'], t4: ['transmuter'] },
        { apprentice: 'apprentice', t2: 'mirror', t3: ['illusion', 'reflection'], t4: ['oracle'] },
        { apprentice: 'apprentice', t2: 'knight', t3: ['paladin', 'crusader'], t4: ['eternal_wall'] }
    ];

    trees.forEach(tree => {
        const row = document.createElement('div');
        row.className = 'ex-tree-row';
        
        // Tier 1
        row.appendChild(createExNode(tree.apprentice));
        // Tier 2
        row.appendChild(createExNode(tree.t2));
        // Tier 3 (Show first one or pick based on unlock if we had per-unit unlock)
        row.appendChild(createExNode(tree.t3[0]));
        // Tier 4
        row.appendChild(createExNode(tree.t4[0]));
        
        container.appendChild(row);
    });
}

function createExNode(type) {
    const data = unitTypes.find(u => u.type === type);
    const node = document.createElement('div');
    node.className = 'ex-node';
    if (!data) return node;
    
    const isUnlocked = (window.unlockedUnits && window.unlockedUnits.has(type));
    
    node.innerHTML = `
        <div class="icon ${isUnlocked ? '' : 'locked'}">${data.icon}</div>
        <div class="name">${data.name}</div>
    `;
    
    node.onclick = () => showExorcistDetail(data);
    return node;
}

function showExorcistDetail(unit) {
    const details = document.getElementById('collection-details');
    details.innerHTML = `
        <div class="col-detail-header">
            <div class="col-detail-icon">${unit.icon}</div>
            <div>
                <div class="col-detail-title">${unit.name} [Tier ${unit.tier}]</div>
                <div class="col-detail-stats">ATK: ${unit.damage} | RNG: ${unit.range} | SPD: ${unit.cooldown}ms | Type: ${unit.role}</div>
            </div>
        </div>
        <div class="col-detail-lore">${unit.desc}</div>
    `;
}
