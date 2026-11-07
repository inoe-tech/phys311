export class KeyboardInput {
  constructor(target, actions = {}) {
    this.keys = new Set();
    target.addEventListener("keydown", (event) => {
      const inControl = event.target?.closest?.("button, input, select, textarea");
      if (event.code.startsWith("Arrow")) {
        if (!inControl) this.keys.add(event.code);
        if (!inControl) event.preventDefault();
        return;
      }

      if (event.repeat) return;

      if (event.code === "Space") {
        if (inControl) return;
        event.preventDefault();
        actions.togglePlayback?.();
      } else if (event.code === "KeyR") {
        if (inControl) return;
        event.preventDefault();
        actions.reset?.();
      } else if (event.code === "KeyS") {
        if (inControl) return;
        event.preventDefault();
        actions.step?.();
      } else if (event.code === "KeyI") {
        if (inControl) return;
        event.preventDefault();
        actions.changeSpeed?.(-0.25);
      } else if (event.code === "KeyO") {
        if (inControl) return;
        event.preventDefault();
        actions.changeSpeed?.(0.25);
      } else if (event.code === "KeyE") {
        if (inControl) return;
        event.preventDefault();
        actions.cycleIntegrator?.();
      } else if (
        event.code === "Minus" ||
        event.code === "NumpadSubtract" ||
        event.key === "-" ||
        event.key === "−"
      ) {
        if (inControl) return;
        event.preventDefault();
        actions.zoomOut?.();
      } else if (
        event.code === "Equal" ||
        event.code === "NumpadAdd" ||
        event.key === "+"
      ) {
        if (inControl) return;
        event.preventDefault();
        actions.zoomIn?.();
      }
    });
    target.addEventListener("keyup", (event) => this.keys.delete(event.code));
    target.addEventListener("blur", () => this.keys.clear());
  }
}