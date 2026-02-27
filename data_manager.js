/**
 * data_manager.js - Centralized State and UI Synchronization
 */
export class DataManager {
    constructor(scene) {
        this.scene = scene;
        this.registry = scene.registry;
        this.SAVE_KEY = 'gateOfHell_saveData';
        this.init();
    }

    init() {
        const savedRaw = localStorage.getItem(this.SAVE_KEY);
        let saved = {};
        if (savedRaw) {
            try { saved = JSON.parse(savedRaw); } catch (e) { console.error("Save Load Error", e); }
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

        this.setupListeners();
        this.updateAllUI();
    }

    setupListeners() {
        this.registry.events.on('changedata', (parent, key, value) => {
            this.updateUIElement(key, value);
            
            // Auto-save logic
            const persistentKeys = ['money', 'stage', 'unlockedUnits', 'encounteredEnemies'];
            if (persistentKeys.includes(key)) this.save();
        });
    }

    updateUIElement(key, value) {
        const uiMap = {
            'money': { text: 'se-display-text', fill: 'se-gauge-fill', max: 1000 },
            'portalEnergy': { text: 'portal-energy-label', fill: 'portal-gauge-fill', max: this.registry.get('maxPortalEnergy') },
            'stage': { text: 'stage-display' },
            'enemiesLeft': { text: 'enemies-left', fill: 'rs-gauge-fill', max: this.registry.get('totalEnemiesInStage') || 20 },
            'towerCost': { text: 'summon-cost-display' }
        };

        const config = uiMap[key];
        if (!config) return;

        if (config.text) {
            const el = document.getElementById(config.text);
            if (el) {
                if (key === 'towerCost') el.innerText = `${value} SE`;
                else el.innerText = (key === 'portalEnergy' || key === 'money') ? Math.floor(value) : value;
                
                if (key === 'portalEnergy') el.innerText += ` / ${config.max}`;
            }
        }

        if (config.fill) {
            const fillEl = document.getElementById(config.fill);
            if (fillEl) fillEl.style.width = `${Math.min((value / config.max) * 100, 100)}%`;
        }
    }

    updateAllUI() {
        ['money', 'portalEnergy', 'stage', 'enemiesLeft'].forEach(key => {
            this.updateUIElement(key, this.registry.get(key));
        });
    }

    save() {
        const data = {
            money: this.registry.get('money'),
            stage: this.registry.get('stage'),
            unlockedUnits: this.registry.get('unlockedUnits'),
            encounteredEnemies: this.registry.get('encounteredEnemies')
        };
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
    }

    unlockUnit(type) {
        let list = this.registry.get('unlockedUnits');
        if (!list.includes(type)) {
            list.push(type);
            this.registry.set('unlockedUnits', [...list]);
        }
    }

    recordEncounter(type) {
        let list = this.registry.get('encounteredEnemies');
        if (!list.includes(type)) {
            list.push(type);
            this.registry.set('encounteredEnemies', [...list]);
        }
    }
}
