export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    this.load.spritesheet('terrain', 'assets/img/terrain.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('goodChar', 'assets/img/goodChar.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('badChar', 'assets/img/badChar.png', { frameWidth: 16, frameHeight: 16 });
    //this.load.glsl('bundle', 'assets/plasma-bundle.glsl.js');
    this.load.glsl('ocean', 'assets/ocean.frag');
  }

  create() {
    this.scene.start('MainScene');
  }
}