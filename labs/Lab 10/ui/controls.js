import { KeyboardInput } from "./keyboard.js";

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
    });
    this.keys = this.keyboard.keys;
    this.setPaused(false);
    this.setSpeed(this.speed);
  }

  togglePlayback() {
    this.setPaused(!this.paused);
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