/* graphics.js - Canvas API Setup & Pixel Art Effects */

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
const ctx = canvas.getContext('2d');

const LOGICAL_WIDTH = 360;
const LOGICAL_HEIGHT = 640;
const DOT_SIZE = 4; 
let lavaPhase = 0;
let portalPhase = 0;
let roadCracks = []; 

/**
 * Initialize the canvas and append it to the game container.
 */
function initGraphics() {
    const container = document.getElementById('game-container');
    if (!container) return;

    resizeCanvas();
    container.appendChild(canvas);
    disableSmoothing();
    generateRoadCracks();

    window.addEventListener('resize', () => {
        resizeCanvas();
        disableSmoothing();
        generateRoadCracks();
    });
    
    const legacyLabel = document.getElementById('portal-energy-label');
    if (legacyLabel) legacyLabel.style.display = 'none';
}

function disableSmoothing() {
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

function generateRoadCracks() {
    const roadEl = document.getElementById('road');
    if (!roadEl) return;
    const rect = roadEl.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    
    // Scale crack generation to logical coordinates
    const container = document.getElementById('game-container');
    const scaleX = LOGICAL_WIDTH / container.clientWidth;
    const scaleY = LOGICAL_HEIGHT / container.clientHeight;
    
    const logicalW = w * scaleX;
    const logicalH = h * scaleY;

    roadCracks = [];
    const numMainCracks = 3;
    for (let n = 0; n < numMainCracks; n++) {
        let curX = (logicalW / (numMainCracks + 1)) * (n + 1);
        for (let curY = 0; curY < logicalH; curY += DOT_SIZE) {
            curX += (Math.sin(curY * 0.05 + n) * 2);
            roadCracks.push({ x: curX, y: curY });
            if (Math.random() < 0.1) {
                let bx = curX;
                const branchLen = Math.random() * 30 + 10;
                const dir = Math.random() < 0.5 ? -1 : 1;
                for (let bl = 0; bl < branchLen; bl += DOT_SIZE) {
                    bx += dir * DOT_SIZE;
                    roadCracks.push({ x: bx, y: curY + (Math.random() * DOT_SIZE) });
                }
            }
        }
    }
}

/**
 * Main render function.
 */
function renderGraphics() {
    ctx.save();
    
    // Auto-scaling logic: logical 360x640 -> physical canvas size
    const scaleX = canvas.width / LOGICAL_WIDTH;
    const scaleY = canvas.height / LOGICAL_HEIGHT;
    ctx.scale(scaleX, scaleY);
    
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    
    drawRoad();
    drawPortal();
    drawSlots();
    drawUnits(); 
    drawSelectionHalo(); 
    
    ctx.restore();
    
    lavaPhase += 0.03; 
    portalPhase += 0.08;
}

function drawRoad() {
    const roadEl = document.getElementById('road');
    if (!roadEl) return;
    const container = document.getElementById('game-container');
    const rect = roadEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const scaleX = LOGICAL_WIDTH / containerRect.width;
    const scaleY = LOGICAL_HEIGHT / containerRect.height;

    const rx = (rect.left - containerRect.left) * scaleX;
    const ry = (rect.top - containerRect.top) * scaleY;
    const rw = rect.width * scaleX;
    const rh = rect.height * scaleY;

    ctx.fillStyle = '#121212';
    ctx.fillRect(rx, ry, rw, rh);

    for (let i = 0; i < rw; i += DOT_SIZE) {
        for (let j = 0; j < rh; j += DOT_SIZE) {
            const val = (Math.sin(i * 0.5) * Math.cos(j * 0.5));
            if (val > 0.8) {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(rx + i, ry + j, DOT_SIZE, DOT_SIZE);
            }
        }
    }

    const pulse = (Math.sin(lavaPhase) + 1) / 2;
    const r = Math.floor(60 + (140 * pulse));
    const g = Math.floor(0 + (40 * pulse));
    const crackColor = `rgb(${r},${g},0)`;
    const glowColor = `rgba(${r},${g},0, 0.3)`;

    roadCracks.forEach(c => {
        const px = rx + c.x;
        const py = ry + c.y;
        ctx.fillStyle = glowColor;
        ctx.fillRect(Math.floor((px - DOT_SIZE)/DOT_SIZE)*DOT_SIZE, Math.floor(py/DOT_SIZE)*DOT_SIZE, DOT_SIZE * 3, DOT_SIZE);
        ctx.fillStyle = crackColor;
        ctx.fillRect(Math.floor(px/DOT_SIZE)*DOT_SIZE, Math.floor(py/DOT_SIZE)*DOT_SIZE, DOT_SIZE, DOT_SIZE);
    });
}

function drawPortal() {
    const portalEl = document.getElementById('portal');
    if (!portalEl) return;
    const container = document.getElementById('game-container');
    const rect = portalEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const scaleX = LOGICAL_WIDTH / containerRect.width;
    const scaleY = LOGICAL_HEIGHT / containerRect.height;

    const px = (rect.left - containerRect.left) * scaleX;
    const py = (rect.top - containerRect.top) * scaleY;
    const pw = rect.width * scaleX;
    const ph = rect.height * scaleY;
    const cx = px + pw / 2;
    const cy = py + ph;

    for (let layer = 4; layer >= 0; layer--) {
        const radiusX = (pw / 2) - (layer * DOT_SIZE);
        const radiusY = ph - (layer * DOT_SIZE);
        if (radiusX < 0 || radiusY < 0) continue;
        const p = (Math.sin(portalPhase - layer * 0.4) + 1) / 2;
        const r = Math.floor(20 + (30 * p));
        const b = Math.floor(60 + (100 * p));
        ctx.beginPath();
        ctx.ellipse(cx, cy, radiusX, radiusY, 0, Math.PI, Math.PI * 2);
        ctx.fillStyle = `rgb(${r}, 0, ${b})`;
        ctx.fill();
    }

    for (let layer = 0; layer < 2; layer++) {
        const radiusX = (pw / 2) - (layer * DOT_SIZE);
        const radiusY = ph - (layer * DOT_SIZE);
        const p = (Math.sin(portalPhase) + 1) / 2;
        const r = Math.floor(100 + (155 * p));
        ctx.fillStyle = `rgba(${r}, 0, 255, ${0.8 - layer * 0.3})`;
        for (let angle = Math.PI; angle <= Math.PI * 2; angle += 0.05) {
            const dx = Math.cos(angle) * radiusX;
            const dy = Math.sin(angle) * radiusY;
            const sx = Math.floor((cx + dx) / DOT_SIZE) * DOT_SIZE;
            const sy = Math.floor((cy + dy) / DOT_SIZE) * DOT_SIZE;
            ctx.fillRect(sx, sy, DOT_SIZE, DOT_SIZE);
        }
    }

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
            case 'apprentice': drawApprentice(cx, cy); break;
            case 'chainer': drawChainer(cx, cy); break;
            case 'monk': drawMonk(cx, cy); break;
            case 'talisman': drawTalisman(cx, cy); break;
            case 'archer': drawArcher(cx, cy); break;
            case 'assassin': drawAssassin(cx, cy); break;
            case 'ice': drawIce(cx, cy); break;
            case 'fire': drawFire(cx, cy); break;
            case 'tracker': drawTracker(cx, cy); break;
            case 'necromancer': drawNecromancer(cx, cy); break;
            case 'guardian': drawGuardian(cx, cy); break;
        }
    });
}

function drawIce(cx, cy) {
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

function drawFire(cx, cy) {
    const time = lavaPhase;
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-5, -10, '#000', 10, 18);
    // Red Robe
    p(-4, -1, '#8B0000', 8, 9);
    // Flaming Hair
    const flame = (Math.sin(time * 10) + 1) / 2;
    p(-4, -9 - flame, '#FF4500', 8, 8);
    p(-3, -8 - flame, '#FFD700', 6, 4);
}

function drawTracker(cx, cy) {
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-5, -8, '#000', 10, 16);
    // Gray Cloak
    p(-4, -7, '#696969', 8, 14);
    // Goggles
    p(-3, -5, '#00FF00', 6, 2);
    // Rifle
    p(4, -2, '#3E2723', 8, 2);
    p(10, -3, '#000', 2, 1);
}

function drawNecromancer(cx, cy) {
    const time = lavaPhase;
    const y = cy + Math.sin(time * 2) * 2;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-5, -9, '#000', 10, 18);
    // Dark Purple Robe
    p(-4, -8, '#4B0082', 8, 16);
    // Skull Mask
    p(-2, -6, '#FFF', 4, 4);
    p(-1, -4, '#000', 1, 1);
    p(1, -4, '#000', 1, 1);
}

function drawGuardian(cx, cy) {
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-7, -9, '#000', 14, 18);
    // Heavy Plate (Silver)
    p(-6, -8, '#C0C0C0', 12, 16);
    // Gold Trim
    p(-6, -8, '#FFD700', 12, 2);
    p(-6, 6, '#FFD700', 12, 2);
    // Shield
    p(-9, -4, '#B8860B', 4, 10);
    p(-8, -3, '#FFD700', 2, 8);
}

function drawTalisman(cx, cy) {
    const time = lavaPhase;
    const y = cy + Math.sin(time * 3) * 3;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Scroll Outline
    p(-4, -8, '#000', 8, 16);
    // Scroll Body (Parchment)
    p(-3, -7, '#F5DEB3', 6, 14);
    // Glowing Runes
    const glow = (Math.sin(time * 5) + 1) / 2;
    const runeColor = `rgba(255, 140, 0, ${0.6 + 0.4 * glow})`;
    p(-1, -5, runeColor, 2, 2);
    p(-1, -1, runeColor, 2, 2);
    p(-1, 3, runeColor, 2, 2);
}

function drawArcher(cx, cy) {
    const time = lavaPhase;
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-5, -8, '#000', 10, 16);
    // Green Hood
    p(-4, -7, '#228B22', 8, 8);
    p(-3, -7, '#32CD32', 6, 2);
    // Face shadow
    p(-2, -4, '#1a1a1a', 4, 3);
    // Leather Tunic
    p(-4, 1, '#8B4513', 8, 7);
    // Bow
    p(4, -6, '#5D4037', 2, 12);
    p(5, -4, '#DEB887', 1, 8); // Bowstring
}

function drawAssassin(cx, cy) {
    const time = lavaPhase;
    const y = cy;
    const p = (ox, oy, color, w=1, h=1) => { ctx.fillStyle = color; ctx.fillRect(cx + ox, y + oy, w, h); };

    // Outline
    p(-6, -6, '#000', 12, 12);
    // Dark Cloak
    p(-5, -5, '#333', 10, 10);
    p(-4, -5, '#111', 8, 8);
    // Glowing Eyes (Red)
    const eyePulse = (Math.sin(time * 6) + 1) / 2;
    p(-2, -3, `rgba(255, 0, 0, ${0.8 + 0.2 * eyePulse})`, 1, 1);
    p(1, -3, `rgba(255, 0, 0, ${0.8 + 0.2 * eyePulse})`, 1, 1);
    // Blades
    p(-8, 2, '#708090', 3, 1); // Left blade
    p(5, 2, '#708090', 3, 1); // Right blade
}

function drawChainer(cx, cy) {
    const time = lavaPhase;
    const floatingY = Math.sin(time * 1.5) * 2; 
    const y = cy + floatingY;

    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        ctx.fillRect(cx + ox, y + oy, w, h);
    };

    // --- Outline ---
    p(-6, -4, '#000', 12, 14); 
    p(-2, 10, '#000', 4, 4); 

    // --- Body ---
    p(-5, -3, '#483D8B', 10, 12); // Dark Slate Blue robe
    p(-4, -3, '#9370DB', 8, 10);  // Medium Purple inner
    
    // --- Iron Hood ---
    p(-3, -6, '#2F4F4F', 6, 4); // Dark Slate Gray hood
    p(-2, -5, '#1a1a1a', 4, 3); // Face shadow
    
    const eyeGlow = (Math.sin(time * 3) + 1) / 2;
    p(-1, -4, `rgba(147, 112, 219, ${0.7 + 0.3 * eyeGlow})`, 1, 1);
    p(1, -4, `rgba(147, 112, 219, ${0.7 + 0.3 * eyeGlow})`, 1, 1);

    // --- Floating Chains ---
    const chainPulse = Math.sin(time * 5) * 2;
    // Left Chain
    p(-8, -2 + chainPulse, '#708090', 2, 2); 
    p(-10, 2 + chainPulse, '#778899', 2, 2);
    p(-9, 6 + chainPulse, '#000', 1, 4);
    // Right Chain
    p(6, -2 - chainPulse, '#708090', 2, 2); 
    p(8, 2 - chainPulse, '#778899', 2, 2);
    p(7, 6 - chainPulse, '#000', 1, 4);
}

function drawMonk(cx, cy) {
    const time = lavaPhase;
    const y = cy;

    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        ctx.fillRect(cx + ox, y + oy, w, h);
    };

    // --- Outline ---
    p(-5, -8, '#000', 10, 18);

    // --- Robe (Dark Saffron) ---
    p(-4, -1, '#8B4513', 8, 10); // Saddle Brown base
    p(-3, -1, '#D2691E', 6, 9);  // Chocolate inner
    p(-4, 2, '#DAA520', 1, 6);   // Goldenrod sash

    // --- Head ---
    p(-3, -7, '#FFDBAC', 6, 6); // Bald head
    p(-2, -4, '#000', 4, 1);    // Eyes closed in prayer
    
    // --- Prayer Beads ---
    p(-3, 0, '#3E2723', 6, 1);
    p(-4, 1, '#3E2723', 1, 1);
    p(3, 1, '#3E2723', 1, 1);

    // --- Holy Palm Aura ---
    const auraScale = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(255, 215, 0, ${0.2 * auraScale})`;
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 8 + auraScale * 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawApprentice(cx, cy) {
    const time = lavaPhase;
    const floatingY = Math.sin(time * 2) * 2.5; 
    // Shift slightly to center the 1.5x scaled sprite
    const y = cy + floatingY - 2; 

    // Final optimized scale: 1.5x fits perfectly within ~40x45 logical slot
    const S = 1.5;
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        ctx.fillRect(cx + (ox * S), y + (oy * S), w * S, h * S);
    };

    // --- 1. BLACK OUTLINE ---
    p(-6, -2, '#000', 12, 13); 
    p(-5, -11, '#000', 10, 10); 
    // Staff outline
    p(7, -13, '#000', 3, 22); 
    p(5, -15, '#000', 7, 7);  

    // --- 2. ROBE (Deep Indigo) ---
    p(-5, -1, '#2E1A47', 10, 11); 
    p(-4, -1, '#4B0082', 8, 10);  
    p(-4, -1, '#6A0DAD', 2, 9);   
    // Gold trim at bottom
    p(-5, 8, '#B8860B', 10, 2);
    p(-4, 8, '#FFD700', 8, 1);

    // --- 3. HOOD & FACE ---
    p(-4, -10, '#4B0082', 8, 8);  
    p(-3, -10, '#6A0DAD', 6, 2);  
    // Face shadow
    p(-3, -8, '#1a1a1a', 6, 6); 
    // Skin
    p(-2, -5, '#FFDBAC', 4, 3);
    
    // Glowing Eyes
    const eyeGlow = (Math.sin(time * 4) + 1) / 2;
    const eyeColor = `rgba(0, 255, 255, ${0.8 + 0.2 * eyeGlow})`;
    p(-2, -7, eyeColor, 1, 1);
    p(1, -7, eyeColor, 1, 1);
    
    // Eye trail effect
    ctx.fillStyle = `rgba(0, 255, 255, ${0.2 * eyeGlow})`;
    ctx.fillRect(cx - (5*S), y - (7*S), -5*S, 1*S); 
    ctx.fillRect(cx + (2*S), y - (7*S), 5*S, 1*S);

    // --- 4. ORNATE STAFF ---
    const staffX = 8; 
    p(staffX, -12, '#3E2723', 1, 20); // Longer wood
    p(staffX, -8, '#5D4037', 1, 6);   // Wood highlight
    
    // Staff Head
    p(6, -14, '#B8860B', 5, 5); 
    p(7, -15, '#FFD700', 1, 7); 
    p(5, -13, '#FFD700', 7, 1); 
    
    // Orb Core
    const orbGlow = (Math.cos(time * 3) + 1) / 2;
    p(7, -13, '#00FFFF', 1, 1); 
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * orbGlow})`;
    ctx.fillRect(cx + (staffX * S) - S, y + (-13 * S) - S, 3*S, 3*S);

    // --- 5. HOLY AURA PARTICLES (Scaled out) ---
    for(let i=0; i<5; i++) {
        const angle = time * 1.5 + (i * Math.PI * 0.4);
        const dist = 10 + Math.sin(time * 2 + i) * 2;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        p(px, py, `rgba(255, 215, 0, ${0.5 * orbGlow})`, 1, 1);
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
    
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + 0.2 * pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgb(255, 215, 0)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#ffd700';
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
