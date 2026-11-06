export function eventToWorld(event, canvas, camera) {
  const rect = canvas.getBoundingClientRect();

  const px = (event.clientX - rect.left) * (canvas.width / rect.width);
  const py = (event.clientY - rect.top) * (canvas.height / rect.height);

  return camera.toWorld(px, py);
}

export class PointerInput {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.camera = camera;
    this.worldPosition = null;

    canvas.addEventListener("pointermove", (event) => this.update(event));
    canvas.addEventListener("pointerdown", (event) => {
      this.update(event);
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointerup", (event) => {
      this.update(event);
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    });
    canvas.addEventListener("pointercancel", () => {
      this.worldPosition = null;
    });
    canvas.addEventListener("pointerleave", () => {
      this.worldPosition = null;
    });
  }

  update(event) {
    this.worldPosition = eventToWorld(event, this.canvas, this.camera);
  }
}