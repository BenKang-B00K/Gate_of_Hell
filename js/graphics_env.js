/* graphics_env.js - Environment Rendering */

const sideMist = [];   
let lightningTimer = 0;
let lightningIntensity = 0;

function initAtmosphere() {
    // Cloud generation logic removed
}

function drawAtmosphericEffects() {
    // Atmosphere drawing logic removed (Clouds are gone)
}

function drawLavaRoad() {
    const time = globalAnimTimer;
    const roadWidth = 114; 
    const roadX = 123;
    const gameScreenHeight = 416; // [User Request] Stop drawing at the UI boundary (Portal Y)
    
    ctx.save();

    // 1. The Abyssal Void (Side Cliffs)
    // Left Abyss
    const leftGrad = ctx.createLinearGradient(0, 0, roadX, 0);
    leftGrad.addColorStop(0, '#020005');
    leftGrad.addColorStop(1, '#0a0510');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(0, 0, roadX, gameScreenHeight);
    
    // Right Abyss
    const rightGrad = ctx.createLinearGradient(roadX + roadWidth, 0, 360, 0);
    rightGrad.addColorStop(0, '#0a0510');
    rightGrad.addColorStop(1, '#020005');
    ctx.fillStyle = rightGrad;
    ctx.fillRect(roadX + roadWidth, 0, 360 - (roadX + roadWidth), gameScreenHeight);

    // 2. Rising Void Mist from the Abyss
    ctx.globalCompositeOperation = 'screen';
    for(let i = 0; i < 6; i++) {
        const mx = (i % 2 === 0) ? Math.random() * 50 : 310 + Math.random() * 50;
        const my = (time * 20 + i * 100) % gameScreenHeight;
        const ms = 40 + Math.sin(time + i) * 10;
        const mGrad = ctx.createRadialGradient(mx, my, 0, mx, my, ms);
        mGrad.addColorStop(0, 'rgba(40, 0, 80, 0.15)');
        mGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = mGrad;
        ctx.beginPath(); ctx.arc(mx, my, ms, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // 3. Hell Stone Bridge Body
    // Base Stone Color
    ctx.fillStyle = '#111115';
    ctx.fillRect(roadX, 0, roadWidth, gameScreenHeight);

    // Stone Slab Patterns with Shading
    const slabHeight = 40;
    for(let y = 0; y < gameScreenHeight; y += slabHeight) {
        // Slab highlights and shadows for 3D feel
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.strokeRect(roadX + 2, y, roadWidth - 4, slabHeight);
        
        // Refined Magma Cracks (Only on some slabs to reduce noise)
        if ((Math.floor(y / slabHeight)) % 5 === 0) {
            ctx.save();
            ctx.beginPath();
            const startX = roadX + 20 + Math.random() * 20;
            const startY = y + 10;
            ctx.moveTo(startX, startY);
            // Zig-zag crack pattern
            ctx.lineTo(startX + 15, startY + 10);
            ctx.lineTo(startX - 5, startY + 20);
            ctx.lineTo(startX + 10, startY + 30);
            
            // Magma Glow Effect
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff4500';
            ctx.strokeStyle = `rgba(255, 69, 0, ${0.2 + Math.sin(time * 2) * 0.1})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }
    }

    // 4. Side Railings (Stone Walls)
    const wallWidth = 8;
    // Shadow under walls
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(roadX - 4, 0, 4, gameScreenHeight);
    ctx.fillRect(roadX + roadWidth, 0, 4, gameScreenHeight);

    // Stone Walls
    const wallGrad = ctx.createLinearGradient(roadX, 0, roadX + wallWidth, 0);
    wallGrad.addColorStop(0, '#222');
    wallGrad.addColorStop(0.5, '#444');
    wallGrad.addColorStop(1, '#111');
    
    ctx.fillStyle = wallGrad;
    ctx.fillRect(roadX, 0, wallWidth, gameScreenHeight); // Left wall
    ctx.save();
    ctx.translate(roadX + roadWidth, 0);
    ctx.scale(-1, 1);
    ctx.fillRect(0, 0, wallWidth, gameScreenHeight); // Right wall (mirrored)
    ctx.restore();

    // 5. Evil Aura Rising from Bridge
    if (Math.random() < 0.1) {
        const ax = roadX + Math.random() * roadWidth;
        const ay = Math.random() * gameScreenHeight;
        spawnParticles(ax, ay, 'rgba(148, 0, 211, 0.4)', 1);
    }

    // 6. Soul Flow Arrows (Moving Downward - Slower & More Spaced)
    ctx.save();
    const arrowSpacing = 160; // Increased spacing (was 120)
    const arrowOffset = (time * 20) % arrowSpacing; // Halved speed (was 40)
    ctx.strokeStyle = '#ff3366'; 
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ff0033';

    for(let y = -20 + arrowOffset; y < gameScreenHeight; y += arrowSpacing) {
        if (y < 0) continue;
        // Alpha calculation for smooth fade-in and fade-out
        const alpha = Math.min(0.35, (y / 150) * 0.35) * (1 - (y / gameScreenHeight)); 
        ctx.globalAlpha = alpha;

        const ax = 180; 
        const aw = 18;  
        const ah = 12;  

        ctx.beginPath();
        ctx.moveTo(ax - aw, y);
        ctx.lineTo(ax, y + ah);
        ctx.lineTo(ax + aw, y);
        ctx.stroke();
    }
    ctx.restore();

    // 7. Lightning Overlay (Inherited)

    if (lightningTimer > 0) {
        lightningTimer--;
        const flicker = Math.random() > 0.5 ? 1 : 0.5;
        ctx.fillStyle = `rgba(255, 215, 0, ${lightningIntensity * flicker * 0.1})`;
        ctx.fillRect(roadX, 0, roadWidth, gameScreenHeight);
        lightningIntensity *= 0.95;
    }

    ctx.restore();
}

function drawSpawningGate() {
    const cx = 180; const cy = -5; const time = globalAnimTimer;
    ctx.save();
    
    // 1. Infernal Core Glow
    const pulse = (Math.sin(time * 2) + 1) / 2;
    const baseRadius = 80 + pulse * 10;
    
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 1.5);
    coreGrad.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
    coreGrad.addColorStop(0.4, 'rgba(200, 30, 0, 0.4)');
    coreGrad.addColorStop(1, 'transparent');
    
    ctx.fillStyle = coreGrad;
    ctx.fillRect(cx - 150, cy - 20, 300, 150);

    // 2. Rising Hellfire Embers (Procedural)
    ctx.globalCompositeOperation = 'lighter';
    for(let i = 0; i < 8; i++) {
        const offTime = time + i * 0.5;
        const ex = cx + Math.sin(offTime * 2) * 60;
        const ey = cy + (offTime % 5) * 20;
        const size = 2 + Math.sin(offTime) * 2;
        
        ctx.fillStyle = `rgba(255, 200, 50, ${0.6 * (1 - (ey/100))})`;
        ctx.beginPath();
        ctx.arc(ex, ey, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 3. Spawning Sigil
    ctx.strokeStyle = `rgba(255, 50, 0, ${0.3 + pulse * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 100 + pulse * 5, 20 + pulse * 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

/**
 * AA-Grade Void Portal: Dynamic vortex with PE-based corruption evolution
 */
function drawPortal() {
    const cx = 180; const cy = 416; const time = globalAnimTimer;
    const pe = (typeof portalEnergy !== 'undefined') ? portalEnergy : 0;
    const energyRatio = pe / maxPortalEnergy;
    
    ctx.save();
    
    // 1. Dimensional Distortion (Outer Ring)
    const drift = Math.sin(time) * 5;
    const outerRadius = 90 + energyRatio * 30;
    
    const outerGrad = ctx.createRadialGradient(cx, cy + drift, 0, cx, cy + drift, outerRadius * 1.8);
    // Colors shift from Abyssal Purple to Hellish Red
    const rOut = Math.floor(50 + energyRatio * 150);
    const gOut = Math.floor(0);
    const bOut = Math.floor(100 * (1 - energyRatio));
    
    outerGrad.addColorStop(0, `rgba(${rOut}, ${gOut}, ${bOut}, 0.2)`);
    outerGrad.addColorStop(0.6, `rgba(${rOut}, ${gOut}, ${bOut}, 0.1)`);
    outerGrad.addColorStop(1, 'transparent');
    
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // 2. Swirling Void Layers
    const layers = 4;
    const rotSpeed = 1 + energyRatio * 2; // Speeds up as corruption rises
    
    for(let i = 0; i < layers; i++) {
        const layerTime = time * rotSpeed * (1 + i * 0.3);
        const rx = (outerRadius - i * 15) * (0.9 + Math.sin(time * 1.5 + i) * 0.1);
        const ry = rx * 0.35;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(layerTime * (i % 2 === 0 ? 1 : -1));
        
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        
        const alpha = (0.4 + energyRatio * 0.4) / (i + 1);
        ctx.strokeStyle = `rgba(${rOut + 50}, 50, ${bOut + 100}, ${alpha})`;
        ctx.lineWidth = 4 - i;
        
        if (energyRatio > 0.7) {
            ctx.shadowBlur = 10 + i * 5;
            ctx.shadowColor = `rgba(255, 0, 0, ${energyRatio})`;
        }
        
        ctx.stroke();
        ctx.restore();
    }

    // 3. The Singularity (Event Horizon)
    const corePulse = (Math.sin(time * 5) + 1) / 2;
    const coreRadius = 25 + corePulse * 5 + energyRatio * 15;
    
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
    coreGrad.addColorStop(0, '#000'); // Pure darkness at center
    coreGrad.addColorStop(0.5, `rgba(${rOut}, 0, ${bOut}, 0.9)`);
    coreGrad.addColorStop(1, 'transparent');
    
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, coreRadius * 1.6, coreRadius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Corruption Sparks (at high PE)
    if (energyRatio > 0.5) {
        ctx.globalCompositeOperation = 'lighter';
        for(let i = 0; i < 5; i++) {
            const ang = (time * 10 + i * Math.PI * 0.4) % (Math.PI * 2);
            const dist = coreRadius + Math.random() * 20;
            const sx = cx + Math.cos(ang) * dist * 1.5;
            const sy = cy + Math.sin(ang) * dist * 0.6;
            
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(sx, sy, 2, 2);
        }
    }

    ctx.restore();
}

function drawSlots() {
    if (!window.logicalSlots) return;
    const pulse = (Math.sin(lavaPhase * 1.5) + 1) / 2; 
    const sw = 34; const sh = 46;

    window.logicalSlots.forEach(slot => {
        const x = slot.lx - sw/2;
        const y = slot.ly - sh/2;
        const w = sw; const h = sh;

        ctx.save();
        ctx.shadowBlur = 15 + 8 * pulse; ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w, y + h / 4); ctx.lineTo(x + w, y + 3 * h / 4);
        ctx.lineTo(x + w / 2, y + h); ctx.lineTo(x, y + 3 * h / 4); ctx.lineTo(x, y + h / 4); ctx.closePath();
        ctx.fillStyle = 'rgba(255, 215, 0, 0.05)'; ctx.fill();
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + 0.3 * pulse})`; ctx.lineWidth = 1.0; ctx.stroke();
        ctx.restore();
    });
}

function drawShadow(lx, ly, size = 10) {
    ctx.save(); ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; ctx.beginPath();
    ctx.ellipse(lx, ly + 12, size, size * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

window.drawAtmosphericEffects = drawAtmosphericEffects;
window.drawLRoad = drawLavaRoad;
window.drawSpawningGate = drawSpawningGate;
window.drawPortal = drawPortal;
window.drawSlots = drawSlots;
window.drawShadow = drawShadow;
