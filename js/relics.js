/* relics.js */

const relicsData = {
    'cursed_mask': { 
        name: "저주받은 한냐 가면", icon: '👺', 
        effect: "모든 아군의 피해량이 중첩당 +1% 증가합니다.", 
        lore: "수천 명의 잊혀진 영혼들의 비명으로 진동하는 가면입니다.", 
        bonus: { type: 'damage', value: 0.01 },
        maxStack: 20, dropSource: 'specter'
    },
    'spectral_lantern': { 
        name: "망령 등불", icon: '🏮', 
        effect: "모든 유닛의 공격 사거리가 10 증가합니다.", 
        lore: "이 등불의 빛은 길을 비추는 것이 아니라, 사냥감을 드러냅니다.", 
        bonus: { type: 'range', value: 10 },
        maxStack: 1, dropSource: 'wraith'
    },
    'stygian_oar': { 
        name: "스틱스강의 노", icon: '🛶', 
        effect: "모든 적의 이동 속도가 15% 감소합니다.", 
        lore: "강을 건너는 배의 속도를 조절하는 노입니다. 이제는 산 자의 시간을 늦춥니다.", 
        bonus: { type: 'slow_strength', value: 0.15 },
        maxStack: 1, dropSource:  'abyssal_boss'
    },
    'cerberus_fang': { 
        name: "케르베로스의 송곳니", icon: '🦴', 
        effect: "모든 아군의 공격력이 10% 증가합니다.", 
        lore: "지옥의 문지기의 날카로운 이빨입니다. 적의 본질을 찢는 힘을 줍니다.", 
        bonus: { type: 'damage', value: 0.1 },
        maxStack: 1, dropSource:  'abyssal_boss'
    },
    'gluttony_crown': { 
        name: "대식의 왕관", icon: '👑', 
        effect: "보물 유령의 출현 확률이 1% 증가합니다.", 
        lore: "더 많은 것을 갈구하게 만드는 저주받은 왕관입니다.", 
        bonus: { type: 'treasure_chance', value: 0.01 },
        maxStack: 1, dropSource:  'abyssal_boss'
    },
    'fallen_wings': { 
        name: "타락천사의 날개", icon: '🪽', 
        effect: "치명타 확률이 10% 증가합니다.", 
        lore: "순수한 어둠의 깃털입니다. 영혼의 가장 취약한 부분을 타격하도록 인도합니다.", 
        bonus: { type: 'crit_chance', value: 0.1 },
        maxStack: 1, dropSource:  'abyssal_boss'
    },
    'spectral_chain': { 
        name: "저주받은 자의 사슬", icon: '⛓️', 
        effect: "둔화 효과가 중첩당 2% 더 강력해집니다.", 
        lore: "적들이 저항할수록 사슬은 더 단단히 조여옵니다.", 
        bonus: { type: 'slow_strength', value: 0.02 },
        maxStack: 10, dropSource: 'spirit'
    },
    'unholy_grail': { 
        name: "부정 시종", icon: '🏆', 
        effect: "포탈 오염도가 중첩당 5% 더 천천히 증가합니다.", 
        lore: "문을 지키지 못한 자들의 눈물로 채워져 있습니다.", 
        bonus: { type: 'portal_dmg_reduction', value: 0.05 },
        maxStack: 5, dropSource: 'wraith'
    },
    'sacred_incense': { 
        name: "정화의 향로", icon: '🪔', 
        effect: "소환 비용 절감 효과가 중첩당 2 SE 증가합니다.", 
        lore: "부정한 기운을 밀어내는 향기입니다. 소환의 의식을 수월하게 합니다.", 
        bonus: { type: 'summon_cost_reduction', value: 2 },
        maxStack: 10, dropSource: 'specter'
    },
    'execution_mark': { 
        name: "처형자의 낙인", icon: '🗡️', 
        effect: "체력이 중첩당 1% 이하인 적을 즉시 처형합니다.", 
        lore: "낙인이 찍힌 자들에게 심연의 심판은 피할 수 없는 운명입니다.", 
        bonus: { type: 'execute_threshold', value: 0.01 },
        maxStack: 5, dropSource: 'wraith'
    },
    'cursed_coin': { 
        name: "저주받은 금화", icon: '🪙', 
        effect: "유닛 판매 시 환급받는 SE가 중첩당 2% 증가합니다.", 
        lore: "배신에는 대가가 따르며, 이 동전은 그 대가를 조금 더 달콤하게 만듭니다.", 
        bonus: { type: 'sell_refund', value: 0.02 },
        maxStack: 5, dropSource: 'all'
    },
    'abyssal_compass': { 
        name: "심연의 나침반", icon: '🧭', 
        effect: "모든 아군의 공격 사거리가 중첩당 +5 증가합니다.", 
        lore: "심연의 기운이 흐르는 방향을 가리킵니다. 적의 위치를 더 멀리서 포착할 수 있게 해줍니다.", 
        bonus: { type: 'range', value: 5 },
        maxStack: 10, dropSource: 'all'
    },
    'abyssal_lantern': { 
        name: "심연의 등불", icon: '🏮', 
        effect: "모든 아군의 공격력이 중첩당 +2% 증가합니다.", 
        lore: "심연의 어둠 속에서도 아군의 투지를 밝혀주는 등불입니다.", 
        bonus: { type: 'damage', value: 0.02 },
        maxStack: 10, dropSource: 'all'
    },
    'abyssal_fragment': { 
        name: "심연의 파편", icon: '💠', 
        effect: "모든 유닛의 공격 속도가 15% 증가합니다.", 
        lore: "심연의 심장에서 떨어져 나온 조각입니다. 주변의 시간을 가속시키는 힘이 있습니다.", 
        bonus: { type: 'cooldown', value: 0.15 },
        maxStack: 1, dropSource: 'demon'
    },
    'pitch_black_gem': { 
        name: "칠흑의 보석", icon: '💎', 
        effect: "치명타 피해량이 50% 증가합니다.", 
        lore: "모든 빛을 흡수하는 보석입니다. 적의 가장 깊은 어둠을 꿰뚫어 치명적인 타격을 입힙니다.", 
        bonus: { type: 'crit_damage', value: 0.5 },
        maxStack: 1, dropSource: 'demon'
    },
    'soul_link': { 
        name: "영혼의 고리", icon: '🔗', 
        effect: "소환 비용이 10 SE 추가로 감소합니다.", 
        lore: "퇴마사와 수호자 사이의 보이지 않는 연결입니다. 영적 소모를 최소화합니다.", 
        bonus: { type: 'summon_cost_reduction', value: 10 },
        maxStack: 1, dropSource: 'demon'
    },
    'immortal_remains': { 
        name: "불멸의 유해", icon: '💀', 
        effect: "포탈 오염도 증가량이 10% 감소합니다.", 
        lore: "죽음을 거부하는 자의 유골입니다. 성스러운 결계를 강화하여 오염에 저항합니다.", 
        bonus: { type: 'portal_dmg_reduction', value: 0.1 },
        maxStack: 1, dropSource: 'demon'
    },
    // [User Request] Ancient Relics
    'foresight_eye': { 
        name: "선견지명의 눈", icon: '🧿', 
        effect: "성소의 범위를 십자 방향(상/하/좌/우)으로 확장하고, 모든 성소의 효과 수치를 50% 강화합니다.", 
        lore: "인과 관계의 보이지 않는 실을 넘어, 존재하지 않는 기운마저 끌어다 씁니다.", 
        bonus: { type: 'shrine_mastery', value: 0.5 },
        maxStack: 1, dropSource: 'supreme_boss'
    },
};

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
