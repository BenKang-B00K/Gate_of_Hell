/* records.js - Exorcism Records System */

function initRecords() {
    const ro = document.getElementById('records-overlay');
    if(!ro) return;

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
            }
        });
    });

    // Close Button
    const closeBtn = document.getElementById('close-records');
    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            ro.style.display = 'none';
            isPaused = false;
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

    groups.forEach(g => {
        g.types.forEach(t => {
            const isKnown = (window.encounteredEnemies && window.encounteredEnemies.has(t)) || (killCounts[t] > 0) || (g.h === 'Minions');
            let data;
            // Search in enemyCategories
            for(let cat in enemyCategories) {
                const found = enemyCategories[cat].find(e => e.type === t);
                if(found) { data = found; break; }
            }
            // Search in bossData
            if(!data && typeof bossData !== 'undefined') {
                for(let key in bossData) { if(bossData[key].type === t) { data = bossData[key]; break; } }
            }
            if(!data) return;

            const kills = killCounts[t] || 0;
            const reward = data.reward || (g.h === 'Bosses' ? 500 : 10);
            const bonus = typeof getBestiaryBonus === 'function' ? getBestiaryBonus(t) : 1;

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
    tiers.forEach(tier => {
        const section = document.createElement('div');
        section.className = 'tier-section';
        section.innerHTML = `<h3 class="tier-header">Tier ${tier} Guardians</h3>`;
        
        const grid = document.createElement('div');
        grid.className = 'exorcist-grid';
        
        const units = unitTypes.filter(u => u.tier === tier);
        units.forEach(u => {
            const isUnlocked = unlockedUnits.has(u.type);
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
                    if(cvs) drawUnitPreview(u.type, cvs.getContext('2d'), 120, 120);
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

    const createNode = (type, tier) => {
        const d = unitTypes.find(x => x.type === type);
        const isUnlocked = unlockedUnits.has(type);
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
            if (cvs) drawUnitPreview(type, cvs.getContext('2d'), 120, 120);
            
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

// Global initialization override
window.renderBestiary = renderSpecters; // Legacy support
window.renderPromotionTree = renderPromotionTree;
window.initRecordsUI = initRecords;
