import { makeMap } from '../helpers/makeMap';
import { setCamera } from '../helpers/setCamera';
import Character from '../objects/character';

export default class MainScene extends Phaser.Scene {
  emitter: Phaser.Events.EventEmitter;
  tiles: Phaser.GameObjects.Group;
  char: Character;

  constructor() {
    super({ key: 'MainScene' });
  }

  async create() {
    this.emitter = new Phaser.Events.EventEmitter();
    this.tiles = this.add.group();
    makeMap(this, this.tiles, this.emitter, 30, 20);
    setCamera(this, this.emitter);
    this.char = this.add.existing(new Character(this, 3 * 16 * 4, 3 * 16 * 4, 'goodChar', 0, {
      emitter: this.emitter
    }));

    this.add.existing(new Character(this, 12 * 16 * 4, 8 * 16 * 4, 'badChar', 0, {
      emitter: this.emitter
    }));

    // Add debugging hotkeys
    this.input.keyboard.on('keydown-R', () => {
      this.scene.restart();
    }); //
  }
}