/* allies.js - Entry Point & Persistence */

// Track unlocked classes for Records - Global for Collections access
window.unlockedUnits = new Set(['apprentice']);
window.unseenItems = new Set(); // Track which items (relics, equipment, ghosts, units) are new

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
            if (modal && content) {
                content.className = 'unlock-content enemy-theme'; // Evil theme
                content.innerHTML = `
                    <div class="unlock-title evil">ABYSSAL WHISPER</div>
                    <div id="unlock-icon">${enemyData.icon}</div>
                    <div id="unlock-name">${enemyData.name || type}</div>
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
