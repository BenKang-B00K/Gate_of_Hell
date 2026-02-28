/* records.js - Exorcism Records System */

function initRecords() {
    console.log("Initializing Exorcism Records...");
    const rb = document.getElementById('records-btn');
    const ro = document.getElementById('records-overlay');
    if(!ro) {
        console.error("Records overlay not found!");
        return;
    }

    // Open Button
    if(rb) {
        rb.addEventListener('click', () => {
            console.log("Records button clicked");
            window.isPaused = true;
            ro.style.display = 'flex';
            renderSpecters(); // Default tab
        });
        
        rb.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            const locked = window.infoPanelLockedUntil || 0;
            if (d && Date.now() >= locked) {
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

    // Handle Tab Switching
    document.querySelectorAll('#records-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#records-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('#tab-content .tab-pane').forEach(p => p.classList.remove('active'));
            const targetId = `${this.dataset.tab}-tab`;
            const targetPane = document.getElementById(targetId);
            if(targetPane) targetPane.classList.add('active');

            // Render specific tab content
            switch(this.dataset.tab) {
                case 'specters': renderSpecters(); break;
                case 'exorcists': renderExorcists(); break;
                case 'tree': renderPromotionTree(); break;
                case 'achievements': renderAchievements(); break;
                case 'settings': renderSettings(); break;
            }
        });
    });

    // Close Button
    const closeBtn = document.getElementById('close-records');
    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            ro.style.display = 'none';
            window.isPaused = false;
        });
    }
}

// 1. Specters (악령 도감) - 12 Column Card Layout
function renderSpecters() {
    const pane = document.getElementById('specters-tab');
    if(!pane) return;
    pane.innerHTML = '';

    const groups = [
        { h: 'Minions', types: ['normal', 'mist', 'memory', 'shade', 'tank', 'runner'] },
        { h: 'Elites', types: ['defiled_apprentice', 'greedy', 'mimic', 'dimension', 'deceiver', 'boar', 'soul_eater', 'frost', 'lightspeed', 'heavy', 'lava', 'burning', 'abyssal_acolyte', 'bringer_of_doom', 'cursed_vajra', 'void_piercer', 'frost_outcast', 'ember_hatred', 'betrayer_blade'] },
        { h: 'Bosses', types: ['cerberus', 'charon', 'beelzebub', 'lucifer'] }
    ];

    const encountered = window.encounteredEnemies || new Set();
    const kc = window.killCounts || {};

    groups.forEach(g => {
        g.types.forEach(t => {
            const isKnown = encountered.has(t) || (kc[t] > 0) || (g.h === 'Minions');
            let data;
            // Search in enemyCategories
            if(window.enemyCategories) {
                for(let cat in window.enemyCategories) {
                    const found = window.enemyCategories[cat].find(e => e.type === t);
                    if(found) { data = found; break; }
                }
            }
            // Search in bossData
            if(!data && window.bossData) {
                for(let key in window.bossData) { if(window.bossData[key].type === t) { data = window.bossData[key]; break; } }
            }
            if(!data) return;

            const kills = kc[t] || 0;
            const reward = data.reward || (g.h === 'Bosses' ? 500 : 10);
            const bonus = typeof window.getBestiaryBonus === 'function' ? window.getBestiaryBonus(t) : 1;

            const card = document.createElement('div');
            card.className = `specter-card ${isKnown ? '' : 'locked'}`;
            
            if(isKnown) {
                card.innerHTML = `
                    <div class="custom-tooltip">
                        <strong style="color:#ffd700;">${data.name || t}</strong><br>
                        ${data.desc || data.lore || 'A soul from the abyss.'}
                    </div>
                    <div class="mini-sprite">${data.icon}</div>
                    <div class="full-name">${data.name || t}</div>
                    <div class="stat-line">💀 ${kills} | ✨ ${reward}</div>
                    ${bonus > 1 ? `<div class="bonus-text">DMG +${((bonus-1)*100).toFixed(0)}%</div>` : ''}
                `;
            } else {
                card.innerHTML = `
                    <div class="mini-sprite">?</div>
                    <div class="full-name">???</div>
                    <div class="stat-line">LOCKED</div>
                `;
            }
            pane.appendChild(card);
        });
    });
}

// 2. Exorcists (퇴마사 도감) - Card Format by Tier
function renderExorcists() {
    const pane = document.getElementById('exorcists-tab');
    if(!pane) return;
    pane.innerHTML = '';

    const tiers = [1, 2, 3, 4];
    const unlocked = window.unlockedUnits || new Set(['apprentice']);
    const uTypes = window.unitTypes || [];

    tiers.forEach(tier => {
        const section = document.createElement('div');
        section.className = 'tier-section';
        section.innerHTML = `<h3 class="tier-header">Tier ${tier} Guardians</h3>`;
        
        const grid = document.createElement('div');
        grid.className = 'exorcist-grid';
        
        const units = uTypes.filter(u => u.tier === tier);
        units.forEach(u => {
            const isUnlocked = unlocked.has(u.type);
            const card = document.createElement('div');
            card.className = `exorcist-card ${isUnlocked ? '' : 'locked'}`;
            
            if(isUnlocked) {
                card.innerHTML = `
                    <div class="sprite-box">
                        <canvas id="prev-ex-${u.type}" width="120" height="120"></canvas>
                    </div>
                    <div class="info-box">
                        <div class="name">${u.name}</div>
                        <div class="effect">✨ ${u.desc}</div>
                        <div class="lore">"The chronicles of the underworld whisper of their deeds..."</div>
                    </div>
                `;
                setTimeout(() => {
                    const cvs = document.getElementById(`prev-ex-${u.type}`);
                    if(cvs && typeof window.drawUnitPreview === 'function') {
                        window.drawUnitPreview(u.type, cvs.getContext('2d'), 120, 120);
                    }
                }, 0);
            } else {
                card.innerHTML = `
                    <div class="sprite-box" style="display:flex; align-items:center; justify-content:center; font-size:60px; color:#333;">?</div>
                    <div class="info-box">
                        <div class="name" style="color:#444;">[HIDDEN CLASS]</div>
                        <div class="effect" style="color:#333;">Promote a guardian to this class to reveal its secrets.</div>
                    </div>
                `;
            }
            grid.appendChild(card);
        });
        
        section.appendChild(grid);
        pane.appendChild(section);
    });
}

// 3. Ascendency Tree (전직 트리) - Toggleable Info
function renderPromotionTree() {
    const pane = document.getElementById('tree-tab');
    if(!pane) return;
    pane.innerHTML = '';

    const pg = {
        'Attack Paths': { class: 'attack', paths: [
            {n:'Talismanist',t:'talisman',m:['grandsealer','flamemaster'],a:'cursed_talisman'},
            {n:'Divine Archer',t:'archer',m:['voidsniper','thousandhand'],a:'piercing_shadow'},
            {n:'Fire Mage',t:'fire',m:['hellfire','phoenix'],a:'purgatory'},
            {n:'Shadow Assassin',t:'assassin',m:['abyssal','spatial'],a:'reaper'},
            {n:'Exorcist Knight',t:'knight',m:['paladin','crusader'],a:'eternal_wall'}
        ]},
        'Support Paths': { class: 'support', paths: [
            {n:'Soul Chainer',t:'chainer',m:['executor','binder'],a:'warden'},
            {n:'Mace Monk',t:'monk',m:['vajra','saint'],a:'asura'},
            {n:'Ice Daoist',t:'ice',m:['absolutezero','permafrost'],a:'cocytus'},
            {n:'Soul Tracker',t:'tracker',m:['seer','commander'],a:'doom_guide'},
            {n:'Necromancer',t:'necromancer',m:['wraithlord','cursedshaman'],a:'forsaken_king'}
        ]},
        'Special Paths': { class: 'special', paths: [
            {n:'Sanctuary Guardian',t:'guardian',m:['rampart','judgment'],a:'void_gatekeeper'},
            {n:'Exorcist Alchemist',t:'alchemist',m:['midas','philosopher'],a:'transmuter'},
            {n:'Mirror Oracle',t:'mirror',m:['illusion','reflection'],a:'oracle'}
        ]}
    };

    const unlocked = window.unlockedUnits || new Set(['apprentice']);
    const uTypes = window.unitTypes || [];

    const createNode = (type, tier) => {
        const d = uTypes.find(x => x.type === type);
        const isUnlocked = unlocked.has(type);
        const node = document.createElement('div');
        node.className = `unit-node tier${tier} ${isUnlocked ? '' : 'locked'}`;
        
        if (isUnlocked) {
            node.innerHTML = `
                <div class="custom-tooltip">
                    <strong style="color:#ffd700; font-size:28px;">${d.name}</strong><br>
                    <span style="color:#aaa; font-size:20px; font-style:italic;">Tier ${tier} ${d.role}</span>
                </div>
                <canvas class="node-sprite-canvas" width="120" height="120"></canvas>
                <div class="node-name">${d.name}</div>
                <div class="effect-box">${d.desc}</div>
            `;
            const cvs = node.querySelector('.node-sprite-canvas');
            if (cvs && typeof window.drawUnitPreview === 'function') {
                window.drawUnitPreview(type, cvs.getContext('2d'), 120, 120);
            }
            
            node.addEventListener('click', (e) => {
                e.stopPropagation();
                node.classList.toggle('expanded');
            });
        } else {
            node.innerHTML = `
                <div class="node-icon">?</div>
                <div class="node-name">???</div>
            `;
        }
        return node;
    };

    const arrow = () => {
        const a = document.createElement('div');
        a.className = 'tree-arrow'; a.innerText = '→';
        return a;
    };

    Object.keys(pg).forEach(gn => {
        const group = pg[gn];
        const gdiv = document.createElement('div');
        gdiv.className = `tree-group ${group.class}`;
        gdiv.innerHTML = `<div class="tree-group-title">${gn}</div>`;

        const mcont = document.createElement('div');
        mcont.className = 'tree-main-container';

        group.paths.forEach(p => {
            const row = document.createElement('div');
            row.className = 'tree-row';
            row.appendChild(createNode('apprentice', 1));
            row.appendChild(arrow());
            row.appendChild(createNode(p.t, 2));
            row.appendChild(arrow());
            
            const choiceDiv = document.createElement('div');
            choiceDiv.className = 'tier3-choice';
            p.m.forEach(m => choiceDiv.appendChild(createNode(m, 3)));
            row.appendChild(choiceDiv);
            row.appendChild(arrow());
            
            row.appendChild(createNode(p.a, 4));
            mcont.appendChild(row);
        });

        gdiv.appendChild(mcont);
        pane.appendChild(gdiv);
    });
}

function renderAchievements() {
    const pane = document.getElementById('achievements-tab');
    if(!pane) return;
    pane.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:30px; padding:20px;">
            <h2 style="color:#ffd700; font-size:48px; border-bottom:2px solid #333; padding-bottom:15px;">CHRONICLES OF VALOR</h2>
            <div class="exorcist-card" style="border-color:#555; opacity:0.6;">
                <div class="sprite-box" style="display:flex; align-items:center; justify-content:center; font-size:60px;">🏆</div>
                <div class="info-box">
                    <div class="name">First Purge</div>
                    <div class="effect">Defeat 100 Specters.</div>
                    <div class="lore">Progress: ${Object.values(window.killCounts || {}).reduce((a,b)=>a+b, 0)} / 100</div>
                </div>
            </div>
            <div class="exorcist-card" style="border-color:#555; opacity:0.6;">
                <div class="sprite-box" style="display:flex; align-items:center; justify-content:center; font-size:60px;">💀</div>
                <div class="info-box">
                    <div class="name">Master of Arts</div>
                    <div class="effect">Unlock all Tier 3 Classes.</div>
                    <div class="lore">Progress: ${window.unitTypes.filter(u=>u.tier===3 && window.unlockedUnits.has(u.type)).length} / ${window.unitTypes.filter(u=>u.tier===3).length}</div>
                </div>
            </div>
            <div style="color:#666; font-style:italic; font-size:24px; text-align:center; margin-top:40px;">More achievements coming soon in future updates...</div>
        </div>
    `;
}

function renderSettings() {
    const pane = document.getElementById('settings-tab');
    if(!pane) return;
    pane.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:40px; padding:20px; color:#eee;">
            <h2 style="color:#ffd700; font-size:48px; border-bottom:2px solid #333; padding-bottom:15px;">GAME SETTINGS</h2>
            
            <div style="display:flex; justify-content:space-between; align-items:center; background:#1a1a1a; padding:30px; border-radius:15px; border:1px solid #333;">
                <div>
                    <div style="font-size:30px; font-weight:bold;">Visual Tutorials</div>
                    <div style="font-size:20px; color:#888;">Show pop-up info when encountering new entities.</div>
                </div>
                <label class="switch" style="transform:scale(1.5);">
                    <input type="checkbox" id="settings-tutorial-toggle" ${document.getElementById('tutorial-toggle')?.checked ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; background:#1a1a1a; padding:30px; border-radius:15px; border:1px solid #333; opacity:0.5;">
                <div>
                    <div style="font-size:30px; font-weight:bold;">Audio Volume (TBD)</div>
                    <div style="font-size:20px; color:#888;">Control master volume for sound effects.</div>
                </div>
                <input type="range" disabled style="width:200px;">
            </div>

            <div style="text-align:center; margin-top:20px;">
                <button onclick="location.reload()" style="background:#4a0000; color:#ff4500; border:2px solid #8b0000; padding:15px 40px; font-size:24px; cursor:pointer; border-radius:10px; font-weight:bold;">FORCIBLY RESTART GAME</button>
            </div>
        </div>
    `;

    // Link the tutorial toggle
    const stt = document.getElementById('settings-tutorial-toggle');
    if(stt) {
        stt.addEventListener('change', () => {
            const mainToggle = document.getElementById('tutorial-toggle');
            if(mainToggle) {
                mainToggle.checked = stt.checked;
                mainToggle.dispatchEvent(new Event('change'));
            }
        });
    }
}

// Global initialization override
window.initRecords = initRecords;
window.renderSpecters = renderSpecters;
window.renderExorcists = renderExorcists;
window.renderPromotionTree = renderPromotionTree;
