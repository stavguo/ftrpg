import Character from "../objects/character";
import Tile from "../objects/tile";

export function setCamera(scene: Phaser.Scene, emitter: Phaser.Events.EventEmitter) {
  // Initialize camera
  let cam = scene.cameras.main;
  cam.setBounds(0,0, (240 * 4) * 2, (160 * 4) * 2);

  // Move camera when screen is dragged
  let down: boolean = false;
  scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
    if (!p.isDown) {
      return;
    } else {
      cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
      cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
      if (!down && (Math.sqrt(Math.pow(p.x - p.prevPosition.x, 2) + Math.pow(p.y - p.prevPosition.y, 2))) > 2) {
        down = true;
        emitter.emit('pointerdown');
      }
    }
  });

  scene.input.on('pointerup', (p: Phaser.Input.Pointer)=> {
    if (!p.primaryDown && down) {
      down = false;
      emitter.emit('pointerup');
    }
  });

  emitter.on('focus', (obj: Tile | Character) => {
    cam.pan(obj.x + (8 * 4), obj.y, 500, Phaser.Math.Easing.Quadratic.InOut);
  });

  // emitter.on('moveChar', (oldX: number, oldY: number, newX: number, newY: number) => {
  //   // Follow selected character to selected tile
  //   //if (selectedChar !== null) {
  //     let dist = Math.sqrt(Math.pow(newX - oldX, 2) + Math.pow(newY - oldY, 2))
  //     let duration = dist * 2.5;
  //     cam.pan(newX + (8 * 4), newY, duration, Phaser.Math.Easing.Linear);
  //   //}
  // })
}