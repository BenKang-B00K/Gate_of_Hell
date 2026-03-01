/* js/collections.js - Collections (도감) System */

let colInfoLockedUntil = 0;
let colInfoResetTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    const collectionsBtn = document.getElementById('collections-btn');
    const collectionsOverlay = document.getElementById('collections-overlay');
    const closeBtn = document.getElementById('close-collections');
    const tabBtns = document.querySelectorAll('.col-tab-btn');
    const catBtns = document.querySelectorAll('.col-cat-btn');

    if (collectionsBtn) {
        collectionsBtn.onclick = () => {
            collectionsOverlay.style.display = 'flex';
            if (typeof isPaused !== 'undefined') isPaused = true;
            
            // Reset UI State to default (Ghosts tab, Normal category)
            tabBtns.forEach(b => b.classList.remove('active'));
            const ghostTabBtn = Array.from(tabBtns).find(b => b.dataset.tab === 'ghosts');
            if (ghostTabBtn) ghostTabBtn.classList.add('active');

            document.querySelectorAll('.collections-section').forEach(s => s.classList.remove('active'));
            const ghostSection = document.getElementById('ghosts-section');
            if (ghostSection) ghostSection.classList.add('active');

            catBtns.forEach(b => b.classList.remove('active'));
            const normalCatBtn = Array.from(catBtns).find(b => b.dataset.cat === 'specter');
            if (normalCatBtn) normalCatBtn.classList.add('active');

            colInfoLockedUntil = 0;
            resetColInfo();
            renderGhostGrid('specter'); 

            // Hide notification when opened
            const notif = document.getElementById('collections-notif');
            if (notif) notif.style.display = 'none';
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            collectionsOverlay.style.display = 'none';
            if (typeof isPaused !== 'undefined') isPaused = false;
        };
    }

    tabBtns.forEach(btn => {
        btn.onclick = () => {
            const tab = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.collections-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${tab}-section`).classList.add('active');

            if (tab === 'ghosts') {
                renderGhostGrid('specter');
            } else {
                renderExorcistTree();
            }
            resetColInfo();
        };
    });

    catBtns.forEach(btn => {
        btn.onclick = () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderGhostGrid(btn.dataset.cat);
            resetColInfo();
        };
    });
});

function resetColInfo() {
    const infoPane = document.getElementById('col-info-pane');
    if (infoPane) {
        infoPane.innerHTML = `
            <div class="info-default-text">Gate of Hell<br>도감</div>
        `;
    }
}

function startColInfoResetTimer() {
    if (colInfoResetTimer) clearTimeout(colInfoResetTimer);
    colInfoResetTimer = setTimeout(() => {
        colInfoLockedUntil = 0;
        resetColInfo();
    }, 15000); // 15 seconds lock
}

function renderGhostGrid(category) {
    const grid = document.getElementById('ghost-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    let pool = [];
    if (category === 'boss') {
        pool = Object.values(bossData);
    } else {
        pool = enemyCategories[category] || [];
    }
    
    pool.forEach(enemy => {
        const item = document.createElement('div');
        const isUnlocked = (window.encounteredEnemies && window.encounteredEnemies.has(enemy.type));
        item.className = `col-item ${isUnlocked ? '' : 'locked'}`;
        item.innerText = isUnlocked ? enemy.icon : '?';
        item.style.position = 'relative';

        // Add '!' badge if unseen
        if (isUnlocked && window.unseenItems && window.unseenItems.has(enemy.type)) {
            const badge = document.createElement('div');
            badge.className = 'item-new-badge';
            badge.innerText = '!';
            item.appendChild(badge);
        }
        
        if (isUnlocked) {
            const clearUnseen = () => {
                if (window.unseenItems && window.unseenItems.has(enemy.type)) {
                    window.unseenItems.delete(enemy.type);
                    const badge = item.querySelector('.item-new-badge');
                    if (badge) badge.remove();
                    if (typeof saveGameData === 'function') saveGameData();
                }
            };

            item.onclick = () => {
                showGhostDetail(enemy);
                colInfoLockedUntil = Date.now() + 15000;
                startColInfoResetTimer();
                clearUnseen();
            };
            item.onmouseenter = () => {
                if (Date.now() > colInfoLockedUntil) {
                    showGhostDetail(enemy);
                    clearUnseen();
                }
                // Also show in bottom panel for consistency
                if (typeof showEnemyInfo === 'function') {
                    const tempEnemy = { 
                        type: enemy.type, hp: enemy.hp, maxHp: enemy.hp, defense: enemy.defense || 0,
                        desc: enemy.desc, data: { name: enemy.name, lore: enemy.lore }
                    };
                    showEnemyInfo(tempEnemy);
                }
            };
            item.onmouseleave = () => {
                resetColInfo();
                if (typeof startInfoResetTimer === 'function') startInfoResetTimer();
            };
        } else {
            // [User Request] Show placeholder for locked item
            item.onmouseenter = () => {
                if (Date.now() > colInfoLockedUntil) {
                    const infoPane = document.getElementById('col-info-pane');
                    if (infoPane) {
                        infoPane.innerHTML = `
                            <div style="color:#666; text-align:center; padding:20px;">
                                <div style="font-size:48px; margin-bottom:10px;">?</div>
                                <div style="font-size:24px;">아직 조우하지 않음</div>
                                <div style="font-size:16px; margin-top:10px; opacity:0.6;">"심연 깊은 곳에 숨어있는 존재입니다."</div>
                            </div>
                        `;
                    }
                }
            };
            item.onmouseleave = () => {
                if (Date.now() > colInfoLockedUntil) resetColInfo();
            };
        }
        grid.appendChild(item);
    });
    
    const minItems = 14;
    for (let i = pool.length; i < minItems; i++) {
        const empty = document.createElement('div');
        empty.className = 'col-item locked';
        empty.innerText = '?';
        grid.appendChild(empty);
    }
}

function showGhostDetail(enemy) {
    const infoPane = document.getElementById('col-info-pane');
    if (!infoPane) return;

    const killCount = (window.killCounts && window.killCounts[enemy.type]) || 0;
    
    // Priority: 1. enemy.name 2. enemy.type
    const dispName = enemy.name || enemy.type;
    
    infoPane.innerHTML = `
        <div class="col-detail-header">
            <div class="col-detail-icon">${enemy.icon}</div>
            <div class="col-detail-title-group">
                <div class="col-detail-title">${dispName}</div>
                <div class="col-detail-stats">
                    <span>체력: ${Math.floor(enemy.hp)}</span>
                    <span>방어: ${enemy.defense || 0}</span>
                    <span>보상: ${enemy.reward} Soul Energy</span>
                    <span>처치 수: ${killCount}</span>
                </div>
            </div>
        </div>
        <div class="col-detail-lore">"${enemy.lore || enemy.desc}"</div>
    `;
}

function renderExorcistTree() {
    const container = document.getElementById('exorcist-tree-container');
    if (!container) return;
    container.innerHTML = '';
    
    // 1. Header Row (Tiers)
    const header = document.createElement('div');
    header.className = 'ex-tree-header-row';
    header.innerHTML = `
        <div class="ex-tree-header">ROLE</div>
        <div class="ex-tree-header">TIER 1</div>
        <div></div>
        <div class="ex-tree-header">TIER 2</div>
        <div></div>
        <div class="ex-tree-header">TIER 3</div>
        <div></div>
        <div class="ex-tree-header">TIER 4</div>
    `;
    container.appendChild(header);

    const roles = [
        { 
            id: 'attack', name: 'ATTACK', 
            paths: [
                { t1: 'apprentice', t2: 'knight', t3: 'paladin', t4: 'eternal_wall' },
                { t1: 'apprentice', t2: 'knight', t3: 'crusader', t4: 'eternal_wall' },
                { t1: 'apprentice', t2: 'fire', t3: 'hellfire', t4: 'purgatory' },
                { t1: 'apprentice', t2: 'fire', t3: 'phoenix', t4: 'purgatory' },
                { t1: 'apprentice', t2: 'archer', t3: 'voidsniper', t4: 'piercing_shadow' },
                { t1: 'apprentice', t2: 'archer', t3: 'thousandhand', t4: 'piercing_shadow' }
            ] 
        },
        { 
            id: 'support', name: 'SUPPORT', 
            paths: [
                { t1: 'apprentice', t2: 'chainer', t3: 'executor', t4: 'warden' },
                { t1: 'apprentice', t2: 'chainer', t3: 'binder', t4: 'warden' },
                { t1: 'apprentice', t2: 'ice', t3: 'absolutezero', t4: 'cocytus' },
                { t1: 'apprentice', t2: 'ice', t3: 'permafrost', t4: 'cocytus' },
                { t1: 'apprentice', t2: 'tracker', t3: 'seer', t4: 'doom_guide' },
                { t1: 'apprentice', t2: 'tracker', t3: 'commander', t4: 'doom_guide' }
            ] 
        },
        { 
            id: 'special', name: 'SPECIAL', 
            paths: [
                { t1: 'apprentice', t2: 'talisman', t3: 'grandsealer', t4: 'cursed_talisman' },
                { t1: 'apprentice', t2: 'talisman', t3: 'flamemaster', t4: 'cursed_talisman' },
                { t1: 'apprentice', t2: 'monk', t3: 'vajra', t4: 'asura' },
                { t1: 'apprentice', t2: 'monk', t3: 'saint', t4: 'asura' },
                { t1: 'apprentice', t2: 'necromancer', t3: 'wraithlord', t4: 'forsaken_king' },
                { t1: 'apprentice', t2: 'necromancer', t3: 'cursedshaman', t4: 'forsaken_king' },
                { t1: 'apprentice', t2: 'guardian', t3: 'rampart', t4: 'void_gatekeeper' },
                { t1: 'apprentice', t2: 'guardian', t3: 'judgment', t4: 'void_gatekeeper' },
                { t1: 'apprentice', t2: 'alchemist', t3: 'midas', t4: 'transmuter' },
                { t1: 'apprentice', t2: 'alchemist', t3: 'philosopher', t4: 'transmuter' },
                { t1: 'apprentice', t2: 'mirror', t3: 'illusion', t4: 'oracle' },
                { t1: 'apprentice', t2: 'mirror', t3: 'reflection', t4: 'oracle' }
            ] 
        }
    ];

    roles.forEach(role => {
        const group = document.createElement('div');
        group.className = 'ex-tree-role-group';
        
        role.paths.forEach((path, idx) => {
            const row = document.createElement('div');
            row.className = 'ex-tree-row';
            
            const roleLabel = document.createElement('div');
            roleLabel.className = `ex-role-label ${role.id}`;
            roleLabel.innerText = (idx === 0) ? role.name : "";
            row.appendChild(roleLabel);

            row.appendChild(createExNode(path.t1));
            row.appendChild(createArrow());
            row.appendChild(createExNode(path.t2));
            row.appendChild(createArrow());
            row.appendChild(createExNode(path.t3));
            row.appendChild(createArrow());
            row.appendChild(createExNode(path.t4));

            group.appendChild(row);
        });
        container.appendChild(group);
    });
}

function createArrow() {
    const arrow = document.createElement('div');
    arrow.className = 'ex-arrow';
    arrow.innerHTML = '▶';
    return arrow;
}

function createExNode(type) {
    const data = unitTypes.find(u => u.type === type);
    const node = document.createElement('div');
    node.className = 'ex-node';
    if (!data) return node;
    
    const isUnlocked = (window.unlockedUnits && window.unlockedUnits.has(type));
    node.style.position = 'relative';

    if (isUnlocked && window.unseenItems && window.unseenItems.has(type)) {
        const badge = document.createElement('div');
        badge.className = 'item-new-badge';
        badge.innerText = '!';
        node.appendChild(badge);
    }
    
    node.innerHTML += `
        <div class="icon ${isUnlocked ? '' : 'locked'}">${isUnlocked ? data.icon : '?'}</div>
        <div class="name">${isUnlocked ? data.name : '???'}</div>
    `;

    if (isUnlocked && typeof towers !== 'undefined') {
        const isDeployed = towers.some(t => t.data.type === type);
        if (isDeployed) {
            const badge = document.createElement('div');
            badge.className = 'ex-deployed-badge';
            badge.innerText = '보유 중';
            node.appendChild(badge);
        }
    }
    
    if (isUnlocked) {
        const clearUnseen = () => {
            if (window.unseenItems && window.unseenItems.has(type)) {
                window.unseenItems.delete(type);
                const badge = node.querySelector('.item-new-badge');
                if (badge) badge.remove();
                if (typeof saveGameData === 'function') saveGameData();
            }
        };

        node.onclick = () => {
            showExorcistDetail(data);
            colInfoLockedUntil = Date.now() + 15000;
            startColInfoResetTimer();
            clearUnseen();
        };
        node.onmouseenter = () => {
            if (Date.now() > colInfoLockedUntil) {
                showExorcistDetail(data);
                clearUnseen();
            }
            if (typeof showUnitInfo === 'function') {
                const tempTower = { data: data, cooldown: data.cooldown, damageBonus: 0 };
                showUnitInfo(tempTower);
            }
        };
        node.onmouseleave = () => {
            resetColInfo();
            if (typeof startInfoResetTimer === 'function') startInfoResetTimer();
        };
    } else {
        node.onmouseenter = () => {
            if (Date.now() > colInfoLockedUntil) {
                const infoPane = document.getElementById('col-info-pane');
                if (infoPane) {
                    infoPane.innerHTML = `
                        <div style="color:#666; text-align:center; padding:20px;">
                            <div style="font-size:48px; margin-bottom:10px;">?</div>
                            <div style="font-size:24px;">아직 해금되지 않음</div>
                            <div style="font-size:16px; margin-top:10px; opacity:0.6;">"성스러운 전직을 통해 부를 수 있는 수호자입니다."</div>
                        </div>
                    `;
                }
            }
        };
        node.onmouseleave = () => {
            if (Date.now() > colInfoLockedUntil) resetColInfo();
        };
    }
    return node;
}

function showExorcistDetail(unit) {
    const infoPane = document.getElementById('col-info-pane');
    if (!infoPane) return;
    infoPane.innerHTML = `
        <div class="col-detail-header">
            <div class="col-detail-icon">${unit.icon}</div>
            <div class="col-detail-title-group">
                <div class="col-detail-title">${unit.name}</div>
                <div class="col-detail-stats">
                    <span>공격: ${unit.damage}</span>
                    <span>사거리: ${unit.range}</span>
                    <span>속도: ${unit.cooldown}ms</span>
                    <span>역할: ${unit.role}</span>
                </div>
            </div>
        </div>
        <div class="col-detail-lore">${unit.desc}</div>
    `;
}
