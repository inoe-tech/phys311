const DRIFT_TOLERANCE_PERCENT = 1;

export function drawHUD(element, world, {
  E0,
  fps,
  physicsMs,
  renderMs,
  pointerWorld,
  timeStep,
  selectedBody,
  orbitalPeriod,
  debug,
}) {
  const E = world.totalEnergy();
  const p = world.totalMomentum();
  const driftPercent = E0 === 0
    ? null
    : (E - E0) / Math.abs(E0) * 100;
  const maxSpeed = world.bodies.reduce(
    (max, body) => Math.max(max, body.vel.length()),
    0,
  );

  const rows = [
    ["t", `${world.time.toFixed(2)} s`],
    ["Selected Planet", selectedBody?.label ?? "None"],
    ...(orbitalPeriod ? [["Orbital Period", orbitalPeriod]] : []),
    ...(debug ? [
      ["Δt", `1/${Math.round(1 / timeStep)} s`],
      ["Cursor", pointerWorld
        ? `(${pointerWorld.x.toFixed(2)}, ${pointerWorld.y.toFixed(2)}) m`
        : "outside canvas"],
      ["Total energy", `${E.toFixed(6)} J`],
      [
        `Energy drift`,
        driftPercent === null
          ? "N/A (E₀ = 0)"
          : `${driftPercent >= 0 ? "+" : ""}${driftPercent.toFixed(4)}%`,
      ],
      ["Momentum magnitude", p.length().toExponential(5)],
      ["Body count", `${world.bodies.length - 1}`],
      ["Maximum speed", `${maxSpeed.toFixed(5)} m/s`],
      ["Measured FPS", `${fps.toFixed(1)}`],
      ["Physics", `${physicsMs.toFixed(3)} ms`],
      ["Render", `${renderMs.toFixed(3)} ms`],
    ] : []),
  ];
  element.replaceChildren(...rows.map(([label, value]) => {
    const row = document.createElement("div");
    row.className = `hud-row${label.startsWith("Energy drift") &&
      driftPercent !== null &&
      Math.abs(driftPercent) > DRIFT_TOLERANCE_PERCENT
      ? " drift-high"
      : ""}`;
    const name = document.createElement("span");
    name.textContent = label;
    const output = document.createElement("b");
    output.textContent = value;
    row.append(name, output);
    return row;
  }));
}

export function drawKeplerPlot(canvas, world, star, selectedBody) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The Kepler plot canvas is unavailable.");

  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(bounds.width * pixelRatio));
  const height = Math.max(1, Math.round(bounds.height * pixelRatio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, bounds.width, bounds.height);

  const gravity = world.forces.find((force) => Number.isFinite(force.G) && force.G > 0);
  const planets = gravity
    ? world.bodies.filter((body) => body !== star).flatMap((body) => {
      const dx = body.pos.x - star.pos.x;
      const dy = body.pos.y - star.pos.y;
      const dvx = body.vel.x - star.vel.x;
      const dvy = body.vel.y - star.vel.y;
      const radius = Math.hypot(dx, dy);
      const gravitationalParameter = gravity.G * (star.m + body.m);
      const specificEnergy = 0.5 * (dvx * dvx + dvy * dvy) -
        gravitationalParameter / radius;
      const semiMajorAxis = -gravitationalParameter / (2 * specificEnergy);
      const period = 2 * Math.PI * Math.sqrt(
        semiMajorAxis ** 3 / gravitationalParameter,
      );
      return Number.isFinite(semiMajorAxis) && semiMajorAxis > 0 &&
        Number.isFinite(period) && period > 0
        ? [{ body, semiMajorAxis, period }]
        : [];
    })
    : [];

  context.fillStyle = "#b8c4d4";
  context.font = "14px system-ui, sans-serif";
  if (planets.length === 0) {
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      "No bound orbits to plot",
      bounds.width / 2,
      bounds.height / 2,
    );
    return;
  }

  const gravitationalParameter = gravity.G * star.m;
  const xLogs = planets.map(({ semiMajorAxis }) => Math.log10(semiMajorAxis));
  const periodLogs = planets.map(({ period }) => Math.log10(period));
  const minLogX = Math.floor(Math.min(...xLogs)) - 0.15;
  const maxLogX = Math.ceil(Math.max(...xLogs)) + 0.15;
  const theoreticalLogPeriod = (logAxis) => Math.log10(2 * Math.PI) +
    1.5 * logAxis - 0.5 * Math.log10(gravitationalParameter);
  const minLogY = Math.floor(Math.min(
    ...periodLogs,
    theoreticalLogPeriod(minLogX),
    theoreticalLogPeriod(maxLogX),
  )) - 0.15;
  const maxLogY = Math.ceil(Math.max(
    ...periodLogs,
    theoreticalLogPeriod(minLogX),
    theoreticalLogPeriod(maxLogX),
  )) + 0.15;

  const plot = {
    left: 64,
    right: bounds.width - 18,
    top: 16,
    bottom: bounds.height - 58,
  };
  const x = (logValue) => plot.left +
    (logValue - minLogX) / (maxLogX - minLogX) * (plot.right - plot.left);
  const y = (logValue) => plot.bottom -
    (logValue - minLogY) / (maxLogY - minLogY) * (plot.bottom - plot.top);

  context.font = "12px system-ui, sans-serif";
  context.lineWidth = 1;
  context.strokeStyle = "#303b4b";
  context.fillStyle = "#b8c4d4";
  context.textAlign = "center";
  context.textBaseline = "top";
  for (let exponent = Math.ceil(minLogX); exponent <= maxLogX; exponent++) {
    const position = x(exponent);
    context.beginPath();
    context.moveTo(position, plot.top);
    context.lineTo(position, plot.bottom);
    context.stroke();
    context.fillText(`10^${exponent}`, position, plot.bottom + 7);
  }

  context.textAlign = "right";
  context.textBaseline = "middle";
  for (let exponent = Math.ceil(minLogY); exponent <= maxLogY; exponent++) {
    const position = y(exponent);
    context.beginPath();
    context.moveTo(plot.left, position);
    context.lineTo(plot.right, position);
    context.stroke();
    context.fillText(`10^${exponent}`, plot.left - 7, position);
  }

  context.strokeStyle = "#76869a";
  context.beginPath();
  context.moveTo(plot.left, plot.top);
  context.lineTo(plot.left, plot.bottom);
  context.lineTo(plot.right, plot.bottom);
  context.stroke();

  context.save();
  context.setLineDash([6, 4]);
  context.strokeStyle = "#b8c4d4";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x(minLogX), y(theoreticalLogPeriod(minLogX)));
  context.lineTo(x(maxLogX), y(theoreticalLogPeriod(maxLogX)));
  context.stroke();
  context.restore();

  context.font = "12px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "bottom";
  context.fillStyle = "#e6edf3";
  context.fillText("Semi-major axis, a (m)", (plot.left + plot.right) / 2, bounds.height - 4);
  context.save();
  context.translate(14, (plot.top + plot.bottom) / 2);
  context.rotate(-Math.PI / 2);
  context.fillText("Orbital period, T (s)", 0, 0);
  context.restore();

  for (const { body, semiMajorAxis, period } of planets) {
    const pointX = x(Math.log10(semiMajorAxis));
    const pointY = y(Math.log10(period));
    context.beginPath();
    context.arc(pointX, pointY, body === selectedBody ? 5 : 3.5, 0, 2 * Math.PI);
    context.fillStyle = body.color ?? "#4cc9f0";
    context.fill();
    if (body === selectedBody) {
      context.lineWidth = 1.5;
      context.strokeStyle = "#ffffff";
      context.stroke();
    }
    context.font = "11px system-ui, sans-serif";
    context.textAlign = "left";
    context.textBaseline = "bottom";
    context.fillStyle = "#e6edf3";
    context.fillText(body.label ?? "Planet", pointX + 6, pointY - 4);
  }
}