/* attackeffect.js */

/**
 * Creates a visual effect at the target position when a unit attacks.
 * @param {string} unitType - The type of the unit attacking.
 * @param {Object} target - The enemy object being hit.
 */
function createAttackEffect(unitType, target) {
    if (!target) return;

    const lx = (target.x / 100) * LOGICAL_WIDTH;
    const ly = target.y;

    // Standard emoji-based effects using floating text system
    switch(unitType) {
        case 'apprentice': spawnFloatingText('✨', lx, ly, '#fff', 20); break;
        case 'chainer': spawnFloatingText('⛓️', lx, ly, '#9400d3', 20); break;
        case 'monk': spawnFloatingText('💥', lx, ly, '#ff4500', 24); break;
        case 'archer': spawnFloatingText('🏹', lx, ly, '#00ff00', 20); break;
        case 'ice': spawnFloatingText('❄️', lx, ly, '#00e5ff', 20); break;
        case 'fire': spawnFloatingText('🔥', lx, ly, '#ff4500', 20); break;
        case 'assassin': spawnFloatingText('🗡️', lx, ly, '#555', 20); break;
        case 'tracker': spawnFloatingText('👁️', lx, ly, '#ffd700', 20); break;
        case 'necromancer': spawnFloatingText('🔮', lx, ly, '#9400d3', 20); break;
        case 'guardian': spawnFloatingText('🛡️', lx, ly, '#ffd700', 20); break;
        case 'alchemist': spawnFloatingText('🧪', lx, ly, '#00ff00', 20); break;
        case 'mirror': spawnFloatingText('🪞', lx, ly, '#fff', 20); break;
        case 'knight': spawnFloatingText('⚔️', lx, ly, '#fff', 20); break;
        
        // Master & Abyss
        case 'paladin': spawnFloatingText('✨', lx, ly, '#ffd700', 24); break;
        case 'midas': spawnFloatingText('💰', lx, ly, '#ffd700', 24); break;
        case 'philosopher': spawnFloatingText('💎', lx, ly, '#00e5ff', 24); break;
        case 'illusion': spawnFloatingText('🎭', lx, ly, '#9400d3', 24); break;
        case 'reflection': spawnFloatingText('🪩', lx, ly, '#fff', 24); break;
        case 'vajra': spawnFloatingText('🔱', lx, ly, '#ffd700', 24); break;
        case 'saint': spawnFloatingText('🔔', lx, ly, '#ffd700', 24); break;
        case 'transmuter': spawnFloatingText('⚛️', lx, ly, '#00ff00', 28); break;
        case 'reaper': spawnFloatingText('☠️', lx, ly, '#f00', 28); break;
        
        default:
            if (typeof spawnParticles === 'function') {
                spawnParticles(lx, ly, '#fff', 5);
            }
            break;
    }
}

// Keep the SE gain effect for backward compatibility if needed, but it's handled in enemies.js now
function createSEGainEffect(lx, ly, amount) {
    if (typeof spawnFloatingText === 'function') {
        spawnFloatingText(`+${amount} SE`, lx, ly, '#ffd700', 18);
    }
}
