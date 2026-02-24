/* e:\WebGame\Gate of Hell\allies.js */

// 아군 관련 전역 변수
const towers = []; // 타워 목록
const slots = []; // 슬롯 요소 저장
let draggedUnit = null; // 현재 드래그 중인 유닛

const towerCost = 50;
const jobChangeCost = 100; // 전직 비용
const masterJobCost = 200; // 마스터 전직 비용
const maxTowers = 12; // 최대 소환 수

// 아군 유닛 데이터
const unitTypes = [
    { type: 'apprentice', name: '견습 퇴마사', tier: 1, damage: 35, range: 120, cooldown: 1000, desc: "기본적인 퇴마 능력을 가진 견습생입니다." },
    { type: 'chainer', name: '영혼 사슬꾼', tier: 2, damage: 15, range: 130, cooldown: 1000, desc: "적을 느리게 만드는 영혼의 사슬을 사용합니다.", upgrades: ['executor', 'binder'] },
    { type: 'talisman', name: '부적 술사', tier: 2, damage: 25, range: 120, cooldown: 1500, desc: "폭발하는 부적을 던져 범위 피해를 입힙니다.", upgrades: ['grandsealer', 'flamemaster'] },
    { type: 'monk', name: '철퇴 승려', tier: 2, damage: 40, range: 100, cooldown: 1200, desc: "강력한 철퇴로 적을 뒤로 밀쳐냅니다.", upgrades: ['vajra', 'saint'] },
    { type: 'archer', name: '신궁 퇴마사', tier: 2, damage: 80, range: 250, cooldown: 1500, desc: "가장 긴 사거리를 가지며 단일 대상을 저격합니다.", upgrades: ['voidsniper', 'thousandhand'] },
    { type: 'ice', name: '빙결 도사', tier: 2, damage: 20, range: 130, cooldown: 1000, desc: "냉기로 유령의 이동 속도를 늦춥니다. (이속 10% 감소)", upgrades: ['absolutezero', 'permafrost'] },
    { type: 'fire', name: '화염 마법사', tier: 2, damage: 10, range: 120, cooldown: 1000, desc: "유령을 불태워 체력 비율 초당 데미지를 줍니다.", upgrades: ['hellfire', 'phoenix'] },
    { type: 'assassin', name: '그림자 자객', tier: 2, damage: 20, range: 100, cooldown: 300, desc: "매우 빠른 공격 속도로 적의 방어력을 무시하고 공격합니다.", upgrades: ['abyssal', 'spatial'] },
    { type: 'tracker', name: '영적 탐지기', tier: 2, damage: 10, range: 100, cooldown: 1000, desc: "주변 아군(상하좌우)의 사거리를 증가시킵니다.", upgrades: ['seer', 'commander'] },
    { type: 'necromancer', name: '강령술사', tier: 2, damage: 30, range: 120, cooldown: 1200, desc: "일정 확률로 유령의 길을 막는 영혼의 벽을 소환합니다.", upgrades: ['wraithlord', 'cursedshaman'] },
    { type: 'guardian', name: '성역 수호자', tier: 2, damage: 50, range: 120, cooldown: 1500, desc: "타격 시 일정 확률로 적을 즉사시킵니다.", upgrades: ['rampart', 'judgment'] },
    // 마스터 클래스
    { type: 'executor', name: '명계의 집행관', tier: 3, damage: 40, range: 150, cooldown: 1000, desc: "[마스터] 10% 확률로 문 앞의 적을 시작 지점으로 되돌립니다." },
    { type: 'binder', name: '영혼 구속자', tier: 3, damage: 30, range: 140, cooldown: 1000, desc: "[마스터] 적 5명을 연결하여 데미지의 50%를 공유시킵니다." },
    { type: 'grandsealer', name: '대봉인사', tier: 3, damage: 30, range: 130, cooldown: 1500, desc: "[마스터] 거대한 부적을 붙여 적의 특수 능력(은신, 텔레포트 등)을 무력화합니다." },
    { type: 'flamemaster', name: '화염 부적 명장', tier: 3, damage: 35, range: 130, cooldown: 1500, desc: "[마스터] 부적이 터진 자리에 지속적인 불길을 남겨 피해를 줍니다." },
    { type: 'vajra', name: '금강역사', tier: 3, damage: 50, range: 100, cooldown: 1200, desc: "[마스터] 치명타 시 적을 화면 밖으로 날려버립니다. (보스는 넉백)" },
    { type: 'saint', name: '진동의 성자', tier: 3, damage: 45, range: 100, cooldown: 1500, desc: "[마스터] 공격 시 넓은 범위의 적을 기절시킵니다." },
    { type: 'voidsniper', name: '허공의 저격수', tier: 3, damage: 120, range: 9999, cooldown: 2000, desc: "[마스터] 거리에 상관없이 문에 가장 가까운 적을 우선 저격합니다." },
    { type: 'thousandhand', name: '천수 궁수', tier: 3, damage: 40, range: 250, cooldown: 1500, desc: "[마스터] 한 번에 6발의 화살을 발사하여 최대 4명의 적을 공격합니다." },
    { type: 'absolutezero', name: '절대영도 마법사', tier: 3, damage: 30, range: 140, cooldown: 1000, desc: "[마스터] 얼어붙은 적의 체력이 30% 이하일 경우 즉사시킵니다." },
    { type: 'permafrost', name: '만년설의 신녀', tier: 3, damage: 25, range: 140, cooldown: 1000, desc: "[마스터] 눈보라를 일으켜 영역 내 적의 속도를 50% 감소시킵니다." },
    { type: 'hellfire', name: '지옥불 연금술사', tier: 3, damage: 20, range: 130, cooldown: 1000, desc: "[마스터] 화상 상태의 적이 죽으면 폭발하여 주변에 화상을 전염시킵니다." },
    { type: 'phoenix', name: '불사조 소환사', tier: 3, damage: 40, range: 180, cooldown: 2000, desc: "[마스터] 불사조를 날려 지나간 자리에 불길을 만듭니다." },
    { type: 'abyssal', name: '심연의 살귀', tier: 3, damage: 30, range: 100, cooldown: 300, desc: "[마스터] 처치 시 획득하는 영혼 에너지가 1.5배 증가합니다." },
    { type: 'spatial', name: '공간 참격자', tier: 3, damage: 25, range: 120, cooldown: 300, desc: "[마스터] 공격 시 빈 공간에 분신을 소환하여 가장 위협적인 적을 암살합니다." },
    { type: 'seer', name: '진실의 구도자', tier: 3, damage: 15, range: 120, cooldown: 1000, desc: "[마스터] 주변 아군의 공격력을 증가시키고 범위 내 은신한 적을 감지합니다." },
    { type: 'commander', name: '전장의 지휘관', tier: 3, damage: 15, range: 120, cooldown: 1000, desc: "[마스터] 주변 아군의 공격 속도를 20% 증가시킵니다." },
    { type: 'wraithlord', name: '망령 군주', tier: 3, damage: 40, range: 130, cooldown: 1200, desc: "[마스터] 처치한 적을 아군 해골 병사로 부활시켜 적에게 돌진시킵니다." },
    { type: 'cursedshaman', name: '저주받은 주술사', tier: 3, damage: 20, range: 130, cooldown: 1500, desc: "[마스터] 광역 저주를 걸어 적의 최대 체력을 영구적으로 감소시킵니다." },
    { type: 'rampart', name: '신성한 성벽', tier: 3, damage: 40, range: 120, cooldown: 1500, desc: "[마스터] 문 앞 슬롯 배치 시, 문에 도달한 적을 최대 5회 시작 지점으로 돌려보냅니다." },
    { type: 'judgment', name: '심판의 기사', tier: 3, damage: 60, range: 130, cooldown: 1500, desc: "[마스터] 공격 시 15% 확률로 모든 적에게 신성 데미지를 입힙니다." }
];

// 슬롯 생성 함수
function createSlots(containerId, count) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // 기존 슬롯 초기화 (중복 방지)
    for (let i = 0; i < count; i++) {
    const cell = document.createElement('div');
        cell.classList.add('card-slot');
        slots.push(cell);
        container.appendChild(cell);

        // 드래그 앤 드롭 이벤트 추가
        cell.addEventListener('dragover', allowDrop);
        cell.addEventListener('drop', drop);
        cell.addEventListener('dragenter', dragEnter);
        cell.addEventListener('dragleave', dragLeave);
    }
}

function allowDrop(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    this.style.backgroundColor = 'rgba(0, 255, 255, 0.3)';
}

function dragLeave(e) {
    this.style.backgroundColor = '';
}

function drop(e) {
    e.preventDefault();
    this.style.backgroundColor = '';

    const type = e.dataTransfer.getData("type");
    
    // 유닛 이동 처리
    if (type === "move-unit" && draggedUnit) {
        const oldSlot = draggedUnit.parentElement;
        const targetSlot = this;
        
        if (oldSlot === targetSlot) {
            draggedUnit = null;
            return;
        }
        
        if (targetSlot.classList.contains('occupied')) {
            // 유닛 교체 (Swap)
            const targetUnit = targetSlot.querySelector('.unit');
            if (targetUnit) {
                oldSlot.appendChild(targetUnit);
                targetSlot.appendChild(draggedUnit);
                
                const draggedTower = towers.find(t => t.element === draggedUnit);
                const targetTower = towers.find(t => t.element === targetUnit);
                
                if (draggedTower) draggedTower.slotElement = targetSlot;
                if (targetTower) targetTower.slotElement = oldSlot;
            }
        } else {
            // 빈 슬롯으로 이동
            targetSlot.appendChild(draggedUnit);
            
            // 상태 업데이트
            oldSlot.classList.remove('occupied');
            targetSlot.classList.add('occupied');
            
            // 타워 데이터 업데이트
            const tower = towers.find(t => t.element === draggedUnit);
            if (tower) {
                tower.slotElement = targetSlot;
            }
        }
        
        draggedUnit = null;
    }
}

function summonTower(targetSlot) {
    const seDisplay = document.getElementById('se-display');
    // 자원 소모
    money -= towerCost;
    seDisplay.innerText = money;

    // 소환은 무조건 견습 퇴마사
    const selectedUnit = unitTypes[0];

    // 유닛(퇴마사) 시각적 요소 생성
    const unit = document.createElement('div');
    unit.classList.add('unit', selectedUnit.type);
    unit.title = selectedUnit.name; // 마우스 오버 시 이름 표시
    unit.draggable = true; // 드래그 가능 설정

    // 유닛 드래그 시작 이벤트
    unit.addEventListener('dragstart', function(e) {
        draggedUnit = this;
        e.dataTransfer.setData("type", "move-unit");
        e.dataTransfer.effectAllowed = "move";
    });

    // 유닛 클릭 이벤트 (전직 메뉴)
    unit.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // 정보 표시
        const tower = towers.find(t => t.element === this);
        if (tower) showUnitInfo(tower);
    });
    
    targetSlot.appendChild(unit);
    targetSlot.classList.add('occupied');

    // 타워 데이터 저장
    towers.push({
        data: selectedUnit, // 유닛 스탯 정보
        element: unit,
        // 위치는 매 프레임 계산하거나, 고정된 경우 여기서 계산 (반응형 고려하여 getBoundingClientRect 사용 권장)
        slotElement: targetSlot, 
        range: selectedUnit.range,
        cooldown: selectedUnit.cooldown,
        lastShot: 0,
        spentSE: towerCost // 소모된 SE 추적
    });
    updateSummonButtonState();
}

// 유닛 정보 표시 함수
function showUnitInfo(tower) {
    const unitInfoDisplay = document.getElementById('unit-info');
    const data = tower.data;
    let titleHtml = `<span style="color: #ffd700; font-weight: bold;">${data.name}</span>`;

    // 견습 퇴마사일 경우 전직 버튼 추가
    if (data.type === 'apprentice') {
        const canAfford = money >= jobChangeCost;
        const btnClass = canAfford ? 'active' : 'locked';
        const btnText = canAfford ? `전직 (${jobChangeCost})` : `🔒 SE 부족 (${jobChangeCost})`;
        
        titleHtml += `<span id="info-job-btn" class="job-btn active" style="background: linear-gradient(to bottom, #4CAF50, #2E7D32);">${btnText}</span>`;
    } else if (data.upgrades) {
        // 마스터 클래스 전직 버튼 (좌/우)
        const canAfford = money >= masterJobCost;
        const btnClass = canAfford ? 'active' : 'locked';
        
        let upgradeBtns = `<div class="master-btn-container">`;
        data.upgrades.forEach((uType, idx) => {
            const uData = unitTypes.find(u => u.type === uType);
            const btnId = `master-btn-${idx}`;
            upgradeBtns += `<div id="${btnId}" class="job-btn ${btnClass}" style="flex:1; margin:0 2px;" data-type="${uType}">
                ${uData.name}<br>(${masterJobCost})
            </div>`;
        });
        upgradeBtns += `</div>`;
        
        // 설명 아래에 버튼 추가
        setTimeout(() => { // DOM 렌더링 후 추가
            const container = document.createElement('div');
            container.innerHTML = upgradeBtns;
            unitInfoDisplay.appendChild(container);

            // 이벤트 연결
            data.upgrades.forEach((uType, idx) => {
                const btn = document.getElementById(`master-btn-${idx}`);
                if (btn) {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        if (money >= masterJobCost) {
                            performMasterJobChange(tower, uType);
                            showUnitInfo(tower);
                        } else {
                            alert("영혼 에너지가 부족합니다!");
                        }
                    });
                }
            });
        }, 0);
    }

    // [타락] (판매) 버튼 추가
    const sellRefund = Math.floor(tower.spentSE * 0.7);
    titleHtml += `<span id="info-sell-btn" class="job-btn active" style="background: linear-gradient(to bottom, #8b0000, #4a0000); margin-left: 5px;">[타락] (+${sellRefund} SE)</span>`;

    unitInfoDisplay.innerHTML = `
        <div style="margin-bottom: 4px;">${titleHtml}</div>
        <div>공격력: ${data.damage} | 사거리: ${data.range} | 쿨타임: ${(data.cooldown/1000).toFixed(1)}s</div>
        <div style="color: #aaa; font-size: 11px; margin-top: 4px;">${data.desc}</div>
    `;

    // 버튼 이벤트 연결
    const jobBtn = document.getElementById('info-job-btn');
    if (jobBtn) {
        jobBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (money >= jobChangeCost) {
                performJobChange(tower.element);
                showUnitInfo(tower); // 정보 갱신 (전직 후 상태 반영)
            }
        });
    }

    const sellBtn = document.getElementById('info-sell-btn');
    if (sellBtn) {
        sellBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sellTower(tower);
            unitInfoDisplay.innerHTML = "유닛을 선택하여 정보를 확인하세요.";
        });
    }
}

// 타워 판매 (타락)
function sellTower(tower) {
    const sellRefund = Math.floor(tower.spentSE * 0.7);
    money += sellRefund;
    document.getElementById('se-display').innerText = money;
    updateSummonButtonState();

    const slot = tower.slotElement;
    const unitElement = tower.element;

    // 슬롯 해제
    slot.classList.remove('occupied');
    unitElement.remove();

    // 타워 배열에서 제거
    const idx = towers.indexOf(tower);
    if (idx > -1) towers.splice(idx, 1);

    // [타락한 유닛] 생성 (적이 됨)
    spawnCorruptedEnemy(tower);
}

// 전직 수행
function performJobChange(unitElement) {
    const seDisplay = document.getElementById('se-display');
    if (money < jobChangeCost) {
        alert("영혼 에너지가 부족합니다!");
        return;
    }
    
    money -= jobChangeCost;
    seDisplay.innerText = money;
    updateSummonButtonState();
    
    // 랜덤 전직 (Tier 2 클래스 중 랜덤)
    const advancedUnits = unitTypes.filter(u => u.tier === 2);
    const newType = advancedUnits[Math.floor(Math.random() * advancedUnits.length)];
    
    // 유닛 업데이트
    unitElement.classList.remove('apprentice');
    unitElement.classList.add(newType.type);
    unitElement.title = newType.name;
    
    // 타워 데이터 업데이트
    const tower = towers.find(t => t.element === unitElement);
    if (tower) {
        tower.data = newType;
        tower.range = newType.range;
        tower.cooldown = newType.cooldown;
        tower.spentSE += jobChangeCost; // 소모 SE 추가
    }
}

// 마스터 전직 수행
function performMasterJobChange(tower, newTypeStr) {
    const seDisplay = document.getElementById('se-display');
    money -= masterJobCost;
    seDisplay.innerText = money;
    updateSummonButtonState();

    const newType = unitTypes.find(u => u.type === newTypeStr);
    const unitElement = tower.element;

    // 클래스 교체
    unitElement.className = `unit ${newType.type}`; // 기존 클래스 덮어쓰기
    unitElement.title = newType.name;

    // 데이터 업데이트
    tower.data = newType;
    tower.range = newType.range;
    tower.cooldown = newType.cooldown;
    tower.spentSE += masterJobCost; // 소모 SE 추가

    // [마스터] 신성한 성벽: 방어 횟수 초기화
    if (newType.type === 'rampart') {
        tower.charges = 5;
    }
    
    // 이펙트 (간단히)
    unitElement.style.transform = "scale(1.5)";
    setTimeout(() => unitElement.style.transform = "scale(1)", 300);
}

// 소환 버튼 상태 업데이트
function updateSummonButtonState() {
    const towerCard = document.getElementById('tower-card');
    const costDiv = towerCard.querySelector('div:last-child');
    
    if (towers.length >= maxTowers) {
        towerCard.classList.add('locked');
        costDiv.innerText = "MAX";
    } else if (money < towerCost) {
        towerCard.classList.add('locked');
        costDiv.innerText = "부족";
    } else {
        towerCard.classList.remove('locked');
        costDiv.innerText = "50 SE";
    }
}

// 퇴마 버튼 클릭 이벤트 설정 (초기화 시 호출)
function initAllies() {
    const towerCard = document.getElementById('tower-card');
    // 퇴마 버튼 클릭 (랜덤 소환)
    towerCard.addEventListener('click', function() {
        if (money < towerCost) {
            alert("영혼 에너지가 부족합니다!");
            return;
        }

        // 배치 가능한 슬롯 찾기
        const validSlots = slots.filter(c => !c.classList.contains('occupied'));

        if (validSlots.length === 0) {
            alert("더 이상 배치할 공간이 없습니다!");
            return;
        }

        // 랜덤한 위치 선택 및 소환
        const targetSlot = validSlots[Math.floor(Math.random() * validSlots.length)];
        summonTower(targetSlot);
    });
    
    // 좌우 30개씩 슬롯 생성 (총 60개)
    slots.length = 0; // 슬롯 배열 초기화
    createSlots('left-slots', 30);
    createSlots('right-slots', 30);
}
