import { Accumulator } from "./engine/accumulator.js";
import { Euler, EulerCromer, VelocityVerlet } from "./engine/integrators.js";
import { Camera } from "./render/camera.js";
import { drawHUD, drawKeplerPlot } from "./render/hud.js";
import { Renderer } from "./render/renderer.js";
import { createScene, GRAVITATIONAL_CONSTANT_AU_YEAR } from "./scene.js";
import { PointerInput } from "./input.js";
import {
  OrbitControls,
  PlanetSelectionControls,
  SimulationControls,
  VisualControls,
} from "./ui.js";

const canvas = document.querySelector("#simulation");
const hud = document.querySelector("#hud");
const debugStatus = document.querySelector("#debug-status");
const keplerPlot = document.querySelector("#kepler-plot");
const integratorSelect = document.querySelector("#integrator");
const camera = new Camera(1, 0, 0);
const renderer = new Renderer(canvas, camera);
new VisualControls(renderer, document.querySelector(".visual-controls"));
const accumulator = new Accumulator(1 / 240);
const SIMULATION_YEARS_PER_REAL_SECOND = 1;
const integrators = {
  "euler-cromer": EulerCromer,
  verlet: VelocityVerlet,
  euler: Euler,
};
let world;
let initialEnergy;
let bounds;
let gravity;
let drag;
let scene;
let pointer;
let bodyCount = parseFloat(document.querySelector("#body-count").value);
let orbitControls;
let debugMode = new URLSearchParams(window.location.search).get("debug") === "0";
const selectionControls = new PlanetSelectionControls({ renderer });

function setDebugMode(enabled) {
  debugMode = enabled;
  debugStatus.hidden = !enabled;
}

setDebugMode(debugMode);

const physicsSliders = {
  gravity: {
    input: document.querySelector("#gravity"),
    output: document.querySelector("#gravity-value"),
    digits: 2,
    unit: "",
  },
  restitution: {
    input: document.querySelector("#restitution"),
    output: document.querySelector("#restitution-value"),
    digits: 2,
  },
  drag: {
    input: document.querySelector("#drag"),
    output: document.querySelector("#drag-value"),
    digits: 2,
  },
};

function buildScene() {
  scene = createScene({
    gravity: parseFloat(physicsSliders.gravity.input.value),
    restitution: parseFloat(physicsSliders.restitution.input.value),
    drag: parseFloat(physicsSliders.drag.input.value),
    count: bodyCount,
  });
  world = scene.world;
  bounds = scene.bounds;
  gravity = scene.gravity;
  drag = scene.drag;
  selectionControls.setWorld(world, scene.star);
  world.integrator = new integrators[integratorSelect.value]();
  initialEnergy = world.totalEnergy();
  renderer.resize(bounds);
  renderer.clearTrails();
  accumulator.reset();
  pointer?.setWorld(world, scene.mouseSpring);
}

const controls = new SimulationControls({
  playButton: document.querySelector("#play-pause"),
  stepButton: document.querySelector("#step"),
  resetButton: document.querySelector("#reset"),
  speedInput: document.querySelector("#speed"),
  speedOutput: document.querySelector("#speed-value"),
  zoomInButton: document.querySelector("#zoom-in"),
  zoomOutButton: document.querySelector("#zoom-out"),
  integratorSelect,
  physicsSliders,
}, {
  step() {
    world.step(accumulator.DT);
    accumulator.reset();
  },
  reset: buildScene,
  setIntegrator(value) {
    const Integrator = integrators[value];
    if (Integrator) world.integrator = new Integrator();
  },
  setParameter(name, value) {
    if (!world) return;
    if (name === "gravity") {
      gravity.G = GRAVITATIONAL_CONSTANT_AU_YEAR * value;
      world.externalForceApplied = true;
    } else if (name === "restitution") {
      world.restitution = value;
    } else if (name === "drag") {
      drag.c = value;
    }
  },
  makeConservative() {
    scene.makeConservative();
  },
  zoomIn() {
    camera.zoom(1.2, canvas);
  },
  zoomOut() {
    camera.zoom(1 / 1.2, canvas);
  },
  selectPrevious() {
    selectionControls.selectPrevious();
  },
  selectNext() {
    selectionControls.selectNext();
  },
  toggleDebug() {
    setDebugMode(!debugMode);
  },
});
orbitControls = new OrbitControls({
  countInput: document.querySelector("#body-count"),
  countOutput: document.querySelector("#body-count-value"),
  spawnInput: document.querySelector("#spawn-enabled"),
}, {
  setBodyCount(count) {
    bodyCount = count;
    if (world) buildScene();
  },
});
buildScene();
pointer = new PointerInput(
  canvas,
  camera,
  world,
  scene.mouseSpring,
  (start, velocity) => {
    const body = scene.launch(start.x, start.y, velocity.x, velocity.y);
    world.externalForceApplied = true;
    return body;
  },
  () => orbitControls.spawnEnabled,
  (body) => selectionControls.select(body),
);
function resizeCanvas() {
  renderer.resize(bounds);
}
window.addEventListener("resize", resizeCanvas);
const resizeObserver = new ResizeObserver(resizeCanvas);
resizeObserver.observe(canvas.parentElement);

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
  if (controls.paused) {
    accumulator.lastMs = timestamp;
  } else {
    accumulator.advance(
      timestamp,
      (step) => world.step(step),
      controls.speed * SIMULATION_YEARS_PER_REAL_SECOND,
    );
  }
  selectionControls.updateOrbitalPeriod();
  physicsMs = performance.now() - physicsStart;

  const renderStart = performance.now();
  renderer.recordTrails(world);
  renderer.draw(world, {
    pointerWorld: pointer.worldPosition,
    trajectory: pointer.getTrajectory(accumulator.DT),
    slingshot: pointer.slingshot,
    heldBody: pointer.heldBody,
  });
  renderMs = performance.now() - renderStart;
  drawHUD(hud, world, {
    E0: initialEnergy,
    fps,
    physicsMs,
    renderMs,
    pointerWorld: pointer.worldPosition,
    timeStep: accumulator.DT,
    selectedBody: selectionControls.selectedBody,
    orbitalPeriod: selectionControls.periodText,
    debug: debugMode,
  });
  drawKeplerPlot(keplerPlot, world, scene.star, selectionControls.selectedBody);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);