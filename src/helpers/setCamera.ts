import Character from "../objects/character";

export function setCamera(scene: Phaser.Scene, emitter: Phaser.Events.EventEmitter) {
  // Initialize camera
  let cam = scene.cameras.main;
  cam.setBounds(0,0, (240 * 4) * 2, (160 * 4) * 2);

  // Move camera when screen is dragged
  scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
    if (!p.isDown) return;
    cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
    cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
  });

  // Keep of selected character, pan to character when selected
  let selectedChar: Character = null;
  emitter.on('selectChar', (char: Character) => {
    selectedChar = char;
    if (char !== null) {
      cam.pan(
        selectedChar.x + (8 * 4),
        selectedChar.y, 500,
        Phaser.Math.Easing.Quadratic.InOut
      );
    }
  });

  emitter.on('selectTile', (x: number, y: number) => {
    // Follow selected character to selected tile
    if (selectedChar !== null) {
      let dist = Math.sqrt(Math.pow(x - selectedChar.x, 2) + Math.pow(y - selectedChar.y, 2))
      let duration = dist * 2.5;
      cam.pan(x + (8 * 4), y, duration, Phaser.Math.Easing.Linear);
      selectedChar = null;
    }
    // Normal camera pan to selected tile
    else {
      cam.pan(x + (8 * 4), y, 500, Phaser.Math.Easing.Quadratic.InOut);
    }
  });
}