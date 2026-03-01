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
            const normalCatBtn = Array.from(catBtns).find(b => b.dataset.cat === 'normal');
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
            
            colInfoLockedUntil = 0;
            resetColInfo();
            if (tab === 'ghosts') renderGhostGrid('basic');
            else if (tab === 'exorcists') renderExorcistTree();
        };
    });

    catBtns.forEach(btn => {
        btn.onclick = () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const catMap = {
                'normal': 'basic',
                'enhanced': 'enhanced',
                'armoured': 'armoured',
                'boss': 'boss'
            };
            renderGhostGrid(catMap[btn.dataset.cat] || btn.dataset.cat);
        };
    });
});

function resetColInfo() {
    if (Date.now() < colInfoLockedUntil) return;
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
    grid.innerHTML = '';
    
    let pool = [];
    if (category === 'boss') {
        pool = Object.values(bossData);
    } else {
        pool = enemyCategories[category] || [];
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
            };
        }
        grid.appendChild(item);
    });
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
    const killCount = (window.killCounts && window.killCounts[enemy.type]) || 0;
    
    const enemyNames = {
        'normal': '평범한 원령', 'mist': '떠도는 안개', 'memory': '흐릿한 기억',
        'shade': '깜빡이는 그림자', 'tank': '죄악의 괴수', 'runner': '저주받은 도둑',
        'defiled_apprentice': '타락한 수련생', 'greedy': '탐욕스러운 악귀', 'mimic': '갈망의 상자',
        'dimension': '공허의 은둔자', 'deceiver': '거짓말의 기사', 'betrayer_blade': '그림자 배신자',
        'cursed_vajra': '타락한 금강', 'void_piercer': '무(無)의 궁수',
        'boar': '피의 사냥꾼', 'soul_eater': '영혼을 먹는 자', 'frost': '빙결된 원망', 
        'lightspeed': '필사적인 전령', 'frost_outcast': '얼어붙은 마음', 'ember_hatred': '증오의 불꽃',
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
