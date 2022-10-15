import Tile from "../objects/tiles/tile";

export function makeMap(scene: Phaser.Scene) {
  let tileGroup = scene.add.group();
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 15; col++) {
        let randInt: number = Math.floor(Math.random() * 5);
        let tile = new Tile(scene, 100, 100, 'terrain', randInt, {});
        scene.add.existing(tile);
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
}