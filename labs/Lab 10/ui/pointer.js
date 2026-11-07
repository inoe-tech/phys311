export function eventToWorld(event, canvas, camera) {
  const rect = canvas.getBoundingClientRect();
  const px = (event.clientX - rect.left) * (canvas.width / rect.width);
  const py = (event.clientY - rect.top) * (canvas.height / rect.height);
  return camera.toWorld(px, py);
}

const LAUNCH_SPEED = 2.5;
const MAX_LAUNCH_SPEED = 25;

export class PointerInput {
  constructor(canvas, camera, world, mouseSpring, onLaunch, canSpawn = () => true) {
    this.canvas = canvas;
    this.camera = camera;
    this.world = world;
    this.mouseSpring = mouseSpring;
    this.onLaunch = onLaunch;
    this.canSpawn = canSpawn;
    this.worldPosition = null;
    this.slingshot = null;
    this.pointerId = null;

    canvas.addEventListener("pointermove", (event) => this.update(event));
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || this.pointerId !== null) return;
      this.update(event);
      const body = this.pickBody(this.worldPosition);
      if (!body && !this.canSpawn()) return;
      this.pointerId = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
      if (body) {
        this.mouseSpring.grab(body, this.worldPosition.x, this.worldPosition.y);
      } else {
        this.slingshot = { start: { ...this.worldPosition }, current: { ...this.worldPosition } };
      }
    });
    canvas.addEventListener("pointerup", (event) => {
      this.update(event);
      this.finishPointer(event.pointerId, true);
    });
    canvas.addEventListener("pointercancel", (event) => {
      this.finishPointer(event.pointerId, false);
    });
    canvas.addEventListener("pointerleave", () => {
      if (this.pointerId === null) this.worldPosition = null;
    });
    window.addEventListener("blur", () => {
      if (this.pointerId !== null) this.finishPointer(this.pointerId, false);
      else this.mouseSpring.release();
    });
  }

  get heldBody() {
    return this.mouseSpring.body;
  }

  setWorld(world, mouseSpring) {
    this.mouseSpring.release();
    if (this.pointerId !== null && this.canvas.hasPointerCapture(this.pointerId)) {
      this.canvas.releasePointerCapture(this.pointerId);
    }
    this.world = world;
    this.mouseSpring = mouseSpring;
    this.slingshot = null;
    this.pointerId = null;
  }

  pickBody(position) {
    let picked = null;
    let nearestDistanceSq = Infinity;
    for (const body of this.world.bodies) {
      if (body.isStatic) continue;
      const dx = body.pos.x - position.x;
      const dy = body.pos.y - position.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq <= body.radius * body.radius && distanceSq < nearestDistanceSq) {
        picked = body;
        nearestDistanceSq = distanceSq;
      }
    }
    return picked;
  }

  update(event) {
    this.worldPosition = eventToWorld(event, this.canvas, this.camera);
    if (this.mouseSpring.body) {
      this.mouseSpring.moveTo(this.worldPosition.x, this.worldPosition.y);
    }
    if (this.slingshot) this.slingshot.current = { ...this.worldPosition };
  }

  finishPointer(pointerId, launch) {
    if (pointerId !== this.pointerId) return;
    if (this.mouseSpring.body) {
      this.mouseSpring.release();
    } else if (this.slingshot && launch) {
      const velocity = this.launchVelocity(this.slingshot.start, this.slingshot.current);
      this.onLaunch(this.slingshot.start, velocity);
    }
    this.slingshot = null;
    this.pointerId = null;
    if (this.canvas.hasPointerCapture(pointerId)) {
      this.canvas.releasePointerCapture(pointerId);
    }
  }

  launchVelocity(start, current) {
    let vx = (start.x - current.x) * LAUNCH_SPEED;
    let vy = (start.y - current.y) * LAUNCH_SPEED;
    const speed = Math.hypot(vx, vy);
    if (speed > MAX_LAUNCH_SPEED) {
      const ratio = MAX_LAUNCH_SPEED / speed;
      vx *= ratio;
      vy *= ratio;
    }
    return { x: vx, y: vy };
  }

  getTrajectory(dt) {
    if (!this.slingshot) return null;
    const { start, current } = this.slingshot;
    const velocity = this.launchVelocity(start, current);
    const gravity = this.world.forces.find((force) => "G" in force)?.G ?? 0;
    const drag = this.world.forces.find((force) => "c" in force)?.c ?? 0;
    const mass = this.world.bodies.find((body) => body !== this.world.bodies[0])?.m ?? 1;
    const sampleStep = Math.max(dt, 1 / 60);
    const points = [{ ...start }];
    let x = start.x;
    let y = start.y;
    let vx = velocity.x;
    let vy = velocity.y;

    for (let i = 0; i < Math.ceil(3 / sampleStep); i++) {
      const speed = Math.hypot(vx, vy);
      const dragScale = speed === 0 ? 0 : drag * speed / mass;
      let ax = -dragScale * vx;
      let ay = -dragScale * vy;
      for (const body of this.world.bodies) {
        const dx = body.pos.x - x;
        const dy = body.pos.y - y;
        const distanceSq = dx * dx + dy * dy + 0.01 ** 2;
        const gravityScale = gravity * body.m / (distanceSq * Math.sqrt(distanceSq));
        ax += gravityScale * dx;
        ay += gravityScale * dy;
      }
      vx += ax * sampleStep;
      vy += ay * sampleStep;
      x += vx * sampleStep;
      y += vy * sampleStep;

      if (i % 4 === 3) points.push({ x, y });
    }
    return points;
  }
}
