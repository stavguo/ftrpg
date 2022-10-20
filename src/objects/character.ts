import Tile from "./tile";

export default class Character extends Phaser.GameObjects.Sprite {
  emitter: Phaser.Events.EventEmitter;
  selected: boolean;
  selectedTween: Phaser.Tweens.Tween;
  miniMapItem: Phaser.GameObjects.Rectangle;
  items: Phaser.GameObjects.Group;
  tiles: Tile[];
  possibleTiles: Tile[];
  currentTile: Tile;
  distance: number;
  color: number;

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
    this.items = data['items'];
    this.tiles = data['tiles'];
    this.distance = data['distance'];

    this.selected = false;
    this.currentTile = this.tiles[((y/64) * 30) + (x/64)]; // 30 = width of board in tiles
    this.manStart(this.currentTile.row, this.currentTile.col, this.distance);

    // Double click listener
    let lastTime = 0;
    this.on("pointerdown", ()=>{
      let clickDelay = this.scene.time.now - lastTime;
      lastTime = this.scene.time.now;
      if(clickDelay < 350) {
        //this.emitter.emit('selectChar', this);
        this.emitter.emit('focus', this);
      }
    });

    // Make MiniMap Item
    if (this.texture.key === 'goodChar') {
      this.color = 0x5151bf;
    } else if (this.texture.key === 'badChar') {
      this.color = 0xea3e3e;
    }
    let miniMapWidth = 11.5;
    if (window.innerWidth < window.innerHeight) {
      miniMapWidth = 3.5;
    }
    // mini-mini-map is 10 times smaller than 15/10 tile view
    this.miniMapItem = new Phaser.GameObjects.Rectangle(this.scene,  (miniMapWidth * 16 * 4) + (this.x/(5 * 2)), (0.5 * 16 * 4) + (this.y/(5 * 2)), 6.5, 6.5, this.color)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(1);
    this.items.add(this.miniMapItem);
    this.scene.add.existing(this.miniMapItem);


    this.emitter.on('focus', (obj: Tile | Character) => {
      if (obj === this) {
        if (this.selected) {
          this.deselect();
        } else {
          this.select();
        }
      } else {
        if (this.selected) {
          this.deselect();
          if (obj instanceof Tile && this.possibleTiles.includes(this.tiles[((obj.y/64) * 30) + (obj.x/64)])) {
            //this.emitter.emit('moveChar', this.currentTile.x, this.currentTile.y, x, y);
            this.move(obj.x, obj.y);
          }
        }
      }
    }, this);
  }

  select() {
    this.selected = true;
    if (this.texture.key === 'goodChar') this.possibleTiles.forEach((el) => el.setTint(0x7DD0D7,0xffffff,0xffffff,0xffffff));
    if (this.texture.key === 'badChar') this.possibleTiles.forEach((el) => el.setTint(0xd77d7d,0xffffff,0xffffff,0xffffff));
    this.startSelectTween();
  }

  deselect() {
    this.selected = false;
    this.possibleTiles.forEach((el) => el.clearTint());
    this.stopSelectTween();
  }

  startSelectTween() {
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
    this.currentTile = this.tiles[((newY/64) * 30) + (newX/64)];
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
    if (window.innerHeight > window.innerWidth) {
      this.miniMapItem.setPosition((3.5 * 16 * 4) + (newX/(5 * 2)), (0.5 * 16 * 4) + (newY/(5 * 2)));
    } else {
      this.miniMapItem.setPosition((11.5 * 16 * 4) + (newX/(5 * 2)), (0.5 * 16 * 4) + (newY/(5 * 2)));
    }
    this.manStart(this.currentTile.row, this.currentTile.col, this.distance);
  }

  manStart(row: number, col: number, dist: number) {
    this.possibleTiles = [];
    // Go NSEW
    this.manhattan(row - 1, col, dist);
    this.manhattan(row + 1, col, dist);
    this.manhattan(row, col + 1, dist);
    this.manhattan(row, col - 1, dist);
    // Remove duplicates
    const names = this.possibleTiles.map(o => o.name);
    this.possibleTiles = this.possibleTiles.filter(({name}, index) => !names.includes(name, index + 1));
  }

  manhattan(row: number, col: number, dist: number) {
    if (!this.satisfiesBounds(row, col)) return;
    let tile = this.tiles[(row * 30) + col];
    let cost = tile.cost;
    if (cost === null) return;
    if (dist - cost < 0) return;
    this.possibleTiles.push(tile);
    this.manhattan(row - 1, col, dist - cost);
    this.manhattan(row + 1, col, dist - cost);
    this.manhattan(row, col + 1, dist - cost);
    this.manhattan(row, col - 1, dist - cost);
  }

  satisfiesBounds(row: number, col: number) {
    return (row >= 0 && row < 20 && col >= 0 && col < 30) ? true : false;
  }
}