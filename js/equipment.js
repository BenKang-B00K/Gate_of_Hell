/* js/equipment.js - Equipment (장비) System */

// equipmentTiers and equipmentSlots are now populated by data_loader.js from data/equipment.json

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
                <div style="font-size: 10px; color: #fff; margin-top: 3px; z-index:3;">${slotData.name}</div>
                <div class="equip-tier-label tier-${owned.tier}">${tierData.prefix}</div>
                ${owned.count > 1 ? `<div style="position:absolute; top:4px; right:6px; font-size:11px; color:#ffd700; z-index:3; font-weight:bold;">x${owned.count}</div>` : ''}
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
        <div class="relic-detail-title" style="color:#00e5ff; text-shadow: 0 0 10px rgba(0, 229, 255, 0.5); line-height:1.1;">
            <span style="font-size:11px; opacity:0.8; display:block;">[${tierData.prefix}]</span>
            <span style="font-size:16px;">${slotData.name}</span>
        </div>
        <div class="relic-detail-effect" style="color:#00ff00; font-size:11px;">현재 효과: ${slotData.label} ${dispBonus}</div>
        <div class="relic-detail-lore" style="border-color:#00e5ff; font-size:10px; padding:8px;">"심연의 악령들조차 이 ${slotData.name}의 빛 앞에서는 눈을 멀게 될 것입니다. 현재 ${owned.count}개 보유 중 (3개 수집 시 강화)"</div>
    `;
}

function renderEquipBonuses() {
    const bonusPane = document.getElementById('equip-bonus-pane');
    if (!bonusPane) return;

    let html = '<div class="equip-bonus-title" style="font-size:16px;">총 장비 효과</div>';
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
                <div class="total-bonus-item" style="color:#00e5ff; font-size:10px; padding:3px 8px; border-left-width:3px;">
                    <span>${slotData.label}</span>
                    <span class="val" style="font-weight:bold;">${dispBonus}</span>
                </div>
            `;
        }
    });

    if (!hasAny) {
        html += '<div style="color:#444; font-style:italic; text-align:center; margin-top:15px; font-size:12px;">장착된 장비가 없습니다.</div>';
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
                showEquipInfoInPanel(slot, owned.tier, true);
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

    showEquipInfoInPanel(slot, owned.tier);
    if (typeof saveGameData === 'function') saveGameData();
}

function showEquipInfoInPanel(slot, tier, isUpgrade = false) {
    const slotData = equipmentSlots[slot];
    const tierData = equipmentTiers[tier - 1];

    if (typeof GameLogger !== 'undefined') {
        if (isUpgrade) GameLogger.success(`🆙 Equipment Upgraded: ${slotData.name} -> [${tierData.prefix}]`);
        else GameLogger.success(`⚔️ Equipment Found: ${slotData.name} [${tierData.prefix}]`);
    }

    const d = document.getElementById('unit-info');
    if (!d) return;

    const bonusVal = getTierStatValue(tier, slot);
    const dispBonus = (['cooldown', 'crit_chance', 'damage', 'crit_damage', 'portal_dmg_reduction'].includes(slotData.stat))
        ? `+${(bonusVal * 100).toFixed(0)}%`
        : `+${bonusVal.toFixed(0)}`;

    // Set lock for 4 seconds
    window.infoPanelLockedUntil = Date.now() + 4000;

    d.innerHTML = `
        <div class="unit-info-title" style="color:#00e5ff;">⚔️ 장비 ${isUpgrade ? '강화!' : '획득!'}</div>
        <div style="color:#fff; font-size:12px; font-weight:bold; margin:4px 0;">${slotData.icon} ${slotData.name}</div>
        <div style="display:inline-block; background:#00e5ff; color:#000; padding:1px 6px; border-radius:3px; font-size:9px; font-weight:bold; margin-bottom:4px;">[${tierData.prefix}] 등급</div>
        <div style="font-size:10px; color:#00ff00; line-height:1.2;">효과: ${slotData.label} ${dispBonus}</div>
        <div class="unit-info-desc">"심연의 악령들조차 이 무구의 빛 앞에서는 눈을 멀게 될 것입니다."</div>
    `;

    // Auto reset after lock expires
    setTimeout(() => {
        if (typeof window.startInfoResetTimer === 'function') {
            window.infoPanelLockedUntil = 0;
            window.startInfoResetTimer();
        }
    }, 4050);
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
