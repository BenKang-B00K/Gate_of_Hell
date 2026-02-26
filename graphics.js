/* graphics.js - Canvas API Setup & Pixel Art Road */

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
const ctx = canvas.getContext('2d');

const DOT_SIZE = 4; // Size of a "pixel"
let lavaPhase = 0;

/**
 * Initialize the canvas and append it to the game container.
 */
function initGraphics() {
    const container = document.getElementById('game-container');
    if (!container) return;

    resizeCanvas();
    container.appendChild(canvas);
    disableSmoothing();

    window.addEventListener('resize', () => {
        resizeCanvas();
        disableSmoothing();
    });
}

/**
 * Ensures pixel art remains sharp by disabling image smoothing.
 */
function disableSmoothing() {
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

/**
 * Resize the canvas to fill its parent.
 */
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
 * Main render function called from script.js gameLoop.
 */
function renderGraphics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the road
    drawRoad();
    
    // Update animation phases
    lavaPhase += 0.05;
}

/**
 * Draws a rocky road with flowing lava cracks in a pixel-art style.
 */
function drawRoad() {
    const roadEl = document.getElementById('road');
    if (!roadEl) return;

    const rect = roadEl.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    
    // Calculate road position relative to canvas
    const x = rect.left - containerRect.left;
    const y = rect.top - containerRect.top;
    const w = rect.width;
    const h = rect.height;

    // 1. Draw Base Dark Rock
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, w, h);

    // 2. Draw Pixelated Rock Texture (static-ish but procedurally generated)
    // To make it look like dots, we iterate by DOT_SIZE
    for (let i = 0; i < w; i += DOT_SIZE) {
        for (let j = 0; j < h; j += DOT_SIZE) {
            // Using a simple deterministic noise-like pattern based on coordinates
            const val = (Math.sin(i * 0.5) * Math.cos(j * 0.5));
            if (val > 0.7) {
                ctx.fillStyle = '#222';
                ctx.fillRect(x + i, y + j, DOT_SIZE, DOT_SIZE);
            } else if (val < -0.7) {
                ctx.fillStyle = '#111';
                ctx.fillRect(x + i, y + j, DOT_SIZE, DOT_SIZE);
            }
        }
    }

    // 3. Draw Lava Cracks (Animated)
    for (let j = 0; j < h; j += DOT_SIZE) {
        // A main central meandering crack
        const flowX = Math.sin(j * 0.03 + lavaPhase) * 15 + (w / 2);
        
        // Secondary crack
        const flowX2 = Math.cos(j * 0.02 - lavaPhase * 0.5) * 25 + (w / 2);

        // Draw Flow 1
        drawLavaPixel(x + flowX, y + j);
        
        // Draw Flow 2
        drawLavaPixel(x + flowX2, y + j);

        // Connect flows or add branches occasionally
        if (Math.sin(j * 0.1) > 0.9) {
            const start = Math.min(flowX, flowX2);
            const end = Math.max(flowX, flowX2);
            for (let bx = start; bx < end; bx += DOT_SIZE) {
                drawLavaPixel(x + bx, y + j);
            }
        }
    }
}

/**
 * Draws a multi-colored lava pixel with a hot core and cooling edges.
 */
function drawLavaPixel(px, py) {
    // Snap to grid
    const sx = Math.floor(px / DOT_SIZE) * DOT_SIZE;
    const sy = Math.floor(py / DOT_SIZE) * DOT_SIZE;

    // Core
    ctx.fillStyle = '#ffcc00'; // Yellow core
    ctx.fillRect(sx, sy, DOT_SIZE, DOT_SIZE);

    // Glow/Edge (1 pixel around)
    ctx.fillStyle = '#ff4500'; // Orange
    ctx.fillRect(sx - DOT_SIZE, sy, DOT_SIZE, DOT_SIZE);
    ctx.fillRect(sx + DOT_SIZE, sy, DOT_SIZE, DOT_SIZE);
    
    ctx.fillStyle = '#8b0000'; // Dark red/cooling
    ctx.fillRect(sx, sy - DOT_SIZE, DOT_SIZE, DOT_SIZE);
    ctx.fillRect(sx, sy + DOT_SIZE, DOT_SIZE, DOT_SIZE);
}

// Automatically initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGraphics);
} else {
    initGraphics();
}
