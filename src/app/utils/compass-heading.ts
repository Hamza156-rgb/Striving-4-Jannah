/**
 * Best-effort compass heading (degrees clockwise from true north, 0–360).
 * - iOS: `webkitCompassHeading`
 * - Android WebView / Chrome: often `alpha` when the phone is ~flat; `absolute` may still be false
 * - `AbsoluteOrientationSensor` (see below) is preferred on Chrome Android when available
 */
export function compassHeadingFromOrientation(e: DeviceOrientationEvent): number | null {
  const ext = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
  if (typeof ext.webkitCompassHeading === 'number' && !Number.isNaN(ext.webkitCompassHeading)) {
    return normalizeHeading(ext.webkitCompassHeading);
  }

  const a = e.alpha;
  if (a == null || Number.isNaN(a)) {
    return null;
  }

  const b = e.beta ?? 0;
  const g = e.gamma ?? 0;
  const roughlyFlat = Math.abs(b) < 65 && Math.abs(g) < 65;
  if (!roughlyFlat) {
    return null;
  }

  // Classic DeviceOrientation: alpha is rotation about Z; many browsers map compass to (360 − alpha)
  // when absolute is true. When absolute is false, some Android builds still fuse magnetometer into
  // alpha while flat — we use the same mapping so the needle can move instead of staying null.
  return normalizeHeading(360 - a);
}

/**
 * W3C AbsoluteOrientationSensor: quaternion list is [x, y, z, w] (vector then scalar).
 * Build the 3×3 rotation matrix (W3C orientation-sensor §7.2), then take azimuth the same way
 * Android uses for `SensorManager.getOrientation` (atan2 of R[1], R[4] in row-major layout).
 */
export function compassHeadingFromQuaternionXYZW(
  x: number,
  y: number,
  z: number,
  w: number
): number | null {
  if ([x, y, z, w].some(v => typeof v !== 'number' || Number.isNaN(v))) {
    return null;
  }
  const m11 = 1 - 2 * y * y - 2 * z * z;
  const m12 = 2 * x * y - 2 * z * w;
  const m22 = 1 - 2 * x * x - 2 * z * z;
  const rad = Math.atan2(m12, m22);
  return normalizeHeading((rad * 180) / Math.PI);
}

function normalizeHeading(h: number): number {
  return ((h % 360) + 360) % 360;
}

/** iOS 13+ Safari / WebKit: must be called from a user gesture before listening to deviceorientation. */
export async function requestDeviceOrientationPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  const ctor = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<'granted' | 'denied'>;
  };
  if (typeof ctor.requestPermission !== 'function') {
    return 'unsupported';
  }
  try {
    const r = await ctor.requestPermission();
    return r === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/** Minimal typing for Chrome / Android WebView generic sensor API. */
export type AbsoluteOrientationSensorInstance = EventTarget & {
  quaternion: Float32Array | null;
  start(): Promise<void>;
  stop(): void;
  addEventListener(type: 'reading' | 'error', listener: (this: unknown, ev: Event) => void): void;
  removeEventListener(type: 'reading' | 'error', listener: (this: unknown, ev: Event) => void): void;
};

export type AbsoluteOrientationSensorCtor = new (opts?: {
  frequency?: number;
}) => AbsoluteOrientationSensorInstance;

export function getAbsoluteOrientationSensorConstructor(): AbsoluteOrientationSensorCtor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const w = window as unknown as { AbsoluteOrientationSensor?: AbsoluteOrientationSensorCtor };
  return w.AbsoluteOrientationSensor ?? null;
}
