/** Approximate coordinates of the Kaaba (Masjid al-Haram), degrees. */
const KAABA_LAT = 21.422487;
const KAABA_LON = 39.826206;

/**
 * Initial (forward) bearing from a point on Earth to the Kaaba, clockwise from true north, 0–360°.
 */
export function bearingToKaabaDeg(latDeg: number, lonDeg: number): number {
  const φ1 = (latDeg * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δλ = ((KAABA_LON - lonDeg) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = (Math.atan2(y, x) * 180) / Math.PI;
  return (θ + 360) % 360;
}

export function normalizeDeg(d: number): number {
  return ((d % 360) + 360) % 360;
}
