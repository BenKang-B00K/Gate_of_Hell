/* allies_system.js - Summon, Move, Promote, and Sell logic */

let towerCost = 30;
const jobChangeCost = 200; 
const maxTowers = 16; 
let isMovingUnit = false;

function summonTower(targetSlot) {
    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, towerCost - reduction);
    if(money < finalTowerCost) return;
    money -= finalTowerCost;
    if (typeof updateGauges === 'function') updateGauges();
    towerCost = Math.min(200, towerCost + 5);
    const s = unitTypes[0];
    recordUnlock(s.type);
    const unit = document.createElement('div');
    unit.classList.add('unit', s.type);
    unit.title = s.name; unit.innerText = s.icon; unit.draggable = true;
    const cd = document.createElement('div'); cd.className = 'cooldown-overlay'; cd.style.pointerEvents = 'none';
    unit.appendChild(cd);
    let ds;
    unit.addEventListener('dragstart', function() { 
        draggedUnit = this; isMovingUnit = true; this.classList.add('selected'); 
        const t = towers.find(x => x.element === this); if(t){ showUnitInfo(t); showRangeIndicator(t); startInfoResetTimer(); } 
    });
    unit.addEventListener('mousedown', function(e) { if(e.button!==0)return; ds=Date.now(); });
    unit.addEventListener('click', function(e) { 
        e.stopPropagation(); 
        if(Date.now()-ds<400) { 
            document.querySelectorAll('.unit').forEach(u=>u.classList.remove('selected')); this.classList.add('selected'); 
            const t=towers.find(x=>x.element===this); if(t){ showUnitInfo(t); showRangeIndicator(t); startInfoResetTimer(); } 
        } 
    });
    targetSlot.appendChild(unit); targetSlot.classList.add('occupied');
    const tower = { data: s, element: unit, slotElement: targetSlot, range: s.range, cooldown: s.cooldown, lastShot: 0, spentSE: finalTowerCost - 5 };
    towers.push(tower); updateUnitOverlayButtons(tower); updateSummonButtonState();
}

function executeMove(unit, targetSlot) {
    const oldSlot = unit.parentElement;
    if (oldSlot === targetSlot) { cancelMovement(); return; }
    if (targetSlot.classList.contains('occupied')) {
        const targetUnit = targetSlot.querySelector('.unit');
        if (targetUnit) {
            oldSlot.appendChild(targetUnit); targetSlot.appendChild(unit);
            const u1 = towers.find(t => t.element === unit); const u2 = towers.find(t => t.element === targetUnit);
            if (u1) u1.slotElement = targetSlot; if (u2) u2.slotElement = oldSlot;
        }
    } else {
        targetSlot.appendChild(unit); oldSlot.classList.remove('occupied'); targetSlot.classList.add('occupied');
        const ud = towers.find(t => t.element === unit); if (ud) ud.slotElement = targetSlot;
    }
    cancelMovement();
}

function cancelMovement() { if (draggedUnit) draggedUnit.classList.remove('move-ready'); draggedUnit = null; isMovingUnit = false; }

function performJobChange(el, targetRole = null, fromInfo = false) {
    if (fromInfo) { const selectedTower = towers.find(t => t.element.classList.contains('selected')); if (!selectedTower) return; el = selectedTower.element; }
    const t = towers.find(x=>x.element===el); if(!t) return;
    const availablePaths = ['chainer','talisman','monk','archer','ice','fire','assassin','tracker','necromancer','guardian','knight','alchemist','mirror'].filter(type => {
        const ud = unitTypes.find(x => x.type === type);
        if (targetRole && ud.role !== targetRole) return false;
        return towers.filter(tw => tw.data.type === type).length < 2;
    });
    if (availablePaths.length === 0) { alert(targetRole ? `No available ${targetRole} classes!` : "No available classes!"); return; }
    if(money < jobChangeCost) return; 
    money -= jobChangeCost; if(typeof updateGauges==='function') updateGauges();
    const ntStr = availablePaths[Math.floor(Math.random()*availablePaths.length)]; 
    const nt = unitTypes.find(x=>x.type===ntStr);
    el.className=`unit ${nt.type} selected`; el.title=nt.name; el.innerText=nt.icon;
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);
    recordUnlock(nt.type); t.data=nt; t.range=nt.range; t.cooldown=nt.cooldown; t.spentSE+=jobChangeCost;
    updateUnitOverlayButtons(t); updateSummonButtonState();
    if (fromInfo) showUnitInfo(t); startInfoResetTimer(); showRangeIndicator(t);
}

function performMasterJobChange(tower, ntStr, fromInfo = false) {
    if (fromInfo) { tower = towers.find(t => t.element.classList.contains('selected')); if (!tower) return; }
    const nt = unitTypes.find(x => x.type === ntStr); if (!nt) return;
    if (towers.filter(t => t.data.type === ntStr).length >= 1) { alert(`You can only have 1 ${nt.name} at a time!`); return; }
    if (nt.tier === 4) {
        if(corruptedShards < 10) { alert(`Not enough Corrupted Shards for [Abyssal]! Need 10.`); return; } 
        corruptedShards -= 10; tower.spentSE += 500;
    } else {
        if(money < 400) { alert(`Not enough Soul Energy! Need 400 SE.`); return; }
        money -= 400; tower.spentSE += 400;
    }
    if(typeof updateGauges==='function') updateGauges();
    const el = tower.element; el.className=`unit ${nt.type} selected`; el.title=nt.name; el.innerText=nt.icon;
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);
    recordUnlock(nt.type); tower.data=nt; tower.range=nt.range; tower.cooldown=nt.cooldown; 
    if(nt.type==='rampart') tower.charges=5;
    updateUnitOverlayButtons(tower); updateSummonButtonState();
    if (fromInfo) showUnitInfo(tower); startInfoResetTimer(); showRangeIndicator(tower);
}

function sellTower(t) {
    isPaused = true; const overlay = document.getElementById('corruption-overlay');
    const confirmBtn = document.getElementById('confirm-corruption-btn'); const cancelBtn = document.getElementById('cancel-corruption-btn');
    if (!overlay || !confirmBtn || !cancelBtn) { finalizeSell(t); isPaused = false; return; }
    overlay.style.display = 'flex';
    const onConfirm = () => { finalizeSell(t); cleanup(); };
    const onCancel = () => { cleanup(); };
    const cleanup = () => { overlay.style.display = 'none'; confirmBtn.removeEventListener('click', onConfirm); cancelBtn.removeEventListener('click', onCancel); isPaused = false; };
    confirmBtn.addEventListener('click', onConfirm); cancelBtn.addEventListener('click', onCancel);
}

function finalizeSell(t) {
    const s = t.slotElement; s.classList.remove('occupied'); t.element.remove();
    const baseRefund = t.spentSE || 0;
    const relicRefundBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('sell_refund') : 0;
    const finalRefund = Math.floor(baseRefund * (1.0 + relicRefundBonus));
    money = Math.min(1000, money + finalRefund);
    if (typeof updateGauges === 'function') updateGauges();
    updateSummonButtonState();
    const idx = towers.indexOf(t); if(idx>-1) towers.splice(idx,1);
    const spawnFn = window.spawnCorruptedEnemy || (typeof spawnCorruptedEnemy === 'function' ? spawnCorruptedEnemy : null);
    if(spawnFn) {
        let ct = null; const type = t.data.type;
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
