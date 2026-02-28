/* enemies.js */
let gameContainer;
let road;

// Global state and variables
const enemies = []; // Enemy list
const towers = []; // Tower list
const slots = []; // Slot elements storage
const walls = []; // Necromancer wall list
const groundEffects = []; // Ground effect list (AOE)
const friendlySkeletons = []; // Ally skeleton soldier list
const friendlyGhosts = []; // Forsaken King ally ghosts

let stage = 1;
let money = 150;
let damageMultiplier = 1.0;
let critChance = 0;
let critMultiplier = 1.5;
let totalStageEnemies = 0;
let currentStageSpawned = 0;
let lastSpawnTime = 0;
let isStageStarting = false;
let isBossStage = false;
let bossSpawned = false;
let bossInstance = null;
let globalSpeedFactor = 1.0;
let treasureChance = 0.0033;

let isTimeFrozen = false;
let timeFreezeEndTime = 0;
let sealedGhostCount = 0;
let portalEnergy = 0;
const maxPortalEnergy = 1500;
let draggedUnit = null; // Currently dragged unit

// Calculate gradual stage-based multipliers
function getStageMultipliers(isBoss = false) {
    if (isBoss) return { hpStageMult: 1.0, speedStageMult: 1.0 };
    
    let hpRate = 1.05;
    let speedRate = 0.003;

    // Difficulty scaling
    if (stage >= 15) {
        hpRate = 1.08; // Increased from 1.06 for late game challenge
        speedRate = 0.008; // Faster specters in late game
    } else if (stage >= 5) {
        hpRate = 1.07; // Increased from 1.06
        speedRate = 0.006; // Increased from 0.005
    }

    // Apply Relic Enemy HP reduction
    let hpStageMult = Math.pow(hpRate, stage - 1);
    const relicHPReduction = (typeof getRelicBonus === 'function') ? getRelicBonus('enemy_hp') : 0;
    if (relicHPReduction < 0) {
        hpStageMult *= (1.0 + relicHPReduction);
    }

    // Apply Relic Enemy Speed reduction
    let speedStageMult = 1 + (stage - 1) * speedRate;
    const relicSpeedReduction = (typeof getRelicBonus === 'function') ? getRelicBonus('enemy_speed') : 0;
    if (relicSpeedReduction < 0) {
        speedStageMult *= (1.0 + relicSpeedReduction);
    }

    return { hpStageMult, speedStageMult };
}

// Enemy data (Categorized)
const enemyCategories = {
    basic: [
        { type: 'normal', icon: '👻', speed: 4.5, hp: 110, defense: 0, probability: 0.35, reward: 4, desc: "심연을 떠도는 평범한 영혼입니다. 특수한 능력은 없습니다.", effectiveness: "표준 퇴마 공격.", lore: "이승의 미련을 버리지 못한 채 어둠 속을 목적 없이 배회하는 영혼입니다." }, 
        { type: 'mist', icon: '🌫️', speed: 3.9, hp: 140, defense: 0, probability: 0.15, reward: 4, desc: "천천히 흘러가는 영적인 안개입니다. 특수한 능력은 없습니다.", effectiveness: "표준 퇴마 공격.", lore: "수천 명의 잊혀진 작은 슬픔들이 응축되어 형성되었습니다." },
        { type: 'memory', icon: '👣', speed: 5.1, hp: 90, defense: 0, probability: 0.15, reward: 4, desc: "한때 살아있던 존재의 희미한 흔적입니다. 특수한 능력은 없습니다.", effectiveness: "표준 퇴마 공격.", lore: "완전한 영혼조차 아니며, 단지 살고자 했던 강력한 욕망이 남긴 잔상입니다." },
        { type: 'shade', icon: '👤', speed: 6.6, hp: 60, defense: 0, probability: 0.1, reward: 5, desc: "흐릿하게 움직이는 약하지만 빠른 영입니다.", effectiveness: "속사형 유닛.", lore: "존재를 간신히 유지하고 있는 영혼의 아주 미세한 파편입니다." },
        { type: 'tank', icon: '💀', speed: 2.25, hp: 160, defense: 8, probability: 0.15, reward: 7, desc: "죄악으로 단단해진 영혼입니다. 높은 체력과 보통의 방어력을 가집니다.", effectiveness: "치명타 및 방어 무시 암살자.", lore: "생전의 무거운 죄가 깨지지 않는 강철 껍질로 형상화되었습니다." },  
        { type: 'runner', icon: '⚡', speed: 6.6, hp: 35, defense: 0, probability: 0.1, reward: 6, desc: "빠른 속도로 포탈을 향해 돌진하는 민첩한 그림자입니다.", effectiveness: "둔화 사슬 또는 빙결 에너지.", lore: "평생 정의를 피해 도망 다니던 도둑으로, 이제 영원히 달려야 하는 저주에 걸렸습니다." }
    ],
    pattern: [
        { type: 'defiled_apprentice', icon: '🥀', speed: 1.8, hp: 400, defense: 5, probability: 0.1, reward: 15, desc: "금기된 술법에 손을 댄 수련생입니다. 타격 시 10% 확률로 공격자의 데미지를 감소시킵니다.", effectiveness: "신성 공격 및 높은 DPS.", lore: "한 순간의 나약함으로 금지된 두루마리를 펼친 대가는 영원한 타락이었습니다." },
        { type: 'greedy', icon: '🧛', speed: 3.6, hp: 150, defense: 5, probability: 0.2, reward: 12, desc: "타격 시 10% 확률로 공격 중인 유닛을 무작위 슬롯으로 강제 이동시킵니다.", effectiveness: "이동을 최소화하기 위한 장거리 저격수.", lore: "탐욕에 미친 이 영은 퇴마사들이 딛고 선 땅마저 훔치려 합니다." }, 
        { type: 'mimic', icon: '📦', speed: 3.3, hp: 180, defense: 15, probability: 0.1, reward: 12, desc: "타겟이 되었을 때 가끔 앞으로 순간이동합니다 (20% 확률).", effectiveness: "범위 공격 또는 둔화 효과.", lore: "당신이 가장 갈망하는 모습으로 나타나지만, 그 속은 텅 비어있습니다." },
        { type: 'dimension', icon: '🌀', speed: 5.4, hp: 80, defense: 0, probability: 0.2, reward: 12, desc: "가끔 존재 자체가 사라져 공격에 면역이 됩니다.", effectiveness: "진실을 보는 선지자 또는 속사형 유닛.", lore: "세상으로부터 숨으려 했던 은둔자로, 이제 고통의 차원 사이를 떠돌고 있습니다." }, 
        { type: 'deceiver', icon: '🎭', speed: 4.2, hp: 120, defense: 5, probability: 0.2, reward: 12, desc: "처음 타겟이 되었을 때 뒤로 물러나며 공격을 회피합니다.", effectiveness: "범위 피해 또는 다수의 사냥꾼.", lore: "얼굴을 한 번도 보인 적 없는 거짓말의 명수로, 영원히 가면 뒤에 숨어있습니다." },
        { type: 'betrayer_blade', icon: '🗡️', speed: 5.4, hp: 500, defense: 5, probability: 0.15, reward: 25, desc: "그림자 배신자입니다. 가끔 사라져 공격자가 타겟을 잃게 만듭니다.", effectiveness: "범위 공격 또는 속사형 유닛.", lore: "그가 숨어들었던 그림자가 그의 주인이 되었고, 결국 감옥이 되었습니다." },
        { type: 'cursed_vajra', icon: '🏮', speed: 1.5, hp: 1500, defense: 20, probability: 0.1, reward: 40, desc: "타락한 승려입니다. 타격 시 15% 확률로 공격자를 1초 동안 기절시킵니다.", effectiveness: "장거리 유닛.", lore: "지키기 위해 사용되던 그의 철퇴는 이제 산 자를 부수는 데만 쓰입니다." },
        { type: 'void_piercer', icon: '🏹', speed: 3.6, hp: 600, defense: 5, probability: 0.05, reward: 30, desc: "배신한 궁수입니다. 장거리 유닛의 공격에 대해 50% 회피 확률을 얻습니다.", effectiveness: "단거리 유닛.", lore: "빛의 화살들은 이제 순수한 무(無)의 파편으로 변했습니다." }
    ],
    enhanced: [
        { type: 'boar', icon: '🐗', speed: 1.5, hp: 250, defense: 8, probability: 0.25, reward: 15, desc: "포탈에 가까워질수록 속도가 기하급수적으로 빨라집니다.", effectiveness: "게이트 근처에서의 밀쳐내기와 강력한 기절.", lore: "추격의 전율을 즐기던 폭력적인 사냥꾼으로, 이제 통제할 수 없는 피의 갈증에 사로잡혔습니다." }, 
        { type: 'soul_eater', icon: '🧿', speed: 3.6, hp: 220, defense: 12, probability: 0.1, reward: 15, desc: "피해를 입을 때마다 짧은 시간 동안 이동 속도가 폭발적으로 증가합니다.", effectiveness: "강력한 단발 타격.", lore: "이것이 굶주린 것은 육체가 아니라 퇴마사들의 힘 그 자체입니다." },
        { type: 'frost', icon: '❄️', speed: 3.0, hp: 180, defense: 5, probability: 0.25, reward: 12, desc: "주변 악령들의 속도를 높여주는 빙결 오라를 내뿜습니다.", effectiveness: "우선 타겟 지정 및 화염 에너지.", lore: "눈보라 속에서 홀로 죽었으며, 그들의 심장은 고립과 차가운 원망으로 얼어붙었습니다." }, 
        { type: 'lightspeed', icon: '✨', speed: 9.6, hp: 60, defense: 0, probability: 0.2, reward: 18, desc: "엄청난 속도로 이동하며 속도 강화 오라를 무시합니다.", effectiveness: "즉사 수호자 또는 공허 저격수.", lore: "생명을 구할 말을 전하지 못한 전령으로, 이제 끝에 도달하기 위해 필사적입니다." },
        { type: 'frost_outcast', icon: '❄️', speed: 2.1, hp: 800, defense: 10, probability: 0.1, reward: 35, desc: "저주받은 도사입니다. 주변 아군의 공격 속도를 20% 감소시키는 냉기 오라를 발산합니다.", effectiveness: "오라 범위 밖에서 처치.", lore: "그녀의 마음은 심연에 들어오기 훨씬 전부터 이미 얼어붙어 있었습니다." },
        { type: 'ember_hatred', icon: '☄️', speed: 2.4, hp: 700, defense: 0, probability: 0.1, reward: 30, desc: "증오에 찬 마법사입니다. 죽을 때 폭발하여 주변 적들의 속도를 3초간 50% 증가시킵니다.", effectiveness: "고립되었을 때 처치.", lore: "평생을 태웠던 증오로 불꽃을 피우고 있습니다." }
    ],
    armoured: [
        { type: 'heavy', icon: '⛓️', speed: 1.2, hp: 600, defense: 20, probability: 0.3, knockbackResist: 0.8, reward: 20, desc: "높은 방어력과 밀쳐내기 저항을 가진 거대한 괴수입니다.", effectiveness: "영혼 연결 공유 피해 또는 높은 관통 공격.", lore: "자신의 잔혹함을 자랑스러워하던 집행자로, 이제 자신이 사용하던 사슬에 묶여있습니다." }, 
        { type: 'lava', icon: '🌋', speed: 3.9, hp: 200, defense: 15, probability: 0.2, reward: 18, desc: "빙결 효과를 해제하며 냉기 에너지에 맞으면 앞으로 도약합니다.", effectiveness: "빙결 지양; 표준 마법 또는 화염 사용.", lore: "불같은 성격에 삼켜진 영혼으로, 이제 억누를 수 없는 분노로 불타오르고 있습니다." }, 
        { type: 'burning', icon: '💢', speed: 3.0, hp: 350, defense: 10, probability: 0.2, reward: 15, desc: "공격받을 때마다 자신의 원한 에너지를 소모하여 회복합니다.", effectiveness: "회복을 압도하는 강력한 단일 타격.", lore: "희생이 잊혀진 순교자로, 그들의 고통은 이제 끝없는 재생의 원동력이 되었습니다." },
        { type: 'abyssal_acolyte', icon: '🌑', speed: 1.2, hp: 1200, defense: 15, probability: 0.2, reward: 50, desc: "허무의 종복입니다. 타격 시 타격원의 데미지를 감소시킵니다 (최대 3중첩).", effectiveness: "폭발적인 데미지 또는 기절.", lore: "그림자 팔들은 그들을 더 깊이 끌어당기는 심연의 손길입니다." },
        { type: 'bringer_of_doom', icon: '⛓️‍💥', speed: 0.9, hp: 3000, defense: 30, probability: 0.1, reward: 150, desc: "[희귀 괴수] 무작위 2개 슬롯의 데미지를 영구적으로 감소시킵니다.", effectiveness: "가능한 한 빨리 처치하세요!", lore: "그들이 걷는 곳마다 대지가 비명을 지릅니다. 어떤 신성함도 남지 않습니다." }
    ],
    treasure: [
        { type: 'gold', icon: '💎', speed: 7.5, hp: 80, defense: 50, probability: 1.0, reward: 200, desc: "처치 시 막대한 양의 소울 에너지를 주는 희귀한 영입니다.", effectiveness: "높은 방어력을 우회하기 위한 속사형 암살자.", lore: "과거의 허영심으로 여전히 반짝이는 왕의 보물 잔재입니다." } 
    ]
};

// Boss data
const bossData = {
    10: { name: "케르베로스", type: "cerberus", icon: '👺', hp: 2500, speed: 1.05, size: 180, rewardName: "케르베로스의 송곳니", rewardEffect: 0.1, lore: "타락한 영혼들의 끝없는 유입으로 미쳐버린 문지기입니다." },
    20: { name: "카론", type: "charon", icon: '🛶', hp: 4500, speed: 0.75, size: 180, rewardName: "스틱스 노", rewardEffect: 0.15, lore: "망자를 인도하는 사공이었으나, 이제는 영혼들을 직접 수확하기 시작했습니다." }, 
    30: { name: "바알세불", type: "beelzebub", icon: '🪰', hp: 8000, speed: 0.75, size: 180, rewardName: "폭식의 왕관", rewardEffect: 0.01, lore: "역사상 모든 깨진 약속의 부패에서 태어난 파리의 왕입니다." }, 
    40: { name: "루시퍼", type: "lucifer", icon: '👑', hp: 15000, speed: 0.6, size: 210, rewardName: "타락천사의 날개", rewardEffect: 0.1, lore: "최초로 타락한 자로, 모든 빛을 자신과 같은 바닥 없는 심연으로 끌어들이려 합니다." } 
};


function showBossWarning(bossName) {
    const modal = document.getElementById('unlock-modal');
    const header = document.getElementById('unlock-header');
    const icon = document.getElementById('unlock-icon');
    const name = document.getElementById('unlock-name');
    const desc = document.getElementById('unlock-desc');
    
    if (modal && header && icon && name && desc) {
        header.innerText = "⚠️ 경고! 보스 출현!";
        header.style.color = "#ff0000";
        icon.innerText = "👿";
        name.innerText = bossName;
        desc.innerText = "심연에서 강력한 존재가 나타났습니다! 전투를 준비하십시오.";
        modal.style.display = 'flex';
        isPaused = true;
    }
}

// Initialize stage
function initStage() {
    isBossStage = (stage % 10 === 0); // Boss stage every 10 levels
    bossSpawned = false;
    bossInstance = null;
    
    // Check for difficulty increase message
    const diffMsgContainer = document.getElementById('difficulty-msg-container');
    const diffMsg = document.getElementById('difficulty-msg');
    if (diffMsg && diffMsgContainer) {
        let msg = "";
        if (stage === 6) msg = "그림자가 깊어집니다...";
        else if (stage === 16) msg = "심연이 깨어납니다!";
        else if (stage === 31) msg = "영원한 황혼";
        else if (stage === 51) msg = "허무가 모든 것을 삼킵니다";

        if (msg) {
            diffMsg.innerText = msg;
            diffMsg.classList.remove('difficulty-anim');
            void diffMsg.offsetWidth; // Trigger reflow
            diffMsg.classList.add('difficulty-anim');
            
            // Make clickable to close
            diffMsgContainer.style.pointerEvents = 'auto';
            diffMsgContainer.onclick = () => {
                diffMsg.classList.remove('difficulty-anim');
                diffMsg.style.opacity = 0;
                diffMsgContainer.style.pointerEvents = 'none';
            };
        }
    }

    // Unseal Gatekeeper
    sealedGhostCount = 0; 

    if (isBossStage) {
        totalStageEnemies = 15; 
        const bossName = bossData[stage] ? bossData[stage].name : "알 수 없는 존재";
        
        const tutorialToggle = document.getElementById('tutorial-toggle');
        if (tutorialToggle && tutorialToggle.checked) {
            showBossWarning(bossName);
        }
    }
    else if (stage <= 2) {
        totalStageEnemies = Math.floor(Math.random() * 6) + 12; // 12-17 (Reduced from 20-30)
    } else {
        // Gradually increase, then cap at 40-45 from stage 20 (Reduced from 60-70)
        const baseMin = Math.min(40, 15 + (stage - 2) * 1.5);
        totalStageEnemies = Math.floor(Math.random() * 6) + Math.floor(baseMin);
    }
    currentStageSpawned = 0;
    updateStageInfo();

    // Stage start delay (5s for stage 1, 3s for others)
    isStageStarting = true;
    let countdown = (stage === 1) ? 5 : 3;
    const timerElement = document.getElementById('start-timer');
    timerElement.style.display = 'block';
    timerElement.innerText = countdown;

    const timerInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            timerElement.innerText = countdown;
        } else {
            clearInterval(timerInterval);
            timerElement.innerText = "악령들이 몰려옵니다!";
            
            // [Master] King of the Forsaken logic
            if (typeof towers !== 'undefined') {
                const forsakenKings = towers.filter(t => t.data.type === 'forsaken_king');
                if (forsakenKings.length > 0) {
                    const spawnCount = 3; // Fixed count or other logic
                    for(let i=0; i<spawnCount; i++) {
                        spawnFriendlyGhost();
                    }
                }
            }

            setTimeout(() => {
                timerElement.style.display = 'none';
                isStageStarting = false;
            }, 1000);
        }
    }, 1000);
}

// Update All Gauges (Soul Energy & Portal Energy)
function updateGauges() {
    // Portal Energy Gauge (Below Portal)
    const portalFill = document.getElementById('portal-gauge-fill');
    const portalText = document.getElementById('portal-energy-label');
    const portalElement = document.getElementById('portal');
    const cursedElem = document.getElementById('cursed-status');
    if (portalFill && portalText) {
        const portalRatio = Math.min(portalEnergy / maxPortalEnergy, 1);
        const portalPercent = portalRatio * 100;
        portalFill.style.width = `${portalPercent}%`;
        portalText.innerText = `${Math.floor(portalEnergy)} / ${maxPortalEnergy}`;

        // Cursed Logic
        if (cursedElem) {
            if (portalRatio < 0.25) {
                cursedElem.innerText = "저주: 속삭이는 공포";
                cursedElem.style.color = "#aaa";
                window.damageMultiplier = 1.0; 
            } else if (portalRatio < 0.5) {
                cursedElem.innerText = "저주: 스며드는 무력감 (피해량 -5%)";
                cursedElem.style.color = "#ffeb3b";
                window.damageMultiplier = 0.95;
            } else if (portalRatio < 0.75) {
                cursedElem.innerText = "저주: 영혼의 황폐화 (피해량 & 속도 -10%)";
                cursedElem.style.color = "#ff9800";
                window.damageMultiplier = 0.9;
                // Note: Speed multiplier should be applied in script.js attack logic
            } else {
                cursedElem.innerText = "저주: 심연의 질식 (모든 능력치 -20%)";
                cursedElem.style.color = "#f44336";
                window.damageMultiplier = 0.8;
            }
        }


        // Portal Glow Effect: Transitions to dark red as it fills
        if (portalElement) {
            const glowStrength = 25 + (portalRatio * 50);
            
            // Purple base glow (Lower priority as it fills)
            let shadow = `0 -5px ${glowStrength}px rgba(148, 0, 211, ${0.7 - portalRatio * 0.4})`;
            
            // Strong Dark Red / Black "Corruption" Aura
            if (portalRatio > 0.2) {
                const redIntensity = (portalRatio - 0.2) * 1.25; 
                // Layer multiple shadows for "spreading" effect
                shadow += `, 0 -10px ${glowStrength * 1.5}px rgba(139, 0, 0, ${redIntensity})`;
                shadow += `, 0 -15px ${glowStrength * 2.5}px rgba(255, 0, 0, ${redIntensity * 0.4})`;
                shadow += `, 0 -5px 40px rgba(0, 0, 0, ${redIntensity})`;
            }
            
            if (portalRatio > 0.8) {
                shadow += `, 0 0 15px white`;
            }

            portalElement.style.boxShadow = shadow;
            portalElement.style.filter = `brightness(${1 + portalRatio * 0.3})`;

            // Intense shaking when near death (Fixed to not dislocate)
            if (portalRatio > 0.85) {
                portalElement.style.animation = 'portalShake 0.1s infinite';
            } else {
                portalElement.style.animation = 'none';
            }
        }
    }

    // Soul Energy Gauge
    const seFill = document.getElementById('se-gauge-fill');
    const seText = document.getElementById('se-display-text');
    if (seFill && seText) {
        // Max cap for display (e.g., 1000 Soul Energy for 100% fill)
        const displayMax = 1000;
        const sePercent = Math.min((money / displayMax) * 100, 100);
        seFill.style.width = `${sePercent}%`;
        seText.innerText = Math.floor(money); // Ensure floor
    }
}

// Update stage information display
function updateStageInfo() {
    const stageDisplay = document.getElementById('stage-display');
    const stageNameElem = document.getElementById('stage-name');
    const enemiesLeft = document.getElementById('enemies-left');
    
    if (stageDisplay) stageDisplay.innerText = stage;
    
    if (stageNameElem) {
        let name = "Whispering Gates";
        if (stage >= 51) name = "Nightmare Realm";
        else if (stage >= 41) name = "The Eternal Abyss";
        else if (stage >= 31) name = "Shadow Sanctum";
        else if (stage >= 21) name = "Wailing Corridors";
        else if (stage >= 11) name = "Desolate Path";
        stageNameElem.innerText = name;
    }

    if (enemiesLeft) {
        if (isBossStage) {
            enemiesLeft.innerText = "보스";
            const rsFill = document.getElementById('rs-gauge-fill');
            if (rsFill) rsFill.style.width = '100%';
        } else {
            const remainingToSpawn = Math.max(0, totalStageEnemies - currentStageSpawned);
            const currentTotal = remainingToSpawn + enemies.length;
            enemiesLeft.innerText = currentTotal;
            
            const rsFill = document.getElementById('rs-gauge-fill');
            if (rsFill && totalStageEnemies > 0) {
                const ratio = currentTotal / totalStageEnemies;
                rsFill.style.width = `${ratio * 100}%`;
            }
        }
    }
}

// Attach to window for other scripts
window.updateGauges = updateGauges;
window.updateStageInfo = updateStageInfo;

// Spawn wave
function spawnWave() {
    if (currentStageSpawned >= totalStageEnemies && !isBossStage) return;
    if (isBossStage && bossSpawned && currentStageSpawned >= totalStageEnemies) return;

    if (isBossStage && !bossSpawned) {
        spawnBoss();
        bossSpawned = true;
    }

    let min = 1, max = 2; // Default small wave
    if (isBossStage) {
        min = 1; max = 2; 
    } else if (stage >= 20) {
        min = 2; max = 4; // Max 4 even in late game
    } else if (stage >= 10) {
        min = 1; max = 3;
    }
    
    let count = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!isBossStage && count > totalStageEnemies - currentStageSpawned) {
        count = totalStageEnemies - currentStageSpawned;
    }

    for(let i=0; i<count; i++) {
        setTimeout(() => {
            if (isPaused) return; // Don't spawn if game paused during sequence
            spawnEnemy();
        }, i * 350); // 0.35s delay between each enemy
    }
    lastSpawnTime = Date.now() + (count * 350); // Adjust lastSpawnTime to account for sequence duration
}

// Spawn boss
function spawnBoss() {
    const road = document.getElementById('road');
    const frozenOverlay = document.getElementById('frozen-overlay');
    const data = bossData[stage] || { name: "Boss", type: "cerberus", hp: 3000, speed: 0.3, size: 60 };
    
    if (typeof recordUnlock === 'function') {
        recordUnlock(data.type, true);
    }

    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy', 'boss', 'spawning', data.type);
    enemyDiv.innerText = ''; // Clear icon for Canvas rendering
    
    // Remove spawning class after animation
    setTimeout(() => {
        enemyDiv.classList.remove('spawning');
    }, 500);

    // HP Bar
    const hpBg = document.createElement('div');
    hpBg.className = 'hp-bar-bg';
    const hpFill = document.createElement('div');
    hpFill.className = 'hp-bar-fill';
    hpBg.appendChild(hpFill);
    enemyDiv.appendChild(hpBg);
    
    const { hpStageMult, speedStageMult } = getStageMultipliers(true);

    const boss = {
        element: enemyDiv,
        hpFill: hpFill,
        initialX: 50,
        x: 50,
        targetX: 50, // Bosses go to center
        y: 0,
        baseSpeed: data.speed * speedStageMult,
        speed: data.speed * speedStageMult,
        maxHp: data.hp * hpStageMult,
        hp: data.hp * hpStageMult,
        reward: 500,         // Add reward for boss
        isBoss: true,
        data: data,
        lastAbilityTime: Date.now()
    };

    // Enemy click event
    enemyDiv.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (typeof window.showEnemyInfo === 'function') {
            window.showEnemyInfo(boss);
        }
    });

    road.appendChild(enemyDiv);
    enemyDiv.style.left = '50%';
    enemyDiv.style.top = '0px';

    enemies.push(boss);
    bossInstance = boss;

    if (data.type === 'charon') {
        for(let i=0; i<5; i++) spawnPassenger(boss);
    }

    if (data.type === 'lucifer') {
        frozenOverlay.style.opacity = 1; 
        
        // Absolute Zero ability
        setTimeout(() => {
            if (boss.hp > 0) {
                const activeTowers = towers.filter(t => !t.isFrozenTomb);
                if (activeTowers.length > 0) {
                    const target = activeTowers[0]; 
                    target.isFrozenTomb = true;
                    target.element.classList.add('frozen-tomb');
                    
                    const tutorialToggle = document.getElementById('tutorial-toggle');
                    if (tutorialToggle && tutorialToggle.checked) {
                        alert("🥶 Lucifer's [Absolute Zero]! An exorcist has been permanently frozen!");
                    }
                }
            }
        }, 3000);
    }
}

// Spawn individual enemy
function spawnEnemy() {
    const road = document.getElementById('road');
    currentStageSpawned++;
    updateStageInfo();

    const relicTreasureBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('treasure_chance') : 0;
    const finalTreasureChance = treasureChance + relicTreasureBonus;
    
    let probs;
    if (stage === 1) {
        probs = { basic: 1.0, pattern: 0, enhanced: 0, armoured: 0, treasure: 0 };
    } else if (stage >= 51) {
        // Nightmare (50+) - Adjusted basic from 0.20 to 0.30
        probs = { basic: 0.30, pattern: 0.23, enhanced: 0.23, armoured: 0.23, treasure: finalTreasureChance };
    } else if (stage >= 41) {
        // Late (41-50) - Adjusted basic from 0.40 to 0.50
        probs = { basic: 0.50, pattern: 0.17, enhanced: 0.17, armoured: 0.15, treasure: finalTreasureChance };
    } else if (stage >= 31) {
        // Mid-Late (31-40) - Adjusted basic from 0.55 to 0.65
        probs = { basic: 0.65, pattern: 0.12, enhanced: 0.12, armoured: 0.10, treasure: finalTreasureChance };
    } else if (stage >= 21) {
        // Mid (21-30) - Adjusted basic from 0.70 to 0.80
        probs = { basic: 0.80, pattern: 0.07, enhanced: 0.07, armoured: 0.05, treasure: finalTreasureChance };
    } else if (stage >= 11) {
        // Early-Mid (11-20) - Adjusted basic from 0.85 to 0.90
        probs = { basic: 0.90, pattern: 0.03, enhanced: 0.04, armoured: 0.02, treasure: finalTreasureChance };
    } else {
        // Early (2-10)
        probs = { basic: 0.95, pattern: 0.015, enhanced: 0.015, armoured: 0.01, treasure: finalTreasureChance };
    }

    // Adjust basic to accommodate treasure chance correctly
    const actualTreasure = probs.treasure;
    probs.basic = Math.max(0, probs.basic - actualTreasure);

    const randCat = Math.random();
    let accumulatedCatProb = 0;
    let category = 'basic';

    for (const [key, value] of Object.entries(probs)) {
        accumulatedCatProb += value;
        if (randCat < accumulatedCatProb) {
            category = key;
            break;
        }
    }

    let enemyTypes = enemyCategories[category];
    
    // Stage 1 special restriction: Only Normal and Shade
    if (stage === 1 && category === 'basic') {
        enemyTypes = enemyTypes.filter(e => e.type === 'normal' || e.type === 'shade');
    }

    const randEnemy = Math.random();
    let accumulatedEnemyProb = 0;
    let selectedType = enemyTypes[0];

    // Calculate total probability of current set to normalize
    const totalSetProb = enemyTypes.reduce((sum, e) => sum + e.probability, 0);
    let currentRand = Math.random() * totalSetProb;

    for (const enemyType of enemyTypes) {
        currentRand -= enemyType.probability;
        if (currentRand <= 0) {
            selectedType = enemyType;
            break;
        }
    }

    if (typeof recordUnlock === 'function') {
        recordUnlock(selectedType.type, true);
    }

    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy', 'spawning');
    enemyDiv.classList.add(selectedType.type);
    enemyDiv.innerText = ''; // Clear for Canvas
    
    // Remove spawning class after animation
    setTimeout(() => {
        enemyDiv.classList.remove('spawning');
    }, 500);

    // HP Bar
    const hpBg = document.createElement('div');
    hpBg.className = 'hp-bar-bg';
    const hpFill = document.createElement('div');
    hpFill.className = 'hp-bar-fill';
    hpBg.appendChild(hpFill);
    enemyDiv.appendChild(hpBg);

    const { hpStageMult, speedStageMult } = getStageMultipliers();

    // Road is 340px wide, centered in 1080px (approx 34.2% to 65.8%)
    const randomX = Math.random() * 20 + 40; 
    const enemy = {
        element: enemyDiv,
        hpFill: hpFill,
        initialX: randomX,
        x: randomX,
        targetX: Math.random() * 20 + 40, // Narrower range to stay within the 340px road
        y: -40, // Spawn higher up inside the mist
        swayPhase: Math.random() * Math.PI * 2, // Random starting phase for swaying
        swaySpeed: 0.02 + Math.random() * 0.03, // Unique swaying speed
        baseSpeed: selectedType.speed * speedStageMult,
        speed: selectedType.speed * speedStageMult,
        maxHp: selectedType.hp * hpStageMult,
        defense: selectedType.defense || 0,
        hp: selectedType.hp * hpStageMult,
        reward: selectedType.reward || 10,
        type: selectedType.type,
        icon: selectedType.icon,
        desc: selectedType.desc,
        isPhasing: false,
        isSilenced: false,
        isFrozen: false,
        isSlowed: false,
        hasBackstepped: false
    };

    // Enemy click event
    enemyDiv.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (typeof window.showEnemyInfo === 'function') {
            window.showEnemyInfo(enemy); 
        }
    });

    road.appendChild(enemyDiv);
    enemyDiv.style.left = `${randomX}%`;
    enemyDiv.style.top = '-40px';

    // Special initialization for Boar (Feral Revenant)
    if (selectedType.type === 'boar') {
        enemy.vxSign = Math.random() < 0.5 ? -1 : 1; 
    }

    enemies.push(enemy);
}

// Charon's passengers
function spawnPassenger(boss) {
    const road = document.getElementById('road');
    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy', 'normal', 'boarded', 'spawning');
    road.appendChild(enemyDiv);
    
    // Remove spawning class after animation
    setTimeout(() => {
        enemyDiv.classList.remove('spawning');
    }, 500);

    const offsetX = (Math.random() - 0.5) * 30; 
    const offsetY = (Math.random() - 0.5) * 40;

    const { hpStageMult, speedStageMult } = getStageMultipliers();

    const enemy = {
        element: enemyDiv,
        initialX: boss.x,
        x: boss.x,
        targetX: 50, // Converge to center with boss
        y: boss.y,
        baseSpeed: 1.5 * speedStageMult,
        speed: 1.5 * speedStageMult,
        maxHp: 100 * hpStageMult,
        hp: 100 * hpStageMult,
        type: 'normal',
        isBoarded: true,     
        parentBoss: boss,    
        offsetX: offsetX,
        offsetY: offsetY,
        reward: 5,           // Add default reward
        invincible: true     
    };
    enemies.push(enemy);
}

// Spawns a friendly ghost (Forsaken King ability)
function spawnFriendlyGhost() {
    const road = document.getElementById('road');
    const ghostDiv = document.createElement('div');
    ghostDiv.classList.add('friendly-ghost');
    road.appendChild(ghostDiv);
    
    // Road is 340px wide, centered in 1080px (approx 34.2% to 65.8%)
    const randomX = Math.random() * 20 + 40; 
    ghostDiv.style.left = `${randomX}%`;
    
    // Start at bottom
    const roadRect = road.getBoundingClientRect();
    const startY = roadRect.height - 60;
    ghostDiv.style.top = `${startY}px`;

    friendlyGhosts.push({
        element: ghostDiv,
        x: randomX, 
        y: startY, 
        speed: 0.5, // Slow speed moving UP
        maxHp: 500
    });
}

// Handle enemy death
function handleEnemyDeath(target, killer = null) {
    if (target.hp > 0) return;

    // Cursed Mark: Explosion on death
    if (target.isCursedMark) {
        const explosion = document.createElement('div');
        explosion.style.position = 'absolute';
        explosion.style.left = target.element.style.left;
        explosion.style.top = target.element.style.top;
        explosion.style.width = '120px'; explosion.style.height = '120px';
        explosion.style.background = 'radial-gradient(circle, #2e003e, transparent)';
        explosion.style.transform = 'translate(-50%, -50%)';
        explosion.style.zIndex = '19';
        explosion.style.borderRadius = '50%';
        explosion.style.opacity = '0.8';
        gameContainer.appendChild(explosion);
        setTimeout(() => explosion.remove(), 400);

        const gameW = gameContainer.offsetWidth;
        const tX = (target.x / 100) * gameW;
        const tY = target.y;

        enemies.forEach(e => {
            if (e === target || e.hp <= 0) return;
            const eX = (e.x / 100) * gameW;
            const dist = Math.sqrt(Math.pow(eX - tX, 2) + Math.pow(e.y - tY, 2));
            if (dist < 100) { 
                if (typeof window.applyDamage === 'function') {
                    window.applyDamage(e, target.maxHp * 0.5, null); 
                }
            }
        });
    }

    // Hellfire Explosion
    if (target.isHellfireBurn) {
        const explosion = document.createElement('div');
        explosion.style.position = 'absolute';
        explosion.style.left = target.element.style.left;
        explosion.style.top = target.element.style.top;
        explosion.style.width = '100px'; explosion.style.height = '100px';
        explosion.style.background = 'radial-gradient(circle, #ff4500, transparent)';
        explosion.style.transform = 'translate(-50%, -50%)';
        explosion.style.zIndex = '19';
        explosion.style.borderRadius = '50%';
        explosion.style.opacity = '0.8';
        gameContainer.appendChild(explosion);
        setTimeout(() => explosion.remove(), 400);

        const gameW = gameContainer.offsetWidth;
        const tX = (target.x / 100) * gameW;
        const tY = target.y;

        enemies.forEach(e => {
            if (e === target || e.hp <= 0) return;
            const eX = (e.x / 100) * gameW;
            const dist = Math.sqrt(Math.pow(eX - tX, 2) + Math.pow(e.y - tY, 2));
            if (dist < 80) { 
                if (typeof window.applyDamage === 'function') {
                    window.applyDamage(e, 30, null); 
                }
                e.isBurning = true;
                e.burnEndTime = Date.now() + 3000;
                e.isHellfireBurn = true; 
                if(e.element) e.element.classList.add('burning');
            }
        });
    }

    // Embers of Hatred: Explosion on death
    if (target.type === 'ember_hatred') {
        const explosion = document.createElement('div');
        explosion.style.position = 'absolute';
        explosion.style.left = target.element.style.left;
        explosion.style.top = target.element.style.top;
        explosion.style.width = '150px'; explosion.style.height = '150px';
        explosion.style.background = 'radial-gradient(circle, rgba(255, 69, 0, 0.6), transparent)';
        explosion.style.transform = 'translate(-50%, -50%)';
        explosion.style.zIndex = '19';
        explosion.style.borderRadius = '50%';
        gameContainer.appendChild(explosion);
        setTimeout(() => explosion.remove(), 500);

        const gameW = gameContainer.offsetWidth;
        const tX = (target.x / 100) * gameW;
        const tY = target.y;

        enemies.forEach(e => {
            if (e === target || e.hp <= 0) return;
            const eX = (e.x / 100) * gameW;
            const dist = Math.sqrt(Math.pow(eX - tX, 2) + Math.pow(e.y - tY, 2));
            if (dist < 100) { 
                e.speed *= 1.5; // 50% Speed boost
                setTimeout(() => { e.speed = e.baseSpeed; }, 3000);
            }
        });
    }

    // Wraith Lord Resurrect
    if (killer && killer.data.type === 'wraithlord') {
        const road = document.getElementById('road');
        const skeletonDiv = document.createElement('div');
        skeletonDiv.classList.add('friendly-skeleton');
        road.appendChild(skeletonDiv);
        skeletonDiv.style.left = target.element.style.left;
        skeletonDiv.style.top = target.element.style.top;

        friendlySkeletons.push({
            element: skeletonDiv,
            x: target.x, 
            y: target.y, 
            speed: 2.0 
        });
    }

    const idx = enemies.indexOf(target);
    if (idx > -1) {
        if (target.type) recordKill(target.type);
        target.element.remove();
        enemies.splice(idx, 1);
        if (typeof checkRelicDrop === 'function') checkRelicDrop(target);
        updateStageInfo(); 
        
        if (target.isBoss) {
            let rewardMsg = "";
            let bonusDetail = "";
            let relicId = "";

            if (target.data.type === 'cerberus') {
                relicId = 'cerberus_fang';
                rewardMsg = `Obtained [${target.data.rewardName}]`;
                bonusDetail = "Global ATK +10%";
            } else if (target.data.type === 'charon') {
                relicId = 'stygian_oar';
                rewardMsg = `Obtained [${target.data.rewardName}]`;
                bonusDetail = "Enemy Speed -15%";
            } else if (target.data.type === 'beelzebub') {
                relicId = 'gluttony_crown';
                rewardMsg = `Obtained [${target.data.rewardName}]`;
                bonusDetail = "Treasure Spawn Rate Up";
            } else if (target.data.type === 'lucifer') {
                relicId = 'fallen_wings';
                rewardMsg = `Obtained [${target.data.rewardName}]`;
                bonusDetail = "Crit Chance +10%";
                
                const frozenOverlay = document.getElementById('frozen-overlay');
                if(frozenOverlay) frozenOverlay.style.opacity = 0; 
                towers.forEach(t => {
                    if (t.isFrozenTomb) {
                        t.isFrozenTomb = false;
                        t.element.classList.remove('frozen-tomb');
                    }
                });
            }
            
            if (relicId && typeof collectRelic === 'function') {
                collectRelic(relicId);
            }
            
            showBossVictory(target.data.name, rewardMsg, bonusDetail);
            bossInstance = null;
        }

        let reward = target.reward;
        if (killer && killer.data && killer.data.type === 'abyssal') {
            reward = Math.floor(reward * 1.5);
        }
        
        // Add Relic SE Gain Bonus
        const relicSEBonus = (typeof getRelicBonus === 'function') ? getRelicBonus('se_gain') : 0;
        if (relicSEBonus > 0) {
            reward = Math.floor(reward * (1.0 + relicSEBonus));
        }

        money = Math.min(1000, money + reward);
        updateGauges();

        if (typeof createSEGainEffect === 'function' && target.element) {
            const rect = target.element.getBoundingClientRect();
            const gameRect = gameContainer.getBoundingClientRect();
            createSEGainEffect((rect.left + rect.width / 2) - gameRect.left, (rect.top + rect.height / 2) - gameRect.top, reward, gameContainer);
        }

        if (typeof window.updateSummonButtonState === 'function') {
            window.updateSummonButtonState();
        }
    }
}

function showBossVictory(bossName, rewardMsg, bonusDetail) {
    const container = document.getElementById('game-container');
    const overlay = document.createElement('div');
    overlay.className = 'boss-victory-overlay';
    
    overlay.innerHTML = `
        <div class="boss-victory-content">
            <div class="boss-victory-header">ABYSSAL ENTITY BANISHED</div>
            <div class="boss-victory-name">${bossName} DEFEATED</div>
            <div class="boss-victory-reward">${rewardMsg}</div>
            <div class="boss-victory-bonus">${bonusDetail}</div>
            <div class="boss-victory-hint">(Click to continue)</div>
        </div>
    `;
    
    container.appendChild(overlay);
    isPaused = true;
    
    overlay.addEventListener('click', () => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.remove();
            isPaused = false;
        }, 500);
    });
}

function createSEGainEffect(x, y, amount, container) {
    if (!container) return;
    const effect = document.createElement('div');
    effect.className = 'se-gain-effect';
    effect.innerText = `+${amount}`;
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
}
