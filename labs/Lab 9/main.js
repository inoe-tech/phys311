export function stepAndRender(world, renderer, acc, DT) {
  const t0 = performance.now();
  while (acc >= DT) {
    world.step(DT);
    acc -= DT;
  }
  const tPhysics = performance.now() - t0;

  const t1 = performance.now();
  renderer.draw(world);
  const tRender = performance.now() - t1;

  return { acc, tPhysics, tRender };
}