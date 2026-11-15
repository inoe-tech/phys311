import { Body } from "./engine/body.js";
import { Drag, MouseSpring, NewtonGravity } from "./engine/forces.js";
import { World } from "./engine/world.js";

const PLANET_COLORS = ["#4cc9f0", "#a78bfa", "#80ed99", "#f9c74f", "#f28482", "#90be6d"];
const VIEW_BOUNDS = { xMin: -16, xMax: 16, yMin: -16, yMax: 16 };

export function createScene({
  gravity: gravitationalConstant = 1,
  restitution = 1,
  drag: dragCoefficient = 0,
  count = 6,
} = {}) {
  const world = new World({ restitution });
  const star = world.add(new Body(0, 0, 0, 0, 500, 0.62, {
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
      1,
      0.16,
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

  const gravity = world.addForce(new NewtonGravity(gravitationalConstant, 0.01));
  const drag = world.addForce(new Drag(dragCoefficient));
  const mouseSpring = world.addForce(new MouseSpring());

  function launch(x, y, vx, vy) {
    const launchMass = world.bodies.find((body) => body !== star)?.m ?? 1;
    const body = world.add(new Body(x, y, vx, vy, launchMass, 0.16, {
      color: PLANET_COLORS[(world.bodies.length - 1) % PLANET_COLORS.length],
    }));
    body.label = `Body ${world.bodies.length}`;
    return body;
  }

  return { world, bounds: VIEW_BOUNDS, gravity, drag, star, planets, mouseSpring, launch };
}
