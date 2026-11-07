import { Vec2 } from './vec2.js';

export class Gravity {
  constructor(g = 9.81) { this.g = g; }
  apply(world) {
    for (const b of world.bodies) {
      if (b.isStatic) continue;
      b.force.y -= b.m * this.g;
    }
  }
  potentialEnergy(world) {
    let U = 0;
    for (const b of world.bodies) if (!b.isStatic) U += b.m * this.g * b.pos.y;
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

export class MouseSpring {
  constructor(stiffness = 80, damping = 14) {
    this.stiffness = stiffness;
    this.damping = damping;
    this.body = null;
    this.target = new Vec2();
  }

  grab(body, x, y) {
    if (body.isStatic) return;
    this.body = body;
    this.target.set(x, y);
  }

  moveTo(x, y) {
    this.target.set(x, y);
  }

  release() {
    this.body = null;
  }

  apply(world) {
    if (!this.body || this.body.isStatic) return;
    const displacement = this.target.sub(this.body.pos);
    if (displacement.lengthSq() > 0 || this.body.vel.lengthSq() > 0) {
      world.externalForceApplied = true;
    }
    this.body.force.addScaled(displacement, this.stiffness);
    this.body.force.addScaled(this.body.vel, -this.damping);
  }
}

export class Drag {
  constructor(c = 0.1) { this.c = c; }
  apply(world) {
    if (this.c > 0 && world.bodies.some((body) => body.vel.lengthSq() > 0)) {
      world.externalForceApplied = true;
    }
    for (const b of world.bodies) {
      const speed = b.vel.length();
      if (speed > 0) b.force.addScaled(b.vel, -this.c * speed);
    }
  }
  // no potentialEnergy — drag is non-conservative. That's the point.
}

export class ThrustForce {
  constructor(body, keys, magnitude) {
    this.body = body;
    this.keys = keys;
    this.mag = magnitude;
  }

  apply(world) {
    if (this.body.isStatic) return;
    const thrusting = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]
      .some((key) => this.keys.has(key));
    if (thrusting) world.externalForceApplied = true;
    if (this.keys.has("ArrowUp")) this.body.force.y += this.mag;
    if (this.keys.has("ArrowLeft")) this.body.force.x -= this.mag;
    if (this.keys.has("ArrowRight")) this.body.force.x += this.mag;
    if (this.keys.has("ArrowDown")) this.body.force.y -= this.mag;
  }
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
  potentialEnergy(world) {
    let energy = 0;
    const bodies = world.bodies;
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const distanceSq = bodies[j].pos.sub(bodies[i].pos).lengthSq() + this.eps ** 2;
        energy -= this.G * bodies[i].m * bodies[j].m / Math.sqrt(distanceSq);
      }
    }
    return energy;
  }
}