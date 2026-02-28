/* enemies.js - Enemy Definitions */
window.enemyCategories = {
    basic: [
        { type: 'normal', name: 'Whispering Soul', hp: 100, speed: 1.0, reward: 10 },
        { type: 'mist', name: 'Wandering Mist', hp: 80, speed: 1.4, reward: 12 },
        { type: 'memory', name: 'Faded Memory', hp: 120, speed: 0.8, reward: 15 }
    ],
    pattern: [
        { type: 'runner', name: 'Haste-Cursed Shadow', hp: 60, speed: 2.2, reward: 20 },
        { type: 'tank', name: 'Ironclad Wraith', hp: 300, speed: 0.5, reward: 25 }
    ],
    enhanced: [
        { type: 'greedy', name: 'Gluttonous Poltergeist', hp: 200, speed: 1.2, reward: 40 }
    ],
    fallen: []
};

window.bossData = {
    cerberus: { type: 'cerberus', name: 'Cerberus', hp: 2000, speed: 0.6, reward: 500, isBoss: true },
    charon: { type: 'charon', name: 'Charon', hp: 2500, speed: 0.5, reward: 600, isBoss: true }
};
