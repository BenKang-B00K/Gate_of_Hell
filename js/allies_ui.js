/* allies_ui.js - Unified UI System (Slots, Info, and Corruption) */

let infoResetTimer = null;
let infoPanelLockedUntil = 0;
let selectedSlotData = null;
let currentFusionType = null;
let corruptBtnElement = null;

/**
 * Creates grid slots for unit placement.
 */
function createSlots(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const cell = document.createElement('div');
        cell.classList.add('card-slot');
        cell.dataset.col = i % 3;
        cell.dataset.area = containerId;
        slots.push(cell);
        container.appendChild(cell);
        
        // Interaction Listeners
        cell.addEventListener('click', function() { 
            if (typeof isMovingUnit !== 'undefined' && isMovingUnit && draggedUnit) {
                executeMove(draggedUnit, this); 
            }
        });
        cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('drag-over'); });
        cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
        cell.addEventListener('drop', e => { 
            e.preventDefault(); 
            cell.classList.remove('drag-over'); 
            if (draggedUnit) executeMove(draggedUnit, cell); 
        });
    }
}

/**
 * Main Initialization for Ally System UI
 */
function initAllies() {
    // 1. Setup Slots (7x3 grid = 21 slots per side)
    slots.length = 0; 
    createSlots('left-slots', 21); 
    createSlots('right-slots', 21);

    // 2. Summon Button Logic
    const tc = document.getElementById('tower-card');
    if(tc) {
        tc.addEventListener('click', () => { 
            if (towers.length >= maxTowers) {
                const warning = document.getElementById('max-units-warning');
                if (warning) {
                    warning.style.display = 'block';
                    setTimeout(() => { warning.style.display = 'none'; }, 1500);
                }
                return;
            }
            const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
            const finalTowerCost = Math.max(5, towerCost - reduction);
            if(money < finalTowerCost) return; 
            
            // Random placement logic
            const vs = slots.filter(c => !c.classList.contains('occupied'));
            if(vs.length > 0) {
                summonTower(vs[Math.floor(Math.random()*vs.length)]);
            }
        });
    }

    // 3. Purge Logic
    const pc = document.getElementById('purge-card'); 
    if(pc) {
        pc.addEventListener('click', () => { if(typeof purgePortal === 'function') purgePortal(); });
        pc.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d) {
                d.innerHTML = `
                    <div style="color:#9400d3; font-weight:bold; font-size:39px; margin-bottom:6px;">영혼 정화</div>
                    <div style="display:inline-block; background:#4b0082; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">기술</div>
                    <div style="font-size:27px; color:#bbb; line-height:1.2;">소울 에너지를 사용하여 포탈 오염도를 즉시 50% 제거합니다.</div>
                    <div style="color:#ff4500; font-size:24px; margin-top:12px;">비용: 800 SE</div>
                    <div style="color:#555; font-size:25.5px; margin-top:18px; font-style:italic; line-height:1.2;">"강력한 의지로 문의 균열을 억지로 닫습니다. 하지만 심연은 결코 멈추지 않을 것입니다."</div>
                `;
                startInfoResetTimer();
            }
        });
    }

    // 4. Resource Hover Info
    setupResourceTooltips();

    // 5. Initialize Corruption Warning Element
    if (!document.getElementById('corrupt-warning')) {
        const warning = document.createElement('div');
        warning.id = 'corrupt-warning';
        document.body.appendChild(warning);
    }

    updateGauges();
    updateSummonButtonState();
}

function setupResourceTooltips() {
    const sel = document.getElementById('se-label');
    if(sel) sel.addEventListener('mouseenter', () => showResourceInfo('se'));
    const pel = document.getElementById('pe-label');
    if(pel) pel.addEventListener('mouseenter', () => showResourceInfo('pe'));
    const rsl = document.getElementById('rs-label');
    if(rsl) rsl.addEventListener('mouseenter', () => showResourceInfo('rs'));
}

/**
 * Updates Soul Energy and Portal Energy Displays
 */
function updateGauges() {
    const moneyDisplay = document.getElementById('se-display-text');
    const peDisplay = document.getElementById('portal-energy-label');
    const peFill = document.getElementById('portal-gauge-fill');
    const seFill = document.getElementById('se-gauge-fill');

    if (moneyDisplay) moneyDisplay.innerText = Math.floor(money);
    if (peDisplay) peDisplay.innerText = `${Math.floor(portalEnergy)} / ${maxPortalEnergy}`;
    
    if (peFill) peFill.style.width = `${(portalEnergy / maxPortalEnergy) * 100}%`;
    if (seFill) seFill.style.width = `${Math.min((money / 1000) * 100, 100)}%`;
}

/**
 * Syncs Summon Card visual state
 */
function updateSummonButtonState() {
    const tc = document.getElementById('tower-card'); 
    if (!tc) return;

    const scd = document.getElementById('summon-cost-display');
    const sw = document.getElementById('summon-warning');

    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, Math.floor(window.towerCost - reduction));

    if(scd) scd.innerText = `${finalTowerCost} SE`;

    const isMax = towers.length >= maxTowers;
    const isBroke = money < finalTowerCost;

    if (sw) {
        if (isMax) { sw.innerText = '인원 초과'; sw.style.display = 'block'; }
        else if (isBroke) { sw.innerText = 'SE 부족'; sw.style.display = 'block'; }
        else { sw.style.display = 'none'; }
    }

    if (isMax || isBroke) {
        tc.classList.add('locked');
        tc.style.opacity = '0.5';
        tc.style.pointerEvents = 'none';
    } else {
        tc.classList.remove('locked');
        tc.style.opacity = '1';
        tc.style.pointerEvents = 'auto';
    }
}

/**
 * Displays detailed unit info in the bottom panel
 */
function showUnitInfo(tower) {
    // [User Request] Lock info panel for 3 seconds when showing unit info
    window.infoPanelLockedUntil = Date.now() + 3000;
    
    const d = document.getElementById('unit-info');
    if (!d) return;

    const data = tower.data;
    const finalDmg = Math.round(data.damage * (window.damageMultiplier || 1.0) * (1.0 + (tower.damageBonus || 0)));
    
    // Tier Naming Convention
    const tierNames = { 1: '견습', 2: '숙련된', 3: '마스터', 4: '심연' };
    const tierName = tierNames[data.tier] || '알 수 없음';

    let th = `<div style="color:#ffd700; font-weight:bold; font-size:32px; margin-bottom:4px;">[${tierName}] ${data.name}</div>`;
    let ih = `<div style="font-size:24px; color:#bbb; margin-bottom:8px;">공격력: ${finalDmg} | 사거리: ${data.range} | 쿨다운: ${(tower.cooldown/1000).toFixed(1)}초</div>`;
    
    let ch = ''; 
    if(data.type === 'apprentice') {
        ch = `
            <div class="master-btn-container">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Attack')">⚔️</button>
                    <span style="font-size:14px; color:#ff4500;">공격형</span>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Support')">🪄</button>
                    <span style="font-size:14px; color:#00e5ff;">지원형</span>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Special')">💠</button>
                    <span style="font-size:14px; color:#ffd700;">특수형</span>
                </div>
            </div>
        `;
    } else if(data.upgrades) {
        ch = `<div class="master-btn-container">`;
        data.upgrades.forEach((u, i) => {
            const ud = unitTypes.find(x => x.type === u);
            if(ud) {
                ch += `
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <button class="info-promo-btn" onclick="performMasterJobChange(null, '${u}')">${ud.icon}</button>
                        <span style="font-size:14px; color:#aaa; max-width:80px; text-align:center;">${ud.name}</span>
                    </div>
                `;
            }
        });
        ch += `</div>`;
    }

    d.innerHTML = `${th}${ih}${ch}<div style="color:#888; font-size:22px; margin-top:6px; line-height:1.2;">${data.desc}</div>`;
    
    // Check for Corruption (Tier 3)
    if (data.tier === 3) {
        updateEvolutionTree(data.type);
    } else {
        if(corruptBtnElement) { corruptBtnElement.remove(); corruptBtnElement = null; }
    }

    startInfoResetTimer();
}

/**
 * Specialized UI for Tier 3 -> Corruption Evolution
 */
function updateEvolutionTree(exorcistType) {
    const canCorrupt = (exorcistType === 'soul_reaper' || exorcistType === 'abyss_walker');
    if (canCorrupt) {
        const targetResult = (exorcistType === 'soul_reaper') ? 'reaper' : 'doom_guide';
        currentFusionType = exorcistType;

        if(!corruptBtnElement) {
            corruptBtnElement = document.createElement('div');
            corruptBtnElement.id = 'corrupt-btn-variant';
            corruptBtnElement.innerHTML = '💀 타락 의식 시작 💀';
            corruptBtnElement.addEventListener('click', () => attemptCorruption(exorcistType, targetResult));
            document.body.appendChild(corruptBtnElement);
        }
        updateCorruptButtonState();
    }
}

function updateCorruptButtonState() {
    if (!corruptBtnElement) return;
    const cost = 666; 
    if (money < cost) corruptBtnElement.classList.add('locked');
    else corruptBtnElement.classList.remove('locked');
}

function attemptCorruption(baseType, resultType) {
    const cost = 666; 
    if (money < cost) { showCorruptWarning("소울 에너지가 부족합니다"); return; }
    if (typeof proceedEvolution === 'function') {
        if(!proceedEvolution(baseType, resultType, cost)) showCorruptWarning("제물이 필요합니다");
    }
}

function showCorruptWarning(message) {
    const cw = document.getElementById('corrupt-warning');
    if (!cw) return;
    cw.innerHTML = `<strong>[타락]</strong> ${message}`;
    cw.style.display = 'block';
    setTimeout(() => { cw.style.display = 'none'; }, 3000);
}

function startInfoResetTimer() {
    if (infoResetTimer) clearTimeout(infoResetTimer);
    infoResetTimer = setTimeout(() => {
        const d = document.getElementById('unit-info');
        if (d) d.innerHTML = '<div class="info-default-text">Gate of Hell<br><span style="font-size:30px; opacity:0.8;">악령들의 공세</span></div>';
        
        // [User Request] Deselect units and clear indicators after 10 seconds
        document.querySelectorAll('.unit.selected').forEach(u => u.classList.remove('selected'));
        const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
        const ai = document.getElementById('aura-indicator'); if (ai) ai.remove();
        
        if(corruptBtnElement) { corruptBtnElement.remove(); corruptBtnElement = null; }
    }, 10000);
}

// Resource Info Function
function showResourceInfo(type) {
    if (Date.now() < infoPanelLockedUntil) return;
    const d = document.getElementById('unit-info');
    if (!d) return;

    if (type === 'se') {
        d.innerHTML = `
            <div style="color:#00e5ff; font-weight:bold; font-size:39px; margin-bottom:6px;">Soul Energy (SE)</div>
            <div style="display:inline-block; background:#008ba3; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">소울 에너지</div>
            <div style="font-size:27px; color:#bbb; line-height:1.2;">퇴마사를 소환하고 진화시키는 데 사용됩니다. 악령을 처치하여 획득합니다.</div>
            <div style="color:#555; font-size:25.5px; margin-top:18px; font-style:italic; line-height:1.2;">"정화된 미련의 결정체로, 산 자의 세계를 지키는 성스러운 기술의 원동력입니다."</div>
        `;
    } else if (type === 'pe') {
        d.innerHTML = `
            <div style="color:#ff00ff; font-weight:bold; font-size:39px; margin-bottom:6px;">Portal Energy (PE)</div>
            <div style="display:inline-block; background:#4b0082; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">포탈 오염도</div>
            <div style="font-size:27px; color:#bbb; line-height:1.2;">문의 불안정성을 나타냅니다. 악령이 통과할 때마다 증가하며, 100%에 도달하면 게임 오버됩니다.</div>
            <div style="color:#555; font-size:25.5px; margin-top:18px; font-style:italic; line-height:1.2;">"두 세계 사이의 가교는 연약합니다. 반대편의 슬픔이 너무 많이 유입되면 완전히 산산조각날 것입니다."</div>
        `;
    } else if (type === 'rs') {
        d.innerHTML = `
            <div style="color:#ff1744; font-weight:bold; font-size:39px; margin-bottom:6px;">Remaining Specters (RS)</div>
            <div style="display:inline-block; background:#b71c1c; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">남은 악령</div>
            <div style="font-size:27px; color:#bbb; line-height:1.2;">현재 Depth에서 아직 소멸시키지 못한 악령들의 수입니다.</div>
            <div style="color:#00ff00; font-size:24px; margin-top:12px;">* 모든 악령을 처치하면 더 깊은 심연으로 내려갑니다.</div>
            <div style="color:#555; font-size:25.5px; margin-top:18px; font-style:italic; line-height:1.2;">"그들은 그림자의 파도처럼 몰려옵니다. 마지막 하나가 쓰러질 때까지 굳건히 버티십시오."</div>
        `;
    }
    startInfoResetTimer();
}

function showEnemyInfo(enemy) {
    if (Date.now() < infoPanelLockedUntil) return;
    const d = document.getElementById('unit-info');
    if (!d) return;

    const names = { 'cerberus': '케르베로스', 'charon': '카론', 'beelzebub': '바알세불', 'lucifer': '루시퍼' };
    const dispName = enemy.data?.name || names[enemy.type] || enemy.type;
    const hp = Math.floor(enemy.hp);
    const maxHp = Math.floor(enemy.maxHp || hp);
    const def = enemy.defense || 0;

    let th = `<div style="color:#ff4500; font-weight:bold; font-size:32px; margin-bottom:4px;">${dispName}</div>`;
    let ih = `<div style="font-size:24px; color:#bbb; margin-bottom:8px;">체력: ${hp} / ${maxHp} | 방어력: ${def}</div>`;
    
    // Effectiveness & Lore
    let eh = `<div style="color:#ff8a80; font-size:22px; margin-bottom:4px;">특징: ${enemy.desc || "심연의 존재입니다."}</div>`;
    let lh = `<div style="color:#555; font-size:20px; font-style:italic; line-height:1.2;">"${enemy.data?.lore || "이 영혼에 대한 기록이 없습니다."}"</div>`;

    d.innerHTML = `${th}${ih}${eh}${lh}`;
    startInfoResetTimer();
}

// Global Exports
window.initAllies = initAllies;
window.updateGauges = updateGauges;
window.updateSummonButtonState = updateSummonButtonState;
window.showUnitInfo = showUnitInfo;
window.showEnemyInfo = showEnemyInfo;
window.showResourceInfo = showResourceInfo;
window.startInfoResetTimer = startInfoResetTimer;
