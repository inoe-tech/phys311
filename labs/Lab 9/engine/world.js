import { EulerCromer } from "./integrators.js";
import { resolveCollisions } from "./collisions.js";
import { Vec2 } from "./vec2.js";

export class World {
  constructor({ integrator = new EulerCromer(), bounds = null } = {}) {
    this.bodies = [];
    this.forces = [];
    this.integrator = integrator;
    this.bounds = bounds;       // {xMin, xMax, yMin, yMax} in meters
    this.time = 0;
    this.restitution = 0.9;
  }

  add(body)       { this.bodies.push(body); return body; }
  addForce(force) { this.forces.push(force); return force; }

  step(dt) {
    for (const b of this.bodies) b.clearForce();      // 1. reset
    for (const f of this.forces) f.apply(this);         // 2. accumulate
    this.integrator.step(this, dt);                   // 3. integrate
    resolveCollisions(this);                          // 4. collide
    this.time += dt;                                  // 5. advance clock
  }

  totalEnergy() {
    let E = 0;
    for (const b of this.bodies) E += b.kineticEnergy();
    for (const f of this.forces) E += f.potentialEnergy?.(this) ?? 0;
    return E;
  }

  totalMomentum() {
    const p = new Vec2();
    for (const b of this.bodies) p.addScaled(b.vel, b.m);
    return p;
  }
}