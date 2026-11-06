const PREVENT_DEFAULT_CODES = new Set([
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

export class KeyboardInput {
  constructor(target) {
    this.keys = new Set();
    target.addEventListener("keydown", (event) => {
      this.keys.add(event.code);
      if (PREVENT_DEFAULT_CODES.has(event.code)) event.preventDefault();
    });
    target.addEventListener("keyup", (event) => this.keys.delete(event.code));
    target.addEventListener("blur", () => this.keys.clear());
  }
}