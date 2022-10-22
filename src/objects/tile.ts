export default class Tile extends Phaser.GameObjects.Image {
  row: number;
  col: number;
  emitter: Phaser.Events.EventEmitter;
  noise: number;
  cost: number;

  constructor(
    scene: any,
    x: number,
    y: number,
    texture: string,
    frame: number,
    data: {
      row: number,
      col: number,
      emitter: Phaser.Events.EventEmitter,
      noise: number
    },
  ) {
    super(scene, x, y, texture, frame)
    this.setInteractive();
    this.setScale(4);
    this.setOrigin(0,0);
    this.row = data['row'];
    this.col = data['col'];
    this.setName(`${(this.row * 30) + this.col}`);
    this.emitter = data['emitter'];
    this.noise = data['noise'];

    if (frame === 2) {
      this.cost = 1;
    } else if (frame === 1 || frame === 3) {
      this.cost = 2;
    } else if (frame === 4) {
      this.cost = 3;
    } else if (frame === 0) {
      this.cost = null;
    }

    let lastTime = 0;
    this.on("pointerdown", ()=>{
      let clickDelay = this.scene.time.now - lastTime;
      lastTime = this.scene.time.now;
      if(clickDelay < 350) {
        this.emitter.emit('focus', this);
      }
    });   
  }
}