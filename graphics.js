/* graphics.js - Canvas API Setup */

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
const ctx = canvas.getContext('2d');

/**
 * Initialize the canvas and append it to the game container.
 */
function initGraphics() {
    const container = document.getElementById('game-container');
    if (!container) return;

    // Set canvas size to match container or window
    resizeCanvas();
    container.appendChild(canvas);

    // Apply pixel-art settings
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
 * Resize the canvas to fill its parent or a specific area.
 */
function resizeCanvas() {
    // Default to container size or window
    const container = document.getElementById('game-container');
    if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

// Automatically initialize when the script loads (after DOM is ready)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGraphics);
} else {
    initGraphics();
}
