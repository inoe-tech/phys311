import { Camera } from "./render/camera.js";
import { ProjectileRenderer, Renderer } from "./render/renderer.js";
import { Vec2 } from "./engine/vec2.js";

const a = new Vec2(3, 4);
const b = new Vec2(1, -2);

console.log("a.add(b)       =", a.add(b));
console.log("a.sub(b)       =", a.sub(b));
console.log("a.mul(2)       =", a.mul(2));
console.log("a.dot(b)       =", a.dot(b));
console.log("a.length()     =", a.length());
console.log("a.lengthSq()   =", a.lengthSq());
console.log("a.normalized() =", a.normalized());
console.log("|normalized|   =", a.normalized().length());

const canvas = document.getElementById("sim");
const ctx = canvas.getContext("2d");
const camera = new Camera(70, 110, canvas.height - 70);
const renderer = new Renderer(ctx, camera);
renderer.draw();

const DT = 1 / 240;
const g = 9.81;

function projectile(method, dt, tEnd, vx0, vy0) {
  let x = 0, y = 0, vx = vx0, vy = vy0, t = 0, n = 0;
  while (t < tEnd - 1e-12) {
    const ax = 0, ay = -g;
    if (method === "euler-cromer") {
      vx += ax * dt;  vy += ay * dt;
      x  += vx * dt;  y  += vy * dt;
    } else {
      x += vx * dt + 0.5 * ax * dt * dt;
      y += vy * dt + 0.5 * ay * dt * dt;
      vx += 0.5 * (ax + 0)  * dt;
      vy += 0.5 * (ay + -g) * dt;
    }
    t += dt;  n++;
  }
  return { x, y, vx, vy, t, n };
}

const v0 = 25, th = 45 * Math.PI / 180;
for (const method of ["euler-cromer", "verlet"]) {
  const result = projectile(method, DT, 2.0, v0 * Math.cos(th), v0 * Math.sin(th));
  console.log(method, JSON.stringify(result, null, 2));
  console.log(`  x  = ${result.x.toFixed(12)}`);
  console.log(`  y  = ${result.y.toFixed(12)}`);
  console.log(`  vy = ${result.vy.toFixed(12)}`);
}

const projectileCanvas = document.getElementById("projectile-sim");
const integratorSelect = document.getElementById("integrator-select");
const timestepSelect = document.getElementById("timestep-select");
const variableTimestepToggle = document.getElementById("variable-timestep");
const headlessButton = document.getElementById("run-headless");
const projectileContext = projectileCanvas.getContext("2d");
const projectileCamera = new Camera(27, 45, 450);
const projectileRenderer = new ProjectileRenderer(projectileContext, projectileCamera);
const gravity = 9.81;
const mass = 1;
const launchSpeed = 20;
const launchAngle = 50 * Math.PI / 180;
const HEADLESS_DT = 1 / 240;
const HEADLESS_STEPS = 480;
const trail = [{ x: 0, y: 0 }];

function resetProjectile() {
  return {
    x: 0,
    y: 0,
    vx: launchSpeed * Math.cos(launchAngle),
    vy: launchSpeed * Math.sin(launchAngle),
    t: 0,
    mass,
    gravity,
  };
}

let projectileState = resetProjectile();

function runHeadlessProjectile(method, dt, steps) {
  const position = new Vec2(0, 0);
  const angle = 45 * Math.PI / 180;
  const velocity = new Vec2(25 * Math.cos(angle), 25 * Math.sin(angle));
  const acceleration = new Vec2(0, -gravity);

  for (let step = 0; step < steps; step += 1) {
    if (method === "euler-cromer") {
      velocity.addScaled(acceleration, dt);
      position.addScaled(velocity, dt);
    } else {
      position.addScaled(velocity, dt);
      position.addScaled(acceleration, 0.5 * dt * dt);
      velocity.addScaled(acceleration, dt);
    }
  }

  const kineticEnergy = 0.5 * mass * velocity.lengthSq();
  const potentialEnergy = mass * gravity * position.y;
  return {
    x: position.x,
    y: position.y,
    vx: velocity.x,
    vy: velocity.y,
    E_total: kineticEnergy + potentialEnergy,
  };
}

function runHeadlessValidation() {
  const simulatedTime = HEADLESS_DT * HEADLESS_STEPS;
  for (const method of ["euler-cromer", "verlet"]) {
    const result = runHeadlessProjectile(method, HEADLESS_DT, HEADLESS_STEPS);
    console.log(
      `${method} final state (${HEADLESS_STEPS} steps, ${simulatedTime} s): ` +
      `x=${result.x.toPrecision(17)}, y=${result.y.toPrecision(17)}, ` +
      `vx=${result.vx.toPrecision(17)}, vy=${result.vy.toPrecision(17)}, ` +
      `E_total=${result.E_total.toPrecision(17)} J`,
    );
  }
}

headlessButton.addEventListener("click", runHeadlessValidation);

function resetAnimation() {
  projectileState = resetProjectile();
  trail.length = 0;
  trail.push({ x: 0, y: 0 });
  accumulator = 0;
  render();
}

integratorSelect.addEventListener("change", resetAnimation);
timestepSelect.addEventListener("change", resetAnimation);

function updateProjectile(dt) {
  if (integratorSelect.value === "euler-cromer") {
    projectileState.vy -= gravity * dt;
    projectileState.x += projectileState.vx * dt;
    projectileState.y += projectileState.vy * dt;
  } else {
    projectileState.x += projectileState.vx * dt;
    projectileState.y += projectileState.vy * dt - 0.5 * gravity * dt * dt;
    projectileState.vy -= gravity * dt;
  }
  projectileState.t += dt;

  if (projectileState.y <= 0) {
    projectileState = resetProjectile();
    trail.length = 0;
    trail.push({ x: 0, y: 0 });
    return;
  }

  trail.push({ x: projectileState.x, y: projectileState.y });
  if (trail.length > 200) trail.shift();
}

function render() {
  projectileRenderer.draw(projectileState, trail);
}

let previousTime = null;
let accumulator = 0;

variableTimestepToggle.addEventListener("change", () => {
  accumulator = 0;
  previousTime = null;
  timestepSelect.disabled = variableTimestepToggle.checked;
});

function animate(timestamp) {
  const elapsed = previousTime === null ? 0 : (timestamp - previousTime) / 1000;
  const frameTime = Math.min(elapsed, 0.25);
  previousTime = timestamp;

  if (variableTimestepToggle.checked) {
    updateProjectile(frameTime);
  } else {
    accumulator += frameTime;
    const graphDt = Number(timestepSelect.value);
    while (accumulator >= graphDt) {
      updateProjectile(graphDt);
      accumulator -= graphDt;
    }
  }

  render();
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
