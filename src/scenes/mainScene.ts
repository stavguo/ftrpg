import { makeMap } from '../helpers/makeMap';

export default class MainScene extends Phaser.Scene {
  //emitter: Phaser.Events.EventEmitter;

  constructor() {
    super({ key: 'MainScene' });
  }

  async create() {
    //this.emitter = new Phaser.Events.EventEmitter();
    
    makeMap(this);


    // Add debugging hotkeys
    this.input.keyboard.on('keydown-R', () => {
      this.scene.restart();
    }, this);
  }
}