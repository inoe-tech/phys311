import { Body } from "../engine/body.js";
import { NewtonGravity } from "../engine/forces.js";
import { VelocityVerlet } from "../engine/integrators.js";
import { World } from "../engine/world.js";

const canvas = document.querySelector("#system");
const context = canvas?.getContext("2d");
const periodButton = document.querySelector("#period");

if (!canvas || !context || !periodButton) {
  throw new Error("The orbital period spike is missing a required element.");
}

const G = 6.6743e-11;
const SOFTENING = 0.01;
const STAR_MASS = 1.989e30;
const PLANET_MASS = 5.972e24;
const ORBIT_RADIUS = 1.496e11;
const TIME_STEP = 3600;
const STEPS_PER_FRAME = 24;
const SIMULATION_RATE = TIME_STEP * STEPS_PER_FRAME * 60;
const TWO_PI = 2 * Math.PI;
const BODY_COLOR = "#526174";

const world = new World({ integrator: new VelocityVerlet(), restitution: 1 });
const star = world.add(new Body(0, 0, 0, 0, STAR_MASS, 6.96e8, {
  isStatic: true,
  color: BODY_COLOR,
}));
const orbitalSpeed = Math.sqrt(
  G * STAR_MASS * ORBIT_RADIUS ** 2 /
  (ORBIT_RADIUS ** 2 + SOFTENING ** 2) ** 1.5,
);
const planet = world.add(new Body(
  ORBIT_RADIUS, 0, 0, orbitalSpeed, PLANET_MASS, 6.37e6,
  { color: BODY_COLOR },
));
world.addForce(new NewtonGravity(G, SOFTENING));

let simulationAccumulator = 0;
let previousFrameTime = null;
let measurementStartTimestamp = 0;

function draw() {
  const width = canvas.width;
  const height = canvas.height;
  const scale = Math.min(width, height) * 0.38 / (2 * ORBIT_RADIUS);
  const centerX = width / 2;
  const centerY = height / 2;
  const screenPosition = (body) => ({
    x: centerX + body.pos.x * scale,
    y: centerY - body.pos.y * scale,
  });

  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = BODY_COLOR;
  const starPosition = screenPosition(star);
  context.beginPath();
  context.arc(starPosition.x, starPosition.y, 7, 0, TWO_PI);
  context.fill();

  const planetPosition = screenPosition(planet);
  context.beginPath();
  context.arc(planetPosition.x, planetPosition.y, 7, 0, TWO_PI);
  context.fill();
}

function animate(timestamp) {
  if (previousFrameTime !== null) {
    simulationAccumulator +=
      ((timestamp - previousFrameTime) / 1000) * SIMULATION_RATE;
    while (simulationAccumulator >= TIME_STEP) {
      world.step(TIME_STEP);
      simulationAccumulator -= TIME_STEP;
    }
  }
  previousFrameTime = timestamp;
  draw();
  requestAnimationFrame(animate);
}

periodButton.addEventListener("click", () => {
  const simulatedPeriod = TWO_PI * Math.sqrt(
    (ORBIT_RADIUS ** 2 + SOFTENING ** 2) ** 1.5 / (G * STAR_MASS),
  );
  const visiblePeriod = simulatedPeriod / SIMULATION_RATE;
  periodButton.textContent = `Orbital period: ${visiblePeriod.toFixed(2)} seconds`;
});

requestAnimationFrame(animate);