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
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 250; 
    
    // Base Resolution: 30x34, Scale: 3x (90x102)
    // Fits into 119x135 slot area with breathing room
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 250) : 0;

    // --- 1. BODY & ROBE (ImageSample Palette) ---
    const robeColor = '#5F7D7E';
    const robeShadow = '#4A5F60';
    const robeHighlight = '#8BA8A9';
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13); // Base
    p(-2, 1, robeHighlight, 3, 11); // Center Highlight
    p(-5, 11, robeShadow, 11, 3); // Bottom Shadow
    
    // Leather Belt
    p(-5, 7, '#3E2723', 11, 2); 
    p(-1, 7, '#BCA371', 2, 2); // Buckle

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Face
    p(-5, -10, '#000', 11, 11); 
    p(-4, -9, '#E8C4A2', 9, 9);  
    
    // Hair (Dirty Blonde / Messy)
    const hairColor = '#BCA371';
    const hairShadow = '#8D7B4B';
    p(-5, -11, '#000', 11, 5); // Outline
    p(-5, -11, hairColor, 11, 4);
    p(-5, -8, hairColor, 2, 5); 
    p(4, -8, hairColor, 2, 5);
    p(-2, -11, '#E3D3A3', 5, 1); // Highlight
    
    // Eyes
    p(-3, -6, isAttacking ? '#fff' : '#333', 2, 2);
    p(2, -6, isAttacking ? '#fff' : '#333', 2, 2);

    // --- 2. ORNATE STAFF (Sample Design) ---
    let staffOX = isAttacking ? 9 : 7;
    let staffOY = isAttacking ? -12 : -11;
    
    const woodColor = '#3E2723';
    const jewelColor = isAttacking ? '#00FFFF' : '#4CAF50'; // Cyan when casting, Green idle
    
    // Handle
    p(staffOX, staffOY, woodColor, 3, 25);
    p(staffOX + 1, staffOY, '#5D4037', 1, 25); // Highlight
    
    // Head Socket
    p(staffOX - 2, staffOY - 4, woodColor, 7, 5);
    p(staffOX - 1, staffOY - 3, '#000', 5, 3); // Inner dark
    
    // Jewel
    p(staffOX, staffOY - 2, jewelColor, 3, 2);
    
    // Casting Particles (Blue/Cyan from Sample)
    if (isAttacking) {
        const pCount = 4;
        for(let i=0; i<pCount; i++) {
            const pPhase = (time * 10 + i) % 10;
            const px = staffOX + 5 + pPhase;
            const py = staffOY - 2 + Math.sin(time * 5 + i) * 3;
            p(px, py, '#00E5FF', 1, 1);
        }
        
        // Attack Sparkle
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = '#00e5ff';
        const sparkleSize = 25 * flashIntensity;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
        const jX = isLeft ? cx + ((staffOX + 1.5) * S) : cx - ((staffOX + 1.5) * S);
        const jY = cy + ((staffOY - 1) * S);
        ctx.fillRect(jX - sparkleSize/2, jY - sparkleSize/2, sparkleSize, sparkleSize);
        ctx.restore();
    }

    // --- 3. AMBIENT MAGIC ---
    const orbGlow = (Math.cos(time * 3) + 1) / 2;
    for(let i=0; i<4; i++) {
        const angle = time * 1.5 + (i * Math.PI * 0.5);
        const dist = 20 + Math.sin(time * 2 + i) * 4;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        p(Math.round(px), Math.round(py), `rgba(0, 229, 255, ${0.3 * orbGlow})`, 1, 1);
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
