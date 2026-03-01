/* allies_system.js - Core Mechanics */

let isMovingUnit = false;
window.draggedUnit = null; // Explicitly declare global

function executeMove(unit, targetSlot) {
    const oldSlot = unit.parentElement;
    if (oldSlot === targetSlot) { cancelMovement(); return; }
    
    // Switch or Move
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

    const t = towers.find(x => x.element === unit);
    if (t && unit.classList.contains('selected')) {
        if (!t.isShrine) showRangeIndicator(t);
    }

    cancelMovement();
}

function cancelMovement() { 
    if (window.draggedUnit) window.draggedUnit.classList.remove('move-ready'); 
    window.draggedUnit = null; 
    isMovingUnit = false; 
}

function showRangeIndicator(tower) {
    if (tower.isShrine) return;
    const ri = document.getElementById('range-indicator');
    if (ri) ri.remove();
    const ai = document.getElementById('aura-indicator');
    if (ai) ai.remove();

    const indicator = document.createElement('div');
    indicator.id = 'range-indicator';
    const s = tower.slotElement;
    if (!s) return;
    const rect = s.getBoundingClientRect();
    const container = document.getElementById('game-container');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const finalRange = tower.range + (tower.rangeBonus || 0);
    indicator.style.width = `${finalRange * 2 * (containerRect.width / 360)}px`;
    indicator.style.height = `${finalRange * 2 * (containerRect.height / 640)}px`;
    indicator.style.left = `${(rect.left + rect.width / 2) - containerRect.left}px`;
    indicator.style.top = `${(rect.top + rect.height / 2) - containerRect.top}px`;
    
    container.appendChild(indicator);
}

function summonTower(targetSlot) {
    if (!targetSlot || targetSlot.classList.contains('occupied')) return;

    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, Math.floor(window.towerCost - reduction));

    if (money < finalTowerCost || towers.length >= maxTowers) {
        if (money < finalTowerCost) {
            if (typeof GameLogger !== 'undefined') GameLogger.warn("❌ Summon failed: Insufficient SE");
            if (typeof flashResourceError === 'function') flashResourceError('se');
        }
        updateSummonButtonState();
        return;
    }

    money -= finalTowerCost;
    if (typeof updateGauges === 'function') updateGauges();

    const apprenticeData = unitTypes.find(u => u.type === 'apprentice');
    if (!apprenticeData) return;

    if (typeof GameLogger !== 'undefined') GameLogger.success(`✨ Summoned: ${apprenticeData.name}`);

    const unit = document.createElement('div');
    unit.classList.add('unit', 'apprentice', 'summoning');
    unit.title = apprenticeData.name;
    unit.innerText = ''; 
    unit.draggable = true;
    targetSlot.appendChild(unit);
    targetSlot.classList.add('occupied');

    const tower = {
        element: unit,
        data: apprenticeData,
        slotElement: targetSlot,
        level: 1,
        lastAttackTime: 0,
        range: apprenticeData.range,
        cooldown: apprenticeData.cooldown,
        spentSE: finalTowerCost
    };

    attachUnitListeners(unit);
    towers.push(tower);
    if (typeof recordUnlock === 'function') recordUnlock('apprentice');
    window.towerCost += 5;
    updateSummonButtonState();
}

function summonShrine() {
    const allSlots = document.querySelectorAll('.card-slot.shrine-only');
    const emptySlots = Array.from(allSlots).filter(s => !s.classList.contains('occupied'));

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
    const data = shrineTypes[0]; // might

    if (typeof GameLogger !== 'undefined') GameLogger.success(`⛩️ Shrine Created: ${data.name}`);

    const unit = document.createElement('div');
    unit.classList.add('unit', 'shrine', data.type, 'summoning');
    unit.title = data.name;
    unit.innerText = ''; 
    unit.draggable = true;
    randomSlot.appendChild(unit);
    randomSlot.classList.add('occupied');

    const tower = {
        element: unit,
        data: data,
        slotElement: randomSlot,
        level: 1,
        lastAttackTime: 0,
        range: 0,
        cooldown: 0,
        isShrine: true,
        isDemolishing: false
    };

    attachUnitListeners(unit);
    towers.push(tower);
    updateSummonButtonState();
}

function attachUnitListeners(unit) {
    let mousedownTime;
    let dragGhost = null;

    unit.addEventListener('dragstart', function(e) { 
        window.draggedUnit = this; 
        isMovingUnit = true; 
        this.classList.add('dragging'); 
        
        dragGhost = this.cloneNode(true);
        dragGhost.classList.add('drag-ghost');
        dragGhost.style.position = 'fixed';
        dragGhost.style.pointerEvents = 'none';
        dragGhost.style.zIndex = '9999';
        dragGhost.style.opacity = '0.8';
        dragGhost.style.transform = 'translate(-50%, -50%) scale(1.2)';
        document.body.appendChild(dragGhost);

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
            document.querySelectorAll('.unit').forEach(u => u.classList.remove('selected')); 
            document.querySelectorAll('.card-slot').forEach(s => s.classList.remove('selected-slot'));
            const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
            const ai = document.getElementById('aura-indicator'); if (ai) ai.remove();
            
            this.classList.add('selected'); 
            if (this.parentElement) this.parentElement.classList.add('selected-slot');
            
            const t = towers.find(x => x.element === this); 
            if(t){
                showUnitInfo(t); 
                if (!t.isShrine) showRangeIndicator(t);
                startInfoResetTimer();
            } 
        } 
    });
}

function performJobChange(unitEl, ntStr, fromInfo = false) {
    const t = towers.find(x => x.element === unitEl);
    if (!t || t.isShrine) return;

    const nt = unitTypes.find(u => u.type === ntStr);
    if (!nt) return;

    if (t.data.tier === 1) {
        if (money < jobChangeCost) { if (typeof flashResourceError === 'function') flashResourceError('se'); return; }
        money -= jobChangeCost;
        if (typeof updateGauges === 'function') updateGauges();
    }

    const el = t.element;
    const container = document.getElementById('game-container');
    if (container) {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const lx = ((rect.left + rect.width / 2) - containerRect.left) * (360 / containerRect.width);
        const ly = ((rect.top + rect.height / 2) - containerRect.top) * (640 / containerRect.height);
        if (typeof spawnPromotionBurst === 'function') spawnPromotionBurst(lx, ly, nt.tier);
    }

    el.className=`unit ${nt.type} selected`; el.title=nt.name;
    el.querySelectorAll('.cooldown-overlay').forEach(o => o.remove());
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);
    
    if (typeof GameLogger !== 'undefined') GameLogger.info(`🔝 Job Change: ${t.data.name} -> ${nt.name}`);
    t.data=nt; t.range=nt.range; t.cooldown=nt.cooldown; t.spentSE+=jobChangeCost;
    
    if (typeof recordUnlock === 'function') recordUnlock(nt.type);
    if (el.parentElement) el.parentElement.classList.add('selected-slot');
    updateSummonButtonState();
    if (fromInfo) showUnitInfo(t);
    startInfoResetTimer();
    showRangeIndicator(t);
}

function performMasterJobChange(tower, ntStr, fromInfo = false) {
    const nt = unitTypes.find(u => u.type === ntStr);
    if (!nt) return;

    const el = tower.element;
    const container = document.getElementById('game-container');
    if (container) {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const lx = ((rect.left + rect.width / 2) - containerRect.left) * (360 / containerRect.width);
        const ly = ((rect.top + rect.height / 2) - containerRect.top) * (640 / containerRect.height);
        if (typeof spawnPromotionBurst === 'function') spawnPromotionBurst(lx, ly, nt.tier);
    }

    el.className=`unit ${nt.type} selected`; el.title=nt.name;
    el.querySelectorAll('.cooldown-overlay').forEach(o => o.remove());
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);

    if (typeof GameLogger !== 'undefined') GameLogger.info(`👑 Master Promotion: ${tower.data.name} -> ${nt.name}`);
    tower.data=nt; tower.range=nt.range; tower.cooldown=nt.cooldown;

    if (typeof recordUnlock === 'function') recordUnlock(nt.type);
    if (el.parentElement) el.parentElement.classList.add('selected-slot');
    if(nt.type==='rampart') tower.charges=5;
    updateSummonButtonState();
    if (fromInfo) showUnitInfo(tower);
    startInfoResetTimer();
    showRangeIndicator(tower);
}

function confirmSacrifice(t) {
    const modal = document.getElementById('sacrifice-modal');
    if (!modal) return;
    const header = document.getElementById('sacrifice-header');
    const body = document.getElementById('sacrifice-body');
    const confirmBtn = document.getElementById('sacrifice-confirm-btn');
    const cancelBtn = document.getElementById('sacrifice-cancel-btn');

    if (t.isShrine) {
        header.innerText = "⚠️ [성소 철거: 정화의 중단]";
        body.innerHTML = `이 성소를 철거하시겠습니까?<br><br>철거에는 <strong>1 스테이지</strong>의 시간이 소요되며,<br>그동안 성소는 <strong>불안정한 기운(디버프)</strong>을 내뿜게 됩니다.<br><br>정말로 철거를 시작하시겠습니까?`;
        confirmBtn.innerText = "철거 시작";
    } else {
        header.innerText = "⚠️ [절대 금기: 영혼의 파기]";
        body.innerHTML = `수호자와의 성스러운 계약을 강제로 끊으려 합니까?<br><br>영혼을 심연으로 돌려보내는 대가는 결코 가볍지 않으며,<br>한번 흩어진 본질은 결코 다시 불러올 수 없습니다.<br><br><strong>정말로 이 수호자를 영원한 어둠 속으로 추방하시겠습니까?</strong>`;
        confirmBtn.innerText = "의식 거행 (추방)";
    }

    modal.style.display = 'flex';
    isPaused = true;

    confirmBtn.onclick = () => {
        if (t.isShrine) {
            t.isDemolishing = true;
            if (t.element) t.element.classList.add('demolishing');
            if (typeof GameLogger !== 'undefined') GameLogger.warn(`🏗️ Demolition Started: ${t.data.name}`);
            showUnitInfo(t);
        } else {
            executeSacrifice(t);
        }
        modal.style.display = 'none';
        isPaused = false;
    };
    cancelBtn.onclick = () => { modal.style.display = 'none'; isPaused = false; };
}

function executeSacrifice(t) {
    if (typeof GameLogger !== 'undefined') GameLogger.warn(`💀 Sacrificed: ${t.data.name}`);
    const s = t.slotElement;
    s.classList.remove('occupied');

    if (typeof spawnBanishEffect === 'function') {
        const rect = s.getBoundingClientRect();
        const container = document.getElementById('game-container');
        if (container) {
            const containerRect = container.getBoundingClientRect();
            spawnBanishEffect(((rect.left + rect.width / 2) - containerRect.left) * (360 / containerRect.width), ((rect.top + rect.height / 2) - containerRect.top) * (640 / containerRect.height));
        }
    }

    const idx = towers.indexOf(t);
    if (idx > -1) {
        if (t.element) t.element.remove();
        const refundBase = (t.data.tier === 1) ? 15 : (t.data.tier === 2) ? 100 : 300;
        const refundRelicBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('sell_refund') : 0;
        money = Math.min(1000, money + Math.floor(refundBase * (1.0 + refundRelicBonus)));
        if (typeof updateGauges === 'function') updateGauges();
        towers.splice(idx, 1);
    }
    
    const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
    const ai = document.getElementById('aura-indicator'); if (ai) ai.remove();
    updateSummonButtonState();
}

function checkDemolitionCleanup() {
    for (let i = towers.length - 1; i >= 0; i--) {
        const t = towers[i];
        if (t.isShrine && t.isDemolishing) {
            if (typeof GameLogger !== 'undefined') GameLogger.success(`🧹 Demolition Complete: ${t.data.name}`);
            const s = t.slotElement;
            if (s) s.classList.remove('occupied');
            if (t.element) t.element.remove();
            towers.splice(i, 1);
        }
    }
    updateSummonButtonState();
}

function summonUnitAuto() {
    const allSlots = document.querySelectorAll('.card-slot.unit-only');
    const emptySlots = Array.from(allSlots).filter(s => !s.classList.contains('occupied'));
    if (emptySlots.length > 0) summonTower(emptySlots[Math.floor(Math.random() * emptySlots.length)]);
}

window.performJobChange = performJobChange;
window.performMasterJobChange = performMasterJobChange;
window.confirmSacrifice = confirmSacrifice;
window.summonUnit = summonUnitAuto;
window.summonShrine = summonShrine;
window.executeMove = executeMove;
window.showRangeIndicator = showRangeIndicator;
window.checkDemolitionCleanup = checkDemolitionCleanup;
