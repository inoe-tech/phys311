import { Body } from "./engine/body.js";
import { Drag, MouseSpring, NewtonGravity } from "./engine/forces.js";
import { World } from "./engine/world.js";

const PLANET_COLORS = ["#4cc9f0", "#a78bfa", "#80ed99", "#f9c74f", "#f28482", "#90be6d"];
const VIEW_BOUNDS = { xMin: -16, xMax: 16, yMin: -16, yMax: 16 };
export const GRAVITATIONAL_CONSTANT_AU_YEAR = 4 * Math.PI ** 2;
const EARTH_MASS_SOLAR = 3.003e-6;
const EARTH_RADIUS_AU = 4.26e-5;
const SUN_RADIUS_AU = 0.00465;

export function createScene({
  gravity: gravityStrength = 1,
  restitution = 1,
  drag: dragCoefficient = 0,
  count = 1,
} = {}) {
  const world = new World({ restitution });
  const gravitationalConstant = GRAVITATIONAL_CONSTANT_AU_YEAR * gravityStrength;
  const star = world.add(new Body(0, 0, 0, 0, 1, SUN_RADIUS_AU, {
    color: "#ffd166",
  }));
  star.label = "Star";
  const planets = [];
  const planetCount = Math.max(1, Math.min(12, Math.round(count)));

  for (let i = 0; i < planetCount; i++) {
    const radius = 2.6 + i * 1.05;
    const angle = i * 2.399963229728653;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const orbitalSpeed = Math.sqrt(gravitationalConstant * star.m / radius);
    const planet = world.add(new Body(
      x,
      y,
      -Math.sin(angle) * orbitalSpeed,
      Math.cos(angle) * orbitalSpeed,
      EARTH_MASS_SOLAR,
      EARTH_RADIUS_AU,
      { color: PLANET_COLORS[i % PLANET_COLORS.length] },
    ));
    planet.label = `Planet ${i + 1}`;
    planets.push(planet);
  }

  const momentum = planets.reduce((total, planet) => ({
    x: total.x + planet.m * planet.vel.x,
    y: total.y + planet.m * planet.vel.y,
  }), { x: 0, y: 0 });
  star.vel.set(-momentum.x / star.m, -momentum.y / star.m);

  const gravity = world.addForce(new NewtonGravity(gravitationalConstant, 1e-6));
  const drag = world.addForce(new Drag(dragCoefficient));
  const mouseSpring = world.addForce(new MouseSpring());

  function launch(x, y, vx, vy) {
    const launchMass = EARTH_MASS_SOLAR;
    const body = world.add(new Body(x, y, vx, vy, launchMass, EARTH_RADIUS_AU, {
      color: PLANET_COLORS[(world.bodies.length - 1) % PLANET_COLORS.length],
    }));
    body.label = `Planet ${world.bodies.length - 1}`;
    return body;
  }

  function makeConservative() {
    world.restitution = 1;
    mouseSpring.release();
    mouseSpring.stiffness = 0;
    mouseSpring.damping = 0;
    for (const force of world.forces) {
      if (typeof force.c === "number") force.c = 0;
      if (typeof force.mag === "number") force.mag = 0;
      if (typeof force.friction === "number") force.friction = 0;
    }
  }

  return {
    world,
    bounds: VIEW_BOUNDS,
    gravity,
    drag,
    star,
    planets,
    mouseSpring,
    launch,
    makeConservative,
  };
}
