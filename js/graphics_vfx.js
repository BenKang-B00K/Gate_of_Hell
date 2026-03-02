/* graphics_vfx.js - Advanced Visual Effects */

const particles = []; 
const lightPillars = []; 
const promotionBursts = []; 
const stageFlashes = []; 
const banishEffects = []; 
const purgeEffects = []; 
const soulEssences = [];
const floatingTexts = [];

function spawnFloatingText(text, lx, ly, color = '#fff', size = 18) {
    floatingTexts.push({
        text, lx, ly, color, size,
        life: 1.0,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1.0 - Math.random() * 1.0
    });
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.lx += ft.vx;
        ft.ly += ft.vy;
        ft.life -= 0.02;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
}

function drawFloatingTexts() {
    ctx.save();
    floatingTexts.forEach(ft => {
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${ft.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.lx, ft.ly);
    });
    ctx.restore();
}

function spawnSoulEssence(lx, ly) {
    const side = Math.random() < 0.5 ? -1 : 1;
    soulEssences.push({
        x: lx,
        y: ly,
        startX: lx,
        startY: ly,
        vx: side * (Math.random() * 1.5 + 0.5),
        vy: -4.5 - Math.random() * 2,
        gravity: 0.25,
        life: 1.0,
        decay: 0.01 + Math.random() * 0.01,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2
    });
}

function updateSoulEssences() {
    for (let i = soulEssences.length - 1; i >= 0; i--) {
        const s = soulEssences[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += s.gravity;
        s.life -= s.decay;
        s.rotation += s.rotSpeed;
        if (s.life <= 0) soulEssences.splice(i, 1);
    }
}

function drawSoulEssences() {
    ctx.save();
    soulEssences.forEach(s => {
        ctx.globalAlpha = s.life;
        ctx.font = `${14 + s.life * 10}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        // ✨ emoji with a glow
        ctx.shadowBlur = 10 * s.life;
        ctx.shadowColor = '#ffd700';
        ctx.fillText('✨', 0, 0);
        ctx.restore();
    });
    ctx.restore();
}

function spawnPurgeEffect(lx, ly) {
    purgeEffects.push({ x: lx, y: ly, life: 1.0 });
    spawnParticles(lx, ly, '#fff', 40);
    spawnParticles(lx, ly, '#ffd700', 20);
}

function updatePurgeEffects() {
    for (let i = purgeEffects.length - 1; i >= 0; i--) {
        const pe = purgeEffects[i];
        pe.life -= 0.015;
        if (pe.life <= 0) purgeEffects.splice(i, 1);
    }
}

function drawPurgeEffects() {
    purgeEffects.forEach(pe => {
        const alpha = pe.life;
        const radius = (1.0 - alpha) * 800;
        ctx.save();
        ctx.translate(pe.x, pe.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.lineWidth = 15 * alpha;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
        const grad = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.2})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });
}

function spawnStageFlash(text) {
    stageFlashes.push({ life: 1.0, text: text });
}

function updateStageFlashes() {
    for (let i = stageFlashes.length - 1; i >= 0; i--) {
        const sf = stageFlashes[i];
        sf.life -= 0.02;
        if (sf.life <= 0) stageFlashes.splice(i, 1);
    }
}

function drawStageFlashes() {
    stageFlashes.forEach(sf => {
        const alpha = sf.life;
        ctx.save();
        const flashAlpha = Math.min(0.6, alpha * 1.5);
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        if (alpha > 0.1) {
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const fontSize = 42 + (1.0 - alpha) * 20; 
            ctx.font = `bold ${fontSize}px Cinzel, serif`;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillText(sf.text, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
        }
        ctx.restore();
    });
}

function spawnPromotionBurst(lx, ly, tier) {
    promotionBursts.push({ x: lx, y: ly, life: 1.0, tier: tier });
    spawnParticles(lx, ly, (tier === 4) ? '#9400d3' : '#ffd700', 30);
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
        ctx.strokeStyle = isAbyss ? `rgba(148, 0, 211, ${alpha})` : `rgba(255, 215, 0, ${alpha})`;
        ctx.beginPath(); ctx.arc(0, 0, (1.0 - alpha) * 120, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    });
}

function spawnLightPillar(lx, ly) {
    lightPillars.push({ x: lx, y: ly, life: 1.0, maxLife: 1.0, decay: 0.02 });
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
        const width = 40 * alpha;
        ctx.save();
        const grad = ctx.createLinearGradient(lp.x - width/2, 0, lp.x + width/2, 0);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.8})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(lp.x - width/2, 0, width, lp.y);
        ctx.restore();
    });
}

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

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.floor(p.size), Math.floor(p.size));
    });
    ctx.globalAlpha = 1.0;
}

// Exports
window.spawnFloatingText = spawnFloatingText;
window.updateFloatingTexts = updateFloatingTexts;
window.drawFloatingTexts = drawFloatingTexts;
window.spawnPurgeEffect = spawnPurgeEffect;
window.spawnSoulEssence = spawnSoulEssence;
window.updateSoulEssences = updateSoulEssences;
window.drawSoulEssences = drawSoulEssences;
window.spawnStageFlash = spawnStageFlash;
window.spawnPromotionBurst = spawnPromotionBurst;
window.spawnLightPillar = spawnLightPillar;
window.spawnParticles = spawnParticles;
window.updateParticles = updateParticles;
window.drawParticles = drawParticles;
