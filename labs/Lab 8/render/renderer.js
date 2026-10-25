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

export class ProjectileRenderer {
  constructor(ctx, camera) {
    this.ctx = ctx;
    this.camera = camera;
  }

  draw(state, trail) {
    const { ctx, camera } = this;
    const { width, height } = ctx.canvas;

    ctx.clearRect(0, 0, width, height);
    this.drawGround();
    this.drawTrail(trail);

    ctx.beginPath();
    ctx.arc(
      camera.toScreenX(state.x),
      camera.toScreenY(state.y),
      camera.toScreenLen(0.3),
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "#167d9a";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#104b60";
    ctx.stroke();

    this.drawHud(state);
  }

  drawGround() {
    const { ctx, camera } = this;
    const { width } = ctx.canvas;
    const axisY = camera.toScreenY(0);
    const lastX = Math.floor(camera.toWorldX(width) / 5) * 5;

    ctx.strokeStyle = "#273444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(width, axisY);
    ctx.stroke();

    ctx.font = "13px Arial, sans-serif";
    ctx.fillStyle = "#526170";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let x = 0; x <= lastX; x += 5) {
      const screenX = camera.toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(screenX, axisY - 4);
      ctx.lineTo(screenX, axisY + 4);
      ctx.stroke();
      ctx.fillText(String(x), screenX, axisY + 8);
    }
    ctx.textAlign = "right";
    ctx.fillText("x (m)", width - 12, axisY + 8);
  }

  drawTrail(trail) {
    const { ctx, camera } = this;
    if (trail.length < 2) return;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    for (let i = 1; i < trail.length; i += 1) {
      const opacity = 0.08 + 0.72 * (i / (trail.length - 1));
      ctx.strokeStyle = `rgba(22, 125, 154, ${opacity})`;
      ctx.beginPath();
      ctx.moveTo(camera.toScreenX(trail[i - 1].x), camera.toScreenY(trail[i - 1].y));
      ctx.lineTo(camera.toScreenX(trail[i].x), camera.toScreenY(trail[i].y));
      ctx.stroke();
    }
  }

  drawHud(state) {
    const { ctx } = this;
    const speed = Math.hypot(state.vx, state.vy);
    const kineticEnergy = 0.5 * state.mass * speed * speed;
    const potentialEnergy = state.mass * state.gravity * state.y;
    const values = [
      `t       ${state.t.toFixed(3)} s`,
      `x       ${state.x.toFixed(3)} m`,
      `y       ${state.y.toFixed(3)} m`,
      `|v|     ${speed.toFixed(3)} m/s`,
      `KE      ${kineticEnergy.toFixed(3)} J`,
      `PE      ${potentialEnergy.toFixed(3)} J`,
      `E_total ${(kineticEnergy + potentialEnergy).toFixed(3)} J`,
    ];

    ctx.fillStyle = "rgba(20, 32, 48, 0.9)";
    ctx.fillRect(14, 14, 246, 178);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("PROJECTILE  |  m = 1 kg", 26, 24);
    ctx.font = "13px Consolas, monospace";
    values.forEach((value, index) => {
      ctx.fillText(value, 26, 48 + index * 19);
    });
  }
}