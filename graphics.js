/* graphics.js - Canvas API Setup & Pixel Art Effects */

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
const ctx = canvas.getContext('2d');

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
    roadCracks = [];
    const numMainCracks = 3;
    for (let n = 0; n < numMainCracks; n++) {
        let curX = (w / (numMainCracks + 1)) * (n + 1);
        for (let curY = 0; curY < h; curY += DOT_SIZE) {
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawRoad();
    drawPortal();
    drawSlots();
    drawUnits(); // Draw custom pixel art units
    drawSelectionHalo(); 
    
    lavaPhase += 0.03; 
    portalPhase += 0.08;
}

function drawRoad() {
    const roadEl = document.getElementById('road');
    if (!roadEl) return;
    const rect = roadEl.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const rx = rect.left - containerRect.left;
    const ry = rect.top - containerRect.top;
    const rw = rect.width;
    const rh = rect.height;

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
    const rect = portalEl.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const px = rect.left - containerRect.left;
    const py = rect.top - containerRect.top;
    const pw = rect.width;
    const ph = rect.height;
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
        // Move text inside the portal at the bottom
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
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const pulse = (Math.sin(lavaPhase * 1.5) + 1) / 2; 

    cardSlots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        const sx = rect.left - containerRect.left;
        const sy = rect.top - containerRect.top;
        const sw = rect.width;
        const sh = rect.height;
        const inset = 2;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(sx + inset, sy + inset, sw - inset * 2, sh - inset * 2);
        ctx.strokeStyle = `rgb(${Math.floor(180 + 75 * pulse)}, ${Math.floor(140 + 60 * pulse)}, 0)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + inset + 2, sy + inset + 2, sw - inset * 2 - 4, sh - inset * 2 - 4);
        ctx.fillStyle = '#ffd700';
        const cs = DOT_SIZE; 
        ctx.fillRect(sx + inset, sy + inset, cs, cs);
        ctx.fillRect(sx + sw - inset - cs, sy + inset, cs, cs);
        ctx.fillRect(sx + inset, sy + sh - inset - cs, cs, cs);
        ctx.fillRect(sx + sw - inset - cs, sy + sh - inset - cs, cs, cs);

        if (slot.classList.contains('occupied')) {
            ctx.fillStyle = `rgba(255, 215, 0, ${0.1 + 0.1 * pulse})`;
            ctx.fillRect(sx + inset + 4, sy + inset + 4, sw - inset * 2 - 8, sh - inset * 2 - 8);
        }
    });
}

/**
 * Draws custom pixel art for active units.
 */
function drawUnits() {
    if (typeof towers === 'undefined') return;
    const containerRect = document.getElementById('game-container').getBoundingClientRect();

    towers.forEach(tower => {
        if (tower.data.type === 'apprentice') {
            const rect = tower.element.getBoundingClientRect();
            const cx = (rect.left + rect.width / 2) - containerRect.left;
            const cy = (rect.top + rect.height / 2) - containerRect.top;
            
            drawApprentice(cx, cy);
        }
    });
}

/**
 * Renders the Apprentice Exorcist pixel art with higher detail.
 */
function drawApprentice(cx, cy) {
    const ds = 2; // Increased resolution for units
    
    // 1. Robe (Gray with shading)
    ctx.fillStyle = '#555555'; // Darker base/shadow
    ctx.fillRect(cx - ds*4, cy + ds, ds*8, ds*5); // Bottom wide robe
    ctx.fillStyle = '#777777'; // Mid tone
    ctx.fillRect(cx - ds*3, cy - ds*3, ds*6, ds*6); // Body
    ctx.fillStyle = '#999999'; // Highlights
    ctx.fillRect(cx - ds*3, cy - ds*3, ds*2, ds*4); // Left highlight
    
    // 2. Face & Hair
    ctx.fillStyle = '#ffdbac'; // Skin
    ctx.fillRect(cx - ds*2, cy - ds*6, ds*4, ds*3);
    ctx.fillStyle = '#443322'; // Brown hair/hood shadow
    ctx.fillRect(cx - ds*2, cy - ds*7, ds*4, ds); // Hair top
    
    // 3. Divine Eyes (Glow)
    const eyePulse = (Math.sin(lavaPhase * 5) + 1) / 2;
    ctx.fillStyle = `rgba(0, 229, 255, ${0.6 + 0.4 * eyePulse})`;
    ctx.fillRect(cx - ds*1.5, cy - ds*5, ds, ds); // Left eye
    ctx.fillRect(cx + ds*0.5, cy - ds*5, ds, ds); // Right eye
    
    // 4. Waist Belt
    ctx.fillStyle = '#333333';
    ctx.fillRect(cx - ds*3, cy + ds, ds*6, ds);
    
    // 5. Fancy Staff with Golden Cross
    const staffX = cx + ds*4 + 1;
    const staffY = cy - ds*8;
    
    // Wooden Staff
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(staffX, staffY, ds, ds*12);
    
    // Golden Cross Head
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(staffX - ds*2, staffY, ds*5, ds*1.5); // Horizontal
    ctx.fillRect(staffX, staffY - ds*2, ds, ds*6); // Vertical
    
    // Center Gem in Staff
    const gemPulse = (Math.sin(lavaPhase * 3) + 1) / 2;
    ctx.fillStyle = `rgba(0, 255, 255, ${0.8 + 0.2 * gemPulse})`;
    ctx.fillRect(staffX, staffY, ds, ds);
    
    // Staff Glow
    ctx.fillStyle = `rgba(255, 215, 0, ${0.2 * gemPulse})`;
    ctx.fillRect(staffX - ds*3, staffY - ds*3, ds*7, ds*7);
}

/**
 * Draws a divine, pulsing golden halo around the selected unit.
 */
function drawSelectionHalo() {
    const selectedUnit = document.querySelector('.unit.selected');
    if (!selectedUnit) return;

    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const rect = selectedUnit.getBoundingClientRect();
    const cx = (rect.left + rect.width / 2) - containerRect.left;
    const cy = (rect.top + rect.height / 2) - containerRect.top;
    
    const pulse = (Math.sin(lavaPhase * 4) + 1) / 2; // Fast pulse for attention
    const radius = (rect.width / 2) + 4 + (pulse * 2);
    
    ctx.save();
    ctx.imageSmoothingEnabled = true; 
    
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + 0.2 * pulse})`;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgb(255, 215, 0)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#ffd700';
    const markSize = 4;
    ctx.fillRect(cx - 1, cy - radius - markSize, 2, markSize * 2); 
    ctx.fillRect(cx - 1, cy + radius - markSize, 2, markSize * 2); 
    ctx.fillRect(cx - radius - markSize, cy - 1, markSize * 2, 2); 
    ctx.fillRect(cx + radius - markSize, cy - 1, markSize * 2, 2); 

    ctx.restore();
    disableSmoothing();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGraphics);
} else {
    initGraphics();
}
