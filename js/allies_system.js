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
    cancelMovement();
}

function cancelMovement() { if (draggedUnit) draggedUnit.classList.remove('move-ready'); draggedUnit = null; isMovingUnit = false; }

function summonTower(targetSlot) {
    // 1. targetSlot validation
    if (!targetSlot || targetSlot.classList.contains('occupied')) return;

    // 2. Defensive Relic Bonus check & Cost calculation
    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, Math.floor(towerCost - reduction));

    // 3. Pre-summon validation (Resources & Limits)
    if (money < finalTowerCost || towers.length >= maxTowers) {
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
    unit.classList.add('unit', 'apprentice');
    unit.title = apprenticeData.name;
    unit.innerText = ''; 
    unit.draggable = true;

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
    towerCost += 5;
    updateUnitOverlayButtons(tower);
    updateSummonButtonState();
}

function purgePortal() {
    const pc = 800; const pa = portalEnergy * 0.5;
    if(money>=pc && portalEnergy>0) { money-=pc; portalEnergy=Math.max(0,portalEnergy-pa); if(typeof updateGauges==='function')updateGauges(); }
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
        if (targetRole && ud.role !== targetRole) return false;
        const count = towers.filter(tw => tw.data.type === type).length;
        return count < 2;
    });

    if (availablePaths.length === 0) {
        return;
    }

    if(money<jobChangeCost) return; 
    money-=jobChangeCost; if(typeof updateGauges==='function')updateGauges();
    
    const ntStr = availablePaths[Math.floor(Math.random()*availablePaths.length)]; 
    const nt = unitTypes.find(x=>x.type===ntStr);
    el.className=`unit ${nt.type} selected`; el.title=nt.name; el.innerText='';
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);
    recordUnlock(nt.type); t.data=nt; t.range=nt.range; t.cooldown=nt.cooldown; t.spentSE+=jobChangeCost;
    updateUnitOverlayButtons(t); updateSummonButtonState();
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
        return;
    }
    money -= seCost;
    tower.spentSE += seCost;
    
    if(typeof updateGauges==='function') updateGauges();
    
    const el = tower.element;
    el.className=`unit ${nt.type} selected`; el.title=nt.name; el.innerText='';
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);
    recordUnlock(nt.type); tower.data=nt; tower.range=nt.range; tower.cooldown=nt.cooldown; 
    
    if(nt.type==='rampart') tower.charges=5;
    updateUnitOverlayButtons(tower); updateSummonButtonState();
    if (fromInfo) showUnitInfo(tower);
    startInfoResetTimer();
    showRangeIndicator(tower);
}

function sellTower(t) {
    const confirmMsg = `Are you sure you want to dismiss this guardian? You will receive a partial refund of Soul Energy.`;
    if (!confirm(confirmMsg)) return;

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
    if (d) d.innerHTML = '<div class="info-default-text">GUARDIANS<br><span style="font-size:30px; opacity:0.8;">of the</span><br>UNDERWORLD</div>';
    const ri = document.getElementById('range-indicator');
    if (ri) ri.remove();
    const ai = document.getElementById('aura-indicator');
    if (ai) ai.remove();
}
