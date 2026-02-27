/* graphics.js - High-Resolution (1080x1920) Canvas API Setup */

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
const ctx = canvas.getContext('2d');

// Increased Logical Resolution for much sharper detail
const LOGICAL_WIDTH = 1080;
const LOGICAL_HEIGHT = 1920;

let lavaPhase = 0;

function initGraphics() {
    const container = document.getElementById('game-container');
    if (!container) return;
    container.appendChild(canvas);
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    
    // Physical pixels match internal logical pixels for 1:1 crispness
    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;
    
    // Scale CSS display size to fit container while maintaining 1080x1920 ratio
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
    
    // No more scale() needed if logical == physical, 
    // or we can keep it for flexibility if container size varies.
    // Since we set canvas.width = 1080, we are now drawing in 1080x1920 space.
    
    lavaPhase += 0.02;
    
    drawLavaRoad();
    drawPortalEnergy();
    drawSlots();
    drawUnits();
    drawSelectionHalo();
}

function drawLavaRoad() {
    const time = lavaPhase;
    // Road 340px centered in 1080px -> X: 370 to 710
    const roadWidth = 340;
    const roadX = (LOGICAL_WIDTH - roadWidth) / 2;
    
    const haze = (Math.sin(time) + 1) / 2;
    ctx.fillStyle = `rgba(255, 69, 0, ${0.05 + haze * 0.05})`;
    ctx.fillRect(roadX, 0, roadWidth, LOGICAL_HEIGHT);
}

function drawPortalEnergy() {
    const cx = LOGICAL_WIDTH / 2;
    const cy = LOGICAL_HEIGHT - 100; // Adjusted for 1920 height

    if (typeof portalEnergy !== 'undefined') {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        
        ctx.font = 'bold 24px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#9400d3';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#e0b0ff';
        ctx.fillText(`[ PORTAL ENERGY ]`, cx, cy - 30);
        
        ctx.font = '21px Arial, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${Math.floor(portalEnergy)} / ${maxPortalEnergy}`, cx, cy);
        
        ctx.restore();
        disableSmoothing();
    }
}

function drawSlots() {
    const cardSlots = document.querySelectorAll('.card-slot');
    const container = document.getElementById('game-container');
    const containerRect = container.getBoundingClientRect();
    
    // Map browser DOM coords to 1080x1920 space
    const scaleX = LOGICAL_WIDTH / containerRect.width;
    const scaleY = LOGICAL_HEIGHT / containerRect.height;
    
    const pulse = (Math.sin(lavaPhase * 1.5) + 1) / 2; 

    cardSlots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        const sx = (rect.left - containerRect.left) * scaleX;
        const sy = (rect.top - containerRect.top) * scaleY;
        const sw = rect.width * scaleX;
        const sh = rect.height * scaleY;
        
        const inset = 6; // Thicker lines for higher res
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(sx + inset, sy + inset, sw - inset * 2, sh - inset * 2);
        
        ctx.strokeStyle = `rgb(${Math.floor(180 + 75 * pulse)}, ${Math.floor(140 + 60 * pulse)}, 0)`;
        ctx.lineWidth = 3; 
        ctx.strokeRect(sx + inset + 3, sy + inset + 3, sw - inset * 2 - 6, sh - inset * 2 - 6);
        
        ctx.fillStyle = '#ffd700';
        const cs = 6; 
        ctx.fillRect(sx + inset, sy + inset, cs, cs);
        ctx.fillRect(sx + sw - inset - cs, sy + inset, cs, cs);
        ctx.fillRect(sx + inset, sy + sh - inset - cs, cs, cs);
        ctx.fillRect(sx + sw - inset - cs, sy + sh - inset - cs, cs, cs);

        if (slot.classList.contains('occupied')) {
            ctx.fillStyle = `rgba(255, 215, 0, ${0.1 + 0.1 * pulse})`;
            ctx.fillRect(sx + inset + 6, sy + inset + 6, sw - inset * 2 - 12, sh - inset * 2 - 12);
        }
    });
}

function drawUnits() {
    if (typeof towers === 'undefined') return;
    const container = document.getElementById('game-container');
    const containerRect = container.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / containerRect.width;
    const scaleY = LOGICAL_HEIGHT / containerRect.height;

    towers.forEach(tower => {
        const rect = tower.element.getBoundingClientRect();
        const cx = ((rect.left + rect.width / 2) - containerRect.left) * scaleX;
        const cy = ((rect.top + rect.height / 2) - containerRect.top) * scaleY;

        switch(tower.data.type) {
            case 'apprentice': drawApprentice(cx, cy, tower); break;
            case 'chainer': drawChainer(cx, cy, tower); break;
            case 'monk': drawMonk(cx, cy, tower); break;
            case 'talisman': drawTalisman(cx, cy, tower); break;
            case 'archer': drawArcher(cx, cy, tower); break;
            case 'assassin': drawAssassin(cx, cy, tower); break;
            case 'ice': drawIce(cx, cy, tower); break;
            case 'fire': drawFire(cx, cy, tower); break;
            case 'tracker': drawTracker(cx, cy, tower); break;
            case 'necromancer': drawNecromancer(cx, cy, tower); break;
            case 'guardian': drawGuardian(cx, cy, tower); break;
        }
    });
}

// ---------------------------------------------------------
// UNIT DRAWING FUNCTIONS (Updated for 1080x1920 scale)
// ---------------------------------------------------------

function drawApprentice(cx, cy, tower) {
    const time = lavaPhase;
    const y = cy;

    // S = 3.0 relative to 360 -> 1080 (3x scaling for the sprite itself)
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        ctx.fillRect(cx + (ox * S), y + (oy * S), w * S, h * S);
    };

    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isFlashing = timeSinceShot < 150; 
    const flashIntensity = isFlashing ? 1.0 - (timeSinceShot / 150) : 0;

    // --- 1. YOUNG EXORCIST ---
    
    // Robe
    p(-5, 0, '#000', 11, 14); 
    p(-4, 1, '#777', 9, 12);  
    p(-3, 1, '#999', 7, 11);  
    p(-2, 1, '#BBB', 3, 10);  
    p(-4, 11, '#555', 9, 2);
    
    // Boots
    p(-3, 13, '#222', 3, 2);
    p(1, 13, '#222', 3, 2);

    // Head
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, '#FFDBAC', 7, 7); 
    
    // Hair
    p(-4, -10, '#3E2723', 9, 3); 
    p(-4, -8, '#3E2723', 2, 4);  
    p(3, -8, '#3E2723', 2, 4);   
    p(-1, -8, '#5D4037', 3, 1);  
    
    // Eyes
    const eyeColor = isFlashing ? '#fff' : '#00FFFF';
    p(-2, -5, eyeColor, 1, 1);
    p(1, -5, eyeColor, 1, 1);
    
    p(-3, -3, 'rgba(0,0,0,0.1)', 7, 2);

    // --- 2. ORNATE STAFF (CROSS) ---
    const staffX = 7;
    const crossColor = isFlashing ? `rgba(255, 255, 255, ${0.8 + 0.2 * flashIntensity})` : '#ffd700';
    
    p(staffX, -10, '#000', 3, 22); 
    p(staffX+1, -9, '#3E2723', 1, 20); 
    
    p(staffX - 2, -14, '#000', 7, 3); 
    p(staffX, -16, '#000', 3, 7);     
    
    p(staffX - 1, -13, crossColor, 5, 1); 
    p(staffX+1, -15, crossColor, 1, 5);   
    
    const orbGlow = (Math.cos(time * 3) + 1) / 2;
    const jewelColor = isFlashing ? '#fff' : '#00FFFF';
    p(staffX+1, -13, jewelColor, 1, 1); 
    
    if (isFlashing) {
        ctx.save();
        ctx.shadowBlur = 30 * flashIntensity;
        ctx.shadowColor = '#00e5ff';
        const sparkleSize = 18 * flashIntensity;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
        ctx.fillRect(cx + ((staffX+1)*S) - (sparkleSize/2), y + (-13*S) - (sparkleSize/2), sparkleSize, sparkleSize);
        ctx.restore();
    }

    // --- 3. HOLY AURA ---
    for(let i=0; i<4; i++) {
        const angle = time * 1.5 + (i * Math.PI * 0.5);
        const dist = 12 + Math.sin(time * 2 + i) * 2;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        p(px, py, `rgba(255, 215, 0, ${0.4 * orbGlow})`, 1, 1);
    }
}

// Simple versions for others at 1080p scale
function drawIce(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-5, -8, '#000', 30, 48);
    p(-4, -7, '#ADD8E6', 24, 42);
}
function drawFire(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-5, -8, '#000', 30, 48);
    p(-4, -7, '#FF4500', 24, 42);
}
function drawTracker(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-5, -8, '#000', 30, 48);
    p(-4, -7, '#228B22', 24, 42);
}
function drawNecromancer(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-5, -8, '#000', 30, 48);
    p(-4, -7, '#4B0082', 24, 42);
}
function drawChainer(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-5, -8, '#000', 30, 48);
    p(-4, -7, '#333', 24, 42);
}
function drawMonk(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-5, -8, '#000', 30, 48);
    p(-4, -7, '#8B4513', 24, 42);
}
function drawTalisman(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-5, -8, '#000', 30, 48);
    p(-4, -7, '#DAA520', 24, 42);
}
function drawArcher(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-5, -8, '#000', 30, 48);
    p(-4, -7, '#006400', 24, 42);
}
function drawAssassin(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-5, -8, '#000', 30, 48);
    p(-4, -7, '#111', 24, 42);
}
function drawGuardian(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-6, -9, '#000', 36, 54);
    p(-5, -8, '#C0C0C0', 30, 48);
}

function drawSelectionHalo() {
    const selectedUnit = document.querySelector('.unit.selected');
    if (!selectedUnit) return;

    const container = document.getElementById('game-container');
    const containerRect = container.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / containerRect.width;
    const scaleY = LOGICAL_HEIGHT / containerRect.height;

    const rect = selectedUnit.getBoundingClientRect();
    const cx = ((rect.left + rect.width / 2) - containerRect.left) * scaleX;
    const cy = ((rect.top + rect.height / 2) - containerRect.top) * scaleY;
    
    const pulse = (Math.sin(lavaPhase * 4) + 1) / 2; 
    const radius = ((rect.width * scaleX) / 2) + 12 + (pulse * 6);
    
    ctx.save();
    ctx.imageSmoothingEnabled = true; 
    
    // Outer glow
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + 0.3 * pulse})`;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Inner markings
    ctx.strokeStyle = '#ffd700';
    const markSize = 6;
    ctx.fillRect(cx - 1.5, cy - radius - markSize, 3, markSize * 2); 
    ctx.fillRect(cx - 1.5, cy + radius - markSize, 3, markSize * 2); 
    ctx.fillRect(cx - radius - markSize, cy - 1.5, markSize * 2, 3); 
    ctx.fillRect(cx + radius - markSize, cy - 1.5, markSize * 2, 3); 

    ctx.restore();
    disableSmoothing();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGraphics);
} else {
    initGraphics();
}
