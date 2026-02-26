/* soundeffect.js */
const sounds = {
    thunder: new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_c350677d07.mp3'), // Thunder sound
    hover: new Audio('https://heinig-ton.de/wp-content/uploads/2024/08/elemental-magic-spell-impact-outgoing-228342.mp3'),   // Elemental magic spell hover
    start: new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_2ba65f912e.mp3'),    // Deep cinematic start
    summon: null,   // Placeholder for summon sound
    attack: null,   // Placeholder for attack sound
    kill: null,     // Placeholder for enemy death sound
    gameover: null  // Placeholder for game over sound
};

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
