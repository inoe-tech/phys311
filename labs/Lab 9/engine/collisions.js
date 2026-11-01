export function resolvePair(a, b, e = 0.9) {
  const d = b.pos.sub(a.pos);
  const distSq = d.lengthSq();
  const rSum = a.radius + b.radius;
  if (distSq >= rSum * rSum) return false;   // no contact

  const dist = Math.sqrt(distSq);
  const n = dist === 0 ? { x: 1, y: 0 } : d.mul(1 / dist); // unit normal, a → b

  // --- 1. Positional correction: push them apart (no overlap!) ---
  const overlap = rSum - dist;
  const invA = a.inverseMass ?? (a.isStatic ? 0 : 1 / a.m);
  const invB = b.inverseMass ?? (b.isStatic ? 0 : 1 / b.m);
  const invSum = invA + invB;
  if (invSum === 0) return false;          // two static bodies
  a.pos.addScaled(n, -overlap * (invA / invSum));
  b.pos.addScaled(n,  overlap * (invB / invSum));

  // --- 2. Impulse: only if they're approaching ---
  const relVel = b.vel.sub(a.vel);
  const vn = relVel.dot(n);
  if (vn > 0) return true;                

  const J = -(1 + e) * vn / invSum;      
  a.vel.addScaled(n, -J * invA);
  b.vel.addScaled(n,  J * invB);
  return true;
}

export function resolveWalls(body, bounds, e = 0.9) {
  if (body.isStatic) return;

  const minX = bounds.xMin + body.radius;
  const maxX = bounds.xMax - body.radius;
  const minY = bounds.yMin + body.radius;
  const maxY = bounds.yMax - body.radius;

  if (body.pos.x < minX || (body.pos.x === minX && body.vel.x < 0)) {
    body.pos.x = minX;
    if (body.vel.x < 0) body.vel.x *= -e;
  } else if (body.pos.x > maxX || (body.pos.x === maxX && body.vel.x > 0)) {
    body.pos.x = maxX;
    if (body.vel.x > 0) body.vel.x *= -e;
  }

  if (body.pos.y < minY || (body.pos.y === minY && body.vel.y < 0)) {
    body.pos.y = minY;
    if (body.vel.y < 0) body.vel.y *= -e;
  } else if (body.pos.y > maxY || (body.pos.y === maxY && body.vel.y > 0)) {
    body.pos.y = maxY;
    if (body.vel.y > 0) body.vel.y *= -e;
  }
}

export function resolveCollisions(world) {
  const { bodies, bounds, restitution } = world;

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      resolvePair(bodies[i], bodies[j], restitution);
    }
  }

  if (bounds) {
    for (const body of bodies) resolveWalls(body, bounds, restitution);
  }
}

export function gridPairs(bodies, cellSize) {
  const cells = new Map();
  const key = (i, j) => `${i},${j}`;

  for (const b of bodies) {
    if (!Number.isFinite(b.pos.x) || !Number.isFinite(b.pos.y)) {
      console.error("NaN body!", b);
      debugger;
    }
    const i = Math.floor(b.pos.x / cellSize);
    const j = Math.floor(b.pos.y / cellSize);
    const k = key(i, j);
    if (!cells.has(k)) cells.set(k, []);
    cells.get(k).push(b);
    b._ci = i; b._cj = j;
  }

  const pairs = [];
  for (const b of bodies) {
    for (let di = -1; di <= 1; di++)
      for (let dj = -1; dj <= 1; dj++) {
        const bucket = cells.get(key(b._ci + di, b._cj + dj));
        if (!bucket) continue;
        for (const o of bucket) if (b !== o && b.id < o.id) pairs.push([b, o]);
      }
  }
  return pairs;
}