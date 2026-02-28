/* allies_ui.js - UI Rendering & Updates */

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
        const ri = document.getElementById('range-indicator');
        if (ri) ri.remove();
        const ai = document.getElementById('aura-indicator');
        if (ai) ai.remove();
    }, 10000); 
}

function showRangeIndicator(tower) {
    const existingRI = document.getElementById('range-indicator');
    if (existingRI) existingRI.remove();
    const existingAI = document.getElementById('aura-indicator');
    if (existingAI) existingAI.remove();

    const slotRect = tower.slotElement.getBoundingClientRect();
    const gameRect = gameContainer.getBoundingClientRect();
    const centerX = (slotRect.left + slotRect.width / 2) - gameRect.left;
    const centerY = (slotRect.top + slotRect.height / 2) - gameRect.top;

    if (tower.data.range > 0) {
        const indicator = document.createElement('div');
        indicator.id = 'range-indicator';
        indicator.className = 'range-indicator';
        const totalRange = tower.range + (tower.rangeBonus || 0);
        const size = totalRange * 2;
        indicator.style.width = `${size}px`;
        indicator.style.height = `${size}px`;
        indicator.style.left = `${centerX}px`;
        indicator.style.top = `${centerY}px`;
        gameContainer.appendChild(indicator);
    }

    const auraUnits = ['tracker', 'seer', 'commander', 'eternal_wall'];
    if (auraUnits.includes(tower.data.type)) {
        const auraIndicator = document.createElement('div');
        auraIndicator.id = 'aura-indicator';
        auraIndicator.className = 'aura-indicator';
        let auraRadius = 300; 
        if (tower.data.type === 'eternal_wall') auraRadius = 450;
        else if (tower.data.type === 'tracker') auraRadius = 300;
        else if (tower.data.type === 'commander' || tower.data.type === 'seer') auraRadius = 360;
        const size = auraRadius * 2;
        auraIndicator.style.width = `${size}px`;
        auraIndicator.style.height = `${size}px`;
        auraIndicator.style.left = `${centerX}px`;
        auraIndicator.style.top = `${centerY}px`;
        gameContainer.appendChild(auraIndicator);
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
        ch = `
            <div style="font-size:24px; color:#ffd700; margin-bottom:12px; font-weight:bold;">Promotion Paths (200 SE):</div>
            <div style="font-size:30px; display:flex; gap:36px; justify-content:center; margin-bottom:18px;">
                <div style="display:flex; flex-direction:column; align-items:center; gap:6px; position:relative;">
                    <button class="info-promo-btn" onclick="if(money>=200) performJobChange(null, 'Attack', true)" onmouseenter="if(money<200) this.nextElementSibling.style.display='block'" onmouseleave="this.nextElementSibling.style.display='none'" title="Ascend to Attack Path" style="background:#442222; border:3px solid #ff4500; color:#fff; border-radius:12px; cursor:pointer; padding:6px 18px;">⚔️</button>
                    <div class="card-warning" style="font-size:12px; top:-40px; pointer-events:none;">NOT ENOUGH SE</div>
                    <div style="font-size:21px; color:#ff4500;">Attack</div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; gap:6px; position:relative;">
                    <button class="info-promo-btn" onclick="if(money>=200) performJobChange(null, 'Support', true)" onmouseenter="if(money<200) this.nextElementSibling.style.display='block'" onmouseleave="this.nextElementSibling.style.display='none'" title="Ascend to Support Path" style="background:#224444; border:3px solid #00e5ff; color:#fff; border-radius:12px; cursor:pointer; padding:6px 18px;">🪄</button>
                    <div class="card-warning" style="font-size:12px; top:-40px; pointer-events:none;">NOT ENOUGH SE</div>
                    <div style="font-size:21px; color:#00e5ff;">Support</div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; gap:6px; position:relative;">
                    <button class="info-promo-btn" onclick="if(money>=200) performJobChange(null, 'Special', true)" onmouseenter="if(money<200) this.nextElementSibling.style.display='block'" onmouseleave="this.nextElementSibling.style.display='none'" title="Ascend to Special Path" style="background:#444422; border:3px solid #ffd700; color:#fff; border-radius:12px; cursor:pointer; padding:6px 18px;">💠</button>
                    <div class="card-warning" style="font-size:12px; top:-40px; pointer-events:none;">NOT ENOUGH SE</div>
                    <div style="font-size:21px; color:#ffd700;">Special</div>
                </div>
            </div>
        `;
    }
    else if(data.upgrades) { 
        const isToAbyssal = unitTypes.find(x=>x.type===data.upgrades[0]).tier === 4;
        const costLabel = isToAbyssal ? "Unleash Master (800 SE):" : "Unleash Master (400 SE):";
        ch=`<div style="font-size:24px; color:#ffd700; margin-bottom:12px;">${costLabel}</div>
           <div style="display:flex; gap:30px; justify-content:center; margin-bottom:18px;">`; 
        data.upgrades.forEach((u,i)=>{
            const ud=unitTypes.find(x=>x.type===u); 
            const seCost = ud.tier === 4 ? 800 : 400;
            const costTip = ud.tier === 4 ? "800 SE" : "400 SE";
            ch+=`
                <div style="display:flex; flex-direction:column; align-items:center; gap:6px; position:relative;">
                    <button class="info-promo-btn" onclick="if(money>=${seCost}) performMasterJobChange(null, '${u}', true)" onmouseenter="if(money<${seCost}) this.nextElementSibling.style.display='block'" onmouseleave="this.nextElementSibling.style.display='none'" title="Unleash ${ud.name} (${costTip})" style="background:#222; border:3px solid #aaa; color:#fff; border-radius:12px; cursor:pointer; padding:6px 24px; font-size:30px;">${i===0?'↖️':'↗️'}</button>
                    <div class="card-warning" style="font-size:12px; top:-40px; pointer-events:none;">NOT ENOUGH SE</div>
                    <div style="font-size:21px; color:#aaa; max-width:150px; text-align:center; line-height:1;">${ud.name}</div>
                </div>
            `;
        }); 
        ch+=`</div>`;
    }
    d.innerHTML = `${th}${ch}${ih}<div style="color:#888; font-size:27px; margin-top:6px; line-height:1.2;">${data.desc}</div>`;
    startInfoResetTimer();
}

function showEnemyInfo(enemy) {
    if (Date.now() < infoPanelLockedUntil) return;
    const d = document.getElementById('unit-info');
    const names = { 'normal': 'Whispering Soul', 'mist': 'Wandering Mist', 'memory': 'Faded Memory', 'shade': 'Flickering Shade', 'tank': 'Ironclad Wraith', 'runner': 'Haste-Cursed Shadow', 'greedy': 'Gluttonous Poltergeist', 'mimic': 'Mimic Soul', 'dimension': 'Void-Step Phantasm', 'deceiver': 'Siren of Despair', 'boar': 'Feral Revenant', 'soul_eater': 'Soul Eater', 'frost': 'Cocytus Drifter', 'lightspeed': 'Ethereal Streak', 'heavy': 'Grave-Bound Behemoth', 'lava': 'Magma-Veined Terror', 'burning': 'Eternal Zealot', 'gold': 'Gilded Apparition', 'defiled_apprentice': 'Defiled Apprentice', 'abyssal_acolyte': 'Abyssal Acolyte', 'bringer_of_doom': 'Bringer of Doom', 'cursed_vajra': 'Cursed Vajra', 'void_piercer': 'Void-Piercing Shade', 'frost_outcast': 'Frost-Bitten Outcast', 'ember_hatred': 'Embers of Hatred', 'betrayer_blade': "Betrayer's Blade", 'cerberus': 'Cerberus', 'charon': 'Charon', 'beelzebub': 'Beelzebub', 'lucifer': 'Lucifer' };
    const dispName = enemy.name || names[enemy.type] || enemy.type;
    const hp = Math.floor(enemy.hp);
    const maxHp = Math.floor(enemy.maxHp || hp);
    const bonus = typeof getBestiaryBonus === 'function' ? getBestiaryBonus(enemy.type) : 1;
    const bonusText = bonus > 1 ? `<div style="color: #00ff00; font-size: 24px; margin-bottom: 9px;">Bestiary Bonus: +${((bonus-1)*100).toFixed(0)}% DMG</div>` : '';
    d.innerHTML = `
        <div style="color: #ff4500; font-weight: bold; font-size: 39px; margin-bottom: 6px;">${dispName}</div>
        <div style="display:inline-block; background:#444; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">SPECTER</div>
        ${bonusText}
        <div style="font-size: 27px; color: #ff0000; margin-bottom: 12px;">HP: ${hp} / ${maxHp}</div>
        <div style="color: #888; font-size: 27px; margin-top: 6px; line-height: 1.2;">${enemy.desc || 'A wandering soul from the abyss.'}</div>
    `;
    startInfoResetTimer();
}
window.showEnemyInfo = showEnemyInfo;

function showResourceInfo(type) {
    if (Date.now() < infoPanelLockedUntil) return;
    const d = document.getElementById('unit-info');
    if (type === 'se') {
        d.innerHTML = `
            <div style="color:#00e5ff; font-weight:bold; font-size:39px; margin-bottom:6px;">Soul Energy (SE)</div>
            <div style="display:inline-block; background:#008ba3; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">ESSENCE</div>
            <div style="font-size:27px; color:#bbb; line-height:1.2;">Used to summon and promote exorcists. Obtained by defeating specters.</div>
            <div style="color:#555; font-size:25.5px; margin-top:18px; font-style:italic; line-height:1.2;">"The crystalline fragments of purified regrets, fueling the sacred arts of those who guard the living world."</div>
        `;
    } else if (type === 'pe') {
        d.innerHTML = `
            <div style="color:#ff00ff; font-weight:bold; font-size:39px; margin-bottom:6px;">Portal Energy (PE)</div>
            <div style="display:inline-block; background:#4b0082; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">CORRUPTION</div>
            <div style="font-size:27px; color:#bbb; line-height:1.2;">Indicates the instability of the gate. Increases when specters pass through. Reach 100% to trigger Game Over.</div>
            <div style="color:#555; font-size:25.5px; margin-top:18px; font-style:italic; line-height:1.2;">"The bridge between worlds is fragile. Too much sorrow from the other side will shatter it entirely."</div>
        `;
    } else if (type === 'rs') {
        d.innerHTML = `
            <div style="color:#ff1744; font-weight:bold; font-size:39px; margin-bottom:6px;">Remaining Specters (RS)</div>
            <div style="display:inline-block; background:#b71c1c; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">INCURSION PROGRESS</div>
            <div style="font-size:27px; color:#bbb; line-height:1.2;">Shows how many specters are currently roaming or waiting to spawn in this Depth level.</div>
            <div style="color:#00ff00; font-size:24px; margin-top:12px;">* Clear all specters to descend deeper into the abyss.</div>
            <div style="color:#555; font-size:25.5px; margin-top:18px; font-style:italic; line-height:1.2;">"They come in waves, like a tide of shadows. Stand firm until the last one falls."</div>
        `;
    } else if (type === 'cursed') {
        d.innerHTML = `
            <div style="color:#ff00ff; font-weight:bold; font-size:39px; margin-bottom:6px;">Abyssal Curse</div>
            <div style="display:inline-block; background:#4a148c; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">GLOBAL PENALTY</div>
            <div style="font-size:27px; color:#bbb; line-height:1.2;">As the portal becomes more unstable, a powerful curse begins to choke the world.</div>
            <div style="color:#ff4081; font-size:24px; margin-top:12px;">* Penalties increase at 25%, 50%, and 75% Portal Energy.</div>
            <div style="color:#555; font-size:25.5px; margin-top:18px; font-style:italic; line-height:1.2;">"The more the gate opens, the less the laws of the living apply. Fear the creeping silence."</div>
        `;
    } else if (type === 'purge') {
        d.innerHTML = `
            <div style="color:#9400d3; font-weight:bold; font-size:39px; margin-bottom:6px;">Purge Portal</div>
            <div style="display:inline-block; background:#4b0082; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">SANCTIFICATION</div>
            <div style="font-size:27px; color:#bbb; line-height:1.2;">Instantly removes 50% of current Portal Energy accumulation. Costs 800 SE.</div>
            <div style="color:#555; font-size:25.5px; margin-top:18px; font-style:italic; line-height:1.2;">"A sacred ritual to cleanse the gate of encroaching spirits. It demands a heavy sacrifice of Soul Energy."</div>
        `;
    }
    startInfoResetTimer();
}
window.showResourceInfo = showResourceInfo;
window.startInfoResetTimer = startInfoResetTimer;

Object.defineProperty(window, 'infoPanelLockedUntil', {
    get: function() { return infoPanelLockedUntil; },
    set: function(val) { infoPanelLockedUntil = val; },
    configurable: true
});

function initAllies() {
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
            const vs = slots.filter(c => {
                if (c.classList.contains('occupied')) return false;
                const col = parseInt(c.dataset.col);
                const area = c.dataset.area;
                if (area === 'left-slots') return col >= 1;
                if (area === 'right-slots') return col <= 1;
                return false;
            });
            if(vs.length === 0) {
                const fallbackVs = slots.filter(c => !c.classList.contains('occupied'));
                if (fallbackVs.length === 0) return;
                summonTower(fallbackVs[Math.floor(Math.random()*fallbackVs.length)]);
            } else {
                summonTower(vs[Math.floor(Math.random()*vs.length)]); 
            }
        });
        tc.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d && Date.now() >= infoPanelLockedUntil) {
                const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
                const finalTowerCost = Math.max(5, towerCost - reduction);
                d.innerHTML = `
                    <div style="color:#00ff00; font-weight:bold; font-size:39px; margin-bottom:6px;">🪄 Summon Exorcist</div>
                    <div style="display:inline-block; background:#006400; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">SUMMON</div>
                    <div style="font-size:27px; color:#bbb; line-height:1.2;">Calls a basic Exorcist Apprentice to a random available slot. Base cost increases with each summon.</div>
                    <div style="color:#ffd700; font-size:27px; margin-top:12px;">Current Cost: ${finalTowerCost} SE</div>
                    <div style="color:#555; font-size:25.5px; margin-top:18px; font-style:italic; line-height:1.2;">"To stand against the night, one must first call upon those who do not fear the dark."</div>
                `;
            }
        });
    }
    const pc = document.getElementById('purge-card'); 
    if(pc) {
        pc.addEventListener('click', () => purgePortal());
        pc.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d && Date.now() >= infoPanelLockedUntil) {
                d.innerHTML = `
                    <div style="color:#9400d3; font-weight:bold; font-size:39px; margin-bottom:6px;">🧹 Purge Portal</div>
                    <div style="display:inline-block; background:#4b0082; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">SANCTIFICATION</div>
                    <div style="font-size:27px; color:#bbb; line-height:1.2;">Instantly removes 50% of current Portal Energy accumulation. Required: 800 SE.</div>
                    <div style="color:#555; font-size:25.5px; margin-top:18px; font-style:italic; line-height:1.2;">"A sacred ritual to cleanse the gate of encroaching spirits. It demands a heavy sacrifice of Soul Energy."</div>
                `;
            }
        });
    }
    const sel = document.getElementById('se-label');
    if(sel) sel.addEventListener('mouseenter', () => showResourceInfo('se'));
    const pel = document.getElementById('pe-label');
    if(pel) pel.addEventListener('mouseenter', () => showResourceInfo('pe'));
    const rsl = document.getElementById('rs-label');
    if(rsl) rsl.addEventListener('mouseenter', () => showResourceInfo('rs'));
    const csl = document.getElementById('cursed-status');
    if(csl) csl.addEventListener('mouseenter', () => showResourceInfo('cursed'));
    const sdh = document.getElementById('stage-debuff-header');
    if(sdh) {
        sdh.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d && Date.now() >= infoPanelLockedUntil) {
                d.innerHTML = `
                    <div style="color:#ff0000; font-weight:bold; font-size:39px; margin-bottom:6px;">Stage Debuff</div>
                    <div style="display:inline-block; background:#8b0000; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">ENVIRONMENTAL CURSE</div>
                    <div style="font-size:27px; color:#bbb; line-height:1.2;">Every stage may carry a unique curse that hinders your exorcists or empowers the specters.</div>
                    <div style="color:#ff4500; font-size:24px; margin-top:12px;">* Check the active debuff description below the gauges.</div>
                    <div style="color:#555; font-size:25.5px; margin-top:18px; font-style:italic; line-height:1.2;">"The very air of the abyss is thick with the regrets of the dead, choking the will of the living."</div>
                `;
            }
        });
    }
    slots.length = 0; 
    createSlots('left-slots', 24); 
    createSlots('right-slots', 24);
    if(typeof initRecords === 'function') initRecords(); 
    initTutorial();
    const modal = document.getElementById('unlock-modal'); 
    if(modal) modal.addEventListener('click', () => { modal.style.display='none'; isPaused=false; });
    const retry = document.getElementById('retry-btn'); 
    if(retry) retry.addEventListener('click', () => location.reload());
    const rbt = document.getElementById('restart-btn-top'); 
    if(rbt) rbt.addEventListener('click', () => { 
        isPaused=true; 
        const go=document.getElementById('game-over-overlay'); 
        if(go) go.style.display='flex'; 
    });
}

function initTutorial() {
    const t = document.getElementById('tutorial-toggle'); const s = document.getElementById('tutorial-status');
    if(t && s) { t.addEventListener('change', () => s.innerText=t.checked?'ON':'OFF'); s.innerText=t.checked?'ON':'OFF'; }
}

function updateUnitOverlayButtons(t) {
    const el = t.element; el.querySelectorAll('.unit-overlay-btn').forEach(b=>b.remove());
    const sell = document.createElement('div'); sell.className='unit-overlay-btn sell-btn'; sell.innerHTML='💀'; sell.title='Corrupt Guardian (50% Refund)';
    
    const label = document.createElement('div');
    label.className = 'card-warning';
    label.innerText = 'CORRUPT';
    label.style.top = '-40px';
    sell.appendChild(label);

    sell.addEventListener('mouseenter', () => label.style.display = 'block');
    sell.addEventListener('mouseleave', () => label.style.display = 'none');
    
    sell.addEventListener('click', e=>{ e.stopPropagation(); sellTower(t); }); el.appendChild(sell);
    
    if(t.data.type==='apprentice') {
        const paths = [
            { class: 'promote-10', icon: '⚔️', role: 'Attack', title: 'Ascend: Attack Path (200 SE)' },
            { class: 'promote-12', icon: '🪄', role: 'Support', title: 'Ascend: Support Path (200 SE)' },
            { class: 'promote-2', icon: '💠', role: 'Special', title: 'Ascend: Special Path (200 SE)' }
        ];
        
        paths.forEach(p => {
            const btn = document.createElement('div');
            btn.className = `unit-overlay-btn ${p.class}`;
            btn.innerHTML = p.icon;
            
            const warning = document.createElement('div');
            warning.className = 'card-warning';
            warning.innerText = 'NOT ENOUGH SE';
            warning.style.fontSize = '12px';
            warning.style.top = '-30px';
            btn.appendChild(warning);

            const promoLabel = document.createElement('div');
            promoLabel.className = 'card-warning';
            promoLabel.innerText = `ASCEND: ${p.role.toUpperCase()}`;
            promoLabel.style.fontSize = '12px';
            promoLabel.style.top = '-30px';
            promoLabel.style.background = '#4caf50'; // Green for available
            promoLabel.style.borderColor = '#2e7d32';
            btn.appendChild(promoLabel);

            btn.addEventListener('mouseenter', () => {
                if (money < 200) warning.style.display = 'block';
                else promoLabel.style.display = 'block';
            });
            btn.addEventListener('mouseleave', () => {
                warning.style.display = 'none';
                promoLabel.style.display = 'none';
            });

            btn.addEventListener('click', e => { 
                e.stopPropagation(); 
                if (money >= 200) performJobChange(el, p.role); 
            });
            el.appendChild(btn);
        });
    } else if(t.data.upgrades) {
        t.data.upgrades.forEach((u,i)=>{
            const ud=unitTypes.find(x=>x.type===u); 
            const btn=document.createElement('div');
            const seCost = ud.tier === 4 ? 800 : 400;
            
            btn.className=i===0?'unit-overlay-btn promote-btn':'unit-overlay-btn promote-btn-right'; 
            btn.innerHTML=i===0?'↖️':'↗️'; 
            
            const warning = document.createElement('div');
            warning.className = 'card-warning';
            warning.innerText = 'NOT ENOUGH SE';
            warning.style.fontSize = '12px';
            warning.style.top = '-30px';
            btn.appendChild(warning);

            const promoLabel = document.createElement('div');
            promoLabel.className = 'card-warning';
            const tierName = ud.tier === 4 ? 'ULTIMATE' : 'MASTER';
            promoLabel.innerText = `${tierName}: ${ud.name.toUpperCase()}`;
            promoLabel.style.fontSize = '12px';
            promoLabel.style.top = '-30px';
            promoLabel.style.background = '#4caf50'; 
            btn.appendChild(promoLabel);

            btn.addEventListener('mouseenter', () => {
                if (money < seCost) warning.style.display = 'block';
                else promoLabel.style.display = 'block';
            });
            btn.addEventListener('mouseleave', () => {
                warning.style.display = 'none';
                promoLabel.style.display = 'none';
            });

            btn.addEventListener('click', e=>{ 
                e.stopPropagation(); 
                if (money >= seCost) performMasterJobChange(t, u); 
            }); 
            el.appendChild(btn);
        });
    }
}

function updateSummonButtonState() {
    const tc = document.getElementById('tower-card'); 
    if (!tc) return;

    const scd = document.getElementById('summon-cost-display');
    const sw = document.getElementById('summon-warning');

    // 1. Consistent Cost Calculation
    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, Math.floor(towerCost - reduction));

    // 2. Update UI Cost Text
    if (scd) scd.innerText = `${finalTowerCost} SE`;

    // 3. Exception Handling (Limit & Money)
    const isMax = towers.length >= maxTowers;
    const isBroke = money < finalTowerCost;

    if (sw) {
        if (isMax) {
            sw.innerText = 'MAX UNITS';
            sw.style.display = 'block';
        } else if (isBroke) {
            sw.innerText = 'NOT ENOUGH SE';
            sw.style.display = 'block';
        } else {
            sw.style.display = 'none';
        }
    }

    // 4. Visual Feedback & Interaction Locking
    if (isMax || isBroke) {
        tc.classList.add('locked');
        tc.style.opacity = '0.5';
        tc.style.pointerEvents = 'none';
    } else {
        tc.classList.remove('locked');
        tc.style.opacity = '1';
        tc.style.pointerEvents = 'auto';
    }

    // Sync Purge Card separately (not part of the core summon logic but remains in this sync loop)
    const pc = document.getElementById('purge-card');
    if (pc) {
        if (money < 800 || portalEnergy <= 0) {
            pc.classList.add('locked');
            pc.style.opacity = '0.5';
        } else {
            pc.classList.remove('locked');
            pc.style.opacity = '1';
        }
    }
}
