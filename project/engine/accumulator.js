export class Accumulator {
  constructor(dt = 1 / 240, maxFrame = 0.25) {
    this.DT = dt;
    this.maxFrame = maxFrame;
    this.acc = 0;
    this.lastMs = null;
  }

  reset() {
    this.acc = 0;
    this.lastMs = null;
  }

  advance(nowMs, step, speed = 1) {
    if (this.lastMs === null) {
      this.lastMs = nowMs;
      return;
    }

    const elapsed = Math.max(0, (nowMs - this.lastMs) / 1000);
    this.lastMs = nowMs;
    this.acc += Math.min(elapsed, this.maxFrame) * speed;
    while (this.acc >= this.DT) {
      step(this.DT);
      this.acc -= this.DT;
    }
  }
}
