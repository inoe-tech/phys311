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

export class Drag {
  constructor(c = 0.1) { this.c = c; }
  apply(world) {
    for (const b of world.bodies) {
      const speed = b.vel.length();
      if (speed > 0) b.force.addScaled(b.vel, -this.c * speed);
    }
  }
  // no potentialEnergy — drag is non-conservative. That's the point.
}

export class NewtonGravity {
  constructor(G = 1, softening = 0.01) { this.G = G; this.eps = softening; }
  apply(world) {
    const bs = world.bodies;
    for (let i = 0; i < bs.length; i++) {
      for (let j = i + 1; j < bs.length; j++) {
        const d = bs[j].pos.sub(bs[i].pos);
        const r2 = d.lengthSq() + this.eps ** 2;
        const F = this.G * bs[i].m * bs[j].m / (r2 * Math.sqrt(r2));
        bs[i].force.addScaled(d,  F);
        bs[j].force.addScaled(d, -F);   // Newton's third law, for free
      }
    }
  }
}