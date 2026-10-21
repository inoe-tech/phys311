export class EulerCromer {
  step(world, dt) {
    for (const b of world.bodies) {
      if (b.fixed) continue;
      b.acc.set(b.force.x * b.invMass, b.force.y * b.invMass);
      b.vel.addScaled(b.acc, dt);     // velocity FIRST
      b.pos.addScaled(b.vel, dt);     // then position, with the NEW velocity
    }
  }
}

export class VelocityVerlet {
  step(world, dt) {
    // 1. half-kick + drift, using the acceleration already stored on the body
    for (const b of world.bodies) {
      if (b.fixed) continue;
      b.pos.x += b.vel.x * dt + 0.5 * b.acc.x * dt * dt;
      b.pos.y += b.vel.y * dt + 0.5 * b.acc.y * dt * dt;
    }
        // 2. recompute forces at the NEW positions
    world.clearForces();
    world.applyForces();
    // 3. finish the velocity with the average of old and new acceleration
    for (const b of world.bodies) {
      if (b.fixed) continue;
      const axNew = b.force.x * b.invMass;
      const ayNew = b.force.y * b.invMass;
      b.vel.x += 0.5 * (b.acc.x + axNew) * dt;
      b.vel.y += 0.5 * (b.acc.y + ayNew) * dt;
      b.acc.set(axNew, ayNew);        // carry it forward — this is the trick
    }
  }
}