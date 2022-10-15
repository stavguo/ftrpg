export default class Tile extends Phaser.GameObjects.Image {
  //row: number;
  //col: number;
  //emitter: Phaser.Events.EventEmitter;

  constructor(
    scene: any,
    x: number,
    y: number,
    texture: string,
    frame: number,
    data: object
  ) {
    super(scene, x, y, texture, frame)
    //this.setInteractive();
    this.setScale(4);
    this.setOrigin(0,0);
    //this.row = data['row'];
    //this.col = data['col'];
    //this.emitter = data['emitter'];
  }
}