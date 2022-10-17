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

    // Create flashing tween
    this.selectedTween = this.scene.add.tween({
      targets: this,
      duration: 1000,
      ease: Phaser.Math.Easing.Linear,
      repeat: -1,
      paused: true,
      alpha: {
        getStart: () => 0.1,
        getEnd: () => 1
      }
    });

    // Double click listener
    let lastTime = 0;
    this.on("pointerdown", ()=>{
      let clickDelay = this.scene.time.now - lastTime;
      lastTime = this.scene.time.now;
      if(clickDelay < 350) {
        if (this.selected) {
          this.unselect();
        } else {
          this.select();
        }
      }
    });   

    this.emitter.on('centerOn', this.move, this);
  }

  select() {
    this.emitter.emit('centerOn', this.x, this.y);
    this.selected = true;
    this.emitter.emit('charSelect', true);
    this.selectedTween.play();
  }

  unselect() {
    this.selected = false;
    this.emitter.emit('charSelect', false);
    this.selectedTween.stop();
    this.setAlpha(1);
  }

  move(newX: number, newY: number) {
    if (this.selected) {
      this.unselect();
      let dist = Math.sqrt(Math.pow(newX - this.x, 2) + Math.pow(newY - this.y, 2))
      let duration = dist * 2.5;
      this.emitter.emit('moveChar', newX, newY, duration);
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
    }
  }
}