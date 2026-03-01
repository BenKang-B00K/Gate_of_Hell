/* relics.js */

const relicsData = {
    'cursed_mask': { 
        name: "저주받은 한냐 가면", icon: '👺', 
        effect: "모든 아군의 피해량이 중첩당 +1% 증가합니다.", 
        lore: "수천 명의 잊혀진 영혼들의 비명으로 진동하는 가면입니다.", 
        bonus: { type: 'damage', value: 0.01 },
        maxStack: 20, dropSource: 'basic'
    },
    'spectral_lantern': { 
        name: "유령 등불", icon: '🏮', 
        effect: "모든 유닛의 공격 사거리가 10 증가합니다.", 
        lore: "이 등불의 빛은 길을 비추는 것이 아니라, 사냥감을 드러냅니다.", 
        bonus: { type: 'range', value: 10 },
        maxStack: 1, dropSource: 'specialized'
    },
    'ancient_beads': { 
        name: "타락한 염주", icon: '📿', 
        effect: "모든 쿨다운이 중첩당 1% 감소합니다.", 
        lore: "각 알은 쓰러진 성자의 뼈로 깎아 만들어졌습니다.", 
        bonus: { type: 'cooldown', value: 0.01 },
        maxStack: 10, dropSource: 'all'
    },
    'soul_urn': { 
        name: "영혼을 묶는 단지", icon: '⚱️', 
        effect: "처치 시 획득하는 소울 에너지가 중첩당 +1 증가합니다.", 
        lore: "떠난 자들의 본질을 갈구하는 단지입니다.", 
        bonus: { type: 'se_gain', value: 1 },
        maxStack: 10, dropSource: 'all'
    },
    'withered_bell': { 
        name: "말라버린 사찰 종", icon: '🔔', 
        effect: "적 기절 지속 시간이 중첩당 2% 증가합니다.", 
        lore: "이 종소리는 산 자들을 위한 장례곡처럼 들립니다.", 
        bonus: { type: 'stun_duration', value: 0.02 },
        maxStack: 5, dropSource: 'all'
    },
    'broken_talisman': { 
        name: "피 묻은 부적", icon: '📜', 
        effect: "치명타 피해량이 중첩당 +0.5% 증가합니다.", 
        lore: "부적의 먹물은 수천 번의 희생으로 얻은 피와 섞여 있습니다.", 
        bonus: { type: 'crit_damage', value: 0.005 },
        maxStack: 50, dropSource: 'all'
    },
    'obsidian_mirror': { 
        name: "흑요석 거울", icon: '🪞', 
        effect: "투사체가 중첩당 2% 확률로 적을 관통합니다.", 
        lore: "태양이 결코 뜨지 않는 세상을 비춥니다.", 
        bonus: { type: 'pierce_chance', value: 0.02 },
        maxStack: 10, dropSource: 'all'
    },
    'rusted_scythe': { 
        name: "녹슨 사신의 낫", icon: '🧹', 
        effect: "적의 최대 체력이 중첩당 2% 감소합니다.", 
        lore: "녹조차도 영혼을 수확하는 칼날의 날카로움을 무디게 할 수 없습니다.", 
        bonus: { type: 'enemy_hp', value: -0.02 },
        maxStack: 10, dropSource: 'all'
    },
    'spectral_chain': { 
        name: "저주받은 자의 사슬", icon: '⛓️', 
        effect: "둔화 효과가 중첩당 2% 더 강력해집니다.", 
        lore: "적들이 저항할수록 사슬은 더 단단히 조여옵니다.", 
        bonus: { type: 'slow_strength', value: 0.02 },
        maxStack: 10, dropSource: 'fast'
    },
    'unholy_grail': { 
        name: "부정 시종", icon: '🏆', 
        effect: "포탈 오염도가 중첩당 5% 더 천천히 증가합니다.", 
        lore: "문을 지키지 못한 자들의 눈물로 채워져 있습니다.", 
        bonus: { type: 'portal_dmg_reduction', value: 0.05 },
        maxStack: 5, dropSource: 'specialized'
    },
    // Boss Artifacts
    'cerberus_fang': { 
        name: "케르베로스의 송곳니", icon: '🦴', 
        effect: "모든 아군의 공격력이 10% 증가합니다.", 
        lore: "세 개의 머리를 가진 수호자의 날카로운 이빨입니다. 여전히 지옥불의 열기를 품고 있습니다.", 
        bonus: { type: 'damage', value: 0.1 },
        maxStack: 1, dropSource: 'boss'
    },
    'stygian_oar': { 
        name: "스틱스 노", icon: '🛶', 
        effect: "모든 적의 이동 속도가 15% 감소합니다.", 
        lore: "스틱스 강을 건너 영혼들을 실어 나를 때 사용되었습니다. 이제는 시간의 흐름 자체를 늦춥니다.", 
        bonus: { type: 'enemy_speed', value: -0.15 },
        maxStack: 1, dropSource: 'boss'
    },
    'gluttony_crown': { 
        name: "폭식의 왕관", icon: '👑', 
        effect: "보물 악령의 출현 확률이 1% 증가합니다.", 
        lore: "부패의 냄새가 나는 왕관입니다. 그림자 속에서 가장 탐욕스러운 영혼들을 끌어냅니다.", 
        bonus: { type: 'treasure_chance', value: 0.01 },
        maxStack: 1, dropSource: 'boss'
    },
    'fallen_wings': { 
        name: "타락천사의 날개", icon: '🪽', 
        effect: "치명타 확률이 10% 증가합니다.", 
        lore: "순수한 어둠의 깃털입니다. 영혼의 가장 취약한 부분을 타격하도록 인도합니다.", 
        bonus: { type: 'crit_chance', value: 0.1 },
        maxStack: 1, dropSource: 'boss'
    },
    // [User Request] Supreme Relics (Drop from Armoured)
    'abyssal_fragment': { 
        name: "심연의 파편", icon: '💠', 
        effect: "모든 유닛의 공격 속도가 15% 증가합니다.", 
        lore: "심연의 심장에서 떨어져 나온 조각입니다. 주변의 시간을 가속시키는 힘이 있습니다.", 
        bonus: { type: 'cooldown', value: 0.15 },
        maxStack: 1, dropSource: 'armoured'
    },
    'pitch_black_gem': { 
        name: "칠흑의 보석", icon: '💎', 
        effect: "치명타 피해량이 50% 증가합니다.", 
        lore: "모든 빛을 흡수하는 보석입니다. 적의 가장 깊은 어둠을 꿰뚫어 치명적인 타격을 입힙니다.", 
        bonus: { type: 'crit_damage', value: 0.5 },
        maxStack: 1, dropSource: 'armoured'
    },
    'soul_link': { 
        name: "영혼의 고리", icon: '🔗', 
        effect: "소환 비용이 10 SE 추가로 감소합니다.", 
        lore: "퇴마사와 수호자 사이의 보이지 않는 연결입니다. 영적 소모를 최소화합니다.", 
        bonus: { type: 'summon_cost_reduction', value: 10 },
        maxStack: 1, dropSource: 'armoured'
    },
    'immortal_remains': { 
        name: "불멸의 유해", icon: '💀', 
        effect: "포탈 오염도 증가량이 10% 감소합니다.", 
        lore: "죽음을 거부하는 자의 유골입니다. 성스러운 결계를 강화하여 오염에 저항합니다.", 
        bonus: { type: 'portal_dmg_reduction', value: 0.1 },
        maxStack: 1, dropSource: 'armoured'
    },
    // Balanced Normal Relics
    'soul_candle': { 
        name: "영혼의 양초", icon: '🕯️', 
        effect: "견습 퇴마사 소환 비용이 중첩당 2 SE 감소합니다.", 
        lore: "방황하는 영혼들을 더 싼 가격에 인도하는 희미한 빛입니다.", 
        bonus: { type: 'summon_cost_reduction', value: 2 },
        maxStack: 10, dropSource: 'basic'
    },
    'blood_ring': { 
        name: "혈석 반지", icon: '🩸', 
        effect: "치명타 확률이 중첩당 +0.5% 증가합니다.", 
        lore: "착용자의 심장 박동에 맞춰 진동하며 급소를 찾아냅니다.", 
        bonus: { type: 'crit_chance', value: 0.005 },
        maxStack: 20, dropSource: 'all'
    },
    'execution_mark': { 
        name: "처형자의 낙인", icon: '🗡️', 
        effect: "체력이 중첩당 1% 이하인 적을 즉시 처형합니다.", 
        lore: "낙인이 찍힌 자들에게 심연의 심판은 피할 수 없는 운명입니다.", 
        bonus: { type: 'execute_threshold', value: 0.01 },
        maxStack: 5, dropSource: 'specialized'
    },
    'foresight_eye': { 
        name: "선견지명의 눈", icon: '🧿', 
        effect: "지원 유닛의 오라 범위가 중첩당 5 증가합니다.", 
        lore: "인과 관계의 보이지 않는 실을 읽어 유대를 강화합니다.", 
        bonus: { type: 'aura_range', value: 5 },
        maxStack: 10, dropSource: 'specialized'
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
            
            // Hide notification when opened
            const notif = document.getElementById('relics-notif');
            if (notif) notif.style.display = 'none';
        });
        relicsBtn.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d) {
                d.innerHTML = `
                    <div style="color:#ff4500; font-weight:bold; font-size:39px; margin-bottom:6px;">심연의 유물</div>
                    <div style="display:inline-block; background:#8b2200; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">수집품</div>
                    <div style="font-size:27px; color:#bbb; line-height:1.2;">적을 처치하여 획득할 수 있는 영구적인 글로벌 보너스입니다. 모두 수집하여 심연을 지배하세요.</div>
                    <div style="color:#555; font-size:25px; margin-top:18px; font-style:italic; line-height:1.2;">"몰락 속에서도 살아남은 권능의 유물들입니다. 각각 전설적인 영혼의 무게를 담고 있습니다."</div>
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
    // Normal: excluding boss and armoured
    const normalRelics = allRelicIds.filter(id => !['boss', 'armoured'].includes(relicsData[id].dropSource));
    // Supreme: boss and armoured
    const supremeRelics = allRelicIds.filter(id => ['boss', 'armoured'].includes(relicsData[id].dropSource));

    // Helper to create slots
    const createSlot = (id) => {
        const slot = document.createElement('div');
        const count = collectedRelics[id] || 0;
        const isCollected = count > 0;
        slot.className = `relic-slot ${isCollected ? '' : 'empty'}`;
        slot.style.position = 'relative';
        
        // Add new badge if unseen
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

                // Clear unseen status
                if (window.unseenItems && window.unseenItems.has(id)) {
                    window.unseenItems.delete(id);
                    const badge = slot.querySelector('.item-new-badge');
                    if (badge) badge.remove();
                    if (typeof saveGameData === 'function') saveGameData();
                }
            });
            slot.addEventListener('mouseenter', () => {
                showRelicDetail(id);
            });
        }
        return slot;
    };

    // Normal Section
    const normalHeader = document.createElement('div');
    normalHeader.style.cssText = 'grid-column: 1 / -1; color: #aaa; font-size: 30px; font-weight: bold; margin-top: 15px; border-bottom: 3px solid #333; padding-bottom: 6px;';
    normalHeader.innerText = '일반 유물';
    grid.appendChild(normalHeader);
    normalRelics.forEach(id => grid.appendChild(createSlot(id)));

    // Supreme Section
    const bossHeader = document.createElement('div');
    bossHeader.style.cssText = 'grid-column: 1 / -1; color: #ff4500; font-size: 30px; font-weight: bold; margin-top: 45px; border-bottom: 3px solid #ff4500; padding-bottom: 6px;';
    bossHeader.innerText = '최상위 유물';
    grid.appendChild(bossHeader);
    supremeRelics.forEach(id => grid.appendChild(createSlot(id)));

    renderTotalBonuses();
}

function renderTotalBonuses() {
    const bonusPane = document.getElementById('relic-bonus-pane');
    if (!bonusPane) return;

    let bonusHtml = '<div class="relic-bonus-title">총 유물 보너스</div>';
    let hasAnyBonus = false;

    const labels = {
        damage: "공격력 증가",
        range: "사거리 보너스",
        cooldown: "쿨다운 단축",
        se_gain: "SE 획득 보너스",
        stun_duration: "기절 시간 강화",
        crit_damage: "치명타 피해량",
        crit_chance: "치명타 확률",
        pierce_chance: "관통 확률",
        enemy_hp: "악령 체력 약화",
        enemy_speed: "악령 속도 둔화",
        treasure_chance: "보물 출현율",
        slow_strength: "둔화 효과 강화",
        portal_dmg_reduction: "포탈 안정성",
        summon_cost_reduction: "소환 비용 절감",
        execute_threshold: "처형 임계치",
        aura_range: "범위 확장",
        sell_refund: "판매 환급 보너스"
    };

    for (let key in totalRelicBonuses) {
        const val = totalRelicBonuses[key];
        if (val !== 0) {
            hasAnyBonus = true;
            let dispVal = val > 0 ? `+${(val * 100).toFixed(1)}%` : `${(val * 100).toFixed(1)}%`;
            if (['range', 'se_gain', 'summon_cost_reduction', 'aura_range'].includes(key)) {
                dispVal = val > 0 ? `+${val.toFixed(0)}` : `${val.toFixed(0)}`;
            }
            
            bonusHtml += `<div class="total-bonus-item">
                <span>${labels[key]}</span>
                <span class="val">${dispVal}</span>
            </div>`;
        }
    }

    if (!hasAnyBonus) {
        bonusHtml += '<div style="color:#666; font-style:italic; text-align:center; margin-top:30px; font-size:24px;">수집된 유물이 없습니다.</div>';
    }

    bonusPane.innerHTML = bonusHtml;
}

function showRelicDetail(id) {
    const infoPane = document.getElementById('relic-info-pane');
    if (!infoPane) return;
    const data = relicsData[id];
    const count = collectedRelics[id] || 0;
    
    infoPane.innerHTML = `
        <div class="relic-detail-title">${data.name} ${count > 1 ? '(x' + count + ')' : ''}</div>
        <div class="relic-detail-effect">${data.effect}</div>
        <div class="relic-detail-lore">"${data.lore}"</div>
    `;
}

function collectRelic(id) {
    const data = relicsData[id];
    const currentCount = collectedRelics[id] || 0;
    
    if (currentCount < data.maxStack) {
        if (currentCount === 0) {
            if (!window.unseenItems) window.unseenItems = new Set();
            window.unseenItems.add(id);
        }
        collectedRelics[id] = currentCount + 1;
        updateRelicBonuses();
        showRelicInfoInPanel(data);

        // Show notification badge
        const notif = document.getElementById('relics-notif');
        if (notif) notif.style.display = 'flex';

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
        <div style="color:#ffd700; font-weight:bold; font-size:39px; margin-bottom:6px;">✨ 유물 획득!</div>
        <div style="color:#ff4500; font-size:33px; font-weight:bold; margin-bottom:12px;">${relic.icon} ${relic.name}</div>
        <div style="display:inline-block; background:#00ff00; color:#000; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">새로운 힘이 깨어났습니다</div>
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
    const specializedWraiths = ['greedy', 'mimic', 'dimension', 'deceiver', 'boar', 'soul_eater', 'frost', 'frost_outcast', 'ember_hatred', 'betrayer_blade'];
    const FastSpecters = ['runner', 'lightspeed', 'void_piercer'];
    const armouredDemons = ['heavy', 'lava', 'burning', 'abyssal_acolyte', 'bringer_of_doom', 'cursed_vajra'];

    let possibleIds = [];
    const allIds = Object.keys(relicsData);

    allIds.forEach(id => {
        const data = relicsData[id];
        const currentCount = collectedRelics[id] || 0;
        if (currentCount >= data.maxStack) return;

        let canDrop = false;
        const isNormalRelic = !['boss', 'armoured'].includes(data.dropSource);

        if (enemy.isBoss) {
            canDrop = true; // Bosses can drop anything
        } else if (isNormalRelic) {
            // [User Request] Normal relics drop from Basic, Specialized, Fast, and Armoured
            if (basicSpecters.includes(enemy.type) || 
                specializedWraiths.includes(enemy.type) || 
                FastSpecters.includes(enemy.type) || 
                armouredDemons.includes(enemy.type)) {
                canDrop = true;
            }
        } else {
            // Supreme relics only drop from Armoured or Bosses (handled above)
            if (data.dropSource === 'armoured' && armouredDemons.includes(enemy.type)) {
                canDrop = true;
            }
        }

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
