/* allies_data.js - Constants and Unit Definitions */

window.towerCost = 30;
const jobChangeCost = 200; 
const maxTowers = 16; 

/* allies_data.js - Global State and Shared Functions */
let stage = 1;
let isTimeFrozen = false;
let timeFreezeEndTime = 0;

let enemies = [];
let towers = [];
let money = 100; // SE
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
let friendlySkeletons = [];
let friendlyGhosts = [];
let groundEffects = [];
let gameContainer, road;

/**
 * Updates Soul Energy and Portal Energy Displays
 */
function updateGauges() {
    const moneyDisplay = document.getElementById('se-display-text');
    const peDisplay = document.getElementById('portal-energy-label');
    const peFill = document.getElementById('portal-gauge-fill');
    const seFill = document.getElementById('se-gauge-fill');

    if (moneyDisplay) moneyDisplay.innerText = Math.floor(money);
    if (peDisplay) peDisplay.innerText = `${Math.floor(portalEnergy)} / ${maxPortalEnergy}`;
    
    if (peFill) peFill.style.width = `${(portalEnergy / maxPortalEnergy) * 100}%`;
    if (seFill) seFill.style.width = `${Math.min((money / 1000) * 100, 100)}%`;
}

/**
 * Updates Stage Info and Enemies Left Display
 */
function updateStageInfo() {
    const stageDisplay = document.getElementById('stage-display');
    if (stageDisplay) stageDisplay.innerText = stage;
    
    const enemiesLeft = document.getElementById('enemies-left');
    if (enemiesLeft) {
        const remaining = Math.max(0, (totalStageEnemies - currentStageSpawned) + enemies.length);
        enemiesLeft.innerText = remaining;
    }
}

const unitTypes = [
    { type: 'apprentice', name: '견습 퇴마사', role: '기본', tier: 1, icon: '🧙', damage: 40, range: 360, cooldown: 833, desc: "정화된 에너지 볼트를 발사하여 단일 대상을 공격합니다." },
    
    // --- [숙련된] Tier 2: 위력 60~130 (기존 대비 약 2~3배) ---
    { type: 'chainer', name: '영혼의 결박자', role: '숙련된 지원형', tier: 2, icon: '⛓️', damage: 65, range: 390, cooldown: 1000, desc: "영적인 사슬을 발사하여 적에게 피해를 주고 이동 속도를 30% 감소시킵니다.", upgrades: ['executor', 'binder'] },
    { type: 'talisman', name: '부적술사', role: '숙련된 공격형', tier: 2, icon: '📜', damage: 85, range: 360, cooldown: 1500, desc: "폭발하는 부적을 던져 충격 지점에 범위 피해를 입힙니다.", upgrades: ['grandsealer', 'flamemaster'] },
    { type: 'monk', name: '철퇴 승려', role: '숙련된 지원형', tier: 2, icon: '⛪', damage: 95, range: 300, cooldown: 1200, desc: "무거운 철퇴로 타격하여 악령을 포탈에서 멀리 밀쳐냅니다.", upgrades: ['vajra', 'saint'] },
    { type: 'archer', name: '신성한 궁수', role: '숙련된 공격형', tier: 2, icon: '🏹', damage: 140, range: 750, cooldown: 1500, desc: "적의 방어력을 일부 무시하는 장거리 정밀 화살을 쏩니다.", upgrades: ['voidsniper', 'thousandhand'] },
    { type: 'ice', name: '빙결 도사', role: '숙련된 지원형', tier: 2, icon: '❄️', damage: 75, range: 390, cooldown: 1000, desc: "빙결 주문을 외워 2초 동안 적의 이동 속도를 크게 감소시킵니다.", upgrades: ['absolutezero', 'permafrost'] },
    { type: 'fire', name: '화염 마법사', role: '숙련된 공격형', tier: 2, icon: '🔥', damage: 60, range: 360, cooldown: 1000, desc: "적을 불태워 매초 최대 체력의 1%만큼 화상 피해를 입힙니다.", upgrades: ['hellfire', 'phoenix'] },
    { type: 'assassin', name: '그림자 암살자', role: '숙련된 공격형', tier: 2, icon: '🗡️', damage: 55, range: 300, cooldown: 300, desc: "쌍검으로 빠르게 난도질하며 적의 모든 방어력을 무시합니다.", upgrades: ['abyssal', 'spatial'] },
    { type: 'tracker', name: '영혼 추적자', role: '숙련된 지원형', tier: 2, icon: '👁️', damage: 60, range: 300, cooldown: 1000, desc: "인도하는 빛을 비추어 주변 모든 아군의 공격 사거리를 확장합니다.", upgrades: ['seer', 'commander'] },
    { type: 'necromancer', name: '강령술사', role: '숙련된 지원형', tier: 2, icon: '🔮', damage: 90, range: 360, cooldown: 1200, desc: "영적인 에너지 벽을 소환하여 악령들의 진로를 물리적으로 차단합니다.", upgrades: ['wraithlord', 'cursedshaman'] },
    { type: 'guardian', name: '성소 수호자', role: '숙련된 특수형', tier: 2, icon: '🛡️', damage: 120, range: 360, cooldown: 1500, desc: "신성한 힘으로 공격하며, 5% 확률로 대상을 즉시 추방합니다.", upgrades: ['rampart', 'judgment'] },
    { type: 'alchemist', name: '퇴마 연금술사', role: '숙련된 특수형', tier: 2, icon: '🧪', damage: 80, range: 330, cooldown: 1200, desc: "적의 본질을 변환하여, 타격 시 5% 확률로 2 SE를 획득합니다.", upgrades: ['midas', 'philosopher'] },
    { type: 'mirror', name: '거울 예언자', role: '숙련된 특수형', tier: 2, icon: '🪞', damage: 75, range: 390, cooldown: 1500, desc: "반사 마법을 사용하여 입힌 피해의 30%를 주변의 다른 적에게 튕깁니다.", upgrades: ['illusion', 'reflection'] },
    { type: 'knight', name: '퇴마 기사', role: '숙련된 공격형', tier: 2, icon: '⚔️', damage: 110, range: 330, cooldown: 1000, desc: "축복받은 대검을 휘둘러 물리 피해와 신성 피해를 균형 있게 입힙니다.", upgrades: ['paladin', 'crusader'] },

    // --- [마스터] Tier 3: 위력 250~550 (숙련된 대비 약 4배) ---
    { type: 'paladin', name: '성기사', role: '공격', tier: 3, icon: '⛪', damage: 320, range: 390, cooldown: 1000, desc: "매 5번째 공격마다 3배의 피해를 입히고 기절시키는 신성한 강타를 발동합니다.", upgrades: ['eternal_wall'] },
    { type: 'crusader', name: '혈기사', role: '공격', tier: 3, icon: '🚩', damage: 450, range: 360, cooldown: 1500, desc: "처형의 일격을 가하며, 적의 체력이 낮을수록 더 큰 피해를 입힙니다.", upgrades: ['eternal_wall'] },
    { type: 'midas', name: '황금의 미다스', role: '특수', tier: 3, icon: '💰', damage: 280, range: 360, cooldown: 1200, desc: "공격에 황금을 입혀, 처치 시 대량의 15 SE를 획득합니다.", upgrades: ['transmuter'] },
    { type: 'philosopher', name: '공허의 현자', role: '특수', tier: 3, icon: '💎', damage: 340, range: 390, cooldown: 1500, desc: "타격 시마다 적의 방어력을 영구적으로 1 감소시키는 부식 저주를 겁니다.", upgrades: ['transmuter'] },
    { type: 'illusion', name: '환영술사', role: '특수', tier: 3, icon: '🎭', damage: 260, range: 420, cooldown: 1200, desc: "정신을 혼미하게 하여, 20% 확률로 적이 갈 길을 잃고 방황하게 만듭니다.", upgrades: ['oracle'] },
    { type: 'reflection', name: '반사의 거장', role: '특수', tier: 3, icon: '🪩', damage: 310, range: 450, cooldown: 1500, desc: "충격 시 여러 적 사이를 튕겨 다니는 수정 파편을 발사합니다.", upgrades: ['oracle'] },
    { type: 'executor', name: '명계의 집행자', role: '특수', tier: 3, icon: '⚖️', damage: 290, range: 450, cooldown: 1000, desc: "운명의 천칭을 흔들어, 10% 확률로 적을 시작 지점으로 되돌려 보냅니다.", upgrades: ['warden'] },
    { type: 'binder', name: '영혼의 결박자', role: '지원', tier: 3, icon: '🔗', damage: 240, range: 420, cooldown: 1000, desc: "여러 적의 영혼을 연결하여, 한 명이 받는 피해의 일부를 공유하게 합니다.", upgrades: ['warden'] },
    { type: 'grandsealer', name: '대봉인사', role: '지원', tier: 3, icon: '🛐', damage: 250, range: 390, cooldown: 1500, desc: "적의 특수 능력을 무력화하는 봉인 부적을 발사합니다.", upgrades: ['cursed_talisman'] },
    { type: 'flamemaster', name: '화염 부적 마스터', role: '공격', tier: 3, icon: '🌋', damage: 300, range: 390, cooldown: 1500, desc: "지면에 지속적인 화상 피해를 입히는 불타는 카펫을 남깁니다.", upgrades: ['cursed_talisman'] },
    { type: 'vajra', name: '금강역사', role: '특수', tier: 3, icon: '🔱', damage: 420, range: 300, cooldown: 1200, desc: "신성한 삼지창으로 치명타를 가해 주변 모든 적을 크게 밀쳐냅니다.", upgrades: ['asura'] },
    { type: 'saint', name: '진동의 성자', role: '지원', tier: 3, icon: '🔔', damage: 380, range: 300, cooldown: 1500, desc: "성스러운 종을 울려 좁은 범위 내의 모든 적을 기절시키는 충격파를 만듭니다.", upgrades: ['asura'] },
    { type: 'voidsniper', name: '공허의 저격수', role: '공격', tier: 3, icon: '🎯', damage: 650, range: 9999, cooldown: 2000, desc: "맵 전체를 가로질러 포탈에 가장 가까운 적을 저격하는 탄환을 발사합니다.", upgrades: ['piercing_shadow'] },
    { type: 'thousandhand', name: '천수궁수', role: '공격', tier: 3, icon: '🍃', damage: 220, range: 750, cooldown: 1500, desc: "여러 대상에게 동시에 수많은 화살 세례를 퍼붓습니다.", upgrades: ['piercing_shadow'] },
    { type: 'absolutezero', name: '절대영도 마법사', role: '특수', tier: 3, icon: '💎', damage: 280, range: 420, cooldown: 1000, desc: "공격 시 체력이 20% 이하인 빙결된 적을 즉시 처단할 확률이 있습니다.", upgrades: ['cocytus'] },
    { type: 'permafrost', name: '빙결 처녀', role: '지원', tier: 3, icon: '🌬️', damage: 210, range: 420, cooldown: 1000, desc: "넓은 범위 내의 모든 적을 크게 둔화시키는 지속적인 눈보라를 소환합니다.", upgrades: ['cocytus'] },
    { type: 'hellfire', name: '지옥불 연금술사', role: '공격', tier: 3, icon: '🧪', damage: 260, range: 390, cooldown: 1000, desc: "불타는 적이 죽을 때 폭발하여 주변 적들에게 피해를 입힙니다.", upgrades: ['purgatory'] },
    { type: 'phoenix', name: '불사조 소환사', role: '공격', tier: 3, icon: '🐦‍🔥', damage: 480, range: 540, cooldown: 2000, desc: "대상 뒤에 고데미지 화염 경로를 남기는 불사조를 불러내립니다.", upgrades: ['purgatory'] },
    { type: 'abyssal', name: '심연의 학살자', role: '특수', tier: 3, icon: '🌑', damage: 240, range: 300, cooldown: 300, desc: "정밀하게 영혼을 수확하여, 처치 시 1.5배의 SE를 획득합니다.", upgrades: ['reaper'] },
    { type: 'spatial', name: '공간 절단자', role: '공격', tier: 3, icon: '🌌', damage: 220, range: 360, cooldown: 300, desc: "자신의 공격을 흉내 내는 영적 환영을 소환하여 동시에 여러 적을 타격합니다.", upgrades: ['reaper'] },
    { type: 'seer', name: '진실의 탐구자', role: '지원', tier: 3, icon: '🔭', damage: 180, range: 360, cooldown: 1000, desc: "은신하거나 위상 변화 중인 적을 모든 아군에게 노출시키는 오라를 발산합니다.", upgrades: ['doom_guide'] },
    { type: 'commander', name: '전장 사령관', role: '지원', tier: 3, icon: '🚩', damage: 180, range: 360, cooldown: 1000, desc: "주변 아군들을 고취시켜 그들의 공격 속도를 20% 증가시킵니다.", upgrades: ['doom_guide'] },
    { type: 'wraithlord', name: '망령 군주', role: '지원', tier: 3, icon: '🧟', damage: 320, range: 390, cooldown: 1200, desc: "처치 시 일정 확률로 그 영혼을 아군 해골 병사로 부활시켜 함께 싸우게 합니다.", upgrades: ['forsaken_king'] },
    { type: 'cursedshaman', name: '저주받은 주술사', role: '지원', tier: 3, icon: '🎭', damage: 220, range: 390, cooldown: 1500, desc: "적에게 저주를 걸어, 타격 시마다 최대 체력을 영구적으로 5%씩 감소시킵니다.", upgrades: ['forsaken_king'] },
    { type: 'rampart', name: '신성한 성벽', role: '지원', tier: 3, icon: '🏰', damage: 350, range: 360, cooldown: 1500, desc: "포탈을 방어하며, 도달한 적을 100% 확률로 시작 지점으로 되돌립니다 (5회 충전).", upgrades: ['void_gatekeeper'] },
    { type: 'judgment', name: '심판의 기사', role: '공격', tier: 3, icon: '⚔️', damage: 480, range: 390, cooldown: 1500, desc: "대상 주변의 모든 적에게 범위 피해를 입히는 신성한 빛을 내리꽂습니다.", upgrades: ['void_gatekeeper'] },

    // --- [심연] Tier 4: 위력 1500~5000+ (마스터 대비 약 5~10배) ---
    { type: 'transmuter', name: '공허의 연성사', role: '특수', tier: 4, icon: '⚛️', damage: 1200, range: 420, cooldown: 1000, desc: "악령을 완전히 연성하여, 처치 시마다 25 SE를 획득합니다." },
    { type: 'oracle', name: '영원의 선지자', role: '특수', tier: 4, icon: '💠', damage: 1500, range: 480, cooldown: 1200, desc: "타격 시 적의 움직임을 일시적으로 정지시키는 우주적 투사체를 발사합니다." },
    { type: 'warden', name: '심연의 간수', role: '지원', tier: 4, icon: '🗝️', damage: 2000, range: 600, cooldown: 10000, desc: "주기적으로 블랙홀을 열어 화면 상의 모든 적을 중앙으로 끌어당깁니다." },
    { type: 'cursed_talisman', name: '저주받은 교단', role: '공격', tier: 4, icon: '⛩️', damage: 2500, range: 450, cooldown: 1200, desc: "적에게 죽음의 표식을 새깁니다. 표식된 영혼이 소멸할 때 거대한 폭발이 일어납니다." },
    { type: 'asura', name: '지옥을 부수는 아수라', role: '공격', tier: 4, icon: '👹', damage: 450, range: 360, cooldown: 400, desc: "주변 대상에게 순식간에 12번의 연격파를 퍼붓습니다. (총합 데미지 5,400)" },
    { type: 'piercing_shadow', name: '영혼을 꿰뚫는 그림자', role: '공격', tier: 4, icon: '🌠', damage: 5500, range: 9999, cooldown: 2000, desc: "경로 상의 모든 적을 관통하는 거대한 빛의 줄기를 발사합니다." },
    { type: 'cocytus', name: '코키토스의 지배자', role: '특수', tier: 4, icon: '⏳', damage: 1000, range: 600, cooldown: 20000, desc: "5초 동안 화면 상의 모든 적의 시간을 멈추는 궁극의 빙결 마법을 사용합니다." },
    { type: 'purgatory', name: '영원한 연옥의 불길', role: '공격', tier: 4, icon: '🕯️', damage: 1200, range: 450, cooldown: 800, desc: "지면 한 줄을 통째로 태워, 그 위를 지나는 모든 적에게 영구적인 화상 피해를 줍니다." },
    { type: 'reaper', name: '나이트메어 리퍼', role: '특수', tier: 4, icon: '☠️', damage: 99999, range: 0, cooldown: 3000, desc: "현재 맵에서 체력이 가장 높은 적의 영혼을 즉시 거두어갑니다. (절대 즉사)" },
    { type: 'doom_guide', name: '파멸의 인도자', role: '특수', tier: 4, icon: '🛶', damage: 1800, range: 450, cooldown: 800, desc: "포탈을 정화합니다. 포탈에 도달한 적은 피해 대신 포탈 오염도를 5% 회복시킵니다." },
    { type: 'forsaken_king', name: '버림받은 자들의 왕', role: '지원', tier: 4, icon: '👑', damage: 2200, range: 450, cooldown: 1000, desc: "매 스테이지 시작 시 아군을 위해 싸워줄 우호적인 유령들을 소환합니다." },
    { type: 'void_gatekeeper', name: '공허의 문지기', role: '지원', tier: 4, icon: '🚪', damage: 0, range: 0, cooldown: 0, desc: "패시브로 문을 봉인하여, 포탈 오염도에 입는 모든 피해를 50% 감소시킵니다." },
    { type: 'eternal_wall', name: '영원의 수호벽', role: '지원', tier: 4, icon: '🗿', damage: 3000, range: 450, cooldown: 2000, desc: "강력한 안정화 오라를 내뿜어 맵 상의 모든 적을 80% 둔화시킵니다." }
];
