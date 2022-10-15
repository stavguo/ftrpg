export function setCamera(scene: Phaser.Scene) {
  let cam = scene.cameras.main;
  cam.setBounds(0,0, (240 * 4) * 2, (160 * 4) * 2);
  scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
    if (!p.isDown) return;
    cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
    cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
  });
  scene.input.on('pointerup', () => {
    cam.scrollX = Phaser.Math.Snap.To(cam.scrollX, 16 * 4);
    cam.scrollY = Phaser.Math.Snap.To(cam.scrollY, 16 * 4);
  }, this);
}