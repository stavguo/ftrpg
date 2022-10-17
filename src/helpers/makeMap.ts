import Tile from "../objects/tile";
import { createNoise2D } from 'simplex-noise';

export function makeMap(
  scene: Phaser.Scene,
  tiles: Phaser.GameObjects.Group,
  emitter: Phaser.Events.EventEmitter,
  widthInTiles: number,
  heightInTiles: number
  ) {
  const noise2D = createNoise2D();
  for (let row = 0; row < heightInTiles; row++) {
    for (let col = 0; col < widthInTiles; col++) {
      let noise = noise2D(row /10, col /10);
      let frame: number;
      if (noise < -0.6) {
        frame = 0;
      } else if (noise < -0.2) {
        frame = 1
      } else if (noise < 0.4) {
        frame = 2
      } else if (noise < 0.8) {
        frame = 3
      } else if (noise < 1) {
        frame = 4
      }
      let tile = new Tile(scene, 100, 100, 'terrain', frame, {
        row: row,
        col: col,
        emitter: emitter,
        noise: noise
      });
      scene.add.existing(tile);
      tiles.add(tile);
    }
  }
  Phaser.Actions.GridAlign(tiles.getChildren(), {
    width: widthInTiles,
    height: heightInTiles,
    cellWidth: 16 * 4,
    cellHeight: 16 * 4,
    position: Phaser.Display.Align.TOP_LEFT,
    x: 8 * 4,
    y: 8 * 4
  });
}