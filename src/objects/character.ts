export default class Character extends Phaser.GameObjects.Sprite {
  emitter: Phaser.Events.EventEmitter;
  selected: boolean;
  selectedTween: Phaser.Tweens.Tween;

  constructor(
    scene: any,
    x: number,
    y: number,
    texture: string,
    frame: number,
    data: object,
  ) {
    super(scene, x, y, texture, frame);
    this.setInteractive();
    this.setScale(4);
    this.setOrigin(0,0);
    this.emitter = data['emitter'];
    this.selected = false;

    // Double click listener
    let lastTime = 0;
    this.on("pointerdown", ()=>{
      let clickDelay = this.scene.time.now - lastTime;
      lastTime = this.scene.time.now;
      if(clickDelay < 350) {
        this.emitter.emit('selectChar', this);
      }
    });   

    this.emitter.on('selectTile', (x: number, y: number) => {
      if (this.selected) this.move(x, y);
    }, this);

    this.emitter.on('selectChar', (char: Character) => {
      if (this === char) {
        if (this.selected) {
          this.selected = false;
          this.stopSelectTween();
          this.emitter.emit('selectChar', null);
        } else {
          this.selected = true;
          this.startSelectTween();
        }
      } else {
        if (this.selected) {
          this.selected = false;
          this.stopSelectTween();
        }
      }
    })
  }

  startSelectTween() {
    // Create flashing tween
    this.selectedTween = this.scene.add.tween({
      targets: this,
      duration: 1000,
      ease: Phaser.Math.Easing.Linear,
      repeat: -1,
      paused: false,
      alpha: {
        getStart: () => 0.1,
        getEnd: () => 1
      }
    });
  }

  stopSelectTween() {
    this.selectedTween.stop();
    this.selectedTween.remove();
    this.setAlpha(1);
  }

  move(newX: number, newY: number) {
    this.stopSelectTween();
    let dist = Math.sqrt(Math.pow(newX - this.x, 2) + Math.pow(newY - this.y, 2))
    let duration = dist * 2.5;
    this.scene.add.tween({
      targets: this,
      duration: duration,
      ease: Phaser.Math.Easing.Linear,
      x: newX
    });
    this.scene.add.tween({
      targets: this,
      duration: duration,
      ease: Phaser.Math.Easing.Linear,
      y: newY
    });
    this.selected = false;
  }
}