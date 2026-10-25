export class Renderer {
  constructor(ctx, camera) {
    this.ctx = ctx;
    this.camera = camera;
  }

  draw() {
    const { ctx, camera } = this;
    const { width, height } = ctx.canvas;

    ctx.clearRect(0, 0, width, height);
    this.drawAxes();

    ctx.beginPath();
    ctx.arc(
      camera.toScreenX(2),
      camera.toScreenY(3),
      camera.toScreenLen(0.3),
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "#ff8200";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#7a3d00";
    ctx.stroke();
  }

  drawAxes() {
    const { ctx, camera } = this;
    const { width, height } = ctx.canvas;
    const axisX = camera.toScreenX(0);
    const axisY = camera.toScreenY(0);
    const firstX = Math.ceil(camera.toWorldX(0));
    const lastX = Math.floor(camera.toWorldX(width));
    const firstY = Math.ceil(camera.toWorldY(height));
    const lastY = Math.floor(camera.toWorldY(0));

    ctx.strokeStyle = "#273444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(width, axisY);
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX, height);
    ctx.stroke();

    ctx.font = "14px Arial, sans-serif";
    ctx.fillStyle = "#273444";
    ctx.lineWidth = 1.5;

    for (let x = firstX; x <= lastX; x += 1) {
      const screenX = camera.toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(screenX, axisY - 5);
      ctx.lineTo(screenX, axisY + 5);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(String(x), screenX, axisY + 9);
    }

    for (let y = firstY; y <= lastY; y += 1) {
      const screenY = camera.toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(axisX - 5, screenY);
      ctx.lineTo(axisX + 5, screenY);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(String(y), axisX - 9, screenY);
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("x (m)", width - 10, axisY - 10);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("y (m)", axisX + 10, 10);
  }
}