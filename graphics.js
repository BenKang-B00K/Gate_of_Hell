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
            case 'knight': drawKnight(cx, cy, tower); break;
            case 'alchemist': drawAlchemist(cx, cy, tower); break;
            case 'mirror': drawMirror(cx, cy, tower); break;
            case 'paladin': drawPaladin(cx, cy, tower); break;
            case 'crusader': drawCrusader(cx, cy, tower); break;
            case 'midas': drawMidas(cx, cy, tower); break;
            case 'illusion': drawIllusion(cx, cy, tower); break;
            case 'philosopher': drawPhilosopher(cx, cy, tower); break;
            case 'reflection': drawReflection(cx, cy, tower); break;
            case 'flamemaster': drawFlameMaster(cx, cy, tower); break;
            case 'voidsniper': drawVoidSniper(cx, cy, tower); break;
            case 'vajra': drawVajrapani(cx, cy, tower); break;
            case 'absolutezero': drawAbsoluteZero(cx, cy, tower); break;
            case 'hellfire': drawHellfireAlchemist(cx, cy, tower); break;
            case 'phoenix': drawPhoenixSummoner(cx, cy, tower); break;
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
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & SCOUTING ROBES (Forest Green / Leather) ---
    const robeColor = '#33691E'; // Forest green
    const leatherColor = '#5D4037'; // Dark leather
    const trimColor = '#9E9D24'; // Lime/Olive detail
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-1, 1, trimColor, 2, 11); // Center vertical strap
    p(-5, 11, '#1B5E20', 11, 3); // Bottom shadow
    
    // Utility Belt
    p(-5, 7, '#000', 11, 2);
    p(-4, 7, leatherColor, 3, 1); // Pouch L
    p(2, 7, leatherColor, 3, 1); // Pouch R

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Scouting Gear (Monocle/Headlamp hint)
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Hood/Turban
    p(-4, -10, '#000', 9, 4);
    p(-4, -10, robeColor, 9, 3);
    
    // The Tracker's Monocle (Glowing)
    const eyeGlow = isAttacking ? '#FFF' : '#CDDC39';
    p(1, -6, '#000', 3, 3);
    p(2, -5, eyeGlow, 1, 1);

    // --- 2. THE SPIRIT LANTERN (Beacon of Guidance) ---
    // Lantern hangs or floats
    let lanternFloat = Math.sin(time * 2.5) * 4;
    let lanOX = isAttacking ? 10 : 8;
    let lanOY = -6 + lanternFloat;
    
    const goldColor = '#FBC02D';
    
    // Lantern Frame
    p(lanOX - 2, lanOY - 4, '#000', 5, 10); // Outer frame
    p(lanOX - 1, lanOY - 3, goldColor, 3, 8);
    
    // Glass/Core
    const coreColor = isAttacking ? '#FFF' : '#FFF59D';
    p(lanOX, lanOY - 1, coreColor, 1, 4); 
    
    // Support Arm/Chain
    p(lanOX - 4, lanOY - 2, '#333', 3, 1);

    // --- 3. GUIDANCE BEAM (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = '#FBC02D';
        
        // Searching Cone
        const coneX = isLeft ? cx + (lanOX * S) : cx - (lanOX * S);
        const coneY = cy + (lanOY * S);
        
        ctx.fillStyle = `rgba(255, 235, 59, ${0.2 * flashIntensity})`;
        ctx.beginPath();
        ctx.moveTo(coneX, coneY);
        ctx.lineTo(coneX + 150 * (isLeft?1:-1), coneY - 80);
        ctx.lineTo(coneX + 150 * (isLeft?1:-1), coneY + 80);
        ctx.fill();
        
        // Light Particles
        for(let i=0; i<6; i++) {
            const px = lanOX + (Math.random() * 20);
            const py = lanOY + (Math.random() - 0.5) * 20;
            p(Math.round(px), Math.round(py), '#FFFDE7', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. AMBIENT SCANNING PULSE ---
    const scanPulse = (Math.sin(time * 1.5) + 1) / 2;
    ctx.strokeStyle = `rgba(205, 220, 57, ${0.1 * scanPulse})`;
    ctx.lineWidth = 2 * S;
    ctx.beginPath();
    ctx.arc(cx, cy, 30 * S + (scanPulse * 10 * S), 0, Math.PI * 2);
    ctx.stroke();
}
function drawNecromancer(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & BONE-ADORNED ROBES (Purple / Bone / Black Palette) ---
    const robeColor = '#4A148C'; // Dark purple
    const boneColor = '#E0E0E0'; // Bone white
    const shadowColor = '#212121'; // Black shadow
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-5, 11, shadowColor, 11, 3);
    
    // Ribcage Detail (Bone decor)
    p(-4, 3, boneColor, 9, 1);
    p(-3, 5, boneColor, 7, 1);
    p(-2, 7, boneColor, 5, 1);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Hood (Skull Face)
    p(-4, -10, '#000', 9, 10); // Hood outline
    p(-3, -9, robeColor, 7, 9);
    p(-2, -7, boneColor, 5, 6); // Skull mask
    p(-1, -5, '#000', 1, 1); // Eye socket L
    p(1, -5, '#000', 1, 1);  // Eye socket R

    // --- 2. THE SKULL STAFF (Soul Conduit) ---
    let staffOX = isAttacking ? 9 : 7;
    let staffOY = -12;
    
    const woodColor = '#3E2723';
    
    // Staff Handle
    p(staffOX, staffOY, '#000', 3, 26);
    p(staffOX + 1, staffOY, woodColor, 1, 26);
    
    // Staff Head (Skull)
    p(staffOX - 2, staffOY - 4, '#000', 7, 7);
    p(staffOX - 1, staffOY - 3, boneColor, 5, 5);
    p(staffOX, staffOY - 2, '#000', 1, 1); // Skull eye L
    p(staffOX + 2, staffOY - 2, '#000', 1, 1); // Skull eye R
    
    // Spectral Flame on Staff
    const flameGlow = (Math.sin(time * 4) + 1) / 2;
    p(staffOX, staffOY - 6 - (time*10 % 5), `rgba(156, 39, 176, ${0.4 * flameGlow})`, 3, 3);

    // --- 3. SPECTRAL SUMMON (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 30 * flashIntensity;
        ctx.shadowColor = '#9C27B0';
        
        // Ethereal Mist
        const mistX = isLeft ? cx + (staffOX * S) : cx - (staffOX * S);
        const mistY = cy + (staffOY * S);
        
        ctx.fillStyle = `rgba(156, 39, 176, ${0.3 * flashIntensity})`;
        ctx.beginPath();
        ctx.moveTo(mistX, mistY);
        ctx.quadraticCurveTo(mistX + 50*(isLeft?1:-1), mistY - 40, mistX + 100*(isLeft?1:-1), mistY - 10);
        ctx.arc(mistX + 100*(isLeft?1:-1), mistY - 10, 10 * S, 0, Math.PI * 2);
        ctx.fill();
        
        // Soul Sparks
        for(let i=0; i<6; i++) {
            const sang = (i / 6) * Math.PI * 2 + time * 5;
            const sdist = 20 * flashIntensity;
            const sx = staffOX + Math.cos(sang) * sdist/S;
            const sy = staffOY + Math.sin(sang) * sdist/S;
            p(Math.round(sx), Math.round(sy), '#E1BEE7', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. ABYSSAL AURA ---
    const abyssPulse = (Math.sin(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(74, 20, 140, ${0.08 * abyssPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy + 5 * S, 32 * S, 0, Math.PI * 2);
    ctx.fill();
}
function drawChainer(cx, cy, tower) {
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

    // --- 1. BODY & MYSTICAL ROBES (Deep Purple / Indigo / Silver Palette) ---
    const robeColor = '#311B92'; // Deep indigo
    const sashColor = '#6200EA'; // Vibrant purple
    const detailColor = '#B0BEC5'; // Silver/Grey bandages
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-5, 11, '#1A237E', 11, 3); // Bottom shadow
    
    // Bandages/Wrappings
    p(-5, 4, detailColor, 11, 1);
    p(-5, 8, detailColor, 11, 1);
    
    // Center Medallion
    p(-1, 5, '#000', 3, 3);
    p(0, 6, '#00E5FF', 1, 1); // Glowing cyan core

    // Boots (Dark)
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head (Hooded & Masked)
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, robeColor, 7, 7); // Hood interior
    
    // Soul Mask
    p(-2, -6, '#FFF', 5, 5); // White mask base
    p(-1, -5, '#000', 1, 1); // Eye L
    p(1, -5, '#000', 1, 1);  // Eye R

    // --- 2. SPIRITUAL CHAINS (Ethereal Shackles) ---
    const chainColor = isAttacking ? '#00E5FF' : '#7986CB';
    const chainLinks = 5;
    
    for(let i=0; i<2; i++) {
        const side = i === 0 ? -1 : 1;
        const phase = time * 3 + (i * Math.PI);
        
        for(let j=0; j<chainLinks; j++) {
            const jPhase = phase + (j * 0.5);
            const cxo = (side * 12) + Math.sin(jPhase) * 3;
            const cyo = -2 + (j * 4) + Math.cos(jPhase) * 2;
            
            p(Math.round(cxo), Math.round(cyo), '#000', 3, 3); // Link outline
            p(Math.round(cxo + 0.5), Math.round(cyo + 0.5), chainColor, 2, 2);
        }
    }

    // --- 3. BINDING BURST (Attack) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = '#00E5FF';
        
        // Chain Strike Energy
        const burstSize = 25 * flashIntensity;
        const bX = isLeft ? cx + (15 * S) : cx - (15 * S);
        const bY = cy + (5 * S);
        
        ctx.strokeStyle = `rgba(0, 229, 255, ${flashIntensity})`;
        ctx.lineWidth = 2 * S;
        ctx.beginPath();
        ctx.arc(bX, bY, burstSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // Ethereal Sparks
        for(let i=0; i<8; i++) {
            const ang = (i / 8) * Math.PI * 2 + time * 10;
            const dist = 10 + flashIntensity * 30;
            const px = 15 + Math.cos(ang) * dist/S;
            const py = 5 + Math.sin(ang) * dist/S;
            p(Math.round(px), Math.round(py), '#E1F5FE', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. AMBIENT SOUL MIST ---
    const mistGlow = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(103, 58, 183, ${0.1 * mistGlow})`;
    ctx.beginPath();
    ctx.arc(cx, cy + 5 * S, 30 * S, 0, Math.PI * 2);
    ctx.fill();
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

    // --- 1. BODY & TRADITIONAL ROBES (Yellow / Brown / Black Palette) ---
    const robeColor = '#FFD54F'; // Golden yellow
    const detailColor = '#3E2723'; // Dark brown leather/trim
    const patternColor = '#F44336'; // Red seal marks
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-1, 1, detailColor, 2, 11); // Center sash
    p(-5, 11, '#FBC02D', 11, 3); // Bottom shadow
    
    // Seal Patterns on Robe
    p(-4, 3, patternColor, 1, 3);
    p(3, 3, patternColor, 1, 3);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Traditional Cap
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Cap (Black with Gold trim)
    p(-3, -11, '#000', 7, 4);
    p(-3, -11, '#212121', 7, 3);
    p(-1, -10, '#FFD700', 3, 1); // Center gold emblem

    // Face (Focused)
    p(-2, -5, '#333', 1, 1);
    p(2, -5, '#333', 1, 1);

    // --- 2. FLOATING TALISMANS (Explosive Seals) ---
    const talismanCount = 3;
    for(let i=0; i<talismanCount; i++) {
        const ang = (time * 2) + (i * (Math.PI * 2 / talismanCount));
        const floatY = Math.sin(time * 3 + i) * 3;
        const dist = 14 + (isAttacking ? flashIntensity * 10 : 0);
        
        let tx = Math.cos(ang) * dist;
        let ty = -5 + Math.sin(ang) * (dist * 0.5) + floatY;
        
        // Talisman Paper (Yellow with Red Script)
        p(Math.round(tx - 1), Math.round(ty - 3), '#000', 4, 7); // Outline
        p(Math.round(tx), Math.round(ty - 2), '#FFF59D', 2, 5); // Base
        p(Math.round(tx), Math.round(ty - 1), '#F44336', 2, 3); // Red Script
    }

    // --- 3. EXPLOSIVE SEAL BURST (Attack) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 45 * flashIntensity;
        ctx.shadowColor = '#F44336';
        
        // Energy Burst
        const burstSize = 18 * flashIntensity;
        ctx.fillStyle = `rgba(255, 235, 59, ${flashIntensity})`;
        ctx.beginPath();
        ctx.arc(cx + (10 * S * (isLeft?1:-1)), cy - 5 * S, burstSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Flying Scripts
        for(let i=0; i<8; i++) {
            const sang = (i / 8) * Math.PI * 2 + time * 5;
            const sdist = 20 * flashIntensity;
            const sx = 10 + Math.cos(sang) * sdist;
            const sy = -5 + Math.sin(sang) * sdist;
            p(Math.round(sx), Math.round(sy), '#F44336', 1, 2);
        }
        ctx.restore();
    }

    // --- 4. AMBIENT SEAL GLOW ---
    const glow = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(255, 215, 0, ${0.05 * glow})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 28 * S, 0, Math.PI * 2);
    ctx.fill();
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
function drawKnight(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 250; 
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 250) : 0;

    // --- 1. BODY & PLATE ARMOR (Silver / Blue Palette) ---
    const armorColor = '#90A4AE'; // Silver steel
    const highlightColor = '#CFD8DC'; // Polished steel
    const trimColor = '#1565C0'; // Blue cloth detail
    
    // Chestplate & Spaulders
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, armorColor, 11, 13);
    p(-2, 1, highlightColor, 3, 11); // Center shine
    p(-5, 1, trimColor, 2, 2); // Left shoulder detail
    p(4, 1, trimColor, 2, 2);  // Right shoulder detail
    
    // Tassets / Faulds
    p(-5, 11, '#455A64', 11, 3);
    
    // Gauntlets
    p(-8, 4, '#000', 4, 6);
    p(-7, 5, armorColor, 2, 4);
    p(5, 4, '#000', 4, 6);
    p(6, 5, armorColor, 2, 4);

    // Boots (Sabatons)
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head (Knightly Helm with Visor)
    p(-4, -9, '#000', 9, 10); 
    p(-3, -8, armorColor, 7, 8);
    p(-3, -5, '#263238', 7, 1); // Visor slit
    p(-1, -11, highlightColor, 3, 2); // Top crest
    
    // Blue Plume
    const plumeWarp = Math.sin(time * 3) * 2;
    p(-1 + plumeWarp, -14, '#0D47A1', 3, 4);

    // --- 2. BLESSED BROADSWORD (Holy Edge) ---
    // Sword swings during attack
    let swordOX = isAttacking ? 10 : 8;
    let swordOY = isAttacking ? -18 : -14;
    
    const bladeColor = '#ECEFF1';
    const goldColor = '#FFD700';

    // Guard & Hilt
    p(swordOX - 3, swordOY + 20, goldColor, 7, 2); // Crossguard
    p(swordOX - 1, swordOY + 22, '#5D4037', 3, 5); // Leather grip
    p(swordOX - 1, swordOY + 27, goldColor, 3, 2); // Pommel

    // Blade
    p(swordOX - 1, swordOY, '#000', 3, 20); // Blade outline
    p(swordOX, swordOY + 1, bladeColor, 1, 18); // Blade core
    p(swordOX - 1, swordOY + 1, highlightColor, 1, 18); // Left edge
    p(swordOX + 1, swordOY + 1, highlightColor, 1, 18); // Right edge

    // --- 3. SLASH EFFECT (Divine Strike) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 35 * flashIntensity;
        ctx.shadowColor = '#fff';
        
        // Arc Swing
        ctx.strokeStyle = `rgba(255, 255, 255, ${flashIntensity})`;
        ctx.lineWidth = 6 * S;
        ctx.beginPath();
        ctx.arc(cx, cy, 25 * S, -0.3, 0.3);
        ctx.stroke();
        
        // Holy Sparks
        for(let i=0; i<6; i++) {
            const sang = (i / 6) * Math.PI * 2 + time * 8;
            const sdist = 20 + flashIntensity * 25;
            const sx = Math.cos(sang) * sdist;
            const sy = Math.sin(sang) * sdist;
            p(Math.round(sx/S), Math.round(sy/S), '#FFD700', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. VALOR AURA ---
    const auraStep = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.05 * auraStep})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 32 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawGuardian(cx, cy, tower) {
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

    // --- 1. BODY & HEAVY ARMOR (Gold / White / Silver Palette) ---
    const armorColor = '#FFD54F'; // Radiant gold
    const plateColor = '#F5F5F5'; // Holy white plates
    const glowColor = '#00E5FF'; // Ethereal cyan glow
    
    // Heavy Body
    p(-7, -2, '#000', 15, 18); // Outline
    p(-6, -1, armorColor, 13, 16);
    p(-3, -1, plateColor, 7, 14); // White center chest
    
    // Massive Pauldrons
    p(-9, -2, '#000', 5, 6);
    p(-8, -1, armorColor, 3, 4);
    p(5, -2, '#000', 5, 6);
    p(6, -1, armorColor, 3, 4);

    // Boots (Heavy Greaves)
    p(-5, 14, '#000', 5, 4);
    p(1, 14, '#000', 5, 4);

    // Head (Great Helm with Halo)
    p(-4, -10, '#000', 9, 9); 
    p(-3, -9, plateColor, 7, 7);
    p(-1, -7, glowColor, 3, 1); // Eye visor glow
    
    // The Halo
    const haloGlow = (Math.sin(time * 2) + 1) / 2;
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + 0.3 * haloGlow})`;
    ctx.lineWidth = 2 * S;
    ctx.beginPath();
    ctx.arc(cx, cy - 8 * S, 12 * S, 0, Math.PI * 2);
    ctx.stroke();

    // --- 2. THE HOLY SHIELD (Sanctuary Aegis) ---
    let shieldOX = isAttacking ? -12 : -10;
    let shieldOY = -5;
    
    // Shield Base
    p(shieldOX - 2, shieldOY - 4, '#000', 9, 16); // Outline
    p(shieldOX - 1, shieldOY - 3, plateColor, 7, 14);
    p(shieldOX, shieldOY - 1, armorColor, 5, 10); // Gold center cross
    p(shieldOX + 2, shieldOY + 3, glowColor, 1, 2); // Gem

    // --- 3. BANISHMENT BLAST (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = '#00E5FF';
        
        // Holy Shockwave from shield
        const waveX = isLeft ? cx + (shieldOX * S) : cx - (shieldOX * S);
        const waveY = cy + (shieldOY + 4) * S;
        
        ctx.fillStyle = `rgba(0, 229, 255, ${0.2 * flashIntensity})`;
        ctx.beginPath();
        ctx.arc(waveX, waveY, 30 * flashIntensity * S, 0, Math.PI * 2);
        ctx.fill();
        
        // Golden Particles
        for(let i=0; i<8; i++) {
            const sang = (i / 8) * Math.PI * 2;
            const sdist = 20 * flashIntensity;
            const sx = shieldOX + Math.cos(sang) * sdist;
            const sy = shieldOY + 4 + Math.sin(sang) * sdist;
            p(Math.round(sx), Math.round(sy), '#FFD700', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. SANCTUARY AURA ---
    const auraPulse = (Math.cos(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(0, 229, 255, ${0.05 * auraPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 35 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawAlchemist(cx, cy, tower) {
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

    // --- 1. BODY & SCHOLAR ROBES (Teal / Bronze / Brown Palette) ---
    const robeColor = '#00695C'; // Deep teal
    const leatherColor = '#5D4037'; // Bronze/Brown leather
    const chemicalColor = '#76FF03'; // Toxic green glow
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-5, 11, '#004D40', 11, 3); // Shadow
    
    // Bandolier & Pouches
    p(-5, 4, leatherColor, 11, 2); // Strap
    p(2, 4, '#FFD700', 2, 2); // Gold vial holder

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Alchemist Cap
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // Protective Cap & Goggles
    p(-4, -10, '#3E2723', 9, 3); // Cap
    p(-3, -6, '#212121', 7, 3); // Goggle frame
    p(-2, -5, chemicalColor, 2, 1); // Goggle lens L
    p(1, -5, chemicalColor, 2, 1);  // Goggle lens R

    // --- 2. ALCHEMICAL FLASK (Transmutation Vessel) ---
    let flaskFloat = Math.sin(time * 4) * 2;
    let flaOX = isAttacking ? 9 : 7;
    let flaOY = -5 + flaskFloat;
    
    // Flask Shape (Round bottom)
    p(flaOX - 2, flaOY - 3, '#000', 6, 8); // Outline
    p(flaOX - 1, flaOY - 2, '#CFD8DC', 4, 6); // Glass
    p(flaOX - 1, flaOY + 1, chemicalColor, 4, 3); // Liquid
    p(flaOX, flaOY - 3, '#5D4037', 2, 2); // Cork

    // --- 3. ESSENCE TRANSMUTATION (Attack) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 30 * flashIntensity;
        ctx.shadowColor = '#76FF03';
        
        // Chemical Cloud
        const cloudX = isLeft ? cx + (flaOX * S) : cx - (flaOX * S);
        const cloudY = cy + (flaOY * S);
        
        for(let i=0; i<5; i++) {
            const sang = (i / 5) * Math.PI * 2 + time * 5;
            const sdist = 10 + flashIntensity * 25;
            const sx = flaOX + Math.cos(sang) * sdist/S;
            const sy = flaOY + Math.sin(sang) * sdist/S;
            ctx.fillStyle = `rgba(118, 255, 3, ${0.4 * flashIntensity})`;
            ctx.beginPath();
            ctx.arc(cx + sx*S*(isLeft?1:-1), cy + sy*S, 6 * S, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // --- 4. TOXIC VAPOR AURA ---
    const vaporGlow = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(118, 255, 3, ${0.03 * vaporGlow})`;
    ctx.beginPath();
    ctx.arc(cx, cy + 5 * S, 28 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawMirror(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & ORACLE ROBES (Ethereal White / Violet Palette) ---
    const robeColor = '#EDE7F6'; // Off-white/Violet tint
    const trimColor = '#9575CD'; // Light purple
    const detailColor = '#00BCD4'; // Cyan magic detail
    
    // Flowing Robes
    p(-7, 0, '#000', 15, 16); // Outline
    p(-6, 1, robeColor, 13, 14);
    p(-6, 1, trimColor, 2, 14); // Sleeve edge L
    p(5, 1, trimColor, 2, 14);  // Sleeve edge R
    p(-2, 1, detailColor, 3, 11); // Center mystical embroidery
    
    // Sash
    p(-6, 7, '#512DA8', 13, 2);

    // Boots (White)
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Oracle Veil
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Veil/Headband
    p(-4, -10, trimColor, 9, 3);
    p(-1, -9, '#FFF', 3, 1); // Forehead gem
    
    // Long Ethereal Hair
    const hairColor = '#B2EBF2';
    p(-5, -7, hairColor, 2, 12);
    p(4, -7, hairColor, 2, 12);

    // --- 2. THE SPIRIT MIRROR (Reflective Artifact) ---
    let mirrorFloat = Math.cos(time * 2) * 5;
    let mirOX = isAttacking ? 12 : 10;
    let mirOY = -5 + mirrorFloat;
    
    // Mirror Frame (Circular)
    ctx.save();
    const mX = isLeft ? cx + (mirOX * S) : cx - (mirOX * S);
    const mY = cy + (mirOY * S);
    
    // Outline
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(mX, mY, 10 * S, 0, Math.PI * 2);
    ctx.fill();
    
    // Silver Frame
    ctx.fillStyle = '#BDBDBD';
    ctx.beginPath();
    ctx.arc(mX, mY, 9 * S, 0, Math.PI * 2);
    ctx.fill();
    
    // Glass (Cyan reflective)
    ctx.fillStyle = '#E0F7FA';
    ctx.beginPath();
    ctx.arc(mX, mY, 7 * S, 0, Math.PI * 2);
    ctx.fill();
    
    // Reflection Shine
    const sPhase = (time * 2) % (Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
    ctx.beginPath();
    ctx.moveTo(mX - 5*S, mY - 5*S + Math.sin(sPhase)*2*S);
    ctx.lineTo(mX + 5*S, mY + 5*S + Math.sin(sPhase)*2*S);
    ctx.lineWidth = 2 * S;
    ctx.stroke();
    ctx.restore();

    // --- 3. REFLECTION BOUNCE (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 35 * flashIntensity;
        ctx.shadowColor = '#00BCD4';
        
        // Prism Blast
        const blastX = isLeft ? cx + (mirOX * S) : cx - (mirOX * S);
        const blastY = cy + (mirOY * S);
        
        ctx.strokeStyle = `rgba(0, 188, 212, ${flashIntensity})`;
        ctx.lineWidth = 3 * S;
        for(let i=0; i<3; i++) {
            const ang = (i / 3) * Math.PI * 2 + time * 3;
            ctx.beginPath();
            ctx.moveTo(blastX, blastY);
            ctx.lineTo(blastX + Math.cos(ang)*40*flashIntensity, blastY + Math.sin(ang)*40*flashIntensity);
            ctx.stroke();
        }
        ctx.restore();
    }

    // --- 4. COSMIC AURA ---
    const cosmicPulse = (Math.sin(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(149, 117, 205, ${0.05 * cosmicPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 32 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawPaladin(cx, cy, tower) {
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

    // --- 1. BODY & HOLY ARMOR (Bright Gold / White Palette) ---
    const armorColor = '#FFD700'; // Pure gold
    const plateColor = '#FFFFFF'; // Holy white
    const highlightColor = '#FFF9C4'; // Pale yellow shine
    
    // Plate Body
    p(-7, -1, '#000', 15, 17); // Outline
    p(-6, 0, armorColor, 13, 15);
    p(-3, 0, plateColor, 7, 13); // White center
    
    // Large Pauldrons
    p(-9, -1, '#000', 5, 6);
    p(-8, 0, armorColor, 3, 4);
    p(5, -1, '#000', 5, 6);
    p(6, 0, armorColor, 3, 4);

    // Boots
    p(-5, 14, '#000', 5, 4);
    p(1, 14, '#000', 5, 4);

    // Head (Winged Helm)
    p(-4, -10, '#000', 9, 10); 
    p(-3, -9, armorColor, 7, 8);
    p(-1, -7, '#00E5FF', 3, 1); // Cyan visor glow
    // Wings on Helm
    p(-6, -11, plateColor, 3, 5);
    p(4, -11, plateColor, 3, 5);

    // --- 2. BLESSED HAMMER (Sun-Breaker) ---
    let hammerOX = isAttacking ? 12 : 9;
    let hammerOY = isAttacking ? -15 : -10;
    
    // Handle
    p(hammerOX, hammerOY + 5, '#5D4037', 2, 22);
    
    // Hammer Head
    p(hammerOX - 4, hammerOY - 4, '#000', 10, 10); // Outline
    p(hammerOX - 3, hammerOY - 3, armorColor, 8, 8);
    p(hammerOX - 1, hammerOY - 3, highlightColor, 3, 8); // Face shine
    p(hammerOX, hammerOY, '#FFF', 2, 2); // Core gem

    // --- 3. HOLY SMITE (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = '#FFD700';
        
        // Radiant Impact
        const hitX = isLeft ? cx + (hammerOX * S) : cx - (hammerOX * S);
        const hitY = cy + (hammerOY * S);
        
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * flashIntensity})`;
        ctx.beginPath();
        ctx.arc(hitX, hitY, 35 * flashIntensity * S, 0, Math.PI * 2);
        ctx.fill();
        
        // Cross Sparks
        for(let i=0; i<4; i++) {
            const sang = (i / 4) * Math.PI * 2;
            const sdist = 25 * flashIntensity;
            const sx = hammerOX + Math.cos(sang) * sdist/S;
            const sy = hammerOY + Math.sin(sang) * sdist/S;
            p(Math.round(sx), Math.round(sy), '#FFF', 2, 2);
        }
        ctx.restore();
    }

    // --- 4. DIVINE AURA ---
    const auraGlow = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(255, 215, 0, ${0.1 * auraGlow})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 35 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawCrusader(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 250; 
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 250) : 0;

    // --- 1. BODY & CRIMSON ARMOR (Dark Steel / Blood Red Palette) ---
    const armorColor = '#263238'; // Dark steel
    const bloodColor = '#B71C1C'; // Deep red
    const capeColor = '#7F0000';
    
    // Armor Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, armorColor, 11, 13);
    p(-5, 1, bloodColor, 2, 13); // Side detail
    p(4, 1, bloodColor, 2, 13);
    
    // Tattered Cape
    const capeWarp = Math.sin(time * 3) * 3;
    p(-8 + capeWarp, 2, '#000', 4, 15);
    p(-7 + capeWarp, 3, capeColor, 2, 13);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head (Executioner Helm)
    p(-4, -10, '#000', 9, 10); 
    p(-3, -9, armorColor, 7, 8);
    p(-1, -7, '#FF1744', 3, 1); // Red eye slit

    // --- 2. EXECUTIONER SWORD (Blood-Seeker) ---
    let swordOX = isAttacking ? 11 : 8;
    let swordOY = isAttacking ? -18 : -14;
    
    const metalColor = '#455A64';
    const edgeColor = '#B71C1C';

    // Guard
    p(swordOX - 3, swordOY + 18, '#000', 7, 3);
    p(swordOX - 1, swordOY + 21, '#212121', 3, 6); // Grip

    // Heavy Blade
    p(swordOX - 2, swordOY, '#000', 5, 18); // Outline
    p(swordOX - 1, swordOY + 1, metalColor, 3, 16);
    p(swordOX + 1, swordOY + 1, edgeColor, 1, 16); // Bloody edge

    // --- 3. BLOOD SLASH (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 35 * flashIntensity;
        ctx.shadowColor = '#FF0000';
        
        // Crimson Arc
        ctx.strokeStyle = `rgba(183, 28, 28, ${flashIntensity})`;
        ctx.lineWidth = 8 * S;
        ctx.beginPath();
        ctx.arc(cx, cy, 28 * S, -0.4, 0.4);
        ctx.stroke();
        
        // Blood Droplets
        for(let i=0; i<8; i++) {
            const sang = (i / 8) * Math.PI * 2 + time * 10;
            const sdist = 20 + flashIntensity * 30;
            const sx = Math.cos(sang) * sdist;
            const sy = Math.sin(sang) * sdist;
            p(Math.round(sx/S), Math.round(sy/S), '#D32F2F', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. DREAD AURA ---
    const dreadStep = (Math.cos(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(183, 28, 28, ${0.05 * dreadStep})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 32 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawMidas(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & OPULENT ROBES (Gold / Purple Palette) ---
    const goldColor = '#FFD700';
    const purpleColor = '#4A148C';
    const silkColor = '#9575CD';
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, purpleColor, 11, 13);
    p(-5, 1, goldColor, 1, 13); // Gold side trim
    p(5, 1, goldColor, 1, 13);
    
    // Golden Jewelry
    p(-3, 4, goldColor, 7, 2); // Heavy necklace

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Royal Turban
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Turban (Purple/Gold)
    p(-4, -11, '#000', 9, 4);
    p(-3, -10, silkColor, 7, 3);
    p(-1, -11, goldColor, 3, 2); // Center jewel holder
    p(0, -11, '#FF5252', 1, 1);  // Red ruby

    // --- 2. THE GOLDEN SCEPTER (Midas Touch) ---
    let scepterOX = isAttacking ? 10 : 8;
    let scepterOY = -12;
    
    // Staff
    p(scepterOX, scepterOY, '#000', 3, 26);
    p(scepterOX + 1, scepterOY, goldColor, 1, 26);
    
    // Scepter Head (Large Coin)
    p(scepterOX - 3, scepterOY - 5, '#000', 9, 9); // Outline
    p(scepterOX - 2, scepterOY - 4, goldColor, 7, 7);
    p(scepterOX, scepterOY - 2, '#B8860B', 1, 3); // Engraving

    // --- 3. COIN BURST (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 30 * flashIntensity;
        ctx.shadowColor = '#FFD700';
        
        // Golden Explosion
        const blastX = isLeft ? cx + (scepterOX * S) : cx - (scepterOX * S);
        const blastY = cy + (scepterOY * S);
        
        ctx.fillStyle = `rgba(255, 215, 0, ${0.4 * flashIntensity})`;
        ctx.beginPath();
        ctx.arc(blastX, blastY, 20 * flashIntensity * S, 0, Math.PI * 2);
        ctx.fill();
        
        // Flying Coins
        for(let i=0; i<6; i++) {
            const ang = (i / 6) * Math.PI * 2 + time * 10;
            const dist = 10 + flashIntensity * 30;
            const cxo = scepterOX + Math.cos(ang) * dist/S;
            const cyo = scepterOY + Math.sin(ang) * dist/S;
            p(Math.round(cxo), Math.round(cyo), goldColor, 2, 2);
        }
        ctx.restore();
    }

    // --- 4. WEALTH AURA ---
    const wealthPulse = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(255, 215, 0, ${0.08 * wealthPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 30 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawIllusion(cx, cy, tower) {
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

    // --- 1. BODY & MYSTICAL ROBES (Magenta / Violet Palette) ---
    const robeColor = '#880E4F'; // Deep magenta/purple
    const silkColor = '#E91E63'; // Bright pink/magenta
    const trimColor = '#F48FB1'; // Light pink trim
    
    // Flowing Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    
    // Sash & Layering
    p(-5, 3, silkColor, 11, 2);
    p(-5, 7, silkColor, 11, 3);
    p(-2, 1, trimColor, 3, 12); // Center trim

    // Ethereal Boots (Fading into shadow)
    p(-4, 14, '#311B92', 4, 3);
    p(1, 14, '#311B92', 4, 3);

    // Head & Illusionist Veil
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Mask/Veil (Half-face covered)
    p(-4, -4, '#000', 9, 4); // Mask outline
    p(-3, -3, silkColor, 7, 2);
    
    // Glowing Eyes
    p(-2, -6, isAttacking ? '#FF4081' : '#F48FB1', 1, 1);
    p(1, -6, isAttacking ? '#FF4081' : '#F48FB1', 1, 1);

    // --- 2. FLOATING MASKS (Illusion Foci) ---
    const maskCount = 3;
    for(let i=0; i<maskCount; i++) {
        const ang = (time * 1.5) + (i * (Math.PI * 2 / maskCount));
        const floatY = Math.sin(time * 3 + i) * 4;
        const dist = 15 + (isAttacking ? flashIntensity * 8 : 0);
        
        let mx = Math.cos(ang) * dist;
        let my = -5 + Math.sin(ang) * (dist * 0.4) + floatY;
        
        // Theatre Mask
        p(Math.round(mx - 2), Math.round(my - 3), '#000', 5, 7); // Outline
        p(Math.round(mx - 1), Math.round(my - 2), '#FFF', 3, 5); // White mask
        p(Math.round(mx), Math.round(my - 1), '#E91E63', 1, 1); // Eye hole
    }

    // --- 3. CONFUSION BURST (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 35 * flashIntensity;
        ctx.shadowColor = '#E91E63';
        
        // Mind Warp Blast
        const blastSize = 25 * flashIntensity;
        ctx.fillStyle = `rgba(233, 30, 99, ${0.3 * flashIntensity})`;
        ctx.beginPath();
        ctx.arc(cx + (12 * S * (isLeft?1:-1)), cy - 4 * S, blastSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Illusion Ripples
        ctx.strokeStyle = `rgba(244, 143, 177, ${flashIntensity})`;
        ctx.lineWidth = 2 * S;
        ctx.beginPath();
        ctx.arc(cx + (12 * S * (isLeft?1:-1)), cy - 4 * S, blastSize * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    // --- 4. HALLUCINATION AURA ---
    const warpGlow = (Math.sin(time * 3) + 1) / 2;
    ctx.fillStyle = `rgba(233, 30, 99, ${0.05 * warpGlow})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 32 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawPhilosopher(cx, cy, tower) {
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

    // --- 1. BODY & VOID ROBES (Black / Emerald Palette) ---
    const robeColor = '#1B1B1B'; // Pitch black
    const voidColor = '#004D40'; // Deep void green
    const trimColor = '#69F0AE'; // Acidic neon green
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-2, 1, voidColor, 3, 11); // Center panel
    p(-5, 11, '#000', 11, 3); // Shadow
    
    // Void Runes
    p(-4, 4, trimColor, 1, 2);
    p(3, 8, trimColor, 1, 2);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head (Eldritch Hood)
    p(-5, -10, '#000', 11, 10); 
    p(-4, -9, robeColor, 9, 8);
    
    // Void Face (No features, just glowing energy)
    p(-2, -7, '#000', 5, 5); // Dark void inside hood
    p(-1, -6, trimColor, 1, 1); // Single glowing eye L
    p(1, -5, trimColor, 1, 1);  // Single glowing eye R

    // --- 2. THE PHILOSOPHER'S STONE (Acidic Core) ---
    let stoneFloat = Math.sin(time * 2.5) * 3;
    let stnOX = isAttacking ? 10 : 8;
    let stnOY = -8 + stoneFloat;
    
    // Stone Body (Irregular Diamond)
    p(stnOX - 3, stnOY - 4, '#000', 7, 9); // Outline
    p(stnOX - 2, stnOY - 3, '#00695C', 5, 7); // Dark green base
    p(stnOX - 1, stnOY - 2, trimColor, 3, 5); // Neon core
    p(stnOX, stnOY - 1, '#FFF', 1, 3); // Shine
    
    // Orbiting Void Matter
    for(let i=0; i<4; i++) {
        const ang = time * 3 + (i * Math.PI * 0.5);
        const dx = Math.cos(ang) * 8;
        const dy = Math.sin(ang) * 8;
        p(Math.round(stnOX + dx/S), Math.round(stnOY + dy/S), '#1B1B1B', 2, 2);
    }

    // --- 3. ACIDIC CURSE (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = '#69F0AE';
        
        // Corrosive Beam
        const beamX = isLeft ? cx + (stnOX * S) : cx - (stnOX * S);
        const beamY = cy + (stnOY * S);
        
        ctx.strokeStyle = `rgba(105, 240, 174, ${flashIntensity})`;
        ctx.lineWidth = 4 * S;
        ctx.beginPath();
        ctx.moveTo(beamX, beamY);
        ctx.lineTo(beamX + 100*(isLeft?1:-1)*flashIntensity, beamY);
        ctx.stroke();
        
        // Acid Splatter
        for(let i=0; i<6; i++) {
            const px = beamX + (Math.random() * 80 * (isLeft?1:-1));
            const py = beamY + (Math.random() - 0.5) * 20;
            ctx.fillStyle = '#69F0AE';
            ctx.fillRect(px, py, 2*S, 2*S);
        }
        ctx.restore();
    }

    // --- 4. CORROSIVE AURA ---
    const acidPulse = (Math.cos(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(105, 240, 174, ${0.06 * acidPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 30 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawReflection(cx, cy, tower) {
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

    // --- 1. BODY & PRISMATIC ROBES (Cyan / Silver / White Palette) ---
    const robeColor = '#E0F7FA'; // Very light cyan
    const highlightColor = '#FFFFFF';
    const silverColor = '#BDBDBD';
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-5, 1, silverColor, 2, 13); // Silver edge L
    p(4, 1, silverColor, 2, 13);  // Silver edge R
    
    // Crystal Heart (Center Medallion)
    p(-1, 5, '#000', 3, 3);
    p(0, 6, '#00E5FF', 1, 1);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head (Crystalline Tiara)
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // Silver Tiara with Jewels
    p(-4, -10, silverColor, 9, 2);
    p(-2, -11, '#00E5FF', 1, 1);
    p(2, -11, '#00E5FF', 1, 1);
    p(0, -12, '#00E5FF', 1, 1);

    // --- 2. THE REFLECTIVE SHARDS (Floating Mirrors) ---
    const shardCount = 4;
    for(let i=0; i<shardCount; i++) {
        const ang = (time * 2.5) + (i * (Math.PI * 2 / shardCount));
        const floatY = Math.cos(time * 4 + i) * 3;
        const dist = 18 + (isAttacking ? flashIntensity * 12 : 0);
        
        let sx = Math.cos(ang) * dist;
        let sy = -2 + Math.sin(ang) * (dist * 0.4) + floatY;
        
        // Crystalline Shard
        p(Math.round(sx - 1), Math.round(sy - 3), '#000', 3, 7); // Outline
        p(Math.round(sx), Math.round(sy - 2), '#E1F5FE', 1, 5); // Core
        p(Math.round(sx), Math.round(sy - 1), '#FFF', 1, 3); // Shine
    }

    // --- 3. PRISMATIC BOUNCE (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = '#00E5FF';
        
        // Multi-directional Laser Bounce
        const bX = isLeft ? cx + (15 * S) : cx - (15 * S);
        const bY = cy + (5 * S);
        
        ctx.strokeStyle = `rgba(0, 229, 255, ${flashIntensity})`;
        ctx.lineWidth = 1.5 * S;
        for(let i=0; i<5; i++) {
            const sang = (i / 5) * Math.PI - 0.5;
            ctx.beginPath();
            ctx.moveTo(bX, bY);
            ctx.lineTo(bX + Math.cos(sang)*60*flashIntensity*(isLeft?1:-1), bY + Math.sin(sang)*60*flashIntensity);
            ctx.stroke();
        }
        ctx.restore();
    }

    // --- 4. CRYSTALLINE AURA ---
    const glassPulse = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(129, 212, 250, ${0.05 * glassPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 35 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawFlameMaster(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & VOLCANIC ROBES (Red / Orange / Charcoal Palette) ---
    const robeColor = '#D84315'; // Deep orange-red
    const charcoalColor = '#212121';
    const flameColor = '#FF9800'; // Bright orange
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-1, 1, charcoalColor, 3, 11); // Center panel
    p(-5, 11, '#BF360C', 11, 3); // Shadow
    
    // Magma Cracks on Robe
    p(-4, 4, flameColor, 2, 1);
    p(3, 8, flameColor, 2, 1);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Firemaster's Crown
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Crown of Embers
    p(-4, -11, '#000', 9, 3);
    p(-4, -10, '#BF360C', 9, 2);
    p(-3, -12, flameColor, 1, 2);
    p(0, -13, flameColor, 1, 3);
    p(3, -12, flameColor, 1, 2);

    // --- 2. THE VOLCANIC TALISMANS (Magma Seals) ---
    const talismanCount = 2;
    for(let i=0; i<talismanCount; i++) {
        const floatY = Math.sin(time * 3 + i) * 5;
        let tox = i === 0 ? -12 : 12;
        let toy = -4 + floatY;
        
        // Talisman Outline
        p(tox - 2, toy - 4, '#000', 5, 10);
        p(tox - 1, toy - 3, '#FFB74D', 3, 8); // Orange paper
        
        // Glowing Red Rune
        p(tox, toy - 1, '#D50000', 1, 4);
        
        // Small flames rising from talisman
        const fPhase = (time * 10 + i) % 5;
        p(tox, toy - 5 - fPhase, `rgba(255, 69, 0, ${0.5 - fPhase/10})`, 1, 1);
    }

    // --- 3. INFERNO CARPET (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 45 * flashIntensity;
        ctx.shadowColor = '#FF4500';
        
        // Ground Fire Burst
        const fireX = isLeft ? cx + (15 * S) : cx - (15 * S);
        const fireY = cy + (10 * S);
        
        for(let i=0; i<5; i++) {
            const fx = fireX + (i-2) * 20;
            const fy = fireY + (Math.random()-0.5) * 10;
            ctx.fillStyle = `rgba(255, 69, 0, ${flashIntensity})`;
            ctx.fillRect(fx - 10, fy - 15 * flashIntensity, 20, 30 * flashIntensity);
        }
        ctx.restore();
    }

    // --- 4. MAGMA AURA ---
    const heatGlow = (Math.sin(time * 4) + 1) / 2;
    ctx.fillStyle = `rgba(255, 69, 0, ${0.08 * heatGlow})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 32 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawVoidSniper(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & VOID STALKER GEAR (Deep Purple / Obsidian Palette) ---
    const armorColor = '#1A237E'; // Deep obsidian blue
    const voidColor = '#4A148C'; // Deep purple
    const glowColor = '#00E5FF'; // Ethereal cyan glow
    
    // Body / Stealth Suit
    p(-5, 0, '#000', 11, 15); // Outline
    p(-4, 1, armorColor, 9, 13);
    p(-1, 1, voidColor, 3, 11); // Center void core
    
    // Tactical Scarf (Flowing)
    const scarfWarp = Math.sin(time * 3) * 4;
    p(-8 + scarfWarp, -2, '#000', 5, 5);
    p(-7 + scarfWarp, -1, voidColor, 3, 3);

    // Boots
    p(-3, 14, '#000', 3, 3);
    p(1, 14, '#000', 3, 3);

    // Head (Sniping Goggles / Hood)
    p(-4, -10, '#000', 9, 10); 
    p(-3, -9, armorColor, 7, 8);
    
    // Sniping Goggles
    p(-2, -6, '#212121', 5, 3);
    p(-1, -5, glowColor, 1, 1); // Lens L
    p(1, -5, glowColor, 1, 1);  // Lens R

    // --- 2. THE VOID LONGBOW (Calamity) ---
    // Massive bow that gathers energy
    let bowOX = 10;
    let bowOY = -15;
    let drawBack = isAttacking ? (1.0 - flashIntensity) * 8 : 0;
    
    const stringColor = '#00E5FF';
    
    // Bow Frame (Ebony wood/Metal)
    p(bowOX, bowOY, '#000', 3, 30);
    p(bowOX - 1, bowOY - 1, '#000', 3, 3); // Upper curve
    p(bowOX - 1, bowOY + 28, '#000', 3, 3); // Lower curve
    
    p(bowOX, bowOY + 1, '#212121', 2, 28);
    p(bowOX + 1, bowOY + 5, voidColor, 1, 20); // Void energy inlay

    // Bow String (Ethereal)
    const stringX = bowOX - drawBack;
    ctx.strokeStyle = stringColor;
    ctx.lineWidth = S * 0.5;
    const sTopX = isLeft ? cx + (bowOX * S) : cx - (bowOX * S);
    const sBotX = isLeft ? cx + (bowOX * S) : cx - (bowOX * S);
    const sMidX = isLeft ? cx + (stringX * S) : cx - (stringX * S);
    
    ctx.beginPath();
    ctx.moveTo(sTopX, cy + (bowOY * S));
    ctx.lineTo(sMidX, cy + (bowOY + 15) * S);
    ctx.lineTo(sBotX, cy + (bowOY + 30) * S);
    ctx.stroke();

    // Void Arrow (During Attack)
    if (isAttacking) {
        const arrowX = bowOX - drawBack;
        p(arrowX - 6, bowOY + 14, '#000', 10, 2); // Shadow shaft
        p(arrowX - 5, bowOY + 14, glowColor, 10, 1); // Glowing core
        
        // Charging Sparkle
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = glowColor;
        p(arrowX + 4, bowOY + 13, '#fff', 3, 3);
        ctx.restore();
    }

    // --- 3. AMBIENT VOID PARTICLES ---
    const partPulse = (Math.sin(time * 2) + 1) / 2;
    for(let i=0; i<3; i++) {
        const py = -10 + (i * 10) - (time * 15 % 30);
        const px = -15 + (i * 10);
        p(Math.round(px), Math.round(py), `rgba(103, 58, 183, ${0.2 * partPulse})`, 1, 1);
    }
}

function drawVajrapani(cx, cy, tower) {
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

    // --- 1. BODY & DIVINE ARMOR (Azure / Gold / Crimson Palette) ---
    const armorColor = '#0D47A1'; // Divine azure
    const skinColor = '#D7B19D'; // Muscular skin
    const goldTrim = '#FFD700';
    
    // Large Muscular Torso
    p(-7, 0, '#000', 15, 15); // Outline
    p(-6, 1, skinColor, 13, 13);
    p(-6, 1, armorColor, 3, 13); // Arm guard L
    p(4, 1, armorColor, 3, 13);  // Arm guard R
    
    // Crimson Scarf/Cape
    const capeWarp = Math.cos(time * 2) * 5;
    p(-9 + capeWarp, -2, '#B71C1C', 4, 18);
    
    // Golden Belt
    p(-6, 10, goldTrim, 13, 3);

    // Boots (Heavy sandals)
    p(-5, 14, '#3E2723', 5, 3);
    p(1, 14, '#3E2723', 5, 3);

    // Head (Wrathful Deity)
    p(-4, -10, '#000', 9, 10); 
    p(-3, -9, skinColor, 7, 8);
    
    // Flaming Hair (Heavenly fire)
    const firePhase = (time * 10) % 5;
    p(-4, -13 - firePhase, '#FF4500', 9, 4);
    
    // Eyes (Bright white glow)
    p(-2, -6, '#FFF', 1, 1);
    p(1, -6, '#FFF', 1, 1);

    // --- 2. THE DIVINE TRIDENT (Vajra) ---
    // Trident shifts during attack
    let triOX = isAttacking ? 10 : 8;
    let triOY = isAttacking ? -22 : -18;
    
    const ironColor = '#757575';
    const lightningColor = '#FFEB3B';

    // Staff
    p(triOX, triOY + 8, '#3E2723', 2, 25);
    
    // Trident Head
    p(triOX - 4, triOY, '#000', 10, 9); // Outline
    p(triOX - 3, triOY + 1, ironColor, 8, 7);
    p(triOX - 3, triOY - 2, ironColor, 2, 4); // Left prong
    p(triOX, triOY - 4, ironColor, 2, 6);    // Center prong
    p(triOX + 3, triOY - 2, ironColor, 2, 4); // Right prong
    
    // Lightning around Trident
    if (isAttacking) {
        for(let i=0; i<4; i++) {
            const lX = triOX + (Math.random() - 0.5) * 15;
            const lY = triOY + (Math.random() - 0.5) * 15;
            p(Math.round(lX), Math.round(lY), lightningColor, 1, 1);
        }
    }

    // --- 3. KNOCKBACK SHOCKWAVE (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 50 * flashIntensity;
        ctx.shadowColor = '#FFD700';
        
        // Massive Golden Wave
        const waveSize = 40 * flashIntensity * S;
        ctx.strokeStyle = `rgba(255, 215, 0, ${flashIntensity})`;
        ctx.lineWidth = 8 * S;
        ctx.beginPath();
        ctx.arc(cx, cy, waveSize, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    // --- 4. DIVINE POWER AURA ---
    const auraPulse = (Math.sin(time * 3) + 1) / 2;
    ctx.fillStyle = `rgba(255, 215, 0, ${0.1 * auraPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 38 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawAbsoluteZero(cx, cy, tower) {
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

    // --- 1. BODY & FROZEN ROBES (Cyan / White / Crystal Palette) ---
    const robeColor = '#E0F7FA'; // Near white
    const iceColor = '#00E5FF'; // Cyan ice
    const trimColor = '#81D4FA'; 
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-5, 1, iceColor, 2, 13); // Ice shoulder detail
    p(4, 1, iceColor, 2, 13);
    
    // Crystalline Sash
    p(-5, 7, '#00B8D4', 11, 2);

    // Boots (Frosty)
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Frozen Crown
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Crown of Absolute Zero
    p(-5, -11, '#000', 11, 4);
    p(-4, -10, iceColor, 9, 3);
    p(-2, -12, '#FFF', 1, 3); // Center shard
    p(2, -12, '#FFF', 1, 3);

    // Eyes (Bright Cyan Glow)
    p(-2, -5, '#00E5FF', 1, 1);
    p(2, -5, '#00E5FF', 1, 1);

    // --- 2. THE GLACIAL STAFF (Winter's Grasp) ---
    let staffOX = isAttacking ? 10 : 8;
    let staffOY = -14;
    
    // Staff Handle
    p(staffOX, staffOY, '#000', 3, 28);
    p(staffOX + 1, staffOY, '#BDBDBD', 1, 28);
    
    // Staff Head (Massive Gem)
    p(staffOX - 4, staffOY - 5, '#000', 10, 10); // Outline
    p(staffOX - 3, staffOY - 4, iceColor, 8, 8);
    p(staffOX - 1, staffOY - 2, '#FFF', 3, 4); // Shine

    // --- 3. ZERO-POINT BURST (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 45 * flashIntensity;
        ctx.shadowColor = '#00E5FF';
        
        // Glacial Explosion
        const blastX = isLeft ? cx + (staffOX * S) : cx - (staffOX * S);
        const blastY = cy + (staffOY * S);
        
        ctx.fillStyle = `rgba(129, 212, 250, ${0.4 * flashIntensity})`;
        ctx.beginPath();
        ctx.arc(blastX, blastY, 25 * flashIntensity * S, 0, Math.PI * 2);
        ctx.fill();
        
        // Ice Spikes
        for(let i=0; i<6; i++) {
            const sang = (i / 6) * Math.PI * 2 + time * 3;
            const sdist = 15 + flashIntensity * 35;
            const sx = staffOX + Math.cos(sang) * sdist/S;
            const sy = staffOY + Math.sin(sang) * sdist/S;
            p(Math.round(sx - 1), Math.round(sy - 1), '#FFF', 3, 3);
        }
        ctx.restore();
    }

    // --- 4. PERMAFROST AURA ---
    const frostPulse = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(129, 212, 250, ${0.1 * frostPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 32 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawHellfireAlchemist(cx, cy, tower) {
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

    // --- 1. BODY & HELL-FORGE GEAR (Black / Dark Red / Toxic Orange Palette) ---
    const robeColor = '#1B1B1B'; // Charcoal black
    const forgeColor = '#B71C1C'; // Dark red detail
    const toxicColor = '#FF3D00'; // Intense toxic orange
    
    // Heavy Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-5, 1, forgeColor, 2, 13); // Red side trim L
    p(4, 1, forgeColor, 2, 13);  // Red side trim R
    
    // Alchemical Bandolier
    p(-5, 5, '#3E2723', 11, 3);
    p(-3, 6, toxicColor, 2, 1); // Glowing vial

    // Boots (Reinforced)
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head (Gas Mask / Hood)
    p(-5, -10, '#000', 11, 10); 
    p(-4, -9, robeColor, 9, 8);
    
    // The Gas Mask (Infernal design)
    p(-3, -6, '#212121', 7, 5); // Mask base
    p(-2, -5, toxicColor, 2, 2); // Lens L
    p(1, -5, toxicColor, 2, 2);  // Lens R
    p(-1, -2, '#424242', 3, 2); // Filter

    // --- 2. HELLFIRE FLASKS (Volatile Concoctions) ---
    let flaskFloat = Math.cos(time * 3) * 3;
    let flaOX = isAttacking ? 11 : 9;
    let flaOY = -2 + flaskFloat;
    
    // Toxic Flask (Erlenmeyer style)
    p(flaOX - 3, flaOY - 4, '#000', 7, 10); // Outline
    p(flaOX - 2, flaOY - 3, '#BDBDBD', 5, 8); // Glass
    p(flaOX - 2, flaOY + 1, toxicColor, 5, 4); // Hellfire liquid
    
    // Bubbling Smoke
    const sPhase = (time * 10) % 6;
    p(flaOX, flaOY - 6 - sPhase, `rgba(255, 61, 0, ${0.4 * (1 - sPhase/6)})`, 2, 2);

    // --- 3. HELLISH EXPLOSION (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 50 * flashIntensity;
        ctx.shadowColor = '#FF3D00';
        
        // Napalm Burst
        const blastX = isLeft ? cx + (flaOX * S) : cx - (flaOX * S);
        const blastY = cy + (flaOY * S);
        
        ctx.fillStyle = `rgba(255, 61, 0, ${0.4 * flashIntensity})`;
        ctx.beginPath();
        ctx.arc(blastX, blastY, 20 * flashIntensity * S, 0, Math.PI * 2);
        ctx.fill();
        
        // Flying Ash
        for(let i=0; i<8; i++) {
            const px = blastX + (Math.random() - 0.5) * 60;
            const py = blastY + (Math.random() - 0.5) * 60;
            p(Math.round((px-cx)/S), Math.round((py-cy)/S), '#424242', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. COMBUSTION AURA ---
    const heatGlow = (Math.sin(time * 4) + 1) / 2;
    ctx.fillStyle = `rgba(255, 61, 0, ${0.08 * heatGlow})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 32 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawPhoenixSummoner(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 500; 
    
    const S = 3.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(cx + (finalOx * S), cy + (oy * S), w * S, h * S);
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 500) : 0;

    // --- 1. BODY & SOLAR ROBES (Bright Orange / Yellow / Gold Palette) ---
    const robeColor = '#E65100'; // Intense orange
    const solarColor = '#FFD600'; // Bright yellow
    const trimColor = '#FFAB00'; // Amber gold
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-2, 1, solarColor, 3, 11); // Center sun panel
    p(-5, 11, '#EF6C00', 11, 3); // Shadow
    
    // Sun Medallion
    p(-1, 5, '#000', 3, 3);
    p(0, 6, '#FFF176', 1, 1);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Solar Tiara
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Sun Tiara
    p(-4, -10, trimColor, 9, 2);
    p(0, -12, solarColor, 1, 3); // Center sun spike

    // --- 2. THE PHOENIX COMPANION (Fledgling Phoenix) ---
    let phxFloat = Math.sin(time * 3) * 6;
    let phxOX = isAttacking ? 15 : 12;
    let phxOY = -10 + phxFloat;
    
    const fireColor = '#FF6F00';
    const lightColor = '#FFF59D';
    
    // Phoenix Body (Ethereal Bird)
    p(phxOX - 2, phxOY - 2, '#000', 5, 5); // Outline
    p(phxOX - 1, phxOY - 1, fireColor, 3, 3); // Body
    p(phxOX, phxOY, lightColor, 1, 1); // Glowing core
    
    // Wings (Flapping)
    const wingWarp = Math.sin(time * 8) * 4;
    p(phxOX - 6, phxOY - 1 + wingWarp, fireColor, 4, 2); // Wing L
    p(phxOX + 3, phxOY - 1 - wingWarp, fireColor, 4, 2); // Wing R
    
    // Tail Feathers
    const tailWarp = Math.cos(time * 5) * 3;
    p(phxOX - 1, phxOY + 3 + tailWarp, '#FF9100', 3, 5);

    // --- 3. SOLAR FLARE (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 60 * flashIntensity;
        ctx.shadowColor = '#FFD600';
        
        // Solar Beam from Phoenix
        const beamX = isLeft ? cx + (phxOX * S) : cx - (phxOX * S);
        const beamY = cy + (phxOY * S);
        
        ctx.strokeStyle = `rgba(255, 214, 0, ${flashIntensity})`;
        ctx.lineWidth = 6 * S;
        ctx.beginPath();
        ctx.moveTo(beamX, beamY);
        ctx.lineTo(beamX + 150*(isLeft?1:-1)*flashIntensity, beamY);
        ctx.stroke();
        
        // Fire Particles
        for(let i=0; i<10; i++) {
            const px = beamX + (Math.random() * 120 * (isLeft?1:-1));
            const py = beamY + (Math.random() - 0.5) * 30;
            p(Math.round((px-cx)/S), Math.round((py-cy)/S), '#FF6D00', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. RADIANT AURA ---
    const radiantPulse = (Math.sin(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(255, 214, 0, ${0.1 * radiantPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 35 * S, 0, Math.PI * 2);
    ctx.fill();
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
