/* allies.js */

let towerCost = 40;
const jobChangeCost = 200; 
const masterJobCost = 500; 
const maxTowers = 12; 

// Track unlocked classes for Records
// --- Persistence System ---
const unlockedUnits = new Set(['apprentice']);

function saveGameData() {
    const data = {
        unlockedUnits: Array.from(unlockedUnits),
        encounteredEnemies: Array.from(window.encounteredEnemies || []),
        killCounts: window.killCounts || {}
    };
    localStorage.setItem('gateOfHell_saveData', JSON.stringify(data));
}

function loadGameData() {
    const saved = localStorage.getItem('gateOfHell_saveData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.unlockedUnits) {
                data.unlockedUnits.forEach(u => unlockedUnits.add(u));
            }
            if (data.encounteredEnemies) {
                if (!window.encounteredEnemies) window.encounteredEnemies = new Set();
                data.encounteredEnemies.forEach(e => window.encounteredEnemies.add(e));
            }
            if (data.killCounts) {
                if (!window.killCounts) window.killCounts = {};
                Object.assign(window.killCounts, data.killCounts);
            }
        } catch (e) {
            console.error("Failed to load save data:", e);
        }
    }
}

// Initial load
loadGameData();

function recordUnlock(type, isEnemy = false) {
    const tutorialToggle = document.getElementById('tutorial-toggle');
    const isTutorialEnabled = tutorialToggle ? tutorialToggle.checked : true;
    
    if (isEnemy) {
        if (!window.encounteredEnemies) window.encounteredEnemies = new Set();
        if (window.encounteredEnemies.has(type)) return;
        window.encounteredEnemies.add(type);
        saveGameData();

        if (!isTutorialEnabled) return;

        let enemyData = null;
        for (const cat in enemyCategories) {
            const found = enemyCategories[cat].find(e => e.type === type);
            if (found) { enemyData = found; break; }
        }
        if (!enemyData) {
            for (const key in bossData) {
                if (bossData[key].type === type) { enemyData = bossData[key]; break; }
            }
        }
        if (!enemyData && typeof corruptedTypes !== 'undefined') {
            enemyData = corruptedTypes[type];
        }

        if (enemyData) {
            const modal = document.getElementById('unlock-modal');
            const header = document.getElementById('unlock-header');
            const icon = document.getElementById('unlock-icon');
            const name = document.getElementById('unlock-name');
            const desc = document.getElementById('unlock-desc');
            
            const enemyNames = {
                'normal': 'Whispering Soul', 'mist': 'Wandering Mist', 'memory': 'Faded Memory',
                'shade': 'Flickering Shade', 'tank': 'Ironclad Wraith', 'runner': 'Haste-Cursed Shadow',
                'greedy': 'Gluttonous Poltergeist', 'mimic': 'Mimic Soul', 'dimension': 'Void-Step Phantasm',
                'deceiver': 'Siren of Despair', 'boar': 'Feral Revenant', 'soul_eater': 'Soul Eater',
                'frost': 'Cocytus Drifter', 'lightspeed': 'Ethereal Streak', 'heavy': 'Grave-Bound Behemoth',
                'lava': 'Magma-Veined Terror', 'burning': 'Eternal Zealot', 'gold': 'Gilded Apparition',
                'defiled_apprentice': 'Defiled Apprentice', 'abyssal_acolyte': 'Abyssal Acolyte', 'bringer_of_doom': 'Bringer of Doom',
                'cursed_vajra': 'Cursed Vajra', 'void_piercer': 'Void-Piercing Shade', 'frost_outcast': 'Frost-Bitten Outcast',
                'ember_hatred': 'Embers of Hatred', 'betrayer_blade': "Betrayer's Blade"
            };

            if (modal && header && icon && name && desc) {
                header.innerText = `${enemyData.icon} NEW SPECTER ENCOUNTERED!`;
                header.style.color = "#ff4500";
                icon.innerText = enemyData.icon;
                const hpVal = Math.floor(enemyData.hp || 110);
                const fullName = enemyData.name || enemyNames[enemyData.type] || enemyData.type;
                name.innerHTML = `${fullName}<br><span style="font-size:10px; color:#aaa;">(HP: ${hpVal})</span>`;
                desc.innerText = enemyData.desc || enemyData.lore;
                modal.style.display = 'flex';
                isPaused = true;
            }
        }
        return;
    }

            if (!unlockedUnits.has(type)) {
                unlockedUnits.add(type);
                saveGameData();
    
                if (!isTutorialEnabled) return;

        const data = unitTypes.find(u => u.type === type);
        if (data && type !== 'apprentice') {
            const modal = document.getElementById('unlock-modal');
            const header = document.getElementById('unlock-header');
            const icon = document.getElementById('unlock-icon');
            const name = document.getElementById('unlock-name');
            const desc = document.getElementById('unlock-desc');
            
            if (modal && header && icon && name && desc) {
                header.innerText = "🆕 NEW CLASS UNLOCKED!";
                header.style.color = "#ffd700";
                icon.innerText = data.icon;
                name.innerText = data.name;
                desc.innerText = data.desc;
                modal.style.display = 'flex';
                isPaused = true;
            }
        }
    }
}

const unitTypes = [
    { type: 'apprentice', name: 'Apprentice Exorcist', role: 'Basic', tier: 1, icon: '🧑‍🎓', damage: 35, range: 120, cooldown: 833, desc: "An apprentice with basic exorcism abilities." },
    { type: 'chainer', name: 'Soul Chainer', role: 'Support', tier: 2, icon: '⛓️', damage: 15, range: 130, cooldown: 1000, desc: "Uses soul chains to slow down enemies.", upgrades: ['executor', 'binder'] },
    { type: 'talisman', name: 'Talismanist', role: 'Attack', tier: 2, icon: '📜', damage: 25, range: 120, cooldown: 1500, desc: "Throws exploding talismans to deal area damage.", upgrades: ['grandsealer', 'flamemaster'] },
    { type: 'monk', name: 'Mace Monk', role: 'Support', tier: 2, icon: '⛪', damage: 40, range: 100, cooldown: 1200, desc: "Knocks back enemies with a powerful mace.", upgrades: ['vajra', 'saint'] },
    { type: 'archer', name: 'Divine Archer', role: 'Attack', tier: 2, icon: '🏹', damage: 80, range: 250, cooldown: 1500, desc: "Has the longest range and snipes single targets.", upgrades: ['voidsniper', 'thousandhand'] },
    { type: 'ice', name: 'Ice Daoist', role: 'Support', tier: 2, icon: '❄️', damage: 20, range: 130, cooldown: 1000, desc: "Slows down ghosts with cold energy.", upgrades: ['absolutezero', 'permafrost'] },
    { type: 'fire', name: 'Fire Mage', role: 'Attack', tier: 2, icon: '🔥', damage: 10, range: 120, cooldown: 1000, desc: "Burns ghosts to deal damage based on max HP.", upgrades: ['hellfire', 'phoenix'] },
    { type: 'assassin', name: 'Shadow Assassin', role: 'Attack', tier: 2, icon: '🗡️', damage: 20, range: 100, cooldown: 300, desc: "Attacks very quickly, ignoring enemy defense.", upgrades: ['abyssal', 'spatial'] },
    { type: 'tracker', name: 'Soul Tracker', role: 'Support', tier: 2, icon: '👁️', damage: 10, range: 100, cooldown: 1000, desc: "Increases the range of nearby allies.", upgrades: ['seer', 'commander'] },
    { type: 'necromancer', name: 'Necromancer', role: 'Support', tier: 2, icon: '🔮', damage: 30, range: 120, cooldown: 1200, desc: "Summons spirit walls that block paths.", upgrades: ['wraithlord', 'cursedshaman'] },
    { type: 'guardian', name: 'Sanctuary Guardian', role: 'Special', tier: 2, icon: '🛡️', damage: 50, range: 120, cooldown: 1500, desc: "Chance to instantly kill enemies on hit (5%).", upgrades: ['rampart', 'judgment'] },
    { type: 'knight', name: 'Exorcist Knight', role: 'Attack', tier: 2, icon: '⚔️', damage: 45, range: 110, cooldown: 1000, desc: "Balanced stats warrior.", upgrades: ['paladin', 'crusader'] },
    { type: 'paladin', name: 'Holy Paladin', role: 'Attack', tier: 3, icon: '⛪', damage: 55, range: 130, cooldown: 1000, desc: "[Master] 5th attack deals 3x damage and stuns.", upgrades: ['eternal_wall'] },
    { type: 'crusader', name: 'Blood Crusader', role: 'Attack', tier: 3, icon: '🚩', damage: 80, range: 120, cooldown: 1500, desc: "[Master] Bonus damage based on enemy missing HP.", upgrades: ['eternal_wall'] },
    { type: 'executor', name: 'Underworld Executor', role: 'Special', tier: 3, icon: '⚖️', damage: 40, range: 150, cooldown: 1000, desc: "[Master] Returns enemies to start (10%).", upgrades: ['warden'] },
    { type: 'binder', name: 'Soul Binder', role: 'Support', tier: 3, icon: '🔗', damage: 30, range: 140, cooldown: 1000, desc: "[Master] Links enemies to share damage.", upgrades: ['warden'] },
    { type: 'grandsealer', name: 'Grand Sealer', role: 'Support', tier: 3, icon: '🛐', damage: 30, range: 130, cooldown: 1500, desc: "[Master] Neutralizes enemy special abilities.", upgrades: ['cursed_talisman'] },
    { type: 'flamemaster', name: 'Fire Talisman Master', role: 'Attack', tier: 3, icon: '🌋', damage: 35, range: 130, cooldown: 1500, desc: "[Master] Leaves persistent flames.", upgrades: ['cursed_talisman'] },
    { type: 'vajra', name: 'Vajrapani', role: 'Special', tier: 3, icon: '🔱', damage: 50, range: 100, cooldown: 1200, desc: "[Master] Heavy knockback on crit.", upgrades: ['asura'] },
    { type: 'saint', name: 'Saint of Vibration', role: 'Support', tier: 3, icon: '🔔', damage: 45, range: 100, cooldown: 1500, desc: "[Master] AOE Stun attacks.", upgrades: ['asura'] },
    { type: 'voidsniper', name: 'Void Sniper', role: 'Attack', tier: 3, icon: '🎯', damage: 120, range: 9999, cooldown: 2000, desc: "[Master] Snipes closest to gate.", upgrades: ['piercing_shadow'] },
    { type: 'thousandhand', name: 'Thousand-Hand Archer', role: 'Attack', tier: 3, icon: '🍃', damage: 40, range: 250, cooldown: 1500, desc: "[Master] Multiple arrows.", upgrades: ['piercing_shadow'] },
    { type: 'absolutezero', name: 'Absolute Zero Mage', role: 'Special', tier: 3, icon: '💎', damage: 30, range: 140, cooldown: 1000, desc: "[Master] Instakills low HP frozen targets.", upgrades: ['cocytus'] },
    { type: 'permafrost', name: 'Ice Maiden', role: 'Support', tier: 3, icon: '🌬️', damage: 25, range: 140, cooldown: 1000, desc: "[Master] Blizzard AOE slow.", upgrades: ['cocytus'] },
    { type: 'hellfire', name: 'Hellfire Alchemist', role: 'Attack', tier: 3, icon: '🧪', damage: 20, range: 130, cooldown: 1000, desc: "[Master] Exploding burning enemies.", upgrades: ['purgatory'] },
    { type: 'phoenix', name: 'Phoenix Summoner', role: 'Attack', tier: 3, icon: '🐦‍🔥', damage: 40, range: 180, cooldown: 2000, desc: "[Master] Trail of fire.", upgrades: ['purgatory'] },
    { type: 'abyssal', name: 'Abyssal Killer', role: 'Special', tier: 3, icon: '🌑', damage: 30, range: 100, cooldown: 300, desc: "[Master] 1.5x Soul Energy gain.", upgrades: ['reaper'] },
    { type: 'spatial', name: 'Spatial Slasher', role: 'Attack', tier: 3, icon: '🌌', damage: 25, range: 120, cooldown: 300, desc: "[Master] Clone summons.", upgrades: ['reaper'] },
    { type: 'seer', name: 'Seeker of Truth', role: 'Support', tier: 3, icon: '🔭', damage: 15, range: 120, cooldown: 1000, desc: "[Master] Reveal stealth.", upgrades: ['doom_guide'] },
    { type: 'commander', name: 'Battlefield Commander', role: 'Support', tier: 3, icon: '🚩', damage: 15, range: 120, cooldown: 1000, desc: "[Master] Nearby AS buff.", upgrades: ['doom_guide'] },
    { type: 'wraithlord', name: 'Wraith Lord', role: 'Support', tier: 3, icon: '🧟', damage: 40, range: 130, cooldown: 1200, desc: "[Master] Skeleton resurrections.", upgrades: ['forsaken_king'] },
    { type: 'cursedshaman', name: 'Cursed Shaman', role: 'Support', tier: 3, icon: '🎭', damage: 20, range: 130, cooldown: 1500, desc: "[Master] Max HP reduction curse.", upgrades: ['forsaken_king'] },
    { type: 'rampart', name: 'Holy Rampart', role: 'Support', tier: 3, icon: '🏰', damage: 40, range: 120, cooldown: 1500, desc: "[Master] Return reaching gate.", upgrades: ['void_gatekeeper'] },
    { type: 'judgment', name: 'Knight of Judgment', role: 'Attack', tier: 3, icon: '⚔️', damage: 60, range: 130, cooldown: 1500, desc: "[Master] Holy AOE chance.", upgrades: ['void_gatekeeper'] },
    { type: 'warden', name: 'Warden of the Abyss', role: 'Support', tier: 4, icon: '🗝️', damage: 100, range: 200, cooldown: 10000, desc: "[Abyss] Pull all to center." },
    { type: 'cursed_talisman', name: 'Cursed Sect', role: 'Attack', tier: 4, icon: '⛩️', damage: 80, range: 150, cooldown: 1200, desc: "[Abyss] Explode on death mark." },
    { type: 'asura', name: 'Hell Crushing Asura', role: 'Attack', tier: 4, icon: '👹', damage: 60, range: 120, cooldown: 400, desc: "[Abyss] 12 strikes." },
    { type: 'piercing_shadow', name: 'Soul Piercing Shadow', role: 'Attack', tier: 4, icon: '🌠', damage: 300, range: 9999, cooldown: 2000, desc: "[Abyss] Infinite pierce." },
    { type: 'cocytus', name: 'Ruler of Cocytus', role: 'Special', tier: 4, icon: '⏳', damage: 20, range: 200, cooldown: 20000, desc: "[Abyss] Time Freeze." },
    { type: 'purgatory', name: 'Eternal Purgatory Fire', role: 'Attack', tier: 4, icon: '🕯️', damage: 20, range: 150, cooldown: 800, desc: "[Abyss] Permanent hellfire row." },
    { type: 'reaper', name: 'Nightmare Reaper', role: 'Special', tier: 4, icon: '☠️', damage: 0, range: 0, cooldown: 3000, desc: "[Abyss] Instakill highest HP." },
    { type: 'doom_guide', name: 'Guide of Doom', role: 'Special', tier: 4, icon: '🛶', damage: 40, range: 150, cooldown: 800, desc: "[Abyss] Inverted portal gain." },
    { type: 'forsaken_king', name: 'King of the Forsaken', role: 'Support', tier: 4, icon: '👑', damage: 100, range: 150, cooldown: 1000, desc: "[Abyss] Spawn friendly ghosts." },
    { type: 'void_gatekeeper', name: 'Gatekeeper of the Void', role: 'Support', tier: 4, icon: '🚪', damage: 0, range: 0, cooldown: 0, desc: "[Abyss] Portal seal." },
    { type: 'eternal_wall', name: 'Guardian of Eternity', role: 'Support', tier: 4, icon: '🗿', damage: 150, range: 150, cooldown: 2000, desc: "[Abyss] 80% slow aura." }
];

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

function createSlots(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const cell = document.createElement('div');
        if (i < 3) { container.appendChild(cell); continue; }
        cell.classList.add('card-slot');
        slots.push(cell);
        container.appendChild(cell);
        cell.addEventListener('click', function() { if (isMovingUnit && draggedUnit) executeMove(draggedUnit, this); });
        cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('drag-over'); });
        cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
        cell.addEventListener('drop', e => { e.preventDefault(); cell.classList.remove('drag-over'); if (draggedUnit) executeMove(draggedUnit, cell); });
    }
}

function cancelMovement() { if (draggedUnit) draggedUnit.classList.remove('move-ready'); draggedUnit = null; isMovingUnit = false; }

function summonTower(targetSlot) {
    money -= towerCost;
    if (typeof updateGauges === 'function') updateGauges();
    towerCost += 5;
    const s = unitTypes[0];
    recordUnlock(s.type);
    const unit = document.createElement('div');
    unit.classList.add('unit', s.type);
    unit.title = s.name; unit.innerText = s.icon; unit.draggable = true;
    const cd = document.createElement('div');
    cd.className = 'cooldown-overlay'; cd.style.pointerEvents = 'none';
    unit.appendChild(cd);
    let ds;
    unit.addEventListener('dragstart', function() { draggedUnit = this; isMovingUnit = true; this.classList.add('selected'); const t = towers.find(x => x.element === this); if(t){showUnitInfo(t); showRangeIndicator(t);} });
    unit.addEventListener('mousedown', function(e) { if(e.button!==0)return; ds=Date.now(); });
    unit.addEventListener('click', function(e) { e.stopPropagation(); if(Date.now()-ds<400) { if(this.classList.contains('selected') && !isMovingUnit) { isMovingUnit=true; draggedUnit=this; this.classList.add('move-ready'); return; } document.querySelectorAll('.unit').forEach(u=>u.classList.remove('selected','move-ready')); this.classList.add('selected'); isMovingUnit=false; draggedUnit=null; const t=towers.find(x=>x.element===this); if(t){showUnitInfo(t); showRangeIndicator(t);} } });
    targetSlot.appendChild(unit); targetSlot.classList.add('occupied');
    const tower = { data: s, element: unit, slotElement: targetSlot, range: s.range, cooldown: s.cooldown, lastShot: 0, spentSE: towerCost - 5 };
    towers.push(tower); updateUnitOverlayButtons(tower); updateSummonButtonState();
}

let infoResetTimer = null;
function startInfoResetTimer() {
    if (infoResetTimer) clearTimeout(infoResetTimer);
    infoResetTimer = setTimeout(() => {
        const d = document.getElementById('unit-info');
        if (d) d.innerHTML = '<div class="info-default-text">GUARDIANS<br><span style="font-size:10px; opacity:0.8;">of the</span><br>UNDERWORLD</div>';
    }, 10000); // 10 seconds
}

function showUnitInfo(tower) {
    const d = document.getElementById('unit-info');
    const data = tower.data;
    let rc = '#ff4500'; if(data.role==='Basic') rc='#00ff00'; else if(data.role==='Support') rc='#00e5ff'; else if(data.role==='Special') rc='#ffd700';
    let th = `<div style="color:#ffd700; font-weight:bold; font-size:13px; margin-bottom:2px;">${data.name}</div><div style="display:inline-block; background:${rc}; color:#000; padding:1px 4px; border-radius:3px; font-size:8px; font-weight:bold; margin-bottom:4px;">${data.role}</div>`;
    let ih = `<div style="font-size:9px; color:#bbb; margin-bottom:4px;">ATK: ${data.damage} | Range: ${data.range} | CD: ${(data.cooldown/1000).toFixed(1)}s</div>`;
    let ch = ''; if(data.type==='apprentice') ch=`<div style="font-size:8px; color:#00ff00; margin-bottom:4px;">↗️ Ascend: 200 SE</div>`;
    else if(data.upgrades) { ch=`<div style="font-size:8px; color:#ffd700; margin-bottom:2px;">Unleash Master (500 SE):</div>`; data.upgrades.forEach((u,i)=>{const ud=unitTypes.find(x=>x.type===u); ch+=`<div style="font-size:7.5px; color:#aaa;">${i===0?'↖️':'↗️'}: ${ud.name}</div>`;}); }
    d.innerHTML = `${th}${ch}${ih}<div style="color:#888; font-size:9px; margin-top:2px; line-height:1.2;">${data.desc}</div>`;
    startInfoResetTimer();
}

function showEnemyInfo(enemy) {
    const d = document.getElementById('unit-info');
    const names = { 'normal': 'Whispering Soul', 'mist': 'Wandering Mist', 'memory': 'Faded Memory', 'shade': 'Flickering Shade', 'tank': 'Ironclad Wraith', 'runner': 'Haste-Cursed Shadow', 'greedy': 'Gluttonous Poltergeist', 'mimic': 'Mimic Soul', 'dimension': 'Void-Step Phantasm', 'deceiver': 'Siren of Despair', 'boar': 'Feral Revenant', 'soul_eater': 'Soul Eater', 'frost': 'Cocytus Drifter', 'lightspeed': 'Ethereal Streak', 'heavy': 'Grave-Bound Behemoth', 'lava': 'Magma-Veined Terror', 'burning': 'Eternal Zealot', 'gold': 'Gilded Apparition', 'defiled_apprentice': 'Defiled Apprentice', 'abyssal_acolyte': 'Abyssal Acolyte', 'bringer_of_doom': 'Bringer of Doom', 'cursed_vajra': 'Cursed Vajra', 'void_piercer': 'Void-Piercing Shade', 'frost_outcast': 'Frost-Bitten Outcast', 'ember_hatred': 'Embers of Hatred', 'betrayer_blade': "Betrayer's Blade", 'cerberus': 'Cerberus', 'charon': 'Charon', 'beelzebub': 'Beelzebub', 'lucifer': 'Lucifer' };
    
    const dispName = enemy.name || names[enemy.type] || enemy.type;
    const hp = Math.floor(enemy.hp);
    const maxHp = Math.floor(enemy.maxHp || hp);

    const bonus = typeof getBestiaryBonus === 'function' ? getBestiaryBonus(enemy.type) : 1;
    const bonusText = bonus > 1 ? `<div style="color: #00ff00; font-size: 8px; margin-bottom: 4px;">Bestiary Bonus: +${((bonus-1)*100).toFixed(0)}% DMG</div>` : '';

    d.innerHTML = `
        <div style="color: #ff4500; font-weight: bold; font-size: 13px; margin-bottom: 2px;">${dispName}</div>
        <div style="display:inline-block; background:#444; color:#fff; padding:1px 4px; border-radius:3px; font-size:8px; font-weight:bold; margin-bottom:4px;">SPECTER</div>
        ${bonusText}
        <div style="font-size: 9px; color: #ff0000; margin-bottom: 4px;">HP: ${hp} / ${maxHp}</div>
        <div style="color: #888; font-size: 9px; margin-top: 2px; line-height: 1.2;">${enemy.desc || 'A wandering soul from the abyss.'}</div>
    `;
    startInfoResetTimer();
}
window.showEnemyInfo = showEnemyInfo;

function initAllies() {
    const tc = document.getElementById('tower-card');
    if(tc) tc.addEventListener('click', () => { if(money<towerCost) return; const vs=slots.filter(c=>!c.classList.contains('occupied')); if(vs.length===0) return; summonTower(vs[Math.floor(Math.random()*vs.length)]); });
    const pc = document.getElementById('purge-card'); if(pc) pc.addEventListener('click', () => purgePortal());
    slots.length = 0; createSlots('left-slots', 27); createSlots('right-slots', 27);
    initRecordsUI(); initTutorial();
    const modal = document.getElementById('unlock-modal'); if(modal) modal.addEventListener('click', () => { modal.style.display='none'; isPaused=false; });
    const retry = document.getElementById('retry-btn'); if(retry) retry.addEventListener('click', () => location.reload());
    const rbt = document.getElementById('restart-btn-top'); if(rbt) rbt.addEventListener('click', () => { isPaused=true; const go=document.getElementById('game-over-overlay'); if(go) go.style.display='flex'; });
}

function initRecordsUI() {
    const rb = document.getElementById('records-btn'); const ro = document.getElementById('records-overlay');
    if(rb && ro) rb.addEventListener('click', () => { isPaused=true; ro.style.display='flex'; renderBestiary(); });
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
        { h: 'Basic Specters', c: '#00e5ff', types: ['normal', 'mist', 'memory', 'shade', 'tank', 'runner'] },
        { h: 'Specialized Wraiths', c: '#ff00ff', types: ['greedy', 'mimic', 'dimension', 'deceiver', 'boar', 'soul_eater', 'frost', 'lightspeed', 'heavy', 'lava', 'burning'] },
        { h: 'Treasure Specters', c: '#ffd700', types: ['gold'] },
        { h: 'Corrupted Specters', c: '#ff0000', types: ['defiled_apprentice', 'abyssal_acolyte', 'bringer_of_doom', 'cursed_vajra', 'void_piercer', 'frost_outcast', 'ember_hatred', 'betrayer_blade'] },
        { h: 'Abyss Bosses', c: '#8b0000', types: ['cerberus', 'charon', 'beelzebub', 'lucifer'] }
    ];
    const corruptInfo = {
        'defiled_apprentice': 'Apprentice',
        'cursed_vajra': 'Monk Path',
        'void_piercer': 'Archer Path',
        'frost_outcast': 'Ice Path',
        'ember_hatred': 'Fire Path',
        'betrayer_blade': 'Assassin Path',
        'abyssal_acolyte': 'Any Tier 3+',
        'bringer_of_doom': 'Any Tier 4'
    };
    const corruptTriggerMap = {
        'defiled_apprentice': ['apprentice'],
        'cursed_vajra': ['monk', 'vajra', 'saint', 'asura'],
        'void_piercer': ['archer', 'voidsniper', 'thousandhand', 'piercing_shadow'],
        'frost_outcast': ['ice', 'absolutezero', 'permafrost', 'cocytus'],
        'ember_hatred': ['fire', 'hellfire', 'phoenix', 'purgatory'],
        'betrayer_blade': ['assassin', 'abyssal', 'spatial', 'reaper'],
        'abyssal_acolyte': ['executor', 'binder', 'grandsealer', 'flamemaster', 'vajra', 'saint', 'voidsniper', 'thousandhand', 'absolutezero', 'permafrost', 'hellfire', 'phoenix', 'abyssal', 'spatial', 'seer', 'commander', 'wraithlord', 'cursedshaman', 'rampart', 'judgment', 'paladin', 'crusader'],
        'bringer_of_doom': ['warden', 'cursed_talisman', 'asura', 'piercing_shadow', 'cocytus', 'purgatory', 'reaper', 'doom_guide', 'forsaken_king', 'void_gatekeeper', 'eternal_wall']
    };

    groups.forEach(g => {
        const h = document.createElement('h3'); h.innerText=g.h; h.style.cssText=`grid-column:1/-1; color:${g.c}; border-bottom:1px solid #333; margin:15px 0 8px 0; font-size:14px;`; bt.appendChild(h);
        
        g.types.forEach(t => {
            let isKnown = false;
            if (g.h === 'Basic Specters') {
                isKnown = true; 
            } else if (g.h === 'Corrupted Specters') {
                const triggers = corruptTriggerMap[t] || [];
                isKnown = triggers.some(unit => unlockedUnits.has(unit));
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
            if(!d && typeof corruptedTypes!=='undefined') d=corruptedTypes[t]; 
            if(!d) return;

            const kills = killCounts[t] || 0; 
            const bonus = getBestiaryBonus(t); 
            const btx = bonus>1?`<br>DMG +${((bonus-1)*100).toFixed(0)}%`:`<br>No Bonus`;
            
            let rVal = d.reward;
            if (rVal === undefined) {
                if (g.h === 'Abyss Bosses') rVal = 500;
                else if (g.h === 'Corrupted Specters') rVal = 0;
                else rVal = 10;
            }
            const rewardText = ` | ✨ ${rVal}`;
            const originText = (g.h === 'Corrupted Specters' && corruptInfo[t]) ? `<div style="font-size:7px; color:#ff4444; margin-bottom:2px; font-weight:bold;">[ORIGIN: ${corruptInfo[t]}]</div>` : '';
            const traitOriginText = (g.h !== 'Corrupted Specters' && corruptInfo[t]) ? `<br><strong style="color:#ff0000;">[Origin]</strong> ${corruptInfo[t]}` : '';
            
            const item = document.createElement('div'); 
            item.className = `bestiary-item ${isKnown ? '' : 'locked'}`;
            
            if (isKnown) {
                const statsDisplay = g.h === 'Corrupted Specters' ? `💀 ${kills}${rewardText}` : `💀 ${kills}${rewardText}${btx}`;
                item.innerHTML = `
                    <div class="custom-tooltip specter">
                        <strong style="color:#ffd700;">[Trait]</strong><br>${d.desc || d.lore || 'A powerful soul from the abyss.'}${traitOriginText}
                    </div>
                    ${originText}
                    <div class="bestiary-icon enemy ${t}" style="position:static; transform:none; display:flex; justify-content:center; align-items:center;">${d.icon}</div>
                    <div class="bestiary-info">
                        <div class="bestiary-name">${names[t]||t}</div>
                        <div class="bestiary-stats">${statsDisplay}</div>
                    </div>`;
            } else {
                item.innerHTML = `
                    <div class="custom-tooltip specter">
                        <strong style="color:#ffd700;">[Information Unavailable]</strong><br>Defeat this specter or unlock its related class to reveal details.
                    </div>
                    <div class="bestiary-icon" style="position:static; transform:none; display:flex; justify-content:center; align-items:center; background:#222; color:#555; font-size:20px; border:1px dashed #444;">?</div>
                    <div class="bestiary-info">
                        <div class="bestiary-name" style="color:#555;">???</div>
                        <div class="bestiary-stats" style="color:#333;">💀 Locked</div>
                    </div>`;
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
        'Special Paths': [ {n:'Sanctuary Guardian',t:'guardian',m:['rampart','judgment'],a:'void_gatekeeper'} ]
    };
    Object.keys(pg).forEach(gn => {
        const h = document.createElement('h3'); let c="#ff4500"; if(gn.includes('Support')) c="#00e5ff"; if(gn.includes('Special')) c="#ffd700";
        h.innerText=gn; h.style.cssText=`color:${c}; border-bottom:1px solid #333; margin:8px 0 4px 0; font-size:13px; text-align:center;`; tt.appendChild(h);
        const tc = document.createElement('div'); tc.className='tree-main-container'; tc.style.cssText='display:flex; flex-direction:column; gap:4px;';
        pg[gn].forEach(p => {
            const row = document.createElement('div'); row.style.cssText='display:grid; grid-template-columns:70px 12px 85px 12px 105px 12px 105px; align-items:center; justify-content:center; gap:3px; border-bottom:1px solid #222; padding-bottom:4px;';
            const node = (type,tier) => {
                const d=unitTypes.find(x=>x.type===type); 
                const u=unlockedUnits.has(type);
                const n=document.createElement('div'); n.className=`unit-node tier${tier} ${u?'':'locked'}`; n.style.cssText='position:relative; font-size:7px; padding:2px 4px; min-width:auto;';
                if (u) {
                    n.innerHTML = `<div class="custom-tooltip"><strong>${d.name}</strong><br>${d.desc}</div>${d.icon} ${d.name}`;
                } else {
                    n.innerHTML = `<div class="custom-tooltip"><strong>[Hidden Class]</strong><br>Promote to this class during a mission to unlock its records.</div>? ???`;
                    n.style.color = '#555';
                }
                return n;
            };
            const arrow = () => { const a=document.createElement('div'); a.innerText='→'; a.style.fontSize='8px'; return a; };
            row.appendChild(node('apprentice',1)); row.appendChild(arrow()); row.appendChild(node(p.t,2)); row.appendChild(arrow());
            const mdiv = document.createElement('div'); mdiv.style.cssText='display:flex; flex-direction:column; gap:2px;';
            p.m.forEach(m=>mdiv.appendChild(node(m,3))); row.appendChild(mdiv); row.appendChild(arrow()); row.appendChild(node(p.a,4));
            tc.appendChild(row);
        }); tt.appendChild(tc);
    });
}

function purgePortal() {
    const pc = 800; const pa = portalEnergy * 0.5;
    if(money>=pc && portalEnergy>0) { money-=pc; portalEnergy=Math.max(0,portalEnergy-pa); if(typeof updateGauges==='function')updateGauges(); }
}

function performJobChange(el) {
    if(money<jobChangeCost) return; money-=jobChangeCost; if(typeof updateGauges==='function')updateGauges();
    const t = towers.find(x=>x.element===el); if(!t) return;
    const paths = [ {from:'apprentice', to:['chainer','talisman','monk','archer','ice','fire','assassin','tracker','necromancer','guardian','knight']} ];
    const p = paths.find(x=>x.from===t.data.type); if(!p) return;
    const ntStr = p.to[Math.floor(Math.random()*p.to.length)]; const nt = unitTypes.find(x=>x.type===ntStr);
    el.className=`unit ${nt.type}`; el.title=nt.name; el.innerText=nt.icon;
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);
    recordUnlock(nt.type); t.data=nt; t.range=nt.range; t.cooldown=nt.cooldown; t.spentSE+=jobChangeCost;
    updateUnitOverlayButtons(t); updateSummonButtonState();
}

function performMasterJobChange(tower, ntStr) {
    if(money<masterJobCost) return; money-=masterJobCost; if(typeof updateGauges==='function')updateGauges();
    const nt = unitTypes.find(x=>x.type===ntStr); const el = tower.element;
    el.className=`unit ${nt.type}`; el.title=nt.name; el.innerText=nt.icon;
    const cdo = document.createElement('div'); cdo.className='cooldown-overlay'; cdo.style.pointerEvents='none'; el.appendChild(cdo);
    recordUnlock(nt.type); tower.data=nt; tower.range=nt.range; tower.cooldown=nt.cooldown; tower.spentSE+=masterJobCost;
    if(nt.type==='rampart') tower.charges=5;
    updateUnitOverlayButtons(tower); updateSummonButtonState();
}

function updateUnitOverlayButtons(t) {
    const el = t.element; el.querySelectorAll('.unit-overlay-btn').forEach(b=>b.remove());
    const sell = document.createElement('div'); sell.className='unit-overlay-btn sell-btn'; sell.innerHTML='💀'; sell.title='Corrupt Unit (Sell)';
    sell.addEventListener('click', e=>{ e.stopPropagation(); sellTower(t); }); el.appendChild(sell);
    if(t.data.type==='apprentice') {
        const up = document.createElement('div'); up.className='unit-overlay-btn promote-btn'; up.innerHTML='↗️'; up.title='Ascend (200 SE)';
        up.addEventListener('click', e=>{ e.stopPropagation(); performJobChange(el); }); el.appendChild(up);
    } else if(t.data.upgrades) {
        t.data.upgrades.forEach((u,i)=>{
            const ud=unitTypes.find(x=>x.type===u); const b=document.createElement('div');
            b.className=i===0?'unit-overlay-btn promote-btn':'unit-overlay-btn promote-btn-right'; b.innerHTML=i===0?'↖️':'↗️'; b.title=`Unleash ${ud.name} (500 SE)`;
            b.addEventListener('click', e=>{ e.stopPropagation(); performMasterJobChange(t,u); }); el.appendChild(b);
        });
    }
}

function sellTower(t) {
    const s = t.slotElement; s.classList.remove('occupied'); t.element.remove();
    const idx = towers.indexOf(t); if(idx>-1) towers.splice(idx,1);
    if(typeof window.spawnCorruptedEnemy === 'function') {
        let ct = 'defiled_apprentice';
        if(['monk','vajra','saint'].includes(t.data.type)) ct='cursed_vajra';
        else if(['archer','voidsniper','thousandhand'].includes(t.data.type)) ct='void_piercer';
        else if(['ice','absolutezero','permafrost'].includes(t.data.type)) ct='frost_outcast';
        else if(['fire','hellfire','phoenix'].includes(t.data.type)) ct='ember_hatred';
        else if(['assassin','abyssal','spatial'].includes(t.data.type)) ct='betrayer_blade';
        else if(t.data.tier>=3) ct='abyssal_acolyte';
        if(t.data.tier===4) ct='bringer_of_doom';
        window.spawnCorruptedEnemy(t, ct);
    }
}

function updateSummonButtonState() {
    const tc = document.getElementById('tower-card'); if(!tc) return;
    if(money<towerCost || towers.length>=maxTowers) tc.classList.add('locked'); else tc.classList.remove('locked');
    const pc = document.getElementById('purge-card'); if(!pc) return;
    if(money<800 || portalEnergy<=0) pc.classList.add('locked'); else pc.classList.remove('locked');
}
