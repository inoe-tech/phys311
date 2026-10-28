export function drawHUD(ctx, world, E0, p0) {
  const E = world.totalEnergy();
  const p = world.totalMomentum();
  const dE = E0 === 0 ? 0 : (E - E0) / Math.abs(E0);

  const lines = [
    `t        = ${world.time.toFixed(2)} s`,
    `bodies   = ${world.bodies.length}`,
    `E        = ${E.toFixed(4)} J`,
    `dE/E0    = ${(dE * 100).toFixed(3)} %`,
    `|p|      = ${p.length().toFixed(4)}`,
  ];

  ctx.font = "13px monospace";
  ctx.fillStyle = Math.abs(dE) > 0.01 ? "#dc3545" : "#2d3b45";  // red if drifting!
  lines.forEach((line, i) => ctx.fillText(line, 12, 20 + i * 17));
}