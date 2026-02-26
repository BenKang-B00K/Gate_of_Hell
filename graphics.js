/* graphics.js - Canvas API Setup & Pixel Art Road */

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
const ctx = canvas.getContext('2d');

const DOT_SIZE = 4; 
let lavaPhase = 0;
let roadCracks = []; // Store static crack positions

/**
 * Initialize the canvas and append it to the game container.
 */
function initGraphics() {
    const container = document.getElementById('game-container');
    if (!container) return;

    resizeCanvas();
    container.appendChild(canvas);
    disableSmoothing();
    generateRoadCracks(); // Generate static crack map

    window.addEventListener('resize', () => {
        resizeCanvas();
        disableSmoothing();
        generateRoadCracks();
    });
}

/**
 * Ensures pixel art remains sharp.
 */
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

/**
 * Generates a static map of cracks for the road.
 */
function generateRoadCracks() {
    const roadEl = document.getElementById('road');
    if (!roadEl) return;
    const rect = roadEl.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    
    roadCracks = [];
    
    // Create a few "root" cracks that branch out
    const numMainCracks = 3;
    for (let n = 0; bx = 0, n < numMainCracks; n++) {
        let curX = (w / (numMainCracks + 1)) * (n + 1);
        for (let curY = 0; curY < h; curY += DOT_SIZE) {
            // Meander slightly but keep it static
            curX += (Math.sin(curY * 0.05 + n) * 2);
            roadCracks.push({ x: curX, y: curY, type: 'main' });
            
            // Random branches
            if (Math.random() < 0.1) {
                let bx = curX;
                const branchLen = Math.random() * 30 + 10;
                const dir = Math.random() < 0.5 ? -1 : 1;
                for (let bl = 0; bl < branchLen; bl += DOT_SIZE) {
                    bx += dir * DOT_SIZE;
                    roadCracks.push({ x: bx, y: curY + (Math.random() * DOT_SIZE), type: 'branch' });
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
    
    lavaPhase += 0.03; // Slower, subtle pulse
}

/**
 * Draws a rocky road with glowing, pulsing lava cracks.
 */
function drawRoad() {
    const roadEl = document.getElementById('road');
    if (!roadEl) return;

    const rect = roadEl.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    
    const rx = rect.left - containerRect.left;
    const ry = rect.top - containerRect.top;
    const rw = rect.width;
    const rh = rect.height;

    // 1. Draw Base Rock
    ctx.fillStyle = '#121212';
    ctx.fillRect(rx, ry, rw, rh);

    // 2. Rock Texture (deterministic noise)
    for (let i = 0; i < rw; i += DOT_SIZE) {
        for (let j = 0; j < rh; j += DOT_SIZE) {
            const val = (Math.sin(i * 0.5) * Math.cos(j * 0.5));
            if (val > 0.8) {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(rx + i, ry + j, DOT_SIZE, DOT_SIZE);
            }
        }
    }

    // 3. Draw Pulsing Cracks
    // Pulse calculation: oscillates between 0 and 1
    const pulse = (Math.sin(lavaPhase) + 1) / 2;
    
    // Crack Colors: Subtle Dark Red to Brighter Orange-Red
    // Dark Red: rgb(60, 0, 0)
    // Bright Red: rgb(200, 40, 0)
    const r = Math.floor(60 + (140 * pulse));
    const g = Math.floor(0 + (40 * pulse));
    const b = 0;
    const crackColor = `rgb(${r},${g},${b})`;
    const glowColor = `rgba(${r},${g},${b}, 0.3)`;

    roadCracks.forEach(c => {
        const px = rx + c.x;
        const py = ry + c.y;
        
        // Shadow/Glow effect
        ctx.fillStyle = glowColor;
        ctx.fillRect(Math.floor((px - DOT_SIZE)/DOT_SIZE)*DOT_SIZE, Math.floor(py/DOT_SIZE)*DOT_SIZE, DOT_SIZE * 3, DOT_SIZE);
        
        // Inner crack
        ctx.fillStyle = crackColor;
        ctx.fillRect(Math.floor(px/DOT_SIZE)*DOT_SIZE, Math.floor(py/DOT_SIZE)*DOT_SIZE, DOT_SIZE, DOT_SIZE);
    });
}

// Automatically initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGraphics);
} else {
    initGraphics();
}
