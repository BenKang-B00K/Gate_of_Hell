/* allies_system.js - Core Mechanics */

let isMovingUnit = false;

function executeMove(unit, targetSlot) {
    const oldSlot = unit.parentElement;
    if (oldSlot === targetSlot) { cancelMovement(); return; }
    if (targetSlot.classList.contains('occupied')) {
        const targetUnit = targetSlot.querySelector('.unit');
        if (targetUnit) {
            oldSlot.appendChild(targetUnit);
            targetSlot.appendChild(unit);
            const u1 = towers.find(t => t.element === unit);
            const u2 = towers.find(t => t.element === targetUnit);
            if (u1) u1.slotElement = targetSlot;
            if (u2) u2.slotElement = oldSlot;
        }
    } else {
        targetSlot.appendChild(unit);
        oldSlot.classList.remove('occupied');
        targetSlot.classList.add('occupied');
        const ud = towers.find(t => t.element === unit);
        if (ud) ud.slotElement = targetSlot;
    }

    // [User Request] Update range indicator to follow the unit to the new slot
    const t = towers.find(x => x.element === unit);
    if (t && unit.classList.contains('selected')) {
        showRangeIndicator(t);
    }

    cancelMovement();
}

function cancelMovement() { if (draggedUnit) draggedUnit.classList.remove('move-ready'); draggedUnit = null; isMovingUnit = false; }

function showRangeIndicator(tower) {
    const ri = document.getElementById('range-indicator');
    if (ri) ri.remove();
    const ai = document.getElementById('aura-indicator');
    if (ai) ai.remove();

    const indicator = document.createElement('div');
    indicator.id = 'range-indicator';
    indicator.className = 'range-indicator';
    
    // Scale for 1080p design but using 360 logical coordinates
    const finalRange = tower.range + (tower.rangeBonus || 0);
    indicator.style.width = `${finalRange * 2}px`;
    indicator.style.height = `${finalRange * 2}px`;
    
    const rect = tower.element.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    
    indicator.style.left = `${(rect.left + rect.width / 2) - containerRect.left}px`;
    indicator.style.top = `${(rect.top + rect.height / 2) - containerRect.top}px`;
    
    document.getElementById('game-container').appendChild(indicator);

    // If support unit, also show aura range
    if (['tracker', 'seer', 'commander', 'eternal_wall'].includes(tower.data.type)) {
        showAuraIndicator(tower);
    }
}

function showAuraIndicator(tower) {
    const ai = document.getElementById('aura-indicator');
    if (ai) ai.remove();

    const indicator = document.createElement('div');
    indicator.id = 'aura-indicator';
    indicator.className = 'aura-indicator';
    
    // Aura range: Base 195px covers ~1 tile in 1080p
    const relicAuraBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('aura_range') : 0;
    const auraRange = 195 + relicAuraBonus;
    
    indicator.style.width = `${auraRange * 2}px`;
    indicator.style.height = `${auraRange * 2}px`;
    
    const rect = tower.element.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    
    indicator.style.left = `${(rect.left + rect.width / 2) - containerRect.left}px`;
    indicator.style.top = `${(rect.top + rect.height / 2) - containerRect.top}px`;
    
    document.getElementById('game-container').appendChild(indicator);
}

/**
 * Updates or creates the context buttons (Promotion/Sell) that appear over a unit.
 */
function updateUnitOverlayButtons(tower) {
    const el = tower.element;
    if (!el) return;

    // Remove existing overlay buttons
    el.querySelectorAll('.unit-overlay-btn').forEach(b => b.remove());

    const data = tower.data;

    // Helper to create buttons with hover labels
    const createBtn = (className, icon, label, onClick) => {
        const btn = document.createElement('div');
        btn.className = `unit-overlay-btn ${className}`;
        btn.innerHTML = icon;
        btn.onclick = onClick;

        // Hover Label logic
        btn.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'unit-btn-tooltip';
            tooltip.innerText = label;
            tooltip.style.position = 'absolute';
            
            // [User Request] If it's the sell button (Corrupt), show tooltip BELOW (6 o'clock)
            if (className === 'sell-btn') {
                tooltip.style.top = '40px'; 
            } else {
                tooltip.style.top = '-25px';
            }
            
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.backgroundColor = 'rgba(0,0,0,0.8)';
            tooltip.style.color = '#fff';
            tooltip.style.padding = '2px 8px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.fontSize = '12px';
            tooltip.style.whiteSpace = 'nowrap';
            tooltip.style.zIndex = '100';
            tooltip.id = 'btn-tooltip-temp';
            btn.appendChild(tooltip);
        });
        btn.addEventListener('mouseleave', () => {
            const t = btn.querySelector('#btn-tooltip-temp');
            if (t) t.remove();
        });

        return btn;
    };

    // 1. Promotion Buttons (10, 12, 2 o'clock)
    if (data.type === 'apprentice') {
        el.appendChild(createBtn('promote-10', '⚔️', 'Attack', (e) => { e.stopPropagation(); performJobChange(el, 'Attack'); }));
        el.appendChild(createBtn('promote-12', '🪄', 'Support', (e) => { e.stopPropagation(); performJobChange(el, 'Support'); }));
        el.appendChild(createBtn('promote-2', '💠', 'Special', (e) => { e.stopPropagation(); performJobChange(el, 'Special'); }));
    } else if (data.upgrades && data.upgrades.length > 0) {
        data.upgrades.forEach((u, i) => {
            const ud = unitTypes.find(x => x.type === u);
            if (!ud) return;
            el.appendChild(createBtn(i === 0 ? 'promote-10' : 'promote-2', ud.icon, ud.name, (e) => { e.stopPropagation(); performMasterJobChange(tower, u); }));
        });
    }

    // 2. Sell Button (6 o'clock)
    el.appendChild(createBtn('sell-btn', '💀', 'Corrupt', (e) => { e.stopPropagation(); sellTower(tower); }));
}

function summonTower(targetSlot) {
    // 1. targetSlot validation
    if (!targetSlot || targetSlot.classList.contains('occupied')) return;

    // 2. Defensive Relic Bonus check & Cost calculation
    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, Math.floor(window.towerCost - reduction));

    // 3. Pre-summon validation (Resources & Limits)
    if (money < finalTowerCost || towers.length >= maxTowers) {
        if (money < finalTowerCost && typeof flashResourceError === 'function') flashResourceError('se');
        if (typeof updateSummonButtonState === 'function') updateSummonButtonState();
        return;
    }

    // 4. Execution: Deduct resources & update gauges
    money -= finalTowerCost;
    if (typeof updateGauges === 'function') updateGauges();

    // 5. Find 'apprentice' data & create DOM element
    const apprenticeData = unitTypes.find(u => u.type === 'apprentice');
    if (!apprenticeData) return;

    const unit = document.createElement('div');
    unit.classList.add('unit', 'apprentice', 'summoning');
    unit.title = apprenticeData.name;
    unit.innerText = ''; 
    unit.draggable = true;

    // Remove summoning class after animation
    setTimeout(() => {
        unit.classList.remove('summoning');
    }, 800);

    const cdOverlay = document.createElement('div');
    cdOverlay.className = 'cooldown-overlay';
    cdOverlay.style.pointerEvents = 'none';
    unit.appendChild(cdOverlay);

    // Attach Event Listeners (Drag & Click)
    let mousedownTime;
    unit.addEventListener('dragstart', function() { 
        draggedUnit = this; 
        isMovingUnit = true; 
        this.classList.add('selected'); 
        const t = towers.find(x => x.element === this); 
        if(t){
            showUnitInfo(t); 
            showRangeIndicator(t);
            startInfoResetTimer();
        } 
    });
    unit.addEventListener('mousedown', function(e) { if(e.button !== 0) return; mousedownTime = Date.now(); });
    unit.addEventListener('click', function(e) { 
        e.stopPropagation(); 
        if(Date.now() - mousedownTime < 400) { 
            document.querySelectorAll('.unit').forEach(u => u.classList.remove('selected')); 
            const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
            const ai = document.getElementById('aura-indicator'); if (ai) ai.remove();
            this.classList.add('selected'); 
            const t = towers.find(x => x.element === this); 
            if(t){
                showUnitInfo(t); 
                showRangeIndicator(t);
                startInfoResetTimer();
            } 
        } 
    });

    // 6. Insert into targetSlot and add 'occupied' class
    targetSlot.appendChild(unit);
    targetSlot.classList.add('occupied');

    // [User Request] Trigger Light Pillar Effect
    if (typeof spawnLightPillar === 'function') {
        const rect = targetSlot.getBoundingClientRect();
        const container = document.getElementById('game-container');
        if (container) {
            const containerRect = container.getBoundingClientRect();
            const lx = ((rect.left + rect.width / 2) - containerRect.left) * (LOGICAL_WIDTH / containerRect.width);
            const ly = ((rect.top + rect.height / 2) - containerRect.top) * (LOGICAL_HEIGHT / containerRect.height);
            spawnLightPillar(lx, ly);
        }
    }

    // 7. Construct Tower object (360x640 logical resolution context)
    const tower = {
        data: apprenticeData,
        element: unit,
        slotElement: targetSlot,
        range: apprenticeData.range,
        cooldown: apprenticeData.cooldown,
        lastShot: 0,
        spentSE: finalTowerCost // Store spent SE for refunds
    };
    towers.push(tower);

    // 8. Post-summon updates & synchronization
    window.towerCost += 5;
    updateUnitOverlayButtons(tower);
    updateSummonButtonState();
}

function purgePortal() {
    const pc = 800; const pa = portalEnergy * 0.5;
    if(money>=pc && portalEnergy>0) { money-=pc; portalEnergy=Math.max(0,portalEnergy-pa); if(typeof updateGauges==='function')updateGauges(); }
    else if(money < pc && typeof flashResourceError === 'function') flashResourceError('se');
}

function performJobChange(el, targetRole = null, fromInfo = false) {
    if (fromInfo) {
        const selectedTower = towers.find(t => t.element.classList.contains('selected'));
        if (!selectedTower) return;
        el = selectedTower.element;
    }
    const t = towers.find(x=>x.element===el); if(!t) return;
    const paths = [ {from:'apprentice', to:['chainer','talisman','monk','archer','ice','fire','assassin','tracker','necromancer','guardian','knight','alchemist','mirror']} ];
    const p = paths.find(x=>x.from===t.data.type); if(!p) return;

    // Filter paths by role and map limit (Limit 2 for Tier 2)
    const availablePaths = p.to.filter(type => {
        const ud = unitTypes.find(x => x.type === type);
        
        // [User Request Fix] Map English internal role keys to new Korean role names
        if (targetRole) {
            const roleMap = { 'Attack': '공격형', 'Support': '지원형', 'Special': '특수형' };
            const targetKoRole = roleMap[targetRole] || targetRole;
            // Use includes to match '숙련된 공격형', '숙련된 지원형', etc.
            if (!ud.role.includes(targetKoRole)) return false;
        }
        
        const count = towers.filter(tw => tw.data.type === type).length;
        return count < 2;
    });

    if (availablePaths.length === 0) {
        return;
    }

    if(money<jobChangeCost) {
        if (typeof flashResourceError === 'function') flashResourceError('se');
        return; 
    }

    // [User Request] Weighted Random Selection
    // If a unit already exists (count 1), give it a lower weight.
    let weightedPool = [];
    availablePaths.forEach(type => {
        const count = towers.filter(tw => tw.data.type === type).length;
        const weight = (count === 0) ? 10 : 2; // 5x higher chance for new types
        for (let i = 0; i < weight; i++) {
            weightedPool.push(type);
        }
    });

    const ntStr = weightedPool[Math.floor(Math.random() * weightedPool.length)]; 
    const nt = unitTypes.find(x=>x.type===ntStr);

    money -= jobChangeCost; 
    if(typeof updateGauges === 'function') updateGauges();

    el.className=`unit ${nt.type} selected`; el.title=nt.name; el.innerText='';
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);
    t.data=nt; t.range=nt.range; t.cooldown=nt.cooldown; t.spentSE+=jobChangeCost;
    updateUnitOverlayButtons(t);
    updateSummonButtonState();
    if (fromInfo) showUnitInfo(t);
    startInfoResetTimer();
    showRangeIndicator(t);
}

function performMasterJobChange(tower, ntStr, fromInfo = false) {
    if (fromInfo) {
        tower = towers.find(t => t.element.classList.contains('selected'));
        if (!tower) return;
    }
    const nt = unitTypes.find(x => x.type === ntStr);
    if (!nt) return;

    const existingCount = towers.filter(t => t.data.type === ntStr).length;
    if (existingCount >= 1) {
        // keep alert for map limit as it's not resource related
        alert(`You can only have 1 ${nt.name} at a time!`);
        return;
    }

    // Cost logic based on target tier
    const seCost = (nt.tier === 4) ? 800 : 400;
    if(money < seCost) {
        if (typeof flashResourceError === 'function') flashResourceError('se');
        return;
    }
    money -= seCost;
    tower.spentSE += seCost;
    
    if(typeof updateGauges==='function') updateGauges();
    
    const el = tower.element;
    el.className=`unit ${nt.type} selected`; el.title=nt.name; el.innerText='';
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);
    tower.data=nt; tower.range=nt.range; tower.cooldown=nt.cooldown; 
    
    if(nt.type==='rampart') tower.charges=5;
    updateUnitOverlayButtons(tower);
    updateSummonButtonState();
    if (fromInfo) showUnitInfo(tower);
    startInfoResetTimer();
    showRangeIndicator(tower);
}

function sellTower(t) {
    const modal = document.getElementById('sacrifice-modal');
    const confirmBtn = document.getElementById('sacrifice-confirm-btn');
    const cancelBtn = document.getElementById('sacrifice-cancel-btn');
    
    if (!modal || !confirmBtn || !cancelBtn) {
        // Fallback if elements not found
        if (confirm("수호자를 추방하시겠습니까?")) executeSacrifice(t);
        return;
    }

    // Show modal and pause game
    modal.style.display = 'flex';
    isPaused = true;

    // Remove old listeners to avoid stacking
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;

    confirmBtn.onclick = () => {
        modal.style.display = 'none';
        isPaused = false;
        executeSacrifice(t);
    };

    cancelBtn.onclick = () => {
        modal.style.display = 'none';
        isPaused = false;
    };
}

/**
 * Internal logic to actually remove the tower and refund SE
 */
function executeSacrifice(t) {
    const s = t.slotElement; 
    s.classList.remove('occupied'); 
    if (t.element) t.element.remove();
    
    const baseRefund = t.spentSE || 0;
    const relicRefundBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('sell_refund') : 0;
    const finalRefund = Math.floor(baseRefund * (0.5 + relicRefundBonus)); // 50% base refund
    
    money = Math.min(1000, money + finalRefund);
    if (typeof updateGauges === 'function') updateGauges();
    updateSummonButtonState();

    const idx = towers.indexOf(t); 
    if(idx > -1) towers.splice(idx, 1);
    
    // Clear info panel and indicators
    const d = document.getElementById('unit-info');
    if (d) d.innerHTML = '<div class="info-default-text">Gate of Hell<br><span style="font-size:30px; opacity:0.8;">악령들의 공세</span></div>';
    const ri = document.getElementById('range-indicator');
    if (ri) ri.remove();
    const ai = document.getElementById('aura-indicator');
    if (ai) ai.remove();
}

// Global Exports for UI interaction
window.performJobChange = performJobChange;
window.performMasterJobChange = performMasterJobChange;
window.sellTower = sellTower;
window.summonTower = summonTower;
window.executeMove = executeMove;
window.showRangeIndicator = showRangeIndicator;
window.showAuraIndicator = showAuraIndicator;

