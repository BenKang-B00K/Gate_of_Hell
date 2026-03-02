/* allies_data.js - Global State and Shared Functions */

// Config variables (now populated by data_loader.js)
// window.towerCost, window.shrineCost, window.shrineCostIncrement, window.maxTowers

const jobChangeCost = 200; 

let stage = 1;
let isTimeFrozen = false;
let timeFreezeEndTime = 0;

let enemies = [];
let towers = [];
let money = 150; // SE
let maxMoney = 1000; // [User Request] Max SE
let portalEnergy = 0;
let maxPortalEnergy = 1500;
let isBossStage = false;
let bossSpawned = false;
let bossInstance = null;
let currentStageSpawned = 0;
let totalStageEnemies = 15;
let isStageStarting = false;
let lastSpawnTime = 0;
let damageMultiplier = 1.0;
let critChance = 0.05;
let critMultiplier = 2.0;
let treasureChance = 0.01;
let friendlySkeletons = [];
let friendlyGhosts = [];
let groundEffects = [];
let gameContainer, road;
let slots = [];
let globalAnimTimer = 0;
let lavaPhase = 0;

// [User Request] Logical Slots for Canvas (3x7 grid each side)
const logicalSlots = [];
function initLogicalSlots() {
    logicalSlots.length = 0;
    const roadX = 123;
    const roadWidth = 114;
    const slotW = 38;
    const slotH = 50;
    const startY = 45;
    const spacingY = 58; // Expanded for 448 height.

    // Left Side (3 columns)
    for(let r=0; r<7; r++) {
        for(let c=0; c<3; c++) {
            logicalSlots.push({
                area: 'left-slots',
                index: r * 3 + c,
                lx: 10 + c * slotW + (slotW/2),
                ly: startY + r * spacingY + (slotH/2),
                type: (c === 0) ? 'shrine' : 'unit'
            });
        }
    }
    // Right Side (3 columns)
    for(let r=0; r<7; r++) {
        for(let c=0; c<3; c++) {
            logicalSlots.push({
                area: 'right-slots',
                index: r * 3 + c,
                lx: roadX + roadWidth + 5 + c * slotW + (slotW/2),
                ly: startY + r * spacingY + (slotH/2),
                type: (c === 2) ? 'shrine' : 'unit'
            });
        }
    }
}
window.logicalSlots = logicalSlots;
window.initLogicalSlots = initLogicalSlots;

let lastMoney = 150;
let lastPortalEnergy = 0;

/**
 * Updates Soul Energy and Portal Energy Displays
 */
function updateGauges() {
    const moneyDisplay = document.getElementById('se-display-text');
    const peDisplay = document.getElementById('portal-energy-label');
    const peFill = document.getElementById('portal-gauge-fill');
    const seFill = document.getElementById('se-gauge-fill');

    // Calculate Deltas for Floating VFX
    const currentMoney = Math.floor(money);
    const moneyDelta = currentMoney - lastMoney;
    if (moneyDelta !== 0) {
        spawnGaugePop('se-label', moneyDelta);
        lastMoney = currentMoney;
    }

    const currentPE = Math.floor(portalEnergy);
    const peDelta = currentPE - lastPortalEnergy;
    if (peDelta !== 0) {
        // [User Request] Remove background color, apply color to text: up (purple), down (cyan)
        const peColor = peDelta > 0 ? "#9400d3" : "#00e5ff";
        spawnGaugePop('pe-label', peDelta, peColor);
        lastPortalEnergy = currentPE;
    }

    if (moneyDisplay) moneyDisplay.innerText = `${currentMoney} / ${maxMoney}`;
    if (peDisplay) peDisplay.innerText = `${currentPE} / ${maxPortalEnergy}`;

    if (peFill) peFill.style.width = `${Math.min((portalEnergy / maxPortalEnergy) * 100, 100)}%`;
    if (seFill) seFill.style.width = `${Math.min((money / maxMoney) * 100, 100)}%`;
    // [User Request] Portal Energy Cursed Effect
    const peStatus = document.getElementById('cursed-status');
    const peRatio = portalEnergy / maxPortalEnergy;
    if (peStatus) {
        if (peRatio >= 0.75) {
            peStatus.innerText = "저주: 지옥의 숨결 (공격 속도 -20%)";
            peStatus.style.color = "#ff0000";
        } else if (peRatio >= 0.5) {
            peStatus.innerText = "저주: 심연의 그림자 (공격 속도 -10%)";
            peStatus.style.color = "#ff4500";
        } else if (peRatio >= 0.3) {
            peStatus.innerText = "저주: 흐릿한 공포 (공격 속도 -5%)";
            peStatus.style.color = "#ffa500";
        } else {
            peStatus.innerText = "저주: 없음";
            peStatus.style.color = "#ff00ff";
        }
    }

    // PE Label Hover: Show info in Sacred Tablet
    const peLabel = document.getElementById('pe-label');
    if (peLabel) {
        peLabel.onmouseenter = () => {
            const d = document.getElementById('unit-info');
            if (d) {
                d.innerHTML = `
                    <div style="color:#ff00ff; font-weight:bold; font-size:36px; margin-bottom:6px;">👿 포탈 오염도 (PE)</div>
                    <div style="display:inline-block; background:#2e003e; color:#fff; padding:3px 12px; border-radius:9px; font-size:22px; font-weight:bold; margin-bottom:10px;">지옥 악한 기운</div>
                    <div style="font-size:24px; color:#bbb; line-height:1.2;">악령들이 포탈을 통과할 때마다 성스러운 결계가 오염됩니다.</div>
                    <div style="width:100%; height:1px; background:linear-gradient(90deg, transparent, #ff00ff44, transparent); margin:15px 0;"></div>
                    <div style="color:#ff4500; font-size:20px;">[오염 단계별 저주]</div>
                    <div style="font-size:18px; color:#aaa; margin-top:5px;">
                        • 30% 이상: 흐릿한 공포 (공격 속도 -5%)<br>
                        • 50% 이상: 심연의 그림자 (공격 속도 -10%)<br>
                        • 75% 이상: 지옥의 숨결 (공격 속도 -20%)<br>
                        • 100% 도달: 성스러운 결계 붕괴 (Game Over)
                    </div>
                `;
                if (typeof startInfoResetTimer === 'function') startInfoResetTimer();
            }
        };
    }
}

function spawnGaugePop(containerId, amount, customColor = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const div = document.createElement('div');
    const isGain = amount > 0;
    div.className = `gauge-floating-num ${isGain ? 'gain' : 'loss'}`;
    div.innerText = (isGain ? '+' : '') + amount;
    if (customColor) div.style.color = customColor;

    // Append to the gauge-bar inside the wrapper
    const bar = container.querySelector('.gauge-bar');
    if (bar) {
        bar.appendChild(div);
        setTimeout(() => div.remove(), 800);
    }
}
let lastEnemiesLeft = 0;

/**
 * Updates Stage Info and Enemies Left Display
 */
function updateStageInfo() {
    const stageDisplay = document.getElementById('stage-display');
    if (stageDisplay) stageDisplay.innerText = stage;

    const enemiesLeftLabel = document.getElementById('enemies-left');
    const rsFill = document.getElementById('rs-gauge-fill');

    if (enemiesLeftLabel) {
        // [Logic Check] Remaining = (Total to spawn - Already spawned) + (Currently on field)
        const remaining = Math.max(0, (totalStageEnemies - currentStageSpawned) + enemies.length);
        const total = Math.max(1, totalStageEnemies);

        // Calculate Delta for RS VFX
        const rsDelta = remaining - lastEnemiesLeft;
        if (rsDelta !== 0 && lastEnemiesLeft !== 0) {
            spawnGaugePop('rs-label', rsDelta);
        }
        lastEnemiesLeft = remaining;

        // Display as "Current / Total" for consistency with other gauges
        enemiesLeftLabel.innerText = `${remaining} / ${total}`;
        
        // Progress: Remaining / Total (Starts full, drains as stage is cleared)
        const progress = Math.min(100, (remaining / total) * 100);
        if (rsFill) rsFill.style.width = `${progress}%`;
    }
}
