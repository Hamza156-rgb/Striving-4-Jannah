/** Normalize to [0, 360). */
function norm(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

const CARDINAL_8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

const CARDINAL_8_NAMES: Record<(typeof CARDINAL_8)[number], string> = {
  N: 'North',
  NE: 'Northeast',
  E: 'East',
  SE: 'Southeast',
  S: 'South',
  SW: 'Southwest',
  W: 'West',
  NW: 'Northwest'
};

/** 8-point compass label (e.g. W, SW) from bearing clockwise from north. */
export function cardinal8FromBearing(deg: number): (typeof CARDINAL_8)[number] {
  const d = norm(deg);
  const idx = Math.floor((d + 22.5) / 45) % 8;
  return CARDINAL_8[idx];
}

export function cardinal8Short(deg: number): string {
  return cardinal8FromBearing(deg);
}

export function cardinal8Long(deg: number): string {
  return CARDINAL_8_NAMES[cardinal8FromBearing(deg)];
}
