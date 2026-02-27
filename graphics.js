/* graphics.js - High-Resolution (1080x1920) Canvas API Setup */

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
const ctx = canvas.getContext('2d');

// Increased Logical Resolution for much sharper detail
const LOGICAL_WIDTH = 1080;
const LOGICAL_HEIGHT = 1920;

let lavaPhase = 0;

function initGraphics() {
    const container = document.getElementById('game-container');
    if (!container) return;
    container.appendChild(canvas);
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    
    // Physical pixels match internal logical pixels for 1:1 crispness
    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;
    
    // Scale CSS display size to fit container while maintaining 1080x1920 ratio
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    disableSmoothing();
}

function disableSmoothing() {
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

function renderGraphics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // No more scale() needed if logical == physical, 
    // or we can keep it for flexibility if container size varies.
    // Since we set canvas.width = 1080, we are now drawing in 1080x1920 space.
    
    lavaPhase += 0.02;
    
    drawLavaRoad();
    drawPortalEnergy();
    drawSlots();
    drawUnits();
    drawSelectionHalo();
}

function drawLavaRoad() {
    const time = lavaPhase;
    // Road 340px centered in 1080px -> X: 370 to 710
    const roadWidth = 340;
    const roadX = (LOGICAL_WIDTH - roadWidth) / 2;
    
    const haze = (Math.sin(time) + 1) / 2;
    ctx.fillStyle = `rgba(255, 69, 0, ${0.05 + haze * 0.05})`;
    ctx.fillRect(roadX, 0, roadWidth, LOGICAL_HEIGHT);
}

function drawPortalEnergy() {
    const cx = LOGICAL_WIDTH / 2;
    const cy = LOGICAL_HEIGHT - 100; // Adjusted for 1920 height

    if (typeof portalEnergy !== 'undefined') {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        
        ctx.font = 'bold 24px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#9400d3';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#e0b0ff';
        ctx.fillText(`[ PORTAL ENERGY ]`, cx, cy - 30);
        
        ctx.font = '21px Arial, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${Math.floor(portalEnergy)} / ${maxPortalEnergy}`, cx, cy);
        
        ctx.restore();
        disableSmoothing();
    }
}

function drawSlots() {
    const cardSlots = document.querySelectorAll('.card-slot');
    const container = document.getElementById('game-container');
    const containerRect = container.getBoundingClientRect();
    
    // Map browser DOM coords to 1080x1920 space
    const scaleX = LOGICAL_WIDTH / containerRect.width;
    const scaleY = LOGICAL_HEIGHT / containerRect.height;
    
    const pulse = (Math.sin(lavaPhase * 1.5) + 1) / 2; 

    cardSlots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        const sx = (rect.left - containerRect.left) * scaleX;
        const sy = (rect.top - containerRect.top) * scaleY;
        const sw = rect.width * scaleX;
        const sh = rect.height * scaleY;
        
        const inset = 6; // Thicker lines for higher res
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(sx + inset, sy + inset, sw - inset * 2, sh - inset * 2);
        
        ctx.strokeStyle = `rgb(${Math.floor(180 + 75 * pulse)}, ${Math.floor(140 + 60 * pulse)}, 0)`;
        ctx.lineWidth = 3; 
        ctx.strokeRect(sx + inset + 3, sy + inset + 3, sw - inset * 2 - 6, sh - inset * 2 - 6);
        
        ctx.fillStyle = '#ffd700';
        const cs = 6; 
        ctx.fillRect(sx + inset, sy + inset, cs, cs);
        ctx.fillRect(sx + sw - inset - cs, sy + inset, cs, cs);
        ctx.fillRect(sx + inset, sy + sh - inset - cs, cs, cs);
        ctx.fillRect(sx + sw - inset - cs, sy + sh - inset - cs, cs, cs);

        if (slot.classList.contains('occupied')) {
            ctx.fillStyle = `rgba(255, 215, 0, ${0.1 + 0.1 * pulse})`;
            ctx.fillRect(sx + inset + 6, sy + inset + 6, sw - inset * 2 - 12, sh - inset * 2 - 12);
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
            case 'apprentice': drawApprentice(cx, cy, tower); break;
            case 'chainer': drawChainer(cx, cy, tower); break;
            case 'monk': drawMonk(cx, cy, tower); break;
            case 'talisman': drawTalisman(cx, cy, tower); break;
            case 'archer': drawArcher(cx, cy, tower); break;
            case 'assassin': drawAssassin(cx, cy, tower); break;
            case 'ice': drawIce(cx, cy, tower); break;
            case 'fire': drawFire(cx, cy, tower); break;
            case 'tracker': drawTracker(cx, cy, tower); break;
            case 'necromancer': drawNecromancer(cx, cy, tower); break;
            case 'guardian': drawGuardian(cx, cy, tower); break;
        }
    });
}

// ---------------------------------------------------------
// UNIT DRAWING FUNCTIONS (Updated for 1080x1920 scale)
// ---------------------------------------------------------

function drawApprentice(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 250; 
    
    // Base Resolution: 30x34, Scale: 3x (90x102)
    // Fits into 119x135 slot area with breathing room
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 250) : 0;

    // --- 1. BODY & ROBE (ImageSample Palette) ---
    const robeColor = '#5F7D7E';
    const robeShadow = '#4A5F60';
    const robeHighlight = '#8BA8A9';
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13); // Base
    p(-2, 1, robeHighlight, 3, 11); // Center Highlight
    p(-5, 11, robeShadow, 11, 3); // Bottom Shadow
    
    // Leather Belt
    p(-5, 7, '#3E2723', 11, 2); 
    p(-1, 7, '#BCA371', 2, 2); // Buckle

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Face
    p(-5, -10, '#000', 11, 11); 
    p(-4, -9, '#E8C4A2', 9, 9);  
    
    // Hair (Dirty Blonde / Messy)
    const hairColor = '#BCA371';
    const hairShadow = '#8D7B4B';
    p(-5, -11, '#000', 11, 5); // Outline
    p(-5, -11, hairColor, 11, 4);
    p(-5, -8, hairColor, 2, 5); 
    p(4, -8, hairColor, 2, 5);
    p(-2, -11, '#E3D3A3', 5, 1); // Highlight
    
    // Eyes
    p(-3, -6, isAttacking ? '#fff' : '#333', 2, 2);
    p(2, -6, isAttacking ? '#fff' : '#333', 2, 2);

    // --- 2. ORNATE STAFF (Sample Design) ---
    let staffOX = isAttacking ? 9 : 7;
    let staffOY = isAttacking ? -12 : -11;
    
    const woodColor = '#3E2723';
    const jewelColor = isAttacking ? '#00FFFF' : '#4CAF50'; // Cyan when casting, Green idle
    
    // Handle
    p(staffOX, staffOY, woodColor, 3, 25);
    p(staffOX + 1, staffOY, '#5D4037', 1, 25); // Highlight
    
    // Head Socket
    p(staffOX - 2, staffOY - 4, woodColor, 7, 5);
    p(staffOX - 1, staffOY - 3, '#000', 5, 3); // Inner dark
    
    // Jewel
    p(staffOX, staffOY - 2, jewelColor, 3, 2);
    
    // Casting Particles (Blue/Cyan from Sample)
    if (isAttacking) {
        const pCount = 4;
        for(let i=0; i<pCount; i++) {
            const pPhase = (time * 10 + i) % 10;
            const px = staffOX + 5 + pPhase;
            const py = staffOY - 2 + Math.sin(time * 5 + i) * 3;
            p(px, py, '#00E5FF', 1, 1);
        }
        
        // Attack Sparkle
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = '#00e5ff';
        const sparkleSize = 25 * flashIntensity;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
        const jX = isLeft ? cx + ((staffOX + 1.5) * S) : cx - ((staffOX + 1.5) * S);
        const jY = cy + ((staffOY - 1) * S);
        ctx.fillRect(jX - sparkleSize/2, jY - sparkleSize/2, sparkleSize, sparkleSize);
        ctx.restore();
    }

    // --- 3. AMBIENT MAGIC ---
    const orbGlow = (Math.cos(time * 3) + 1) / 2;
    for(let i=0; i<4; i++) {
        const angle = time * 1.5 + (i * Math.PI * 0.5);
        const dist = 20 + Math.sin(time * 2 + i) * 4;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        p(Math.round(px), Math.round(py), `rgba(0, 229, 255, ${0.3 * orbGlow})`, 1, 1);
    }
}

// Simple versions for others at 1080p scale
function drawIce(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 300; 
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 300) : 0;

    // --- 1. BODY & DAOIST ROBES (Ice Blue / Deep Navy) ---
    const robeColor = '#1A237E'; // Deep navy base
    const iceBlue = '#81D4FA';  // Frosty blue detail
    const trimColor = '#E1F5FE'; // Near white frost
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-2, 1, iceBlue, 3, 11); // Center panel
    p(-5, 11, '#0D47A1', 11, 3); // Bottom shadow
    
    // Traditional Girdle
    p(-5, 7, '#000', 11, 2);
    p(-4, 7, '#FFD700', 1, 1); // Small jade/gold ornament

    // Boots (Black)
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Daoist Hat (Guan)
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Hat (Black/Gold Guan)
    p(-3, -11, '#000', 7, 3);
    p(-1, -12, '#000', 3, 2); // Top pin
    p(-1, -11, '#FFD700', 3, 1); // Gold trim on hat

    // Face Features (Calm/Frozen focus)
    p(-2, -5, '#000', 1, 1);
    p(2, -5, '#000', 1, 1);
    p(-1, -3, '#81D4FA', 3, 1); // Frosty breath/beard hint

    // --- 2. THE FROST FOCUS (Levitating Ice Crystal) ---
    let crystalFloat = Math.sin(time * 3) * 3;
    let cryOX = isAttacking ? 10 : 8;
    let cryOY = -8 + crystalFloat;
    
    // Main Crystal (Rhombus shape)
    p(cryOX - 2, cryOY - 4, '#000', 5, 9); // Outline
    p(cryOX - 1, cryOY - 3, '#E1F5FE', 3, 7); // Core
    p(cryOX, cryOY - 2, '#fff', 1, 5); // Shine
    
    // Small orbiting shards
    for(let i=0; i<3; i++) {
        const ang = time * 2 + (i * Math.PI * 0.6);
        const dx = Math.cos(ang) * 12;
        const dy = Math.sin(ang) * 12;
        p(Math.round(cryOX + dx/S), Math.round(cryOY + dy/S), '#81D4FA', 1, 1);
    }

    // --- 3. ATTACK EFFECTS (Flash Freeze) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = '#00E5FF';
        
        // Ice Burst
        const burstSize = 15 * flashIntensity;
        const bX = isLeft ? cx + (cryOX * S) : cx - (cryOX * S);
        const bY = cy + (cryOY * S);
        
        ctx.fillStyle = `rgba(129, 212, 250, ${flashIntensity})`;
        ctx.fillRect(bX - burstSize, bY - burstSize, burstSize * 2, burstSize * 2);
        
        // Snowflakes
        for(let i=0; i<8; i++) {
            const sang = (i / 8) * Math.PI * 2;
            const sdist = 20 * flashIntensity;
            const sx = Math.cos(sang) * sdist;
            const sy = Math.sin(sang) * sdist;
            p(Math.round(cryOX + sx/S), Math.round(cryOY + sy/S), '#fff', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. AMBIENT COLD AURA ---
    const mistGlow = (Math.cos(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(179, 229, 252, ${0.1 * mistGlow})`;
    ctx.beginPath();
    ctx.arc(cx, cy + 5 * S, 25 * S, 0, Math.PI * 2);
    ctx.fill();
}
function drawFire(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 300; 
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 300) : 0;

    // --- 1. BODY & MAGICAL ROBES (Crimson / Gold Palette) ---
    const robeColor = '#B71C1C'; // Deep crimson
    const goldColor = '#FFD700'; // Gold trim
    const robeShadow = '#7F0000';
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-2, 1, goldColor, 3, 11); // Center gold trim
    p(-5, 11, robeShadow, 11, 3); // Bottom shadow
    
    // Belt/Sash
    p(-5, 7, '#000', 11, 2);
    p(-1, 7, '#FF5722', 2, 2); // Orange buckle

    // Boots (Black/Brown)
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Wizard Hat
    const skinColor = '#F5DDC7';
    p(-4, -8, '#000', 9, 8); // Head outline
    p(-3, -7, skinColor, 7, 6);
    
    // The Hat (Pointy Wizard Hat)
    p(-6, -9, '#000', 13, 3); // Hat brim outline
    p(-5, -8, robeColor, 11, 1); // Brim
    p(-3, -15, '#000', 7, 7); // Hat top outline
    p(-2, -14, robeColor, 5, 6); // Hat top
    p(-1, -12, goldColor, 3, 1); // Gold band

    // Eyes (Glowing Orange/Yellow)
    p(-2, -5, isAttacking ? '#FFF' : '#FF9800', 1, 1);
    p(2, -5, isAttacking ? '#FFF' : '#FF9800', 1, 1);

    // --- 2. FIREBALLS (Levitating Orbs of Flame) ---
    const fireSpeed = 4;
    for(let i=0; i<2; i++) {
        const side = i === 0 ? -1 : 1;
        const floatY = Math.sin(time * fireSpeed + (i * Math.PI)) * 4;
        let orbOX = (side * 10);
        let orbOY = -2 + floatY;
        
        // Orb Core
        p(orbOX - 2, orbOY - 2, '#000', 5, 5); 
        p(orbOX - 1, orbOY - 1, '#FF5722', 3, 3); // Orange
        p(orbOX, orbOY, '#FFEB3B', 1, 1); // Yellow core
        
        // Flame Wisps
        for(let j=0; j<3; j++) {
            const wPhase = (time * 8 + j) % 6;
            p(orbOX - 1 + j, orbOY - 3 - wPhase, `rgba(255, 69, 0, ${0.6 - (wPhase/10)})`, 1, 1);
        }
    }

    // --- 3. ATTACK EFFECTS (Inferno Blast) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 50 * flashIntensity;
        ctx.shadowColor = '#FF4500';
        
        // Central Explosion
        const blastSize = 20 * flashIntensity;
        ctx.fillStyle = `rgba(255, 215, 0, ${flashIntensity})`;
        ctx.beginPath();
        ctx.arc(cx, cy - 2 * S, blastSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Embers
        for(let i=0; i<10; i++) {
            const ang = (i / 10) * Math.PI * 2 + time * 10;
            const dist = 15 + flashIntensity * 40;
            const px = Math.cos(ang) * dist;
            const py = Math.sin(ang) * dist;
            p(Math.round(px/S), Math.round(-2 + py/S), '#FF8A65', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. AMBIENT HEAT AURA ---
    const heatGlow = (Math.sin(time * 3) + 1) / 2;
    ctx.fillStyle = `rgba(255, 69, 0, ${0.05 * heatGlow})`;
    ctx.beginPath();
    ctx.arc(cx, cy + 5 * S, 30 * S, 0, Math.PI * 2);
    ctx.fill();
}
function drawTracker(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-5, -8, '#000', 30, 48);
    p(-4, -7, '#228B22', 24, 42);
}
function drawNecromancer(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-5, -8, '#000', 30, 48);
    p(-4, -7, '#4B0082', 24, 42);
}
function drawChainer(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-5, -8, '#000', 30, 48);
    p(-4, -7, '#333', 24, 42);
}
function drawMonk(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 300; 
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 300) : 0;

    // --- 1. BODY & MONK ROBES (Saffron/Brown Palette) ---
    const robeColor = '#8D6E63'; // Brownish clay
    const robeShadow = '#5D4037';
    const sashColor = '#FFB300'; // Amber/Saffron sash
    
    // Lower Robe
    p(-6, 2, '#000', 13, 14); // Outline
    p(-5, 3, robeColor, 11, 12);
    p(-5, 12, robeShadow, 11, 3);
    
    // Sash/Belt
    p(-5, 5, '#000', 11, 3);
    p(-5, 6, sashColor, 11, 1);
    
    // Prayer Beads (Mala)
    const beadColor = '#3E2723';
    p(-3, 1, '#000', 7, 5); // Neck loop outline
    p(-2, 2, beadColor, 5, 3); 
    p(0, 5, beadColor, 2, 2); // Hanging bead

    // Muscular Arms (Skin Tone)
    const skinColor = '#D7B19D';
    p(-8, 3, '#000', 4, 7); // Left arm outline
    p(-7, 4, skinColor, 2, 5);
    p(5, 3, '#000', 4, 7); // Right arm outline
    p(6, 4, skinColor, 2, 5);

    // Boots
    p(-5, 15, '#000', 4, 3);
    p(2, 15, '#000', 4, 3);

    // Head (Shaven/Bald)
    p(-4, -8, '#000', 9, 9); 
    p(-3, -7, skinColor, 7, 7);
    p(-1, -7, '#F5DDC7', 3, 2); // Forehead highlight
    
    // Face Features
    p(-1, -4, '#333', 3, 1); // Focused mouth
    p(-2, -5, '#333', 1, 1); // Eye L
    p(2, -5, '#333', 1, 1); // Eye R

    // --- 2. THE HOLY MACE (Massive Iron Weapon) ---
    // Mace position shifts during attack
    let maceSwing = isAttacking ? Math.sin(flashIntensity * Math.PI) * 15 : 0;
    let maceOX = isAttacking ? 8 + maceSwing : 7;
    let maceOY = isAttacking ? -15 - maceSwing : -12;
    
    const ironColor = '#424242';
    const ironHighlight = '#BDBDBD';
    const goldTrim = '#FFD700';

    // Handle
    p(maceOX, maceOY + 5, '#3E2723', 2, 22); // Wooden grip
    p(maceOX, maceOY + 25, '#000', 3, 3); // Pommel

    // Mace Head (Hexagonal/Spiked)
    p(maceOX - 4, maceOY - 6, '#000', 10, 12); // Outline
    p(maceOX - 3, maceOY - 5, ironColor, 8, 10);
    p(maceOX - 1, maceOY - 5, ironHighlight, 3, 10); // Edge shine
    
    // Spikes
    const spikes = [[-5, -2], [-5, 4], [6, -2], [6, 4], [0, -7]];
    spikes.forEach(sp => p(maceOX + sp[0], maceOY + sp[1], ironColor, 2, 2));

    // Divine Seal on Mace
    p(maceOX - 1, maceOY - 1, goldTrim, 3, 3);

    // --- 3. IMPACT EFFECTS ---
    if (isAttacking) {
        // Holy Shockwave
        const waveSize = flashIntensity * 40;
        ctx.save();
        ctx.beginPath();
        const hitX = isLeft ? cx + (maceOX * S) : cx - (maceOX * S);
        const hitY = cy + (maceOY * S);
        ctx.arc(hitX, hitY, waveSize, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 215, 0, ${flashIntensity})`;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Impact Sparks
        for(let i=0; i<6; i++) {
            const ang = (i / 6) * Math.PI * 2 + time * 5;
            const dist = 10 + flashIntensity * 30;
            const px = Math.cos(ang) * dist;
            const py = Math.sin(ang) * dist;
            p(Math.round(maceOX + px/S), Math.round(maceOY + py/S), '#FFD700', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. SPIRITUAL AURA ---
    const auraPulse = (Math.sin(time * 2) + 1) / 2;
    for(let i=0; i<3; i++) {
        const py = -10 - (i * 5) - (time * 10 % 10);
        const px = Math.sin(time * 3 + i) * 4;
        p(Math.round(px), Math.round(py), `rgba(255, 179, 0, ${0.2 * auraPulse})`, 2, 2);
    }
}
function drawTalisman(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-5, -8, '#000', 30, 48);
    p(-4, -7, '#DAA520', 24, 42);
}
function drawArcher(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 350; 
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 350) : 0;

    // --- 1. BODY & ELVEN-STYLE ROBES (Emerald/White Palette) ---
    const robeColor = '#2E7D32'; // Emerald green
    const robeDetail = '#C8E6C9'; // Light mint/White
    const trimColor = '#FFD700'; // Gold trim
    
    // Tunic & Cape
    p(-5, 0, '#000', 11, 15); // Outline
    p(-4, 1, robeColor, 9, 13);
    p(-4, 1, robeDetail, 2, 11); // Cape shoulder
    p(-4, 11, '#1B5E20', 9, 3); // Bottom shadow
    
    // Belt
    p(-4, 7, '#3E2723', 9, 1);
    p(0, 7, trimColor, 1, 1); // Small gold buckle

    // Boots (Leather)
    p(-3, 14, '#000', 3, 3);
    p(1, 14, '#000', 3, 3);

    // Head & Hair (Long, Silver/White)
    const skinColor = '#F5DDC7';
    const hairColor = '#ECEFF1';
    p(-4, -10, '#000', 9, 10); // Head outline
    p(-3, -9, skinColor, 7, 7);
    
    // Silver Hair
    p(-4, -11, '#000', 9, 3); // Top outline
    p(-4, -11, hairColor, 9, 2);
    p(-4, -9, hairColor, 2, 8); // Side hair
    p(3, -9, hairColor, 2, 8);
    
    // Focused Eyes
    p(-2, -6, isAttacking ? '#00E5FF' : '#333', 1, 1);
    p(1, -6, isAttacking ? '#00E5FF' : '#333', 1, 1);

    // --- 2. DIVINE BOWL (Ornate & Blessed) ---
    // Bow draws back during attack
    let drawBack = isAttacking ? (1.0 - flashIntensity) * 6 : 0;
    let bowOX = 8;
    let bowOY = -12;
    
    const woodColor = '#5D4037';
    const bowString = '#B3E5FC';
    
    // Bow Limbs (Curved)
    p(bowOX, bowOY, '#000', 3, 24); // Main vertical
    p(bowOX - 1, bowOY - 1, '#000', 3, 3); // Upper curve
    p(bowOX - 2, bowOY - 2, '#000', 3, 2); 
    p(bowOX - 1, bowOY + 22, '#000', 3, 3); // Lower curve
    p(bowOX - 2, bowOY + 24, '#000', 3, 2);
    
    p(bowOX, bowOY + 1, woodColor, 2, 22);
    p(bowOX - 1, bowOY, woodColor, 1, 1);
    p(bowOX + 1, bowOY + 5, trimColor, 1, 14); // Gold inlay

    // Bow String
    const stringX = bowOX - drawBack;
    ctx.strokeStyle = bowString;
    ctx.lineWidth = S * 0.5;
    const sTopX = isLeft ? cx + (bowOX * S) : cx - (bowOX * S);
    const sBotX = isLeft ? cx + (bowOX * S) : cx - (bowOX * S);
    const sMidX = isLeft ? cx + (stringX * S) : cx - (stringX * S);
    
    ctx.beginPath();
    ctx.moveTo(sTopX, cy + (bowOY * S));
    ctx.lineTo(sMidX, cy + (cy + (bowOY + 12) * S - cy)); // Mid point where arrow sits
    ctx.lineTo(sBotX, cy + ((bowOY + 24) * S));
    ctx.stroke();

    // Arrow (During Attack)
    if (isAttacking) {
        const arrowX = bowOX - drawBack;
        p(arrowX - 4, bowOY + 11, '#ECEFF1', 8, 1); // Shaft
        p(arrowX + 4, bowOY + 11, '#00E5FF', 2, 1); // Tip
        
        // Firing Sparkle
        if (flashIntensity > 0.8) {
            ctx.save();
            ctx.shadowBlur = 30 * flashIntensity;
            ctx.shadowColor = '#00e5ff';
            p(arrowX + 5, bowOY + 10, '#fff', 3, 3);
            ctx.restore();
        }
    }

    // --- 3. AMBIENT NATURE MAGIC ---
    const leafGlow = (Math.sin(time * 2) + 1) / 2;
    for(let i=0; i<4; i++) {
        const py = -5 + Math.sin(time + i) * 15;
        const px = -12 + (i * 8);
        p(Math.round(px), Math.round(py), `rgba(76, 175, 80, ${0.15 * leafGlow})`, 2, 2);
    }
}
function drawAssassin(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 150; // Very fast attack
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 150) : 0;

    // --- 1. BODY & STEALTH GEAR (Charcoal / Dark Purple Palette) ---
    const armorColor = '#212121'; // Charcoal
    const leatherColor = '#311B92'; // Dark purple accents
    const highlightColor = '#424242';
    
    // Body / Suit
    p(-5, 1, '#000', 11, 14); // Outline
    p(-4, 2, armorColor, 9, 12);
    p(-2, 2, highlightColor, 3, 10); // Center highlight
    
    // Scarf / Mask (Flowing)
    const scarfColor = '#4A148C'; // Deep purple
    p(-5, -2, '#000', 11, 4); // Neck area
    p(-4, -1, scarfColor, 9, 2);
    // Flowing part of scarf
    const scarfWarp = Math.sin(time * 4) * 3;
    p(-8 + scarfWarp, 0, '#000', 4, 6);
    p(-7 + scarfWarp, 1, scarfColor, 2, 4);

    // Boots (Quiet)
    p(-4, 14, '#000', 3, 2);
    p(1, 14, '#000', 3, 2);

    // Head (Hooded)
    p(-4, -10, '#000', 9, 9); // Hood outline
    p(-3, -9, armorColor, 7, 7);
    p(-1, -9, scarfColor, 3, 1); // Top hood detail
    
    // Eyes (Faint purple glow)
    p(-2, -5, isAttacking ? '#E1BEE7' : '#7B1FA2', 1, 1);
    p(1, -5, isAttacking ? '#E1BEE7' : '#7B1FA2', 1, 1);

    // --- 2. DUAL BLADES (Tanto / Daggers) ---
    // Fast slashing motion
    let slashSwing = isAttacking ? flashIntensity * 12 : 0;
    
    // Left Blade (Reverse Grip)
    const bladeColor = '#757575';
    const bladeEdge = '#E0E0E0';
    
    p(-9 - slashSwing, 4, '#000', 4, 3); // Hilt
    p(-12 - slashSwing, 5, bladeColor, 4, 1); // Blade
    p(-12 - slashSwing, 6, bladeEdge, 4, 1); // Sharp edge

    // Right Blade (Forward Grip)
    p(6 + slashSwing, 4, '#000', 4, 3); // Hilt
    p(9 + slashSwing, 3, bladeColor, 5, 1); // Blade
    p(9 + slashSwing, 4, bladeEdge, 5, 1); // Sharp edge

    // --- 3. ATTACK EFFECTS (Shadow Slash) ---
    if (isAttacking) {
        ctx.save();
        // Blur trail
        const trailX = isLeft ? cx + (12 * S) : cx - (12 * S);
        const trailY = cy + (4 * S);
        
        ctx.shadowBlur = 20 * flashIntensity;
        ctx.shadowColor = '#9C27B0';
        
        // Fast Slash Arc
        ctx.strokeStyle = `rgba(156, 39, 176, ${flashIntensity})`;
        ctx.lineWidth = 4 * S;
        ctx.beginPath();
        ctx.arc(cx, cy + 4*S, 15*S, -0.2, 0.2);
        ctx.stroke();
        
        // Shadow Particles
        for(let i=0; i<5; i++) {
            const px = (Math.random() - 0.5) * 40;
            const py = (Math.random() - 0.5) * 40;
            p(Math.round(px/S), Math.round(py/S), '#4A148C', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. STEALTH SMOKE ---
    const smokePhase = (time * 2) % (Math.PI * 2);
    for(let i=0; i<3; i++) {
        const py = 12 - (i * 4) - (time * 5 % 10);
        const px = Math.sin(time * 4 + i) * 6;
        p(Math.round(px), Math.round(py), `rgba(30, 30, 30, ${0.2 * (1 - (i/3))})`, 2, 2);
    }
}
function drawGuardian(cx, cy, tower) {
    const p = (ox, oy, color, w=3, h=3) => { ctx.fillStyle = color; ctx.fillRect(cx + ox*3, cy + oy*3, w, h); };
    p(-6, -9, '#000', 36, 54);
    p(-5, -8, '#C0C0C0', 30, 48);
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
    const radius = ((rect.width * scaleX) / 2) + 12 + (pulse * 6);
    
    ctx.save();
    ctx.imageSmoothingEnabled = true; 
    
    // Outer glow
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + 0.3 * pulse})`;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Inner markings
    ctx.strokeStyle = '#ffd700';
    const markSize = 6;
    ctx.fillRect(cx - 1.5, cy - radius - markSize, 3, markSize * 2); 
    ctx.fillRect(cx - 1.5, cy + radius - markSize, 3, markSize * 2); 
    ctx.fillRect(cx - radius - markSize, cy - 1.5, markSize * 2, 3); 
    ctx.fillRect(cx + radius - markSize, cy - 1.5, markSize * 2, 3); 

    ctx.restore();
    disableSmoothing();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGraphics);
} else {
    initGraphics();
}
