export class Renderer {
  constructor(canvas, camera) {
    this.ctx = canvas.getContext("2d");
    this.canvas = canvas;
    this.camera = camera;
    this.trails = new Map();
    this.showTrails = true;
    this.trailLength = 500;
  }

  clearTrails() {
    this.trails.clear();
  }

  recordTrails(world) {
    if (!this.showTrails || !world.trailsEnabled) return;
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

  draw(world) {
    const { ctx, canvas, camera } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (world.bounds) {
      const topLeft = camera.toScreen({ x: world.bounds.xMin, y: world.bounds.yMax });
      const bottomRight = camera.toScreen({ x: world.bounds.xMax, y: world.bounds.yMin });
      ctx.strokeStyle = "#52616b";
      ctx.lineWidth = 2;
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

    if (this.showTrails && world.trailsEnabled) {
      for (const [body, trail] of this.trails) {
        if (trail.length < 2) continue;
        ctx.strokeStyle = body.color ?? "#ff8200";
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const first = camera.toScreen(trail[0]);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < trail.length; i++) {
          const point = camera.toScreen(trail[i]);
          ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    for (const b of world.bodies) {
      const p = camera.toScreen(b.pos);
      ctx.fillStyle = b.color ?? "#ff8200";
      ctx.beginPath();
      ctx.arc(p.x, p.y, b.radius * camera.scale, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}