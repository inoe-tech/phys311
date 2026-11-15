export class Renderer {
  constructor(canvas, camera) {
    this.ctx = canvas.getContext("2d");
    this.canvas = canvas;
    this.camera = camera;
    this.trails = new Map();
    this.showTrails = true;
    this.showVelocityVectors = true;
    this.showForceVectors = true;
    this.trailLength = 500;
    this.pixelRatio = 1;
  }

  resize(bounds) {
    const rect = this.canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * pixelRatio));
    const height = Math.max(1, Math.round(rect.height * pixelRatio));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.pixelRatio = pixelRatio;
    const padding = Math.min(30 * pixelRatio, width / 4, height / 4);
    this.camera.fit(bounds, this.canvas, padding);
    this.clearTrails();
  }

  clearTrails() {
    this.trails.clear();
  }

  recordTrails(world) {
    if (!this.showTrails) return;
    for (const body of world.bodies) {
      let trail = this.trails.get(body);
      if (!trail) {
        trail = [];
        this.trails.set(body, trail);
      }
      trail.push(body.pos.clone());
      if (trail.length > this.trailLength) trail.shift();
    }
  }

  draw(world, {
    pointerWorld = null,
    trajectory = null,
    slingshot = null,
    heldBody = null,
  } = {}) {
    const { ctx, canvas, camera } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (world.bounds) {
      const topLeft = camera.toScreen({ x: world.bounds.xMin, y: world.bounds.yMax });
      const bottomRight = camera.toScreen({ x: world.bounds.xMax, y: world.bounds.yMin });
      ctx.strokeStyle = "#52616b";
      ctx.lineWidth = 2 * this.pixelRatio;
      ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    }

    if (world.links) {
      ctx.strokeStyle = "#73808a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const [a, b] of world.links) {
        const start = camera.toScreen(a.pos);
        const end = camera.toScreen(b.pos);
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
      }
      ctx.stroke();
    }

    if (this.showTrails) {
      for (const [body, trail] of this.trails) {
        if (trail.length < 2) continue;
        ctx.lineWidth = 1.5 * this.pixelRatio;
        for (let i = 1; i < trail.length; i++) {
          const previous = camera.toScreen(trail[i - 1]);
          const point = camera.toScreen(trail[i]);
          ctx.globalAlpha = 0.05 + 0.55 * (i / (trail.length - 1));
          ctx.strokeStyle = body.color ?? "#ff8200";
          ctx.beginPath();
          ctx.moveTo(previous.x, previous.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    if (trajectory?.length > 1) {
      ctx.save();
      ctx.strokeStyle = "#d7263d";
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 2 * this.pixelRatio;
      ctx.setLineDash([6 * this.pixelRatio, 5 * this.pixelRatio]);
      ctx.beginPath();
      const first = camera.toScreen(trajectory[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < trajectory.length; i++) {
        const point = camera.toScreen(trajectory[i]);
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    if (slingshot) {
      const start = camera.toScreen(slingshot.start);
      const end = camera.toScreen(slingshot.current);
      ctx.save();
      ctx.strokeStyle = "#d7263d";
      ctx.lineWidth = 2 * this.pixelRatio;
      ctx.setLineDash([5 * this.pixelRatio, 4 * this.pixelRatio]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.restore();
    }

    if (heldBody && pointerWorld) {
      const body = camera.toScreen(heldBody.pos);
      const target = camera.toScreen(pointerWorld);
      ctx.save();
      ctx.strokeStyle = "#52616b";
      ctx.lineWidth = 1.5 * this.pixelRatio;
      ctx.setLineDash([4 * this.pixelRatio, 4 * this.pixelRatio]);
      ctx.beginPath();
      ctx.moveTo(body.x, body.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.restore();
    }

    for (const b of world.bodies) {
      const p = camera.toScreen(b.pos);
      ctx.fillStyle = b.color ?? "#ff8200";
      ctx.beginPath();
      ctx.arc(p.x, p.y, b.radius * camera.scale, 0, 2 * Math.PI);
      ctx.fill();
      if (b === heldBody) {
        ctx.strokeStyle = "#d7263d";
        ctx.lineWidth = 2 * this.pixelRatio;
        ctx.stroke();
      }
    }

    if (this.showVelocityVectors) {
      for (const body of world.bodies) {
        this.drawVector(body.pos, body.vel, 0.2, "#1769aa");
      }
    }

    if (this.showForceVectors) {
      for (const body of world.bodies) {
        const force = world.lastForces.get(body);
        if (force) this.drawVector(body.pos, force, 0.04, "#b23a48");
      }
    }

    if (pointerWorld) {
      const p = camera.toScreen(pointerWorld);
      const arm = 9 * this.pixelRatio;
      ctx.strokeStyle = "#d7263d";
      ctx.lineWidth = 1.5 * this.pixelRatio;
      ctx.beginPath();
      ctx.moveTo(p.x - arm, p.y);
      ctx.lineTo(p.x + arm, p.y);
      ctx.moveTo(p.x, p.y - arm);
      ctx.lineTo(p.x, p.y + arm);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * this.pixelRatio, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }

  drawVector(position, vector, scale, color) {
    const { ctx, camera } = this;
    const magnitude = vector.length();
    if (magnitude < 1e-8) return;
    const length = Math.min(magnitude * scale, 4);
    const endpoint = {
      x: position.x + vector.x / magnitude * length,
      y: position.y + vector.y / magnitude * length,
    };
    const start = camera.toScreen(position);
    const end = camera.toScreen(endpoint);
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const head = 7 * this.pixelRatio;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2 * this.pixelRatio;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - head * Math.cos(angle - Math.PI / 6),
      end.y - head * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      end.x - head * Math.cos(angle + Math.PI / 6),
      end.y - head * Math.sin(angle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();
  }
}