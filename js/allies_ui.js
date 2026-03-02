/* allies_ui.js - Ultra-Compact Info System */

let infoResetTimer = null;
let infoPanelLockedUntil = 0;

function initAllies() {
    attachGlobalListeners();
}

let listenersAttached = false;
function attachGlobalListeners() {
    if (listenersAttached) return;

    const d = document.getElementById('unit-info');
    const updateInfo = (html) => { if(d) { d.innerHTML = html; if (typeof startInfoResetTimer === 'function') startInfoResetTimer(); } };

    // 1. Summon Card
    document.getElementById('tower-card')?.addEventListener('mouseenter', () => {
        const cost = Math.max(5, Math.floor(window.towerCost - (typeof getRelicBonus === 'function' ? getRelicBonus('summon_cost_reduction') : 0)));
        updateInfo(`
            <div class="unit-info-title">🧙 견습 퇴마사</div>
            <div style="color:#00ff00; font-size:10px; font-weight:bold; margin:2px 0;">비용: ${cost} SE</div>
            <div class="unit-info-desc">중앙 슬롯에 무작위 소환됩니다. 소환 시마다 비용이 5 증가합니다.</div>
        `);
    });

    // 2. Shrine Card
    document.getElementById('shrine-card')?.addEventListener('mouseenter', () => {
        updateInfo(`
            <div class="unit-info-title">🕍 성소 건립</div>
            <div style="color:#00e5ff; font-size:10px; font-weight:bold; margin:2px 0;">비용: ${window.shrineCost} SE</div>
            <div class="unit-info-desc">전용 슬롯에 배치하여 주변 아군에게 강력한 공격력 버프를 제공합니다.</div>
        `);
    });

    // 3. Purge Card
    document.getElementById('purge-card')?.addEventListener('mouseenter', () => {
        updateInfo(`
            <div class="unit-info-title" style="color:#9400d3;">🔥 공간 정화</div>
            <div style="color:#ff1744; font-size:10px; font-weight:bold; margin:2px 0;">비용: 800 SE</div>
            <div class="unit-info-desc">즉시 포탈 오염도를 50% 제거합니다. 위기 상황에서 사용하십시오.</div>
        `);
    });

    // 4. Relics/Equip/Records (Systems)
    const sysInfo = {
        'relics-btn': { t: '🏺 유물', c: '#ff4500', d: '정화 중 획득한 보물로 아군 전체를 영구 강화합니다.' },
        'equip-btn': { t: '⚔️ 장비', c: '#00e5ff', d: '장착 시 특정 능력치를 대폭 상승시키는 고대의 무구입니다.' },
        'collections-btn': { t: '📖 도감', c: '#ffd700', d: '지금까지 조우한 악령들과 아군들의 상세 기록을 확인합니다.' }
    };
    Object.entries(sysInfo).forEach(([id, info]) => {
        document.getElementById(id)?.addEventListener('mouseenter', () => {
            updateInfo(`<div class="unit-info-title" style="color:${info.c};">${info.t}</div><div class="unit-info-desc">${info.d}</div>`);
        });
    });

    listenersAttached = true;
}

function showUnitInfo(tower) {
    window.infoPanelLockedUntil = Date.now() + 5000;
    const d = document.getElementById('unit-info');
    if (!d) return;

    const data = tower.data;
    const formatB = (v) => v > 0 ? `<span style="color:#0f0;font-size:7px;">+${v}</span>` : v < 0 ? `<span style="color:#f00;font-size:7px;">${v}</span>` : "";
    window.lastInspectedTower = tower;

    if (tower.isShrine) {
        d.innerHTML = `
            <div class="info-row"><div class="unit-info-title">${data.name}</div>
            <button class="info-sacrifice-btn shrine-demo" onclick="triggerSacrificeFromInfo()">${tower.isDemolishing ? '철거중' : '철거'}</button></div>
            <div class="unit-info-stats" style="margin:2px 0; border-color:#00e5ff;"><span style="color:#00e5ff;font-size:9px;">공격력 +20% 시너지</span></div>
            <div class="unit-info-desc">${tower.isDemolishing ? data.demoDesc : data.desc}</div>
        `;
    } else {
        const dmg = Math.round(data.damage * (window.damageMultiplier || 1) * (1 + (tower.damageBonus || 0)));
        const as = ((1000 / data.cooldown) * (1 + (tower.speedBonus || 0))).toFixed(1);
        
        d.innerHTML = `
            <div class="info-row"><div class="unit-info-title">${data.name}</div>
            <button class="info-sacrifice-btn" onclick="triggerSacrificeFromInfo()">타락</button></div>
            <div class="info-row" style="gap:2px;">
                <div class="unit-info-stats"><span>⚔️</span><span>${dmg}${formatB(dmg-data.damage)}</span></div>
                <div class="unit-info-stats"><span>🎯</span><span>${data.range + (tower.rangeBonus||0)}</span></div>
                <div class="unit-info-stats"><span>⚡</span><span>${as}</span></div>
            </div>
            ${data.type === 'apprentice' ? `
                <div class="master-btn-container" style="margin-top:2px;">
                    <div class="info-col"><button class="info-promo-btn" onclick="performJobChange('knight', true)">⚔️</button></div>
                    <div class="info-col"><button class="info-promo-btn" onclick="performJobChange('chainer', true)">🪄</button></div>
                    <div class="info-col"><button class="info-promo-btn" onclick="performJobChange('alchemist', true)">💠</button></div>
                </div>
            ` : data.tier === 2 ? `
                <div class="master-btn-container">
                    <button class="info-promo-btn" style="width:40px;" onclick="performMasterJobChange(window.lastInspectedTower, '${unitTypes.find(u=>u.upgrades?.includes(u.type))?.type}', true)">전직</button>
                </div>
            ` : `<div class="unit-info-desc" style="-webkit-line-clamp:2;">${data.desc}</div>`}
        `;
        // Quick Fix for Tier 2 upgrades
        if (data.tier === 2) {
            const paths = [{f:'knight',t:['paladin','crusader']},{f:'fire',t:['hellfire','phoenix']},{f:'archer',t:['voidsniper','thousandhand']},{f:'chainer',t:['executor','binder']},{f:'ice',t:['absolutezero','permafrost']},{f:'tracker',t:['seer','commander']},{f:'talisman',t:['grandsealer','flamemaster']},{f:'monk',t:['vajra','saint']},{f:'necromancer',t:['wraithlord','cursedshaman']},{f:'guardian',t:['rampart','judgment']},{f:'alchemist',t:['midas','philosopher']},{f:'mirror',t:['illusion','reflection']}];
            const p = paths.find(x => x.f === data.type);
            if (p) {
                const u1 = unitTypes.find(u => u.type === p.t[0]);
                const u2 = unitTypes.find(u => u.type === p.t[1]);
                d.querySelector('.master-btn-container').innerHTML = `
                    <div class="info-col"><button class="info-promo-btn" onclick="performMasterJobChange(window.lastInspectedTower, '${u1.type}', true)">${u1.icon}</button></div>
                    <div class="info-col"><button class="info-promo-btn" onclick="performMasterJobChange(window.lastInspectedTower, '${u2.type}', true)">${u2.icon}</button></div>
                `;
            }
        }
    }
    startInfoResetTimer();
}

function showEnemyInfo(enemy) {
    window.infoPanelLockedUntil = Date.now() + 5000;
    const d = document.getElementById('unit-info');
    if (!d) return;
    const hpR = (enemy.hp / enemy.maxHp) * 100;
    d.innerHTML = `
        <div class="unit-info-title" style="color:#ff4500;">${enemy.data?.name || enemy.type}</div>
        <div style="width:100%; height:4px; background:#222; margin:3px 0; border-radius:2px; overflow:hidden;">
            <div style="width:${hpR}%; height:100%; background:#ff1744;"></div>
        </div>
        <div style="font-size:9px; color:#fff; margin-bottom:2px;">HP: ${Math.floor(enemy.hp)} / DEF: ${enemy.defense || 0}</div>
        <div class="unit-info-desc" style="-webkit-line-clamp:2;">${enemy.desc || "심연의 존재입니다."}</div>
    `;
    startInfoResetTimer();
}

function startInfoResetTimer() {
    if (infoResetTimer) clearTimeout(infoResetTimer);
    infoResetTimer = setTimeout(() => {
        if (Date.now() > infoPanelLockedUntil) {
            const d = document.getElementById('unit-info');
            if (d) d.innerHTML = `<div class="info-default-text">Gate of Hell<br>Sacred Tablet</div>`;
        }
    }, 10000);
}

function updateSummonButtonState() {
    const tc = document.getElementById('tower-card'), sw = document.getElementById('summon-warning'), scd = document.getElementById('summon-cost-display');
    const shc = document.getElementById('shrine-card'), shw = document.getElementById('shrine-warning'), shcd = document.getElementById('shrine-cost-display');
    const pc = document.getElementById('purge-card'), pw = document.getElementById('purge-warning');
    if (!tc) return;
    const cost = Math.max(5, Math.floor(window.towerCost - (typeof getRelicBonus === 'function' ? getRelicBonus('summon_cost_reduction') : 0)));
    if (scd) scd.innerText = `${cost} SE`;
    const isMax = towers.filter(t => !t.isShrine).length >= maxTowers, isBroke = money < cost;
    if (sw) { sw.innerText = isMax ? '인원초과' : 'SE부족'; sw.style.display = (isMax || isBroke) ? 'block' : 'none'; }
    tc.classList.toggle('disabled', isMax || isBroke);
    if (shc) { if (shcd) shcd.innerText = `${window.shrineCost} SE`; const sBroke = money < window.shrineCost; if (shw) shw.style.display = sBroke ? 'block' : 'none'; shc.classList.toggle('disabled', sBroke); }
    if (pc && pw) { const pBroke = money < 800; pc.classList.toggle('disabled', pBroke); pw.style.display = pBroke ? 'block' : 'none'; }
}

function flashResourceError(type) {
    const card = type === 'se' ? document.getElementById('tower-card') : null;
    if (card) { card.classList.add('error-shake'); setTimeout(() => card.classList.remove('error-shake'), 500); }
}

window.initAllies = initAllies;
window.updateSummonButtonState = updateSummonButtonState;
window.showUnitInfo = showUnitInfo;
window.showEnemyInfo = showEnemyInfo;
window.flashResourceError = flashResourceError;
window.startInfoResetTimer = startInfoResetTimer;
window.triggerSacrificeFromInfo = () => { if (window.lastInspectedTower) window.confirmSacrifice(window.lastInspectedTower); };
