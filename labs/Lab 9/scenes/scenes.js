import { Body } from "../engine/body.js";
import { EulerCromer, VelocityVerlet } from "../engine/integrators.js";
import { NewtonGravity } from "../engine/forces.js";
import { World } from "../engine/world.js";

const palette = [
  "#ff8200", "#4ec9f5", "#8ad67b", "#f55d8b", "#c792ea",
  "#ffd166", "#6ee7b7", "#fb7185",
];

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildBallPit(restitution = 0.8) {
  const world = new World({
    integrator: new EulerCromer(),
    bounds: { xMin: -10, xMax: 10, yMin: -6, yMax: 6 },
  });
  world.restitution = restitution;

  const rand = random(3119);
  for (let i = 0; i < 20; i++) {
    const column = i % 5;
    const row = Math.floor(i / 5);
    world.add(new Body(
      (column - 2) * 0.9,
      (row - 1.5) * 0.9,
      (rand() - 0.5) * 4.8,
      (rand() - 0.5) * 4.8,
      1,
      0.4,
      { color: palette[i % palette.length] },
    ));
  }
  world.viewBounds = world.bounds;
  world.trailsEnabled = true;
  world.description = "20 equal-mass balls; wall impacts change system momentum.";
  return world;
}

class SoftenedGravity extends NewtonGravity {
  potentialEnergy(world) {
    let potential = 0;
    for (let i = 0; i < world.bodies.length; i++) {
      for (let j = i + 1; j < world.bodies.length; j++) {
        const a = world.bodies[i];
        const b = world.bodies[j];
        const distance = Math.sqrt(a.pos.sub(b.pos).lengthSq() + this.eps ** 2);
        potential -= this.G * a.m * b.m / distance;
      }
    }
    return potential;
  }
}

export function buildNBody() {
  const world = new World({ integrator: new VelocityVerlet() });
  world.restitution = 1;
  const G = 1;
  const softening = 0.01;
  const vx = 0.93240737;
  const vy = 0.86473146;
  world.add(new Body(
    -0.97000436, 0.24308753, vx / 2, vy / 2, 1, 0.045,
    { color: "#4ec9f5" },
  ));
  world.add(new Body(
    0.97000436, -0.24308753, vx / 2, vy / 2, 1, 0.045,
    { color: "#f55d8b" },
  ));
  world.add(new Body(
    0, 0, -vx, -vy, 1, 0.045,
    { color: "#ffd166" },
  ));
  world.addForce(new SoftenedGravity(G, softening));
  world.viewBounds = { xMin: -1.5, xMax: 1.5, yMin: -1.1, yMax: 1.1 };
  world.description = `Equal-mass figure-eight choreography; eps = ${softening}, Verlet default.`;
  world.trailsEnabled = true;
  return world;
}

class SpringNetwork {
  constructor(links, stiffness) {
    this.links = links;
    this.stiffness = stiffness;
  }

  apply() {
    for (const [a, b, restLength] of this.links) {
      const displacement = b.pos.sub(a.pos);
      const length = displacement.length();
      if (length === 0) continue;
      const forceMagnitude = this.stiffness * (length - restLength) / length;
      a.force.addScaled(displacement, forceMagnitude);
      b.force.addScaled(displacement, -forceMagnitude);
    }
  }

  potentialEnergy() {
    let energy = 0;
    for (const [a, b, restLength] of this.links) {
      const stretch = a.pos.sub(b.pos).length() - restLength;
      energy += 0.5 * this.stiffness * stretch ** 2;
    }
    return energy;
  }
}

export function buildSpringNetwork() {
  const world = new World({ integrator: new VelocityVerlet() });
  world.restitution = 1;
  const bodies = [];
  for (let i = 0; i < 5; i++) {
    bodies.push(world.add(new Body(
      i - 2,
      0,
      0,
      0,
      1,
      0.16,
      { color: palette[i] },
    )));
  }
  bodies[2].pos.y = 0.5;

  const links = [];
  for (let i = 0; i < bodies.length - 1; i++) {
    links.push([bodies[i], bodies[i + 1], 1]);
  }
  world.addForce(new SpringNetwork(links, 8));
  world.links = links;
  world.trailsEnabled = true;
  world.viewBounds = { xMin: -3.5, xMax: 3.5, yMin: -2.5, yMax: 2.5 };
  world.description = "Five freely moving masses joined by four conservative springs.";
  return world;
}

function momentumMagnitude(world) {
  return world.totalMomentum().length();
}

function assertFiniteBodies(world, label) {
  for (const body of world.bodies) {
    if (
      !Number.isFinite(body.pos.x) ||
      !Number.isFinite(body.pos.y) ||
      !Number.isFinite(body.vel.x) ||
      !Number.isFinite(body.vel.y)
    ) {
      throw new Error(`${label} produced a non-finite body state.`);
    }
  }
}

export function runDiagnostics() {
  const dt = 1 / 240;
  const steps = Math.round(60 / dt);
  const elastic = buildBallPit(1);
  elastic.bounds = { xMin: -300, xMax: 300, yMin: -300, yMax: 300 };
  const elasticP0Vector = elastic.totalMomentum();
  const p0 = elasticP0Vector.length();
  const e0 = elastic.totalEnergy();
  let estimatedImpacts = 0;
  let maxBallCoordinate = 0;
  for (let step = 0; step < steps; step++) {
    const before = elastic.bodies.map((body) => body.vel.clone());
    elastic.step(dt);
    assertFiniteBodies(elastic, "Elastic billiards");
    let changedBodies = 0;
    for (let i = 0; i < elastic.bodies.length; i++) {
      if (elastic.bodies[i].vel.sub(before[i]).lengthSq() > 1e-16) changedBodies++;
      maxBallCoordinate = Math.max(
        maxBallCoordinate,
        Math.abs(elastic.bodies[i].pos.x),
        Math.abs(elastic.bodies[i].pos.y),
      );
    }
    estimatedImpacts += changedBodies / 2;
  }
  if (maxBallCoordinate >= 299.6) {
    throw new Error("Elastic momentum diagnostic unexpectedly hit a box wall.");
  }
  const elasticP60Vector = elastic.totalMomentum();
  const p60 = elasticP60Vector.length();
  const e60 = elastic.totalEnergy();

  const inelastic = buildBallPit(0.8);
  inelastic.bounds = { xMin: -300, xMax: 300, yMin: -300, yMax: 300 };
  const inelasticP0Vector = inelastic.totalMomentum();
  const inelasticP0 = inelasticP0Vector.length();
  const inelasticE0 = inelastic.totalEnergy();
  const energyTolerance = Math.abs(inelasticE0) * 1e-12;
  let previousEnergy = inelasticE0;
  let monotonic = true;
  for (let step = 0; step < steps; step++) {
    inelastic.step(dt);
    assertFiniteBodies(inelastic, "Inelastic billiards");
    const energy = inelastic.totalEnergy();
    if (energy > previousEnergy + energyTolerance) monotonic = false;
    previousEnergy = energy;
  }
  const inelasticE60 = inelastic.totalEnergy();
  const inelasticP60Vector = inelastic.totalMomentum();
  const inelasticP60 = inelasticP60Vector.length();

  const orbit = buildNBody();
  const orbitE0 = orbit.totalEnergy();
  let minOrbitEnergy = orbitE0;
  let maxOrbitEnergy = orbitE0;
  let maxRadius = 0;
  for (let step = 0; step < steps; step++) {
    orbit.step(dt);
    const energy = orbit.totalEnergy();
    minOrbitEnergy = Math.min(minOrbitEnergy, energy);
    maxOrbitEnergy = Math.max(maxOrbitEnergy, energy);
    for (const body of orbit.bodies) {
      maxRadius = Math.max(maxRadius, body.pos.length());
    }
    assertFiniteBodies(orbit, "N-body gravity");
  }
  if (maxRadius > 20) {
    throw new Error(`N-body orbit escaped its expected range: ${maxRadius.toFixed(3)} m.`);
  }

  const spring = buildSpringNetwork();
  const springE0 = spring.totalEnergy();
  const springP0 = momentumMagnitude(spring);
  let minSpringEnergy = springE0;
  let maxSpringEnergy = springE0;
  for (let step = 0; step < steps; step++) {
    spring.step(dt);
    assertFiniteBodies(spring, "Spring network");
    const energy = spring.totalEnergy();
    minSpringEnergy = Math.min(minSpringEnergy, energy);
    maxSpringEnergy = Math.max(maxSpringEnergy, energy);
  }

  return {
    duration: steps * dt,
    elastic: {
      p0, p60, e0, e60, estimatedImpacts,
      maxBallCoordinate,
      momentumDelta: elasticP60Vector.sub(elasticP0Vector).length(),
      energyDrift: (e60 - e0) / Math.abs(e0),
    },
    inelastic: {
      e0: inelasticE0, e60: inelasticE60,
      fractionalDrift: (inelasticE60 - inelasticE0) / Math.abs(inelasticE0),
      monotonic,
      p0: inelasticP0,
      p60: inelasticP60,
      momentumDelta: inelasticP60Vector.sub(inelasticP0Vector).length(),
    },
    gravity: {
      e0: orbitE0,
      e60: orbit.totalEnergy(),
      minEnergy: minOrbitEnergy,
      maxEnergy: maxOrbitEnergy,
      maxRadius,
    },
    spring: {
      e0: springE0,
      e60: spring.totalEnergy(),
      minEnergy: minSpringEnergy,
      maxEnergy: maxSpringEnergy,
      p0: springP0,
      p60: momentumMagnitude(spring),
    },
  };
}

export function formatDiagnostics(result) {
  const gravityDrift = Math.max(
    Math.abs(result.gravity.minEnergy - result.gravity.e0),
    Math.abs(result.gravity.maxEnergy - result.gravity.e0),
  ) / Math.abs(result.gravity.e0);
  return [
    `e = 1, 20 balls, t=0→60 s, pair impacts ≈ ${result.elastic.estimatedImpacts.toFixed(0)}, max |x,y|=${result.elastic.maxBallCoordinate.toFixed(2)} m (no wall hits):`,
    `  |p| ${result.elastic.p0.toExponential(6)} → ${result.elastic.p60.toExponential(6)}; |Δp|=${result.elastic.momentumDelta.toExponential(3)}`,
    `  E ${result.elastic.e0.toFixed(9)} → ${result.elastic.e60.toFixed(9)} J; fractional drift=${(result.elastic.energyDrift * 100).toExponential(3)}%`,
    `e = 0.8: E ${result.inelastic.e0.toFixed(9)} → ${result.inelastic.e60.toFixed(9)} J; drift=${(result.inelastic.fractionalDrift * 100).toFixed(3)}%; non-increasing to round-off=${result.inelastic.monotonic}; |p| ${result.inelastic.p0.toExponential(6)} → ${result.inelastic.p60.toExponential(6)}; |Δp|=${result.inelastic.momentumDelta.toExponential(3)}`,
    `Gravity (Verlet): E ${result.gravity.e0.toFixed(9)} → ${result.gravity.e60.toFixed(9)} J; range [${result.gravity.minEnergy.toFixed(9)}, ${result.gravity.maxEnergy.toFixed(9)}]; max |ΔE/E0|=${(gravityDrift * 100).toExponential(3)}%; max radius=${result.gravity.maxRadius.toFixed(3)} m`,
    `Springs (Verlet): E ${result.spring.e0.toFixed(9)} → ${result.spring.e60.toFixed(9)} J; range [${result.spring.minEnergy.toFixed(9)}, ${result.spring.maxEnergy.toFixed(9)}]; |p| ${result.spring.p0.toExponential(3)} → ${result.spring.p60.toExponential(3)}`,
    `All runs: ${result.duration.toFixed(2)} simulated seconds.`,
  ].join("\n");
}

export const SCENES = {
  ballpit: { label: "Billiards / ball pit", build: buildBallPit },
  gravity: { label: "Softened gravitational N-body", build: buildNBody },
  springs: { label: "Spring network", build: buildSpringNetwork },
};