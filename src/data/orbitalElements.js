// Keplerian orbital elements for each planet
// Values are for the J2000.0 epoch (January 1.5, 2000)
// Source: NASA JPL Planetary Fact Sheets
//
// a    = semi-major axis (AU)
// e    = eccentricity
// i    = inclination (degrees)
// Omega = longitude of ascending node (degrees)
// omega = argument of perihelion (degrees)
// M0   = mean anomaly at epoch J2000 (degrees)
// n    = mean motion (degrees/day) — derived from orbital period

export const ORBITAL_ELEMENTS = {
  Mercury: { a: 0.38710,  e: 0.20563, i: 7.005,  Omega: 48.331,  omega: 29.125,  M0: 174.796, n: 4.09233 },
  Venus:   { a: 0.72333,  e: 0.00677, i: 3.395,  Omega: 76.680,  omega: 54.884,  M0: 50.416,  n: 1.60213 },
  Earth:   { a: 1.00000,  e: 0.01671, i: 0.000,  Omega: 0.000,   omega: 102.937, M0: 357.528, n: 0.98561 },
  Mars:    { a: 1.52366,  e: 0.09341, i: 1.850,  Omega: 49.558,  omega: 286.502, M0: 19.373,  n: 0.52403 },
  Jupiter: { a: 5.20336,  e: 0.04839, i: 1.303,  Omega: 100.464, omega: 273.867, M0: 20.020,  n: 0.08309 },
  Saturn:  { a: 9.53707,  e: 0.05415, i: 2.489,  Omega: 113.665, omega: 339.392, M0: 317.021, n: 0.03346 },
  Uranus:  { a: 19.1913,  e: 0.04717, i: 0.773,  Omega: 74.006,  omega: 96.999,  M0: 142.238, n: 0.01172 },
  Neptune: { a: 30.0690,  e: 0.00859, i: 1.770,  Omega: 131.784, omega: 273.187, M0: 256.228, n: 0.00600 },
};

// J2000 epoch as a JavaScript Date
export const J2000 = new Date('2000-01-01T12:00:00Z');