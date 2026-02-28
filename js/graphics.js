/* graphics.js - Core Rendering Engine Entry Point */

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
const ctx = canvas.getContext('2d');

const LOGICAL_WIDTH = 360; 
const LOGICAL_HEIGHT = 640; 

function initGraphics() {
    const container = document.getElementById('game-container');
    if (!container) return;
    container.appendChild(canvas);
    canvas.style.imageRendering = 'pixelated';
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    if (!container) return;
    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    disableSmoothing();
}

function disableSmoothing() {
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

function renderGraphics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    lavaPhase += 0.02;
    globalAnimTimer += 0.06; 
    
    // Updates from graphics_vfx.js
    if(typeof updateParticles === 'function') updateParticles();
    if(typeof updateLightPillars === 'function') updateLightPillars();
    if(typeof updatePromotionBursts === 'function') updatePromotionBursts();
    if(typeof updateStageFlashes === 'function') updateStageFlashes();
    if(typeof window.updateBanishEffects === 'function') window.updateBanishEffects();
    if(typeof updatePurgeEffects === 'function') updatePurgeEffects();
    
    // Environment from graphics_env.js
    if(typeof drawLavaRoad === 'function') drawLavaRoad();
    if(typeof drawAtmosphericEffects === 'function') drawAtmosphericEffects(); 
    if(typeof drawSpawningGate === 'function') drawSpawningGate(); 
    if(typeof drawPortal === 'function') drawPortal(); 
    if(typeof drawSlots === 'function') drawSlots();
    
    // Units from graphics_units.js & logic here
    drawUnits();
    
    // Enemies logic from enemies.js (called via drawEnemies here)
    if(typeof drawEnemies === 'function') drawEnemies(); 
    
    // VFX Drawing
    if(typeof drawParticles === 'function') drawParticles(); 
    if(typeof drawLightPillars === 'function') drawLightPillars();
    if(typeof drawPromotionBursts === 'function') drawPromotionBursts();
    if(typeof window.drawBanishEffects === 'function') window.drawBanishEffects();
    if(typeof drawPurgeEffects === 'function') drawPurgeEffects();
    if(typeof drawStageFlashes === 'function') drawStageFlashes();
    
    // Selection from this file or units file
    drawSelectionHalo();
}

// Load Spritesheet
const spritesheet = new Image();
spritesheet.src = 'js/allies.js';

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGraphics);
} else {
    initGraphics();
}

// Global Exports
window.ctx = ctx;
