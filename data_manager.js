/**
 * data_manager.js - Phaser Registry 기반 자동 저장 시스템
 */
export class DataManager {
    constructor(scene) {
        this.scene = scene;
        this.registry = scene.registry;
        this.SAVE_KEY = 'gateOfHell_saveData';

        // 저장할 데이터 키 목록
        this.trackedKeys = ['money', 'stage', 'unlockedUnits', 'encounteredEnemies'];
        
        this.init();
    }

    init() {
        // 1. 초기 데이터 로드 및 Registry 세팅
        this.load();

        // 2. Registry 변경 감지 리스너 등록 (자동 저장)
        this.setupAutoSave();
    }

    /**
     * LocalStorage에서 데이터를 불러와 Registry에 주입
     */
    load() {
        const savedData = localStorage.getItem(this.SAVE_KEY);
        let data = {
            money: 150,
            stage: 1,
            unlockedUnits: ['apprentice'],
            encounteredEnemies: []
        };

        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                data = { ...data, ...parsed };
                console.log('💾 Game Data Loaded:', data);
            } catch (e) {
                console.error('Failed to parse save data', e);
            }
        }

        // Registry에 값 세팅 (MainScene에서 이 값을 참조함)
        Object.entries(data).forEach(([key, value]) => {
            this.registry.set(key, value);
        });
    }

    /**
     * Registry의 값이 변경될 때마다 save() 호출
     */
    setupAutoSave() {
        this.trackedKeys.forEach(key => {
            this.registry.events.on(`changedata-${key}`, () => {
                this.save();
            });
        });
    }

    /**
     * 현재 Registry 상태를 LocalStorage에 영구 저장
     */
    save() {
        const saveData = {};
        this.trackedKeys.forEach(key => {
            saveData[key] = this.registry.get(key);
        });

        localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
    }

    /**
     * 새로운 유닛 잠금 해제 시 호출 (Helper Method)
     */
    unlockUnit(unitType) {
        const unlocked = this.registry.get('unlockedUnits') || [];
        if (!unlocked.includes(unitType)) {
            const newList = [...unlocked, unitType];
            this.registry.set('unlockedUnits', newList);
        }
    }

    /**
     * 조우한 적 기록
     */
    recordEncounter(enemyType) {
        const encountered = this.registry.get('encounteredEnemies') || [];
        if (!encountered.includes(enemyType)) {
            const newList = [...encountered, enemyType];
            this.registry.set('encounteredEnemies', newList);
        }
    }
}
