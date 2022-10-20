import { makeMap } from '../helpers/makeMap';
import { setCamera } from '../helpers/setCamera';
import Character from '../objects/character';
import MiniMap from '../objects/miniMap';
import Tile from '../objects/tile';

export default class MainScene extends Phaser.Scene {
  emitter: Phaser.Events.EventEmitter;
  tiles: Phaser.GameObjects.Group;
  miniMapItems: Phaser.GameObjects.Group;
  char: Character;

  constructor() {
    super({ key: 'MainScene' });
  }

  async create() {
    //this.add.shader('ocean', 0, 0, 960 * 2, 640 * 2).setOrigin(0);
    this.emitter = new Phaser.Events.EventEmitter();
    this.tiles = this.add.group();
    this.miniMapItems = this.add.group();

    let tiles: Tile[] = [];
    makeMap(this, tiles, this.emitter, 30, 20);
    
    this.add.existing(new Character(this, 3 * 16 * 4, 3 * 16 * 4, 'goodChar', 0, {
      emitter: this.emitter,
      items: this.miniMapItems,
      tiles: tiles,
      distance: 4
    }));

    this.add.existing(new Character(this, 12 * 16 * 4, 8 * 16 * 4, 'badChar', 0, {
      emitter: this.emitter,
      items: this.miniMapItems,
      tiles: tiles,
      distance: 4
    }));

    this.add.existing(new MiniMap(this, 11.5 * 16 * 4, 0.5 * 16 * 4, 3 * 16 * 4, 2 * 16 * 4, {
      emitter: this.emitter,
      items: this.miniMapItems
    }));

    setCamera(this, this.emitter);
    
    // Add debugging hotkeys
    this.input.keyboard.on('keydown-R', () => {
      this.scene.restart();
    }); //
  }
}