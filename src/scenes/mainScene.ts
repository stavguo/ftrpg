import PlainTile from '../objects/tiles/plainTile';

export default class MainScene extends Phaser.Scene {
  //emitter: Phaser.Events.EventEmitter;

  constructor() {
    super({ key: 'MainScene' });
  }

  // This is how to pass data to a new scene
  // init(data: any) {
  //   (data.level) ? this.level = data.level : this.level = 0;
  // }

  async create() {
    // Add systems
    //this.emitter = new Phaser.Events.EventEmitter();
    console.log('main');


    let tileGroup = this.add.group();
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 15; col++) {
        let randInt: number = Math.floor(Math.random() * 5);
        let tiletype: string;
        if (randInt === 0) {
          tiletype = 'desert';
        } else if (randInt === 1) {
          tiletype = 'forest';
        } else if (randInt === 2) {
          tiletype = 'plain';
        } else if (randInt === 3) {
          tiletype = 'sea';
        } else if (randInt === 4) {
          tiletype = 'thicket';
        }
        console.log(tiletype);
        let tile = new PlainTile(this, 100, 100, tiletype, {
          // row: row,
          // col: col,
          // emitter: this.emitter
        });
        this.add.existing(tile);
        tileGroup.add(tile);
      }
    }
    Phaser.Actions.GridAlign(tileGroup.getChildren(), {
      width: 15,
      height: 10,
      cellWidth: 16 * 4,
      cellHeight: 16 * 4,
      position: Phaser.Display.Align.TOP_LEFT,
      x: 32,
      y: 32
    });


    // Add debugging hotkeys
    this.input.keyboard.on('keydown-R', () => {
      this.scene.restart();
    }, this);
  }
}