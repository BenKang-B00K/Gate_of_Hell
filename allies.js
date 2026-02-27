/* allies.js - Initialization and Common Utilities */

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
                name.innerHTML = `${fullName}<br><span style="font-size:30px; color:#aaa;">(HP: ${hpVal})</span>`;
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
                const col = parseInt(c.dataset.col); const area = c.dataset.area;
                if (area === 'left-slots') return col >= 1;
                if (area === 'right-slots') return col <= 1;
                return false;
            });
            if(vs.length === 0) {
                const fallbackVs = slots.filter(c => !c.classList.contains('occupied'));
                if (fallbackVs.length === 0) return;
                summonTower(fallbackVs[Math.floor(Math.random()*fallbackVs.length)]);
            } else { summonTower(vs[Math.floor(Math.random()*vs.length)]); }
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
    const pc = document.getElementById('purge-card'); if(pc) {
        pc.addEventListener('click', () => purgePortal());
        pc.addEventListener('mouseenter', () => showResourceInfo('purge'));
    }
    const sel = document.getElementById('se-label'); if(sel) sel.addEventListener('mouseenter', () => showResourceInfo('se'));
    const shl = document.getElementById('shards-label'); if(shl) shl.addEventListener('mouseenter', () => showResourceInfo('shards'));
    const sdh = document.getElementById('stage-debuff-header'); if(sdh) {
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

    slots.length = 0; createSlots('left-slots', 24); createSlots('right-slots', 24);
    initRecordsUI(); initTutorial();
    
    const modal = document.getElementById('unlock-modal'); if(modal) modal.addEventListener('click', () => { modal.style.display='none'; isPaused=false; });
    const retry = document.getElementById('retry-btn'); if(retry) retry.addEventListener('click', () => location.reload());
    
    const rbt = document.getElementById('restart-btn-top'); if(rbt) {
        rbt.addEventListener('click', () => { isPaused = true; const ro = document.getElementById('restart-confirm-overlay'); if (ro) ro.style.display = 'flex'; });
    }
    const crb = document.getElementById('confirm-restart-btn'); if(crb) crb.addEventListener('click', () => location.reload());
    const canrb = document.getElementById('cancel-restart-btn-actual');
    if(canrb) { canrb.addEventListener('click', () => { const ro = document.getElementById('restart-confirm-overlay'); if (ro) ro.style.display = 'none'; isPaused = false; }); }
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

function updateSummonButtonState() {
    const tc = document.getElementById('tower-card'); if(!tc) return;
    const scd = document.getElementById('summon-cost-display');
    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, towerCost - reduction);
    if(scd) scd.innerText = `${finalTowerCost} SE`;
    const isMax = towers.length >= maxTowers;
    const sw = document.getElementById('summon-warning');
    if(sw) {
        if (money < finalTowerCost && !isMax) { sw.style.display = 'block'; sw.innerText = 'NOT ENOUGH SE'; }
        else sw.style.display = 'none';
    }
    if(money<finalTowerCost || isMax) tc.classList.add('locked'); else tc.classList.remove('locked');
    const pc = document.getElementById('purge-card'); if(!pc) return;
    const pw = document.getElementById('purge-warning');
    if(pw) {
        if (money < 800 && portalEnergy > 0) { pw.style.display = 'block'; pw.innerText = 'NOT ENOUGH SE'; }
        else pw.style.display = 'none';
    }
    if(money<800 || portalEnergy<=0) pc.classList.add('locked'); else pc.classList.remove('locked');
}

function purgePortal() {
    const pc = 800; const pa = portalEnergy * 0.5;
    if(money>=pc && portalEnergy>0) { money-=pc; portalEnergy=Math.max(0,portalEnergy-pa); if(typeof updateGauges==='function')updateGauges(); }
}
