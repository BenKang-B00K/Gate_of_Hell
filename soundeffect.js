/* soundeffect.js - Web Audio API Implementation */

const audioUrls = {
    thunder: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c350677d07.mp3',
    hover: 'https://heinig-ton.de/wp-content/uploads/2024/08/elemental-magic-spell-impact-outgoing-228342.mp3',
    start: 'https://cdn.pixabay.com/audio/2022/03/10/audio_2ba65f912e.mp3',
    sword: 'https://cdn.pixabay.com/audio/2022/03/15/audio_73d8102377.mp3',
    holy: 'https://cdn.pixabay.com/audio/2024/05/22/audio_0af0ba0604.mp3',
    kill: 'https://cdn.pixabay.com/audio/2022/03/15/audio_5177f803f3.mp3',
    bgm: 'https://cdn.pixabay.com/audio/2021/11/11/audio_40f06f5228.mp3',
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
const volumeFactors = {
    thunder: 0.4,
    hover: 0.3,
    start: 0.6,
    kill: 0.4,
    sword: 0.5,
    holy: 0.5,
    bgm: 0.25,
    summon: 0.5,
    attack: 0.5,
    gameover: 0.6
};

/**
 * Initialize Audio Context and Master Gain.
 * Must be triggered by user interaction.
 */
function initAudioContext() {
    if (audioCtx) return audioCtx;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = isMuted ? 0 : globalVolume;

    // Initialize BGM element
    bgmElement = new Audio(audioUrls.bgm);
    bgmElement.loop = true;
    bgmElement.crossOrigin = "anonymous";
    
    bgmSource = audioCtx.createMediaElementSource(bgmElement);
    bgmGain = audioCtx.createGain();
    bgmGain.gain.value = volumeFactors.bgm;
    
    bgmSource.connect(bgmGain);
    bgmGain.connect(masterGain);

    // Preload other sounds
    for (const name in audioUrls) {
        if (name !== 'bgm') {
            loadSound(name, audioUrls[name]);
        }
    }

    return audioCtx;
}

/**
 * Fetch and decode audio data into a buffer.
 */
async function loadSound(name, url) {
    if (!url) return;
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        soundBuffers[name] = audioBuffer;
    } catch (e) {
        console.error(`Failed to load sound: ${name}`, e);
    }
}

/**
 * Play a specific sound effect using Web Audio API.
 */
function playSound(soundName) {
    if (!audioCtx) initAudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const buffer = soundBuffers[soundName];
    if (!buffer) return;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    // Per-sound gain node to apply relative factors
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volumeFactors[soundName] || 1.0;

    source.connect(gainNode);
    gainNode.connect(masterGain);
    source.start(0);
}

/**
 * Start or resume BGM.
 */
function startBGM() {
    if (!audioCtx) initAudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (bgmElement && bgmElement.paused && !bgmPausedManual) {
        bgmElement.play().catch(e => console.log("BGM play blocked", e));
    }
}

/**
 * Play thunder sound (special case for start screen).
 */
function playThunder() {
    if (typeof gameStarted !== 'undefined' && gameStarted) return;
    playSound('thunder');
}

/**
 * Update global volume and individual gain nodes.
 */
function updateAllVolumes() {
    if (!masterGain) return;

    const currentVol = isMuted ? 0 : globalVolume;
    masterGain.gain.setTargetAtTime(currentVol, audioCtx.currentTime, 0.05);

    if (bgmElement) {
        if (bgmPausedManual || isMuted || globalVolume === 0) {
            bgmElement.pause();
        } else if (typeof gameStarted !== 'undefined' && gameStarted) {
            bgmElement.play().catch(() => {});
        }
    }
}

/**
 * Set the volume for a specific sound (updates factors).
 */
function setVolume(soundName, volume) {
    volumeFactors[soundName] = volume;
    if (soundName === 'bgm' && bgmGain) {
        bgmGain.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.05);
    }
    updateAllVolumes();
}

// Initial placeholder for 'sounds' object if other scripts expect it
const sounds = {
    get thunder() { return { play: () => playSound('thunder') }; },
    get bgm() { return bgmElement; }
};

// Handle initial interaction to unlock audio
window.addEventListener('click', () => {
    if (!audioCtx) initAudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });
