/* soundeffect.js - Web Audio API Skeleton (Sounds Disabled) */

const audioUrls = {
    thunder: null,
    hover: null,
    start: null,
    sword: null,
    holy: null,
    kill: null,
    bgm: null,
    summon: null,
    attack: null,
    gameover: null
};

const soundBuffers = {};
let audioCtx = null;
let masterGain = null;
let bgmSource = null;
let bgmElement = null;
let bgmGain = null;

// Global state
let globalVolume = 0.5;
let isMuted = false;
let bgmPausedManual = false;

// Relative volume factors
const volumeFactors = {};

/**
 * Initialize Audio Context and Master Gain.
 * Skeleton remains for future use.
 */
function initAudioContext() {
    if (audioCtx) return audioCtx;
    // Context initialization is kept but no sounds are loaded
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = 0;
    return audioCtx;
}

/**
 * Fetch and decode audio data into a buffer.
 */
async function loadSound(name, url) {
    // Disabled
}

/**
 * Play a specific sound effect using Web Audio API.
 */
function playSound(soundName) {
    // Disabled
}

/**
 * Start or resume BGM.
 */
function startBGM() {
    // Disabled
}

/**
 * Play thunder sound (special case for start screen).
 */
function playThunder() {
    // Disabled
}

/**
 * Update global volume and individual gain nodes.
 */
function updateAllVolumes() {
    // Disabled
}

/**
 * Set the volume for a specific sound (updates factors).
 */
function setVolume(soundName, volume) {
    // Disabled
}

// Initial placeholder for 'sounds' object if other scripts expect it
const sounds = {
    get thunder() { return { play: () => {} }; },
    get bgm() { return null; }
};

// Handle initial interaction to unlock audio
window.addEventListener('click', () => {
    if (!audioCtx) initAudioContext();
}, { once: true });
