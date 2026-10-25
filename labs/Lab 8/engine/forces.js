import { Vec2 } from './vec2.js';

export class Gravity {
  constructor(g = 9.81) { this.g = g; }
  apply(world) {
    for (const b of world.bodies) {
      if (b.fixed) continue;
      b.force.y -= b.m * this.g;
    }
  }
  potentialEnergy(world) {
    let U = 0;
    for (const b of world.bodies) if (!b.fixed) U += b.m * this.g * b.pos.y;
    return U;
  }
}
export class Spring {
  constructor(body, anchor, k, restLength = 0) {
    this.body = body; this.anchor = anchor;
    this.k = k; this.restLength = restLength;
  }
  apply(world) {
    const d = this.body.pos.sub(this.anchor);
    const L = d.length();
    if (L === 0) return;
    const stretch = L - this.restLength;
    const f = d.mul(-this.k * stretch / L);   // Hooke, along the line
    this.body.force.addTo(f);
  }
  potentialEnergy(world) {
    const stretch = this.body.pos.sub(this.anchor).length() - this.restLength;
    return 0.5 * this.k * stretch * stretch;
  }
}