import { Vec2 } from './vec2.js';
class Body {
    constructor(x, y, vx, vy, m = 1, radius = 10) {
    this.pos = new Vec2(x, y);
    this.vel = new Vec2(vx, vy);
    this.acc = new Vec2(0, 0);
    this.force = new Vec2(0, 0);
    this.m = m;
    this.radius = radius;
  }

  kineticEnergy() {
    return 0.5 * this.m * this.vel.lengthSq();
  }

  clearForce() {
    this.force.set(0, 0);
  }
}