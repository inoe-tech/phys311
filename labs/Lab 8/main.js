import { Camera } from "./render/camera.js";
import { Renderer } from "./render/renderer.js";
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
