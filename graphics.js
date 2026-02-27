/* graphics.js - Canvas API Setup & Pixel Art Effects */

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
const ctx = canvas.getContext('2d');

const LOGICAL_WIDTH = 360;
const LOGICAL_HEIGHT = 640;

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
    canvas.width = rect.width;
    canvas.height = rect.height;
    disableSmoothing();
}

function disableSmoothing() {
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

function renderGraphics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up logical scaling
    ctx.save();
    ctx.scale(canvas.width / LOGICAL_WIDTH, canvas.height / LOGICAL_HEIGHT);
    
    lavaPhase += 0.02;
    
    drawLavaRoad();
    drawPortalEnergy();
    drawSlots();
    drawUnits();
    drawSelectionHalo();
    
    ctx.restore();
}

function drawLavaRoad() {
    // Basic dynamic lava texture simulated on canvas
    const time = lavaPhase;
    ctx.save();
    
    // Draw on the road area (Width 340 centered -> 110 to 250 in logical 360)
    // Scale: 1080 -> 360 (3x). Road 340 -> 113.3 logical
    const roadWidth = 113.3;
    const roadX = (LOGICAL_WIDTH - roadWidth) / 2;
    
    // Subtle heat haze / glow
    const haze = (Math.sin(time) + 1) / 2;
    ctx.fillStyle = `rgba(255, 69, 0, ${0.05 + haze * 0.05})`;
    ctx.fillRect(roadX, 0, roadWidth, LOGICAL_HEIGHT);
    
    ctx.restore();
}

function drawPortalEnergy() {
    const roadWidth = 113.3;
    const cx = LOGICAL_WIDTH / 2;
    const cy = LOGICAL_HEIGHT - 33; // Near the bottom portal logic

    if (typeof portalEnergy !== 'undefined') {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        const textY = cy - 5; 
        ctx.font = 'bold 8px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#9400d3';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#e0b0ff';
        ctx.fillText(`[ PORTAL ENERGY ]`, cx, textY - 10);
        ctx.font = '7px Arial, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${Math.floor(portalEnergy)} / ${maxPortalEnergy}`, cx, textY);
        ctx.restore();
        disableSmoothing();
    }
}

function drawSlots() {
    const cardSlots = document.querySelectorAll('.card-slot');
    const container = document.getElementById('game-container');
    const containerRect = container.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / containerRect.width;
    const scaleY = LOGICAL_HEIGHT / containerRect.height;
    
    const pulse = (Math.sin(lavaPhase * 1.5) + 1) / 2; 

    cardSlots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        const sx = (rect.left - containerRect.left) * scaleX;
        const sy = (rect.top - containerRect.top) * scaleY;
        const sw = rect.width * scaleX;
        const sh = rect.height * scaleY;
        const inset = 2;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(sx + inset, sy + inset, sw - inset * 2, sh - inset * 2);
        ctx.strokeStyle = `rgb(${Math.floor(180 + 75 * pulse)}, ${Math.floor(140 + 60 * pulse)}, 0)`;
        ctx.lineWidth = 1; // Thinner for logical scale
        ctx.strokeRect(sx + inset + 1, sy + inset + 1, sw - inset * 2 - 2, sh - inset * 2 - 2);
        
        ctx.fillStyle = '#ffd700';
        const cs = 2; // Fixed corner size in logical pixels
        ctx.fillRect(sx + inset, sy + inset, cs, cs);
        ctx.fillRect(sx + sw - inset - cs, sy + inset, cs, cs);
        ctx.fillRect(sx + inset, sy + sh - inset - cs, cs, cs);
        ctx.fillRect(sx + sw - inset - cs, sy + sh - inset - cs, cs, cs);

        if (slot.classList.contains('occupied')) {
            ctx.fillStyle = `rgba(255, 215, 0, ${0.1 + 0.1 * pulse})`;
            ctx.fillRect(sx + inset + 2, sy + inset + 2, sw - inset * 2 - 4, sh - inset * 2 - 4);
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

function drawIce(cx, cy, tower) {
    const time = lavaPhase;
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-5, -8, '#000', 10, 16);
    // Light Blue Robe
    p(-4, -7, '#ADD8E6', 8, 14);
    p(-3, -7, '#00FFFF', 6, 4);
    // Ice Crystals
    const crys = (Math.sin(time * 4) + 1) / 2;
    p(-7, -4 + crys*2, '#FFF', 2, 2);
    p(5, 2 - crys*2, '#FFF', 2, 2);
}

function drawFire(cx, cy, tower) {
    const time = lavaPhase;
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-5, -8, '#000', 10, 16);
    // Red/Orange Robe
    p(-4, -7, '#FF4500', 8, 14);
    p(-3, -7, '#FF8C00', 6, 4);
    // Flame Particles
    const flame = (Math.sin(time * 6) + 1) / 2;
    p(-6, -flame*3, '#FF0', 1, 1);
    p(5, -flame*2, '#F00', 1, 1);
}

function drawTracker(cx, cy, tower) {
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-5, -8, '#000', 10, 16);
    // Green Robe
    p(-4, -7, '#228B22', 8, 14);
    // Floating Eye
    const eyeY = Math.sin(lavaPhase * 2) * 2;
    p(-2, -12 + eyeY, '#000', 4, 4);
    p(-1, -11 + eyeY, '#FFF', 2, 2);
}

function drawNecromancer(cx, cy, tower) {
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-5, -8, '#000', 10, 16);
    // Purple Robe
    p(-4, -7, '#4B0082', 8, 14);
    // Skull staff
    p(5, -10, '#000', 2, 18);
    p(4, -12, '#FFF', 4, 4);
}

function drawChainer(cx, cy, tower) {
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-5, -8, '#000', 10, 16);
    // Gray/Dark Robe
    p(-4, -7, '#333', 8, 14);
    // Chains
    p(-7, -4, '#AAA', 2, 2);
    p(5, 2, '#AAA', 2, 2);
}

function drawMonk(cx, cy, tower) {
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-5, -8, '#000', 10, 16);
    // Brown Robe
    p(-4, -7, '#8B4513', 8, 14);
    // Mace
    p(5, -10, '#000', 2, 18);
    p(4, -12, '#555', 4, 4);
}

function drawTalisman(cx, cy, tower) {
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-5, -8, '#000', 10, 16);
    // Yellow/Gold Robe
    p(-4, -7, '#DAA520', 8, 14);
    // Talisman
    p(5, -4, '#FFF', 3, 5);
    p(6, -3, '#F00', 1, 1);
}

function drawArcher(cx, cy, tower) {
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-5, -8, '#000', 10, 16);
    // Forest Green Robe
    p(-4, -7, '#006400', 8, 14);
    // Bow
    p(5, -8, '#8B4513', 1, 16);
}

function drawAssassin(cx, cy, tower) {
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-5, -8, '#000', 10, 16);
    // Black Robe
    p(-4, -7, '#111', 8, 14);
    // Dagger
    p(5, -2, '#AAA', 4, 1);
}

function drawGuardian(cx, cy, tower) {
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-6, -9, '#000', 12, 18);
    // Silver Armor
    p(-5, -8, '#C0C0C0', 10, 16);
    p(-1, -4, '#000', 1, 1);
    p(1, -4, '#000', 1, 1);
}

function drawApprentice(cx, cy, tower) {
    const time = lavaPhase;
    const y = cy; // Center in slot

    // Drawing at 1:1 logical pixels (no S multiplier for blocks)
    // This gives a finer '64x64' style detail relative to the physical screen
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        ctx.fillRect(cx + ox, y + oy, w, h);
    };

    // Attack Flash Logic
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isFlashing = timeSinceShot < 150; 
    const flashIntensity = isFlashing ? 1.0 - (timeSinceShot / 150) : 0;

    // --- 1. YOUNG EXORCIST (Young boy/girl in gray robe) ---
    
    // Body / Robe (Oversized Gray Robe)
    p(-5, 0, '#000', 11, 14); // Robe Outline
    p(-4, 1, '#777', 9, 12);  // Base Gray
    p(-3, 1, '#999', 7, 11);  // Lighter gray inside
    p(-2, 1, '#BBB', 3, 10);  // Center fold
    // Shadow at bottom
    p(-4, 11, '#555', 9, 2);
    
    // Feet (Small boots)
    p(-3, 13, '#222', 3, 2);
    p(1, 13, '#222', 3, 2);

    // Head / Face
    p(-4, -9, '#000', 9, 9); // Head Outline
    p(-3, -8, '#FFDBAC', 7, 7); // Skin
    
    // Hair (Young, messy hair - Dark Brown)
    p(-4, -10, '#3E2723', 9, 3); // Top hair
    p(-4, -8, '#3E2723', 2, 4);  // Left side hair
    p(3, -8, '#3E2723', 2, 4);   // Right side hair
    p(-1, -8, '#5D4037', 3, 1);  // Highlight
    
    // Eyes (Younger, larger appearance)
    const eyeColor = isFlashing ? '#fff' : '#00FFFF';
    p(-2, -5, eyeColor, 1, 1);
    p(1, -5, eyeColor, 1, 1);
    
    // Face shadow/detail
    p(-3, -3, 'rgba(0,0,0,0.1)', 7, 2);

    // --- 2. ORNATE STAFF (Inherited design) ---
    const staffX = 7;
    const crossColor = isFlashing ? `rgba(255, 255, 255, ${0.8 + 0.2 * flashIntensity})` : '#ffd700';
    
    // Staff body
    p(staffX, -10, '#000', 3, 22); // Outline
    p(staffX+1, -9, '#3E2723', 1, 20); // Wood
    
    // Cross Head
    p(staffX - 2, -14, '#000', 7, 3);  // Cross horizontal outline
    p(staffX, -16, '#000', 3, 7);      // Cross vertical outline
    
    p(staffX - 1, -13, crossColor, 5, 1); // Horizontal bar
    p(staffX+1, -15, crossColor, 1, 5);   // Vertical bar
    
    // Center jewel / glow
    const orbGlow = (Math.cos(time * 3) + 1) / 2;
    const jewelColor = isFlashing ? '#fff' : '#00FFFF';
    p(staffX+1, -13, jewelColor, 1, 1); 
    
    // Attack Sparkle / Flash Effect
    if (isFlashing) {
        ctx.save();
        ctx.shadowBlur = 10 * flashIntensity;
        ctx.shadowColor = '#00e5ff';
        const sparkleSize = 6 * flashIntensity;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
        ctx.fillRect(cx + (staffX+1) - (sparkleSize/2), y + -13 - (sparkleSize/2), sparkleSize, sparkleSize);
        ctx.restore();
    }

    // --- 3. HOLY AURA PARTICLES ---
    for(let i=0; i<4; i++) {
        const angle = time * 1.5 + (i * Math.PI * 0.5);
        const dist = 12 + Math.sin(time * 2 + i) * 2;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        p(Math.round(px), Math.round(py), `rgba(255, 215, 0, ${0.4 * orbGlow})`, 1, 1);
    }
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
    const radius = ((rect.width * scaleX) / 2) + 4 + (pulse * 2);
    
    ctx.save();
    ctx.imageSmoothingEnabled = true; 
    
    // Outer glow
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + 0.3 * pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner markings
    ctx.strokeStyle = '#ffd700';
    const markSize = 2;
    ctx.fillRect(cx - 0.5, cy - radius - markSize, 1, markSize * 2); 
    ctx.fillRect(cx - 0.5, cy + radius - markSize, 1, markSize * 2); 
    ctx.fillRect(cx - radius - markSize, cy - 0.5, markSize * 2, 1); 
    ctx.fillRect(cx + radius - markSize, cy - 0.5, markSize * 2, 1); 

    ctx.restore();
    disableSmoothing();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGraphics);
} else {
    initGraphics();
}
