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
                    <div style="color:#ffd700; font-weight:bold; font-size:36px; margin-bottom:6px;">🧙 견습 퇴마사 소환</div>
                    <div style="display:inline-block; background:#2a2010; color:#fff; padding:3px 12px; border-radius:9px; font-size:22px; font-weight:bold; margin-bottom:10px;">소환 비용: ${finalTowerCost} SE</div>
                    <div style="font-size:24px; color:#bbb; line-height:1.2;">성스러운 기운을 모아 새로운 견습 퇴마사를 부릅니다.</div>
                    <div style="width:100%; height:1px; background:linear-gradient(90deg, transparent, #ffd70044, transparent); margin:15px 0;"></div>
                    <div style="color:#00ff00; font-size:20px;">[소환 규칙]</div>
                    <div style="font-size:18px; color:#aaa; margin-top:5px;">
                        • 중앙 2개 열의 빈 슬롯에 무작위로 소환됨<br>
                        • 소환할 때마다 비용이 5 SE씩 증가<br>
                        • 최대 16명까지 동시 유지 가능
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
                    <div style="color:#00e5ff; font-weight:bold; font-size:36px; margin-bottom:6px;">🕍 성소 건립 (Shrine)</div>
                    <div style="display:inline-block; background:#002a32; color:#fff; padding:3px 12px; border-radius:9px; font-size:22px; font-weight:bold; margin-bottom:10px;">건립 비용: ${cost} SE</div>
                    <div style="font-size:24px; color:#bbb; line-height:1.2;">퇴마사를 보조하는 성스러운 건축물을 세웁니다.</div>
                    <div style="width:100%; height:1px; background:linear-gradient(90deg, transparent, #00e5ff44, transparent); margin:15px 0;"></div>
                    <div style="color:#ffd700; font-size:20px;">[건립 규칙]</div>
                    <div style="font-size:18px; color:#aaa; margin-top:5px;">
                        • 좌측 1열 / 우측 3열 전용 슬롯에만 건립 가능<br>
                        • 건립 시마다 비용이 50 SE 증가<br>
                        • 철거 시 1 스테이지 동안 디버프가 발생함
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
                    <div style="color:#9400d3; font-weight:bold; font-size:36px; margin-bottom:6px;">🔥 공간 정화 (Purge)</div>
                    <div style="display:inline-block; background:#1a002a; color:#fff; padding:3px 12px; border-radius:9px; font-size:22px; font-weight:bold; margin-bottom:10px;">정화 비용: 800 SE</div>
                    <div style="font-size:24px; color:#bbb; line-height:1.2;">모아둔 에너지를 폭발시켜 포탈의 오염도를 50% 제거합니다.</div>
                    <div style="width:100%; height:1px; background:linear-gradient(90deg, transparent, #9400d344, transparent); margin:15px 0;"></div>
                    <div style="color:#ff1744; font-size:18px; font-style:italic;">"불길이 닿는 곳에 부정한 기운은 남지 않을 것입니다."</div>
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
                    <div style="color:#ff4500; font-weight:bold; font-size:36px; margin-bottom:6px;">🏺 심연의 유물 (Relics)</div>
                    <div style="display:inline-block; background:#2a1005; color:#fff; padding:3px 12px; border-radius:9px; font-size:22px; font-weight:bold; margin-bottom:10px;">영구적 강화</div>
                    <div style="font-size:24px; color:#bbb; line-height:1.2;">악의 존재들을 정화하며 얻은 신성한 보물들입니다.</div>
                    <div style="width:100%; height:1px; background:linear-gradient(90deg, transparent, #ff450044, transparent); margin:15px 0;"></div>
                    <div style="color:#ff8a80; font-size:18px; font-style:italic;">"과거의 승리자들이 남긴 유산이 당신의 길을 밝혀줄 것입니다."</div>
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
                    <div style="color:#00e5ff; font-weight:bold; font-size:36px; margin-bottom:6px;">⚔️ 신성한 장비 (Equipment)</div>
                    <div style="display:inline-block; background:#002a32; color:#fff; padding:3px 12px; border-radius:9px; font-size:22px; font-weight:bold; margin-bottom:10px;">전투 보조 기구</div>
                    <div style="font-size:24px; color:#bbb; line-height:1.2;">퇴마사들의 능력을 극대화하는 고대의 무구들을 관리합니다.</div>
                    <div style="width:100%; height:1px; background:linear-gradient(90deg, transparent, #00e5ff44, transparent); margin:15px 0;"></div>
                    <div style="color:#80d8ff; font-size:18px; font-style:italic;">"가장 날카로운 칼날조차 정화된 의지 없이는 녹슨 쇠붙이에 불과합니다."</div>
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
                    <div style="color:#ffd700; font-weight:bold; font-size:36px; margin-bottom:6px;">📖 성스러운 기록 (Records)</div>
                    <div style="display:inline-block; background:#2a2010; color:#fff; padding:3px 12px; border-radius:9px; font-size:22px; font-weight:bold; margin-bottom:10px;">지식의 보관소</div>
                    <div style="font-size:24px; color:#bbb; line-height:1.2;">지금까지 조우한 악의 존재들과 아군 수호자들의 기록을 확인합니다.</div>
                    <div style="width:100%; height:1px; background:linear-gradient(90deg, transparent, #ffd70044, transparent); margin:15px 0;"></div>
                    <div style="color:#ffecb3; font-size:18px; font-style:italic;">"적을 아는 것이야말로 심연을 닫는 첫 번째 열쇠입니다."</div>
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
        if (val > 0) return `<span style="color:#00ff00; font-size:14px;">(+${val})</span>`;
        if (val < 0) return `<span style="color:#ff1744; font-size:14px;">(${val})</span>`;
        return "";
    };

    let th = `
        <div style="display:flex; align-items:center; justify-content:center; gap:15px; margin-bottom:4px;">
            <div class="unit-info-title" style="font-size:32px;">${data.name}</div>
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
            <div style="display:flex; justify-content:center; gap:10px; margin-bottom:4px; width:100%;">
                <div class="unit-info-stats" style="flex:1; border-color:#00e5ff; padding:4px 12px;">
                    <span style="color:#00e5ff; font-size:14px; display:block; font-weight:bold;">EFFECT</span>
                    <span style="font-size:20px; font-weight:900; color:${isDemolishing ? '#ff1744' : '#00ff00'}">
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
            <div style="display:flex; justify-content:center; gap:10px; margin-bottom:4px; width:100%;">
                <div class="unit-info-stats" style="flex:1; border-color:#ff4500; padding:2px 6px; min-width:70px;">
                    <span style="color:#ff4500; font-size:14px; display:block; font-weight:bold;">ATTACK</span>
                    <span style="font-size:20px; font-weight:900;">${baseDmg} ${formatBonus(bonusDmg)}</span>
                </div>
                <div class="unit-info-stats" style="flex:1; border-color:#00e5ff; padding:2px 6px; min-width:70px;">
                    <span style="color:#00e5ff; font-size:14px; display:block; font-weight:bold;">RANGE</span>
                    <span style="font-size:20px; font-weight:900;">${baseRange} ${formatBonus(bonusRange)}</span>
                </div>
                <div class="unit-info-stats" style="flex:1; border-color:#ffd700; padding:2px 6px; min-width:70px;">
                    <span style="color:#ffd700; font-size:14px; display:block; font-weight:bold;">ATTACK SPEED</span>
                    <span style="font-size:20px; font-weight:900;">${baseAS} ${formatBonus(bonusAS)}</span>
                </div>
            </div>
        `;
    }

    let divider = `<div style="width:90%; height:1px; background:linear-gradient(90deg, transparent, #ffd70044, transparent); margin:4px 0;"></div>`;
    let desc = `<div class="unit-info-desc" style="font-size:18px; line-height:1.2; color:#aaa; padding:0 10px;">${isDemolishing ? data.demoDesc : data.desc}</div>`;
    
    let ch = ''; 
    if(!isShrine && data.type === 'apprentice') {
        ch = `
            <div style="color:#888; font-size:14px; margin-bottom:2px; text-transform:uppercase; letter-spacing:2px; font-weight:bold;">전직 경로 선택</div>
            <div class="master-btn-container" style="margin-top:0; gap:12px;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange('knight', true)">⚔️</button>
                    <span style="color:#ff4500; font-size:12px; font-weight:bold;">ATTACK</span>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange('chainer', true)">🪄</button>
                    <span style="color:#00e5ff; font-size:12px; font-weight:bold;">SUPPORT</span>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <button class="info-promo-btn" onclick="performJobChange('alchemist', true)">💠</button>
                    <span style="color:#ffd700; font-size:12px; font-weight:bold;">SPECIAL</span>
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
                <div style="color:#888; font-size:14px; margin-bottom:2px; text-transform:uppercase; letter-spacing:2px; font-weight:bold;">마스터 전직</div>
                <div class="master-btn-container" style="margin-top:0; gap:20px;">
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <button class="info-promo-btn" onclick="performMasterJobChange(window.lastInspectedTower, '${u1.type}', true)">${u1.icon}</button>
                        <span style="color:#fff; font-size:12px;">${u1.name}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <button class="info-promo-btn" onclick="performMasterJobChange(window.lastInspectedTower, '${u2.type}', true)">${u2.icon}</button>
                        <span style="color:#fff; font-size:12px;">${u2.name}</span>
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

    let divider = `<div style="width:80%; height:1px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin:8px 0;"></div>`;
    const dispName = enemy.data?.name || enemy.type;
    const dispLore = enemy.data?.lore || "이 영혼에 대한 기록이 없습니다.";
    const dispDesc = enemy.desc || "심연에서 솟아난 부정한 존재입니다.";

    let th = `<div style="color:#ff4500; font-weight:bold; font-size:32px; margin-bottom:4px; text-shadow:0 0 15px #ff4500;">${dispName}</div>`;
    let ih = `
        <div style="display:flex; justify-content:center; gap:10px; margin-bottom:8px; width:100%; padding: 0 15px;">
            <div class="unit-info-stats" style="flex:2; border-color:#ff1744; background:rgba(183,28,28,0.1); padding: 4px 8px;">
                <span style="color:#ff1744; font-size:14px; display:block; font-weight:bold;">HEALTH</span>
                <span style="font-size:22px; font-weight:bold;">${hp} / ${maxHp}</span>
            </div>
            <div class="unit-info-stats" style="flex:1; border-color:#888; background:rgba(255,255,255,0.05); padding: 4px 8px;">
                <span style="color:#aaa; font-size:14px; display:block; font-weight:bold;">DEFENSE</span>
                <span style="font-size:22px; font-weight:bold;">${def}</span>
            </div>
        </div>
    `;
    let eh = `<div style="color:#ff8a80; font-size:18px; margin-bottom:4px; padding: 0 20px;"><strong>특성:</strong> ${dispDesc}</div>`;
    let lh = `<div style="color:#666; font-size:16px; font-style:italic; line-height:1.2; padding: 0 30px;">"${dispLore}"</div>`;

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
                    <div class="info-default-text">Gate of Hell<br><span style="font-size:30px; opacity:0.8;">악령들의 귀환</span></div>
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
