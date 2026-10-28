export class Renderer {
  constructor(canvas, camera) {
    this.ctx = canvas.getContext("2d");
    this.canvas = canvas;
    this.camera = camera;
  }

  draw(world) {
    const { ctx, canvas, camera } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const b of world.bodies) {
      const p = camera.toScreen(b.pos);
      ctx.fillStyle = b.color ?? "#ff8200";
      ctx.beginPath();
      ctx.arc(p.x, p.y, b.radius * camera.scale, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}