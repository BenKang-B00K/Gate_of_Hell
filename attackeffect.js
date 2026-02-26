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

    switch(unitType) {
        case 'apprentice': createApprenticeEffect(x, y, container); break;
        case 'chainer': createChainerEffect(x, y, container); break;
        case 'monk': createMonkEffect(x, y, container); break;
        case 'archer': createArcherEffect(x, y, container); break;
        case 'ice': createIceEffect(x, y, container); break;
        case 'fire': createFireEffect(x, y, container); break;
        case 'assassin': createAssassinEffect(x, y, container); break;
        case 'tracker': createTrackerEffect(x, y, container); break;
        case 'necromancer': createNecromancerEffect(x, y, container); break;
        case 'guardian': createGuardianEffect(x, y, container); break;
        case 'alchemist': createAlchemistEffect(x, y, container); break;
        case 'mirror': createMirrorEffect(x, y, container); break;
        case 'knight': createKnightEffect(x, y, container); break;
        // Master Effects
        case 'paladin': createPaladinEffect(x, y, container); break;
        case 'crusader': createCrusaderEffect(x, y, container); break;
        case 'midas': createMidasEffect(x, y, container); break;
        case 'philosopher': createPhilosopherEffect(x, y, container); break;
        case 'illusion': createIllusionEffect(x, y, container); break;
        case 'reflection': createReflectionEffect(x, y, container); break;
        case 'executor': createExecutorEffect(x, y, container); break;
        case 'binder': createBinderEffect(x, y, container); break;
        case 'grandsealer': createSealerEffect(x, y, container); break;
        case 'flamemaster': createFlameMasterEffect(x, y, container); break;
        case 'vajra': createVajraEffect(x, y, container); break;
        case 'saint': createSaintEffect(x, y, container); break;
        case 'voidsniper': createSniperEffect(x, y, container); break;
        case 'thousandhand': createThousandHandEffect(x, y, container); break;
        case 'absolutezero': createAbsoluteZeroEffect(x, y, container); break;
        case 'permafrost': createPermafrostEffect(x, y, container); break;
        case 'hellfire': createHellfireEffect(x, y, container); break;
        case 'phoenix': createPhoenixEffect(x, y, container); break;
        case 'abyssal': createAbyssalEffect(x, y, container); break;
        case 'spatial': createSpatialEffect(x, y, container); break;
        case 'seer': createSeerEffect(x, y, container); break;
        case 'commander': createCommanderEffect(x, y, container); break;
        case 'wraithlord': createWraithLordEffect(x, y, container); break;
        case 'cursedshaman': createShamanEffect(x, y, container); break;
        case 'rampart': createRampartEffect(x, y, container); break;
        case 'judgment': createJudgmentEffect(x, y, container); break;
        // Abyss Effects
        case 'transmuter': createTransmuterEffect(x, y, container); break;
        case 'oracle': createOracleEffect(x, y, container); break;
        case 'warden': createWardenEffect(x, y, container); break;
        case 'cursed_talisman': createCursedTalismanEffect(x, y, container); break;
        case 'asura': createAsuraEffect(x, y, container); break;
        case 'piercing_shadow': createPiercingShadowEffect(x, y, container); break;
        case 'cocytus': createCocytusEffect(x, y, container); break;
        case 'purgatory': createPurgatoryEffect(x, y, container); break;
        case 'reaper': createReaperEffect(x, y, container); break;
        case 'doom_guide': createDoomGuideEffect(x, y, container); break;
        case 'forsaken_king': createForsakenKingEffect(x, y, container); break;
        case 'void_gatekeeper': createVoidGatekeeperEffect(x, y, container); break;
        case 'eternal_wall': createEternalWallEffect(x, y, container); break;
    }
}

/* --- Abyss Effect Functions --- */

function createTransmuterEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect abyss-effect transmuter-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '⚛️';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 800);
}

function createOracleEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect abyss-effect oracle-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '💠';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
}

function createWardenEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect abyss-effect warden-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🗝️';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
}

function createCursedTalismanEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect abyss-effect cursed-talisman-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '⛩️';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 800);
}

function createAsuraEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect abyss-effect asura-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '👹';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 400);
}

function createPiercingShadowEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect abyss-effect piercing-shadow-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🌠';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 300);
}

function createCocytusEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect abyss-effect cocytus-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '⏳';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 1200);
}

function createPurgatoryEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect abyss-effect purgatory-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🕯️';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
}

function createReaperEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect abyss-effect reaper-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '☠️';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
}

function createDoomGuideEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect abyss-effect doom-guide-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🛶';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 800);
}

function createForsakenKingEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect abyss-effect forsaken-king-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '👑';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 700);
}

function createVoidGatekeeperEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect abyss-effect void-gatekeeper-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🚪';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
}

function createEternalWallEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect abyss-effect eternal-wall-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🗿';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 900);
}

/* --- Master Effect Functions --- */

function createMidasEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect midas-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '💰';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
}

function createPhilosopherEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect philosopher-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '💎';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 700);
}

function createIllusionEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect illusion-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🎭';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 800);
}

function createReflectionEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect reflection-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🪩';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
}

function createPaladinEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect paladin-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '✨';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
}

function createCrusaderEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect crusader-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerHTML = '<div class="slash-v"></div>';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 300);
}

function createExecutorEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect executor-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '⚖️';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
}

function createBinderEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect binder-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🔗';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
}

function createSealerEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect sealer-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🛐';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 700);
}

function createFlameMasterEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect flamemaster-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
}

function createVajraEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect vajra-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🔱';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 400);
}

function createSaintEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect saint-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🔔';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 800);
}

function createSniperEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect sniper-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 200);
}

function createThousandHandEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect thousandhand-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🍃';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 400);
}

function createAbsoluteZeroEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect absolutezero-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '💎';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
}

function createPermafrostEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect permafrost-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 800);
}

function createHellfireEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect hellfire-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
}

function createPhoenixEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect phoenix-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🐦‍🔥';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 700);
}

function createAbyssalEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect abyssal-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 400);
}

function createSpatialEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect spatial-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 300);
}

function createSeerEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect seer-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '👁️';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 800);
}

function createCommanderEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect commander-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🚩';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
}

function createWraithLordEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect wraithlord-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🧟';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
}

function createShamanEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect shaman-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🎭';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 700);
}

function createRampartEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect rampart-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🏰';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
}

function createJudgmentEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect master-effect judgment-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '⚔️';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
}

/** Apprentice: Holy Cross */
function createApprenticeEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect apprentice-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerHTML = '<div class="cross-v"></div><div class="cross-h"></div>';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 400);
}

/** Soul Chainer: Purple Binding Ring */
function createChainerEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect chainer-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
}

/** Mace Monk: Heavy Impact Shockwave */
function createMonkEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect monk-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 300);
}

/** Divine Archer: Green Piercing Spark */
function createArcherEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect archer-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 400);
}

/** Ice Daoist: Snowflake Burst */
function createIceEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect ice-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '❄️';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
}

/** Fire Mage: Small Fire Explosion */
function createFireEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect fire-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 400);
}

/** Shadow Assassin: Dark Slash */
function createAssassinEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect assassin-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 200);
}

/** Soul Tracker: Target Eye Mark */
function createTrackerEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect tracker-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '👁️';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
}

/** Necromancer: Purple Spirit Smoke */
function createNecromancerEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect necromancer-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
}

/** Sanctuary Guardian: Golden Shield Flash */
function createGuardianEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect guardian-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 400);
}

/** Exorcist Knight: Sword Slash */
function createKnightEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect knight-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 45 - 22.5}deg)`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 300);
}

/** Alchemist: Transmutation Spark */
function createAlchemistEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect alchemist-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🧪';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 400);
}

/** Mirror Oracle: Reflective Shimmer */
function createMirrorEffect(x, y, container) {
    const effect = document.createElement('div');
    effect.className = 'attack-effect mirror-effect';
    effect.style.left = `${x}px`; effect.style.top = `${y}px`;
    effect.innerText = '🪞';
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 500);
}

/**
 * Visual effect when Soul Energy is gained.
 */
function createSEGainEffect(x, y, amount, container) {
    const effect = document.createElement('div');
    effect.className = 'se-gain-effect';
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    effect.innerText = `+${Math.floor(amount)} SE`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
}

/**
 * Visual effect when a Corrupted Shard is gained.
 */
function createCSGainEffect(x, y, amount, container) {
    const effect = document.createElement('div');
    effect.className = 'cs-gain-effect';
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    effect.innerText = `+${amount} CS`;
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 600);
}




// Add more unit effects here as needed
