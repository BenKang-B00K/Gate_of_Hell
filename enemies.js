/* e:\WebGame\Gate of Hell\enemies.js */

// 적 관련 전역 변수
const enemies = []; // 적 목록
const walls = []; // 강령술사 벽 목록
const groundEffects = []; // 지면 효과 목록 (장판)
const friendlySkeletons = []; // 아군 해골 병사 목록

let stage = 1;
let totalStageEnemies = 0;
let currentStageSpawned = 0;
let lastSpawnTime = 0;
let isStageStarting = false;
let isBossStage = false;
let bossSpawned = false;
let bossInstance = null;
let globalSpeedFactor = 1.0; // 적군 속도 배율 (카론 보상)
let treasureChance = 0.01; // 보물 유령 등장 확률 (기본 1%)

// 적 데이터 (카테고리별 분류)
const enemyCategories = {
    basic: [
        { type: 'normal', speed: 1.5, hp: 100, defense: 0, probability: 0.6 }, // 길 잃은 영혼 (60%)
        { type: 'tank', speed: 0.75, hp: 300, defense: 10, probability: 0.2 },  // 죄무거운 망령 (20%)
        { type: 'runner', speed: 3.0, hp: 40, defense: 0, probability: 0.2 }   // 성급한 그림자 (20%)
    ],
    pattern: [
        { type: 'greedy', speed: 1.2, hp: 150, defense: 5, probability: 0.34 }, // 욕심쟁이 령
        { type: 'dimension', speed: 1.8, hp: 80, defense: 0, probability: 0.33 }, // 차원 이동자
        { type: 'deceiver', speed: 1.4, hp: 120, defense: 5, probability: 0.33 }  // 기만하는 유혹자
    ],
    enhanced: [
        { type: 'boar', speed: 0.5, hp: 250, defense: 8, probability: 0.34 }, // 돌진하는 멧돼지 (초기 속도 느림)
        { type: 'frost', speed: 1.0, hp: 180, defense: 5, probability: 0.33 }, // 서리 낀 망령
        { type: 'lightspeed', speed: 4.0, hp: 60, defense: 0, probability: 0.33 } // 광속의 그림자
    ],
    armoured: [
        { type: 'heavy', speed: 0.4, hp: 600, defense: 20, probability: 0.34, knockbackResist: 0.8 }, // 육중한 죄인
        { type: 'lava', speed: 1.3, hp: 200, defense: 15, probability: 0.33 }, // 용암의 갈망
        { type: 'burning', speed: 1.0, hp: 350, defense: 10, probability: 0.33 } // 타오르는 복수심
    ],
    treasure: [
        { type: 'gold', speed: 2.5, hp: 80, defense: 50, probability: 1.0, reward: 300 } // 황금 메아리 (많은 SE)
    ]
};

// 보스 데이터
const bossData = {
    10: { name: "케르베로스", type: "cerberus", hp: 5000, speed: 0.3, size: 60, rewardName: "케르베로스의 송곳니", rewardEffect: 0.1 },
    20: { name: "카론", type: "charon", hp: 8000, speed: 0.2, size: 60, rewardName: "황천의 노", rewardEffect: 0.15 }, // 속도 15% 감소
    30: { name: "바알세불", type: "beelzebub", hp: 15000, speed: 0.2, size: 60, rewardName: "식탐의 왕관", rewardEffect: 0.01 }, // 보물 확률 1% 증가
    40: { name: "루시퍼", type: "lucifer", hp: 25000, speed: 0.15, size: 70, rewardName: "타락천사의 날개", rewardEffect: 0.1 } // 치명타 확률 10% 증가
};

// 스테이지 초기화
function initStage() {
    isBossStage = (stage % 10 === 0); // 10단계마다 보스 스테이지
    bossSpawned = false;
    bossInstance = null;

    // 스테이지별 적 수 설정
    if (isBossStage) {
        // 보스 스테이지: 보스가 죽을 때까지 계속 나옴 (표시용 숫자)
        totalStageEnemies = 999; 
        const bossName = bossData[stage] ? bossData[stage].name : "Unknown Boss";
        alert(`⚠️ 경고! 보스 [${bossName}] 출현! ⚠️`);
    }
    else if (stage <= 10) {
        // 1~10 스테이지: 20 ~ 50마리
        totalStageEnemies = Math.floor(Math.random() * 31) + 20;
    } else {
        // 11 스테이지 이후: 스테이지가 오를수록 증가 (기본 30 + 스테이지 * 2 + 랜덤 20)
        totalStageEnemies = 30 + (stage * 2) + Math.floor(Math.random() * 21);
    }
    currentStageSpawned = 0;
    updateStageInfo();

    // 스테이지 시작 딜레이 (5초)
    isStageStarting = true;
    let countdown = 5;
    const timerElement = document.getElementById('start-timer');
    timerElement.style.display = 'block';
    timerElement.innerText = countdown;

    const timerInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            timerElement.innerText = countdown;
        } else {
            clearInterval(timerInterval);
            timerElement.innerText = "START!";
            setTimeout(() => {
                timerElement.style.display = 'none';
                isStageStarting = false;
            }, 1000);
        }
    }, 1000);
}

// 상단 정보 업데이트
function updateStageInfo() {
    const info = document.getElementById('stage-info');
    const stageDisplay = document.getElementById('stage-display');
    if (info) {
        info.innerText = `STAGE ${stage}\n남은 적: ${totalStageEnemies - currentStageSpawned} / ${totalStageEnemies}`;
    }
    if (stageDisplay) stageDisplay.innerText = stage;
}

// 웨이브 생성 (한 번에 여러 마리 소환)
function spawnWave() {
    if (!isBossStage && currentStageSpawned >= totalStageEnemies) return;

    // 보스 스폰 (보스 스테이지이고 아직 안 나왔으면)
    if (isBossStage && !bossSpawned) {
        spawnBoss();
        bossSpawned = true;
    }

    // 한 번에 나올 적 수 결정
    let min = 2, max = 10;
    if (isBossStage) {
        // 보스 스테이지: 5~10마리
        min = 5; max = 10;
    } else if (stage <= 10) { 
        min = 1; max = 4; // 초반 스테이지는 적게
    }
    
    let count = Math.floor(Math.random() * (max - min + 1)) + min;
    // 남은 적 수보다 많이 나오지 않게 조정
    if (!isBossStage && count > totalStageEnemies - currentStageSpawned) {
        count = totalStageEnemies - currentStageSpawned;
    }

    for(let i=0; i<count; i++) {
        spawnEnemy();
    }
    lastSpawnTime = Date.now();
}

// 보스 생성 함수
function spawnBoss() {
    const road = document.getElementById('road');
    const frozenOverlay = document.getElementById('frozen-overlay');
    const data = bossData[stage] || { name: "Boss", type: "cerberus", hp: 3000, speed: 0.3, size: 60 };
    
    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy', 'boss', data.type);
    enemyDiv.innerText = "BOSS"; // 식별용 텍스트
    
    road.appendChild(enemyDiv);
    
    // 중앙 상단에서 등장
    enemyDiv.style.left = '50%';
    enemyDiv.style.top = '0px';

    const boss = {
        element: enemyDiv,
        initialX: 50,
        x: 50,
        y: 0,
        baseSpeed: data.speed,
        speed: data.speed,
        maxHp: data.hp,
        hp: data.hp,
        isBoss: true,
        data: data,
        lastAbilityTime: Date.now()
    };
    enemies.push(boss);
    bossInstance = boss;

    // [보스 능력] 카론: 망령의 승선 (유령 5마리 탑승)
    if (data.type === 'charon') {
        for(let i=0; i<5; i++) spawnPassenger(boss);
    }

    // [보스 능력] 루시퍼: 등장 연출 및 절대영도
    if (data.type === 'lucifer') {
        frozenOverlay.style.opacity = 1; // 화면 얼어붙음
        
        // 절대영도: 3초 후 발동
        setTimeout(() => {
            if (boss.hp > 0) {
                const activeTowers = towers.filter(t => !t.isFrozenTomb);
                if (activeTowers.length > 0) {
                    // 가장 먼저 배치된 유닛(배열 앞쪽)을 '등급 높은 유닛'으로 간주하여 동결
                    const target = activeTowers[0]; 
                    target.isFrozenTomb = true;
                    target.element.classList.add('frozen-tomb');
                    alert("🥶 루시퍼의 [절대영도]! 퇴마사 하나가 영구적으로 얼어붙었습니다!");
                }
            }
        }, 3000);
    }
}

// 적 생성 함수
function spawnEnemy() {
    const road = document.getElementById('road');
    currentStageSpawned++;
    updateStageInfo();

    // 스테이지별 확률 설정
    let probs = { basic: 0.96, pattern: 0.01, enhanced: 0.01, armoured: 0.01, treasure: treasureChance };
    
    if (stage >= 51) {
        probs = { basic: 0.30, pattern: 0.23, enhanced: 0.23, armoured: 0.23, treasure: treasureChance };
    } else if (stage >= 31) {
        probs = { basic: 0.55, pattern: 0.14, enhanced: 0.15, armoured: 0.15, treasure: treasureChance };
    } else if (stage >= 16) {
        probs = { basic: 0.75, pattern: 0.08, enhanced: 0.08, armoured: 0.08, treasure: treasureChance };
    } else if (stage >= 6) {
        probs = { basic: 0.90, pattern: 0.03, enhanced: 0.03, armoured: 0.03, treasure: treasureChance };
    }

    // 보물 확률 증가분만큼 기본 확률에서 차감하여 합계 유지 (선택 사항이지만 균형을 위해)
    probs.basic -= (treasureChance - 0.01);

    // 확률에 따라 카테고리 결정
    const randCat = Math.random();
    let accumulatedProbability = 0;
    let category = 'basic';

    for (const [key, value] of Object.entries(probs)) {
        accumulatedProbability += value;
        if (randCat < accumulatedProbability) {
            category = key;
            break;
        }
    }

    const enemyTypes = enemyCategories[category];

    // 확률에 따라 적 타입 결정
    const rand = Math.random();
    let selectedType = enemyTypes[0];

    for (const enemyType of enemyTypes) {
        accumulatedProbability += enemyType.probability;
        if (rand < accumulatedProbability) {
            selectedType = enemyType;
            break;
        }
    }

    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy');
    enemyDiv.classList.add(selectedType.type);
    
    // 중앙 길(road)에 적 추가
    road.appendChild(enemyDiv);
    
    // 초기 위치 설정 (길 위쪽 랜덤 위치 10% ~ 90%)
    const randomX = Math.random() * 80 + 10;
    enemyDiv.style.left = `${randomX}%`;
    enemyDiv.style.top = '0px';

    const enemy = {
        element: enemyDiv,
        initialX: randomX,
        x: randomX,
        y: 0, // Y축 위치
        baseSpeed: selectedType.speed, // 기본 속도 저장
        speed: selectedType.speed,
        maxHp: selectedType.hp, // 최대 체력 저장
        defense: selectedType.defense || 0, // 방어력
        hp: selectedType.hp,
        reward: selectedType.reward || 10, // 처치 보상 (기본 10)
        type: selectedType.type, // 적 타입 저장
        isPhasing: false, // 차원 이동자용: 투명 상태 여부
        isSilenced: false, // 대봉인사용: 특수 능력 봉인 여부
        isFrozen: false, // 상태이상용
        isSlowed: false, // 영혼 사슬꾼용: 이동 속도 감소 여부
        hasBackstepped: false // 기만하는 유혹자용: 회피 사용 여부
    };
    enemies.push(enemy);
}

// 카론의 승객 유령 생성
function spawnPassenger(boss) {
    const road = document.getElementById('road');
    const enemyDiv = document.createElement('div');
    enemyDiv.classList.add('enemy', 'normal', 'boarded');
    road.appendChild(enemyDiv);
    
    // 배 안에서의 상대 위치 (랜덤)
    const offsetX = (Math.random() - 0.5) * 30; 
    const offsetY = (Math.random() - 0.5) * 40;

    const enemy = {
        element: enemyDiv,
        initialX: boss.x,
        x: boss.x,
        y: boss.y,
        baseSpeed: 1.5,
        speed: 1.5,
        hp: 100,
        type: 'normal',
        isBoarded: true,     // 탑승 상태
        parentBoss: boss,    // 카론 참조
        offsetX: offsetX,
        offsetY: offsetY,
        invincible: true     // 무적
    };
    enemies.push(enemy);
}

// 적 처치 처리 함수
function handleEnemyDeath(target, killer = null) {
    if (target.hp > 0) return;

    // [마스터] 지옥불 연금술사: 사망 시 폭발 및 전염
    if (target.isHellfireBurn) {
        // 시각 효과
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

        // 주변 적에게 데미지 및 화상 전염
        const gameW = gameContainer.offsetWidth;
        const tX = (target.x / 100) * gameW;
        const tY = target.y;

        enemies.forEach(e => {
            if (e === target || e.hp <= 0) return;
            const eX = (e.x / 100) * gameW;
            const dist = Math.sqrt(Math.pow(eX - tX, 2) + Math.pow(e.y - tY, 2));
            if (dist < 80) { // 폭발 범위
                applyDamage(e, 30, null); // 폭발 데미지
                e.isBurning = true;
                e.burnEndTime = Date.now() + 3000;
                e.isHellfireBurn = true; // 화상 전염 (연쇄 폭발 가능)
                if(e.element) e.element.classList.add('burning');
            }
        });
    }

    // [마스터] 망령 군주: 적 처치 시 해골 병사 소환
    if (killer && killer.data.type === 'wraithlord') {
        const road = document.getElementById('road');
        const skeletonDiv = document.createElement('div');
        skeletonDiv.classList.add('friendly-skeleton');
        road.appendChild(skeletonDiv);
        
        // 적이 죽은 위치에서 생성
        skeletonDiv.style.left = target.element.style.left;
        skeletonDiv.style.top = target.element.style.top;

        friendlySkeletons.push({
            element: skeletonDiv,
            x: target.x, // %
            y: target.y, // px
            speed: 2.0 // 위로 이동 속도
        });
    }

    const idx = enemies.indexOf(target);
    if (idx > -1) {
        target.element.remove();
        enemies.splice(idx, 1);
        
        // 보스 처치 보상
        if (target.isBoss) {
            if (target.data.type === 'cerberus') {
                damageMultiplier += target.data.rewardEffect;
                alert(`🎉 보스 처치! [${target.data.rewardName}] 획득!\n⚔️ 아군 공격력 10% 증가! (현재 배율: ${damageMultiplier.toFixed(1)}x)`);
            } else if (target.data.type === 'charon') {
                globalSpeedFactor -= target.data.rewardEffect;
                alert(`🎉 보스 처치! [${target.data.rewardName}] 획득!\n🐢 적 이동 속도 15% 감소! (현재 배율: ${globalSpeedFactor.toFixed(2)}x)`);
            } else if (target.data.type === 'beelzebub') {
                treasureChance += target.data.rewardEffect;
                alert(`🎉 보스 처치! [${target.data.rewardName}] 획득!\n💰 보물 유령 등장 확률 증가! (현재: ${(treasureChance * 100).toFixed(0)}%)`);
            } else if (target.data.type === 'lucifer') {
                critChance += target.data.rewardEffect;
                const frozenOverlay = document.getElementById('frozen-overlay');
                if(frozenOverlay) frozenOverlay.style.opacity = 0; // 연출 해제
                // 동결된 유닛 해제
                towers.forEach(t => {
                    if (t.isFrozenTomb) {
                        t.isFrozenTomb = false;
                        t.element.classList.remove('frozen-tomb');
                    }
                });
                alert(`🎉 보스 처치! [${target.data.rewardName}] 획득!\n⚡ 아군 치명타 확률 10% 증가! (현재: ${(critChance * 100).toFixed(0)}%)`);
            }
            
            bossInstance = null;
        }

        // 보상 획득
        money += target.reward;
        const seDisplay = document.getElementById('se-display');
        if(seDisplay) seDisplay.innerText = money;
        updateSummonButtonState();
    }
}
