export function drawHUD(element, world, { E0, fps, physicsMs, renderMs }) {
  const E = world.totalEnergy();
  const p = world.totalMomentum();
  const dE = E0 === 0 ? 0 : (E - E0) / Math.abs(E0);

  const rows = [
    ["t", `${world.time.toFixed(2)} s`],
    ["bodies", `${world.bodies.length}`],
    ["E_total", `${E.toFixed(6)} J`],
    ["(E - E0) / |E0|", `${(dE * 100).toFixed(4)} %`],
    ["|p|", `${p.length().toExponential(5)}`],
    ["fps", `${fps.toFixed(1)}`],
    ["physics", `${physicsMs.toFixed(3)} ms`],
    ["render", `${renderMs.toFixed(3)} ms`],
  ];
  element.replaceChildren(...rows.map(([label, value], index) => {
    const row = document.createElement("div");
    row.className = `hud-row${index === 3 && Math.abs(dE) > 0.01 ? " drift-high" : ""}`;
    const name = document.createElement("span");
    name.textContent = label;
    const output = document.createElement("b");
    output.textContent = value;
    row.append(name, output);
    return row;
  }));
}