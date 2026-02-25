/* attackeffect.js */

/**
 * Creates a visual effect at the target position when a unit attacks.
 * @param {string} unitType - The type of the unit attacking.
 * @param {Object} target - The enemy object being hit.
 * @param {HTMLElement} container - The game container to append the effect to.
 */
function createAttackEffect(unitType, target, container) {
    if (!target || !target.element) return;

    const targetRect = target.element.getBoundingClientRect();
    const gameRect = container.getBoundingClientRect();
    
    const x = (targetRect.left + targetRect.width / 2) - gameRect.left;
    const y = (targetRect.top + targetRect.height / 2) - gameRect.top;

    if (unitType === 'apprentice') {
        createApprenticeEffect(x, y, container);
    }
}

/**
 * Apprentice Exorcist's Effect: A small holy cross or spark.
 */
function createApprenticeEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect apprentice-effect';
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    
    // Create a cross shape using two divs
    const v = document.createElement('div');
    v.className = 'cross-v';
    const h = document.createElement('div');
    h.className = 'cross-h';
    
    effect.appendChild(v);
    effect.appendChild(h);
    
    container.appendChild(effect);

    // Remove after animation
    setTimeout(() => {
        effect.remove();
    }, 400);
}

// Add more unit effects here as needed
