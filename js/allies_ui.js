/* Optimized for 360x640 Logical Resolution & [타락] Theme */

// Global UI State
let selectedSlotData = null;
let currentFusionType = null;
let corruptBtnElement = null; // Track current corrupt button

// Initialize Core UI Elements
window.addEventListener('load', () => {
    updateGauges();
    
    // External HUD Buttons
    const purgeBtn = document.getElementById('purge-btn');
    if (purgeBtn) purgeBtn.addEventListener('click', attemptPurge);
    
    // Create Corrupt Warning Element if it doesn't exist
    if (!document.getElementById('corrupt-warning')) {
        const warning = document.createElement('div');
        warning.id = 'corrupt-warning';
        document.body.appendChild(warning);
    }
});

function updateGauges() {
    const moneyDisplay = document.getElementById('money-display');
    const peDisplay = document.getElementById('pe-display');
    if (moneyDisplay) moneyDisplay.innerText = money;
    if (peDisplay) peDisplay.innerText = portalEnergy;
}

function updateSummonButtonState() {
    // Previous SumonTower Logic (Retained & Optimized)
    const tc = document.getElementById('tower-card'); 
    const scd = document.getElementById('summon-cost-display');
    const sw = document.getElementById('summon-warning');
    if(!tc) return;

    const reduction = (typeof getRelicBonus === 'function') ? getRelicBonus('summon_cost_reduction') : 0;
    const finalTowerCost = Math.max(5, Math.floor(towerCost - reduction));

    if(scd) scd.innerText = `${finalTowerCost} SE`;

    const isMax = towers.length >= maxTowers;
    const isAffordable = money >= finalTowerCost;

    if (sw) {
        if (isMax) {
            sw.innerText = 'MAX UNITS';
            sw.style.display = 'block';
        } else if (!isAffordable) {
            sw.innerText = 'NOT ENOUGH SE';
            sw.style.display = 'block';
        } else {
            sw.style.display = 'none';
        }
    }

    if(!isAffordable || isMax) {
        tc.classList.add('locked');
        tc.style.opacity = '0.5';
        tc.style.pointerEvents = 'none';
    } else {
        tc.classList.remove('locked');
        tc.style.opacity = '1';
        tc.style.pointerEvents = 'auto';
    }
}

// --- Deep Corruption Evolution UI ---
function updateEvolutionTree(exorcistType) {
    const tree = document.getElementById('fusion-tree');
    if (!tree) return;

    tree.innerHTML = ''; // Clear previous tree
    currentFusionType = null;
    selectedSlotData = null;
    
    // Clear existing corrupt button variant
    if(corruptBtnElement) {
        corruptBtnElement.remove();
        corruptBtnElement = null;
    }

    // Find base unit definition from allies_data.js
    const unit = unitTypes.find(u => u.type === exorcistType);
    if (!unit || !unit.fusions) return;

    // Build standard fusion list
    unit.fusions.forEach(fusion => {
        const slot = document.createElement('div');
        slot.className = 'fusion-slot';
        slot.dataset.result = fusion.result;
        slot.dataset.cost = fusion.cost;

        const resultUnit = unitTypes.find(u => u.type === fusion.result);
        if(!resultUnit) return;

        slot.innerHTML = `
            <span class="result-icon">${resultUnit.icon}</span>
            <span class="result-name">${resultUnit.name}</span>
            <span class="cost">${fusion.cost} SE</span>
        `;

        slot.addEventListener('click', () => {
            // Select logic
            document.querySelectorAll('.fusion-slot').forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
            selectedSlotData = { result: fusion.result, cost: fusion.cost };
            updateCorruptButtonState(); // Sync dynamic button
        });

        tree.appendChild(slot);
    });
    
    // --- Create and Position Dynamic Corrupt Button ---
    // Targeted: Tier 3 negative paths (soul_reaper or abyss_walker)
    const canCorrupt = (exorcistType === 'soul_reaper' || exorcistType === 'abyss_walker');
    if (canCorrupt) {
        currentFusionType = exorcistType;
        const targetResult = (exorcistType === 'soul_reaper') ? 'reaper' : 'doom_guide';
        
        corruptBtnElement = document.createElement('div');
        corruptBtnElement.id = 'corrupt-btn-variant';
        corruptBtnElement.innerText = 'BEGIN CORRUPTION'; // Default text

        corruptBtnElement.addEventListener('click', () => {
            attemptCorruption(exorcistType, targetResult);
        });

        document.body.appendChild(corruptBtnElement); // Place outside tree (absolute)
        updateCorruptButtonState(); // Initial lock check
    }
}

function updateCorruptButtonState() {
    if (!corruptBtnElement || !currentFusionType) return;

    // Specific cost logic for corruption (assuming 666 SE from allies_data.js)
    const cost = 666; 
    
    // Condition 1: Must select the corrupt option from fusion tree (or have specific T3 selected)
    // We assume selecting the 'negative' path slot in the tree is required.
    // For now, simplify: if any fusion is selected, we enable this button as a shortcut.
    const isSlotSelected = (selectedSlotData !== null);
    
    // Condition 2: Soul Energy Check
    const isAffordable = money >= cost;

    if (!isSlotSelected || !isAffordable) {
        corruptBtnElement.classList.add('locked');
    } else {
        corruptBtnElement.classList.remove('locked');
    }
}

function attemptCorruption(baseType, resultType) {
    const cost = 666; 
    if (money < cost) {
        showCorruptWarning("NOT ENOUGH SOUL ENERGY");
        return;
    }
    
    // Logic hook to allies_system.js (not provided, but conceptualizing)
    if (typeof proceedEvolution === 'function') {
        const success = proceedEvolution(baseType, resultType, cost);
        if(!success) {
            showCorruptWarning("CORRUPTION FAILED: MUST BE TIED TO SACRIFICE");
        }
    } else {
        showCorruptWarning("SYSTEM ERROR: CANNOT ACCESS VOID GATE");
    }
}

// --- Customized [타락] Theme Warning ---
function showCorruptWarning(message) {
    const cw = document.getElementById('corrupt-warning');
    if (!cw) return;

    // Formatting: Bold text and prefix with [타락] theme
    cw.innerHTML = `<strong>[타락]</strong> ${message}`;
    cw.style.display = 'block';

    // Auto-hide after 3 logical seconds
    setTimeout(() => {
        cw.style.display = 'none';
    }, 3000);
}