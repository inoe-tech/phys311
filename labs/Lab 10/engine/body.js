import { Vec2 } from "./vec2.js";

export class Body {
  constructor(x, y, vx = 0, vy = 0, m = 1, radius = 10, { isStatic = false, color } = {}) {
    this.pos = new Vec2(x, y);
    this.vel = new Vec2(isStatic ? 0 : vx, isStatic ? 0 : vy);
    this.acc = new Vec2();
    this.force = new Vec2();
    this.m = m;
    this.radius = radius;
    this.isStatic = isStatic;
    this.color = color;
  }

  get inverseMass() {
    return this.isStatic ? 0 : 1 / this.m;
  }

  kineticEnergy() {
    return 0.5 * this.m * this.vel.lengthSq();
  }

  clearForce() {
    this.force.set(0, 0);
  }
}