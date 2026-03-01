/* allies_ui.js - Unified UI System (Slots, Info, and Corruption) */

let infoResetTimer = null;
let infoPanelLockedUntil = 0;
let selectedSlotData = null;
let currentFusionType = null;
let corruptBtnElement = null;

/**
 * Creates unit slots in the UI (3x7 Grid on each side = 42 total slots)
 */
function initAllies() {
    const leftSlots = document.getElementById('left-slots');
    const rightSlots = document.getElementById('right-slots');
    if (!leftSlots || !rightSlots) return;

    leftSlots.innerHTML = '';
    rightSlots.innerHTML = '';

    // Create 21 slots for left side
    for (let i = 0; i < 21; i++) {
        const slot = createSlotElement(i, 'left-slots');
        leftSlots.appendChild(slot);
    }
    // Create 21 slots for right side (indices 21-41)
    for (let i = 21; i < 42; i++) {
        const slot = createSlotElement(i, 'right-slots');
        rightSlots.appendChild(slot);
    }

    attachGlobalListeners();
}

function createSlotElement(index, area) {
    const slot = document.createElement('div');
    slot.className = 'card-slot';
    slot.dataset.index = index;
    slot.dataset.area = area;
    
    slot.onclick = () => {
        if (typeof handleSlotClick === 'function') handleSlotClick(index);
    };

    // Drag and Drop Listeners
    slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot.classList.add('drag-over');
    });

    slot.addEventListener('dragleave', () => {
        slot.classList.remove('drag-over');
    });

    slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        if (window.draggedUnit && typeof executeMove === 'function') {
            executeMove(window.draggedUnit, slot);
        }
    });

    return slot;
}

let listenersAttached = false;
function attachGlobalListeners() {
    if (listenersAttached) return;

    // 1. Summon Button
    const summonBtn = document.getElementById('tower-card');
    if (summonBtn) {
        summonBtn.addEventListener('click', () => {
            if (typeof summonUnit === 'function') summonUnit();
        });
        summonBtn.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d) {
                const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
                const finalTowerCost = Math.max(5, Math.floor(window.towerCost - reduction));
                d.innerHTML = `
                    <div style="color:#4caf50; font-weight:bold; font-size:36px; margin-bottom:6px;">퇴마사 소환</div>
                    <div style="display:inline-block; background:#2e7d32; color:#fff; padding:3px 12px; border-radius:9px; font-size:22px; font-weight:bold; margin-bottom:10px;">의식</div>
                    <div style="font-size:24px; color:#bbb; line-height:1.2;">심연에 대항할 무작위 [견습 퇴마사]를 비어있는 제단에 소환합니다.</div>
                    <div style="color:#ffd700; font-size:22px; margin-top:10px;">비용: ${finalTowerCost} SE</div>
                    <div style="color:#555; font-size:22px; margin-top:15px; font-style:italic; line-height:1.2;">"부름에 응답한 자들이 어둠을 몰아낼 것입니다."</div>
                `;
                startInfoResetTimer();
            }
        });
    }

    // 2. Collections Button
    const colBtn = document.getElementById('collections-btn');
    if (colBtn) {
        colBtn.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d) {
                d.innerHTML = `
                    <div style="color:#ffd700; font-weight:bold; font-size:36px; margin-bottom:6px;">운명의 기록소</div>
                    <div style="display:inline-block; background:#8b6508; color:#fff; padding:3px 12px; border-radius:9px; font-size:22px; font-weight:bold; margin-bottom:10px;">기록소</div>
                    <div style="font-size:24px; color:#bbb; line-height:1.2;">지금까지 조우한 악령들의 정보와 수호자들의 전직 계보를 확인합니다.</div>
                    <div style="color:#555; font-size:22px; margin-top:15px; font-style:italic; line-height:1.2;">"지식은 심연에 대항하는 가장 강력한 무기입니다. 과거의 승리를 기록하고 미래를 준비하십시오."</div>
                `;
                startInfoResetTimer();
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
                    <div style="color:#ff1744; font-weight:bold; font-size:39px; margin-bottom:6px;">영혼 정화</div>
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

    listenersAttached = true;
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

    const isMax = towers.length >= 16; // Explicitly 16 as per maxTowers
    const isBroke = money < finalTowerCost;

    if (sw) {
        if (isMax) { 
            sw.innerText = '인원 초과'; 
            sw.style.display = 'block'; 
        } else if (isBroke) { 
            sw.innerText = 'SE 부족'; 
            sw.style.display = 'block'; 
        } else { 
            sw.style.display = 'none'; 
        }
    }

    if (isMax || isBroke) tc.classList.add('disabled');
    else tc.classList.remove('disabled');

    // Also handle Purge Card State
    const pc = document.getElementById('purge-card');
    const pw = document.getElementById('purge-warning');
    if (pc && pw) {
        if (money < 800) {
            pc.classList.add('disabled');
            pw.style.display = 'block';
        } else {
            pc.classList.remove('disabled');
            pw.style.display = 'none';
        }
    }
}

/**
 * Displays detailed unit info in the bottom panel
 */
function showUnitInfo(tower) {
    if (typeof GameLogger !== 'undefined') GameLogger.debug(`🔍 Inspecting Unit: ${tower.data.name}`);
    window.infoPanelLockedUntil = Date.now() + 5000;
    
    const d = document.getElementById('unit-info');
    if (!d) return;

    const data = tower.data;
    
    // 1. Attack Stats
    const baseDmg = data.damage;
    const finalDmg = Math.round(baseDmg * (window.damageMultiplier || 1.0) * (1.0 + (tower.damageBonus || 0)));
    const bonusDmg = finalDmg - baseDmg;
    
    // 2. Range Stats
    const baseRange = data.range;
    const bonusRange = tower.rangeBonus || 0;
    const finalRange = baseRange + bonusRange;
    
    // 3. Attack Speed Stats
    const sm = 1.0 + (tower.speedBonus || 0);
    const baseAS = (1000 / data.cooldown).toFixed(1);
    const finalAS = (baseAS * sm).toFixed(1);
    const bonusAS = (finalAS - baseAS).toFixed(1);
    
    // Helper to format bonus text
    const formatBonus = (val) => {
        if (val > 0) return `<span style="color:#00ff00; font-size:14px;">(+${val})</span>`;
        if (val < 0) return `<span style="color:#ff1744; font-size:14px;">(${val})</span>`;
        return "";
    };

    let th = `
        <div style="display:flex; align-items:center; justify-content:center; gap:15px; margin-bottom:4px;">
            <div class="unit-info-title" style="font-size:32px;">${data.name}</div>
            <button class="info-sacrifice-btn" onclick="triggerSacrificeFromInfo()">타락</button>
        </div>
    `;

    // Store tower for sacrifice trigger
    window.lastInspectedTower = tower;

    let ih = `
        <div style="display:flex; justify-content:center; gap:10px; margin-bottom:4px; width:100%;">
            <div class="unit-info-stats" style="flex:1; border-color:#ff4500; padding:2px 6px; min-width:70px;">
                <span style="color:#ff4500; font-size:14px; display:block; font-weight:bold;">ATTACK</span>
                <span style="font-size:20px; font-weight:900;">${baseDmg} ${formatBonus(bonusDmg)}</span>
            </div>
            <div class="unit-info-stats" style="flex:1; border-color:#00e5ff; padding:2px 6px; min-width:70px;">
                <span style="color:#00e5ff; font-size:14px; display:block; font-weight:bold;">RANGE</span>
                <span style="font-size:20px; font-weight:900;">${baseRange} ${formatBonus(bonusRange)}</span>
            </div>
            <div class="unit-info-stats" style="flex:1; border-color:#ffd700; padding:2px 6px; min-width:70px;">
                <span style="color:#ffd700; font-size:14px; display:block; font-weight:bold;">ATTACK SPEED</span>
                <span style="font-size:20px; font-weight:900;">${baseAS} ${formatBonus(bonusAS)}</span>
            </div>
        </div>
    `;
    let divider = `<div style="width:90%; height:1px; background:linear-gradient(90deg, transparent, #ffd70044, transparent); margin:4px 0;"></div>`;
    
    let ch = ''; 
    if(data.type === 'apprentice') {
        ch = `
            <div style="color:#888; font-size:14px; margin-bottom:2px; text-transform:uppercase; letter-spacing:2px; font-weight:bold;">전직 경로 선택</div>
            <div class="master-btn-container" style="margin-top:0; gap:12px;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Attack', true)" style="width:55px; height:55px; font-size:32px !important;">⚔️</button>
                    <span style="font-size:13px; color:#ff4500; font-weight:bold;">공격형</span>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Support', true)" style="width:55px; height:55px; font-size:32px !important;">🪄</button>
                    <span style="font-size:13px; color:#00e5ff; font-weight:bold;">지원형</span>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Special', true)" style="width:55px; height:55px; font-size:32px !important;">💠</button>
                    <span style="font-size:13px; color:#ffd700; font-weight:bold;">특수형</span>
                </div>
            </div>
        `;
    } else if(data.upgrades) {
        ch = `
            <div style="color:#888; font-size:14px; margin-bottom:2px; text-transform:uppercase; letter-spacing:2px; font-weight:bold;">마스터 승급</div>
            <div class="master-btn-container" style="margin-top:0; gap:12px;">
        `;
        data.upgrades.forEach((u, i) => {
            const ud = unitTypes.find(x => x.type === u);
            if(ud) {
                ch += `
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <button class="info-promo-btn" onclick="performMasterJobChange(null, '${u}', true)" style="width:55px; height:55px; font-size:32px !important;">${ud.icon}</button>
                        <span style="font-size:13px; color:#aaa; font-weight:bold;">${ud.name}</span>
                    </div>
                `;
            }
        });
        ch += `</div>`;
    }

    let desc = `
        <div style="margin-top:6px; padding:8px 15px; background:rgba(255,215,0,0.05); border-radius:12px; border-left:4px solid #ffd700; width:90%; box-sizing:border-box; position:relative;">
            <div style="position:absolute; top:2px; left:10px; font-size:10px; color:#ffd700; opacity:0.5; font-family:serif;">SCROLL OF DESTINY</div>
            <div style="color:#ccc; font-size:18px; line-height:1.2; font-style:italic; text-shadow:1px 1px 2px #000;">
                "${data.desc}"
            </div>
        </div>
    `;

    d.innerHTML = `${th}${ih}${divider}${ch}${desc}`;
    startInfoResetTimer();
}

function triggerSacrificeFromInfo() {
    if (window.lastInspectedTower) {
        if (typeof window.confirmSacrifice === 'function') {
            window.confirmSacrifice(window.lastInspectedTower);
        } else if (typeof confirmSacrifice === 'function') {
            confirmSacrifice(window.lastInspectedTower);
        }
    }
}

function showEnemyInfo(enemy) {
    if (!enemy) return;
    if (typeof GameLogger !== 'undefined') GameLogger.debug(`🔍 Inspecting Enemy: ${enemy.data?.name || enemy.type}`);
    window.infoPanelLockedUntil = Date.now() + 5000;
    const d = document.getElementById('unit-info');
    if (!d) return;

    const hp = Math.floor(enemy.hp);
    const maxHp = Math.floor(enemy.maxHp || hp);
    const def = enemy.defense || 0;

    let divider = `<div style="width:80%; height:1px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin:8px 0;"></div>`;
    
    // Priority: 1. enemy.data.name (Full thematic name) 2. enemy.type
    const dispName = enemy.data?.name || enemy.type;
    const dispLore = enemy.data?.lore || "이 영혼에 대한 기록이 없습니다.";
    const dispDesc = enemy.desc || "심연에서 솟아난 부정한 존재입니다.";

    let th = `<div style="color:#ff4500; font-weight:bold; font-size:32px; margin-bottom:4px; text-shadow:0 0 15px #ff4500;">${dispName}</div>`;
    
    let ih = `
        <div style="display:flex; justify-content:center; gap:10px; margin-bottom:8px; width:100%; padding: 0 15px;">
            <div class="unit-info-stats" style="flex:2; border-color:#ff1744; background:rgba(183,28,28,0.1); padding: 4px 8px;">
                <span style="color:#ff1744; font-size:14px; display:block; font-weight:bold;">HEALTH</span>
                <span style="font-size:22px; font-weight:bold;">${hp} / ${maxHp}</span>
            </div>
            <div class="unit-info-stats" style="flex:1; border-color:#888; background:rgba(255,255,255,0.05); padding: 4px 8px;">
                <span style="color:#aaa; font-size:14px; display:block; font-weight:bold;">DEFENSE</span>
                <span style="font-size:22px; font-weight:bold;">${def}</span>
            </div>
        </div>
    `;
    
    let eh = `<div style="color:#ff8a80; font-size:18px; margin-bottom:4px; padding: 0 20px;"><strong>특성:</strong> ${dispDesc}</div>`;
    let lh = `<div style="color:#666; font-size:16px; font-style:italic; line-height:1.2; padding: 0 30px;">"${dispLore}"</div>`;

    d.innerHTML = `${th}${ih}${divider}${eh}${lh}` ;
    startInfoResetTimer();
}

function showResourceInfo(type) {
    window.infoPanelLockedUntil = Date.now() + 5000;
    const d = document.getElementById('unit-info');
    if (!d) return;

    let divider = `<div style="width:80%; height:1px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin:12px 0;"></div>`;

    if (type === 'se') {
        d.innerHTML = `
            <div style="color:#00e5ff; font-weight:bold; font-size:32px; margin-bottom:4px; text-shadow:0 0 15px #00e5ff;">SOUL ENERGY</div>
            <div style="display:inline-block; background:#008ba3; color:#fff; padding:3px 12px; border-radius:12px; font-size:18px; font-weight:bold; margin-bottom:8px; border:1px solid #00e5ff;">✨ 성스러운 결정체</div>
            <div style="font-size:20px; color:#ccc; line-height:1.2; padding: 0 15px;">퇴마사를 소환하고 진화시키는 데 필요한 본질적인 에너지입니다. 악령을 정화(처치)하여 획득할 수 있습니다.</div>
            ${divider}
            <div style="color:#666; font-size:18px; font-style:italic; line-height:1.2; padding: 0 20px;">"정화된 미련의 결정체로, 산 자의 세계를 지키는 성스러운 기술의 원동력입니다."</div>
        `;
    } else if (type === 'pe') {
        d.innerHTML = `
            <div style="color:#ff00ff; font-weight:bold; font-size:32px; margin-bottom:4px; text-shadow:0 0 15px #ff00ff;">PORTAL CORRUPTION</div>
            <div style="display:inline-block; background:#4b0082; color:#fff; padding:3px 12px; border-radius:12px; font-size:18px; font-weight:bold; margin-bottom:8px; border:1px solid #ff00ff;">👿 문의 오염도</div>
            <div style="font-size:20px; color:#ccc; line-height:1.2; padding: 0 15px;">심연과 이승 사이 문의 불안정성을 나타냅니다. 악령이 통과할 때마다 증가하며, <strong>100%</strong>에 도달하면 문이 붕괴되어 세계가 멸망합니다.</div>
            ${divider}
            <div style="color:#666; font-size:18px; font-style:italic; line-height:1.2; padding: 0 20px;">"두 세계 사이의 가교는 연약합니다. 반대편의 슬픔이 너무 많이 유입되면 완전히 산산조각날 것입니다."</div>
        `;
    } else if (type === 'rs') {
        d.innerHTML = `
            <div style="color:#ff1744; font-weight:bold; font-size:32px; margin-bottom:4px; text-shadow:0 0 15px #ff1744;">REMAINING SPECTERS</div>
            <div style="display:inline-block; background:#b71c1c; color:#fff; padding:3px 12px; border-radius:12px; font-size:18px; font-weight:bold; margin-bottom:8px; border:1px solid #ff1744;">💀 잔존 악령 수</div>
            <div style="font-size:20px; color:#ccc; line-height:1.2; padding: 0 15px;">현재 구역(Depth)에 잔류하고 있는 악령의 총량입니다. 모든 악령을 정화하면 심연의 더 깊은 곳으로 진입할 수 있습니다.</div>
            ${divider}
            <div style="color:#666; font-size:18px; font-style:italic; line-height:1.2; padding: 0 20px;">"그들은 그림자의 파도처럼 몰려옵니다. 마지막 하나가 쓰러질 때까지 굳건히 버티십시오."</div>
        `;
    }
    startInfoResetTimer();
}

function flashResourceError(type) {
    const el = document.getElementById(`${type}-label`);
    if (el) {
        el.classList.add('shake-error');
        setTimeout(() => el.classList.remove('shake-error'), 400);
    }
}

function startInfoResetTimer() {
    if (infoResetTimer) clearTimeout(infoResetTimer);
    infoResetTimer = setTimeout(() => {
        if (Date.now() > window.infoPanelLockedUntil) {
            const d = document.getElementById('unit-info');
            if (d) {
                d.innerHTML = `
                    <div class="info-default-text">Gate of Hell<br><span style="font-size:30px; opacity:0.8;">악령들의 귀환</span></div>
                `;
            }
        } else {
            startInfoResetTimer(); // Retry later
        }
    }, 5000);
}

// Global Exports
window.initAllies = initAllies;
window.updateSummonButtonState = updateSummonButtonState;
window.showUnitInfo = showUnitInfo;
window.showEnemyInfo = showEnemyInfo;
window.showResourceInfo = showResourceInfo;
window.flashResourceError = flashResourceError;
window.startInfoResetTimer = startInfoResetTimer;
