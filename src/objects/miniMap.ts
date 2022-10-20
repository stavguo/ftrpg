export default class MiniMap extends Phaser.GameObjects.Rectangle {
  items: Phaser.GameObjects.Group;
  emitter: Phaser.Events.EventEmitter;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    data: object
  ) {
    super(scene, x, y, width, height);
    this.setStrokeStyle(4, 0xffffff, 0.8);
    this.setScrollFactor(0);
    this.setOrigin(0);
    this.setFillStyle(0x000, 0.1)
    this.items = data['items'];
    this.emitter = data['emitter'];
    this.items.add(this);

    let smallRect = new Phaser.GameObjects.Rectangle(this.scene, 11.5 * 16 * 4, 0.5 * 16 * 4, 1.5 * 16 * 4, 1 * 16 * 4);
    smallRect
      .setStrokeStyle(4, 0xffffff, 0.8)
      .setOrigin(0)
      .setScrollFactor(-0.1);
    this.scene.add.existing(smallRect);
    this.items.add(smallRect);

    if (window.innerWidth < window.innerHeight) {
      this.setPosition(3.5 * 16 * 4, 0.5 * 16 * 4);
      smallRect.setPosition(3.5 * 16 * 4, 0.5 * 16 * 4);
      smallRect.setScale(2/3, 3/2);
    }

    this.items.setAlpha(0);
    this.emitter.on('pointerup', () => {
      this.items.setAlpha(0);
    });

    this.emitter.on('pointerdown', () => {
      this.items.setAlpha(1);
    });
  }
}