/* allies_system.js - Core Mechanics (Canvas Optimized) */

let isMovingUnit = false;
window.draggedUnit = null; 

function executeMove(tower, targetSlot) {
    const oldSlot = tower.currentSlot;
    if (oldSlot === targetSlot) return;

    // Swap logic
    const occupant = towers.find(t => t.currentSlot === targetSlot);
    if (occupant) {
        occupant.currentSlot = oldSlot;
        occupant.lx = oldSlot.lx;
        occupant.ly = oldSlot.ly;
    } else {
        if (oldSlot) oldSlot.isOccupied = false;
    }

    tower.currentSlot = targetSlot;
    tower.lx = targetSlot.lx;
    tower.ly = targetSlot.ly;
    targetSlot.isOccupied = true;

    if (typeof GameLogger !== 'undefined') GameLogger.info(`🔄 Moved: ${tower.data.name}`);
    
    if (typeof getSelectedTower === 'function' && getSelectedTower() === tower) {
        showRangeIndicator(tower);
    }
}

function showRangeIndicator(tower) {
    if (!tower || tower.isShrine) return;
    const ri = document.getElementById('range-indicator');
    if (ri) ri.remove();
    const ai = document.getElementById('aura-indicator');
    if (ai) ai.remove();

    const indicator = document.createElement('div');
    indicator.id = 'range-indicator';
    const container = document.getElementById('game-container');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const currentScale = containerRect.width / LOGICAL_WIDTH;

    const finalRange = tower.range + (tower.rangeBonus || 0);
    indicator.style.width = `${finalRange * 2 * currentScale}px`;
    indicator.style.height = `${finalRange * 2 * currentScale}px`;
    indicator.style.left = `${tower.lx * currentScale}px`;
    indicator.style.top = `${tower.ly * currentScale}px`;
    
    container.appendChild(indicator);
}

function summonTower(targetSlot) {
    if (!targetSlot || targetSlot.isOccupied) return;

    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, Math.floor(window.towerCost - reduction));

    if (money < finalTowerCost || towers.filter(t => !t.isShrine).length >= maxTowers) {
        if (money < finalTowerCost) {
            if (typeof GameLogger !== 'undefined') GameLogger.warn("❌ Summon failed: Insufficient SE");
            if (typeof flashResourceError === 'function') flashResourceError('se');
        } else {
            if (typeof GameLogger !== 'undefined') GameLogger.warn("🚫 Summon failed: Max Unit Limit (16)");
        }
        updateSummonButtonState();
        return;
    }

    money -= finalTowerCost;
    if (typeof updateGauges === 'function') updateGauges();

    const apprenticeData = unitTypes.find(u => u.type === 'apprentice');
    if (!apprenticeData) return;

    if (typeof GameLogger !== 'undefined') GameLogger.success(`✨ Summoned: ${apprenticeData.name}`);

    targetSlot.isOccupied = true;

    const tower = {
        data: apprenticeData,
        currentSlot: targetSlot,
        lx: targetSlot.lx,
        ly: targetSlot.ly,
        level: 1,
        lastShot: 0,
        range: apprenticeData.range,
        cooldown: apprenticeData.cooldown,
        spentSE: finalTowerCost,
        isShrine: false
    };

    towers.push(tower);
    if (typeof recordUnlock === 'function') recordUnlock('apprentice');
    window.towerCost += 5;
    updateSummonButtonState();
}

function summonShrine() {
    if (!window.logicalSlots) return;
    const emptySlots = window.logicalSlots.filter(s => s.type === 'shrine' && !s.isOccupied);

    if (money < window.shrineCost) {
        if (typeof GameLogger !== 'undefined') GameLogger.warn("❌ Shrine failed: Insufficient SE");
        if (typeof flashResourceError === 'function') flashResourceError('se');
        return;
    }

    if (emptySlots.length === 0) return;

    money -= window.shrineCost;
    window.shrineCost += window.shrineCostIncrement;
    if (typeof updateGauges === 'function') updateGauges();

    const randomSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
    const data = shrineTypes[0]; 

    if (typeof GameLogger !== 'undefined') GameLogger.success(`🕍 Shrine Created: ${data.name}`);

    randomSlot.isOccupied = true;

    const tower = {
        data: data,
        currentSlot: randomSlot,
        lx: randomSlot.lx,
        ly: randomSlot.ly,
        level: 1,
        lastShot: 0,
        range: 0,
        cooldown: 0,
        isShrine: true,
        isDemolishing: false
    };

    towers.push(tower);
    updateSummonButtonState();
}

function summonUnitAuto() {
    if (!window.logicalSlots) return;
    const emptySlots = window.logicalSlots.filter(s => s.type === 'unit' && !s.isOccupied);
    if (emptySlots.length > 0) {
        summonTower(emptySlots[Math.floor(Math.random() * emptySlots.length)]);
    }
}

function performJobChange(ntStr, fromInfo = false) {
    const tower = window.lastInspectedTower;
    if (!tower || tower.isShrine) return;

    const nt = unitTypes.find(u => u.type === ntStr);
    if (!nt) return;

    if (tower.data.tier === 1) {
        if (money < jobChangeCost) { if (typeof flashResourceError === 'function') flashResourceError('se'); return; }
        money -= jobChangeCost;
        if (typeof updateGauges === 'function') updateGauges();
    }

    if (typeof spawnPromotionBurst === 'function') {
        spawnPromotionBurst(tower.lx, tower.ly, nt.tier);
    }

    if (typeof GameLogger !== 'undefined') GameLogger.info(`🔝 Job Change: ${tower.data.name} -> ${nt.name}`);
    tower.data = nt; tower.range = nt.range; tower.cooldown = nt.cooldown; tower.spentSE += jobChangeCost;
    
    if (typeof recordUnlock === 'function') recordUnlock(nt.type);
    updateSummonButtonState();
    if (fromInfo) showUnitInfo(tower);
    if (typeof startInfoResetTimer === 'function') startInfoResetTimer();
    showRangeIndicator(tower);
}

function performMasterJobChange(tower, ntStr, fromInfo = false) {
    const nt = unitTypes.find(u => u.type === ntStr);
    if (!nt) return;

    if (typeof spawnPromotionBurst === 'function') {
        spawnPromotionBurst(tower.lx, tower.ly, nt.tier);
    }

    if (typeof GameLogger !== 'undefined') GameLogger.info(`👑 Master Promotion: ${tower.data.name} -> ${nt.name}`);
    tower.data = nt; tower.range = nt.range; tower.cooldown = nt.cooldown;

    if (typeof recordUnlock === 'function') recordUnlock(nt.type);
    if (nt.type === 'rampart') tower.charges = 5;
    updateSummonButtonState();
    if (fromInfo) showUnitInfo(tower);
    if (typeof startInfoResetTimer === 'function') startInfoResetTimer();
    showRangeIndicator(tower);
}

function confirmSacrifice(t) {
    const modal = document.getElementById('sacrifice-modal');
    const confirmBtn = document.getElementById('sacrifice-confirm-btn');
    const cancelBtn = document.getElementById('sacrifice-cancel-btn');
    if (!modal || !confirmBtn || !cancelBtn) return;

    modal.style.display = 'flex';
    isPaused = true;

    confirmBtn.onclick = () => {
        executeSacrifice(t);
        modal.style.display = 'none';
        isPaused = false;
    };
    cancelBtn.onclick = () => { modal.style.display = 'none'; isPaused = false; };
}

function executeSacrifice(t) {
    if (typeof GameLogger !== 'undefined') GameLogger.warn(`💀 Sacrificed: ${t.data.name}`);
    const s = t.currentSlot;
    if (s) s.isOccupied = false;

    if (typeof spawnBanishEffect === 'function') {
        spawnBanishEffect(t.lx, t.ly);
    }

    const idx = towers.indexOf(t);
    if (idx > -1) {
        const refundBase = (t.data.tier === 1) ? 15 : (t.data.tier === 2) ? 100 : 300;
        const refundRelicBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('sell_refund') : 0;
        money = Math.min(1000, money + Math.floor(refundBase * (1.0 + refundRelicBonus)));
        if (typeof updateGauges === 'function') updateGauges();
        towers.splice(idx, 1);
    }
    
    const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
    updateSummonButtonState();
}

function checkDemolitionCleanup() {
    for (let i = towers.length - 1; i >= 0; i--) {
        const t = towers[i];
        if (t.isShrine && t.isDemolishing) {
            if (typeof GameLogger !== 'undefined') GameLogger.success(`🧹 Demolition Complete: ${t.data.name}`);
            const s = t.currentSlot;
            if (s) s.isOccupied = false;
            towers.splice(i, 1);
        }
    }
    updateSummonButtonState();
}

window.performJobChange = performJobChange;
window.performMasterJobChange = performMasterJobChange;
window.confirmSacrifice = confirmSacrifice;
window.summonUnit = summonUnitAuto;
window.summonShrine = summonShrine;
window.executeMove = executeMove;
window.showRangeIndicator = showRangeIndicator;
window.checkDemolitionCleanup = checkDemolitionCleanup;
