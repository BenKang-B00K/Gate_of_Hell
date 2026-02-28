/* enemies_data.js - Enemy Definitions and Tier Stats */

const enemyPool = {
    normal: [
        { type: 'wraith', icon: '👻', speed: 1.8, hp: 80, defense: 0, probability: 0.4, reward: 5, desc: "평범한 망령입니다. 특별한 능력은 없지만 무리지어 나타납니다.", effectiveness: "모든 종류의 퇴마술.", lore: "이름 없는 무덤에서 깨어난 영혼들로, 생전의 기억을 모두 잃고 본능만 남았습니다." },
        { type: 'ghoul', icon: '🧟', speed: 1.2, hp: 150, defense: 5, probability: 0.3, reward: 8, desc: "느리지만 튼튼한 괴물입니다. 방어력이 소폭 존재합니다.", effectiveness: "철퇴 승려 또는 성소 수호자.", lore: "심연의 흙을 먹고 자란 변종으로, 그들의 가죽은 인간의 무기보다 훨씬 질깁니다." },
        { type: 'specter', icon: '💀', speed: 2.4, hp: 60, defense: 0, probability: 0.2, reward: 10, desc: "빠르고 변칙적인 이동을 하는 원령입니다.", effectiveness: "공격 속도가 빠른 퇴마사.", lore: "갑작스러운 죽음을 맞이한 자들의 잔상으로, 그들의 속도는 생에 대한 집착에서 나옵니다." }
    ],
    enhanced: [
        { type: 'boar', icon: '🐗', speed: 1.2, hp: 250, defense: 8, probability: 0.25, reward: 15, desc: "포탈에 가까워질수록 속도가 기하급수적으로 빨라집니다.", effectiveness: "게이트 근처에서의 밀쳐내기와 강력한 기절.", lore: "추격의 전율을 즐기던 폭력적인 사냥꾼으로, 이제 통제할 수 없는 피의 갈증에 사로잡혔습니다." }, 
        { type: 'lightspeed', icon: '✨', speed: 8.0, hp: 60, defense: 0, probability: 0.2, reward: 18, desc: "엄청난 속도로 이동하며 속도 강화 오라를 무시합니다.", effectiveness: "즉사 수호자 또는 공허 저격수.", lore: "생명을 구할 말을 전하지 못한 전령으로, 이제 끝에 도달하기 위해 필사적입니다." }
    ],
    armoured: [
        { type: 'heavy', icon: '⛓️', speed: 1.2, hp: 600, defense: 20, probability: 0.3, knockbackResist: 0.8, reward: 20, desc: "높은 방어력과 밀쳐내기 저항을 가진 거대한 괴수입니다.", effectiveness: "영혼 연결 공유 피해 또는 높은 관통 공격.", lore: "자신의 잔혹함을 자랑스러워하던 집행자로, 이제 자신이 사용하던 사슬에 묶여있습니다." }, 
        { type: 'bringer_of_doom', icon: '⛓️‍💥', speed: 0.9, hp: 2200, defense: 20, probability: 0.1, reward: 150, desc: "[희귀 괴수] 무작위 2개 슬롯의 데미지를 영구적으로 감소시킵니다.", effectiveness: "가능한 한 빨리 처치하세요!", lore: "그들이 걷는 곳마다 대지가 비명을 지릅니다. 어떤 신성함도 남지 않습니다." }
    ]
};

// Add other enemy pool items...
// (실제 파일에는 모든 데이터가 포함될 것입니다.)
window.enemyPool = enemyPool;
