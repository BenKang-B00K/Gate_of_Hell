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
    
    // [User Request] Calculate Attack Speed (AS) = Attacks per second
    const attackSpeed = (1000 / tower.cooldown).toFixed(1);
    
    let th = `<div class="unit-info-title" style="font-size:42px; margin-bottom:10px;">${data.name}</div>`;
    
    let ih = `
        <div style="display:flex; justify-content:center; gap:20px; margin-bottom:10px; width:100%;">
            <div class="unit-info-stats" style="flex:1; border-color:#ff4500; padding:5px 10px;">
                <span style="color:#ff4500; font-size:18px; display:block; font-weight:bold;">ATTACK</span>
                <span style="font-size:30px; font-weight:900;">${finalDmg}</span>
            </div>
            <div class="unit-info-stats" style="flex:1; border-color:#00e5ff; padding:5px 10px;">
                <span style="color:#00e5ff; font-size:18px; display:block; font-weight:bold;">RANGE</span>
                <span style="font-size:30px; font-weight:900;">${data.range}</span>
            </div>
            <div class="unit-info-stats" style="flex:1; border-color:#ffd700; padding:5px 10px;">
                <span style="color:#ffd700; font-size:18px; display:block; font-weight:bold;">AS (Spd)</span>
                <span style="font-size:30px; font-weight:900;">${attackSpeed}</span>
            </div>
        </div>
    `;

    // Minimized Divider
    let divider = `<div style="width:90%; height:1px; background:linear-gradient(90deg, transparent, #ffd70044, transparent); margin:8px 0;"></div>`;
    
    let ch = ''; 
    if(data.type === 'apprentice') {
        ch = `
            <div style="color:#888; font-size:18px; margin-bottom:5px; text-transform:uppercase; letter-spacing:2px; font-weight:bold;">전직 경로 선택</div>
            <div class="master-btn-container" style="margin-top:0; gap:10px;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Attack', true)" style="width:70px; height:70px; font-size:40px !important;">⚔️</button>
                    <span style="font-size:16px; color:#ff4500; font-weight:bold;">공격형</span>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Support', true)" style="width:70px; height:70px; font-size:40px !important;">🪄</button>
                    <span style="font-size:16px; color:#00e5ff; font-weight:bold;">지원형</span>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Special', true)" style="width:70px; height:70px; font-size:40px !important;">💠</button>
                    <span style="font-size:16px; color:#ffd700; font-weight:bold;">특수형</span>
                </div>
            </div>
        `;
    } else if(data.upgrades) {
        ch = `
            <div style="color:#888; font-size:18px; margin-bottom:5px; text-transform:uppercase; letter-spacing:2px; font-weight:bold;">마스터 승급</div>
            <div class="master-btn-container" style="margin-top:0; gap:10px;">
        `;
        data.upgrades.forEach((u, i) => {
            const ud = unitTypes.find(x => x.type === u);
            if(ud) {
                const cost = (ud.tier === 4) ? 800 : 400;
                ch += `
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <button class="info-promo-btn" onclick="performMasterJobChange(null, '${u}', true)" style="width:70px; height:70px; font-size:40px !important;">${ud.icon}</button>
                        <span style="font-size:16px; color:#aaa; font-weight:bold;">${ud.name}</span>
                    </div>
                `;
            }
        });
        ch += `</div>`;
    }

    // [User Request] Enhanced Description Styling
    let desc = `
        <div style="margin-top:12px; padding:12px 25px; background:rgba(255,215,0,0.05); border-radius:15px; border-left:4px solid #ffd700; width:90%; box-sizing:border-box; position:relative;">
            <div style="position:absolute; top:5px; left:10px; font-size:14px; color:#ffd700; opacity:0.5; font-family:serif;">SCROLL OF DESTINY</div>
            <div style="color:#ccc; font-size:24px; line-height:1.4; font-style:italic; text-shadow:1px 1px 2px #000;">
                "${data.desc}"
            </div>
        </div>
    `;

    d.innerHTML = `${th}${ih}${divider}${ch}${desc}`;
    
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

/**
 * Visual feedback for insufficient resources
 */
function flashResourceError(type) {
    let el;
    if (type === 'se') el = document.getElementById('se-label');
    else if (type === 'pe') el = document.getElementById('pe-label');
    
    if (el) {
        el.classList.add('shake-error');
        setTimeout(() => el.classList.remove('shake-error'), 500);
    }
}

function startInfoResetTimer() {
    if (infoResetTimer) clearTimeout(infoResetTimer);
    infoResetTimer = setTimeout(() => {
        const d = document.getElementById('unit-info');
        if (d) {
            d.innerHTML = `
                <div class="info-default-text" style="font-size:36px; opacity:0.6;">GATE OF HELL</div>
                <div style="color:#555; font-size:24px; margin-top:10px; letter-spacing:8px; font-weight:bold;">SACRED TABLET</div>
                <div style="width:60%; height:1px; background:linear-gradient(90deg, transparent, #ffd70044, transparent); margin:15px 0;"></div>
                <div style="color:#444; font-size:18px; font-style:italic;">"영혼을 정화하는 성스러운 기록이 이곳에 새겨집니다."</div>
            `;
        }
        
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

    let divider = `<div style="width:80%; height:2px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); margin:25px 0;"></div>`;

    if (type === 'se') {
        d.innerHTML = `
            <div style="color:#00e5ff; font-weight:bold; font-size:48px; margin-bottom:10px; text-shadow:0 0 20px #00e5ff;">SOUL ENERGY</div>
            <div style="display:inline-block; background:#008ba3; color:#fff; padding:6px 20px; border-radius:15px; font-size:28px; font-weight:bold; margin-bottom:20px; border:2px solid #00e5ff;">✨ 성스러운 결정체</div>
            <div style="font-size:30px; color:#ccc; line-height:1.4; padding: 0 50px;">퇴마사를 소환하고 진화시키는 데 필요한 본질적인 에너지입니다. 악령을 정화(처치)하여 획득할 수 있습니다.</div>
            ${divider}
            <div style="color:#666; font-size:26px; font-style:italic; line-height:1.3; padding: 0 60px;">"정화된 미련의 결정체로, 산 자의 세계를 지키는 성스러운 기술의 원동력입니다."</div>
        `;
    } else if (type === 'pe') {
        d.innerHTML = `
            <div style="color:#ff00ff; font-weight:bold; font-size:48px; margin-bottom:10px; text-shadow:0 0 20px #ff00ff;">PORTAL CORRUPTION</div>
            <div style="display:inline-block; background:#4b0082; color:#fff; padding:6px 20px; border-radius:15px; font-size:28px; font-weight:bold; margin-bottom:20px; border:2px solid #ff00ff;">👿 문의 오염도</div>
            <div style="font-size:30px; color:#ccc; line-height:1.4; padding: 0 50px;">심연과 이승 사이 문의 불안정성을 나타냅니다. 악령이 통과할 때마다 증가하며, <strong>100%</strong>에 도달하면 문이 붕괴되어 세계가 멸망합니다.</div>
            ${divider}
            <div style="color:#666; font-size:26px; font-style:italic; line-height:1.3; padding: 0 60px;">"두 세계 사이의 가교는 연약합니다. 반대편의 슬픔이 너무 많이 유입되면 완전히 산산조각날 것입니다."</div>
        `;
    } else if (type === 'rs') {
        d.innerHTML = `
            <div style="color:#ff1744; font-weight:bold; font-size:48px; margin-bottom:10px; text-shadow:0 0 20px #ff1744;">REMAINING SPECTERS</div>
            <div style="display:inline-block; background:#b71c1c; color:#fff; padding:6px 20px; border-radius:15px; font-size:28px; font-weight:bold; margin-bottom:20px; border:2px solid #ff1744;">💀 잔존 악령 수</div>
            <div style="font-size:30px; color:#ccc; line-height:1.4; padding: 0 50px;">현재 구역(Depth)에 잔류하고 있는 악령의 총량입니다. 모든 악령을 정화하면 심연의 더 깊은 곳으로 진입할 수 있습니다.</div>
            ${divider}
            <div style="color:#666; font-size:26px; font-style:italic; line-height:1.3; padding: 0 60px;">"그들은 그림자의 파도처럼 몰려옵니다. 마지막 하나가 쓰러질 때까지 굳건히 버티십시오."</div>
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

    let divider = `<div style="width:80%; height:2px; background:linear-gradient(90deg, transparent, #ff450066, transparent); margin:15px 0;"></div>`;

    let th = `<div style="color:#ff4500; font-weight:bold; font-size:42px; margin-bottom:10px; text-shadow:0 0 15px #ff4500;">${dispName}</div>`;
    
    let ih = `
        <div style="display:flex; justify-content:center; gap:20px; margin-bottom:15px; width:100%; padding: 0 40px;">
            <div class="unit-info-stats" style="flex:2; border-color:#ff1744; background:rgba(183,28,28,0.1);">
                <span style="color:#ff1744; font-size:18px; display:block;">HEALTH</span>
                <span style="font-size:28px; font-weight:bold;">${hp} / ${maxHp}</span>
            </div>
            <div class="unit-info-stats" style="flex:1; border-color:#888; background:rgba(255,255,255,0.05);">
                <span style="color:#aaa; font-size:18px; display:block;">DEFENSE</span>
                <span style="font-size:28px; font-weight:bold;">${def}</span>
            </div>
        </div>
    `;
    
    // Effectiveness & Lore
    let eh = `<div style="color:#ff8a80; font-size:26px; margin-bottom:10px; padding: 0 50px;"><strong>특성:</strong> ${enemy.desc || "심연의 존재입니다."}</div>`;
    let lh = `<div style="color:#666; font-size:24px; font-style:italic; line-height:1.4; padding: 0 60px;">"${enemy.data?.lore || "이 영혼에 대한 기록이 없습니다."}"</div>`;

    d.innerHTML = `${th}${ih}${divider}${eh}${lh}`;
    startInfoResetTimer();
}

// Global Exports
window.initAllies = initAllies;
window.updateGauges = updateGauges;
window.updateSummonButtonState = updateSummonButtonState;
window.showUnitInfo = showUnitInfo;
window.showEnemyInfo = showEnemyInfo;
window.showResourceInfo = showResourceInfo;
window.flashResourceError = flashResourceError;
window.startInfoResetTimer = startInfoResetTimer;
