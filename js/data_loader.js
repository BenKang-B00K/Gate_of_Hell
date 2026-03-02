/* js/data_loader.js - Global Data Loader */

window.unitTypes = [];
window.shrineTypes = [];
window.enemyPool = {};
window.relicsData = {};
window.equipmentTiers = [];
window.equipmentSlots = {};

// Defaults
window.towerCost = 30;
window.shrineCost = 100;
window.shrineCostIncrement = 50;
window.maxTowers = 16;

async function loadGameData() {
    try {
        console.log("⏳ Loading Game Data...");
        const [alliesRes, enemiesRes, relicsRes, equipRes] = await Promise.all([
            fetch('data/allies.json'),
            fetch('data/enemies.json'),
            fetch('data/relics.json'),
            fetch('data/equipment.json')
        ]);
        
        const alliesData = await alliesRes.json();
        const enemiesData = await enemiesRes.json();
        const relicsData = await relicsRes.json();
        const equipData = await equipRes.json();
        
        // Allies Data
        window.unitTypes = alliesData.unitTypes;
        window.shrineTypes = alliesData.shrineTypes;
        if (alliesData.config) {
            for (let key in alliesData.config) {
                window[key] = alliesData.config[key];
            }
        }
        
        // Enemies Data
        window.enemyCategories = enemiesData.enemyCategories;
        window.bossData = enemiesData.bossData;
        window.categoryTitles = enemiesData.categoryTitles;
        window.enemyNames = enemiesData.enemyNames;
        
        // Relics Data
        window.relicsData = relicsData.relicsData;
        
        // Equipment Data
        window.equipmentTiers = equipData.equipmentTiers;
        window.equipmentSlots = equipData.equipmentSlots;
        
        console.log("✅ Game Data Loaded successfully.");
        return true;
    } catch (error) {
        console.error("❌ Error loading game data:", error);
        return false;
    }
}

// Global promise to track loading state
window.gameDataLoaded = loadGameData();
