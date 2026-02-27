/* allies_ui.js - Info panel, records, slots, and overlay buttons */

let infoResetTimer = null;
let infoPanelLockedUntil = 0;

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
        cell.addEventListener('click', function() { if (isMovingUnit && draggedUnit) executeMove(draggedUnit, this); });
        cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('drag-over'); });
        cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
        cell.addEventListener('drop', e => { e.preventDefault(); cell.classList.remove('drag-over'); if (draggedUnit) executeMove(draggedUnit, cell); });
    }
}

function startInfoResetTimer() {
    if (Date.now() < infoPanelLockedUntil) return;
    if (infoResetTimer) clearTimeout(infoResetTimer);
    infoResetTimer = setTimeout(() => {
        if (Date.now() < infoPanelLockedUntil) return;
        const d = document.getElementById('unit-info');
        if (d) d.innerHTML = '<div class="info-default-text">GUARDIANS<br><span style="font-size:30px; opacity:0.8;">of the</span><br>UNDERWORLD</div>';
        document.querySelectorAll('.unit').forEach(u => u.classList.remove('selected'));
        const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
        const ai = document.getElementById('aura-indicator'); if (ai) ai.remove();
    }, 10000);
}

function showRangeIndicator(tower) {
    const existingRI = document.getElementById('range-indicator'); if (existingRI) existingRI.remove();
    const existingAI = document.getElementById('aura-indicator'); if (existingAI) existingAI.remove();
    const slotRect = tower.slotElement.getBoundingClientRect();
    const gameRect = gameContainer.getBoundingClientRect();
    const centerX = (slotRect.left + slotRect.width / 2) - gameRect.left;
    const centerY = (slotRect.top + slotRect.height / 2) - gameRect.top;

    if (tower.data.range > 0) {
        const indicator = document.createElement('div');
        indicator.id = 'range-indicator'; indicator.className = 'range-indicator';
        const totalRange = tower.range + (tower.rangeBonus || 0);
        const size = totalRange * 2;
        indicator.style.width = `${size}px`; indicator.style.height = `${size}px`;
        indicator.style.left = `${centerX}px`; indicator.style.top = `${centerY}px`;
        gameContainer.appendChild(indicator);
        setTimeout(() => { if (indicator.parentElement) indicator.remove(); }, 3000);
    }

    const auraUnits = ['tracker', 'seer', 'commander', 'eternal_wall'];
    if (auraUnits.includes(tower.data.type)) {
        const auraIndicator = document.createElement('div');
        auraIndicator.id = 'aura-indicator'; auraIndicator.className = 'aura-indicator';
        let auraRadius = 300;
        if (tower.data.type === 'eternal_wall') auraRadius = 450;
        else if (tower.data.type === 'commander' || tower.data.type === 'seer') auraRadius = 360;
        const size = auraRadius * 2;
        auraIndicator.style.width = `${size}px`; auraIndicator.style.height = `${size}px`;
        auraIndicator.style.left = `${centerX}px`; auraIndicator.style.top = `${centerY}px`;
        gameContainer.appendChild(auraIndicator);
        setTimeout(() => { if (auraIndicator.parentElement) auraIndicator.remove(); }, 3000);
    }
}

function showUnitInfo(tower) {
    if (Date.now() < infoPanelLockedUntil) return;
    const d = document.getElementById('unit-info');
    const data = tower.data;
    let rc = '#ff4500'; if(data.role==='Basic') rc='#00ff00'; else if(data.role==='Support') rc='#00e5ff'; else if(data.role==='Special') rc='#ffd700';
    const rb = tower.rangeBonus || 0;
    const sb = Math.round((tower.speedBonus || 0) * 100);
    const db = Math.round((tower.damageBonus || 0) * 100);
    let bonusText = '';
    if (rb > 0) bonusText += `<span style="color:#00ff00; font-size:24px;"> +${rb} Range</span>`;
    if (sb > 0) bonusText += `<span style="color:#00ff00; font-size:24px;"> +${sb}% ATK SPD</span>`;
    if (sb < 0) bonusText += `<span style="color:#ff4444; font-size:24px;"> ${sb}% ATK SPD</span>`;
    if (db > 0) bonusText += `<span style="color:#00ff00; font-size:24px;"> +${db}% DMG</span>`;
    const finalDmg = Math.round(data.damage * damageMultiplier * (1.0 + (tower.damageBonus || 0)));
    let th = `<div style="color:#ffd700; font-weight:bold; font-size:39px; margin-bottom:6px;">${data.name}</div><div style="display:inline-block; background:${rc}; color:#000; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">${data.role}</div>`;
    let ih = `<div style="font-size:27px; color:#bbb; margin-bottom:12px;">ATK: ${finalDmg} | Range: ${data.range}${rb > 0 ? '(+' + rb + ')' : ''} | CD: ${((tower.cooldown / (1.0 + (tower.speedBonus || 0))) / 1000).toFixed(1)}s</div>`;
    if (bonusText) th += `<div style="margin-bottom:12px;">${bonusText}</div>`;
    let ch = ''; 
    if(data.type==='apprentice') {
        ch = `<div style="font-size:24px; color:#ffd700; margin-bottom:12px; font-weight:bold;">Promotion Paths (200 SE):</div>
            <div style="font-size:30px; display:flex; gap:36px; justify-content:center; margin-bottom:18px;">
                <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Attack', true)" title="Ascend to Attack Path" style="background:#442222; border:3px solid #ff4500; color:#fff; border-radius:12px; cursor:pointer; padding:6px 18px;">⚔️</button>
                    <div style="font-size:21px; color:#ff4500;">Attack</div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Support', true)" title="Ascend to Support Path" style="background:#224444; border:3px solid #00e5ff; color:#fff; border-radius:12px; cursor:pointer; padding:6px 18px;">🪄</button>
                    <div style="font-size:21px; color:#00e5ff;">Support</div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                    <button class="info-promo-btn" onclick="performJobChange(null, 'Special', true)" title="Ascend to Special Path" style="background:#444422; border:3px solid #ffd700; color:#fff; border-radius:12px; cursor:pointer; padding:6px 18px;">💠</button>
                    <div style="font-size:21px; color:#ffd700;">Special</div>
                </div>
            </div>`;
    } else if(data.upgrades) { 
        const isToAbyssal = unitTypes.find(x=>x.type===data.upgrades[0]).tier === 4;
        const costLabel = isToAbyssal ? "Unleash Master (10 Shards):" : "Unleash Master (400 SE):";
        ch=`<div style="font-size:24px; color:#ffd700; margin-bottom:12px;">${costLabel}</div><div style="display:flex; gap:30px; justify-content:center; margin-bottom:18px;">`; 
        data.upgrades.forEach((u,i)=>{
            const ud=unitTypes.find(x=>x.type===u); const costTip = ud.tier === 4 ? "10 Shards" : "400 SE";
            ch+=`<div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
                    <button class="info-promo-btn" onclick="performMasterJobChange(null, '${u}', true)" title="Unleash ${ud.name} (${costTip})" style="background:#222; border:3px solid #aaa; color:#fff; border-radius:12px; cursor:pointer; padding:6px 24px; font-size:30px;">${i===0?'↖️':'↗️'}</button>
                    <div style="font-size:21px; color:#aaa; max-width:150px; text-align:center; line-height:1;">${ud.name}</div>
                </div>`;
        }); ch+=`</div>`;
    }
    d.innerHTML = `${th}${ch}${ih}<div style="color:#888; font-size:27px; margin-top:6px; line-height:1.2;">${data.desc}</div>`;
    startInfoResetTimer();
}

function updateUnitOverlayButtons(t) {
    const el = t.element; el.querySelectorAll('.unit-overlay-btn').forEach(b=>b.remove());
    const sell = document.createElement('div'); sell.className='unit-overlay-btn sell-btn'; sell.innerHTML='💀'; sell.title='Corrupt Unit (Sell)';
    sell.addEventListener('click', e=>{ e.stopPropagation(); sellTower(t); }); el.appendChild(sell);
    if(t.data.type==='apprentice') {
        const atk = document.createElement('div'); atk.className='unit-overlay-btn promote-10'; atk.innerHTML='⚔️';
        atk.addEventListener('click', e=>{ e.stopPropagation(); performJobChange(el, 'Attack'); }); el.appendChild(atk);
        const sup = document.createElement('div'); sup.className='unit-overlay-btn promote-12'; sup.innerHTML='🪄';
        sup.addEventListener('click', e=>{ e.stopPropagation(); performJobChange(el, 'Support'); }); el.appendChild(sup);
        const spc = document.createElement('div'); spc.className='unit-overlay-btn promote-2'; spc.innerHTML='💠';
        spc.addEventListener('click', e=>{ e.stopPropagation(); performJobChange(el, 'Special'); }); el.appendChild(spc);
    } else if(t.data.upgrades) {
        t.data.upgrades.forEach((u,i)=>{
            const b=document.createElement('div'); b.className=i===0?'unit-overlay-btn promote-btn':'unit-overlay-btn promote-btn-right';
            b.innerHTML=i===0?'↖️':'↗️'; b.addEventListener('click', e=>{ e.stopPropagation(); performMasterJobChange(t,u); }); el.appendChild(b);
        });
    }
}

// ... (Rest of Records UI rendering code) ...
