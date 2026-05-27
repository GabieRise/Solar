import { ORBITAL_ELEMENTS, J2000 } from '../data/orbitalElements';

const DEG = Math.PI / 180;
const AU_TO_SCENE = 40;

// ── Kepler's Equation Solver ───────────────────────────────────────────────────
// Solves M = E - e*sin(E) for E (eccentric anomaly)
// using Newton-Raphson iteration
function solveKepler(M, e, iterations = 50) {
  // Normalize M to [0, 2π]
  let E = M % (2 * Math.PI);
  if (E < 0) E += 2 * Math.PI;

  for (let i = 0; i < iterations; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

// ── Days since J2000 ──────────────────────────────────────────────────────────
export function daysSinceJ2000(date) {
  return (date.getTime() - J2000.getTime()) / 86400000;
}

// ── XYZ position for one planet on a given date ───────────────────────────────
// Returns { x, y, z } in Three.js scene units
export function getPlanetPosition(planetName, date) {
  const el = ORBITAL_ELEMENTS[planetName];
  if (!el) return null;

  const d = daysSinceJ2000(date);

  // 1. Mean anomaly at date
  const M = ((el.M0 + el.n * d) % 360) * DEG;

  // 2. Solve Kepler's equation for eccentric anomaly E
  const E = solveKepler(M, el.e);

  // 3. True anomaly ν from E
  const sinV = Math.sqrt(1 - el.e * el.e) * Math.sin(E);
  const cosV = Math.cos(E) - el.e;
  const nu   = Math.atan2(sinV, cosV);

  // 4. Heliocentric distance r (in AU)
  const r = el.a * (1 - el.e * Math.cos(E));

  // 5. Position in orbital plane
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);

  // 6. Convert to ecliptic XYZ using orbital elements
  const cosO = Math.cos(el.Omega * DEG), sinO = Math.sin(el.Omega * DEG);
  const cosI = Math.cos(el.i     * DEG), sinI = Math.sin(el.i     * DEG);
  const cosW = Math.cos(el.omega * DEG), sinW = Math.sin(el.omega * DEG);

  const x = (cosO * cosW - sinO * sinW * cosI) * xOrb
          + (-cosO * sinW - sinO * cosW * cosI) * yOrb;
  const y = (sinO * cosW + cosO * sinW * cosI) * xOrb
          + (-sinO * sinW + cosO * cosW * cosI) * yOrb;
  const z = (sinW * sinI) * xOrb + (cosW * sinI) * yOrb;

  // 7. Scale to scene units; swap Y/Z for Three.js (Y-up)
  return {
    x:  x * AU_TO_SCENE,
    y:  z * AU_TO_SCENE,   // ecliptic Z → Three.js Y
    z: -y * AU_TO_SCENE,   // ecliptic Y → Three.js -Z
  };
}

// ── All planet positions for a given date ─────────────────────────────────────
export function getAllPlanetPositions(date) {
  const positions = {};
  Object.keys(ORBITAL_ELEMENTS).forEach(name => {
    positions[name] = getPlanetPosition(name, date);
  });
  return positions;
}

// ── True elliptical orbit path points ────────────────────────────────────────
// Returns an array of { x, y, z } scene-unit points tracing the full orbit
export function getOrbitPath(planetName, steps = 128) {
  const el = ORBITAL_ELEMENTS[planetName];
  if (!el) return [];

  const points = [];
  for (let i = 0; i <= steps; i++) {
    const nu   = (i / steps) * 2 * Math.PI;
    const r    = el.a * (1 - el.e * el.e) / (1 + el.e * Math.cos(nu));
    const xOrb = r * Math.cos(nu);
    const yOrb = r * Math.sin(nu);

    const cosO = Math.cos(el.Omega * DEG), sinO = Math.sin(el.Omega * DEG);
    const cosI = Math.cos(el.i     * DEG), sinI = Math.sin(el.i     * DEG);
    const cosW = Math.cos(el.omega * DEG), sinW = Math.sin(el.omega * DEG);

    const x = (cosO * cosW - sinO * sinW * cosI) * xOrb
            + (-cosO * sinW - sinO * cosW * cosI) * yOrb;
    const y = (sinO * cosW + cosO * sinW * cosI) * xOrb
            + (-sinO * sinW + cosO * cosW * cosI) * yOrb;
    const z = (sinW * sinI) * xOrb + (cosW * sinI) * yOrb;

    points.push({
      x:  x * AU_TO_SCENE,
      y:  z * AU_TO_SCENE,
      z: -y * AU_TO_SCENE,
    });
  }
  return points;
}