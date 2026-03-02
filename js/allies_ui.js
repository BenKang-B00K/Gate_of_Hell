/* allies_ui.js - Unified UI System (Info Panel & HUD) */

let infoResetTimer = null;
let infoPanelLockedUntil = 0;

/**
 * Initializes UI listeners. Logical slots are handled by graphics_env.js and input_handler.js
 */
function initAllies() {
    attachGlobalListeners();
}

let listenersAttached = false;
function attachGlobalListeners() {
    if (listenersAttached) return;

    // 1. Summon Button
    const summonBtn = document.getElementById('tower-card');
    if (summonBtn) {
        summonBtn.addEventListener('click', () => {
            if (typeof summonUnit === 'function') summonUnit();
        });
        summonBtn.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d) {
                const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
                const finalTowerCost = Math.max(5, Math.floor(window.towerCost - reduction));
                d.innerHTML = `
                    <div class="unit-info-title">🧙 견습 퇴마사 소환</div>
                    <div style="display:inline-block; background:#2a2010; color:#fff; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:bold; margin-bottom:4px;">비용: ${finalTowerCost} SE</div>
                    <div class="unit-info-desc">성스러운 기운을 모아 새로운 견습 퇴마사를 부릅니다.</div>
                    <div style="width:100%; height:1px; background:linear-gradient(90deg, transparent, #ffd70044, transparent); margin:4px 0;"></div>
                    <div style="color:#00ff00; font-size:9px; font-weight:bold;">[소환 규칙]</div>
                    <div style="font-size:8px; color:#aaa; margin-top:2px;">
                        • 중앙 빈 슬롯에 무작위 소환<br>
                        • 소환마다 비용 5 SE 증가 (최대 16명)
                    </div>
                `;
                if (typeof startInfoResetTimer === 'function') startInfoResetTimer();
            }
        });
    }

    // 2. Shrine Card
    const shrineBtn = document.getElementById('shrine-card');
    if (shrineBtn) {
        shrineBtn.addEventListener('click', () => {
            if (typeof summonShrine === 'function') summonShrine();
        });
        shrineBtn.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d) {
                const cost = window.shrineCost || 100;
                d.innerHTML = `
                    <div class="unit-info-title">🕍 성소 건립 (Shrine)</div>
                    <div style="display:inline-block; background:#002a32; color:#fff; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:bold; margin-bottom:4px;">비용: ${cost} SE</div>
                    <div class="unit-info-desc">퇴마사를 보조하는 성스러운 건축물을 세웁니다.</div>
                    <div style="width:100%; height:1px; background:linear-gradient(90deg, transparent, #00e5ff44, transparent); margin:4px 0;"></div>
                    <div style="color:#ffd700; font-size:9px; font-weight:bold;">[건립 규칙]</div>
                    <div style="font-size:8px; color:#aaa; margin-top:2px;">
                        • 전용 슬롯에만 건립 가능<br>
                        • 철거 시 1 스테이지 동안 디버프 발생
                    </div>
                `;
                if (typeof startInfoResetTimer === 'function') startInfoResetTimer();
            }
        });
    }

    // 3. Purge Button
    const purgeBtn = document.getElementById('purge-card');
    if (purgeBtn) {
        purgeBtn.addEventListener('click', () => {
            if (typeof window.purgePortal === 'function') window.purgePortal();
        });
        purgeBtn.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d) {
                d.innerHTML = `
                    <div class="unit-info-title" style="color:#9400d3;">🔥 공간 정화 (Purge)</div>
                    <div style="display:inline-block; background:#1a002a; color:#fff; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:bold; margin-bottom:4px;">비용: 800 SE</div>
                    <div class="unit-info-desc">에너지를 폭발시켜 포탈 오염도를 50% 제거합니다.</div>
                    <div style="width:100%; height:1px; background:linear-gradient(90deg, transparent, #9400d344, transparent); margin:8px 0;"></div>
                    <div style="color:#ff1744; font-size:9px; font-style:italic;">"부정한 기운은 남지 않을 것입니다."</div>
                `;
                if (typeof startInfoResetTimer === 'function') startInfoResetTimer();
            }
        });
    }

    // 4. Relics Button
    const relicsBtn = document.getElementById('relics-btn');
    if (relicsBtn) {
        relicsBtn.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d) {
                d.innerHTML = `
                    <div class="unit-info-title" style="color:#ff4500;">🏺 심연의 유물 (Relics)</div>
                    <div style="font-size:10px; color:#bbb; line-height:1.2;">악의 존재를 정화하며 얻은 보물들입니다.</div>
                    <div style="width:100%; height:1px; background:linear-gradient(90deg, transparent, #ff450044, transparent); margin:8px 0;"></div>
                    <div style="color:#ff8a80; font-size:9px; font-style:italic;">과거의 승리자들이 남긴 유산입니다.</div>
                `;
                if (typeof startInfoResetTimer === 'function') startInfoResetTimer();
            }
        });
    }

    // 5. Equipment Button
    const equipBtn = document.getElementById('equip-btn');
    if (equipBtn) {
        equipBtn.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d) {
                d.innerHTML = `
                    <div class="unit-info-title" style="color:#00e5ff;">⚔️ 신성한 장비 (Equipment)</div>
                    <div style="font-size:10px; color:#bbb; line-height:1.2;">퇴마사들의 능력을 극대화하는 무구들입니다.</div>
                    <div style="width:100%; height:1px; background:linear-gradient(90deg, transparent, #00e5ff44, transparent); margin:8px 0;"></div>
                    <div style="color:#80d8ff; font-size:9px; font-style:italic;">날카로운 칼날과 정화된 의지.</div>
                `;
                if (typeof startInfoResetTimer === 'function') startInfoResetTimer();
            }
        });
    }

    // 6. Collections Button
    const collsBtn = document.getElementById('collections-btn');
    if (collsBtn) {
        collsBtn.addEventListener('mouseenter', () => {
            const d = document.getElementById('unit-info');
            if (d) {
                d.innerHTML = `
                    <div class="unit-info-title" style="color:#ffd700;">📖 성스러운 기록 (Records)</div>
                    <div style="font-size:10px; color:#bbb; line-height:1.2;">조우한 악의 존재들과 수호자들의 기록입니다.</div>
                    <div style="width:100%; height:1px; background:linear-gradient(90deg, transparent, #ffd70044, transparent); margin:8px 0;"></div>
                    <div style="color:#ffecb3; font-size:9px; font-style:italic;">지식은 심연을 닫는 열쇠입니다.</div>
                `;
                if (typeof startInfoResetTimer === 'function') startInfoResetTimer();
            }
        });
    }

    listenersAttached = true;
}

function updateSummonButtonState() {
    const tc = document.getElementById('tower-card');
    const sw = document.getElementById('summon-warning');
    const scd = document.getElementById('summon-cost-display');
    const shc = document.getElementById('shrine-card');
    const shw = document.getElementById('shrine-warning');
    const shcd = document.getElementById('shrine-cost-display');

    if (!tc) return;

    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, Math.floor(window.towerCost - reduction));
    if (scd) scd.innerText = `${finalTowerCost} SE`;

    const isMax = towers.filter(t => !t.isShrine).length >= maxTowers;
    const isBroke = money < finalTowerCost;

    if (sw) {
        if (isMax) { sw.innerText = '인원 초과'; sw.style.display = 'block'; }
        else if (isBroke) { sw.innerText = 'SE 부족'; sw.style.display = 'block'; }
        else { sw.style.display = 'none'; }
    }
    if (isMax || isBroke) tc.classList.add('disabled');
    else tc.classList.remove('disabled');

    // Shrine State
    if (shc) {
        if (shcd) shcd.innerText = `${window.shrineCost} SE`;
        const isShrineBroke = money < window.shrineCost;
        if (shw) {
            if (isShrineBroke) { shw.innerText = 'SE 부족'; shw.style.display = 'block'; }
            else { shw.style.display = 'none'; }
        }
        if (isShrineBroke) shc.classList.add('disabled');
        else shc.classList.remove('disabled');
    }

    const pc = document.getElementById('purge-card');
    const pw = document.getElementById('purge-warning');
    if (pc && pw) {
        if (money < 800) { pc.classList.add('disabled'); pw.style.display = 'block'; }
        else { pc.classList.remove('disabled'); pw.style.display = 'none'; }
    }
}

function showUnitInfo(tower) {
    if (typeof GameLogger !== 'undefined') GameLogger.debug(`🔍 Inspecting: ${tower.data.name}`);
    window.infoPanelLockedUntil = Date.now() + 5000;
    
    const d = document.getElementById('unit-info');
    if (!d) return;

    const data = tower.data;
    const isShrine = tower.isShrine;
    const isDemolishing = tower.isDemolishing;

    const formatBonus = (val) => {
        if (val > 0) return `<span style="color:#00ff00; font-size:7px;">(+${val})</span>`;
        if (val < 0) return `<span style="color:#ff1744; font-size:7px;">(${val})</span>`;
        return "";
    };

    let th = `
        <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:2px;">
            <div class="unit-info-title">${data.name}</div>
            <button class="info-sacrifice-btn ${isShrine ? 'shrine-demo' : ''}" 
                    onclick="triggerSacrificeFromInfo()" 
                    ${isDemolishing ? 'disabled' : ''}>
                ${isShrine ? (isDemolishing ? '철거 중' : '철거') : '타락'}
            </button>
        </div>
    `;

    window.lastInspectedTower = tower;

    let ih = '';
    if (isShrine) {
        ih = `
            <div style="display:flex; justify-content:center; gap:4px; width:100%;">
                <div class="unit-info-stats" style="flex:1; border-color:#00e5ff;">
                    <span style="color:#00e5ff; font-weight:bold;">EFFECT</span>
                    <span style="font-weight:900; color:${isDemolishing ? '#ff1744' : '#00ff00'}">
                        공격력 ${isDemolishing ? '-20%' : '+20%'}
                    </span>
                </div>
            </div>
        `;
    } else {
        const baseDmg = data.damage;
        const finalDmg = Math.round(baseDmg * (window.damageMultiplier || 1.0) * (1.0 + (tower.damageBonus || 0)));
        const bonusDmg = finalDmg - baseDmg;
        const baseRange = data.range;
        const bonusRange = tower.rangeBonus || 0;
        const finalRange = baseRange + bonusRange;
        const sm = 1.0 + (tower.speedBonus || 0);
        const baseAS = (1000 / data.cooldown).toFixed(1);
        const finalAS = (baseAS * sm).toFixed(1);
        const bonusAS = (finalAS - baseAS).toFixed(1);

        ih = `
            <div style="display:flex; justify-content:center; gap:4px; width:100%;">
                <div class="unit-info-stats" style="flex:1; border-color:#ff4500;">
                    <span style="color:#ff4500; font-weight:bold;">ATK</span>
                    <span style="font-weight:900;">${baseDmg}${formatBonus(bonusDmg)}</span>
                </div>
                <div class="unit-info-stats" style="flex:1; border-color:#00e5ff;">
                    <span style="color:#00e5ff; font-weight:bold;">RNG</span>
                    <span style="font-weight:900;">${baseRange}${formatBonus(bonusRange)}</span>
                </div>
                <div class="unit-info-stats" style="flex:1; border-color:#ffd700;">
                    <span style="color:#ffd700; font-weight:bold;">SPD</span>
                    <span style="font-weight:900;">${baseAS}${formatBonus(bonusAS)}</span>
                </div>
            </div>
        `;
    }

    let divider = `<div style="width:90%; height:1px; background:linear-gradient(90deg, transparent, #ffd70044, transparent); margin:2px 0;"></div>`;
    let desc = `<div class="unit-info-desc">${isDemolishing ? data.demoDesc : data.desc}</div>`;
    
    let ch = ''; 
    if(!isShrine && data.type === 'apprentice') {
        ch = `
            <div style="color:#888; font-size:8px; margin-bottom:2px; font-weight:bold;">전직 경로</div>
            <div class="master-btn-container" style="margin-top:0;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange('knight', true)">⚔️</button>
                    <span style="color:#ff4500; font-weight:bold;">ATTACK</span>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange('chainer', true)">🪄</button>
                    <span style="color:#00e5ff; font-weight:bold;">SUPPORT</span>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange('alchemist', true)">💠</button>
                    <span style="color:#ffd700; font-weight:bold;">SPECIAL</span>
                </div>
            </div>
        `;
    } else if(!isShrine && data.tier === 2) {
        const paths = [
            { from: 'knight', to: ['paladin', 'crusader'] },
            { from: 'fire', to: ['hellfire', 'phoenix'] },
            { from: 'archer', to: ['voidsniper', 'thousandhand'] },
            { from: 'chainer', to: ['executor', 'binder'] },
            { from: 'ice', to: ['absolutezero', 'permafrost'] },
            { from: 'tracker', to: ['seer', 'commander'] },
            { from: 'talisman', to: ['grandsealer', 'flamemaster'] },
            { from: 'monk', to: ['vajra', 'saint'] },
            { from: 'necromancer', to: ['wraithlord', 'cursedshaman'] },
            { from: 'guardian', to: ['rampart', 'judgment'] },
            { from: 'alchemist', to: ['midas', 'philosopher'] },
            { from: 'mirror', to: ['illusion', 'reflection'] }
        ];
        const p = paths.find(x => x.from === data.type);
        if(p) {
            const u1 = unitTypes.find(u => u.type === p.to[0]);
            const u2 = unitTypes.find(u => u.type === p.to[1]);
            ch = `
                <div style="color:#888; font-size:8px; margin-bottom:2px; font-weight:bold;">마스터 전직</div>
                <div class="master-btn-container" style="margin-top:0;">
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <button class="info-promo-btn" onclick="performMasterJobChange(window.lastInspectedTower, '${u1.type}', true)">${u1.icon}</button>
                        <span style="color:#fff;">${u1.name}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <button class="info-promo-btn" onclick="performMasterJobChange(window.lastInspectedTower, '${u2.type}', true)">${u2.icon}</button>
                        <span style="color:#fff;">${u2.name}</span>
                    </div>
                </div>
            `;
        }
    }

    d.innerHTML = `${th}${ih}${divider}${ch}${desc}`;
    startInfoResetTimer();
}

function triggerSacrificeFromInfo() {
    if (window.lastInspectedTower) {
        if (typeof window.confirmSacrifice === 'function') {
            window.confirmSacrifice(window.lastInspectedTower);
        }
    }
}

function showEnemyInfo(enemy) {
    if (!enemy) return;
    if (typeof GameLogger !== 'undefined') GameLogger.debug(`🔍 Inspecting Enemy: ${enemy.data?.name || enemy.type}`);
    window.infoPanelLockedUntil = Date.now() + 5000;
    const d = document.getElementById('unit-info');
    if (!d) return;

    const hp = Math.floor(enemy.hp);
    const maxHp = Math.floor(enemy.maxHp || hp);
    const def = enemy.defense || 0;

    let divider = `<div style="width:80%; height:1px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin:4px 0;"></div>`;
    const dispName = enemy.data?.name || enemy.type;
    const dispLore = enemy.data?.lore || "이 영혼에 대한 기록이 없습니다.";
    const dispDesc = enemy.desc || "심연에서 솟아난 부정한 존재입니다.";

    let th = `<div style="color:#ff4500; font-weight:bold; font-size:14px; margin-bottom:2px; text-shadow:0 0 5px #ff4500;">${dispName}</div>`;
    let ih = `
        <div style="display:flex; justify-content:center; gap:4px; width:100%; padding: 0 5px;">
            <div class="unit-info-stats" style="flex:2; border-color:#ff1744; background:rgba(183,28,28,0.1);">
                <span style="color:#ff1744; font-weight:bold;">HEALTH</span>
                <span style="font-weight:bold;">${hp} / ${maxHp}</span>
            </div>
            <div class="unit-info-stats" style="flex:1; border-color:#888; background:rgba(255,255,255,0.05);">
                <span style="color:#aaa; font-weight:bold;">DEF</span>
                <span style="font-weight:bold;">${def}</span>
            </div>
        </div>
    `;
    let eh = `<div style="color:#ff8a80; font-size:9px; margin-bottom:2px; padding: 0 5px;">${dispDesc}</div>`;
    let lh = `<div style="color:#666; font-size:8px; font-style:italic; line-height:1.1; padding: 0 10px;">"${dispLore}"</div>`;

    d.innerHTML = `${th}${ih}${divider}${eh}${lh}` ;
    startInfoResetTimer();
}

function startInfoResetTimer() {
    if (infoResetTimer) clearTimeout(infoResetTimer);
    infoResetTimer = setTimeout(() => {
        if (Date.now() > infoPanelLockedUntil) {
            const d = document.getElementById('unit-info');
            if (d) {
                d.innerHTML = `
                    <div class="info-default-text">Gate of Hell<br><span style="font-size:10px; opacity:0.8;">Sacred Tablet</span></div>
                `;
            }
        }
    }, 10000);
}

function flashResourceError(type) {
    const card = type === 'se' ? document.getElementById('tower-card') : null;
    if (card) {
        card.classList.add('error-shake');
        setTimeout(() => card.classList.remove('error-shake'), 500);
    }
}

window.initAllies = initAllies;
window.updateSummonButtonState = updateSummonButtonState;
window.showUnitInfo = showUnitInfo;
window.showEnemyInfo = showEnemyInfo;
window.flashResourceError = flashResourceError;
window.startInfoResetTimer = startInfoResetTimer;
