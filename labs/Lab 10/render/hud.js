export function drawHUD(element, world, {
  E0,
  fps,
  physicsMs,
  renderMs,
  pointerWorld,
  timeStep,
}) {
  const E = world.totalEnergy();
  const p = world.totalMomentum();
  const dE = !world.externalForceApplied || E0 === 0
    ? 0
    : (E - E0) / Math.abs(E0);

  const rows = [
    ["t", `${world.time.toFixed(2)} s`],
    ["Δt", `1/${Math.round(1 / timeStep)} s`],
    ["bodies", `${world.bodies.length}`],
    ["E_total", `${E.toFixed(6)} J`],
    ["ΔE / |E₀|", `${(dE * 100).toFixed(4)} %`],
    ["|p|", `${p.length().toExponential(5)}`],
    ["cursor", pointerWorld
      ? `(${pointerWorld.x.toFixed(2)}, ${pointerWorld.y.toFixed(2)}) m`
      : "outside canvas"],
    ["fps", `${fps.toFixed(1)}`],
    ["physics", `${physicsMs.toFixed(3)} ms`],
    ["render", `${renderMs.toFixed(3)} ms`],
  ];
  element.replaceChildren(...rows.map(([label, value]) => {
    const row = document.createElement("div");
    row.className = `hud-row${label === "ΔE / |E₀|" && Math.abs(dE) > 0.01 ? " drift-high" : ""}`;
    const name = document.createElement("span");
    name.textContent = label;
    const output = document.createElement("b");
    output.textContent = value;
    row.append(name, output);
    return row;
  }));
}