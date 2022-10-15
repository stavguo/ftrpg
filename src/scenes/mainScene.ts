import { makeMap } from '../helpers/makeMap';
import { setCamera } from '../helpers/setCamera';

export default class MainScene extends Phaser.Scene {
  //emitter: Phaser.Events.EventEmitter;

  constructor() {
    super({ key: 'MainScene' });
  }

  async create() {
    //this.emitter = new Phaser.Events.EventEmitter();
    
    makeMap(this, 30, 20);
    setCamera(this);


    // Add debugging hotkeys
    this.input.keyboard.on('keydown-R', () => {
      this.scene.restart();
    }, this);
  }
}