/* graphics.js - Core Rendering Engine Entry Point */

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
const ctx = canvas.getContext('2d');

window.LOGICAL_WIDTH = 1080; 
window.LOGICAL_HEIGHT = 1440; // 75% of 1920
let scaleFactor = 1.0;

function initGraphics() {
    const container = document.getElementById('top-panel');
    if (!container) return;
    
    container.appendChild(canvas);
    canvas.style.imageRendering = 'pixelated';
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

function resizeCanvas() {
    const container = document.getElementById('top-panel');
    if (!container) return;
    
    // Set canvas resolution to full 1080 width
    canvas.width = window.LOGICAL_WIDTH;
    
    // Dynamic height based on container ratio, but internal logic prefers fixed ratio
    // We will sync LOGICAL_HEIGHT to the actual pixel height ratio relative to 1080 width
    const rect = container.getBoundingClientRect();
    const ratio = rect.height / rect.width;
    window.LOGICAL_HEIGHT = Math.floor(window.LOGICAL_WIDTH * ratio);
    
    canvas.height = window.LOGICAL_HEIGHT;
    
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    scaleFactor = rect.width / window.LOGICAL_WIDTH;
    
    disableSmoothing();
}

function disableSmoothing() {
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

function renderGraphics() {
    // Clear entire buffer
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // No ctx.scale needed - we are native 1080p now
    
    lavaPhase += 0.02;
    globalAnimTimer += 0.06; 
    
    // 0. Logical Updates
    if(typeof updateParticles === 'function') updateParticles();
    if(typeof updateSoulEssences === 'function') updateSoulEssences();
    if(typeof updateLightPillars === 'function') updateLightPillars();
    if(typeof updatePromotionBursts === 'function') updatePromotionBursts();
    if(typeof updateStageFlashes === 'function') updateStageFlashes();
    if(typeof window.updateBanishEffects === 'function') window.updateBanishEffects();
    if(typeof updatePurgeEffects === 'function') updatePurgeEffects();
    if(typeof updateFloatingTexts === 'function') updateFloatingTexts();
    
    // 1. Level 1: Road (Lava & Lightning)
    if(typeof drawLRoad === 'function') drawLRoad();
    
    // 2. Level 2: Units, Enemies, and Summons
    if(typeof drawSlots === 'function') drawSlots();
    if(typeof drawUnits === 'function') drawUnits();
    if(typeof drawSummons === 'function') drawSummons();
    if(typeof drawEnemies === 'function') drawEnemies(); 
    
    // 3. Level 3: Portal, Spawning Gate, and Clouds
    if(typeof drawPortal === 'function') drawPortal(); 
    if(typeof drawSpawningGate === 'function') drawSpawningGate(); 
    if(typeof drawAtmosphericEffects === 'function') drawAtmosphericEffects(); 

    // 4. VFX and Selection (Top Layers)
    if(typeof drawParticles === 'function') drawParticles(); 
    if(typeof drawSoulEssences === 'function') drawSoulEssences();
    if(typeof drawFloatingTexts === 'function') drawFloatingTexts();
    if(typeof drawLightPillars === 'function') drawLightPillars();
    if(typeof drawPromotionBursts === 'function') drawPromotionBursts();
    if(typeof window.drawBanishEffects === 'function') window.drawBanishEffects();
    if(typeof drawPurgeEffects === 'function') drawPurgeEffects();
    if(typeof drawStageFlashes === 'function') drawStageFlashes();
    
    drawSelectionHalo();
}

function drawSelectionHalo() {
    const selected = (typeof getSelectedTower === 'function') ? getSelectedTower() : null;
    if (!selected) return;

    const cx = selected.lx;
    const cy = selected.ly;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGraphics);
} else {
    initGraphics();
}

// Global Exports
window.ctx = ctx;
window.scaleFactor = scaleFactor;
