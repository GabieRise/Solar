// ── Constants ──────────────────────────────────────────────────────────────────
const NASA_KEY     = process.env.REACT_APP_NASA_KEY;
const NEOWS_URL    = 'https://api.nasa.gov/neo/rest/v1/feed';
const HORIZONS_URL = 'https://ssd.jpl.nasa.gov/api/horizons.api';

// JPL Horizons body IDs for each planet
const HORIZONS_IDS = {
  Mercury: '199',
  Venus:   '299',
  Earth:   '399',
  Mars:    '499',
  Jupiter: '599',
  Saturn:  '699',
  Uranus:  '799',
  Neptune: '899',
};

// Scale: 1 AU = 40 scene units (Earth orbits at ~44 units ≈ 1.1 AU)
const AU_TO_SCENE = 40;

// ── Helpers ────────────────────────────────────────────────────────────────────
function todayString() {
  return new Date().toISOString().split('T')[0];
}

function tomorrowString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function parseHorizonsXYZ(text) {
  const match = text.match(/X =\s*([-\d.E+]+)\s+Y =\s*([-\d.E+]+)\s+Z =\s*([-\d.E+]+)/);
  if (!match) return null;
  return {
    x: parseFloat(match[1]),
    y: parseFloat(match[2]),
    z: parseFloat(match[3]),
  };
}

// ── Planet Positions ───────────────────────────────────────────────────────────

async function fetchPlanetPosition(planetName) {
  const today    = todayString();
  const tomorrow = tomorrowString();
  const id       = HORIZONS_IDS[planetName];
  if (!id) return null;

  const params = new URLSearchParams({
    format:     'text',
    COMMAND:    `'${id}'`,
    OBJ_DATA:   'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'VECTORS',
    CENTER:     '500@10',
    START_TIME: `'${today}'`,
    STOP_TIME:  `'${tomorrow}'`,
    STEP_SIZE:  '1d',
    VEC_TABLE:  '3',
    REF_PLANE:  'ECLIPTIC',
    REF_SYSTEM: 'J2000',
    VEC_CORR:   'NONE',
    OUT_UNITS:  'AU-D',
    CSV_FORMAT: 'NO',
    VEC_LABELS: 'YES',
  });

  try {
    const res  = await fetch(`${HORIZONS_URL}?${params}`);
    const text = await res.text();
    const xyz  = parseHorizonsXYZ(text);
    if (!xyz) return null;

    // Convert AU to scene units; swap axes for Three.js (Y-up)
    return {
      x:  xyz.x * AU_TO_SCENE,
      y:  xyz.z * AU_TO_SCENE,
      z: -xyz.y * AU_TO_SCENE,
    };
  } catch (err) {
    console.warn(`Horizons fetch failed for ${planetName}:`, err);
    return null;
  }
}

export async function fetchAllPlanetPositions() {
  const names   = Object.keys(HORIZONS_IDS);
  const results = await Promise.allSettled(
    names.map(name => fetchPlanetPosition(name).then(pos => ({ name, pos })))
  );

  const positions = {};
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value.pos) {
      positions[r.value.name] = r.value.pos;
    }
  });
  return positions;
}

// ── Near-Earth Asteroids ───────────────────────────────────────────────────────

export async function fetchAsteroids() {
  const today = todayString();

  try {
    const res  = await fetch(`${NEOWS_URL}?start_date=${today}&end_date=${today}&api_key=${NASA_KEY}`);
    const data = await res.json();
    const raw  = data?.near_earth_objects?.[today] ?? [];

    return raw
      .map(a => {
        const approach = a.close_approach_data?.[0] ?? {};
        return {
          id:           a.id,
          name:         a.name.replace(/[()]/g, '').trim(),
          diameter:     parseFloat(a.estimated_diameter?.meters?.estimated_diameter_max ?? 0).toFixed(0),
          speed:        parseFloat(approach.relative_velocity?.kilometers_per_hour ?? 0).toFixed(0),
          missDistance: parseFloat(approach.miss_distance?.kilometers ?? 0).toFixed(0),
          hazardous:    a.is_potentially_hazardous_asteroid,
          url:          a.nasa_jpl_url,
        };
      })
      .sort((a, b) => parseFloat(a.missDistance) - parseFloat(b.missDistance))
      .slice(0, 12);

  } catch (err) {
    console.warn('NeoWs fetch failed:', err);
    return [];
  }
}