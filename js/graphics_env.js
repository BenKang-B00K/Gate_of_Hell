/* graphics_env.js - Environment Rendering */

const sideClouds = []; 
const sideMist = [];   
let lightningTimer = 0;
let lightningIntensity = 0;
const roadSouls = []; 

function initAtmosphere() {
    if (sideClouds.length > 0) return;
    for(let i=0; i<15; i++) {
        sideClouds.push({
            x: Math.random() * (360 + 400) - 200, 
            y: Math.random() * 250,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.1,
            size: 60 + Math.random() * 100,
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
    sideClouds.forEach(c => {
        c.x += c.vx; c.y += c.vy;
        if (Math.abs(c.opacity - c.targetOpacity) < 0.01) c.targetOpacity = Math.random();
        else c.opacity += (c.targetOpacity > c.opacity ? 0.002 : -0.002);
        if (c.x > 360 + 300) c.x = -300;
        if (c.x < -300) c.x = 360 + 300;
        if (c.flash > 0) c.flash -= 0.08;
        else if (Math.random() < 0.0015) c.flash = 1.0;
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size);
        const baseColor = c.flash > 0 ? `rgba(255, 255, 200, ${c.opacity * c.flash * 0.8})` : `rgba(15, 15, 25, ${c.opacity * 0.5})`;
        grad.addColorStop(0, baseColor); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 0.15;
    for(let m=0; m<4; m++) {
        const drift = Math.sin(time * 0.3 + m) * 100;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(-200 + drift, 0, 400, 300);
        ctx.fillRect(360 - 200 - drift, 0, 400, 300);
    }
    ctx.globalAlpha = 1.0; ctx.restore();
}

function drawLavaRoad() {
    const time = globalAnimTimer;
    const roadWidth = 114; const roadX = (360 - roadWidth) / 2;
    ctx.save();
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(roadX, 0, roadWidth, 640);
    if (lightningTimer <= 0) {
        if (Math.random() < 0.01) { lightningTimer = 10 + Math.random() * 20; lightningIntensity = 0.3 + Math.random() * 0.4; }
    } else {
        lightningTimer--; const flicker = Math.random() > 0.5 ? 1 : 0.5;
        ctx.fillStyle = `rgba(255, 215, 0, ${lightningIntensity * flicker * 0.15})`; ctx.fillRect(roadX, 0, roadWidth, 640);
        lightningIntensity *= 0.95;
    }
    if (roadSouls.length < 15 && Math.random() < 0.1) {
        roadSouls.push({ x: roadX + Math.random() * roadWidth, y: 640 + 10, speed: 0.5 + Math.random() * 1.5, opacity: 0.2 + Math.random() * 0.5 });
    }
    ctx.fillStyle = '#ffffff';
    for (let s = roadSouls.length - 1; s >= 0; s--) {
        const soul = roadSouls[s]; soul.y -= soul.speed; soul.opacity -= 0.001;
        ctx.globalAlpha = Math.max(0, soul.opacity); ctx.fillRect(Math.floor(soul.x), Math.floor(soul.y), 1, 2);
        if (soul.y < -10 || soul.opacity <= 0) roadSouls.splice(s, 1);
    }
    ctx.globalAlpha = 1.0; ctx.restore();
}

function drawSpawningGate() {
    const cx = 180; const cy = -55; const time = globalAnimTimer;
    ctx.save();
    const firePulse = (Math.sin(time * 3) + 1) / 2;
    const hellfireRadius = 95.5 + (firePulse * 7);
    const fireGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, hellfireRadius * 1.3);
    fireGrad.addColorStop(0, `rgba(255, 69, 0, ${0.7 + firePulse * 0.3})`); 
    fireGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = fireGrad; ctx.fillRect(cx - hellfireRadius * 2, cy - 50, hellfireRadius * 4, 200);
    ctx.restore();
}

function drawPortal() {
    const cx = 180; const cy = 580; const time = globalAnimTimer;
    ctx.save();
    const baseRadius = 75;
    const outerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 1.8);
    outerGrad.addColorStop(0, 'rgba(106, 27, 154, 0.5)'); outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = outerGrad; ctx.fillRect(cx - baseRadius * 2.5, cy - baseRadius * 1.5, baseRadius * 5, baseRadius * 3);
    ctx.restore();
}

function drawSlots() {
    const cardSlots = document.querySelectorAll('.card-slot');
    const container = document.getElementById('game-container');
    if(!container) return;
    const containerRect = container.getBoundingClientRect();
    const scaleX = 360 / containerRect.width; const scaleY = 640 / containerRect.height;
    const pulse = (Math.sin(lavaPhase * 1.5) + 1) / 2; 

    cardSlots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        const sx = (rect.left - containerRect.left) * scaleX;
        const sy = (rect.top - containerRect.top) * scaleY;
        const sw = rect.width * scaleX; const sh = rect.height * scaleY;
        const padding = 1.0; const x = sx + padding; const y = sy + padding;
        const w = sw - padding * 2; const h = sh - padding * 2;

        ctx.save();
        ctx.shadowBlur = 15 + 8 * pulse; ctx.shadowColor = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w, y + h / 4); ctx.lineTo(x + w, y + 3 * h / 4);
        ctx.lineTo(x + w / 2, y + h); ctx.lineTo(x, y + 3 * h / 4); ctx.lineTo(x, y + h / 4); ctx.closePath();
        ctx.fillStyle = '#333'; ctx.fill();
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.7 + 0.3 * pulse})`; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
    });
}

function drawShadow(lx, ly, size = 10) {
    ctx.save(); ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; ctx.beginPath();
    ctx.ellipse(lx, ly + 12, size, size * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

window.drawAtmosphericEffects = drawAtmosphericEffects;
window.drawLavaRoad = drawLavaRoad;
window.drawSpawningGate = drawSpawningGate;
window.drawPortal = drawPortal;
window.drawSlots = drawSlots;
window.drawShadow = drawShadow;
