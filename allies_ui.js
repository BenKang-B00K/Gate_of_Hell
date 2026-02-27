/**
 * allies_ui.js - Phaser Registry와 DOM UI 연결 브릿지
 */

window.syncUIWithRegistry = function() {
    if (!window.gameInstance || !window.gameInstance.registry) return;
    
    const registry = window.gameInstance.registry;
    
    const money = registry.get('money') || 0;
    const seText = document.getElementById('se-display-text');
    const seFill = document.getElementById('se-gauge-fill');
    if (seText) seText.innerText = Math.floor(money);
    if (seFill) seFill.style.width = `${Math.min(money / 10, 100)}%`;

    const pe = registry.get('portalEnergy') || 0;
    const maxPe = registry.get('maxPortalEnergy') || 1500;
    const peText = document.getElementById('portal-energy-label');
    const peFill = document.getElementById('portal-gauge-fill');
    if (peText) peText.innerText = `${Math.floor(pe)} / ${maxPe}`;
    if (peFill) peFill.style.width = `${(pe / maxPe) * 100}%`;

    const stage = registry.get('stage') || 1;
    const stageDisplay = document.getElementById('stage-display');
    if (stageDisplay) stageDisplay.innerText = stage;

    const enemiesLeft = registry.get('enemiesLeft') || 0;
    const elText = document.getElementById('enemies-left');
    if (elText) elText.innerText = enemiesLeft;
    
    if (typeof window.updateSummonButtonState === 'function') {
        window.updateSummonButtonState();
    }
};

window.updateSummonButtonState = function() {
    if (!window.gameInstance || !window.gameInstance.registry) return;
    const registry = window.gameInstance.registry;
    const money = registry.get('money');
    const cost = registry.get('towerCost') || 30;
    
    const summonCard = document.getElementById('tower-card');
    if (summonCard) {
        if (money < cost) {
            summonCard.style.opacity = '0.5';
            summonCard.style.filter = 'grayscale(1)';
        } else {
            summonCard.style.opacity = '1';
            summonCard.style.filter = 'none';
        }
    }
};
