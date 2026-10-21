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

  // physics (m) -> canvas (px).  Note the MINUS on y: that is the flip.
  toScreenX(x) { return this.originX + x * this.scale; }
  toScreenY(y) { return this.originY - y * this.scale; }

  // canvas (px) -> physics (m).  The inverse, needed for mouse input in Week 10.
  toWorldX(px) { return (px - this.originX) / this.scale; }
  toWorldY(py) { return (this.originY - py) / this.scale; }

  // a length (m) -> a length (px); no origin, no flip
  toScreenLen(L) { return L * this.scale; }
}