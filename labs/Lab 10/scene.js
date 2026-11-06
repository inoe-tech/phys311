import { Body } from "./engine/body.js";
import { Drag, ThrustForce } from "./engine/forces.js";
import { World } from "./engine/world.js";

export function createScene(keys) {
  const bounds = { xMin: -10, xMax: 10, yMin: -6, yMax: 6 };
  const world = new World({ bounds });
  const craft = world.add(new Body(0, 0, 1.5, 0.8, 1, 0.45, {
    color: "#ff8200",
  }));

  world.add(new Body(-4, 2, 0.8, -0.5, 1.5, 0.6, { color: "#2b8aef" }));
  world.add(new Body(4, -2, -0.6, 0.4, 2, 0.7, { color: "#29a36a" }));
  world.addForce(new Drag(0.08));
  world.addForce(new ThrustForce(craft, keys, 12));

  return { world, bounds };
}