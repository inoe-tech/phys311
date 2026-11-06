import { Accumulator } from "./engine/accumulator.js";
import { Camera } from "./render/camera.js";
import { drawHUD } from "./render/hud.js";
import { Renderer } from "./render/renderer.js";
import { createScene } from "./scene.js";
import { KeyboardInput } from "./ui/keyboard.js";
import { PointerInput } from "./ui/pointer.js";

const canvas = document.querySelector("#simulation");
const hud = document.querySelector("#hud");
const camera = new Camera(1, 0, 0);
const renderer = new Renderer(canvas, camera);
const accumulator = new Accumulator(1 / 240);
const keyboard = new KeyboardInput(window);
const { world, bounds } = createScene(keyboard.keys);
const pointer = new PointerInput(canvas, camera);

camera.fit(bounds, canvas);
window.addEventListener("resize", () => camera.fit(bounds, canvas));

let fps = 0;
let fpsFrames = 0;
let fpsElapsed = 0;
let previousFrame = null;
let physicsMs = 0;
let renderMs = 0;

function frame(timestamp) {
  if (previousFrame !== null) {
    fpsFrames++;
    fpsElapsed += timestamp - previousFrame;
    if (fpsElapsed >= 500) {
      fps = fpsFrames * 1000 / fpsElapsed;
      fpsFrames = 0;
      fpsElapsed = 0;
    }
  }
  previousFrame = timestamp;

  const physicsStart = performance.now();
  accumulator.advance(timestamp, (step) => world.step(step));
  physicsMs = performance.now() - physicsStart;

  const renderStart = performance.now();
  renderer.recordTrails(world);
  renderer.draw(world, { pointerWorld: pointer.worldPosition });
  renderMs = performance.now() - renderStart;
  drawHUD(hud, world, {
    E0: initialEnergy,
    fps,
    physicsMs,
    renderMs,
    pointerWorld: pointer.worldPosition,
  });
  requestAnimationFrame(frame);
}

const initialEnergy = world.totalEnergy();
requestAnimationFrame(frame);