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
        setTimeout(() => { if (indicator.parentElement) indicator.remove(); }, 3000);
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
        pc.addEventListener('mouseenter', () => showResourceInfo('purge'));
    }
    const sel = document.getElementById('se-label');
    if(sel) sel.addEventListener('mouseenter', () => showResourceInfo('se'));
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
    initRecordsUI(); 
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

function initRecordsUI() {
    const rb = document.getElementById('records-btn'); const ro = document.getElementById('records-overlay');
    if(rb && ro) {
        rb.addEventListener('click', () => { isPaused = true; ro.style.display = 'flex'; renderBestiary(); });
        rb.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d && Date.now() >= infoPanelLockedUntil) {
                d.innerHTML = `
                    <div style="color:#ffd700; font-weight:bold; font-size:39px; margin-bottom:6px;">Exorcism Records</div>
                    <div style="display:inline-block; background:#8b6b00; color:#fff; padding:3px 12px; border-radius:9px; font-size:24px; font-weight:bold; margin-bottom:12px;">ARCHIVES</div>
                    <div style="font-size:27px; color:#bbb; line-height:1.2;">Contains the Bestiary of all encountered specters and the Ascendency Tree of your exorcists.</div>
                    <div style="color:#00ff00; font-size:24px; margin-top:12px;">* Bestiary bonuses increase damage against known specters.</div>
                    <div style="color:#555; font-size:25.5px; margin-top:18px; font-style:italic; line-height:1.2;">"To defeat your enemy, you must first know their name, their sin, and their sorrow."</div>
                `;
            }
        });
    }
    const cr = document.getElementById('close-records'); if(cr) cr.addEventListener('click', () => { ro.style.display='none'; isPaused=false; });
    document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active')); this.classList.add('active');
        document.querySelectorAll('.tab-pane').forEach(x=>x.classList.remove('active')); document.getElementById(`${this.dataset.tab}-tab`).classList.add('active');
        if(this.dataset.tab==='bestiary') renderBestiary(); else renderPromotionTree();
    }));
}

function initTutorial() {
    const t = document.getElementById('tutorial-toggle'); const s = document.getElementById('tutorial-status');
    if(t && s) { t.addEventListener('change', () => s.innerText=t.checked?'ON':'OFF'); s.innerText=t.checked?'ON':'OFF'; }
}

function renderBestiary() {
    const bt = document.getElementById('bestiary-tab'); bt.innerHTML = '';
    const names = { 'normal': 'Whispering Soul', 'mist': 'Wandering Mist', 'memory': 'Faded Memory', 'shade': 'Flickering Shade', 'tank': 'Ironclad Wraith', 'runner': 'Haste-Cursed Shadow', 'greedy': 'Gluttonous Poltergeist', 'mimic': 'Mimic Soul', 'dimension': 'Void-Step Phantasm', 'deceiver': 'Siren of Despair', 'boar': 'Feral Revenant', 'soul_eater': 'Soul Eater', 'frost': 'Cocytus Drifter', 'lightspeed': 'Ethereal Streak', 'heavy': 'Grave-Bound Behemoth', 'lava': 'Magma-Veined Terror', 'burning': 'Eternal Zealot', 'gold': 'Gilded Apparition', 'defiled_apprentice': 'Defiled Apprentice', 'abyssal_acolyte': 'Abyssal Acolyte', 'bringer_of_doom': 'Bringer of Doom', 'cursed_vajra': 'Cursed Vajra', 'void_piercer': 'Void-Piercing Shade', 'frost_outcast': 'Frost-Bitten Outcast', 'ember_hatred': 'Embers of Hatred', 'betrayer_blade': "Betrayer's Blade", 'cerberus': 'Cerberus', 'charon': 'Charon', 'beelzebub': 'Beelzebub', 'lucifer': 'Lucifer' };
    const groups = [
        { h: 'Basic Specters', c: '#00e5ff', types: ['normal', 'mist', 'memory', 'shade', 'tank', 'runner', 'defiled_apprentice'] },
        { h: 'Specialized Wraiths', c: '#ff00ff', types: ['greedy', 'mimic', 'dimension', 'deceiver', 'boar', 'soul_eater', 'frost', 'lightspeed', 'heavy', 'lava', 'burning', 'abyssal_acolyte', 'bringer_of_doom', 'cursed_vajra', 'void_piercer', 'frost_outcast', 'ember_hatred', 'betrayer_blade'] },
        { h: 'Treasure Specters', c: '#ffd700', types: ['gold'] },
        { h: 'Abyss Bosses', c: '#8b0000', types: ['cerberus', 'charon', 'beelzebub', 'lucifer'] }
    ];

    groups.forEach(g => {
        const h = document.createElement('h3'); h.innerText=g.h; h.style.cssText=`grid-column:1/-1; color:${g.c}; border-bottom:2px solid #333; margin:45px 0 24px 0; font-size:42px;`; bt.appendChild(h);
        g.types.forEach(t => {
            let isKnown = false;
            if (g.h === 'Basic Specters') {
                isKnown = true; 
            } else {
                isKnown = (window.encounteredEnemies && window.encounteredEnemies.has(t)) || (killCounts[t] > 0);
            }
            let d; 
            if (typeof bossData !== 'undefined' && bossData) {
                for (let k in bossData) { if (bossData[k].type === t) { d = bossData[k]; break; } }
            }
            if (!d) {
                for(let k in enemyCategories) { const f=enemyCategories[k].find(x=>x.type===t); if(f){d=f; break;} }
            }
            if(!d) return;
            const kills = killCounts[t] || 0; 
            const bonus = getBestiaryBonus(t); 
            const btx = bonus>1?`<br>DMG +${((bonus-1)*100).toFixed(0)}%`:`<br>No Bonus`;
            let rVal = d.reward;
            if (rVal === undefined) {
                if (g.h === 'Abyss Bosses') rVal = 500;
                else rVal = 10;
            }
            const rewardText = ` | ✨ ${rVal}`;
            const item = document.createElement('div'); 
            item.className = `bestiary-item ${isKnown ? '' : 'locked'}`;
            if (isKnown) {
                item.innerHTML = `
                    <div class="custom-tooltip specter">
                        <strong style="color:#ffd700;">[Trait]</strong><br>${d.desc || d.lore || 'A powerful soul from the abyss.'}
                    </div>
                    <div class="bestiary-icon enemy ${t}" style="position:static; transform:none; display:flex; justify-content:center; align-items:center; width: auto; height: auto; box-shadow: none;">${d.icon}</div>
                    <div class="bestiary-name">${names[t]||t}</div>
                    <div class="bestiary-stats">
                        <div style="margin-bottom: 5px;">💀 Kills: ${kills}</div>
                        <div style="color: #ffd700; font-weight: bold;">✨ Reward: ${rVal} SE</div>
                        ${bonus > 1 ? `<div style="color: #00ff00; font-size: 14px; margin-top: 5px;">DMG +${((bonus-1)*100).toFixed(0)}%</div>` : ''}
                    </div>`;
            } else {
                item.innerHTML = `
                    <div class="custom-tooltip specter">
                        <strong style="color:#ffd700;">[Information Unavailable]</strong><br>Defeat this specter to reveal details.
                    </div>
                    <div class="bestiary-icon" style="position:static; transform:none; display:flex; justify-content:center; align-items:center; background:none; color:#333; font-size:64px; border:none; box-shadow:none;">?</div>
                    <div class="bestiary-name" style="color:#444;">???</div>
                    <div class="bestiary-stats" style="color:#333; border: 1px dashed #333;">LOCKED</div>`;
            }
            bt.appendChild(item);
        });
    });
}

function renderPromotionTree() {
    const tt = document.getElementById('tree-tab'); tt.innerHTML = '';
    const pg = {
        'Attack Paths': [ {n:'Talismanist',t:'talisman',m:['grandsealer','flamemaster'],a:'cursed_talisman'}, {n:'Divine Archer',t:'archer',m:['voidsniper','thousandhand'],a:'piercing_shadow'}, {n:'Fire Mage',t:'fire',m:['hellfire','phoenix'],a:'purgatory'}, {n:'Shadow Assassin',t:'assassin',m:['abyssal','spatial'],a:'reaper'}, {n:'Exorcist Knight',t:'knight',m:['paladin','crusader'],a:'eternal_wall'} ],
        'Support Paths': [ {n:'Soul Chainer',t:'chainer',m:['executor','binder'],a:'warden'}, {n:'Mace Monk',t:'monk',m:['vajra','saint'],a:'asura'}, {n:'Ice Daoist',t:'ice',m:['absolutezero','permafrost'],a:'cocytus'}, {n:'Soul Tracker',t:'tracker',m:['seer','commander'],a:'doom_guide'}, {n:'Necromancer',t:'necromancer',m:['wraithlord','cursedshaman'],a:'forsaken_king'} ],
        'Special Paths': [ 
            {n:'Sanctuary Guardian',t:'guardian',m:['rampart','judgment'],a:'void_gatekeeper'},
            {n:'Exorcist Alchemist',t:'alchemist',m:['midas','philosopher'],a:'transmuter'},
            {n:'Mirror Oracle',t:'mirror',m:['illusion','reflection'],a:'oracle'}
        ]
    };
    Object.keys(pg).forEach(gn => {
        const h = document.createElement('h3'); let c="#ff4500"; if(gn.includes('Support')) c="#00e5ff"; if(gn.includes('Special')) c="#ffd700";
        h.innerText=gn; h.style.cssText=`color:${c}; border-bottom:2px solid #333; margin:24px 0 12px 0; font-size:39px; text-align:center;`; tt.appendChild(h);
        const tc = document.createElement('div'); tc.className='tree-main-container'; tc.style.cssText='display:flex; flex-direction:column; gap:12px;';
        pg[gn].forEach(p => {
            const row = document.createElement('div'); row.style.cssText='display:grid; grid-template-columns:210px 36px 255px 36px 315px 36px 315px; align-items:center; justify-content:center; gap:9px; border-bottom:2px solid #222; padding-bottom:12px;';
            const node = (type,tier) => {
                const d=unitTypes.find(x=>x.type===type); 
                const u=unlockedUnits.has(type);
                const n=document.createElement('div'); n.className=`unit-node tier${tier} ${u?'':'locked'}`; n.style.cssText='position:relative; font-size:21px; padding:6px 12px; min-width:auto;';
                if (u) {
                    n.innerHTML = `<div class="custom-tooltip"><strong>${d.name}</strong><br>${d.desc}</div>${d.icon} ${d.name}`;
                } else {
                    n.innerHTML = `<div class="custom-tooltip"><strong>[Hidden Class]</strong><br>Promote to this class during a mission to unlock its records.</div>? ???`;
                    n.style.color = '#555';
                }
                return n;
            };
            const arrow = () => { const a=document.createElement('div'); a.innerText='→'; a.style.fontSize='24px'; return a; };
            row.appendChild(node('apprentice',1)); row.appendChild(arrow()); row.appendChild(node(p.t,2)); row.appendChild(arrow());
            const mdiv = document.createElement('div'); mdiv.style.cssText='display:flex; flex-direction:column; gap:6px;';
            p.m.forEach(m=>mdiv.appendChild(node(m,3))); row.appendChild(mdiv); row.appendChild(arrow()); row.appendChild(node(p.a,4));
            tc.appendChild(row);
        }); tt.appendChild(tc);
    });
}

function updateUnitOverlayButtons(t) {
    const el = t.element; el.querySelectorAll('.unit-overlay-btn').forEach(b=>b.remove());
    const sell = document.createElement('div'); sell.className='unit-overlay-btn sell-btn'; sell.innerHTML='💀'; sell.title='Dismiss Guardian (50% Refund)';
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

            btn.addEventListener('mouseenter', () => {
                if (money < 200) warning.style.display = 'block';
            });
            btn.addEventListener('mouseleave', () => {
                warning.style.display = 'none';
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

            btn.addEventListener('mouseenter', () => {
                if (money < seCost) warning.style.display = 'block';
            });
            btn.addEventListener('mouseleave', () => {
                warning.style.display = 'none';
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
    const tc = document.getElementById('tower-card'); if(!tc) return;
    const scd = document.getElementById('summon-cost-display');
    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, towerCost - reduction);
    if(scd) scd.innerText = `${finalTowerCost} SE`;
    const isMax = towers.length >= maxTowers;
    const sw = document.getElementById('summon-warning');
    if(sw) {
        if (money < finalTowerCost && !isMax) {
            sw.style.display = 'block';
            sw.innerText = 'NOT ENOUGH SE';
        } else {
            sw.style.display = 'none';
        }
    }
    if(money<finalTowerCost || isMax) tc.classList.add('locked'); else tc.classList.remove('locked');
    const pc = document.getElementById('purge-card'); if(!pc) return;
    if(money<800 || portalEnergy<=0) pc.classList.add('locked'); else pc.classList.remove('locked');
}
