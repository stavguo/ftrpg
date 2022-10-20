import 'phaser';
import MainScene from './scenes/mainScene';
import PreloadScene from './scenes/preloadScene';

let DEFAULT_WIDTH;
let DEFAULT_HEIGHT;
//16x16 tiles, 15 by 10
if (window.innerWidth > window.innerHeight) {
  DEFAULT_WIDTH = 240 * 4;
  DEFAULT_HEIGHT = 160 * 4;
} else {
  DEFAULT_WIDTH = 160 * 4;
  DEFAULT_HEIGHT = 240 * 4;
}

const config = {
  type: Phaser.AUTO,
  //backgroundColor: '#ffffff',
  //backgroundColor: '#222034',
  backgroundColor: '#000',
  //antialias: true,
  //roundPixels: true,
  pixelArt: true,
  scale: {
    parent: 'phaser-game',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT
  },
  dom: {
    createContainer: true
  },
//   plugins: {
//     global: [{
//         key: 'rexHorrifiPipeline',
//         plugin: HorrifiPipelinePlugin,
//         start: true
//     }]
//   },
  scene: [PreloadScene, MainScene]
};

new Phaser.Game(config);