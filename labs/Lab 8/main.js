import { Vec2 } from "./engine/vec2.js";

const a = new Vec2(3, 4);
const b = new Vec2(1, -2);

console.log("a.add(b)       =", a.add(b));              // Vec2 {x: 4, y: 2}
console.log("a.sub(b)       =", a.sub(b));              // Vec2 {x: 2, y: 6}
console.log("a.mul(2)       =", a.mul(2));              // Vec2 {x: 6, y: 8}
console.log("a.dot(b)       =", a.dot(b));              // -5
console.log("a.length()     =", a.length());            // 5
console.log("a.lengthSq()   =", a.lengthSq());          // 25
console.log("a.normalized() =", a.normalized());        // Vec2 {x: 0.6, y: 0.8}
console.log("|normalized|   =", a.normalized().length());// 1

const canvas = document.getElementById("sim");
const ctx = canvas.getContext("2d");

// 20 px per metre, origin 50 px from the left, 50 px up from the bottom
const cam = new Camera(20, 50, canvas.height - 50);

// draw a 0.3 m-radius ball at physics position (2, 3)
ctx.beginPath();
ctx.arc(cam.toScreenX(2), cam.toScreenY(3), cam.toScreenLen(0.3), 0, Math.PI * 2);
ctx.fillStyle = "#ff8200";
ctx.fill();

const DT = 1 / 240;          // physics timestep, seconds — never changes
const MAX_FRAME = 0.25;      // clamp: never try to catch up more than 0.25 s

let accumulator = 0;
let lastTime = performance.now() / 1000;

function frame(nowMs) {
  const now = nowMs / 1000;
  let frameTime = now - lastTime;
  lastTime = now;

  // THE CLAMP. Without it, a tab-switch hands you frameTime = 30 s,
  // you try 7200 physics steps in one frame, and the page locks up.
  if (frameTime > MAX_FRAME) frameTime = MAX_FRAME;

  accumulator += frameTime;
  while (accumulator >= DT) {
    world.step(DT);          // always the SAME dt
    accumulator -= DT;
  }

  renderer.draw(world);      // draw once per frame, however many steps ran
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);