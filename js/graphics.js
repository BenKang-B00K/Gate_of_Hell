/* graphics.js - High-Resolution (1080x1920) Canvas API Setup */

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
const ctx = canvas.getContext('2d');

// Increased Logical Resolution for much sharper detail
// Design is based on 360x640 logical pixels as per mandate.
const LOGICAL_WIDTH = 360; 
const LOGICAL_HEIGHT = 640; 

let lavaPhase = 0;

function initGraphics() {
    const container = document.getElementById('game-container');
    if (!container) return;
    container.appendChild(canvas);
    
    // Set pixelated rendering for the canvas element
    canvas.style.imageRendering = 'pixelated';
    canvas.style.setProperty('image-rendering', 'pixelated');
    canvas.style.setProperty('image-rendering', 'crisp-edges');
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    
    // Internal coordinate system is 360x640
    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;
    
    // Scale CSS display size to fit container (e.g. 1080x1920 physical)
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    // Reinforce pixelated rendering on resize
    canvas.style.imageRendering = 'pixelated';
    
    disableSmoothing();
}

function disableSmoothing() {
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
}

// --- Advanced VFX State ---
const particles = []; 
const lightPillars = []; // {x, y, life, maxLife}
const promotionBursts = []; // {x, y, life, tier}
const stageFlashes = []; // {life, text}
const banishEffects = []; // {x, y, life}
const purgeEffects = []; // {x, y, life}
let globalAnimTimer = 0;

window.updateBanishEffects = function() {
    for (let i = banishEffects.length - 1; i >= 0; i--) {
        const be = banishEffects[i];
        be.life -= 0.02;
        if (be.life <= 0) banishEffects.splice(i, 1);
    }
};

window.spawnBanishEffect = function(lx, ly) {
    banishEffects.push({ x: lx, y: ly, life: 1.0 });
    if (typeof spawnParticles === 'function') spawnParticles(lx, ly, '#4A148C', 20);
};

window.drawBanishEffects = function() {
    banishEffects.forEach(be => {
        const alpha = be.life;
        ctx.save();
        ctx.translate(be.x, be.y);
        ctx.strokeStyle = `rgba(106, 27, 154, ${alpha})`;
        ctx.beginPath(); ctx.arc(0, 0, (1.0 - alpha) * 80, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    });
};

function spawnPurgeEffect(lx, ly) {
    purgeEffects.push({
        x: lx,
        y: ly,
        life: 1.0
    });
    
    // Spawn holy white particles
    spawnParticles(lx, ly, '#fff', 40);
    spawnParticles(lx, ly, '#ffd700', 20);
}

function updatePurgeEffects() {
    for (let i = purgeEffects.length - 1; i >= 0; i--) {
        const pe = purgeEffects[i];
        pe.life -= 0.015; // Slow majestic expansion
        if (pe.life <= 0) purgeEffects.splice(i, 1);
    }
}

function drawPurgeEffects() {
    purgeEffects.forEach(pe => {
        const alpha = pe.life;
        const radius = (1.0 - alpha) * 800; // Expands to cover most of the screen
        
        ctx.save();
        ctx.translate(pe.x, pe.y);
        
        // 1. Massive Primary Shockwave
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.lineWidth = 15 * alpha;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 2. Secondary Golden Edge
        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.5})`;
        ctx.lineWidth = 5 * alpha;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 10, 0, Math.PI * 2);
        ctx.stroke();
        
        // 3. Inner Divine Glow
        const grad = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.2})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 4. Screen-wide flash at the start
        if (alpha > 0.9) {
            const flashAlpha = (alpha - 0.9) * 10;
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.5})`;
            ctx.fillRect(-pe.x, -pe.y, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        }
        
        ctx.restore();
    });
}

function spawnStageFlash(text) {
    stageFlashes.push({
        life: 1.0,
        text: text
    });
}

function updateStageFlashes() {
    for (let i = stageFlashes.length - 1; i >= 0; i--) {
        const sf = stageFlashes[i];
        sf.life -= 0.02; // Faster fade (was 0.01)
        if (sf.life <= 0) stageFlashes.splice(i, 1);
    }
}

function drawStageFlashes() {
    stageFlashes.forEach(sf => {
        const alpha = sf.life;
        ctx.save();
        
        // 1. Reduced Full Screen Flash
        const flashAlpha = Math.min(0.6, alpha * 1.5); // Max opacity 0.6 (was 1.0)
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        
        const goldAlpha = Math.min(0.3, alpha); // Max opacity 0.3 (was 0.6)
        ctx.fillStyle = `rgba(255, 215, 0, ${goldAlpha})`;
        ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

        // 2. Controlled Text Animation
        if (alpha > 0.1) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.shadowBlur = 10; // Reduced blur (was 20)
            ctx.shadowColor = '#ff4500';
            
            // Subtler text expansion
            const fontSize = 42 + (1.0 - alpha) * 20; 
            ctx.font = `bold ${fontSize}px Cinzel, serif`;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillText(sf.text, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
            
            ctx.font = `bold 20px Cinzel, serif`; // Smaller subtitle
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.7})`;
            ctx.fillText("ASCENDING TO NEXT DEPTH", LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 50);
        }
        
        ctx.restore();
    });
}

function spawnPromotionBurst(lx, ly, tier) {
    promotionBursts.push({
        x: lx,
        y: ly,
        life: 1.0,
        tier: tier
    });
    
    // Also spawn a lot of particles
    const color = (tier === 4) ? '#9400d3' : '#ffd700';
    spawnParticles(lx, ly, color, 30);
}

function updatePromotionBursts() {
    for (let i = promotionBursts.length - 1; i >= 0; i--) {
        const pb = promotionBursts[i];
        pb.life -= 0.025;
        if (pb.life <= 0) promotionBursts.splice(i, 1);
    }
}

function drawPromotionBursts() {
    promotionBursts.forEach(pb => {
        const alpha = pb.life;
        const isAbyss = pb.tier === 4;
        
        ctx.save();
        ctx.translate(pb.x, pb.y);
        
        // 1. Shockwave Ring
        const ringSize = (1.0 - alpha) * 120;
        ctx.strokeStyle = isAbyss ? `rgba(148, 0, 211, ${alpha})` : `rgba(255, 215, 0, ${alpha})`;
        ctx.lineWidth = 4 * alpha;
        ctx.beginPath();
        ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // 2. Center Flare
        const flareSize = 60 * alpha;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, flareSize);
        if (isAbyss) {
            grad.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
            grad.addColorStop(0.5, `rgba(75, 0, 130, ${alpha * 0.7})`);
            grad.addColorStop(1, 'transparent');
        } else {
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            grad.addColorStop(0.4, `rgba(255, 215, 0, ${alpha * 0.8})`);
            grad.addColorStop(1, 'transparent');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, flareSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 3. Spiky Light Rays
        const rays = isAbyss ? 12 : 8;
        ctx.strokeStyle = isAbyss ? `rgba(255, 0, 0, ${alpha * 0.5})` : `rgba(255, 255, 255, ${alpha * 0.6})`;
        ctx.lineWidth = 2 * alpha;
        for (let r = 0; r < rays; r++) {
            const ang = (r / rays) * Math.PI * 2 + (1.0 - alpha) * 2;
            const len = (isAbyss ? 100 : 70) * alpha;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
            ctx.stroke();
        }
        
        ctx.restore();
    });
}

function spawnLightPillar(lx, ly) {
    lightPillars.push({
        x: lx,
        y: ly,
        life: 1.0,
        maxLife: 1.0,
        decay: 0.02
    });
}

function updateLightPillars() {
    for (let i = lightPillars.length - 1; i >= 0; i--) {
        const lp = lightPillars[i];
        lp.life -= lp.decay;
        if (lp.life <= 0) lightPillars.splice(i, 1);
    }
}

function drawLightPillars() {
    lightPillars.forEach(lp => {
        const alpha = lp.life;
        const width = 40 * alpha; // Pillar narrows as it fades
        
        ctx.save();
        // 1. Core Beam
        const grad = ctx.createLinearGradient(lp.x - width/2, 0, lp.x + width/2, 0);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.8})`);
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        // Draw from top of screen to the slot
        ctx.fillRect(lp.x - width/2, 0, width, lp.y);
        
        // 2. Base Glow at the slot
        const baseGrad = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, 50 * alpha);
        baseGrad.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.6})`);
        baseGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.ellipse(lp.x, lp.y, 50 * alpha, 15 * alpha, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 3. Vertical Glow
        ctx.shadowBlur = 30 * alpha;
        ctx.shadowColor = '#fff';
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
        ctx.lineWidth = 2 * alpha;
        ctx.beginPath();
        ctx.moveTo(lp.x, 0);
        ctx.lineTo(lp.x, lp.y);
        ctx.stroke();
        
        ctx.restore();
    });
}

function spawnParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3 - 1, 
            color: color,
            size: Math.random() * 2 + 1,
            life: 1.0,
            decay: 0.015 + Math.random() * 0.02
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawShadow(lx, ly, size = 10) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(lx, ly + 12, size, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// --- Atmospheric Side State ---
const sideClouds = []; // {x, y, vx, vy, size, opacity, targetOpacity, flash}
const sideMist = [];   // {x, y, vx, vy, size, opacity}

function initAtmosphere() {
    if (sideClouds.length > 0) return;
    for(let i=0; i<15; i++) {
        sideClouds.push({
            // Start anywhere across the width, including far off-screen
            x: Math.random() * (LOGICAL_WIDTH + 400) - 200, 
            y: Math.random() * 250,
            vx: (Math.random() - 0.5) * 0.4, // Faster drift
            vy: (Math.random() - 0.5) * 0.1,
            size: 60 + Math.random() * 100, // Larger clouds
            opacity: Math.random(),
            targetOpacity: Math.random(),
            flash: 0
        });
    }
}

function drawAtmosphericEffects() {
    initAtmosphere();
    const time = globalAnimTimer;
    ctx.save();

    // Update and Draw Clouds
    sideClouds.forEach(c => {
        // Move
        c.x += c.vx; c.y += c.vy;
        
        // Fade logic
        if (Math.abs(c.opacity - c.targetOpacity) < 0.01) {
            c.targetOpacity = Math.random();
        } else {
            c.opacity += (c.targetOpacity > c.opacity ? 0.002 : -0.002);
        }

        // [User Request] Dynamic Boundaries: Allow drifting far off-screen and crossing sides
        // Loop back from the other side if too far out
        if (c.x > LOGICAL_WIDTH + 300) c.x = -300;
        if (c.x < -300) c.x = LOGICAL_WIDTH + 300;
        
        // Occasional direction change for randomness
        if (Math.random() < 0.001) c.vx *= -1;

        // Lightning Flash Logic
        if (c.flash > 0) c.flash -= 0.08;
        else if (Math.random() < 0.0015) c.flash = 1.0;

        // Draw Cloud
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size);
        const baseColor = c.flash > 0 ? `rgba(255, 255, 200, ${c.opacity * c.flash * 0.8})` : `rgba(15, 15, 25, ${c.opacity * 0.5})`;
        grad.addColorStop(0, baseColor);
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.fill();

        // Sub-cloud bolt details
        if (c.flash > 0.6) {
            ctx.strokeStyle = `rgba(255, 215, 0, ${c.flash * 0.4})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(c.x - 15, c.y);
            ctx.lineTo(c.x + 5, c.y + 15);
            ctx.lineTo(c.x - 10, c.y + 30);
            ctx.stroke();
        }
    });

    // [User Request] Expansive Mist/Fog layers
    ctx.globalAlpha = 0.15;
    for(let m=0; m<4; m++) {
        const drift = Math.sin(time * 0.3 + m) * 100;
        const fade = (Math.sin(time * 0.5 + m) + 1) / 2;
        ctx.fillStyle = '#1a1a2e';
        // Large fog banks that cross the center randomly
        ctx.fillRect(-200 + drift, 0, 400, 300);
        ctx.fillRect(LOGICAL_WIDTH - 200 - drift, 0, 400, 300);
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
}

function renderGraphics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    lavaPhase += 0.02;
    globalAnimTimer += 0.06; // Drive animations
    
    updateParticles();
    updateLightPillars();
    updatePromotionBursts();
    updateStageFlashes();
    if (typeof window.updateBanishEffects === 'function') window.updateBanishEffects();
    updatePurgeEffects();
    
    drawLavaRoad();
    drawAtmosphericEffects(); 
    drawSpawningGate(); 
    drawPortal(); 
    drawSlots();
    drawUnits();
    drawEnemies(); 
    drawParticles(); 
    drawLightPillars();
    drawPromotionBursts();
    if (typeof window.drawBanishEffects === 'function') window.drawBanishEffects();
    drawPurgeEffects();
    drawStageFlashes();
    drawSelectionHalo();
}

function drawSpawningGate() {
    const cx = LOGICAL_WIDTH / 2;
    const cy = -55; // [User Request] Moved 25px higher from -30
    const time = globalAnimTimer;
    const roadWidth = 114;

    ctx.save();

    // 1. Raging Hellfire (Background Glow)
    // [User Request] Pulsing radius between 95.5px and 102.5px
    const firePulse = (Math.sin(time * 3) + 1) / 2;
    const hellfireRadius = 95.5 + (firePulse * 7); // 95.5 to 102.5
    
    const fireGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, hellfireRadius * 1.3);
    fireGrad.addColorStop(0, `rgba(255, 69, 0, ${0.7 + firePulse * 0.3})`); 
    fireGrad.addColorStop(0.6, `rgba(255, 140, 0, ${0.4 + firePulse * 0.2})`); 
    fireGrad.addColorStop(1, 'transparent');
    
    ctx.fillStyle = fireGrad;
    ctx.fillRect(cx - hellfireRadius * 2, cy - 50, hellfireRadius * 4, 200);

    // 2. Occult Runes (Floating/Orbiting)
    // [User Request] Slower, more transparent, and bobbing up/down
    const runeAlpha = (Math.sin(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(255, 0, 0, ${0.15 + runeAlpha * 0.2})`; // Increased transparency
    ctx.shadowBlur = 10 * runeAlpha;
    ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
    
    for(let r=0; r<8; r++) {
        const orbitSpeed = 0.2; // Slower rotation
        const angle = (time * orbitSpeed) + (r * Math.PI * 0.25);
        
        // Horizontal orbit
        const rx = cx + Math.cos(angle) * 90;
        
        // Vertical Orbit + [User Request] Bobbing up/down
        const bobY = Math.sin(time * 2 + r) * 8; // Individual bobbing
        const ry = cy + 50 + Math.sin(angle) * 30 + bobY;
        
        ctx.font = 'bold 16px serif';
        ctx.fillText('⛧', rx, ry);
    }
    ctx.shadowBlur = 0;

    // 3. Upward Fire Particles
    if (Math.random() < 0.5) {
        spawnParticles(cx + (Math.random() - 0.5) * 150, cy + 40, '#ff4500', 1);
    }

    ctx.restore();
}

function drawPortal() {
    const container = document.getElementById('game-container');
    const road = document.getElementById('road');
    if (!container || !road) return;

    const containerRect = container.getBoundingClientRect();
    const roadRect = road.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / containerRect.width;
    const scaleY = LOGICAL_HEIGHT / containerRect.height;

    // Position at the bottom center of the road (moved 20px lower per user request)
    const cx = LOGICAL_WIDTH / 2;
    const cy = ((roadRect.bottom - containerRect.top) * scaleY) + 20;
    const time = globalAnimTimer;

    ctx.save();
    
    // [User Request] Enlarged Portal Dimensions
    const peIntensity = typeof portalEnergy !== 'undefined' ? (portalEnergy / maxPortalEnergy) : 0;
    const baseRadius = 75 + (peIntensity * 40); // Increased from 50+20
    
    // 1. Intense Outer Glow
    const outerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 1.8);
    outerGrad.addColorStop(0, 'rgba(106, 27, 154, 0.5)'); // Deeper Purple
    outerGrad.addColorStop(0.6, 'rgba(183, 28, 28, 0.3)'); // Red
    outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = outerGrad;
    ctx.fillRect(cx - baseRadius * 2.5, cy - baseRadius * 1.5, baseRadius * 5, baseRadius * 3);

    // 2. Swirling Vortex Layers (Enlarged and Faster)
    for (let i = 0; i < 4; i++) { // Added one more layer
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * (1.2 + i * 0.6) * (i % 2 === 0 ? 1 : -1));
        
        const scaleX = 1.1 + Math.sin(time * 1.5 + i) * 0.15;
        const scaleY = 0.5 + Math.cos(time * 1.2 + i) * 0.1;
        ctx.scale(scaleX, scaleY);

        ctx.beginPath();
        ctx.ellipse(0, 0, baseRadius, baseRadius * 0.85, 0, 0, Math.PI * 2);
        
        const layerGrad = ctx.createLinearGradient(-baseRadius, 0, baseRadius, 0);
        if (i % 2 === 0) {
            layerGrad.addColorStop(0, 'rgba(75, 0, 130, 0.7)'); 
            layerGrad.addColorStop(0.5, 'rgba(255, 23, 68, 0.5)'); 
            layerGrad.addColorStop(1, 'rgba(75, 0, 130, 0.7)');
        } else {
            layerGrad.addColorStop(0, 'rgba(156, 39, 176, 0.4)'); 
            layerGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
            layerGrad.addColorStop(1, 'rgba(156, 39, 176, 0.4)');
        }
        
        ctx.strokeStyle = layerGrad;
        ctx.lineWidth = 4; // Thicker lines
        ctx.stroke();
        ctx.restore();
    }

    // 3. Enlarged Core (Eye of the Storm)
    ctx.beginPath();
    // Core size increased from 0.6/0.25 to 0.85/0.45
    ctx.ellipse(cx, cy, baseRadius * 0.85, baseRadius * 0.45, 0, 0, Math.PI * 2);
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.85);
    coreGrad.addColorStop(0, '#000');
    coreGrad.addColorStop(0.5, 'rgba(20, 0, 40, 0.9)'); 
    coreGrad.addColorStop(0.9, 'rgba(255, 0, 0, 0.4)'); // Glowing red edge for the eye
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // 4. [User Request] Boosted Soul Absorption Particles
    // Increased frequency from 0.3 to 0.8 and spawn 2-3 at once
    if (Math.random() < 0.8) {
        const pCount = Math.floor(Math.random() * 3) + 1;
        for(let p=0; p<pCount; p++) {
            const rx = cx + (Math.random() - 0.5) * 180;
            const ry = cy - 80 - Math.random() * 40;
            spawnParticles(rx, ry, Math.random() > 0.5 ? '#9400d3' : '#ff1744', 1);
        }
    }

    ctx.restore();
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.floor(p.size), Math.floor(p.size));
    });
    ctx.globalAlpha = 1.0;
}


// --- Hell's Path State ---
let lightningTimer = 0;
let lightningIntensity = 0;
const roadSouls = []; // {x, y, speed, opacity}

function drawLavaRoad() {
    const time = globalAnimTimer;
    const roadWidth = 114; 
    const roadX = (LOGICAL_WIDTH - roadWidth) / 2;
    
    ctx.save();

    // 1. Base: Dark Granite Texture
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(roadX, 0, roadWidth, LOGICAL_HEIGHT);
    
    // Procedural Granite Specks
    ctx.fillStyle = '#1a1a1a';
    for(let i=0; i<100; i++) {
        const gx = roadX + (Math.sin(i * 567) * 0.5 + 0.5) * roadWidth;
        const gy = (Math.sin(i * 123) * 0.5 + 0.5) * LOGICAL_HEIGHT;
        ctx.fillRect(Math.floor(gx), Math.floor(gy), 2, 2);
    }

    // 2. Guideposts for Souls (Downward Arrows, No Tail) - Subtle/Transparent
    const guideGlow = (Math.sin(time * 1.2) + 1) / 2;
    
    for (let j = 0; j < 4; j++) {
        const ay = (j * 160 + time * 15) % LOGICAL_HEIGHT; // Moving downward slowly
        const ax = LOGICAL_WIDTH / 2;
        const size = 12;

        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // [User Request] Add transparency to make it less distracting
        const baseAlpha = 0.15; // Very subtle base
        const finalAlpha = baseAlpha + (guideGlow * 0.1);
        
        // Draw Shadow/Dark Outline
        ctx.strokeStyle = `rgba(0, 0, 0, ${finalAlpha})`;
        ctx.moveTo(ax - size, ay - size);
        ctx.lineTo(ax, ay);
        ctx.lineTo(ax + size, ay - size);
        ctx.stroke();

        // Draw Glowing Core
        ctx.strokeStyle = `rgba(255, 69, 0, ${finalAlpha * 1.5})`;
        ctx.shadowBlur = 5 * guideGlow;
        ctx.shadowColor = 'rgba(255, 69, 0, 0.5)';
        ctx.stroke();
        
        ctx.restore();
    }

    // 3. Lightning/Flicker (Dark Yellow + Orange)
    if (lightningTimer <= 0) {
        if (Math.random() < 0.01) { // Rare strike
            lightningTimer = 10 + Math.random() * 20;
            lightningIntensity = 0.3 + Math.random() * 0.4;
        }
    } else {
        lightningTimer--;
        const flicker = Math.random() > 0.5 ? 1 : 0.5;
        ctx.fillStyle = `rgba(255, 215, 0, ${lightningIntensity * flicker * 0.15})`; // Dark Yellow
        ctx.fillRect(roadX, 0, roadWidth, LOGICAL_HEIGHT);
        ctx.fillStyle = `rgba(255, 69, 0, ${lightningIntensity * flicker * 0.1})`; // Orange tint
        ctx.fillRect(roadX, 0, roadWidth, LOGICAL_HEIGHT);
        lightningIntensity *= 0.95; // Fade out
    }

    // 4. Ascending Soul Particles (White Specks)
    if (roadSouls.length < 15 && Math.random() < 0.1) {
        roadSouls.push({
            x: roadX + Math.random() * roadWidth,
            y: LOGICAL_HEIGHT + 10,
            speed: 0.5 + Math.random() * 1.5,
            opacity: 0.2 + Math.random() * 0.5
        });
    }

    ctx.fillStyle = '#ffffff';
    for (let s = roadSouls.length - 1; s >= 0; s--) {
        const soul = roadSouls[s];
        soul.y -= soul.speed;
        soul.opacity -= 0.001;
        ctx.globalAlpha = Math.max(0, soul.opacity);
        ctx.fillRect(Math.floor(soul.x), Math.floor(soul.y), 1, 2);
        if (soul.y < -10 || soul.opacity <= 0) roadSouls.splice(s, 1);
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
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
    
    const scaleX = LOGICAL_WIDTH / containerRect.width;
    const scaleY = LOGICAL_HEIGHT / containerRect.height;
    
    const pulse = (Math.sin(lavaPhase * 1.5) + 1) / 2; 

    cardSlots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        // Calculate logical center to avoid alignment issues with overlapping DOM rects
        const sx = (rect.left - containerRect.left) * scaleX;
        const sy = (rect.top - containerRect.top) * scaleY;
        const sw = rect.width * scaleX;
        const sh = rect.height * scaleY;
        
        // Minor padding adjustment for straight grid
        const padding = 1.0; 
        const x = sx + padding;
        const y = sy + padding;
        const w = sw - padding * 2;
        const h = sh - padding * 2;

        ctx.save();
        // 1. Holy White Halo / Shadow
        ctx.shadowBlur = 15 + 8 * pulse;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.55)';
        
        const drawHex = (ctx, x, y, w, h) => {
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y);
            ctx.lineTo(x + w, y + h / 4);
            ctx.lineTo(x + w, y + 3 * h / 4);
            ctx.lineTo(x + w / 2, y + h);
            ctx.lineTo(x, y + 3 * h / 4);
            ctx.lineTo(x, y + h / 4);
            ctx.closePath();
        };

        // 2. Stone Tablet Base (High contrast for better interlocking look)
        const stoneGrad = ctx.createLinearGradient(x, y, x + w, y + h);
        stoneGrad.addColorStop(0, '#333');
        stoneGrad.addColorStop(0.5, '#555');
        stoneGrad.addColorStop(1, '#222');
        ctx.fillStyle = stoneGrad;
        drawHex(ctx, x, y, w, h);
        ctx.fill();

        // 3. Golden Border
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.7 + 0.3 * pulse})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 4. Divine Inner Detailing (Add a cross or rune look to the stone)
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.beginPath();
        ctx.moveTo(x + w/2, y + h/4);
        ctx.lineTo(x + w/2, y + 3*h/4);
        ctx.moveTo(x + w/4, y + h/2);
        ctx.lineTo(x + 3*w/4, y + h/2);
        ctx.stroke();

        if (slot.classList.contains('occupied')) {
            // Sacred pulse for occupied slots
            ctx.fillStyle = `rgba(255, 215, 0, ${0.12 + 0.08 * pulse})`;
            drawHex(ctx, x + 4, y + 4, w - 8, h - 8);
            ctx.fill();
        }
        
        ctx.restore();
    });
}

function drawUnitAuras(cx, cy, tower) {
    const tier = tower.data.tier;
    if (tier < 2) return;

    const time = globalAnimTimer;
    const pulse = (Math.sin(time * 2) + 1) / 2;
    
    ctx.save();
    
    if (tier === 2) {
        // Tier 2: Subtle White Mist
        ctx.globalAlpha = 0.2 + pulse * 0.1;
        ctx.fillStyle = '#fff';
        for(let i=0; i<3; i++) {
            const ang = time + (i * Math.PI * 0.6);
            const ox = Math.cos(ang) * 15;
            const oy = Math.sin(ang * 0.5) * 5;
            ctx.beginPath();
            ctx.arc(cx + ox, cy + 5 + oy, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (tier === 3) {
        // Tier 3: Radiant Golden Particle Vortex
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + pulse * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 8, 25 + pulse * 5, 8 + pulse * 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Golden sparkles
        for(let i=0; i<4; i++) {
            const ang = time * 2 + (i * Math.PI * 0.5);
            const dist = 20 + pulse * 10;
            const px = cx + Math.cos(ang) * dist;
            const py = cy + 8 + Math.sin(ang) * dist * 0.3;
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(px, py, 2, 2);
        }
    } else if (tier === 4) {
        // Tier 4 (Abyss): Intense Abyssal Aura
        const glowGrad = ctx.createRadialGradient(cx, cy + 5, 0, cx, cy + 5, 40);
        glowGrad.addColorStop(0, `rgba(74, 20, 140, ${0.3 + pulse * 0.2})`);
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy + 5, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Abyssal sparks/lightning
        ctx.strokeStyle = `rgba(148, 0, 211, ${0.6 + pulse * 0.4})`;
        ctx.lineWidth = 1.5;
        for(let i=0; i<3; i++) {
            const ang = -time * 3 + (i * Math.PI * 0.6);
            ctx.beginPath();
            ctx.moveTo(cx, cy + 5);
            ctx.lineTo(cx + Math.cos(ang) * 35, cy + 5 + Math.sin(ang) * 15);
            ctx.stroke();
        }
    }
    
    ctx.restore();
}

function drawUnits() {
    if (typeof towers === 'undefined') return;
    const container = document.getElementById('game-container');
    const containerRect = container.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / containerRect.width;
    const scaleY = LOGICAL_HEIGHT / containerRect.height;

    towers.forEach(tower => {
        const rect = tower.element.getBoundingClientRect();
        let cx = Math.floor(((rect.left + rect.width / 2) - containerRect.left) * scaleX);
        let cy = Math.floor(((rect.top + rect.height / 2) - containerRect.top) * scaleY);

        // Shadows
        drawShadow(cx, cy, 14);

        // [User Request] Tier-based Auras
        drawUnitAuras(cx, cy, tower);

        // Idle Bobbing
        const bob = Math.sin(globalAnimTimer + (cx * 0.05)) * 2;
        cy += Math.floor(bob);

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
            case 'executor': drawExecutor(cx, cy, tower); break;
            case 'binder': drawBinder(cx, cy, tower); break;
            case 'grandsealer': drawGrandSealer(cx, cy, tower); break;
            case 'saint': drawSaint(cx, cy, tower); break;
            case 'thousandhand': drawThousandHand(cx, cy, tower); break;
            case 'permafrost': drawPermafrost(cx, cy, tower); break;
            case 'abyssal': drawAbyssalKiller(cx, cy, tower); break;
            case 'spatial': drawSpatialSlasher(cx, cy, tower); break;
            case 'seer': drawSeer(cx, cy, tower); break;
            case 'commander': drawCommander(cx, cy, tower); break;
            case 'wraithlord': drawWraithLord(cx, cy, tower); break;
            case 'cursedshaman': drawCursedShaman(cx, cy, tower); break;
            case 'rampart': drawRampart(cx, cy, tower); break;
            case 'judgment': drawJudgment(cx, cy, tower); break;
            case 'transmuter': drawTransmuter(cx, cy, tower); break;
            case 'oracle': drawOracle(cx, cy, tower); break;
            case 'warden': drawWarden(cx, cy, tower); break;
            case 'cursed_talisman': drawCursedTalisman(cx, cy, tower); break;
            case 'asura': drawAsura(cx, cy, tower); break;
            case 'piercing_shadow': drawPiercingShadow(cx, cy, tower); break;
            case 'cocytus': drawCocytus(cx, cy, tower); break;
            case 'purgatory': drawPurgatory(cx, cy, tower); break;
            case 'reaper': drawReaper(cx, cy, tower); break;
            case 'doom_guide': drawDoomGuide(cx, cy, tower); break;
            case 'forsaken_king': drawForsakenKing(cx, cy, tower); break;
            case 'void_gatekeeper': drawVoidGatekeeper(cx, cy, tower); break;
            case 'eternal_wall': drawEternalWall(cx, cy, tower); break;
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
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
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

function drawExecutor(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 300; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 300) : 0;

    // --- 1. BODY & JUDGE ROBES (Deep Purple / Gold / Black Palette) ---
    const robeColor = '#311B92'; // Deep indigo
    const goldColor = '#FFD700';
    const sashColor = '#4A148C';
    
    // Judge Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-1, 1, goldColor, 2, 11); // Center gold trim
    p(-5, 11, '#1A237E', 11, 3); // Shadow
    
    // Formal Sash
    p(-5, 6, sashColor, 11, 2);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Judge's Cap
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Judge's Cap (Black with Gold trim)
    p(-4, -11, '#000', 9, 4);
    p(-3, -10, '#212121', 7, 3);
    p(-1, -11, goldColor, 3, 1);

    // Eyes (Stern glowing white)
    p(-2, -5, '#FFF', 1, 1);
    p(1, -5, '#FFF', 1, 1);

    // --- 2. THE SCALES OF FATE (Balanced Weapon) ---
    let scaleFloat = Math.sin(time * 3) * 4;
    let scOX = isAttacking ? 12 : 10;
    let scOY = -5 + scaleFloat;
    
    // Scale Beam
    p(scOX - 6, scOY - 4, '#000', 13, 3); // Outline
    p(scOX - 5, scOY - 3, goldColor, 11, 1); // Beam
    
    // Scale Pans (Left & Right)
    for(let i=0; i<2; i++) {
        const side = i === 0 ? -1 : 1;
        const tilt = Math.sin(time * 4 + i) * 2;
        const px = scOX + (side * 5);
        const py = scOY + tilt;
        
        p(px - 2, py + 2, '#000', 5, 4); // Pan outline
        p(px - 1, py + 3, goldColor, 3, 2); // Pan inner
        
        //Pan strings
        p(px - 2, py - 3, '#000', 1, 5);
        p(px + 2, py - 3, '#000', 1, 5);
    }

    // --- 3. JUDGMENT BLAST (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = '#FFD700';
        
        // Fate Pulse
        const blastSize = 30 * flashIntensity * S;
        ctx.strokeStyle = `rgba(255, 215, 0, ${flashIntensity})`;
        ctx.lineWidth = 4 * S;
        ctx.beginPath();
        ctx.arc(cx, cy, blastSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // Golden Law Particles
        for(let i=0; i<6; i++) {
            const sang = (i / 6) * Math.PI * 2 + time * 5;
            const sx = Math.cos(sang) * 40 * flashIntensity;
            const sy = Math.sin(sang) * 40 * flashIntensity;
            p(Math.round(sx/S), Math.round(sy/S), goldColor, 2, 2);
        }
        ctx.restore();
    }

    // --- 4. LAW AURA ---
    const lawPulse = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(255, 215, 0, ${0.05 * lawPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 35 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawBinder(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 350; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 350) : 0;

    // --- 1. BODY & BINDING ROBES (White / Indigo / Cyan Palette) ---
    const robeColor = '#FAFAFA'; // Near white
    const indigoColor = '#3F51B5';
    const cyanColor = '#00E5FF';
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-2, 1, indigoColor, 3, 11); // Center indigo panel
    p(-5, 11, '#E0E0E0', 11, 3); // Shadow
    
    // Glowing Runes on Robe
    p(-4, 4, cyanColor, 1, 2);
    p(3, 8, cyanColor, 1, 2);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Mystic Hood
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Hood
    p(-5, -10, '#000', 11, 5);
    p(-4, -10, indigoColor, 9, 4);
    
    // Eyes (Bright Cyan Glow)
    p(-2, -5, cyanColor, 1, 1);
    p(1, -5, cyanColor, 1, 1);

    // --- 2. THE SOUL SHACKLES (Floating Bindings) ---
    const linkCount = 4;
    for(let i=0; i<linkCount; i++) {
        const ang = (time * 2) + (i * (Math.PI * 2 / linkCount));
        const dist = 16 + (isAttacking ? flashIntensity * 10 : 0);
        
        let lx = Math.cos(ang) * dist;
        let ly = -2 + Math.sin(ang) * (dist * 0.5);
        
        // Shackle Link
        p(Math.round(lx - 1), Math.round(ly - 1), '#000', 3, 3); // Link outline
        p(Math.round(lx), Math.round(ly), cyanColor, 1, 1); // Glowing core
    }

    // --- 3. BINDING LINK (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 35 * flashIntensity;
        ctx.shadowColor = cyanColor;
        
        // Soul Chains reaching out
        ctx.strokeStyle = `rgba(0, 229, 255, ${flashIntensity})`;
        ctx.lineWidth = 3 * S;
        const bX = isLeft ? cx + (12 * S) : cx - (12 * S);
        const bY = cy + (2 * S);
        
        ctx.beginPath();
        ctx.moveTo(bX, bY);
        ctx.lineTo(bX + 150 * (isLeft?1:-1) * flashIntensity, bY);
        ctx.stroke();
        
        // Linking Sparks
        for(let i=0; i<5; i++) {
            const px = bX + (Math.random() * 100 * (isLeft?1:-1));
            const py = bY + (Math.random() - 0.5) * 20;
            p(Math.round((px-cx)/S), Math.round((py-cy)/S), '#FFF', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. BINDING AURA ---
    const bindPulse = (Math.sin(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(0, 229, 255, ${0.06 * bindPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 30 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawGrandSealer(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & VENERABLE ROBES (White / Jade / Red Palette) ---
    const robeColor = '#FFFFFF';
    const jadeColor = '#4DB6AC'; // Jade green
    const patternColor = '#D32F2F'; // Red seal ink
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-1, 1, jadeColor, 3, 11); // Center jade trim
    p(-5, 11, '#F5F5F5', 11, 3); // Shadow
    
    // Grand Seal Characters on Robe
    p(-4, 4, patternColor, 2, 2);
    p(2, 8, patternColor, 2, 2);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Sage Turban
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Sage Turban (White with Jade gem)
    p(-4, -11, '#000', 9, 4);
    p(-3, -10, robeColor, 7, 3);
    p(-1, -11, jadeColor, 3, 2);

    // Eyes (Calm wisdom)
    p(-2, -5, '#333', 1, 1);
    p(2, -5, '#333', 1, 1);

    // --- 2. THE GRAND SEALS (Heavenly Talismans) ---
    const sealCount = 5;
    for(let i=0; i<sealCount; i++) {
        const ang = (time * 1.2) + (i * (Math.PI * 2 / sealCount));
        const floatY = Math.sin(time * 2 + i) * 5;
        const dist = 20 + (isAttacking ? flashIntensity * 15 : 0);
        
        let tx = Math.cos(ang) * dist;
        let ty = -8 + Math.sin(ang) * (dist * 0.3) + floatY;
        
        // Large Sealing Paper
        p(Math.round(tx - 1), Math.round(ty - 4), '#000', 4, 9); // Outline
        p(Math.round(tx), Math.round(ty - 3), '#FFF', 2, 7); // Base
        p(Math.round(tx), Math.round(ty - 2), patternColor, 2, 5); // Grand Seal Script
    }

    // --- 3. ULTIMATE SEALING (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 50 * flashIntensity;
        ctx.shadowColor = '#D32F2F';
        
        // Octagonal Barrier Burst
        const blastX = isLeft ? cx + (15 * S) : cx - (15 * S);
        const blastY = cy - 5 * S;
        
        ctx.strokeStyle = `rgba(211, 47, 47, ${flashIntensity})`;
        ctx.lineWidth = 5 * S;
        ctx.beginPath();
        for(let i=0; i<8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            const dist = 40 * flashIntensity * S;
            const lx = blastX + Math.cos(ang) * dist;
            const ly = blastY + Math.sin(ang) * dist;
            if (i === 0) ctx.moveTo(lx, ly); else ctx.lineTo(lx, ly);
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    }

    // --- 4. SACRED AURA ---
    const sageGlow = (Math.sin(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(77, 182, 172, ${0.08 * sageGlow})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 38 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawSaint(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 500; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 500) : 0;

    // --- 1. BODY & SAINTLY ROBES (White / Gold / Amber Palette) ---
    const robeColor = '#FAFAFA'; // Holy white
    const goldColor = '#FFD700';
    const amberColor = '#FFB300';
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-2, 1, goldColor, 3, 11); // Center gold trim
    p(-5, 11, amberColor, 11, 3); // Shadow
    
    // Holy Beads
    p(-3, 2, '#3E2723', 7, 5);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head (Shaven/Bald)
    const skinColor = '#D7B19D';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // Divine Mark on Forehead
    p(0, -6, goldColor, 1, 2);

    // Eyes (Peaceful glow)
    p(-2, -5, '#FFF', 1, 1);
    p(2, -5, '#FFF', 1, 1);

    // --- 2. THE HOLY BELL (Vibration Catalyst) ---
    let bellFloat = Math.sin(time * 2) * 3;
    let belOX = isAttacking ? 12 : 9;
    let belOY = -10 + bellFloat;
    
    // Bell Frame
    p(belOX - 4, belOY - 6, '#000', 9, 12); // Outline
    p(belOX - 3, belOY - 5, goldColor, 7, 10); // Bell Body
    p(belOX - 1, belOY - 5, '#FFF', 3, 10); // Shine
    p(belOX, belOY + 5, amberColor, 1, 2); // Clapper

    // --- 3. RESONANCE WAVE (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 50 * flashIntensity;
        ctx.shadowColor = goldColor;
        
        // Expanding Sound Waves
        for(let i=0; i<3; i++) {
            const wSize = (flashIntensity * 100 + i * 20) % 100;
            const wAlpha = (1 - wSize/100) * flashIntensity;
            ctx.strokeStyle = `rgba(255, 215, 0, ${wAlpha})`;
            ctx.lineWidth = 4 * S;
            ctx.beginPath();
            const bX = isLeft ? cx + (belOX * S) : cx - (belOX * S);
            const bY = cy + (belOY * S);
            ctx.arc(bX, bY, wSize * S * 0.5, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    // --- 4. RESONANT AURA ---
    const vibePulse = (Math.sin(time * 4) + 1) / 2;
    ctx.fillStyle = `rgba(255, 193, 7, ${0.08 * vibePulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 35 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawThousandHand(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & DIVINE HUNTER ROBES (Green / Gold / Silver Palette) ---
    const robeColor = '#2E7D32'; // Forest green
    const goldColor = '#FFD700';
    const silverColor = '#CFD8DC';
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-2, 1, goldColor, 3, 11); // Center gold trim
    p(-5, 11, '#1B5E20', 11, 3); // Shadow
    
    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Hunter's Hood
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Hood
    p(-5, -10, '#000', 11, 5);
    p(-4, -10, robeColor, 9, 4);
    p(-1, -11, goldColor, 3, 1);

    // Eyes (Green hunter glow)
    p(-2, -5, '#76FF03', 1, 1);
    p(1, -5, '#76FF03', 1, 1);

    // --- 2. THE THOUSAND ARMS (Spectral Limbs) ---
    const armCount = 6;
    for(let i=0; i<armCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const level = Math.floor(i / 2);
        const armWarp = Math.sin(time * 3 + i) * 3;
        
        let ax = (side * (8 + level * 4)) + armWarp;
        let ay = -5 + (level * 6);
        
        // Spectral Arm (Ghostly green)
        p(Math.round(ax), Math.round(ay), `rgba(118, 255, 3, ${0.3})`, 2, 6);
        
        // Arrow in spectral hand
        if (isAttacking) {
            p(Math.round(ax + side * 2), Math.round(ay + 2), silverColor, 4, 1);
        }
    }

    // --- 3. ARROW VOLLEY (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 30 * flashIntensity;
        ctx.shadowColor = '#76FF03';
        
        // Multi-Arrow Swarm
        for(let i=0; i<8; i++) {
            const vx = 15 + (Math.random() * 100 * flashIntensity);
            const vy = -10 + (Math.random() - 0.5) * 60;
            const arrowX = isLeft ? cx + vx*S : cx - vx*S;
            const arrowY = cy + vy*S;
            
            ctx.fillStyle = '#CFD8DC';
            ctx.fillRect(arrowX, arrowY, 15, 2);
            ctx.fillStyle = '#76FF03';
            ctx.fillRect(arrowX + 15*(isLeft?1:-1), arrowY, 5, 2);
        }
        ctx.restore();
    }

    // --- 4. HUNTER'S AURA ---
    const huntPulse = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(76, 175, 80, ${0.08 * huntPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 35 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawPermafrost(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & BLIZZARD ROBES (Light Blue / White / Frost Palette) ---
    const robeColor = '#B2EBF2'; // Pale ice blue
    const whiteColor = '#FFFFFF';
    const detailColor = '#4DD0E1';
    
    // Flowing Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-2, 1, whiteColor, 3, 11); // Center frosty panel
    p(-5, 11, '#80DEEA', 11, 3); // Shadow
    
    // Snowflakes on Robe
    p(-4, 4, whiteColor, 1, 1);
    p(3, 8, whiteColor, 1, 1);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Ice Crown
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // The Ice Crown (Crystal spikes)
    p(-5, -11, detailColor, 3, 4);
    p(-1, -12, detailColor, 3, 5);
    p(3, -11, detailColor, 3, 4);

    // Eyes (Icy white glow)
    p(-2, -5, '#FFF', 1, 1);
    p(1, -5, '#FFF', 1, 1);

    // --- 2. FLOATING SNOW CRYSTALS (Blizzard Catalyst) ---
    const cryCount = 4;
    for(let i=0; i<cryCount; i++) {
        const ang = (time * 2) + (i * (Math.PI * 2 / cryCount));
        const floatY = Math.sin(time * 4 + i) * 4;
        const dist = 18 + (isAttacking ? flashIntensity * 10 : 0);
        
        let cxo = Math.cos(ang) * dist;
        let cyo = -5 + Math.sin(ang) * (dist * 0.5) + floatY;
        
        // Hexagonal Shard
        p(Math.round(cxo - 1), Math.round(cyo - 1), detailColor, 3, 3);
        p(Math.round(cxo), Math.round(cyo), '#FFF', 1, 1);
    }

    // --- 3. BLIZZARD FIELD (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = '#81D4FA';
        
        // Swirling Snow
        for(let i=0; i<10; i++) {
            const sang = (i / 10) * Math.PI * 2 + time * 10;
            const sdist = 30 * flashIntensity + (i * 5);
            const sx = Math.cos(sang) * sdist;
            const sy = Math.sin(sang) * sdist;
            p(Math.round(sx/S), Math.round(sy/S), '#FFF', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. FROST AURA ---
    const frostStep = (Math.sin(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(178, 235, 242, ${0.1 * frostStep})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 35 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawAbyssalKiller(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 300; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 300) : 0;

    // --- 1. BODY & SHADOW ROBES (Black / Deep Violet Palette) ---
    const robeColor = '#121212';
    const violetColor = '#4A148C';
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-2, 1, violetColor, 3, 11); // Center violet trim
    p(-5, 11, '#000', 11, 3); // Shadow
    
    // Tattered cloak
    const capeWarp = Math.sin(time * 4) * 3;
    p(-8 + capeWarp, 2, '#000', 4, 14);
    p(-7 + capeWarp, 3, violetColor, 2, 12);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head (Hooded Assassin)
    p(-4, -10, '#000', 9, 10); 
    p(-3, -9, robeColor, 7, 8);
    
    // Eyes (Faint violet glow)
    p(-2, -5, isAttacking ? '#EA80FC' : '#7B1FA2', 1, 1);
    p(1, -5, isAttacking ? '#EA80FC' : '#7B1FA2', 1, 1);

    // --- 2. THE SOUL SCYTHE (Reaper's Tool) ---
    let scyOX = isAttacking ? 12 : 9;
    let scyOY = -15;
    
    // Scythe Handle (Shaft)
    p(scyOX, scyOY + 5, '#212121', 2, 25);
    
    // Scythe Blade (Curved)
    const bladeColor = isAttacking ? '#EA80FC' : '#455A64';
    p(scyOX - 8, scyOY - 4, '#000', 12, 5); // Blade outline
    p(scyOX - 7, scyOY - 3, bladeColor, 10, 3); // Blade core
    p(scyOX - 7, scyOY - 1, '#FFF', 8, 1); // Sharp edge

    // --- 3. REAPING SLASH (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 35 * flashIntensity;
        ctx.shadowColor = '#9C27B0';
        
        // Shadow Arc
        ctx.strokeStyle = `rgba(156, 39, 176, ${flashIntensity})`;
        ctx.lineWidth = 6 * S;
        ctx.beginPath();
        ctx.arc(cx, cy, 28 * S, -0.5, 0.5);
        ctx.stroke();
        
        // Soul Energy Fragments
        for(let i=0; i<6; i++) {
            const px = (Math.random() - 0.5) * 50;
            const py = (Math.random() - 0.5) * 50;
            p(Math.round(px/S), Math.round(py/S), '#EA80FC', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. ABYSSAL AURA ---
    const abysPulse = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(74, 20, 140, ${0.08 * abysPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 32 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawSpatialSlasher(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 200; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 200) : 0;

    // --- 1. BODY & SPATIAL ARMOR (Indigo / Cyan / White Palette) ---
    const armorColor = '#303F9F';
    const cyanColor = '#00E5FF';
    
    // Suit Body
    p(-5, 1, '#000', 11, 14); // Outline
    p(-4, 2, armorColor, 9, 12);
    p(-2, 2, cyanColor, 3, 10); // Energy center
    
    // Spatial Glitch effect (Small clones)
    if (Math.sin(time * 10) > 0.8) {
        p(-12, 4, `rgba(0, 229, 255, 0.3)`, 5, 10);
        p(8, 2, `rgba(0, 229, 255, 0.3)`, 5, 10);
    }

    // Head (Glitch Visor)
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, armorColor, 7, 7);
    p(-3, -5, cyanColor, 7, 2); // Visor line

    // --- 2. SPATIAL BLADES (Dimension Cutters) ---
    let bladeOX = isAttacking ? 15 : 10;
    let bladeOY = 2;
    
    // Twin Daggers
    p(bladeOX, bladeOY, '#000', 6, 2); // Right blade
    p(bladeOX + 1, bladeOY + 1, cyanColor, 4, 1);
    
    p(-bladeOX - 5, bladeOY, '#000', 6, 2); // Left blade
    p(-bladeOX - 4, bladeOY + 1, cyanColor, 4, 1);

    // --- 3. DIMENSIONAL RIFT (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 30 * flashIntensity;
        ctx.shadowColor = cyanColor;
        
        // Tear in space
        ctx.fillStyle = `rgba(0, 229, 255, ${0.5 * flashIntensity})`;
        ctx.beginPath();
        const riftX = isLeft ? cx + (20 * S) : cx - (20 * S);
        ctx.ellipse(riftX, cy, 5 * S, 20 * S * flashIntensity, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // --- 4. RIFT AURA ---
    const riftStep = (Math.sin(time * 5) + 1) / 2;
    ctx.fillStyle = `rgba(0, 229, 255, ${0.05 * riftStep})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 30 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawSeer(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & ORACLE ROBES (Gold / White / Sky Palette) ---
    const robeColor = '#FFF9C4'; // Pale yellow
    const skyColor = '#03A9F4';
    const goldColor = '#FFD700';
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-1, 1, goldColor, 3, 11); // Center gold trim
    p(-5, 11, '#F0E68C', 11, 3); // Shadow
    
    // Eye Symbols
    p(-4, 4, skyColor, 2, 2);
    p(2, 8, skyColor, 2, 2);

    // Head & Seer's Eye
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // Large Eye Emblem on Head
    p(-3, -11, '#000', 7, 5);
    p(-2, -10, '#FFF', 5, 3);
    p(0, -9, skyColor, 1, 1); // Pupil

    // --- 2. THE TELESCOPE STAFF (Cosmic Lens) ---
    let staffOX = isAttacking ? 10 : 8;
    let staffOY = -12;
    
    // Staff
    p(staffOX, staffOY, '#5D4037', 2, 26);
    
    // Lens Top
    p(staffOX - 2, staffOY - 4, '#000', 7, 7); // Frame
    p(staffOX - 1, staffOY - 3, goldColor, 5, 5);
    p(staffOX, staffOY - 2, '#81D4FA', 3, 3); // Lens glass

    // --- 3. REVELATION BEAM (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = skyColor;
        
        // Concentrated Light
        const beamX = isLeft ? cx + (staffOX * S) : cx - (staffOX * S);
        const beamY = cy + (staffOY * S);
        
        ctx.strokeStyle = `rgba(3, 169, 244, ${flashIntensity})`;
        ctx.lineWidth = 5 * S;
        ctx.beginPath();
        ctx.moveTo(beamX, beamY);
        ctx.lineTo(beamX + 150*(isLeft?1:-1)*flashIntensity, beamY);
        ctx.stroke();
        
        ctx.restore();
    }

    // --- 4. OMNISCIENT AURA ---
    const eyePulse = (Math.sin(time * 1.2) + 1) / 2;
    ctx.fillStyle = `rgba(255, 235, 59, ${0.06 * eyePulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 35 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawCommander(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & WAR ARMOR (Red / Gold / Steel Palette) ---
    const armorColor = '#455A64'; // Steel grey
    const redColor = '#D32F2F';
    const goldColor = '#FFD700';
    
    // Armor Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, armorColor, 11, 13);
    p(-2, 1, redColor, 3, 11); // Center red trim
    p(-5, 11, '#263238', 11, 3); // Shadow
    
    // Pauldrons
    p(-8, 1, goldColor, 4, 4);
    p(5, 1, goldColor, 4, 4);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Officer's Helm
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, armorColor, 7, 7);
    
    // Red Crest on Helm
    p(-1, -12, redColor, 3, 4);

    // --- 2. THE BATTLE BANNER (Inspirational Tool) ---
    let banOX = isAttacking ? 12 : 9;
    let banOY = -18;
    
    // Banner Staff
    p(banOX, banOY, '#3E2723', 2, 35);
    
    // The Flag (Flowing)
    const flagWarp = Math.sin(time * 3) * 5;
    p(banOX, banOY + 2, '#000', 12 + flagWarp, 12); // Outline
    p(banOX + 1, banOY + 3, redColor, 10 + flagWarp, 10); // Red flag
    p(banOX + 4, banOY + 6, goldColor, 2, 2); // Center gold emblem on flag

    // --- 3. INSPIRING SHOUT (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 35 * flashIntensity;
        ctx.shadowColor = '#FFD700';
        
        // Aura expansion
        ctx.strokeStyle = `rgba(211, 47, 47, ${flashIntensity})`;
        ctx.lineWidth = 4 * S;
        ctx.beginPath();
        ctx.arc(cx, cy, 40 * flashIntensity * S, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    // --- 4. COMMAND AURA ---
    const cmdPulse = (Math.sin(time * 2) + 1) / 2;
    ctx.fillStyle = `rgba(211, 47, 47, ${0.08 * cmdPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 38 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawWraithLord(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & NECROTIC ROBES (Deep Purple / Green Palette) ---
    const robeColor = '#311B92'; // Deep purple
    const deathColor = '#00C853'; // Necrotic green glow
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-2, 1, deathColor, 3, 11); // Center green trim
    p(-5, 11, '#1A237E', 11, 3); // Shadow
    
    // Skulls on Robe
    p(-4, 4, '#ECEFF1', 2, 2);
    p(3, 8, '#ECEFF1', 2, 2);

    // Boots (Spectral)
    p(-4, 14, `rgba(0, 200, 83, ${0.3})`, 4, 3);
    p(1, 14, `rgba(0, 200, 83, ${0.3})`, 4, 3);

    // Head (Lich Crown)
    p(-4, -10, '#000', 9, 10); 
    p(-3, -9, robeColor, 7, 8);
    
    // The Crown
    p(-5, -12, deathColor, 1, 4);
    p(0, -13, deathColor, 1, 5);
    p(4, -12, deathColor, 1, 4);

    // Eyes (Intense green glow)
    p(-2, -5, '#FFF', 1, 1);
    p(1, -5, '#FFF', 1, 1);

    // --- 2. THE SOUL LANTERN (Wraith Focus) ---
    let lanFloat = Math.sin(time * 3) * 4;
    let lanOX = isAttacking ? 10 : 8;
    let lanOY = -5 + lanFloat;
    
    // Lantern Frame
    p(lanOX - 3, lanOY - 4, '#000', 7, 9); // Outline
    p(lanOX - 2, lanOY - 3, '#424242', 5, 7); // Metal
    p(lanOX - 1, lanOY - 2, deathColor, 3, 5); // Green core

    // --- 3. RESURRECTION PULSE (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = deathColor;
        
        // Ghastly Hands
        for(let i=0; i<4; i++) {
            const side = i % 2 === 0 ? -1 : 1;
            const hDist = 20 + (i * 10);
            const hX = isLeft ? cx + side*hDist : cx - side*hDist;
            const hY = cy + 30 - flashIntensity * 20;
            
            ctx.fillStyle = `rgba(0, 200, 83, ${0.4 * flashIntensity})`;
            ctx.fillRect(hX, hY, 10, 20);
        }
        ctx.restore();
    }

    // --- 4. UNDEAD AURA ---
    const ghostStep = (Math.sin(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(0, 200, 83, ${0.06 * ghostStep})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 35 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawCursedShaman(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & SHAMAN ROBES (Indigo / Grey / Bone Palette) ---
    const robeColor = '#3F51B5'; // Indigo
    const greyColor = '#757575';
    const boneColor = '#E0E0E0';
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-5, 1, greyColor, 2, 13); // Trim
    p(4, 1, greyColor, 2, 13);
    
    // Bone charms
    p(-3, 4, boneColor, 7, 2);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head & Shaman's Mask
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor = '#D7B19D', 7, 7);
    
    // The Mask (Wooden/Bone)
    p(-4, -10, '#000', 9, 8); // Mask outline
    p(-3, -9, '#5D4037', 7, 6); // Wood base
    p(-2, -7, boneColor, 5, 2); // Bone mouth part
    
    // Eyes (Dark red glow)
    p(-2, -5, '#FF1744', 1, 1);
    p(1, -5, '#FF1744', 1, 1);

    // --- 2. THE CURSED TOTEM (Spirit Link) ---
    let totFloat = Math.cos(time * 2) * 5;
    let totOX = isAttacking ? 12 : 9;
    let totOY = -5 + totFloat;
    
    // Totem Frame
    p(totOX - 3, totOY - 6, '#000', 7, 14); // Outline
    p(totOX - 2, totOY - 5, '#3E2723', 5, 12); // Wood
    p(totOX - 1, totOY - 3, '#FF1744', 3, 3); // Red center gem

    // --- 3. CURSE BLAST (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 35 * flashIntensity;
        ctx.shadowColor = '#D50000';
        
        // Dark Malediction
        const blastX = isLeft ? cx + (totOX * S) : cx - (totOX * S);
        const blastY = cy + (totOY * S);
        
        ctx.fillStyle = `rgba(213, 0, 0, ${0.3 * flashIntensity})`;
        ctx.beginPath();
        ctx.moveTo(blastX, blastY);
        ctx.lineTo(blastX + 120*(isLeft?1:-1)*flashIntensity, blastY - 40);
        ctx.lineTo(blastX + 120*(isLeft?1:-1)*flashIntensity, blastY + 40);
        ctx.fill();
        
        ctx.restore();
    }

    // --- 4. MALICE AURA ---
    const curseStep = (Math.sin(time * 1.8) + 1) / 2;
    ctx.fillStyle = `rgba(183, 28, 28, ${0.05 * curseStep})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 32 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawRampart(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 300; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 300) : 0;

    // --- 1. BODY & FORTRESS ARMOR (White / Gold / Blue Palette) ---
    const armorColor = '#ECEFF1'; // White steel
    const goldColor = '#FFD700';
    const blueColor = '#1976D2';
    
    // Heavy Body
    p(-7, -2, '#000', 15, 18); // Outline
    p(-6, -1, armorColor, 13, 16);
    p(-3, -1, blueColor, 7, 14); // Blue center
    
    // Massive Pauldrons (Shield-like)
    p(-9, -2, goldColor, 5, 8);
    p(5, -2, goldColor, 5, 8);

    // Boots
    p(-5, 14, '#000', 5, 4);
    p(1, 14, '#000', 5, 4);

    // Head (Castle Helm)
    p(-4, -10, '#000', 9, 9); 
    p(-3, -9, armorColor, 7, 7);
    p(-1, -11, goldColor, 3, 2); // Battlements on helm

    // --- 2. THE TOWER SHIELD (Unbreakable Wall) ---
    let shieldOX = isAttacking ? -12 : -10;
    let shieldOY = -5;
    
    // Large Rectangular Shield
    p(shieldOX - 3, shieldOY - 6, '#000', 11, 20); // Outline
    p(shieldOX - 2, shieldOY - 5, armorColor, 9, 18);
    p(shieldOX, shieldOY - 2, goldColor, 5, 12); // Center gold pillar

    // --- 3. SHIELD BASH (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = '#FFF';
        
        // Massive Shockwave
        const waveX = isLeft ? cx + (shieldOX * S) : cx - (shieldOX * S);
        const waveY = cy + (shieldOY + 4) * S;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 * flashIntensity})`;
        ctx.beginPath();
        ctx.arc(waveX, waveY, 40 * flashIntensity * S, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // --- 4. FORTRESS AURA ---
    const fortStep = (Math.sin(time * 1.2) + 1) / 2;
    ctx.fillStyle = `rgba(25, 118, 210, ${0.08 * fortStep})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 40 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawJudgment(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & JUDGMENT ARMOR (Silver / Gold / Light Blue Palette) ---
    const armorColor = '#B0BEC5'; // Silver
    const goldColor = '#FFD700';
    const cyanColor = '#00E5FF';
    
    // Plate Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, armorColor, 11, 13);
    p(-2, 1, goldColor, 3, 11); // Center gold trim
    p(-5, 11, '#78909C', 11, 3); // Shadow
    
    // Glowing Wings detail
    p(-8, 2, cyanColor, 3, 10);
    p(6, 2, cyanColor, 3, 10);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head (Angelic Helm)
    p(-4, -10, '#000', 9, 10); 
    p(-3, -9, armorColor, 7, 8);
    p(-1, -7, cyanColor, 3, 1); // Eye slit glow

    // --- 2. THE JUDGMENT SWORD (Ascended Edge) ---
    let swordOX = isAttacking ? 12 : 9;
    let swordOY = -18;
    
    // Sword
    p(swordOX - 1, swordOY, '#000', 3, 25); // Outline
    p(swordOX, swordOY + 1, '#FFF', 1, 23); // Blade core
    p(swordOX - 3, swordOY + 20, goldColor, 7, 2); // Crossguard

    // --- 3. HOLY LIGHT STRIKE (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 50 * flashIntensity;
        ctx.shadowColor = cyanColor;
        
        // Massive Pillar of Light
        const beamX = isLeft ? cx + (swordOX * S) : cx - (swordOX * S);
        ctx.fillStyle = `rgba(0, 229, 255, ${0.3 * flashIntensity})`;
        ctx.fillRect(beamX - 10*S, 0, 20*S, cy + 10*S);
        
        // Sparkles
        for(let i=0; i<8; i++) {
            const px = beamX + (Math.random() - 0.5) * 40;
            const py = (Math.random()) * cy;
            p(Math.round((px-cx)/S), Math.round((py-cy)/S), '#FFF', 1, 1);
        }
        ctx.restore();
    }

    // --- 4. DIVINE JUDGMENT AURA ---
    const judgePulse = (Math.sin(time * 2.5) + 1) / 2;
    ctx.fillStyle = `rgba(0, 229, 255, ${0.1 * judgePulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 38 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawTransmuter(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 300; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 300) : 0;

    // --- 1. BODY & VOID ALCHEMY ROBES (Black / Neon Green / Gold Palette) ---
    const robeColor = '#000000'; 
    const neonColor = '#00E676';
    const goldColor = '#FFD700';
    
    // Complex Robes
    p(-7, 0, '#333', 15, 15); // Outline
    p(-6, 1, robeColor, 13, 13);
    p(-6, 11, neonColor, 13, 1); // Bottom neon trim
    p(-2, 1, goldColor, 3, 4); // Chest plate
    p(-1, 2, neonColor, 1, 2); // Chest core
    
    // Boots
    p(-5, 14, '#111', 4, 3);
    p(2, 14, '#111', 4, 3);

    // Head
    const skinColor = '#F5DDC7';
    p(-4, -9, '#333', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // Alchemist Monocle/Visor
    p(-4, -6, goldColor, 9, 2);
    p(-2, -6, neonColor, 2, 2);
    p(1, -6, neonColor, 2, 2);

    // --- 2. TRANSMUTATION MATRIX (Floating Array) ---
    // A large floating geometric matrix behind/around them
    ctx.save();
    ctx.strokeStyle = `rgba(0, 230, 118, ${0.4 + 0.6 * flashIntensity})`;
    ctx.lineWidth = 1 * S;
    ctx.translate(cx, cy - 5 * S);
    ctx.rotate(time);
    
    // Hexagon
    ctx.beginPath();
    for(let i=0; i<6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const dist = 18 * S;
        if(i===0) ctx.moveTo(Math.cos(ang)*dist, Math.sin(ang)*dist);
        else ctx.lineTo(Math.cos(ang)*dist, Math.sin(ang)*dist);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Inner Triangle
    ctx.beginPath();
    for(let i=0; i<3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        const dist = 18 * S;
        if(i===0) ctx.moveTo(Math.cos(ang)*dist, Math.sin(ang)*dist);
        else ctx.lineTo(Math.cos(ang)*dist, Math.sin(ang)*dist);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // --- 3. ESSENCE CONVERSION (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = neonColor;
        
        // Conversion Beam
        const beamX = isLeft ? cx + (15 * S) : cx - (15 * S);
        ctx.fillStyle = `rgba(0, 230, 118, ${0.5 * flashIntensity})`;
        ctx.fillRect(beamX, cy - 8 * S, 150 * (isLeft?1:-1) * flashIntensity, 16 * S);
        ctx.restore();
    }

    // --- 4. VOID AURA ---
    const voidPulse = (Math.sin(time * 2.5) + 1) / 2;
    ctx.fillStyle = `rgba(0, 230, 118, ${0.08 * voidPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 45 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawOracle(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & COSMIC ROBES (Starry Night Palette) ---
    const robeColor = '#1A237E'; 
    const starColor = '#E0F7FA';
    const cosmicPurple = '#651FFF';
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-3, 1, cosmicPurple, 5, 11); // Center cosmic stream
    
    // Star patterns on robe
    if (Math.sin(time*5) > 0) p(-4, 3, starColor, 1, 1);
    if (Math.sin(time*6) > 0) p(3, 7, starColor, 1, 1);

    // Head & Third Eye
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // Floating Halo/Crown
    p(-5, -12, '#FFD700', 11, 1);
    p(-1, -14, '#FFD700', 3, 3);
    p(0, -13, '#00E5FF', 1, 1); // Third eye jewel

    // Eyes
    p(-2, -5, '#FFF', 1, 1);
    p(1, -5, '#FFF', 1, 1);

    // --- 2. THE ETERNITY ORBS (Orbiting Planets) ---
    const orbCount = 3;
    for(let i=0; i<orbCount; i++) {
        const ang = (time * 1.5) + (i * (Math.PI * 2 / orbCount));
        const dist = 22 + (isAttacking ? flashIntensity * 15 : 0);
        
        let ox = Math.cos(ang) * dist;
        let oy = Math.sin(ang) * dist * 0.3; // Tilted orbit
        
        // Planet
        p(Math.round(ox - 2), Math.round(oy - 2), '#000', 5, 5); // Outline
        p(Math.round(ox - 1), Math.round(oy - 1), cosmicPurple, 3, 3);
        p(Math.round(ox), Math.round(oy), '#00E5FF', 1, 1); // Core
    }

    // --- 3. COSMIC PROJECTION (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 50 * flashIntensity;
        ctx.shadowColor = '#00E5FF';
        
        // Starburst
        const blastX = isLeft ? cx + (15 * S) : cx - (15 * S);
        ctx.fillStyle = `rgba(224, 247, 250, ${0.5 * flashIntensity})`;
        ctx.beginPath();
        ctx.arc(blastX, cy, 25 * flashIntensity * S, 0, Math.PI * 2);
        ctx.fill();
        
        // Shooting Star
        ctx.strokeStyle = `rgba(0, 229, 255, ${flashIntensity})`;
        ctx.lineWidth = 2 * S;
        ctx.beginPath();
        ctx.moveTo(blastX, cy);
        ctx.lineTo(blastX + 100*(isLeft?1:-1), cy);
        ctx.stroke();
        
        ctx.restore();
    }

    // --- 4. GALAXY AURA ---
    const galaxyPulse = (Math.sin(time * 1.2) + 1) / 2;
    ctx.fillStyle = `rgba(101, 31, 255, ${0.08 * galaxyPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 45 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawWarden(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 800; // Long cooldown, long animation
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 800) : 0;

    // --- 1. BODY & HEAVY WARDEN ARMOR (Black / Iron / Purple Palette) ---
    const armorColor = '#212121'; 
    const ironColor = '#546E7A';
    const voidColor = '#6A1B9A';
    
    // Massive Body
    p(-8, -2, '#000', 17, 18); // Outline
    p(-7, -1, armorColor, 15, 16);
    p(-4, -1, ironColor, 9, 14); // Iron chestplate
    
    // Chains wrapped around body
    p(-7, 3, '#000', 15, 2);
    p(-7, 3, '#9E9E9E', 15, 1);
    
    // Boots
    p(-6, 14, '#000', 5, 4);
    p(2, 14, '#000', 5, 4);

    // Head (Iron Mask)
    p(-5, -11, '#000', 11, 11); 
    p(-4, -10, ironColor, 9, 9);
    p(-2, -6, voidColor, 5, 2); // glowing visor slit

    // --- 2. THE ABYSSAL KEY (Gravity Weapon) ---
    let keyOX = isAttacking ? 15 : 12;
    let keyOY = isAttacking ? -10 : -8;
    
    // Key Shaft
    p(keyOX - 1, keyOY - 10, '#000', 5, 24);
    p(keyOX, keyOY - 9, '#424242', 3, 22);
    
    // Key Teeth
    p(keyOX + 2, keyOY - 8, '#424242', 4, 3);
    p(keyOX + 2, keyOY - 3, '#424242', 4, 3);
    
    // Key Ring
    p(keyOX - 2, keyOY + 10, '#000', 7, 7);
    p(keyOX - 1, keyOY + 11, '#424242', 5, 5);
    p(keyOX + 1, keyOY + 12, '#000', 1, 3); // hole

    // --- 3. EVENT HORIZON (Attack Effect - Black Hole) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 60 * flashIntensity;
        ctx.shadowColor = voidColor;
        
        // Singularity
        const bhX = isLeft ? cx + (25 * S) : cx - (25 * S);
        const bhY = cy - 5 * S;
        
        // Outer accretion disk
        ctx.fillStyle = `rgba(106, 27, 154, ${0.5 * flashIntensity})`;
        ctx.beginPath();
        ctx.ellipse(bhX, bhY, 30 * S * flashIntensity, 10 * S * flashIntensity, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner void
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(bhX, bhY, 15 * S * flashIntensity, 0, Math.PI * 2);
        ctx.fill();
        
        // Event Horizon glow
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1 * S;
        ctx.beginPath();
        ctx.arc(bhX, bhY, 15 * S * flashIntensity, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    // --- 4. GRAVITY AURA ---
    const gravPulse = (Math.sin(time * 3) + 1) / 2;
    ctx.fillStyle = `rgba(33, 33, 33, ${0.2 * gravPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 45 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawCursedTalisman(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 350; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 350) : 0;

    // --- 1. BODY & CORRUPTED SHRINE ROBES (Crimson / Black / White Palette) ---
    const robeColor = '#B71C1C'; // Blood red
    const whiteColor = '#E0E0E0'; // Dirty white
    const darkColor = '#212121';
    
    // Robe Body (Hakama style)
    p(-7, 0, '#000', 15, 15); // Outline
    p(-6, 1, whiteColor, 13, 6); // Top
    p(-6, 7, robeColor, 13, 7); // Bottom Hakama
    
    // Shimenawa (Sacred rope) around waist
    p(-7, 6, '#FFD54F', 15, 2);
    p(-3, 8, whiteColor, 2, 3); // Paper zigzag

    // Boots (Geta sandals)
    p(-5, 14, darkColor, 4, 3);
    p(2, 14, darkColor, 4, 3);

    // Head & Corrupted Mask
    p(-5, -10, '#000', 11, 11); 
    p(-4, -9, darkColor, 9, 9); // Hair
    
    // Oni Mask
    p(-3, -6, robeColor, 7, 6);
    p(-2, -5, '#FFF', 1, 1); // Eye L
    p(2, -5, '#FFF', 1, 1);  // Eye R
    p(-1, -3, '#000', 3, 2); // Mouth
    p(-2, -3, '#FFF', 1, 1); // Fang L
    p(2, -3, '#FFF', 1, 1);  // Fang R

    // --- 2. THE CURSED SEALS (Black Paper, Red Ink) ---
    const sealCount = 4;
    for(let i=0; i<sealCount; i++) {
        const ang = (time * 2) + (i * (Math.PI * 2 / sealCount));
        const dist = 22 + (isAttacking ? flashIntensity * 12 : 0);
        
        let tx = Math.cos(ang) * dist;
        let ty = -5 + Math.sin(ang) * (dist * 0.5);
        
        // Cursed Talisman
        p(Math.round(tx - 2), Math.round(ty - 4), '#FF1744', 5, 9); // Red Outline aura
        p(Math.round(tx - 1), Math.round(ty - 3), '#000', 3, 7); // Black paper
        p(Math.round(tx), Math.round(ty - 2), '#FF1744', 1, 5); // Glowing Red Script
    }

    // --- 3. EXTINGUISH SOUL (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 50 * flashIntensity;
        ctx.shadowColor = '#D50000';
        
        // Massive Red Cross/Mark
        const markX = isLeft ? cx + (25 * S) : cx - (25 * S);
        const markY = cy - 5 * S;
        
        ctx.fillStyle = `rgba(213, 0, 0, ${0.8 * flashIntensity})`;
        ctx.fillRect(markX - 2*S, markY - 15*S, 4*S, 30*S); // Vertical
        ctx.fillRect(markX - 15*S, markY - 2*S, 30*S, 4*S); // Horizontal
        
        ctx.restore();
    }

    // --- 4. MALICIOUS AURA ---
    const malicePulse = (Math.sin(time * 3) + 1) / 2;
    ctx.fillStyle = `rgba(183, 28, 28, ${0.1 * malicePulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 40 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawAsura(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 200; // Extremely fast
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 200) : 0;

    // --- 1. BODY & WRATHFUL FORM (Crimson Skin / Gold / Flame Palette) ---
    const skinColor = '#D32F2F'; // Blood red skin
    const goldColor = '#FFD700';
    const flameColor = '#FF3D00';
    
    // Muscular Torso
    p(-8, -2, '#000', 17, 15); // Outline
    p(-7, -1, skinColor, 15, 13);
    p(-4, -1, '#B71C1C', 9, 13); // Core shadow
    
    // Golden Jewelry
    p(-5, 3, goldColor, 11, 2); // Necklace/Chest piece
    p(-6, 9, goldColor, 13, 3); // Belt

    // Pants (Dark Grey)
    p(-6, 12, '#424242', 13, 5);

    // Head (Wrathful Face)
    p(-5, -11, '#000', 11, 11); 
    p(-4, -10, skinColor, 9, 9);
    
    // Three Eyes
    p(-2, -6, '#FFF', 1, 1);
    p(2, -6, '#FFF', 1, 1);
    p(0, -8, '#FFF', 1, 1); // Third eye

    // Flaming Hair
    const fireWarp = Math.sin(time * 10) * 2;
    p(-5 + fireWarp, -14, flameColor, 11, 4);
    p(-3 - fireWarp, -16, flameColor, 7, 2);

    // --- 2. THE MULTIPLE ARMS (Six-armed Deity) ---
    for(let i=0; i<3; i++) { // 3 pairs of arms
        const armY = 0 + (i * 3);
        const armStretch = isAttacking ? flashIntensity * 15 * Math.random() : 0; // Rapid punching
        
        // Left Side Arms
        p(-12 - armStretch, armY, '#000', 6, 4);
        p(-11 - armStretch, armY + 1, skinColor, 4, 2);
        p(-14 - armStretch, armY, goldColor, 3, 4); // Fists/Bracelets
        
        // Right Side Arms
        p(7 + armStretch, armY, '#000', 6, 4);
        p(8 + armStretch, armY + 1, skinColor, 4, 2);
        p(12 + armStretch, armY, goldColor, 3, 4); // Fists/Bracelets
    }

    // --- 3. RAPID FLURRY (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 30 * flashIntensity;
        ctx.shadowColor = flameColor;
        
        // Multi-hit impacts
        for(let i=0; i<6; i++) {
            const hitX = (isLeft ? cx + (15 * S) : cx - (15 * S)) + (Math.random() - 0.5) * 40;
            const hitY = cy + (Math.random() - 0.5) * 40;
            
            ctx.fillStyle = `rgba(255, 61, 0, ${0.8 * flashIntensity})`;
            ctx.beginPath();
            ctx.arc(hitX, hitY, 10 * Math.random() * S, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // --- 4. RAGE AURA ---
    const ragePulse = (Math.sin(time * 5) + 1) / 2;
    ctx.fillStyle = `rgba(255, 61, 0, ${0.1 * ragePulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 40 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawPiercingShadow(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 600; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 600) : 0;

    // --- 1. BODY & CELESTIAL ROBES (White / Silver / Gold Palette) ---
    const robeColor = '#FFFFFF'; 
    const silverColor = '#CFD8DC';
    const goldColor = '#FFD700';
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-2, 1, goldColor, 3, 11); // Center gold trim
    
    // Glowing Wings (Ethereal)
    const wingWarp = Math.sin(time * 2) * 2;
    p(-12, 0 + wingWarp, `rgba(255, 255, 255, 0.5)`, 6, 12);
    p(7, 0 - wingWarp, `rgba(255, 255, 255, 0.5)`, 6, 12);

    // Boots
    p(-4, 14, '#000', 4, 3);
    p(1, 14, '#000', 4, 3);

    // Head
    const skinColor = '#F5DDC7';
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, skinColor, 7, 7);
    
    // Halo
    p(-6, -11, goldColor, 13, 1);

    // Eyes
    p(-2, -5, '#00E5FF', 1, 1);
    p(1, -5, '#00E5FF', 1, 1);

    // --- 2. THE STELLAR BOW (Massive Energy Construct) ---
    let bowOX = 10;
    let bowOY = -15;
    
    // Bow Frame (Made of pure light)
    p(bowOX, bowOY, goldColor, 2, 35);
    p(bowOX - 1, bowOY - 2, goldColor, 2, 4); // Upper curve
    p(bowOX - 1, bowOY + 33, goldColor, 2, 4); // Lower curve

    // --- 3. PIERCING BEAM (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 60 * flashIntensity;
        ctx.shadowColor = '#FFFFFF';
        
        // Massive Screen-Piercing Beam
        const beamX = isLeft ? cx + (bowOX * S) : cx - (bowOX * S);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * flashIntensity})`;
        ctx.fillRect(beamX, cy - 10 * S, 1000 * (isLeft?1:-1), 20 * S);
        
        // Beam Core
        ctx.fillStyle = `rgba(0, 229, 255, ${flashIntensity})`;
        ctx.fillRect(beamX, cy - 4 * S, 1000 * (isLeft?1:-1), 8 * S);
        
        ctx.restore();
    }

    // --- 4. DIVINE AURA ---
    const divinePulse = (Math.sin(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * divinePulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 45 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawCocytus(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 1000; // Massive cooldown
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 1000) : 0;

    // --- 1. BODY & GLACIAL ARMOR (Ice / Navy / Silver Palette) ---
    const armorColor = '#1A237E'; 
    const iceColor = '#00B8D4';
    const silverColor = '#E0F7FA';
    
    // Robe/Armor Body
    p(-7, -1, '#000', 15, 17); // Outline
    p(-6, 0, armorColor, 13, 15);
    p(-3, 0, iceColor, 7, 15); // Ice chest
    
    // Spiked Pauldrons
    p(-10, -2, iceColor, 5, 5);
    p(6, -2, iceColor, 5, 5);

    // Boots
    p(-5, 14, '#000', 5, 4);
    p(1, 14, '#000', 5, 4);

    // Head (Crowned in Ice)
    p(-4, -10, '#000', 9, 10); 
    p(-3, -9, silverColor, 7, 8); // Pale frozen skin
    
    // The Frozen Crown
    p(-5, -13, iceColor, 3, 5);
    p(-1, -15, iceColor, 3, 7);
    p(3, -13, iceColor, 3, 5);

    // Eyes
    p(-2, -5, '#FFF', 1, 1);
    p(1, -5, '#FFF', 1, 1);

    // --- 2. THE FROZEN HOURGLASS (Time Magic) ---
    let glassOX = isAttacking ? 12 : 9;
    let glassOY = -8;
    
    p(glassOX - 3, glassOY - 5, '#000', 7, 11); // Outline
    p(glassOX - 2, glassOY - 4, '#BDBDBD', 5, 2); // Top plate
    p(glassOX - 2, glassOY + 3, '#BDBDBD', 5, 2); // Bottom plate
    p(glassOX - 1, glassOY - 2, iceColor, 3, 2); // Top glass
    p(glassOX - 1, glassOY + 1, iceColor, 3, 2); // Bottom glass
    p(glassOX, glassOY, '#FFF', 1, 1); // Center

    // --- 3. TIME FREEZE (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 60 * flashIntensity;
        ctx.shadowColor = iceColor;
        
        // Screen-wide Frost Nova
        ctx.fillStyle = `rgba(0, 184, 212, ${0.3 * flashIntensity})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 300 * flashIntensity, 0, Math.PI * 2); // Massive radius
        ctx.fill();
        
        // Ice Clock UI effect
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * flashIntensity})`;
        ctx.lineWidth = 2 * S;
        ctx.beginPath();
        ctx.arc(cx, cy, 50 * S, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    // --- 4. ABSOLUTE ZERO AURA ---
    const chillPulse = (Math.sin(time * 0.5) + 1) / 2;
    ctx.fillStyle = `rgba(0, 184, 212, ${0.1 * chillPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 50 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawPurgatory(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 500; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 500) : 0;

    // --- 1. BODY & MAGMA ROBES (Obsidian / Magma / Fire Palette) ---
    const obsidianColor = '#212121'; 
    const magmaColor = '#D84315';
    const flameColor = '#FFEB3B'; // White-hot yellow
    
    // Heavy Robe Body
    p(-7, 0, '#000', 15, 15); // Outline
    p(-6, 1, obsidianColor, 13, 13);
    
    // Magma Veins
    p(-3, 3, magmaColor, 2, 8);
    p(2, 3, magmaColor, 2, 8);
    p(-2, 7, flameColor, 5, 2); // Core heat

    // Boots
    p(-5, 14, '#000', 5, 4);
    p(1, 14, '#000', 5, 4);

    // Head (Demon Horns)
    p(-4, -10, '#000', 9, 10); 
    p(-3, -9, obsidianColor, 7, 8);
    
    // Horns
    p(-5, -13, '#000', 3, 5);
    p(-4, -12, magmaColor, 1, 3);
    p(3, -13, '#000', 3, 5);
    p(4, -12, magmaColor, 1, 3);

    // Eyes
    p(-2, -5, flameColor, 1, 1);
    p(1, -5, flameColor, 1, 1);

    // --- 2. THE INFERNAL BRAZIER ---
    let brazOX = isAttacking ? 12 : 9;
    let brazOY = -5;
    
    // Brazier Chains
    p(brazOX - 2, brazOY - 10, '#757575', 1, 6);
    
    // Brazier Bowl
    p(brazOX - 4, brazOY - 4, '#000', 9, 8);
    p(brazOX - 3, brazOY - 3, obsidianColor, 7, 6);
    p(brazOX - 2, brazOY - 5, flameColor, 5, 3); // Fire erupting

    // --- 3. PURGATORY WALL (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 50 * flashIntensity;
        ctx.shadowColor = '#FF3D00';
        
        // Massive Flame Wall
        const wallX = isLeft ? cx + (20 * S) : cx - (20 * S);
        ctx.fillStyle = `rgba(255, 61, 0, ${0.6 * flashIntensity})`;
        ctx.fillRect(wallX, cy - 40 * S, 40 * S * (isLeft?1:-1), 80 * S);
        
        // White-hot core
        ctx.fillStyle = `rgba(255, 235, 59, ${0.8 * flashIntensity})`;
        ctx.fillRect(wallX + 10*S*(isLeft?1:-1), cy - 30 * S, 10 * S * (isLeft?1:-1), 60 * S);
        
        ctx.restore();
    }

    // --- 4. SCORCHED EARTH AURA ---
    const heatStep = (Math.sin(time * 5) + 1) / 2;
    ctx.fillStyle = `rgba(216, 67, 21, ${0.1 * heatStep})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 45 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawReaper(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & SHADOW CLOAK (Pure Black / Ghostly White Palette) ---
    const robeColor = '#0A0A0A'; // Vantablack
    const boneColor = '#F5F5F5';
    
    // Tattered Cloak (Flowing heavily)
    const cloakWarp = Math.sin(time * 3) * 5;
    p(-8 + cloakWarp, 0, '#000', 17, 16); // Outline
    p(-7 + cloakWarp, 1, robeColor, 15, 14);
    p(-7, 11, '#000', 15, 5); // Tattered bottom
    
    // Skeletal Ribs
    p(-3, 3, boneColor, 7, 1);
    p(-2, 5, boneColor, 5, 1);

    // Head (Skull deep in hood)
    p(-5, -11, '#000', 11, 11); 
    p(-4, -10, robeColor, 9, 9);
    p(-2, -7, boneColor, 5, 5); // Skull face
    p(-1, -6, '#000', 1, 1); // Eye socket
    p(1, -6, '#000', 1, 1);

    // --- 2. THE NIGHTMARE SCYTHE (Executioner's Blade) ---
    let scyOX = isAttacking ? 15 : 10;
    let scyOY = isAttacking ? -10 : -20;
    
    // Scythe Staff
    p(scyOX, scyOY, '#212121', 2, 35);
    
    // Massive Blade
    p(scyOX - 15, scyOY - 4, '#000', 20, 6); // Outline
    p(scyOX - 14, scyOY - 3, '#757575', 18, 4); // Metal
    p(scyOX - 14, scyOY - 1, '#FFF', 15, 1); // Sharp edge

    // --- 3. FATAL STRIKE (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 50 * flashIntensity;
        ctx.shadowColor = '#000'; // Black shadow
        
        // Massive Black/White Slash
        ctx.strokeStyle = `rgba(255, 255, 255, ${flashIntensity})`;
        ctx.lineWidth = 8 * S;
        ctx.beginPath();
        ctx.arc(cx, cy, 35 * S, -0.6, 0.6);
        ctx.stroke();
        
        ctx.restore();
    }

    // --- 4. DEATH AURA ---
    const deathPulse = (Math.sin(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * deathPulse})`; // Dark aura
    ctx.beginPath();
    ctx.arc(cx, cy, 40 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawDoomGuide(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & CHARON ROBES (Grey / Teal / Ethereal Palette) ---
    const robeColor = '#37474F'; // Slate grey
    const soulColor = '#1DE9B6'; // Teal green
    
    // Robe Body
    p(-6, 0, '#000', 13, 15); // Outline
    p(-5, 1, robeColor, 11, 13);
    p(-2, 1, '#263238', 5, 13); // Darker center
    
    // Floating Boat Base (Instead of boots)
    const boatWarp = Math.sin(time * 2) * 2;
    p(-8, 12 + boatWarp, '#3E2723', 17, 5); // Wooden boat prow

    // Head (Veiled Guide)
    p(-4, -9, '#000', 9, 9); 
    p(-3, -8, robeColor, 7, 7);
    p(-2, -5, soulColor, 1, 1); // Eye L
    p(2, -5, soulColor, 1, 1);  // Eye R

    // --- 2. THE SOUL OAR (Purifying Focus) ---
    let oarOX = isAttacking ? 12 : 9;
    let oarOY = isAttacking ? -10 : -15;
    
    // Oar Shaft
    p(oarOX, oarOY, '#5D4037', 3, 30);
    
    // Oar Blade
    p(oarOX - 2, oarOY + 20, '#4E342E', 7, 8);
    
    // Lantern hanging from oar
    p(oarOX + 4, oarOY + 5, '#000', 5, 7);
    p(oarOX + 5, oarOY + 6, soulColor, 3, 5); // Soul light

    // --- 3. PURIFICATION WAVE (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 40 * flashIntensity;
        ctx.shadowColor = soulColor;
        
        // Gentle Purifying Ripple
        ctx.strokeStyle = `rgba(29, 233, 182, ${flashIntensity})`;
        ctx.lineWidth = 3 * S;
        ctx.beginPath();
        ctx.arc(cx, cy, 40 * flashIntensity * S, 0, Math.PI * 2);
        ctx.stroke();
        
        // Soul Wisps
        for(let i=0; i<6; i++) {
            const sang = (i / 6) * Math.PI * 2 + time * 2;
            const sdist = 20 * flashIntensity * S;
            const sx = Math.cos(sang) * sdist;
            const sy = Math.sin(sang) * sdist;
            ctx.fillStyle = soulColor;
            ctx.beginPath();
            ctx.arc(cx + sx, cy + sy, 2*S, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    }

    // --- 4. RIVER OF SOULS AURA ---
    const riverPulse = (Math.sin(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(29, 233, 182, ${0.05 * riverPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 40 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawForsakenKing(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const now = Date.now();
    const timeSinceShot = now - (tower.lastShot || 0);
    const isAttacking = timeSinceShot < 400; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    const flashIntensity = isAttacking ? 1.0 - (timeSinceShot / 400) : 0;

    // --- 1. BODY & ROYAL NECROTIC ROBES (Purple / Bone / Gold Palette) ---
    const robeColor = '#4A148C'; // Deep purple
    const boneColor = '#E0E0E0';
    const goldColor = '#FFD700';
    const deathColor = '#00E676'; // Neon green glow
    
    // Royal Robe Body
    p(-7, 0, '#000', 15, 17); // Outline
    p(-6, 1, robeColor, 13, 15);
    p(-6, 14, goldColor, 13, 2); // Gold hem
    
    // Bone Armor on chest
    p(-4, 3, boneColor, 9, 6);
    p(-3, 4, '#000', 7, 4); // Rib gaps

    // Boots (Skeletal)
    p(-4, 16, boneColor, 3, 2);
    p(2, 16, boneColor, 3, 2);

    // Head (Lich King Skull)
    p(-5, -11, '#000', 11, 11); 
    p(-4, -10, boneColor, 9, 9);
    
    // The Crown of the Forsaken
    p(-6, -14, goldColor, 13, 4);
    p(-2, -15, deathColor, 5, 2); // Center jewel
    
    // Eyes (Piercing green)
    p(-2, -6, deathColor, 2, 2);
    p(1, -6, deathColor, 2, 2);

    // --- 2. THE THRONE OF BONES (Floating around him) ---
    const floatY = Math.sin(time * 2) * 3;
    
    // Spectral Throne Backing
    p(-10, -5 + floatY, `rgba(224, 224, 224, 0.4)`, 4, 15);
    p(7, -5 + floatY, `rgba(224, 224, 224, 0.4)`, 4, 15);

    // --- 3. ROYAL SUMMON (Attack Effect) ---
    if (isAttacking) {
        ctx.save();
        ctx.shadowBlur = 50 * flashIntensity;
        ctx.shadowColor = deathColor;
        
        // Green summoning circle below
        ctx.strokeStyle = `rgba(0, 230, 118, ${flashIntensity})`;
        ctx.lineWidth = 3 * S;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10 * S, 30 * S, 10 * S, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Ghostly wisps rising
        for(let i=0; i<5; i++) {
            const px = (Math.random() - 0.5) * 60;
            const py = 10 - (Math.random() * 40 * flashIntensity);
            p(Math.round(px/S), Math.round(py), deathColor, 2, 2);
        }
        ctx.restore();
    }

    // --- 4. DOMINION AURA ---
    const domPulse = (Math.sin(time * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(0, 230, 118, ${0.1 * domPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 45 * S, 0, Math.PI * 2);
    ctx.fill();
}

function drawVoidGatekeeper(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    // --- 1. BODY & THE GATE ITSELF (Stone / Void Palette) ---
    const stoneColor = '#546E7A'; // Blue-grey stone
    const darkStone = '#263238';
    const voidColor = '#6A1B9A'; // Deep purple void
    
    // Massive Monolithic Body (He IS the gate)
    p(-12, -15, '#000', 25, 32); // Outline
    p(-11, -14, stoneColor, 23, 30);
    
    // The Void Portal in his chest
    const voidWarp = Math.sin(time * 5) * 2;
    p(-6 - voidWarp, -2, '#000', 13 + voidWarp*2, 16);
    p(-5 - voidWarp, -1, voidColor, 11 + voidWarp*2, 14);
    
    // Swirling Void Core
    p(-2, 4, '#E1BEE7', 5, 5); 

    // Head (Immovable Sentinel Face carved into stone)
    p(-5, -12, darkStone, 11, 8);
    p(-3, -9, '#00E5FF', 2, 2); // Eye L
    p(2, -9, '#00E5FF', 2, 2);  // Eye R

    // --- 2. SEALING RUNES (Passive Defense) ---
    const runePulse = (Math.cos(time * 2) + 1) / 2;
    const runeColor = `rgba(0, 229, 255, ${0.5 + 0.5 * runePulse})`;
    
    p(-10, -5, runeColor, 2, 4);
    p(9, -5, runeColor, 2, 4);
    p(-10, 5, runeColor, 2, 4);
    p(9, 5, runeColor, 2, 4);

    // --- 3. ABSOLUTE SEAL AURA (Massive passive presence) ---
    ctx.strokeStyle = `rgba(106, 27, 154, ${0.2 * runePulse})`;
    ctx.lineWidth = 4 * S;
    ctx.beginPath();
    ctx.arc(cx, cy, 50 * S, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = `rgba(106, 27, 154, ${0.05})`;
    ctx.fill();
}

function drawEternalWall(cx, cy, tower) {
    const time = lavaPhase;
    const area = tower.slotElement.dataset.area; 
    const isLeft = area === 'left-slots'; 
    
    const S = 1.0; 
    const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color;
        const finalOx = isLeft ? ox : -ox - w;
        const verticalScale = 1.13; // User requested 13% vertical increase
        ctx.fillRect(
            Math.floor(cx + (finalOx * S)), 
            Math.floor(cy + (oy * S * verticalScale)), 
            Math.floor(w * S), 
            Math.floor(h * S * verticalScale)
        );
    };

    // --- 1. BODY & EARTHEN BEHEMOTH (Granite / Amber / Moss Palette) ---
    const rockColor = '#795548'; // Brown granite
    const mossColor = '#33691E'; // Ancient moss
    const coreColor = '#FF8F00'; // Amber earth core
    
    // Gigantic Golem Body
    p(-14, -10, '#000', 29, 26); // Outline
    p(-13, -9, rockColor, 27, 24);
    
    // Moss Overgrowth
    p(-13, -9, mossColor, 10, 5);
    p(8, -9, mossColor, 6, 4);
    p(-5, 10, mossColor, 8, 5);

    // Earth Core (Chest)
    p(-4, 0, '#3E2723', 9, 9);
    const corePulse = (Math.sin(time * 3) + 1) / 2;
    p(-2, 2, `rgba(255, 143, 0, ${0.5 + 0.5 * corePulse})`, 5, 5);

    // Head (Sunken into shoulders)
    p(-6, -14, '#000', 13, 8); 
    p(-5, -13, rockColor, 11, 6);
    
    // Single glowing amber eye
    p(-1, -11, coreColor, 3, 2);

    // --- 2. HEAVY PILLARS (Arms) ---
    p(-16, -2, '#000', 6, 18);
    p(-15, -1, rockColor, 4, 16);
    
    p(11, -2, '#000', 6, 18);
    p(12, -1, rockColor, 4, 16);

    // --- 3. ETERNITY STABILIZATION AURA (Passive 80% Slow) ---
    // Massive, heavy, screen-distorting aura
    ctx.save();
    ctx.shadowBlur = 60 * corePulse;
    ctx.shadowColor = coreColor;
    
    ctx.strokeStyle = `rgba(255, 143, 0, ${0.15})`;
    ctx.lineWidth = 10 * S;
    ctx.beginPath();
    ctx.arc(cx, cy, 60 * S, 0, Math.PI * 2);
    ctx.stroke();
    
    // Floating rocks in aura
    for(let i=0; i<8; i++) {
        const ang = (time * 0.5) + (i * (Math.PI * 2 / 8));
        const dist = 50 * S;
        const rx = cx + Math.cos(ang) * dist;
        const ry = cy + Math.sin(ang) * dist;
        
        ctx.fillStyle = rockColor;
        ctx.fillRect(rx, ry, 3 * S, 3 * S);
    }
    ctx.restore();
}

// Helper for UI previews
function drawUnitPreview(type, targetCtx, width, height) {
    const originalCtx = ctx;
    const originalLavaPhase = lavaPhase;
    
    // Switch to target canvas
    window.ctx = targetCtx;
    const cx = width / 2;
    const cy = height / 2 + 30; // Centered for 3x scale
    
    // Mock tower object for drawing
    const mockTower = {
        data: unitTypes.find(u => u.type === type),
        slotElement: { dataset: { area: 'left-slots' } },
        lastShot: 0
    };

    targetCtx.clearRect(0, 0, width, height);
    
    const tempLavaPhase = 0; 
    const realLavaPhase = window.lavaPhase;
    window.lavaPhase = tempLavaPhase;

    // IMPORTANT: Temporarily set S to 3.0 for preview scaling
    // Actually, the drawing functions use 'const S = 1.0'. 
    // Since we want to fill a 120x120 canvas with a 30x34 unit, 
    // we should use context scaling instead of modifying S.
    targetCtx.save();
    targetCtx.scale(3, 3);
    // Adjust cx/cy for the scale
    const scx = (width / 2) / 3;
    const scy = (height / 2 + 30) / 3;

    switch(type) {
        case 'apprentice': drawApprentice(scx, scy, mockTower); break;
        case 'chainer': drawChainer(scx, scy, mockTower); break;
        case 'monk': drawMonk(scx, scy, mockTower); break;
        case 'talisman': drawTalisman(scx, scy, mockTower); break;
        case 'archer': drawArcher(scx, scy, mockTower); break;
        case 'assassin': drawAssassin(scx, scy, mockTower); break;
        case 'ice': drawIce(scx, scy, mockTower); break;
        case 'fire': drawFire(scx, scy, mockTower); break;
        case 'tracker': drawTracker(scx, scy, mockTower); break;
        case 'necromancer': drawNecromancer(scx, scy, mockTower); break;
        case 'guardian': drawGuardian(scx, scy, mockTower); break;
        case 'knight': drawKnight(scx, scy, mockTower); break;
        case 'alchemist': drawAlchemist(scx, scy, mockTower); break;
        case 'mirror': drawMirror(scx, scy, mockTower); break;
        case 'paladin': drawPaladin(scx, scy, mockTower); break;
        case 'crusader': drawCrusader(scx, scy, mockTower); break;
        case 'midas': drawMidas(scx, scy, mockTower); break;
        case 'illusion': drawIllusion(scx, scy, mockTower); break;
        case 'philosopher': drawPhilosopher(scx, scy, mockTower); break;
        case 'reflection': drawReflection(scx, scy, mockTower); break;
        case 'flamemaster': drawFlameMaster(scx, scy, mockTower); break;
        case 'voidsniper': drawVoidSniper(scx, scy, mockTower); break;
        case 'vajra': drawVajrapani(scx, scy, mockTower); break;
        case 'absolutezero': drawAbsoluteZero(scx, scy, mockTower); break;
        case 'hellfire': drawHellfireAlchemist(scx, scy, mockTower); break;
        case 'phoenix': drawPhoenixSummoner(scx, scy, mockTower); break;
        case 'executor': drawExecutor(scx, scy, mockTower); break;
        case 'binder': drawBinder(scx, scy, mockTower); break;
        case 'grandsealer': drawGrandSealer(scx, scy, mockTower); break;
        case 'saint': drawSaint(scx, scy, mockTower); break;
        case 'thousandhand': drawThousandHand(scx, scy, mockTower); break;
        case 'permafrost': drawPermafrost(scx, scy, mockTower); break;
        case 'abyssal': drawAbyssalKiller(scx, scy, mockTower); break;
        case 'spatial': drawSpatialSlasher(scx, scy, mockTower); break;
        case 'seer': drawSeer(scx, scy, mockTower); break;
        case 'commander': drawCommander(scx, scy, mockTower); break;
        case 'wraithlord': drawWraithLord(scx, scy, mockTower); break;
        case 'cursedshaman': drawCursedShaman(scx, scy, mockTower); break;
        case 'rampart': drawRampart(scx, scy, mockTower); break;
        case 'judgment': drawJudgment(scx, scy, mockTower); break;
        case 'transmuter': drawTransmuter(scx, scy, mockTower); break;
        case 'oracle': drawOracle(scx, scy, mockTower); break;
        case 'warden': drawWarden(scx, scy, mockTower); break;
        case 'cursed_talisman': drawCursedTalisman(scx, scy, mockTower); break;
        case 'asura': drawAsura(scx, scy, mockTower); break;
        case 'piercing_shadow': drawPiercingShadow(scx, scy, mockTower); break;
        case 'cocytus': drawCocytus(scx, scy, mockTower); break;
        case 'purgatory': drawPurgatory(scx, scy, mockTower); break;
        case 'reaper': drawReaper(scx, scy, mockTower); break;
        case 'doom_guide': drawDoomGuide(scx, scy, mockTower); break;
        case 'forsaken_king': drawForsakenKing(scx, scy, mockTower); break;
        case 'void_gatekeeper': drawVoidGatekeeper(scx, scy, mockTower); break;
        case 'eternal_wall': drawEternalWall(scx, scy, mockTower); break;
    }
    targetCtx.restore();

    // Restore original state
    window.ctx = originalCtx;
    window.lavaPhase = realLavaPhase;
}

function drawSelectionHalo() {
    const selectedUnit = document.querySelector('.unit.selected');
    if (!selectedUnit) return;

    const container = document.getElementById('game-container');
    const containerRect = container.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / containerRect.width;
    const scaleY = LOGICAL_HEIGHT / containerRect.height;

    const rect = selectedUnit.getBoundingClientRect();
    // Use the actual slot logic center for perfect alignment
    const cx = ((rect.left + rect.width / 2) - containerRect.left) * scaleX;
    const cy = ((rect.top + rect.height / 2) - containerRect.top) * scaleY;
    
    // Hexagon dimensions slightly larger than the slot
    const sw = rect.width * scaleX;
    const sh = rect.height * scaleY;
    const w = sw + 4;
    const h = sh + 4;
    const x = cx - w/2;
    const y = cy - h/2;

    const pulse = (Math.sin(lavaPhase * 4) + 1) / 2; 
    
    ctx.save();
    ctx.imageSmoothingEnabled = true; 
    
    const drawHexPath = (ctx, x, y, w, h) => {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h / 4);
        ctx.lineTo(x + w, y + 3 * h / 4);
        ctx.lineTo(x + w / 2, y + h);
        ctx.lineTo(x, y + 3 * h / 4);
        ctx.lineTo(x, y + h / 4);
        ctx.closePath();
    };

    // 1. Divine Outer Glow
    ctx.shadowBlur = 20 + 10 * pulse;
    ctx.shadowColor = '#ffd700';
    
    // 2. Main Hexagonal Border
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 + 0.2 * pulse})`;
    ctx.lineWidth = 3;
    drawHexPath(ctx, x, y, w, h);
    ctx.stroke();

    // 3. Rotating Rune/Points at vertices
    const time = globalAnimTimer;
    const vertices = [
        {dx: w/2, dy: 0}, {dx: w, dy: h/4}, {dx: w, dy: 3*h/4},
        {dx: w/2, dy: h}, {dx: 0, dy: 3*h/4}, {dx: 0, dy: h/4}
    ];

    vertices.forEach((v, i) => {
        const ang = time + (i * Math.PI / 3);
        const vPulse = (Math.sin(time * 2 + i) + 1) / 2;
        
        ctx.save();
        ctx.translate(x + v.dx, y + v.dy);
        ctx.rotate(ang);
        
        // Glowing Diamond/Rune at each vertex
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 15 * vPulse;
        ctx.shadowColor = '#ffd700';
        const size = 3 + 2 * vPulse;
        ctx.fillRect(-size/2, -size/2, size, size);
        
        ctx.restore();
    });

    // 4. Internal Secondary Ring (Dashed)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + 0.2 * pulse})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    drawHexPath(ctx, x + 6, y + 6, w - 12, h - 12);
    ctx.stroke();

    ctx.restore();
    disableSmoothing();
}

// Load Spritesheet (allies.js is a PNG)
const spritesheet = new Image();
spritesheet.src = 'js/allies.js';

function drawEnemies() {
    if (typeof enemies === 'undefined' || !enemies) return;
    
    const container = document.getElementById('game-container');
    const road = document.getElementById('road');
    if (!container || !road) return;

    const containerRect = container.getBoundingClientRect();
    const roadRect = road.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / containerRect.width;
    const scaleY = LOGICAL_HEIGHT / containerRect.height;
    const targetY = roadRect.height + 10;

    enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        
        const worldX = (enemy.x / 100) * roadRect.width + roadRect.left - containerRect.left;
        const worldY = enemy.y + roadRect.top - containerRect.top;
        
        let lx = Math.floor(worldX * scaleX);
        let ly = Math.floor(worldY * scaleY);
        
        // --- 2. Shadows ---
        drawShadow(lx, ly, enemy.isBoss ? 24 : 10);

        // --- 3. Animation: Bobbing ---
        const bob = Math.sin(globalAnimTimer * 1.5 + (lx * 0.1)) * 3;
        ly += Math.floor(bob);

        ctx.save();
        
        // [User Request] Ensure enemies are not too transparent
        // Calculate approach fade-out but cap at 0.5 minimum
        const ap = Math.max(0, (enemy.y - (targetY - 60)) / 60);
        
        const baseAlpha = enemy.isStealthed ? 0.6 : 1.0;
        ctx.globalAlpha = Math.max(0.5, (1 - ap) * baseAlpha);

        // --- 3. Animation: Hit-Flash ---
        // If enemy was hit recently, apply a white filter
        const wasHit = (enemy.lastHitTime && Date.now() - enemy.lastHitTime < 100);
        if (wasHit) {
            ctx.filter = 'brightness(3) contrast(2) grayscale(1) brightness(5)'; // Force white silhouette
        }

        if (spritesheet.complete && spritesheet.naturalWidth > 0) {
            const sw = 30;
            const sh = 34;
            ctx.drawImage(
                spritesheet, 
                0, 0, sw, sh, 
                Math.floor(lx - sw/2), Math.floor(ly - sh/2), 
                sw, sh
            );
        } else {
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(enemy.icon || '?', lx, ly);
        }
        
        ctx.restore();

        // HP Bar (Logical 360x640 space)
        const barW = enemy.isBoss ? 40 : 20;
        const barH = 3;
        const hpRatio = enemy.hp / enemy.maxHp;
        const bx = Math.floor(lx - barW/2);
        const by = Math.floor(ly - (enemy.isBoss ? 30 : 20));

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(bx, by, barW, barH);

        // [User Request] Red Gradient Fill
        const grad = ctx.createLinearGradient(bx, 0, bx + barW, 0);
        grad.addColorStop(0, '#ff1744'); // Vibrant Red
        grad.addColorStop(1, '#b71c1c'); // Dark Red
        
        ctx.fillStyle = grad;
        ctx.fillRect(bx, by, Math.floor(barW * hpRatio), barH);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGraphics);
} else {
    initGraphics();
}
