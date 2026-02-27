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
    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, towerCost - reduction);

    money -= finalTowerCost;
    if (typeof updateGauges === 'function') updateGauges();
    towerCost = Math.min(200, towerCost + 5);
    const s = unitTypes[0];
    recordUnlock(s.type);
    const unit = document.createElement('div');
    unit.classList.add('unit', s.type);
    unit.title = s.name; unit.innerText = s.icon; unit.draggable = true;
    const cd = document.createElement('div');
    cd.className = 'cooldown-overlay'; cd.style.pointerEvents = 'none';
    unit.appendChild(cd);
    let ds;
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
    unit.addEventListener('mousedown', function(e) { if(e.button!==0)return; ds=Date.now(); });
    unit.addEventListener('click', function(e) { 
        e.stopPropagation(); 
        if(Date.now()-ds<400) { 
            document.querySelectorAll('.unit').forEach(u=>u.classList.remove('selected')); 
            this.classList.add('selected'); 
            const t=towers.find(x=>x.element===this); 
            if(t){
                showUnitInfo(t); 
                showRangeIndicator(t);
                startInfoResetTimer();
            } 
        } 
    });
    targetSlot.appendChild(unit); targetSlot.classList.add('occupied');
    const tower = { data: s, element: unit, slotElement: targetSlot, range: s.range, cooldown: s.cooldown, lastShot: 0, spentSE: finalTowerCost - 5 };
    towers.push(tower); updateUnitOverlayButtons(tower); updateSummonButtonState();
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
        const msg = targetRole ? `No available ${targetRole} classes!` : "No available classes!";
        alert(msg);
        return;
    }

    if(money<jobChangeCost) return; 
    money-=jobChangeCost; if(typeof updateGauges==='function')updateGauges();
    
    const ntStr = availablePaths[Math.floor(Math.random()*availablePaths.length)]; 
    const nt = unitTypes.find(x=>x.type===ntStr);
    el.className=`unit ${nt.type} selected`; el.title=nt.name; el.innerText=nt.icon;
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
        alert(`You can only have 1 ${nt.name} at a time!`);
        return;
    }

    // Cost logic based on target tier
    if (nt.tier === 4) {
        const shardCost = 10;
        if(corruptedShards < shardCost) {
            alert(`Not enough Corrupted Shards for [Abyssal]! Need ${shardCost}.`);
            return;
        } 
        corruptedShards -= shardCost;
        tower.spentSE += 500; // Value for selling
    } else {
        const seCost = 400;
        if(money < seCost) {
            alert(`Not enough Soul Energy! Need ${seCost}.`);
            return;
        }
        money -= seCost;
        tower.spentSE += seCost;
    }
    
    if(typeof updateGauges==='function') updateGauges();
    
    const el = tower.element;
    el.className=`unit ${nt.type} selected`; el.title=nt.name; el.innerText=nt.icon;
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);
    recordUnlock(nt.type); tower.data=nt; tower.range=nt.range; tower.cooldown=nt.cooldown; 
    
    if(nt.type==='rampart') tower.charges=5;
    updateUnitOverlayButtons(tower); updateSummonButtonState();
    if (fromInfo) showUnitInfo(tower);
    startInfoResetTimer();
    showRangeIndicator(tower);
}

function sellTower(t) {
    const confirmMsg = `정말로 이 퇴마사를 타락시키겠습니까?

타락한 퇴마사는 심연의 힘에 잠식되어 강력한 '타락한 유령'이 되어 다시 돌아올 수 있습니다!`;
    if (!confirm(confirmMsg)) return;

    const s = t.slotElement; s.classList.remove('occupied'); t.element.remove();
    
    // Calculate Refund with Relic Bonus
    const baseRefund = t.spentSE || 0;
    const relicRefundBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('sell_refund') : 0;
    const finalRefund = Math.floor(baseRefund * (1.0 + relicRefundBonus));
    
    money = Math.min(1000, money + finalRefund);
    if (typeof updateGauges === 'function') updateGauges();
    updateSummonButtonState();

    const idx = towers.indexOf(t); if(idx>-1) towers.splice(idx,1);
    
    // Use window scope or direct call if available
    const spawnFn = window.spawnCorruptedEnemy || (typeof spawnCorruptedEnemy === 'function' ? spawnCorruptedEnemy : null);
    if(spawnFn) {
        let ct = null; // Default to tier-based if ct remains null
        const type = t.data.type;
        
        if(['monk','vajra','saint'].includes(type)) ct='cursed_vajra';
        else if(['archer','voidsniper','thousandhand'].includes(type)) ct='void_piercer';
        else if(['ice','absolutezero','permafrost'].includes(type)) ct='frost_outcast';
        else if(['fire','hellfire','phoenix'].includes(type)) ct='ember_hatred';
        else if(['assassin','abyssal','spatial'].includes(type)) ct='betrayer_blade';
        else if(t.data.tier>=3) ct='abyssal_acolyte';
        
        if(t.data.tier===4) ct='bringer_of_doom';
        if(type === 'apprentice') ct='defiled_apprentice';

        spawnFn(t, ct);
    }
}
