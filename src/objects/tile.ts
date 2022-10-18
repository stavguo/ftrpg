export default class Tile extends Phaser.GameObjects.Image {
  row: number;
  col: number;
  emitter: Phaser.Events.EventEmitter;
  noise: number;

  constructor(
    scene: any,
    x: number,
    y: number,
    texture: string,
    frame: number,
    data: object,
  ) {
    super(scene, x, y, texture, frame)
    this.setInteractive();
    this.setScale(4);
    this.setOrigin(0,0);
    this.row = data['row'];
    this.col = data['col'];
    this.emitter = data['emitter'];
    this.noise = data['noise'];

    if (frame === 0) {
      //this.setAlpha(0);
      this.setVisible(false);
      //this.setTexture('ocean');
      //this.add.shader('ocean', 0, 0, 960, 640).setOrigin(0);
      //this.scene.add.shader('ocean', this.row * 16 * 4, this.col * 16 * 4, 16 * 4, 16 * 4).setOrigin(0);
    }

    let lastTime = 0;
    this.on("pointerdown", ()=>{
      let clickDelay = this.scene.time.now - lastTime;
      lastTime = this.scene.time.now;
      if(clickDelay < 350) {
          this.emitter.emit('selectTile', this.x, this.y);
      }
    });   
  }
}