/* js/input_handler.js - Canvas Input Handling */

let selectedTower = null;
let hoveredSlot = null;
let dragTower = null;
let isDragging = false;
let lastMouseDownTime = 0;

function initInputHandlers() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
}

function getLogicalCoords(e) {
    const canvas = document.getElementById('game-canvas');
    const rect = canvas.getBoundingClientRect();
    // canvas.width is LOGICAL_WIDTH (1080), canvas.height is LOGICAL_HEIGHT
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
}

function handleMouseDown(e) {
    const { x, y } = getLogicalCoords(e);
    lastMouseDownTime = Date.now();

    // 1. Check if unit clicked (Threshold scaled for 1080p: 30 * 3 = 90)
    const clickedTower = towers.find(t => {
        const dist = Math.sqrt(Math.pow(t.lx - x, 2) + Math.pow(t.ly - y, 2));
        return dist < 90; 
    });

    // 2. Check if enemy clicked (Threshold scaled for 1080p: 25 * 3 = 75)
    const clickedEnemy = enemies.find(en => {
        const dist = Math.sqrt(Math.pow((en.x / 100) * LOGICAL_WIDTH - x, 2) + Math.pow(en.y - y, 2));
        return dist < 75; 
    });

    if (clickedEnemy) {
        if (typeof showEnemyInfo === 'function') showEnemyInfo(clickedEnemy);
        return;
    }

    if (clickedTower) {
        selectedTower = clickedTower;
        dragTower = clickedTower;
        if (typeof showUnitInfo === 'function') showUnitInfo(clickedTower);
        if (!clickedTower.isShrine && typeof showRangeIndicator === 'function') showRangeIndicator(clickedTower);
    } else {
        selectedTower = null;
        const ri = document.getElementById('range-indicator'); if (ri) ri.remove();
    }
}

function handleMouseMove(e) {
    const { x, y } = getLogicalCoords(e);
    
    if (dragTower && Date.now() - lastMouseDownTime > 200) {
        isDragging = true;
        dragTower.lx = x;
        dragTower.ly = y;
    }

    // Hover Slot Logic
    hoveredSlot = findNearestSlot(x, y);
}

function handleMouseUp(e) {
    const { x, y } = getLogicalCoords(e);
    
    if (isDragging && dragTower) {
        const targetSlot = findNearestSlot(x, y);
        if (targetSlot) {
            const isShrine = dragTower.isShrine;
            const slotType = targetSlot.type; // 'shrine' or 'unit'
            
            if ((isShrine && slotType === 'shrine') || (!isShrine && slotType === 'unit')) {
                executeCanvasMove(dragTower, targetSlot);
            } else {
                if (typeof GameLogger !== 'undefined') GameLogger.warn(`🚫 Invalid slot for this unit!`);
                resetTowerPosition(dragTower);
            }
        } else {
            resetTowerPosition(dragTower);
        }
    }

    dragTower = null;
    isDragging = false;
}

function findNearestSlot(lx, ly) {
    if (!window.logicalSlots) return null;
    let nearest = null;
    let minDist = 120; // 40 * 3
    
    window.logicalSlots.forEach(slot => {
        const dist = Math.sqrt(Math.pow(slot.lx - lx, 2) + Math.pow(slot.ly - ly, 2));
        if (dist < minDist) {
            minDist = dist;
            nearest = slot;
        }
    });
    return nearest;
}

function executeCanvasMove(tower, targetSlot) {
    const oldSlot = tower.currentSlot;
    if (oldSlot === targetSlot) { resetTowerPosition(tower); return; }

    // Swap logic
    const occupant = towers.find(t => t.currentSlot === targetSlot);
    if (occupant) {
        occupant.currentSlot = oldSlot;
        occupant.lx = oldSlot.lx;
        occupant.ly = oldSlot.ly;
    }

    tower.currentSlot = targetSlot;
    tower.lx = targetSlot.lx;
    tower.ly = targetSlot.ly;
    
    if (selectedTower === tower && !tower.isShrine) {
        showRangeIndicator(tower);
    }
}

function resetTowerPosition(tower) {
    if (tower.currentSlot) {
        tower.lx = tower.currentSlot.lx;
        tower.ly = tower.currentSlot.ly;
    }
}

document.addEventListener('DOMContentLoaded', initInputHandlers);
window.getSelectedTower = () => selectedTower;
