export class Camera {
  /**
   * @param {number} scale  pixels per meter
   * @param {number} originX  canvas x-pixel of physics x = 0
   * @param {number} originY  canvas y-pixel of physics y = 0
   */
  constructor(scale, originX, originY) {
    this.scale = scale;
    this.originX = originX;
    this.originY = originY;
  }

  fit(bounds, canvas, padding = 30) {
    const width = bounds.xMax - bounds.xMin;
    const height = bounds.yMax - bounds.yMin;
    this.scale = Math.min(
      (canvas.width - 2 * padding) / width,
      (canvas.height - 2 * padding) / height,
    );
    this.originX = canvas.width / 2 - (bounds.xMin + bounds.xMax) * this.scale / 2;
    this.originY = canvas.height / 2 + (bounds.yMin + bounds.yMax) * this.scale / 2;
  }

  // physics (m) -> canvas (px).  Note the MINUS on y: that is the flip.
  toScreenX(x) { return this.originX + x * this.scale; }
  toScreenY(y) { return this.originY - y * this.scale; }
  toScreen(pos) { return { x: this.toScreenX(pos.x), y: this.toScreenY(pos.y) }; }

  // canvas (px) -> physics (m).  The inverse, needed for mouse input in Week 10.
  toWorldX(px) { return (px - this.originX) / this.scale; }
  toWorldY(py) { return (this.originY - py) / this.scale; }
  toWorld(px, py) { return { x: this.toWorldX(px), y: this.toWorldY(py) }; }

  // a length (m) -> a length (px); no origin, no flip
  toScreenLen(L) { return L * this.scale; }
}