/* allies.js - Entry Point & Persistence */

// Track unlocked classes for Records - Global for Collections access
window.unlockedUnits = new Set(['apprentice']);

function saveGameData() {
    const data = {
        unlockedUnits: Array.from(window.unlockedUnits),
        encounteredEnemies: Array.from(window.encounteredEnemies || []),
        killCounts: window.killCounts || {}
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
        // ... (rest of enemy unlock logic same)
        if (!window.encounteredEnemies) window.encounteredEnemies = new Set();
        if (window.encounteredEnemies.has(type)) return;
        window.encounteredEnemies.add(type);
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
            const header = document.getElementById('unlock-header');
            const icon = document.getElementById('unlock-icon');
            const name = document.getElementById('unlock-name');
            const desc = document.getElementById('unlock-desc');
            
            const enemyNames = {
                'normal': 'Whispering Soul', 'mist': 'Wandering Mist', 'memory': 'Faded Memory',
                'shade': 'Flickering Shade', 'tank': 'Ironclad Wraith', 'runner': 'Haste-Cursed Shadow',
                'greedy': 'Gluttonous Poltergeist', 'mimic': 'Mimic Soul', 'dimension': 'Void-Step Phantasm',
                'deceiver': 'Siren of Despair', 'boar': 'Feral Revenant', 'soul_eater': 'Soul Eater',
                'frost': 'Cocytus Drifter', 'lightspeed': 'Ethereal Streak', 'heavy': 'Grave-Bound Behemoth',
                'lava': 'Magma-Veined Terror', 'burning': 'Eternal Zealot', 'gold': 'Gilded Apparition',
                'defiled_apprentice': 'Defiled Apprentice', 'abyssal_acolyte': 'Abyssal Acolyte', 'bringer_of_doom': 'Bringer of Doom',
                'cursed_vajra': 'Cursed Vajra', 'void_piercer': 'Void-Piercing Shade', 'frost_outcast': 'Frost-Bitten Outcast',
                'ember_hatred': 'Embers of Hatred', 'betrayer_blade': "Betrayer's Blade"
            };

            if (modal && header && icon && name && desc) {
                header.innerText = `${enemyData.icon} NEW SPECTER ENCOUNTERED!`;
                header.style.color = "#ff4500";
                icon.innerText = enemyData.icon;
                const hpVal = Math.floor(enemyData.hp || 110);
                const fullName = enemyData.name || enemyNames[enemyData.type] || enemyData.type;
                name.innerHTML = `${fullName}<br><span style="font-size:30px; color:#aaa;">(HP: ${hpVal})</span>`;
                desc.innerText = enemyData.desc || enemyData.lore;
                modal.style.display = 'flex';
                isPaused = true;
            }
        }
        return;
    }

    if (!window.unlockedUnits.has(type)) {
        window.unlockedUnits.add(type);
        saveGameData();

        if (!isTutorialEnabled) return;

        const data = unitTypes.find(u => u.type === type);
        if (data && type !== 'apprentice') {
            const modal = document.getElementById('unlock-modal');
            const header = document.getElementById('unlock-header');
            const icon = document.getElementById('unlock-icon');
            const name = document.getElementById('unlock-name');
            const desc = document.getElementById('unlock-desc');
            
            if (modal && header && icon && name && desc) {
                header.innerText = "🆕 NEW CLASS UNLOCKED!";
                header.style.color = "#ffd700";
                icon.innerText = data.icon;
                name.innerText = data.name;
                desc.innerText = data.desc;
                modal.style.display = 'flex';
                isPaused = true;
            }
        }
    }
}
