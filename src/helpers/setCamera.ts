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

  // Keep track of state variables for camera
  let charSelected: boolean = false;
  emitter.on('charSelect', (selected: boolean) => {
    (selected) ? charSelected = true : charSelected = false;
  });

  // Move camera when any tiles in double clicked
  emitter.on('centerOn', (x: number, y: number) => {
    if (charSelected) return;
    cam.pan(x + (8 * 4), y, 500, Phaser.Math.Easing.Quadratic.InOut);
  });

  // Move camera to follow character
  emitter.on('moveChar', (x: number, y: number, duration: number) => {
    cam.pan(x + (8 * 4), y, duration, Phaser.Math.Easing.Linear);
  });
}