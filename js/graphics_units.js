/* graphics_units.js - Individual Unit Drawing Functions */

function drawUnitAuras(cx, cy, tower) {
    const tier = tower.data.tier;
    if (tier < 2) return;
    const time = globalAnimTimer;
    const pulse = (Math.sin(time * 2) + 1) / 2;
    ctx.save();
    if (tier === 2) {
        ctx.globalAlpha = 0.2 + pulse * 0.1; ctx.fillStyle = '#fff';
        for(let i=0; i<3; i++) {
            const ang = time + (i * Math.PI * 0.6);
            const ox = Math.cos(ang) * 15; const oy = Math.sin(ang * 0.5) * 5;
            ctx.beginPath(); ctx.arc(cx + ox, cy + 5 + oy, 8, 0, Math.PI * 2); ctx.fill();
        }
    } else if (tier === 3) {
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + pulse * 0.3})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cx, cy + 8, 25 + pulse * 5, 8 + pulse * 2, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (tier === 4) {
        const glowGrad = ctx.createRadialGradient(cx, cy + 5, 0, cx, cy + 5, 40);
        glowGrad.addColorStop(0, `rgba(74, 20, 140, ${0.3 + pulse * 0.2})`); glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad; ctx.beginPath(); ctx.arc(cx, cy + 5, 40, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

function drawUnits() {
    if (typeof towers === 'undefined') return;

    towers.forEach(tower => {
        let cx = tower.lx;
        let cy = tower.ly;
        
        if(typeof drawShadow === 'function') drawShadow(cx, cy, 14);
        drawUnitAuras(cx, cy, tower);
        const bob = Math.sin(globalAnimTimer + (cx * 0.05)) * 2; cy += Math.floor(bob);

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
            default:
                // Draw icon as fallback
                ctx.save();
                ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(tower.data.icon || '🧙', cx, cy);
                ctx.restore();
                break;
        }

        // Draw cooldown overlay on Canvas
        const sm = 1.0 + (tower.speedBonus || 0);
        const cd = tower.cooldown / sm;
        const elapsed = Date.now() - (tower.lastShot || 0);
        if (elapsed < cd) {
            const ratio = Math.min(1, elapsed / cd);
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, 20, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (1 - ratio)));
            ctx.lineTo(cx, cy);
            ctx.fill();
            ctx.restore();
        }
    });
}

function drawApprentice(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; 
    const isLeft = area === 'left-slots'; 
    const now = Date.now(); const timeSinceShot = now - (tower.lastShot || 0); const isAttacking = timeSinceShot < 250; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#5F7D7E', 11, 13); p(-2, 1, '#8BA8A9', 3, 11); p(-5, 11, '#4A5F60', 11, 3);
    p(-5, 7, '#3E2723', 11, 2); p(-1, 7, '#BCA371', 2, 2); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
    p(-5, -10, '#000', 11, 11); p(-4, -9, '#E8C4A2', 9, 9); p(-5, -11, '#000', 11, 5); p(-5, -11, '#BCA371', 11, 4);
    p(-5, -8, '#BCA371', 2, 5); p(4, -8, '#BCA371', 2, 5); p(-2, -11, '#E3D3A3', 5, 1);
    p(-3, -6, isAttacking ? '#fff' : '#333', 2, 2); p(2, -6, isAttacking ? '#fff' : '#333', 2, 2);
    let staffOX = isAttacking ? 9 : 7; let staffOY = isAttacking ? -12 : -11;
    p(staffOX, staffOY, '#3E2723', 3, 25); p(staffOX + 1, staffOY, '#5D4037', 1, 25);
    p(staffOX - 2, staffOY - 4, '#3E2723', 7, 5); p(staffOX - 1, staffOY - 3, '#000', 5, 3);
    p(staffOX, staffOY - 2, isAttacking ? '#00FFFF' : '#4CAF50', 3, 2);
}

function drawChainer(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#311B92', 11, 13); p(-5, 11, '#1A237E', 11, 3);
    p(-5, 4, '#B0BEC5', 11, 1); p(-5, 8, '#B0BEC5', 11, 1); p(-1, 5, '#000', 3, 3); p(0, 6, '#00E5FF', 1, 1);
    p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
    p(-4, -9, '#000', 9, 9); p(-3, -8, '#311B92', 7, 7); p(-2, -6, '#FFF', 5, 5); p(-1, -5, '#000', 1, 1); p(1, -5, '#000', 1, 1);
}

function drawMonk(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const now = Date.now(); const timeSinceShot = now - (tower.lastShot || 0); const isAttacking = timeSinceShot < 300; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 2, '#000', 13, 14); p(-5, 3, '#8D6E63', 11, 12); p(-5, 12, '#5D4037', 11, 3);
    p(-5, 5, '#000', 11, 3); p(-5, 6, '#FFB300', 11, 1); p(-3, 1, '#000', 7, 5); p(-2, 2, '#3E2723', 5, 3); p(0, 5, '#3E2723', 2, 2);
    p(-8, 3, '#000', 4, 7); p(-7, 4, '#D7B19D', 2, 5); p(5, 3, '#000', 4, 7); p(6, 4, '#D7B19D', 2, 5);
    p(-5, 15, '#000', 4, 3); p(2, 15, '#000', 4, 3); p(-4, -8, '#000', 9, 9); p(-3, -7, '#D7B19D', 7, 7);
    p(-1, -4, '#333', 3, 1); p(-2, -5, '#333', 1, 1); p(2, -5, '#333', 1, 1);
    let mX = isAttacking ? 8 : 7; let mY = isAttacking ? -15 : -12;
    p(mX, mY + 5, '#3E2723', 2, 22); p(mX - 4, mY - 6, '#000', 10, 12); p(mX - 3, mY - 5, '#424242', 8, 10);
}

function drawTalisman(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#FFD54F', 11, 13); p(-1, 1, '#3E2723', 2, 11); p(-5, 11, '#FBC02D', 11, 3);
    p(-4, 3, '#F44336', 1, 3); p(3, 3, '#F44336', 1, 3); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
    p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7); p(-3, -11, '#000', 7, 4); p(-1, -10, '#FFD700', 3, 1);
}

function drawArcher(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-5, 0, '#000', 11, 15); p(-4, 1, '#2E7D32', 9, 13); p(-4, 1, '#C8E6C9', 2, 11); p(-4, 11, '#1B5E20', 9, 3);
    p(-4, 7, '#3E2723', 9, 1); p(0, 7, '#FFD700', 1, 1); p(-3, 14, '#000', 3, 3); p(1, 14, '#000', 3, 3);
    p(-4, -10, '#000', 9, 10); p(-3, -9, '#F5DDC7', 7, 7); p(-4, -11, '#ECEFF1', 9, 2); p(-4, -9, '#ECEFF1', 2, 8); p(3, -9, '#ECEFF1', 2, 8);
    let bX = 8; let bY = -12; p(bX, bY, '#000', 3, 24); p(bX - 1, bY - 1, '#000', 3, 3); p(bX - 1, bY + 22, '#000', 3, 3);
}

function drawAssassin(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const now = Date.now(); const timeSinceShot = now - (tower.lastShot || 0); const isAttacking = timeSinceShot < 150; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-5, 1, '#000', 11, 14); p(-4, 2, '#212121', 9, 12); p(-2, 2, '#424242', 3, 10);
    p(-5, -2, '#000', 11, 4); p(-4, -1, '#4A148C', 9, 2); p(-4, 14, '#000', 3, 2); p(1, 14, '#000', 3, 2);
    p(-4, -10, '#000', 9, 9); p(-3, -9, '#212121', 7, 7); p(-2, -5, isAttacking ? '#E1BEE7' : '#7B1FA2', 1, 1); p(1, -5, isAttacking ? '#E1BEE7' : '#7B1FA2', 1, 1);
}

function drawIce(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#1A237E', 11, 13); p(-2, 1, '#81D4FA', 3, 11); p(-5, 11, '#0D47A1', 11, 3);
    p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3); p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7); p(-3, -11, '#000', 7, 3);
}

function drawFire(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#B71C1C', 11, 13); p(-2, 1, '#FFD700', 3, 11); p(-5, 11, '#7F0000', 11, 3);
    p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3); p(-4, -8, '#000', 9, 8); p(-3, -7, '#F5DDC7', 7, 6);
    p(-6, -9, '#000', 13, 3); p(-3, -15, '#000', 7, 7); p(-2, -14, '#B71C1C', 5, 6);
}

function drawTracker(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#33691E', 11, 13); p(-1, 1, '#9E9D24', 2, 11); p(-5, 11, '#1B5E20', 11, 3);
    p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3); p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7); p(-4, -10, '#33691E', 9, 3);
}

function drawNecromancer(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#4A148C', 11, 13); p(-5, 11, '#212121', 11, 3);
    p(-4, 3, '#E0E0E0', 9, 1); p(-3, 5, '#E0E0E0', 7, 1); p(-2, 7, '#E0E0E0', 5, 1);
    p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3); p(-4, -10, '#000', 9, 10); p(-3, -9, '#4A148C', 7, 9); p(-2, -7, '#E0E0E0', 5, 6);
}

function drawGuardian(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-7, -2, '#000', 15, 18); p(-6, -1, '#FFD54F', 13, 16); p(-3, -1, '#F5F5F5', 7, 14);
    p(-9, -2, '#000', 5, 6); p(-8, -1, '#FFD54F', 3, 4); p(5, -2, '#000', 5, 6); p(6, -1, '#FFD54F', 3, 4);
    p(-5, 14, '#000', 5, 4); p(1, 14, '#000', 5, 4); p(-4, -10, '#000', 9, 9); p(-3, -9, '#F5F5F5', 7, 7);
}

function drawKnight(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#90A4AE', 11, 13); p(-2, 1, '#CFD8DC', 3, 11);
    p(-5, 1, '#1565C0', 2, 2); p(4, 1, '#1565C0', 2, 2); p(-5, 11, '#455A64', 11, 3);
    p(-8, 4, '#000', 4, 6); p(-7, 5, '#90A4AE', 2, 4); p(5, 4, '#000', 4, 6); p(6, 5, '#90A4AE', 2, 4);
    p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3); p(-4, -9, '#000', 9, 10); p(-3, -8, '#90A4AE', 7, 8);
}

function drawAlchemist(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#00695C', 11, 13); p(-5, 11, '#004D40', 11, 3);
    p(-5, 4, '#5D4037', 11, 2); p(2, 4, '#FFD700', 2, 2); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
    p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7); p(-4, -10, '#3E2723', 9, 3); p(-3, -6, '#212121', 7, 3);
}

function drawMirror(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-7, 0, '#000', 15, 16); p(-6, 1, '#EDE7F6', 13, 14); p(-6, 1, '#9575CD', 2, 14); p(5, 1, '#9575CD', 2, 14); p(-2, 1, '#00BCD4', 3, 11);
    p(-6, 7, '#512DA8', 13, 2); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3); p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7);
}

function drawPaladin(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-7, -1, '#000', 15, 17); p(-6, 0, '#FFD700', 13, 15); p(-3, 0, '#FFFFFF', 7, 13);
    p(-9, -1, '#000', 5, 6); p(-8, 0, '#FFD700', 3, 4); p(5, -1, '#000', 5, 6); p(6, 0, '#FFD700', 3, 4);
    p(-5, 14, '#000', 5, 4); p(1, 14, '#000', 5, 4); p(-4, -10, '#000', 9, 10); p(-3, -9, '#FFD700', 7, 8);
}

function drawCrusader(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#263238', 11, 13); p(-5, 1, '#B71C1C', 2, 13); p(4, 1, '#B71C1C', 2, 13);
    p(-8, 2, '#000', 4, 15); p(-7, 3, '#7F0000', 2, 13); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
    p(-4, -10, '#000', 9, 10); p(-3, -9, '#263238', 7, 8); p(-1, -7, '#FF1744', 3, 1);
}

function drawMidas(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#4A148C', 11, 13); p(-5, 1, '#FFD700', 1, 13); p(5, 1, '#FFD700', 1, 13);
    p(-3, 4, '#FFD700', 7, 2); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3); p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7);
}

function drawIllusion(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#880E4F', 11, 13); p(-5, 3, '#E91E63', 11, 2); p(-5, 7, '#E91E63', 11, 3); p(-2, 1, '#F48FB1', 3, 12);
    p(-4, 14, '#311B92', 4, 3); p(1, 14, '#311B92', 4, 3); p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7);
}

function drawPhilosopher(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#1B1B1B', 11, 13); p(-2, 1, '#004D40', 3, 11); p(-5, 11, '#000', 11, 3);
    p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3); p(-5, -10, '#000', 11, 10); p(-4, -9, '#1B1B1B', 9, 8);
}

function drawReflection(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#E0F7FA', 11, 13); p(-5, 1, '#BDBDBD', 2, 13); p(4, 1, '#BDBDBD', 2, 13);
    p(-1, 5, '#000', 3, 3); p(0, 6, '#00E5FF', 1, 1); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
    p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7); p(-4, -10, '#BDBDBD', 9, 2);
}

function drawFlameMaster(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#D84315', 11, 13); p(-1, 1, '#212121', 3, 11); p(-5, 11, '#BF360C', 11, 3);
    p(-4, 4, '#FF9800', 2, 1); p(3, 8, '#FF9800', 2, 1); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
    p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7); p(-4, -11, '#000', 9, 3);
}

function drawVoidSniper(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-5, 0, '#000', 11, 15); p(-4, 1, '#1A237E', 9, 13); p(-1, 1, '#4A148C', 3, 11);
    p(-8, -2, '#000', 5, 5); p(-7, -1, '#4A148C', 3, 3); p(-3, 14, '#000', 3, 3); p(1, 14, '#000', 3, 3);
    p(-4, -10, '#000', 9, 10); p(-3, -9, '#1A237E', 7, 8); p(-2, -6, '#212121', 5, 3); p(-1, -5, '#00E5FF', 1, 1);
}

function drawVajrapani(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-7, 0, '#000', 15, 15); p(-6, 1, '#D7B19D', 13, 13); p(-6, 1, '#0D47A1', 3, 13); p(4, 1, '#0D47A1', 3, 13);
    p(-9, -2, '#B71C1C', 4, 18); p(-6, 10, '#FFD700', 13, 3); p(-5, 14, '#3E2723', 5, 3); p(1, 14, '#3E2723', 5, 3);
    p(-4, -10, '#000', 9, 10); p(-3, -9, '#D7B19D', 7, 8); p(-4, -13, '#FF4500', 9, 4);
}

function drawAbsoluteZero(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#E0F7FA', 11, 13); p(-5, 1, '#00E5FF', 2, 13); p(4, 1, '#00E5FF', 2, 13);
    p(-5, 7, '#00B8D4', 11, 2); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
    p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7); p(-5, -11, '#000', 11, 4); p(-4, -10, '#00E5FF', 9, 3);
}

function drawHellfireAlchemist(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#1B1B1B', 11, 13); p(-5, 1, '#B71C1C', 2, 13); p(4, 1, '#B71C1C', 2, 13);
    p(-5, 5, '#3E2723', 11, 3); p(-3, 6, '#FF3D00', 2, 1); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
    p(-5, -10, '#000', 11, 10); p(-4, -9, '#1B1B1B', 9, 8); p(-3, -6, '#212121', 7, 5);
}

function drawPhoenixSummoner(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#E65100', 11, 13); p(-2, 1, '#FFD600', 3, 11); p(-5, 11, '#EF6C00', 11, 3);
    p(-1, 5, '#000', 3, 3); p(0, 6, '#FFF176', 1, 1); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
    p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7); p(-4, -10, '#FFAB00', 9, 2);
}

function drawExecutor(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#311B92', 11, 13); p(-1, 1, '#FFD700', 2, 11); p(-5, 11, '#1A237E', 11, 3);
    p(-5, 6, '#4A148C', 11, 2); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
    p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7); p(-4, -11, '#000', 9, 4);
}

function drawBinder(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#FAFAFA', 11, 13); p(-2, 1, '#3F51B5', 3, 11); p(-5, 11, '#E0E0E0', 11, 3);
    p(-4, 4, '#00E5FF', 1, 2); p(3, 8, '#00E5FF', 1, 2); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
    p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7); p(-5, -10, '#000', 11, 5);
}

function drawGrandSealer(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#FFFFFF', 11, 13); p(-1, 1, '#4DB6AC', 3, 11); p(-5, 11, '#F5F5F5', 11, 3);
    p(-4, 4, '#D32F2F', 2, 2); p(2, 8, '#D32F2F', 2, 2); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
    p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7); p(-4, -11, '#000', 9, 4);
}

function drawSaint(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#FAFAFA', 11, 13); p(-2, 1, '#FFD700', 3, 11); p(-5, 11, '#FFB300', 11, 3);
    p(-3, 2, '#3E2723', 7, 5); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3); p(-4, -9, '#000', 9, 9); p(-3, -8, '#D7B19D', 7, 7);
}

function drawThousandHand(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#2E7D32', 11, 13); p(-2, 1, '#FFD700', 3, 11); p(-5, 11, '#1B5E20', 11, 3);
    p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3); p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7);
}

function drawPermafrost(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#B2EBF2', 11, 13); p(-2, 1, '#FFFFFF', 3, 11); p(-5, 11, '#80DEEA', 11, 3);
    p(-4, 4, '#FFFFFF', 1, 1); p(3, 8, '#FFFFFF', 1, 1); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
}

function drawAbyssalKiller(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#121212', 11, 13); p(-2, 1, '#4A148C', 3, 11); p(-5, 11, '#000', 11, 3);
    p(-8, 2, '#000', 4, 14); p(-7, 3, '#4A148C', 2, 12); p(-4, 14, '#000', 4, 3); p(1, 14, '#000', 4, 3);
}

function drawSpatialSlasher(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-5, 1, '#000', 11, 14); p(-4, 2, '#303F9F', 9, 12); p(-2, 2, '#00E5FF', 3, 10);
}

function drawSeer(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#FFF9C4', 11, 13); p(-1, 1, '#FFD700', 3, 11); p(-5, 11, '#F0E68C', 11, 3);
    p(-4, 4, '#03A9F4', 2, 2); p(2, 8, '#03A9F4', 2, 2); p(-4, -9, '#000', 9, 9); p(-3, -8, '#F5DDC7', 7, 7);
}

function drawCommander(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#455A64', 11, 13); p(-2, 1, '#D32F2F', 3, 11); p(-5, 11, '#263238', 11, 3);
}

function drawWraithLord(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#311B92', 11, 13); p(-2, 1, '#00C853', 3, 11); p(-5, 11, '#1A237E', 11, 3);
}

function drawCursedShaman(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#3F51B5', 11, 13); p(-5, 1, '#757575', 2, 13); p(4, 1, '#757575', 2, 13);
}

function drawRampart(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-7, -2, '#000', 15, 18); p(-6, -1, '#ECEFF1', 13, 16); p(-3, -1, '#1976D2', 7, 14);
}

function drawJudgment(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#B0BEC5', 11, 13); p(-2, 1, '#FFD700', 3, 11); p(-5, 11, '#78909C', 11, 3);
}

function drawTransmuter(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-7, 0, '#333', 15, 15); p(-6, 1, '#000000', 13, 13); p(-6, 11, '#00E676', 13, 1); p(-2, 1, '#FFD700', 3, 4);
}

function drawOracle(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#1A237E', 11, 13); p(-3, 1, '#651FFF', 5, 11);
}

function drawWarden(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-8, -2, '#000', 17, 18); p(-7, -1, '#212121', 15, 16); p(-4, -1, '#546E7A', 9, 14);
}

function drawCursedTalisman(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-7, 0, '#000', 15, 15); p(-6, 1, '#E0E0E0', 13, 6); p(-6, 7, '#B71C1C', 13, 7);
}

function drawAsura(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-8, -2, '#000', 17, 15); p(-7, -1, '#D32F2F', 15, 13); p(-4, -1, '#B71C1C', 9, 13);
}

function drawPiercingShadow(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#FFFFFF', 11, 13); p(-2, 1, '#FFD700', 3, 11);
}

function drawCocytus(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-7, -1, '#000', 15, 17); p(-6, 0, '#1A237E', 13, 15); p(-3, 0, '#00B8D4', 7, 15);
}

function drawPurgatory(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-7, 0, '#000', 15, 15); p(-6, 1, '#212121', 13, 13); p(-3, 3, '#D84315', 2, 8); p(2, 3, '#D84315', 2, 8);
}

function drawReaper(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-8, 0, '#000', 17, 16); p(-7, 1, '#0A0A0A', 15, 14); p(-3, 3, '#F5F5F5', 7, 1);
}

function drawDoomGuide(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-6, 0, '#000', 13, 15); p(-5, 1, '#37474F', 11, 13); p(-2, 1, '#263238', 5, 13);
}

function drawForsakenKing(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-7, 0, '#000', 15, 17); p(-6, 1, '#4A148C', 13, 15); p(-6, 14, '#FFD700', 13, 2);
}

function drawVoidGatekeeper(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-12, -15, '#000', 25, 32); p(-11, -14, '#546E7A', 23, 30); p(-5, -12, '#263238', 11, 8);
}

function drawEternalWall(cx, cy, tower) {
    const area = tower.currentSlot ? tower.currentSlot.area : 'left-slots'; const isLeft = area === 'left-slots'; 
    const S = 1.0; const p = (ox, oy, color, w=1, h=1) => {
        ctx.fillStyle = color; const finalOx = isLeft ? ox : -ox - w;
        ctx.fillRect(Math.floor(cx + (finalOx * S)), Math.floor(cy + (oy * S * 1.13)), Math.floor(w * S), Math.floor(h * S * 1.13));
    };
    p(-14, -10, '#000', 29, 26); p(-13, -9, '#795548', 27, 24); p(-4, 0, '#3E2723', 9, 9);
}

function drawSummons() {
    [...friendlySkeletons, ...friendlyGhosts].forEach(s => {
        const lx = (s.x / 100) * LOGICAL_WIDTH;
        const ly = s.y;
        ctx.save();
        ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(s.icon || '💀', lx, ly);
        ctx.restore();
        
        // HP Bar for summons
        const bw = 20; const hr = (s.hp || 100) / (s.maxHp || 100);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(lx - bw/2, ly - 20, bw, 2);
        ctx.fillStyle = '#00e5ff'; ctx.fillRect(lx - bw/2, ly - 20, bw * hr, 2);
    });
}

window.drawUnits = drawUnits;
window.drawSummons = drawSummons;
