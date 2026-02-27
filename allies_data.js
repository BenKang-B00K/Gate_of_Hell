/* allies_data.js - Unit definitions and persistent data */

const unlockedUnits = new Set(['apprentice']);

function saveGameData() {
    const data = {
        unlockedUnits: Array.from(unlockedUnits),
        encounteredEnemies: Array.from(window.encounteredEnemies || [])
    };
    localStorage.setItem('gateOfHell_saveData', JSON.stringify(data));
}

function loadGameData() {
    const saved = localStorage.getItem('gateOfHell_saveData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.unlockedUnits) {
                data.unlockedUnits.forEach(u => unlockedUnits.add(u));
            }
            if (data.encounteredEnemies) {
                if (!window.encounteredEnemies) window.encounteredEnemies = new Set();
                data.encounteredEnemies.forEach(e => window.encounteredEnemies.add(e));
            }
        } catch (e) {
            console.error("Failed to load save data:", e);
        }
    }
}

// Initial load
loadGameData();

const unitTypes = [
    { type: 'apprentice', name: 'Apprentice Exorcist', role: 'Basic', tier: 1, icon: '🧙', damage: 35, range: 360, cooldown: 833, desc: "Fires a basic bolt of purified energy at a single target." },
    { type: 'chainer', name: 'Soul Chainer', role: 'Support', tier: 2, icon: '⛓️', damage: 15, range: 390, cooldown: 1000, desc: "Launches spiritual chains that damage and slow the target by 30%.", upgrades: ['executor', 'binder'] },
    { type: 'talisman', name: 'Talismanist', role: 'Attack', tier: 2, icon: '📜', damage: 25, range: 360, cooldown: 1500, desc: "Throws an explosive seal that deals area-of-effect damage on impact.", upgrades: ['grandsealer', 'flamemaster'] },
    { type: 'monk', name: 'Mace Monk', role: 'Support', tier: 2, icon: '⛪', damage: 40, range: 300, cooldown: 1200, desc: "Strikes with a heavy mace, knocking back spirits away from the gate.", upgrades: ['vajra', 'saint'] },
    { type: 'archer', name: 'Divine Archer', role: 'Attack', tier: 2, icon: '🏹', damage: 80, range: 750, cooldown: 1500, desc: "Shoots long-range precision arrows that ignore minor enemy defenses.", upgrades: ['voidsniper', 'thousandhand'] },
    { type: 'ice', name: 'Ice Daoist', role: 'Support', tier: 2, icon: '❄️', damage: 20, range: 390, cooldown: 1000, desc: "Casts a freezing spell that reduces enemy movement speed for 2 seconds.", upgrades: ['absolutezero', 'permafrost'] },
    { type: 'fire', name: 'Fire Mage', role: 'Attack', tier: 2, icon: '🔥', damage: 10, range: 360, cooldown: 1000, desc: "Ignites enemies, dealing 1% of their max HP as burn damage every second.", upgrades: ['hellfire', 'phoenix'] },
    { type: 'assassin', name: 'Shadow Assassin', role: 'Attack', tier: 2, icon: '🗡️', damage: 20, range: 300, cooldown: 300, desc: "Rapidly stabs with dual blades, bypassing all enemy defense points.", upgrades: ['abyssal', 'spatial'] },
    { type: 'tracker', name: 'Soul Tracker', role: 'Support', tier: 2, icon: '👁️', damage: 10, range: 300, cooldown: 1000, desc: "Projects a guiding light that expands the attack range of all nearby allies.", upgrades: ['seer', 'commander'] },
    { type: 'necromancer', name: 'Necromancer', role: 'Support', tier: 2, icon: '🔮', damage: 30, range: 360, cooldown: 1200, desc: "Summons a temporary wall of spectral energy to physically block ghosts.", upgrades: ['wraithlord', 'cursedshaman'] },
    { type: 'guardian', name: 'Sanctuary Guardian', role: 'Special', tier: 2, icon: '🛡️', damage: 50, range: 360, cooldown: 1500, desc: "Attacks with holy force, having a 5% chance to instantly banish the target.", upgrades: ['rampart', 'judgment'] },
    { type: 'alchemist', name: 'Exorcist Alchemist', role: 'Special', tier: 2, icon: '🧪', damage: 30, range: 330, cooldown: 1200, desc: "Transmutes enemy essence, with a 5% chance to gain 2 Soul Energy per hit.", upgrades: ['midas', 'philosopher'] },
    { type: 'mirror', name: 'Mirror Oracle', role: 'Special', tier: 2, icon: '🪞', damage: 25, range: 390, cooldown: 1500, desc: "Uses reflective magic to bounce 30% of hit damage onto another nearby enemy.", upgrades: ['illusion', 'reflection'] },
    { type: 'knight', name: 'Exorcist Knight', role: 'Attack', tier: 2, icon: '⚔️', damage: 45, range: 330, cooldown: 1000, desc: "Swings a blessed broadsword dealing balanced physical and holy damage.", upgrades: ['paladin', 'crusader'] },
    { type: 'paladin', name: 'Holy Paladin', role: 'Attack', tier: 3, icon: '⛪', damage: 55, range: 390, cooldown: 1000, desc: "Every 5th attack triggers a Divine Smite dealing 3x damage and stunning.", upgrades: ['eternal_wall'] },
    { type: 'crusader', name: 'Blood Crusader', role: 'Attack', tier: 3, icon: '🚩', damage: 80, range: 360, cooldown: 1500, desc: "Inflicts execution damage, dealing more pain as the enemy's HP gets lower.", upgrades: ['eternal_wall'] },
    { type: 'midas', name: 'Golden Midas', role: 'Special', tier: 3, icon: '💰', damage: 40, range: 360, cooldown: 1200, desc: "Coats strikes in gold, granting a massive 15 Soul Energy upon target kill.", upgrades: ['transmuter'] },
    { type: 'philosopher', name: 'Philosopher of Void', role: 'Special', tier: 3, icon: '💎', damage: 50, range: 390, cooldown: 1500, desc: "Each hit applies an acidic curse that permanently reduces enemy defense by 1.", upgrades: ['transmuter'] },
    { type: 'illusion', name: 'Illusion Weaver', role: 'Special', tier: 3, icon: '🎭', damage: 35, range: 420, cooldown: 1200, desc: "Strikes confuse the mind, with a 20% chance to make enemies wander aimlessly.", upgrades: ['oracle'] },
    { type: 'reflection', name: 'Reflection Master', role: 'Special', tier: 3, icon: '🪩', damage: 45, range: 450, cooldown: 1500, desc: "Fires crystalline shards that bounce between multiple enemies on impact.", upgrades: ['oracle'] },
    { type: 'executor', name: 'Underworld Executor', role: 'Special', tier: 3, icon: '⚖️', damage: 40, range: 450, cooldown: 1000, desc: "Swing the scales of fate, having a 10% chance to warp enemies back to start.", upgrades: ['warden'] },
    { type: 'binder', name: 'Soul Binder', role: 'Support', tier: 3, icon: '🔗', damage: 30, range: 420, cooldown: 1000, desc: "Links the souls of multiple enemies, making them share a portion of damage taken.", upgrades: ['warden'] },
    { type: 'grandsealer', name: 'Grand Sealer', role: 'Support', tier: 3, icon: '🛐', damage: 30, range: 390, cooldown: 1500, desc: "Fires sealing charms that neutralize the special abilities of hit enemies.", upgrades: ['cursed_talisman'] },
    { type: 'flamemaster', name: 'Fire Talisman Master', role: 'Attack', tier: 3, icon: '🌋', damage: 35, range: 390, cooldown: 1500, desc: "Leaves a persistent carpet of fire on the ground that deals continuous burn damage.", upgrades: ['cursed_talisman'] },
    { type: 'vajra', name: 'Vajrapani', role: 'Special', tier: 3, icon: '🔱', damage: 50, range: 300, cooldown: 1200, desc: "Crits with a divine trident, causing a massive knockback to all nearby enemies.", upgrades: ['asura'] },
    { type: 'saint', name: 'Saint of Vibration', role: 'Support', tier: 3, icon: '🔔', damage: 45, range: 300, cooldown: 1500, desc: "Strikes a holy bell, creating a shockwave that stuns all enemies in a small area.", upgrades: ['asura'] },
    { type: 'voidsniper', name: 'Void Sniper', role: 'Attack', tier: 3, icon: '🎯', damage: 120, range: 9999, cooldown: 2000, desc: "Fires a projectile that travels across the entire map to hit the enemy nearest to the gate.", upgrades: ['piercing_shadow'] },
    { type: 'thousandhand', name: 'Thousand-Hand Archer', role: 'Attack', tier: 3, icon: '🍃', damage: 40, range: 750, cooldown: 1500, desc: "Releases a volley of multiple arrows simultaneously at various targets.", upgrades: ['piercing_shadow'] },
    { type: 'absolutezero', name: 'Absolute Zero Mage', role: 'Special', tier: 3, icon: '💎', damage: 30, range: 420, cooldown: 1000, desc: "Attacks have a chance to instantly banish any frozen enemy below 20% HP.", upgrades: ['cocytus'] },
    { type: 'permafrost', name: 'Ice Maiden', role: 'Support', tier: 3, icon: '🌬️', damage: 25, range: 420, cooldown: 1000, desc: "Summons a persistent blizzard that significantly slows all enemies in a wide radius.", upgrades: ['cocytus'] },
    { type: 'hellfire', name: 'Hellfire Alchemist', role: 'Attack', tier: 3, icon: '🧪', damage: 20, range: 390, cooldown: 1000, desc: "Targets already on fire will explode upon death, damaging others nearby.", upgrades: ['purgatory'] },
    { type: 'phoenix', name: 'Phoenix Summoner', role: 'Attack', tier: 3, icon: '🐦‍🔥', damage: 40, range: 540, cooldown: 2000, desc: "Calls down a phoenix that leaves a trail of high-damage fire behind its target.", upgrades: ['purgatory'] },
    { type: 'abyssal', name: 'Abyssal Killer', role: 'Special', tier: 3, icon: '🌑', damage: 30, range: 300, cooldown: 300, desc: "Harvests souls with precision, granting 1.5x Soul Energy for every kill.", upgrades: ['reaper'] },
    { type: 'spatial', name: 'Spatial Slasher', role: 'Attack', tier: 3, icon: '🌌', damage: 25, range: 360, cooldown: 300, desc: "Summons spectral clones that mimic his attacks, hitting multiple enemies at once.", upgrades: ['reaper'] },
    { type: 'seer', name: 'Seeker of Truth', role: 'Support', tier: 3, icon: '🔭', damage: 15, range: 360, cooldown: 1000, desc: "Projects a revealing aura that exposes stealthed or phased enemies to all allies.", upgrades: ['doom_guide'] },
    { type: 'commander', name: 'Battlefield Commander', role: 'Support', tier: 3, icon: '🚩', damage: 15, range: 360, cooldown: 1000, desc: "Inspires nearby allies, increasing their attack speed by 20%.", upgrades: ['doom_guide'] },
    { type: 'wraithlord', name: 'Wraith Lord', role: 'Support', tier: 3, icon: '🧟', damage: 40, range: 390, cooldown: 1200, desc: "Each kill has a chance to resurrect the spirit as a friendly skeleton to fight for you.", upgrades: ['forsaken_king'] },
    { type: 'cursedshaman', name: 'Cursed Shaman', role: 'Support', tier: 3, icon: '🎭', damage: 20, range: 390, cooldown: 1500, desc: "Curses enemies, permanently reducing their Max HP by 5% each time they are hit.", upgrades: ['forsaken_king'] },
    { type: 'rampart', name: 'Holy Rampart', role: 'Support', tier: 3, icon: '🏰', damage: 40, range: 360, cooldown: 1500, desc: "Defends the portal, with a 100% chance to warp reaching enemies back to the start (5 charges).", upgrades: ['void_gatekeeper'] },
    { type: 'judgment', name: 'Knight of Judgment', role: 'Attack', tier: 3, icon: '⚔️', damage: 60, range: 390, cooldown: 1500, desc: "Calls down a holy light that deals area damage to all enemies around the target.", upgrades: ['void_gatekeeper'] },
    { type: 'transmuter', name: 'Void Transmuter', role: 'Special', tier: 4, icon: '⚛️', damage: 60, range: 420, cooldown: 1000, desc: "Completely transmutes spirits, granting 25 Soul Energy for every kill." },
    { type: 'oracle', name: 'Oracle of Eternity', role: 'Special', tier: 4, icon: '💠', damage: 70, range: 480, cooldown: 1200, desc: "Shoots cosmic projectiles that temporarily freeze enemy movement on impact." },
    { type: 'warden', name: 'Warden of the Abyss', role: 'Support', tier: 4, icon: '🗝️', damage: 100, range: 600, cooldown: 10000, desc: "Periodically opens a black hole that pulls all enemies on screen to the center." },
    { type: 'cursed_talisman', name: 'Cursed Sect', role: 'Attack', tier: 4, icon: '⛩️', damage: 80, range: 450, cooldown: 1200, desc: "Marks enemies for death; they explode with massive damage when their soul is extinguished." },
    { type: 'asura', name: 'Hell Crushing Asura', role: 'Attack', tier: 4, icon: '👹', damage: 60, range: 360, cooldown: 400, desc: "Unleashes a rapid flurry of 12 strikes in quick succession at nearby targets." },
    { type: 'piercing_shadow', name: 'Soul Piercing Shadow', role: 'Attack', tier: 4, icon: '🌠', damage: 300, range: 9999, cooldown: 2000, desc: "Fires a massive beam of light that pierces through all enemies in its path." },
    { type: 'cocytus', name: 'Ruler of Cocytus', role: 'Special', tier: 4, icon: '⏳', damage: 20, range: 600, cooldown: 20000, desc: "Ultimate ice magic that freezes time for all enemies on screen for 5 seconds." },
    { type: 'purgatory', name: 'Eternal Purgatory Fire', role: 'Attack', tier: 4, icon: '🕯️', damage: 20, range: 450, cooldown: 800, desc: "Ignites an entire row of the map, dealing permanent burn damage to anyone stepping there." },
    { type: 'reaper', name: 'Nightmare Reaper', role: 'Special', tier: 4, icon: '☠️', damage: 0, range: 0, cooldown: 3000, desc: "Immediately reaps the soul of the enemy with the highest current HP on the map." },
    { type: 'doom_guide', name: 'Guide of Doom', role: 'Special', tier: 4, icon: '🛶', damage: 40, range: 450, cooldown: 800, desc: "Purifies the gate; enemies reaching the portal actually restore 5% Portal Energy instead of damage." },
    { type: 'forsaken_king', name: 'King of the Forsaken', role: 'Support', tier: 4, icon: '👑', damage: 100, range: 450, cooldown: 1000, desc: "Summons friendly ghosts at the start of each stage to fight alongside your exorcists." },
    { type: 'void_gatekeeper', name: 'Gatekeeper of the Void', role: 'Support', tier: 4, icon: '🚪', damage: 0, range: 0, cooldown: 0, desc: "Passively seals the portal, reducing all incoming Portal Energy damage by 50%." },
    { type: 'eternal_wall', name: 'Guardian of Eternity', role: 'Support', tier: 4, icon: '🗿', damage: 150, range: 450, cooldown: 2000, desc: "Emits a powerful stabilizing aura that slows all enemies on the map by 80%." }
];
