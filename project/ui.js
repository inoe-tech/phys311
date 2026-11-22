import { KeyboardInput } from "./input.js";

export class SimulationControls {
  constructor({
    playButton,
    stepButton,
    resetButton,
    speedInput,
    speedOutput,
    zoomInButton,
    zoomOutButton,
    integratorSelect,
    physicsSliders,
  }, actions) {
    this.playButton = playButton;
    this.stepButton = stepButton;
    this.speedInput = speedInput;
    this.speedOutput = speedOutput;
    this.integratorSelect = integratorSelect;
    this.actions = actions;
    this.paused = false;
    this.speed = parseFloat(speedInput.value);
    this.physicsSliders = physicsSliders;
    this.physicsUpdates = {};

    playButton.addEventListener("click", () => this.togglePlayback());
    stepButton.addEventListener("click", () => this.step());
    resetButton.addEventListener("click", () => this.reset());
    zoomInButton.addEventListener("click", () => actions.zoomIn());
    zoomOutButton.addEventListener("click", () => actions.zoomOut());
    speedInput.addEventListener("input", () => this.setSpeed(parseFloat(speedInput.value)));
    integratorSelect.addEventListener("change", () => {
      actions.setIntegrator(integratorSelect.value);
    });
    this.physicsValues = {};
    for (const [name, { input, output, digits, unit = "" }] of Object.entries(physicsSliders)) {
      const update = () => {
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        const value = Math.max(min, Math.min(max, parseFloat(input.value)));
        input.value = String(value);
        this.physicsValues[name] = value;
        output.textContent = `${value.toFixed(digits)}${unit}`;
        actions.setParameter(name, value);
      };
      this.physicsUpdates[name] = update;
      input.addEventListener("input", update);
      update();
    }

    this.keyboard = new KeyboardInput(window, {
      togglePlayback: () => this.togglePlayback(),
      step: () => this.step(),
      reset: () => this.reset(),
      zoomIn: () => actions.zoomIn(),
      zoomOut: () => actions.zoomOut(),
      changeSpeed: (amount) => this.setSpeed(this.speed + amount),
      cycleIntegrator: () => this.cycleIntegrator(),
      toggleDebug: () => actions.toggleDebug?.(),
      makeConservative: () => this.makeConservative(),
      selectPrevious: () => actions.selectPrevious?.(),
      selectNext: () => actions.selectNext?.(),
    });
    this.keys = this.keyboard.keys;
    this.setPaused(false);
    this.setSpeed(this.speed);
  }

  togglePlayback() {
    this.setPaused(!this.paused);
  }

  makeConservative() {
    this.setPhysicsParameter("drag", 0);
    this.setPhysicsParameter("restitution", 1);
    this.actions.makeConservative?.();
  }

  setPhysicsParameter(name, value) {
    const slider = this.physicsSliders[name];
    const update = this.physicsUpdates[name];
    if (!slider || !update) return;
    slider.input.value = String(value);
    update();
  }

  step() {
    if (this.paused) this.actions.step();
  }

  reset() {
    this.keys.clear();
    this.actions.reset();
  }

  setPaused(paused) {
    this.paused = paused;
    this.playButton.textContent = paused ? "Resume" : "Pause";
    this.playButton.setAttribute("aria-pressed", String(!paused));
    this.stepButton.disabled = !paused;
  }

  setSpeed(speed) {
    this.speed = Math.max(0.25, Math.min(2, speed));
    this.speedInput.value = String(this.speed);
    const label = `${this.speed.toFixed(2)}×`;
    this.speedOutput.value = label;
    this.speedOutput.textContent = label;
  }

  cycleIntegrator() {
    const options = this.integratorSelect.options;
    this.integratorSelect.selectedIndex = (this.integratorSelect.selectedIndex + 1) % options.length;
    this.actions.setIntegrator(this.integratorSelect.value);
  }
}

export class VisualControls {
  constructor(renderer, controls) {
    const options = [
      ["trails", "showTrails"],
      ["velocity-vectors", "showVelocityVectors"],
      ["force-vectors", "showForceVectors"],
      ["selected-highlight", "showSelectedHighlight"],
    ];

    for (const [id, property] of options) {
      const input = controls.querySelector(`#${id}`);
      renderer[property] = input.checked;
      input.addEventListener("change", () => {
        renderer[property] = input.checked;
        if (property === "showTrails" && !input.checked) renderer.clearTrails();
      });
    }
  }
}

export class PlanetSelectionControls {
  constructor({ renderer }) {
    this.renderer = renderer;
    this.periodText = "";
    this.world = null;
    this.star = null;
    this.selectedBody = null;
  }

  setWorld(world, star) {
    this.world = world;
    this.star = star;
    this.select(this.bodies[0] ?? null);
  }

  get bodies() {
    return this.world?.bodies.filter((body) => body !== this.star) ?? [];
  }

  select(body) {
    if (body && (body === this.star || !this.bodies.includes(body))) return;
    this.selectedBody = body;
    this.renderer.selectedBody = body;
    this.updateOrbitalPeriod();
  }

  selectPrevious() {
    this.selectAdjacent(-1);
  }

  selectNext() {
    this.selectAdjacent(1);
  }

  selectAdjacent(direction) {
    const bodies = this.bodies;
    if (bodies.length === 0) return;
    const index = bodies.indexOf(this.selectedBody);
    this.select(bodies[(index + direction + bodies.length) % bodies.length]);
  }

  updateOrbitalPeriod() {
    const body = this.selectedBody;
    if (!body || !this.star) {
      this.periodText = "";
      return;
    }
    const gravity = this.world.forces.find((force) => Number.isFinite(force.G));
    if (!gravity || gravity.G <= 0) {
      this.periodText = "Orbital period unavailable";
      return;
    }

    const dx = body.pos.x - this.star.pos.x;
    const dy = body.pos.y - this.star.pos.y;
    const distanceSquared = dx * dx + dy * dy;
    const gravitationalParameter = gravity.G * (this.star.m + body.m);
    const period = 2 * Math.PI * Math.sqrt(
      (distanceSquared + (gravity.eps ?? 0) ** 2) ** 1.5 /
      gravitationalParameter,
    );
    this.periodText = `${period.toFixed(2)} seconds`;
  }
}

export class OrbitControls {
  constructor({ countInput, countOutput, spawnInput }, { setBodyCount }) {
    this.spawnInput = spawnInput;
    const updateCount = () => {
      const min = parseFloat(countInput.min);
      const max = parseFloat(countInput.max);
      const count = Math.max(min, Math.min(max, parseFloat(countInput.value)));
      countInput.value = String(count);
      countOutput.value = String(count);
      countOutput.textContent = String(count);
      setBodyCount(count);
    };
    countInput.addEventListener("input", updateCount);
    updateCount();
  }

  get spawnEnabled() {
    return this.spawnInput.checked;
  }
}
