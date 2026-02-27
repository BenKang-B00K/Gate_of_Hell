/**
 * data_manager.js - 전역 상태 및 UI 동기화 매니저
 */
export class DataManager {
    constructor(scene) {
        this.scene = scene;
        this.registry = scene.registry;
        this.SAVE_KEY = 'gateOfHell_saveData';
        this.init();
    }

    init() {
        // 1. 초기값 설정 (저장된 데이터가 없으면 기본값)
        const savedRaw = localStorage.getItem(this.SAVE_KEY);
        let saved = {};
        if (savedRaw) {
            try {
                saved = JSON.parse(savedRaw);
            } catch (e) {
                console.error("Failed to parse save data", e);
            }
        }

        const defaults = {
            money: 150,
            stage: 1,
            portalEnergy: 0,
            maxPortalEnergy: 1500,
            enemiesLeft: 0,
            unlockedUnits: ['apprentice'],
            encounteredEnemies: [],
            globalSpeedMult: 1.0,
            isTimeFrozen: false,
            critChance: 0.1
        };

        Object.entries(defaults).forEach(([key, val]) => {
            const finalVal = saved[key] !== undefined ? saved[key] : val;
            this.registry.set(key, finalVal);
        });

        // 2. 통합 리스너: Registry 값이 변하면 UI와 LocalStorage를 동시 업데이트
        this.setupListeners();
        
        // 3. 초기 UI 반영을 위해 강제 이벤트 발생
        this.updateAllUI();
    }

    setupListeners() {
        this.registry.events.on('changedata', (parent, key, value) => {
            this.updateUI(key, value);

            // 자동 저장 (일부 세션 변수 제외)
            const preventSave = ['enemiesLeft', 'isTimeFrozen', 'portalEnergy', 'globalSpeedMult'];
            if (!preventSave.includes(key)) {
                this.save();
            }
        });
    }

    updateUI(key, value) {
        if (key === 'money') {
            const el = document.getElementById('se-display-text');
            const fill = document.getElementById('se-gauge-fill');
            if (el) el.innerText = Math.floor(value);
            if (fill) fill.style.width = `${Math.min(value / 10, 100)}%`;
        } else if (key === 'portalEnergy') {
            const max = this.registry.get('maxPortalEnergy');
            const el = document.getElementById('portal-energy-label');
            const fill = document.getElementById('portal-gauge-fill');
            if (el) el.innerText = `${Math.floor(value)} / ${max}`;
            if (fill) fill.style.width = `${(value / max) * 100}%`;
        } else if (key === 'stage') {
            const el = document.getElementById('stage-display');
            if (el) el.innerText = value;
        } else if (key === 'enemiesLeft') {
            const el = document.getElementById('enemies-left');
            if (el) el.innerText = value;
        }
    }

    updateAllUI() {
        ['money', 'portalEnergy', 'stage', 'enemiesLeft'].forEach(key => {
            this.updateUI(key, this.registry.get(key));
        });
    }

    save() {
        const dataToSave = {
            money: this.registry.get('money'),
            stage: this.registry.get('stage'),
            unlockedUnits: this.registry.get('unlockedUnits'),
            encounteredEnemies: this.registry.get('encounteredEnemies')
        };
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(dataToSave));
    }

    unlockUnit(unitType) {
        const unlocked = this.registry.get('unlockedUnits') || [];
        if (!unlocked.includes(unitType)) {
            const newList = [...unlocked, unitType];
            this.registry.set('unlockedUnits', newList);
        }
    }

    recordEncounter(enemyType) {
        const encountered = this.registry.get('encounteredEnemies') || [];
        if (!encountered.includes(enemyType)) {
            const newList = [...encountered, enemyType];
            this.registry.set('encounteredEnemies', newList);
        }
    }
}
