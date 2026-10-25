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
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Canvas element with id "sim" was not found.');
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("A 2D canvas context could not be created.");
}

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
if (!(projectileCanvas instanceof HTMLCanvasElement)) {
  throw new Error('Canvas element with id "projectile-sim" was not found.');
}

const integratorSelect = document.getElementById("integrator-select");
if (!(integratorSelect instanceof HTMLSelectElement)) {
  throw new Error('Select element with id "integrator-select" was not found.');
}

const projectileContext = projectileCanvas.getContext("2d");
if (!projectileContext) {
  throw new Error("A 2D canvas context for the projectile could not be created.");
}

const projectileCamera = new Camera(27, 45, 450);
const projectileRenderer = new ProjectileRenderer(projectileContext, projectileCamera);
const gravity = 9.81;
const mass = 1;
const launchSpeed = 20;
const launchAngle = 50 * Math.PI / 180;
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

function resetAnimation() {
  projectileState = resetProjectile();
  trail.length = 0;
  trail.push({ x: 0, y: 0 });
  accumulator = 0;
  render();
}

integratorSelect.addEventListener("change", resetAnimation);

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

function animate(timestamp) {
  const elapsed = previousTime === null ? 0 : (timestamp - previousTime) / 1000;
  const frameTime = Math.min(elapsed, 0.25);
  previousTime = timestamp;
  accumulator += frameTime;

  while (accumulator >= DT) {
    updateProjectile(DT);
    accumulator -= DT;
  }

  render();
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
