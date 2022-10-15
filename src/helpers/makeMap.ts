import Tile from "../objects/tiles/tile";

export function makeMap(scene: Phaser.Scene, widthInTiles: number, heightInTiles: number) {
  let tileGroup = scene.add.group();
    for (let row = 0; row < widthInTiles; row++) {
      for (let col = 0; col < heightInTiles; col++) {
        let randInt: number = Math.floor(Math.random() * 5);
        let tile = new Tile(scene, 100, 100, 'terrain', randInt, {});
        scene.add.existing(tile);
        tileGroup.add(tile);
      }
    }
    Phaser.Actions.GridAlign(tileGroup.getChildren(), {
      width: widthInTiles,
      height: heightInTiles,
      cellWidth: 16 * 4,
      cellHeight: 16 * 4,
      position: Phaser.Display.Align.TOP_LEFT,
      x: 8 * 4,
      y: 8 * 4
    });
}