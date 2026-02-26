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

    for (let layer = 0; layer < 4; layer++) {
        const radiusX = (pw / 2) - (layer * DOT_SIZE);
        const radiusY = ph - (layer * DOT_SIZE);
        const alpha = 0.8 - (layer * 0.2);
        const p = (Math.sin(portalPhase - layer * 0.5) + 1) / 2;
        const r = Math.floor(40 + (60 * p));
        const b = Math.floor(100 + (155 * p));
        ctx.fillStyle = `rgba(${r}, 0, ${b}, ${alpha})`;
        for (let angle = Math.PI; angle <= Math.PI * 2; angle += 0.05) {
            const dx = Math.cos(angle) * radiusX;
            const dy = Math.sin(angle) * radiusY;
            const sx = Math.floor((cx + dx) / DOT_SIZE) * DOT_SIZE;
            const sy = Math.floor((cy + dy) / DOT_SIZE) * DOT_SIZE;
            ctx.fillRect(sx, sy, DOT_SIZE, DOT_SIZE);
        }
    }
}

/**
 * Draws "Sacred Stone Tablets" at each card-slot position.
 */
function drawSlots() {
    const cardSlots = document.querySelectorAll('.card-slot');
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const pulse = (Math.sin(lavaPhase * 1.5) + 1) / 2; // Use lavaPhase for pulsing

    cardSlots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        const sx = rect.left - containerRect.left;
        const sy = rect.top - containerRect.top;
        const sw = rect.width;
        const sh = rect.height;

        // Sacred Stone Tablet Shape
        const inset = 2;
        
        // 1. Tablet Base (Dark/Black Stone)
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(sx + inset, sy + inset, sw - inset * 2, sh - inset * 2);

        // 2. Golden Carved Border
        // Outer border
        ctx.strokeStyle = `rgb(${Math.floor(180 + 75 * pulse)}, ${Math.floor(140 + 60 * pulse)}, 0)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + inset + 2, sy + inset + 2, sw - inset * 2 - 4, sh - inset * 2 - 4);

        // 3. Corner Decorations (Holy Symbols)
        ctx.fillStyle = '#ffd700';
        const cs = DOT_SIZE; // Corner size
        // TL
        ctx.fillRect(sx + inset, sy + inset, cs, cs);
        // TR
        ctx.fillRect(sx + sw - inset - cs, sy + inset, cs, cs);
        // BL
        ctx.fillRect(sx + inset, sy + sh - inset - cs, cs, cs);
        // BR
        ctx.fillRect(sx + sw - inset - cs, sy + sh - inset - cs, cs, cs);

        // 4. Subtle center glow if occupied
        if (slot.classList.contains('occupied')) {
            ctx.fillStyle = `rgba(255, 215, 0, ${0.1 + 0.1 * pulse})`;
            ctx.fillRect(sx + inset + 4, sy + inset + 4, sw - inset * 2 - 8, sh - inset * 2 - 8);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGraphics);
} else {
    initGraphics();
}
