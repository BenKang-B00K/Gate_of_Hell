/* allies_system.js - Core Mechanics */

let isMovingUnit = false;
window.draggedUnit = null; // Explicitly declare global

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

function cancelMovement() { 
    if (window.draggedUnit) window.draggedUnit.classList.remove('move-ready'); 
    window.draggedUnit = null; 
    isMovingUnit = false; 
    console.log("Movement cancelled or finished.");
}

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

function summonTower(targetSlot) {
    // 1. targetSlot validation
    if (!targetSlot || targetSlot.classList.contains('occupied')) return;

    // 2. Defensive Relic Bonus check & Cost calculation
    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, Math.floor(window.towerCost - reduction));

    // 3. Pre-summon validation (Resources & Limits)
    if (money < finalTowerCost || towers.length >= maxTowers) {
        if (money < finalTowerCost) {
            if (typeof GameLogger !== 'undefined') GameLogger.warn("❌ Summon failed: Insufficient Soul Energy");
            if (typeof flashResourceError === 'function') flashResourceError('se');
        } else if (towers.length >= maxTowers) {
            if (typeof GameLogger !== 'undefined') GameLogger.warn("❌ Summon failed: Maximum unit limit reached (16)");
        }
        if (typeof updateSummonButtonState === 'function') updateSummonButtonState();
        return;
    }

    // 4. Execution: Deduct resources & update gauges
    money -= finalTowerCost;
    if (typeof updateGauges === 'function') updateGauges();

    // 5. Find 'apprentice' data & create DOM element
    const apprenticeData = unitTypes.find(u => u.type === 'apprentice');
    if (!apprenticeData) return;

    if (typeof GameLogger !== 'undefined') GameLogger.success(`✨ Summoned: ${apprenticeData.name}`);

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
    
    // [User Request] Drag Follow Visual
    let dragGhost = null;

    unit.addEventListener('dragstart', function(e) { 
        window.draggedUnit = this; 
        isMovingUnit = true; 
        this.classList.add('dragging'); 
        
        // Create Visual Ghost
        dragGhost = this.cloneNode(true);
        dragGhost.classList.add('drag-ghost');
        dragGhost.style.position = 'fixed';
        dragGhost.style.pointerEvents = 'none';
        dragGhost.style.zIndex = '9999';
        dragGhost.style.opacity = '0.8';
        dragGhost.style.transform = 'translate(-50%, -50%) scale(1.2)';
        document.body.appendChild(dragGhost);

        // Hide native drag image
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);

        const moveGhost = (ev) => {
            if (dragGhost) {
                dragGhost.style.left = `${ev.clientX}px`;
                dragGhost.style.top = `${ev.clientY}px`;
            }
        };
        window.addEventListener('mousemove', moveGhost);
        this._moveGhost = moveGhost;

        // Hide clutter
        const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
        const ai = document.getElementById('aura-indicator'); if (ai) ai.remove();

        const t = towers.find(x => x.element === this); 
        if(t){
            showUnitInfo(t); 
            startInfoResetTimer();
        } 
    });

    unit.addEventListener('dragend', function() {
        this.classList.remove('dragging');
        isMovingUnit = false;
        if (dragGhost) {
            dragGhost.remove();
            dragGhost = null;
        }
        window.removeEventListener('mousemove', this._moveGhost);
    });
    unit.addEventListener('mousedown', function(e) { if(e.button !== 0) return; mousedownTime = Date.now(); });
    unit.addEventListener('click', function(e) { 
        e.stopPropagation(); 
        if(Date.now() - mousedownTime < 400) { 
            // 1. Clear previous selections
            document.querySelectorAll('.unit').forEach(u => u.classList.remove('selected')); 
            document.querySelectorAll('.card-slot').forEach(s => s.classList.remove('selected-slot'));
            
            const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
            const ai = document.getElementById('aura-indicator'); if (ai) ai.remove();
            
            // 2. Select this unit
            this.classList.add('selected'); 
            if (this.parentElement) this.parentElement.classList.add('selected-slot');
            
            window.draggedUnit = this; 
            isMovingUnit = true;      
            
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

    // [User Request] Record unlock for collections
    if (typeof recordUnlock === 'function') recordUnlock('apprentice');

    // 8. Post-summon updates & synchronization
    window.towerCost += 5;
    updateSummonButtonState();
}

function purgePortal() {
    const pc = 800; const pa = portalEnergy * 0.5;
    if(money>=pc && portalEnergy>0) { 
        money-=pc; 
        portalEnergy=Math.max(0,portalEnergy-pa); 
        if(typeof updateGauges==='function')updateGauges(); 

        // [User Request] Trigger Purge Effect
        if (typeof spawnPurgeEffect === 'function') {
            const container = document.getElementById('game-container');
            const portal = document.getElementById('portal');
            if (container && portal) {
                const containerRect = container.getBoundingClientRect();
                const portalRect = portal.getBoundingClientRect();
                const lx = ((portalRect.left + portalRect.width / 2) - containerRect.left) * (LOGICAL_WIDTH / containerRect.width);
                const ly = ((portalRect.top + portalRect.height / 2) - containerRect.top) * (LOGICAL_HEIGHT / containerRect.height);
                spawnPurgeEffect(lx, ly);
            }
        }
    }
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

    // [User Request] Trigger Promotion Burst Effect
    if (typeof spawnPromotionBurst === 'function') {
        const rect = el.getBoundingClientRect();
        const container = document.getElementById('game-container');
        if (container) {
            const containerRect = container.getBoundingClientRect();
            const lx = ((rect.left + rect.width / 2) - containerRect.left) * (LOGICAL_WIDTH / containerRect.width);
            const ly = ((rect.top + rect.height / 2) - containerRect.top) * (LOGICAL_HEIGHT / containerRect.height);
            spawnPromotionBurst(lx, ly, nt.tier);
        }
    }

    el.className=`unit ${nt.type} selected`; el.title=nt.name; el.innerText='';
    
    // [Fix] Remove existing cooldown-overlay before adding new one
    el.querySelectorAll('.cooldown-overlay').forEach(o => o.remove());
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);
    
    if (typeof GameLogger !== 'undefined') GameLogger.info(`🔝 Job Change: ${t.data.name} -> ${nt.name}`);
    t.data=nt; t.range=nt.range; t.cooldown=nt.cooldown; t.spentSE+=jobChangeCost;
    
    // [User Request] Record unlock for collections
    if (typeof recordUnlock === 'function') recordUnlock(nt.type);

    if (el.parentElement) el.parentElement.classList.add('selected-slot');
    updateSummonButtonState();
    if (fromInfo) showUnitInfo(t);    startInfoResetTimer();
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

    // [User Request] Trigger Promotion Burst Effect
    if (typeof spawnPromotionBurst === 'function') {
        const rect = el.getBoundingClientRect();
        const container = document.getElementById('game-container');
        if (container) {
            const containerRect = container.getBoundingClientRect();
            const lx = ((rect.left + rect.width / 2) - containerRect.left) * (LOGICAL_WIDTH / containerRect.width);
            const ly = ((rect.top + rect.height / 2) - containerRect.top) * (LOGICAL_HEIGHT / containerRect.height);
            spawnPromotionBurst(lx, ly, nt.tier);
        }
    }

    el.className=`unit ${nt.type} selected`; el.title=nt.name; el.innerText='';

    // [Fix] Remove existing cooldown-overlay before adding new one
    el.querySelectorAll('.cooldown-overlay').forEach(o => o.remove());
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);

    if (typeof GameLogger !== 'undefined') GameLogger.info(`👑 Master Promotion: ${tower.data.name} -> ${nt.name}`);
    tower.data=nt; tower.range=nt.range; tower.cooldown=nt.cooldown;

    // [User Request] Record unlock for collections
    if (typeof recordUnlock === 'function') recordUnlock(nt.type);

    if (el.parentElement) el.parentElement.classList.add('selected-slot');
    if(nt.type==='rampart') tower.charges=5;
    updateSummonButtonState();
    if (fromInfo) showUnitInfo(tower);
    startInfoResetTimer();
    showRangeIndicator(tower);
}

function sellTower(t) {
    const modal = document.getElementById('sacrifice-modal');
    const confirmBtn = document.getElementById('sacrifice-confirm-btn');
    const cancelBtn = document.getElementById('sacrifice-cancel-btn');
    const bodyText = document.getElementById('sacrifice-body');

    if (!modal || !confirmBtn || !cancelBtn) {
        if (confirm("수호자를 추방하시겠습니까?")) executeSacrifice(t);
        return;
    }

    // [User Request] Update body text with proper styling and message
    if (bodyText) {
        bodyText.innerHTML = `
            수호자와의 성스러운 계약을 강제로 끊으려 합니까?<br><br>
            영혼을 심연으로 돌려보내는 대가는 결코 가볍지 않으며,<br>
            한번 흩어진 본질은 결코 다시 불러올 수 없습니다.<br><br>
            <span style="color:#ff1744; font-weight:bold;">정말로 이 수호자를 영원한 어둠 속으로 추방하시겠습니까?</span>
        `;
    }

    modal.style.display = 'flex';
    isPaused = true;

    confirmBtn.onclick = () => {
        executeSacrifice(t);
        modal.style.display = 'none';
        isPaused = false;
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
    if (typeof GameLogger !== 'undefined') GameLogger.warn(`💀 Sacrificed: ${t.data.name}`);
    const s = t.slotElement;
    s.classList.remove('occupied');

    // [User Request] Trigger Banish Effect
    if (typeof spawnBanishEffect === 'function') {
        const rect = s.getBoundingClientRect();
        const container = document.getElementById('game-container');
        if (container) {
            const containerRect = container.getBoundingClientRect();
            const lx = ((rect.left + rect.width / 2) - containerRect.left) * (LOGICAL_WIDTH / containerRect.width);
            const ly = ((rect.top + rect.height / 2) - containerRect.top) * (LOGICAL_HEIGHT / containerRect.height);
            spawnBanishEffect(lx, ly);
        }
    }

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
    if (d) d.innerHTML = '<div class="info-default-text">Gate of Hell<br><span style="font-size:30px; opacity:0.8;">악령들의 귀환</span></div>';
    const ri = document.getElementById('range-indicator');
    if (ri) ri.remove();
    const ai = document.getElementById('aura-indicator');
    if (ai) ai.remove();
}

/**
 * Handles clicks on unit slots
 */
function handleSlotClick(index) {
    const allSlots = document.querySelectorAll('.card-slot');
    const slot = Array.from(allSlots).find(s => parseInt(s.dataset.index) === index);
    if (!slot) return;

    if (slot.classList.contains('occupied')) {
        const unit = slot.querySelector('.unit');
        if (unit) {
            unit.click();
        }
    } else {
        const selectedUnit = document.querySelector('.unit.selected');
        // Check if we are in "move mode" or have a selected unit to move
        if (selectedUnit) {
            executeMove(selectedUnit, slot);
        }
    }
}

/**
 * Main Summon Entry Point from UI
 */
function summonUnit() {
    const allSlots = document.querySelectorAll('.card-slot');
    const emptySlots = Array.from(allSlots).filter(s => !s.classList.contains('occupied'));
    
    if (towers.length >= maxTowers) {
        const warning = document.getElementById('max-units-warning');
        if (warning) {
            warning.style.display = 'block';
            setTimeout(() => warning.style.display = 'none', 3000);
        }
        return;
    }

    if (emptySlots.length === 0) return;

    // Pick a random empty slot from the 42 available ritual altars
    const randomSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
    summonTower(randomSlot);
}

// Global Exports for UI interaction
window.performJobChange = performJobChange;
window.performMasterJobChange = performMasterJobChange;
window.sellTower = sellTower;
window.summonTower = summonTower;
window.summonUnit = summonUnit;
window.handleSlotClick = handleSlotClick;
window.executeMove = executeMove;
window.showRangeIndicator = showRangeIndicator;
window.showAuraIndicator = showAuraIndicator;

