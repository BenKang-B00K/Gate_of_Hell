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
    // Base position (slightly shifted to account for staff height)
    const y = cy + 5; 

    // S = 2.0 provides a high-detail 'dot' look (approx 60x67 grid in 119x135 slot)
    const S = 2.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        // Draw using the scale S to maintain pixel art aesthetic
        ctx.fillRect(cx + (ox * S), y + (oy * S), w * S, h * S);
    };

    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isFlashing = timeSinceShot < 150; 
    const flashIntensity = isFlashing ? 1.0 - (timeSinceShot / 150) : 0;

    // --- 1. YOUNG EXORCIST (Gray Robe) ---
    
    // Robe Body (Centered)
    p(-12, -5, '#000', 24, 28); // Body Outline
    p(-10, -3, '#666', 20, 25); // Base Dark Gray
    p(-8, -3, '#888', 16, 23);  // Mid Gray
    p(-4, -3, '#AAA', 8, 21);   // Light Gray (Inner folds)
    p(-10, 18, '#444', 20, 4);  // Bottom Shadow
    
    // Feet (Small boots)
    p(-8, 23, '#000', 6, 4);
    p(2, 23, '#000', 6, 4);
    p(-7, 24, '#222', 4, 2);
    p(3, 24, '#222', 4, 2);

    // Head / Face
    p(-10, -22, '#000', 20, 18); // Head Outline
    p(-8, -20, '#FFDBAC', 16, 15); // Skin
    
    // Hair (Young, messy - Dark Brown)
    p(-10, -24, '#3E2723', 20, 8); // Top hair
    p(-10, -18, '#3E2723', 4, 10); // Left side
    p(6, -18, '#3E2723', 4, 10);  // Right side
    p(-2, -20, '#5D4037', 6, 2);  // Highlight
    
    // Eyes
    const eyeColor = isFlashing ? '#fff' : '#00FFFF';
    p(-5, -12, eyeColor, 3, 2); // Left eye
    p(2, -12, eyeColor, 3, 2);  // Right eye
    
    // Face shadow
    p(-8, -8, 'rgba(0,0,0,0.1)', 16, 3);

    // --- 2. ORNATE STAFF (Right side) ---
    const staffX = 16;
    const crossColor = isFlashing ? `rgba(255, 255, 255, ${0.8 + 0.2 * flashIntensity})` : '#ffd700';
    
    // Staff body
    p(staffX, -25, '#000', 4, 50); // Outline
    p(staffX + 1, -24, '#3E2723', 2, 48); // Wood
    
    // Cross Head (Precise Dots)
    p(staffX - 6, -32, '#000', 16, 6); // Horizontal Outline
    p(staffX - 1, -38, '#000', 6, 16); // Vertical Outline
    
    p(staffX - 5, -31, crossColor, 14, 4); // Horizontal bar
    p(staffX, -37, crossColor, 4, 14);     // Vertical bar
    
    // Center jewel
    const orbGlow = (Math.cos(time * 3) + 1) / 2;
    const jewelColor = isFlashing ? '#fff' : '#00FFFF';
    p(staffX, -31, jewelColor, 4, 4); 
    
    // Attack Flash Sparkle
    if (isFlashing) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = '#00e5ff';
        const sparkleSize = 24 * flashIntensity;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
        ctx.fillRect(cx + ((staffX+2)*S) - (sparkleSize/2), y + (-31*S) - (sparkleSize/2), sparkleSize, sparkleSize);
        ctx.restore();
    }

    // --- 3. HOLY AURA (Scaled to stay in bounds) ---
    for(let i=0; i<6; i++) {
        const angle = time * 1.2 + (i * Math.PI * 0.33);
        const dist = 22 + Math.sin(time * 2 + i) * 4;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        p(Math.round(px), Math.round(py), `rgba(255, 215, 0, ${0.4 * orbGlow})`, 1, 1);
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
