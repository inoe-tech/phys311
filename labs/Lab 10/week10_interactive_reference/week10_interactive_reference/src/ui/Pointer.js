// Pointer.js — converts pixels to world coordinates and drives the
// engine's PointerSpring. Works for mouse, touch and stylus via Pointer Events,
// so there is exactly ONE code path instead of three.
export class PointerInput {
  constructor(canvas, camera, world, spring, { onSpawn = null } = {}) {
    this.canvas = canvas; this.cam = camera;
    this.world = world; this.spring = spring;
    this.onSpawn = onSpawn;
    this.spawnMode = false;
    this._bind();
  }

  _world(ev) {
    const r = this.canvas.getBoundingClientRect();
    return this.cam.toWorld(ev.clientX - r.left, ev.clientY - r.top);
  }

  _bind() {
    const c = this.canvas;
    // touch-action:none in the CSS stops the browser scrolling the page
    // out from under a drag on a phone.
    c.addEventListener('pointerdown', (ev) => {
      c.setPointerCapture(ev.pointerId);   // keep events coming if the finger
      const [x, y] = this._world(ev);      // leaves the canvas mid-drag
      if (this.spawnMode) { this.onSpawn && this.onSpawn(x, y); return; }
      const b = this.world.pick(x, y, 0.15);
      if (b) { this.spring.grab(b, x, y); c.classList.add('grabbing'); }
    });
    c.addEventListener('pointermove', (ev) => {
      const [x, y] = this._world(ev);
      if (this.spring.active) this.spring.moveTo(x, y);
      else c.style.cursor = this.world.pick(x, y, 0.15) ? 'grab' : 'crosshair';
    });
    const end = (ev) => {
      if (this.spring.active) { this.spring.release(); c.classList.remove('grabbing'); }
      if (c.hasPointerCapture?.(ev.pointerId)) c.releasePointerCapture(ev.pointerId);
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    // Releasing outside the window must not leave a body stuck to a ghost finger.
    window.addEventListener('blur', () => this.spring.release());
  }
}
