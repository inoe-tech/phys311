import { Accumulator } from "./engine/accumulator.js";
import { EulerCromer, VelocityVerlet } from "./engine/integrators.js";
import { Camera } from "./render/camera.js";
import { drawHUD } from "./render/hud.js";
import { Renderer } from "./render/renderer.js";
import {
  formatDiagnostics,
  runDiagnostics,
  SCENES,
} from "./scenes/scenes.js";

if (typeof document !== "undefined") {
  const canvas = document.querySelector("#simulation");
  const hud = document.querySelector("#hud");
  const sceneSelect = document.querySelector("#scene");
  const integratorSelect = document.querySelector("#integrator");
  const restitutionInput = document.querySelector("#restitution");
  const restitutionOutput = document.querySelector("#restitution-value");
  const diagnosticsOutput = document.querySelector("#diagnostics");
  const bodyCountSelect = document.querySelector("#body-count");
  const camera = new Camera(1, 0, 0);
  const renderer = new Renderer(canvas, camera);
  const dt = 1 / 240;
  const accumulator = new Accumulator(dt);
  const integrators = { euler: EulerCromer, verlet: VelocityVerlet };
  let world;
  let initialEnergy;
  let previousFrame = null;
  let fps = 0;
  let fpsFrames = 0;
  let fpsElapsed = 0;
  let physicsMs = 0;
  let renderMs = 0;

  for (const [key, scene] of Object.entries(SCENES)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = scene.label;
    sceneSelect.append(option);
  }

  function buildScene() {
    const scene = SCENES[sceneSelect.value];
    world = scene.build(Number(restitutionInput.value), Number(bodyCountSelect.value));
    world.integrator = new integrators[integratorSelect.value]();
    initialEnergy = world.totalEnergy();
    renderer.clearTrails();
    camera.fit(world.viewBounds ?? world.bounds, canvas);
    accumulator.reset();
    diagnosticsOutput.textContent = world.description;
    restitutionInput.disabled = sceneSelect.value !== "ballpit";
    bodyCountSelect.disabled = sceneSelect.value !== "ballpit";
  }

  sceneSelect.addEventListener("change", buildScene);
  integratorSelect.addEventListener("change", buildScene);
  bodyCountSelect.addEventListener("change", buildScene);
  restitutionInput.addEventListener("input", () => {
    restitutionOutput.value = Number(restitutionInput.value).toFixed(2);
    if (sceneSelect.value === "ballpit") {
      world.restitution = Number(restitutionInput.value);
    }
  });
  document.querySelector("#run-diagnostics").addEventListener("click", () => {
    diagnosticsOutput.textContent = "Running 60-second checks...";
    setTimeout(() => {
      try {
        const result = runDiagnostics();
        diagnosticsOutput.textContent = formatDiagnostics(result);
      } catch (error) {
        diagnosticsOutput.textContent = `Diagnostics failed: ${error.message}`;
      }
    }, 0);
  });
  function animate(timestamp) {
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
    renderer.draw(world);
    renderMs = performance.now() - renderStart;
    drawHUD(hud, world, { E0: initialEnergy, fps, physicsMs, renderMs });
    requestAnimationFrame(animate);
  }

  buildScene();
  requestAnimationFrame(animate);
}