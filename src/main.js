import BootScene from './scenes/BootScene.js';
import Level1 from './scenes/Level1.js';

const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false
        }
    },
    scene: [BootScene, Level1],
    pixelArt: true
}
new Phaser.Game(config);