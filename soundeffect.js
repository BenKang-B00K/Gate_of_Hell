/* soundeffect.js */
const sounds = {
    thunder: new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_c350677d07.mp3'), // Thunder sound
    hover: new Audio('https://heinig-ton.de/wp-content/uploads/2024/08/elemental-magic-spell-impact-outgoing-228342.mp3'),   // Elemental magic spell hover
    start: new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_2ba65f912e.mp3'),    // Deep cinematic start
    summon: null,   // Placeholder for summon sound
    attack: null,   // Placeholder for attack sound
    sword: new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_73d8102377.mp3'),    // Sword attack sound
    holy: new Audio('https://cdn.pixabay.com/audio/2024/05/22/audio_0af0ba0604.mp3'),     // Holy magic sound
    kill: new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_5177f803f3.mp3'),     // Enemy death sound
    gameover: null,  // Placeholder for game over sound
    bgm: new Audio('https://cdn.pixabay.com/audio/2021/11/11/audio_40f06f5228.mp3')      // Cave Temple BGM
};

// Configure BGM loop
if (sounds.bgm) {
    sounds.bgm.loop = true;
}


/**
 * Set the volume for a specific sound effect.
 * @param {string} soundName 
 * @param {number} volume - 0.0 to 1.0
 */
function setVolume(soundName, volume) {
    if (sounds[soundName] && sounds[soundName] instanceof Audio) {
        sounds[soundName].volume = volume;
    }
}

/**
 * Play a specific sound by name.
 * @param {string} soundName 
 */
function playSound(soundName) {
    if (sounds[soundName] && sounds[soundName] instanceof Audio) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => console.log(`Audio play for ${soundName} blocked`, e));
    }
}

/**
 * Play the thunder background sound if the game hasn't started.
 */
function playThunder() {
    if (typeof gameStarted !== 'undefined' && gameStarted) return;
    // Play thunder at random intervals matching the 'lightningStrike' animation cycle (2s)
    if (sounds.thunder) {
        sounds.thunder.currentTime = 0;
        sounds.thunder.play().catch(e => console.log("Audio play blocked until interaction"));
    }
}

// Initial Volume Configuration
setVolume('thunder', 0.4);
setVolume('hover', 0.3);
setVolume('start', 0.6);
setVolume('kill', 0.4);
setVolume('sword', 0.5);
setVolume('holy', 0.5);

// Global state for volume control
let globalVolume = 0.5;
let isMuted = false;
let bgmPausedManual = false;

/**
 * Update all sounds to the current global volume.
 */
function updateAllVolumes() {
    const currentVol = isMuted ? 0 : globalVolume;
    for (const key in sounds) {
        if (sounds[key] && sounds[key] instanceof Audio) {
            // Apply relative volumes based on original settings
            let factor = 1.0;
            if (key === 'thunder') factor = 0.8;
            if (key === 'hover') factor = 0.6;
            if (key === 'start') factor = 1.2;
            if (key === 'kill') factor = 0.8;
            if (key === 'sword') factor = 0.7;
            if (key === 'holy') factor = 0.8;
            if (key === 'bgm') {
                factor = 0.5; // BGM is usually quieter
                if (bgmPausedManual) {
                    if (!sounds[key].paused) sounds[key].pause();
                    continue;
                } else if (!isMuted && globalVolume > 0 && sounds[key].paused && typeof gameStarted !== 'undefined' && gameStarted) {
                    sounds[key].play().catch(() => {});
                }
            }
            
            sounds[key].volume = Math.min(1.0, currentVol * factor);
        }
    }
}

/**
 * Start the BGM if it's not already playing and not manually paused.
 */
function startBGM() {
    if (sounds.bgm && sounds.bgm.paused && !bgmPausedManual) {
        sounds.bgm.play().catch(e => console.log("BGM play blocked until interaction"));
    }
}


