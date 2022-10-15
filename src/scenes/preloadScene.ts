export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    this.load.image('desert', 'assets/img/desert.png');
    this.load.image('forest', 'assets/img/forest.png');
    this.load.image('plain', 'assets/img/plain.png');
    this.load.image('sea', 'assets/img/sea.png');
    this.load.image('thicket', 'assets/img/thicket.png');
  }

  create() {
    this.scene.start('MainScene');
  }
}