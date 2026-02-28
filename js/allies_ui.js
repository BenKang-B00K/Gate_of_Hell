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
    // 1. Setup Slots
    slots.length = 0; 
    createSlots('left-slots', 24); 
    createSlots('right-slots', 24);

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
    if(pc) pc.addEventListener('click', () => { if(typeof purgePortal === 'function') purgePortal(); });

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
    const finalTowerCost = Math.max(5, Math.floor(towerCost - reduction));

    if(scd) scd.innerText = `${finalTowerCost} SE`;

    const isMax = towers.length >= maxTowers;
    const isBroke = money < finalTowerCost;

    if (sw) {
        if (isMax) { sw.innerText = 'MAX UNITS'; sw.style.display = 'block'; }
        else if (isBroke) { sw.innerText = 'NOT ENOUGH SE'; sw.style.display = 'block'; }
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
    if (Date.now() < infoPanelLockedUntil) return;
    const d = document.getElementById('unit-info');
    if (!d) return;

    const data = tower.data;
    const finalDmg = Math.round(data.damage * (window.damageMultiplier || 1.0) * (1.0 + (tower.damageBonus || 0)));
    
    let th = `<div style="color:#ffd700; font-weight:bold; font-size:32px; margin-bottom:4px;">${data.name}</div>`;
    let ih = `<div style="font-size:24px; color:#bbb; margin-bottom:8px;">ATK: ${finalDmg} | Range: ${data.range} | CD: ${(tower.cooldown/1000).toFixed(1)}s</div>`;
    
    let ch = ''; 
    if(data.type === 'apprentice') {
        ch = `
            <div class="master-btn-container">
                <button class="info-promo-btn" onclick="performJobChange(null, 'Attack')">⚔️</button>
                <button class="info-promo-btn" onclick="performJobChange(null, 'Support')">🪄</button>
                <button class="info-promo-btn" onclick="performJobChange(null, 'Special')">💠</button>
            </div>
        `;
    } else if(data.upgrades) {
        ch = `<div class="master-btn-container">`;
        data.upgrades.forEach((u, i) => {
            const ud = unitTypes.find(x => x.type === u);
            if(ud) ch += `<button class="info-promo-btn" onclick="performMasterJobChange(null, '${u}')">${ud.icon}</button>`;
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
            corruptBtnElement.innerText = 'BEGIN CORRUPTION';
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
    if (money < cost) { showCorruptWarning("NOT ENOUGH SOUL ENERGY"); return; }
    if (typeof proceedEvolution === 'function') {
        if(!proceedEvolution(baseType, resultType, cost)) showCorruptWarning("SACRIFICE REQUIRED");
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
        if (d) d.innerHTML = '<div class="info-default-text">GUARDIANS<br><span style="font-size:30px; opacity:0.8;">of the</span><br>UNDERWORLD</div>';
        if(corruptBtnElement) { corruptBtnElement.remove(); corruptBtnElement = null; }
    }, 10000);
}

// Global Exports
window.initAllies = initAllies;
window.updateGauges = updateGauges;
window.updateSummonButtonState = updateSummonButtonState;
window.showUnitInfo = showUnitInfo;
window.showResourceInfo = (type) => {}; // Placeholder for legacy calls
