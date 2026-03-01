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
            const normalCatBtn = Array.from(catBtns).find(b => b.dataset.cat === 'basic');
            if (normalCatBtn) normalCatBtn.classList.add('active');

            colInfoLockedUntil = 0;
            resetColInfo();
            renderGhostGrid('basic'); 

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
                renderGhostGrid('normal');
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
    
    const enemyNames = {
        'normal': '속삭이는 영혼', 'mist': '방랑하는 안개', 'memory': '빛바랜 기억',
        'shade': '깜빡이는 그림자', 'tank': '철갑 망령', 'runner': '가속된 그림자',
        'greedy': '탐욕스러운 폴터가이스트', 'mimic': '미믹 영혼', 'dimension': '차원 이동 망령',
        'deceiver': '절망의 세이렌', 'boar': '야생의 복수자', 'soul_eater': '소울 이터',
        'frost': '코키토스 방랑자', 'lightspeed': '필사적인 전령', 'frost_outcast': '얼어붙은 마음', 'ember_hatred': '증오의 불꽃',
        'heavy': '쇠사슬 집행자', 'lava': '불타는 분노', 'burning': '고통의 재생자',
        'abyssal_acolyte': '심연의 추종자', 'bringer_of_doom': '파멸의 인도자', 'gold': '황금의 잔상',
        'cerberus': '케르베로스', 'charon': '카론', 'beelzebub': '바알세불', 'lucifer': '루시퍼'
    };

    const dispName = enemyNames[enemy.type] || enemy.name || enemy.type;
    
    infoPane.innerHTML = `
        <div class="col-detail-header">
            <div class="col-detail-icon">${enemy.icon}</div>
            <div class="col-detail-title-group">
                <div class="col-detail-title">${dispName}</div>
                <div class="col-detail-stats">
                    <span>체력: ${Math.floor(enemy.hp)}</span>
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
    
    const trees = [
        { apprentice: 'apprentice', t2: 'chainer', t3: 'executor', t4: 'transmuter' },
        { apprentice: 'apprentice', t2: 'talisman', t3: 'grandsealer', t4: 'cursed_talisman' },
        { apprentice: 'apprentice', t2: 'monk', t3: 'vajra', t4: 'asura' },
        { apprentice: 'apprentice', t2: 'archer', t3: 'voidsniper', t4: 'piercing_shadow' },
        { apprentice: 'apprentice', t2: 'ice', t3: 'absolutezero', t4: 'cocytus' },
        { apprentice: 'apprentice', t2: 'assassin', t3: 'abyssal', t4: 'reaper' },
        { apprentice: 'apprentice', t2: 'tracker', t3: 'seer', t4: 'doom_guide' },
        { apprentice: 'apprentice', t2: 'necromancer', t3: 'wraithlord', t4: 'forsaken_king' },
        { apprentice: 'apprentice', t2: 'guardian', t3: 'rampart', t4: 'void_gatekeeper' },
        { apprentice: 'apprentice', t2: 'alchemist', t3: 'midas', t4: 'philosopher' },
        { apprentice: 'apprentice', t2: 'mirror', t3: 'illusion', t4: 'oracle' },
        { apprentice: 'apprentice', t2: 'knight', t3: 'paladin', t4: 'eternal_wall' }
    ];

    trees.forEach(tree => {
        const row = document.createElement('div');
        row.className = 'ex-tree-row';
        
        row.appendChild(createExNode(tree.apprentice));
        row.appendChild(createArrow());
        row.appendChild(createExNode(tree.t2));
        row.appendChild(createArrow());
        row.appendChild(createExNode(tree.t3));
        row.appendChild(createArrow());
        row.appendChild(createExNode(tree.t4));
        
        container.appendChild(row);
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

    // Add '!' badge if unseen
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
                <div class="col-detail-title">${unit.name} [Tier ${unit.tier}]</div>
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
