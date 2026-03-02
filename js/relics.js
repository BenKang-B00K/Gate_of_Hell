/* relics.js */

// relicsData is now populated by data_loader.js from data/relics.json

let collectedRelics = {}; // ID: count
let totalRelicBonuses = {
    damage: 0,
    range: 0,
    cooldown: 0,
    crit_chance: 0,
    crit_damage: 0,
    slow_strength: 0,
    portal_dmg_reduction: 0,
    summon_cost_reduction: 0,
    execute_threshold: 0,
    aura_range: 0,
    sell_refund: 0,
    shrine_mastery: 0
};

function initRelics() {
    const relicsBtn = document.getElementById('relics-btn');
    const relicsOverlay = document.getElementById('relics-overlay');
    const closeBtn = document.getElementById('close-relics');

    if (relicsBtn) {
        relicsBtn.onclick = () => {
            relicsOverlay.style.display = 'flex';
            if (typeof isPaused !== 'undefined') isPaused = true;
            renderRelicsGrid();
            const notif = document.getElementById('relics-notif');
            if (notif) notif.style.display = 'none';
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            relicsOverlay.style.display = 'none';
            if (typeof isPaused !== 'undefined') isPaused = false;
        };
    }
}

function renderRelicsGrid() {
    const grid = document.getElementById('relics-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const allRelicIds = Object.keys(relicsData);
    const normalRelics = allRelicIds.filter(id => ![ 'abyssal_boss', 'demon', 'supreme_boss'].includes(relicsData[id].dropSource));
    const supremeRelics = allRelicIds.filter(id => relicsData[id].dropSource === 'demon');
    const bossRelics = allRelicIds.filter(id => relicsData[id].dropSource ===  'abyssal_boss');
    const ancientRelics = allRelicIds.filter(id => relicsData[id].dropSource === 'supreme_boss');

    const createSlot = (id) => {
        const slot = document.createElement('div');
        const count = collectedRelics[id] || 0;
        const isCollected = count > 0;
        slot.className = `relic-slot ${isCollected ? '' : 'empty'}`;
        slot.style.position = 'relative';
        
        if (isCollected && window.unseenItems && window.unseenItems.has(id)) {
            const badge = document.createElement('div');
            badge.className = 'item-new-badge';
            badge.innerText = '!';
            slot.appendChild(badge);
        }

        let inner = relicsData[id].icon;
        if (count > 1) {
            inner += `<div style="position:absolute; bottom:3px; right:6px; font-size:21px; color:#fff; text-shadow:3px 3px 6px #000;">x${count}</div>`;
        }
        slot.innerHTML += inner;
        
        if (isCollected) {
            slot.addEventListener('click', () => {
                document.querySelectorAll('.relic-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                showRelicDetail(id);
                if (window.unseenItems && window.unseenItems.has(id)) {
                    window.unseenItems.delete(id);
                    const badge = slot.querySelector('.item-new-badge');
                    if (badge) badge.remove();
                    if (typeof saveGameData === 'function') saveGameData();
                }
            });
            slot.addEventListener('mouseenter', () => { showRelicDetail(id); });
        }
        return slot;
    };

    const addSection = (title, ids, color) => {
        if (ids.length === 0) return;
        const header = document.createElement('div');
        header.style.cssText = `grid-column: 1 / -1; color: ${color}; font-size: 30px; font-weight: bold; margin-top: 30px; border-bottom: 3px solid ${color}; padding-bottom: 6px;`;
        header.innerText = title;
        grid.appendChild(header);
        ids.forEach(id => grid.appendChild(createSlot(id)));
    };

    addSection('일반 유물', normalRelics, '#aaa');
    addSection('최상위 유물', supremeRelics, '#ff4500');
    addSection('지배자의 유물', bossRelics, '#ff1744');
    addSection('고대 유물', ancientRelics, '#ffd700');

    renderTotalBonuses();
}

function showRelicDetail(id) {
    const infoPane = document.getElementById('relic-info-pane');
    if (!infoPane) return;
    const data = relicsData[id];
    const count = collectedRelics[id] || 0;

    infoPane.innerHTML = `
        <div class="relic-detail-title">${data.name} ${count > 0 ? '(보유 중)' : '(미획득)'}</div>
        <div class="relic-detail-effect">${data.effect}</div>
        <div class="relic-detail-lore">"${data.lore}"</div>
    `;
}

function renderTotalBonuses() {
    const pane = document.getElementById('relic-bonus-pane');
    if (!pane) return;
    pane.innerHTML = '<div class="relic-bonus-title">총 유물 보너스</div>';

    totalRelicBonuses = {};
    for (let id in collectedRelics) {
        const count = collectedRelics[id];
        const relic = relicsData[id];
        if (relic && relic.bonus) {
            totalRelicBonuses[relic.bonus.type] = (totalRelicBonuses[relic.bonus.type] || 0) + (relic.bonus.value * count);
        }
    }

    const labels = {
        damage: "공격력 증가",
        range: "사거리 증가",
        cooldown: "공격 속도 증가",
        crit_chance: "치명타 확률",
        crit_damage: "치명타 피해량",
        slow_strength: "둔화 효과 강화",
        portal_dmg_reduction: "포탈 안정성",
        summon_cost_reduction: "소환 비용 절감",
        execute_threshold: "처형 임계치",
        aura_range: "범위 확장",
        sell_refund: "판매 환급 보너스",
        shrine_mastery: "성소 통달"
    };

    let bonusHtml = '';
    for (let key in labels) {
        const val = totalRelicBonuses[key] || 0;
        if (val !== 0) {
            let dispVal = "";
            if (['damage', 'cooldown', 'crit_chance', 'crit_damage', 'slow_strength', 'portal_dmg_reduction', 'sell_refund', 'shrine_mastery'].includes(key)) {
                dispVal = `+${(val * 100).toFixed(0)}%`;
            } else {
                dispVal = `+${val.toFixed(0)}`;
            }
            bonusHtml += `<div class="total-bonus-item"><span>${labels[key]}</span><span class="val">${dispVal}</span></div>`;
        }
    }
    pane.innerHTML += bonusHtml;
}

function collectRelic(id) {
    if (!relicsData[id]) return;
    const data = relicsData[id];
    const currentCount = collectedRelics[id] || 0;

    if (currentCount < data.maxStack) {
        collectedRelics[id] = currentCount + 1;
        if (typeof GameLogger !== 'undefined') GameLogger.success(`🏺 Relic Acquired: ${data.name}`);
        showRelicInfoInPanel(id);
        const notif = document.getElementById('relics-notif');
        if (notif) notif.style.display = 'flex';
        return true;
    }
    return false;
}

function showRelicInfoInPanel(id) {
    const d = document.getElementById('unit-info');
    if (!d) return;
    const data = relicsData[id];
    window.infoPanelLockedUntil = Date.now() + 4000;
    d.innerHTML = `
        <div style="color:#ff4500; font-weight:bold; font-size:39px; margin-bottom:6px;">🏺 유물 발견!</div>
        <div style="color:#fff; font-size:33px; font-weight:bold; margin-bottom:12px;">${data.icon} ${data.name}</div>
        <div style="font-size:27px; color:#00ff00; line-height:1.2;">효과: ${data.effect}</div>
        <div style="color:#555; font-size:25px; margin-top:18px; font-style:italic; line-height:1.2;">"${data.lore}"</div>
    `;
    setTimeout(() => { if (Date.now() >= window.infoPanelLockedUntil - 50) { window.infoPanelLockedUntil = 0; if(typeof window.startInfoResetTimer === 'function') window.startInfoResetTimer(); }}, 4050);
}

function checkRelicDrop(enemy) {
    if (Math.random() > 0.01) return;

    const specters = ['normal', 'mist', 'memory', 'shade', 'tank', 'runner'];
    const wraiths = ['defiled_apprentice', 'mimic', 'dimension', 'deceiver', 'cursed_vajra'];
    const spirits = ['boar', 'soul_eater', 'frost', 'frost_outcast', 'ember_hatred'];
    const demons = ['heavy', 'lava', 'burning', 'abyssal_acolyte', 'bringer_of_doom'];

    let possibleIds = [];
    for (let id in relicsData) {
        const data = relicsData[id];
        if ((collectedRelics[id] || 0) >= data.maxStack) continue;

        let canDrop = false;
        if (enemy.isBoss) {
            canDrop = true; 
        } else {
            const isNormal = ![ 'abyssal_boss', 'demon', 'supreme_boss'].includes(data.dropSource);
            if (isNormal) {
                if ([...specters, ...wraiths, ...spirits, ...demons].includes(enemy.type)) canDrop = true;
            } else if (data.dropSource === 'demon' && demons.includes(enemy.type)) {
                canDrop = true;
            } else if (data.dropSource === 'supreme_boss') {
                // Extremely rare drop from high demons or boss only
                if (demons.includes(enemy.type) && Math.random() < 0.05) canDrop = true;
            }
        }
        if (canDrop) possibleIds.push(id);
    }

    if (possibleIds.length > 0) {
        collectRelic(possibleIds[Math.floor(Math.random() * possibleIds.length)]);
    }
}

window.getRelicBonus = function(type) { return totalRelicBonuses[type] || 0; };
window.checkRelicDrop = checkRelicDrop;
window.initRelics = initRelics;
window.collectRelic = collectRelic;
document.addEventListener('DOMContentLoaded', initRelics);
