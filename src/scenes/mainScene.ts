import { makeMap } from '../helpers/makeMap';
import { setCamera } from '../helpers/setCamera';
import Character from '../objects/character';
import MiniMap from '../objects/miniMap';

export default class MainScene extends Phaser.Scene {
  emitter: Phaser.Events.EventEmitter;
  tiles: Phaser.GameObjects.Group;
  miniMapItems: Phaser.GameObjects.Group;
  char: Character;

  constructor() {
    super({ key: 'MainScene' });
  }

  async create() {
    this.emitter = new Phaser.Events.EventEmitter();
    this.tiles = this.add.group();
    this.miniMapItems = this.add.group();

    makeMap(this, this.tiles, this.emitter, 30, 20);
    
    
    this.add.existing(new Character(this, 0 * 16 * 4, 0 * 16 * 4, 'goodChar', 0, {
      emitter: this.emitter,
      items: this.miniMapItems
    }));

    this.add.existing(new Character(this, 12 * 16 * 4, 8 * 16 * 4, 'badChar', 0, {
      emitter: this.emitter,
      items: this.miniMapItems
    }));

    this.add.existing(new MiniMap(this, 11.5 * 16 * 4, 0.5 * 16 * 4, 3 * 16 * 4, 2 * 16 * 4, {
      emitter: this.emitter,
      items: this.miniMapItems
    }));

    setCamera(this, this.emitter, this.miniMapItems);

    // Add debugging hotkeys
    this.input.keyboard.on('keydown-R', () => {
      this.scene.restart();
    }); //
  }
}