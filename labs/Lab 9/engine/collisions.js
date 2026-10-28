export function resolvePair(a, b, e = 0.9) {
  const d = b.pos.sub(a.pos);
  const distSq = d.lengthSq();
  const rSum = a.radius + b.radius;
  if (distSq >= rSum * rSum || distSq === 0) return false;   // no contact

  const dist = Math.sqrt(distSq);
  const n = d.mul(1 / dist);            // unit normal, a → b

  // --- 1. Positional correction: push them apart (no overlap!) ---
  const overlap = rSum - dist;
  const invA = a.isStatic ? 0 : 1 / a.m;
  const invB = b.isStatic ? 0 : 1 / b.m;
  const invSum = invA + invB;
  if (invSum === 0) return false;          // two static bodies
  a.pos.addScaled(n, -overlap * (invA / invSum));
  b.pos.addScaled(n,  overlap * (invB / invSum));

  // --- 2. Impulse: only if they're approaching ---
  const relVel = b.vel.sub(a.vel);
  const vn = relVel.dot(n);
  if (vn > 0) return true;                // separating — leave alone

  const J = -(1 + e) * vn / invSum;      // impulse magnitude
  a.vel.addScaled(n, -J * invA);
  b.vel.addScaled(n,  J * invB);
  return true;
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