/* allies.js - Entry Point & Persistence */

// Track unlocked classes for Records - Global for Collections access
window.unlockedUnits = new Set(['apprentice']);
window.encounteredEnemies = new Set();
window.unseenItems = new Set(); 
window.killCounts = {};

function saveGameData() {
    const data = {
        unlockedUnits: Array.from(window.unlockedUnits),
        encounteredEnemies: Array.from(window.encounteredEnemies || []),
        killCounts: window.killCounts || {},
        ownedEquipment: window.ownedEquipment || {},
        unseenItems: Array.from(window.unseenItems)
    };
    localStorage.setItem('gateOfHell_saveData', JSON.stringify(data));
}

function loadGameData() {
    const saved = localStorage.getItem('gateOfHell_saveData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.unlockedUnits) {
                data.unlockedUnits.forEach(u => window.unlockedUnits.add(u));
            }
            // Always ensure apprentice is there
            window.unlockedUnits.add('apprentice');

            if (data.encounteredEnemies) {
                if (!window.encounteredEnemies) window.encounteredEnemies = new Set();
                data.encounteredEnemies.forEach(e => window.encounteredEnemies.add(e));
            }
            if (data.killCounts) {
                window.killCounts = data.killCounts;
            } else {
                window.killCounts = {};
            }
            if (data.ownedEquipment) {
                window.ownedEquipment = data.ownedEquipment;
            }
            if (data.unseenItems) {
                window.unseenItems = new Set(data.unseenItems);
            }
        } catch (e) {
            console.error("Failed to load save data:", e);
        }
    }
}

// Initial load
loadGameData();

function recordUnlock(type, isEnemy = false) {
    const tutorialToggle = document.getElementById('tutorial-toggle');
    const isTutorialEnabled = tutorialToggle ? tutorialToggle.checked : true;
    
    if (isEnemy) {
        if (!window.encounteredEnemies) window.encounteredEnemies = new Set();
        if (window.encounteredEnemies.has(type)) return;
        window.encounteredEnemies.add(type);
        window.unseenItems.add(type); // Mark as unseen

        // Show main notification badge
        const notif = document.getElementById('collections-notif');
        if (notif) notif.style.display = 'flex';

        saveGameData();

        if (!isTutorialEnabled) return;

        let enemyData = null;
        for (const cat in enemyCategories) {
            const found = enemyCategories[cat].find(e => e.type === type);
            if (found) { enemyData = found; break; }
        }
        if (!enemyData) {
            for (const key in bossData) {
                if (bossData[key].type === type) { enemyData = bossData[key]; break; }
            }
        }

        if (enemyData) {
            const modal = document.getElementById('unlock-modal');
            const content = document.getElementById('unlock-content');
            
            const enemyNames = {
                'normal': '속삭이는 영혼', 'mist': '방랑하는 안개', 'memory': '빛바랜 기억',
                'shade': '깜빡이는 그림자', 'tank': '철갑 망령', 'runner': '가속된 그림자',
                'greedy': '탐욕스러운 폴터가이스트', 'mimic': '미믹 영혼', 'dimension': '차원 이동 망령',
                'deceiver': '절망의 세이렌', 'boar': '야생의 복수자', 'soul_eater': '소울 이터',
                'frost': '코키토스 방랑자', 'lightspeed': '필사적인 전령', 'frost_outcast': '얼어붙은 마음', 'ember_hatred': '증오의 불꽃',
                'heavy': '쇠사슬 집행자', 'lava': '불타는 분노', 'burning': '고통의 재생자',
                'abyssal_acolyte': '심연의 추종자', 'bringer_of_doom': '파멸의 인도자', 'gold': '황금의 잔상',
                'cerberus': '케르베로스', 'charon': '카론', 'beelzebub': '바알세불', 'lucifer': '루시퍼',
                'defiled_apprentice': '타락한 수련생', 'betrayer_blade': '그림자 배신자',
                'cursed_vajra': '타락한 승려', 'void_piercer': '배신한 궁수'
            };

            const dispName = enemyData.name || enemyNames[enemyData.type] || type;

            if (modal && content) {
                content.className = 'unlock-content enemy-theme'; // Evil theme
                content.innerHTML = `
                    <div class="unlock-title evil">ABYSSAL WHISPER</div>
                    <div id="unlock-icon">${enemyData.icon}</div>
                    <div id="unlock-name">${dispName}</div>
                    <div id="unlock-desc">${enemyData.desc || enemyData.lore || "심연에서 새로운 기운이 감지되었습니다."}</div>
                    <div class="unlock-hint">(클릭하여 계속)</div>
                `;
                modal.style.display = 'flex';
                isPaused = true;
            }
        }
        return;
    }

    if (!window.unlockedUnits.has(type)) {
        window.unlockedUnits.add(type);
        window.unseenItems.add(type); // Mark as unseen

        // Show main notification badge
        const notif = document.getElementById('collections-notif');
        if (notif) notif.style.display = 'flex';

        saveGameData();

        if (!isTutorialEnabled) return;

        const data = unitTypes.find(u => u.type === type);
        if (data && type !== 'apprentice') {
            const modal = document.getElementById('unlock-modal');
            const content = document.getElementById('unlock-content');
            if (modal && content) {
                content.className = 'unlock-content'; // Holy theme
                content.innerHTML = `
                    <div class="unlock-title holy">DIVINE REVELATION</div>
                    <div id="unlock-icon">${data.icon}</div>
                    <div id="unlock-name">${data.name}</div>
                    <div id="unlock-desc">${data.desc}</div>
                    <div class="unlock-hint">(클릭하여 계속)</div>
                `;
                modal.style.display = 'flex';
                isPaused = true;
            }
        }
    }
}
