/* js/equipment.js - Equipment (장비) System */

const equipmentTiers = [
    { id: 1, prefix: "일반", dropRate: 0.015 },
    { id: 2, prefix: "성스러운", dropRate: 0.005 },
    { id: 3, prefix: "전설의", dropRate: 0.001 },
    { id: 4, prefix: "숨겨진 고대", dropRate: 0.0002 }
];

const equipmentSlots = {
    helmet: { name: "성스러운 투구", icon: "🪖", stat: "damage", label: "공격력 증가" },
    armor: { name: "판금 갑옷", icon: "🧥", stat: "portal_dmg_reduction", label: "포탈 데미지 감소" },
    necklace: { name: "영혼의 목걸이", icon: "📿", stat: "se_gain", label: "SE 획득 보너스" },
    mainhand: { name: "심판의 검", icon: "🔮", stat: "cooldown", label: "공격 속도 증가" },
    offhand: { name: "마법서", icon: "📙", stat: "crit_damage", label: "치명타 피해량" },
    belt: { name: "퇴마 허리띠", icon: "🎗️", stat: "summon_cost_reduction", label: "소환 비용 절감" },
    gloves: { name: "응징의 장갑", icon: "🧤", stat: "crit_chance", label: "치명타 확률" },
    boots: { name: "차원 장화", icon: "👢", stat: "aura_range", label: "범위 확장" }
};

// State: Highest tier and count for each slot
// ownedEquipment[slot] = { tier: N, count: X }
window.ownedEquipment = {
    helmet: { tier: 0, count: 0 },
    armor: { tier: 0, count: 0 },
    necklace: { tier: 0, count: 0 },
    mainhand: { tier: 0, count: 0 },
    offhand: { tier: 0, count: 0 },
    belt: { tier: 0, count: 0 },
    gloves: { tier: 0, count: 0 },
    boots: { tier: 0, count: 0 }
};

document.addEventListener('DOMContentLoaded', () => {
    const equipBtn = document.getElementById('equip-btn');
    const equipOverlay = document.getElementById('equip-overlay');
    const closeBtn = document.getElementById('close-equip');

    if (equipBtn) {
        equipBtn.onclick = () => {
            equipOverlay.style.display = 'flex';
            if (typeof isPaused !== 'undefined') isPaused = true;
            renderEquipGrid();

            // Hide notification when opened
            const notif = document.getElementById('equip-notif');
            if (notif) notif.style.display = 'none';
        };
        // Reuse Sacred Tablet for hover
        equipBtn.onmouseenter = () => {
            const d = document.getElementById('unit-info');
            if (d) {
                d.innerHTML = `
                    <div style="color:#00e5ff; font-weight:bold; font-size:36px; margin-bottom:6px;">신성한 장비고</div>
                    <div style="display:inline-block; background:#006064; color:#fff; padding:3px 12px; border-radius:9px; font-size:22px; font-weight:bold; margin-bottom:10px;">병기고</div>
                    <div style="font-size:24px; color:#bbb; line-height:1.2;">심연에서 획득한 성스러운 무구들을 관리하고 강화합니다.</div>
                    <div style="color:#555; font-size:22px; margin-top:15px; font-style:italic; line-height:1.2;">"부러진 칼날도 퇴마사의 손에 들리면 악령을 베는 신검이 될 것입니다."</div>
                `;
                if (typeof startInfoResetTimer === 'function') startInfoResetTimer();
            }
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            equipOverlay.style.display = 'none';
            isPaused = false;
        };
    }
});

function renderEquipGrid() {
    const grid = document.getElementById('equip-grid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.keys(equipmentSlots).forEach(slotKey => {
        const slotData = equipmentSlots[slotKey];
        const owned = window.ownedEquipment[slotKey];
        const slotDiv = document.createElement('div');
        slotDiv.className = `equip-slot ${slotKey}`;
        
        if (owned.tier > 0) {
            const tierData = equipmentTiers[owned.tier - 1];
            slotDiv.classList.add(`tier-${owned.tier}`); // Apply tier class to slot
            slotDiv.innerHTML = `
                <div class="equip-icon">${slotData.icon}</div>
                <div style="font-size: 18px; color: #fff; margin-top: 5px; z-index:3;">${slotData.name}</div>
                <div class="equip-tier-label tier-${owned.tier}">${tierData.prefix}</div>
                ${owned.count > 1 ? `<div style="position:absolute; top:8px; right:12px; font-size:20px; color:#ffd700; z-index:3; font-weight:bold;">x${owned.count}</div>` : ''}
            `;

            // New Badge if unseen
            if (window.unseenItems && window.unseenItems.has(slotKey)) {
                const badge = document.createElement('div');
                badge.className = 'item-new-badge';
                badge.innerText = '!';
                slotDiv.appendChild(badge);
            }

            slotDiv.onclick = () => {
                document.querySelectorAll('.equip-slot').forEach(s => s.classList.remove('selected'));
                slotDiv.classList.add('selected');
                showEquipDetail(slotKey);

                // Clear unseen status
                if (window.unseenItems && window.unseenItems.has(slotKey)) {
                    window.unseenItems.delete(slotKey);
                    const badge = slotDiv.querySelector('.item-new-badge');
                    if (badge) badge.remove();
                    if (typeof saveGameData === 'function') saveGameData();
                }
            };
        } else {
            slotDiv.innerHTML = `<div style="font-size: 54px; opacity: 0.2;">${slotData.icon}</div>`;
            slotDiv.classList.add('empty');
        }
        grid.appendChild(slotDiv);
    });

    renderEquipBonuses();
}

function showEquipDetail(slotKey) {
    const infoPane = document.getElementById('equip-info-pane');
    if (!infoPane) return;
    const slotData = equipmentSlots[slotKey];
    const owned = window.ownedEquipment[slotKey];
    const tierData = equipmentTiers[owned.tier - 1];
    
    const bonusVal = getTierStatValue(owned.tier, slotKey);
    const dispBonus = (['cooldown', 'crit_chance', 'damage', 'crit_damage', 'portal_dmg_reduction'].includes(slotData.stat)) 
        ? `+${(bonusVal * 100).toFixed(1)}%` 
        : `+${bonusVal}`;

    infoPane.innerHTML = `
        <div class="relic-detail-title" style="color:#00e5ff; text-shadow: 0 0 15px rgba(0, 229, 255, 0.5); line-height:1.1;">
            <span style="font-size:20px; opacity:0.8; display:block;">[${tierData.prefix}]</span>
            <span style="font-size:32px;">${slotData.name}</span>
        </div>
        <div class="relic-detail-effect" style="color:#00ff00;">현재 효과: ${slotData.label} ${dispBonus}</div>
        <div class="relic-detail-lore" style="border-color:#00e5ff;">"심연의 악령들조차 이 ${slotData.name}의 빛 앞에서는 눈을 멀게 될 것입니다. 현재 ${owned.count}개 보유 중 (3개 수집 시 다음 등급으로 강화)"</div>
    `;
}

function renderEquipBonuses() {
    const bonusPane = document.getElementById('equip-bonus-pane');
    if (!bonusPane) return;

    let html = '<div class="equip-bonus-title">총 장비 효과</div>';
    let hasAny = false;

    Object.keys(equipmentSlots).forEach(slotKey => {
        const owned = window.ownedEquipment[slotKey];
        if (owned.tier > 0) {
            hasAny = true;
            const slotData = equipmentSlots[slotKey];
            const bonusVal = getTierStatValue(owned.tier, slotKey);
            const dispBonus = (['cooldown', 'crit_chance', 'damage', 'crit_damage', 'portal_dmg_reduction'].includes(slotData.stat)) 
                ? `+${(bonusVal * 100).toFixed(1)}%` 
                : `+${bonusVal}`;

            html += `
                <div class="total-bonus-item" style="color:#00e5ff; text-shadow: 0 0 8px rgba(0, 229, 255, 0.3); border-left-color: #00e5ff;">
                    <span>${slotData.label}</span>
                    <span class="val" style="text-shadow: 0 0 10px #00e5ff, 0 0 20px #00acc1;">${dispBonus}</span>
                </div>
            `;
        }
    });

    if (!hasAny) {
        html += '<div style="color:#444; font-style:italic; text-align:center; margin-top:30px; font-size:24px;">장착된 장비가 없습니다.</div>';
    }
    bonusPane.innerHTML = html;
}

function getTierStatValue(tier, slot) {
    if (tier === 0) return 0;
    // Basic scaling: T1: 5%, T2: 12%, T3: 25%, T4: 50%
    const scales = [0, 0.05, 0.12, 0.25, 0.50];
    // Special handling for flat values if any (none yet but good for future)
    return scales[tier];
}

// Logic: Handle drop from enemy
function checkEquipmentDrop(enemy) {
    const isBoss = enemy.isBoss || false;
    const baseMult = isBoss ? 10 : 1; // Bosses have 10x higher drop rate
    
    for (let i = equipmentTiers.length - 1; i >= 0; i--) {
        const tier = equipmentTiers[i];
        const finalRate = tier.dropRate * baseMult;
        
        if (Math.random() < finalRate) {
            const slots = Object.keys(equipmentSlots);
            const randomSlot = slots[Math.floor(Math.random() * slots.length)];
            addEquipment(randomSlot, tier.id);
            return; // Only drop one item
        }
    }
}

function addEquipment(slot, tier) {
    const owned = window.ownedEquipment[slot];
    
    // If drop is lower than current tier, we ignore or convert? 
    // User said: "Same tier 3 items -> upgrade". 
    // Usually, you collect T1 and merge to T2.
    
    if (tier < owned.tier) {
        // Drop is weaker than what we have, ignore or maybe give minor SE?
        return;
    }
    
    if (tier > owned.tier) {
        // Upgrade to new tier immediately if we found a better one
        owned.tier = tier;
        owned.count = 1;
    } else {
        // Same tier, increment count
        owned.count++;
        if (owned.count >= 3) {
            if (owned.tier < 4) {
                owned.tier++;
                owned.count = 1;
                showEquipToast(`${equipmentSlots[slot].name} 등급 상승!`, `[${equipmentTiers[owned.tier-1].prefix}] 등급으로 강화되었습니다.`);
            } else {
                owned.count = 3; // Max tier capped at 3 count
            }
        }
    }
    
    // Show notification badge
    const notif = document.getElementById('equip-notif');
    if (notif) notif.style.display = 'flex';
    if (!window.unseenItems) window.unseenItems = new Set();
    window.unseenItems.add(slot);

    showEquipToast(`장비 획득: ${equipmentSlots[slot].name}`, `[${equipmentTiers[owned.tier-1].prefix}] 등급을 발견했습니다.`);
    if (typeof saveGameData === 'function') saveGameData();
}

function showEquipToast(title, msg) {
    const container = document.getElementById('game-container');
    const toast = document.createElement('div');
    toast.className = 'relic-toast'; // Reuse relic toast style
    toast.style.borderColor = '#00e5ff';
    toast.innerHTML = `
        <div style="color:#00e5ff; font-weight:bold; font-size:24px;">${title}</div>
        <div style="color:#fff; font-size:18px;">${msg}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 500); }, 3000);
}

// Global hook for stats
function getEquipBonus(statName) {
    let total = 0;
    Object.keys(equipmentSlots).forEach(slot => {
        if (equipmentSlots[slot].stat === statName) {
            total += getTierStatValue(window.ownedEquipment[slot].tier, slot);
        }
    });
    return total;
}

window.checkEquipmentDrop = checkEquipmentDrop;
window.getEquipBonus = getEquipBonus;
