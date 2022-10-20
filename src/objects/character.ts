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
    this.currentTile = this.tiles[((x/64) * 30) + (y/64)]; // 30 = width of board in tiles
    this.manhattan(this.tiles, this.currentTile, this.distance);

    // Double click listener
    let lastTime = 0;
    this.on("pointerdown", ()=>{
      let clickDelay = this.scene.time.now - lastTime;
      lastTime = this.scene.time.now;
      if(clickDelay < 350) {
        this.emitter.emit('selectChar', this);
      }
    });

    // Make MiniMap Item
    let miniMapColor: number;
    if (this.texture.key === 'goodChar') {
      miniMapColor = 0x5151bf;
    } else if (this.texture.key === 'badChar') {
      miniMapColor = 0xea3e3e;
    }

    // mini-mini-map is 10 times smaller than 15/10 tile view
    this.miniMapItem = new Phaser.GameObjects.Rectangle(this.scene,  (11.5 * 16 * 4) + (this.x/(5 * 2)), (0.5 * 16 * 4) + (this.y/(5 * 2)), 6.5, 6.5, miniMapColor)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(1);
    this.items.add(this.miniMapItem);
    this.scene.add.existing(this.miniMapItem);


    this.emitter.on('selectTile', (x: number, y: number) => {
      if (this.selected) this.move(x, y);
    }, this);

    this.emitter.on('selectChar', (char: Character) => {
      if (this === char) {
        if (this.selected) {
          this.selected = false;
          this.possibleTiles.forEach((el) => el.clearTint());
          this.stopSelectTween();
          this.emitter.emit('selectChar', null);
        } else {
          this.selected = true;
          this.possibleTiles.forEach((el) => el.setTint(0x7DD0D7,0xffffff,0xffffff,0xffffff));
          this.startSelectTween();
        }
      } else {
        if (this.selected) {
          this.selected = false;
          this.possibleTiles.forEach((el) => el.clearTint());
          this.stopSelectTween();
        }
      }
    });
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
    this.possibleTiles.forEach((el) => el.clearTint());
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
    this.miniMapItem.setPosition((11.5 * 16 * 4) + (newX/(5 * 2)), (0.5 * 16 * 4) + (newY/(5 * 2)));
    this.selected = false;
    this.manhattan(this.tiles, this.currentTile, this.distance);
  }

  manhattan(
    tiles: Tile[],
    currentTile: Tile,
    possibleDistance: number
    ) {
    this.possibleTiles = [];
    for (let i = possibleDistance; i > 0; i--) {
      for (let j = i; j <= possibleDistance; j++) {
        let row = possibleDistance - j;
        let col = i;
        if (
          currentTile.row - row >= 0 && currentTile.row - row < 20 &&
          currentTile.col + col >= 0 && currentTile.col + col < 30
          ) {
          let tmp: Tile = tiles[((currentTile.row - row) * 30) + (currentTile.col + col)];
          this.possibleTiles.push(tmp);
        }
        if (
          currentTile.row + row + 1 >= 0 && currentTile.row + row + 1 < 20 &&
          currentTile.col + col - 1 >= 0 && currentTile.col + col - 1 < 30
          ) {
          let tmp: Tile = tiles[((currentTile.row + row + 1) * 30) + (currentTile.col + col - 1)];
          this.possibleTiles.push(tmp);
        }
        if (
          currentTile.row + row >= 0 && currentTile.row + row < 20 &&
          currentTile.col - col >= 0 && currentTile.col - col < 30
          ) {
          let tmp: Tile = tiles[((currentTile.row + row) * 30) + (currentTile.col - col)];
          this.possibleTiles.push(tmp);
        }
        if (
          currentTile.row - row - 1 >= 0 && currentTile.row - row - 1 < 20 &&
          currentTile.col - col + 1 >= 0 && currentTile.col - col + 1 < 30
          ) {
          let tmp: Tile = tiles[((currentTile.row - row - 1) * 30) + (currentTile.col - col + 1)];
          this.possibleTiles.push(tmp);
        }
      }
    }
  }
}