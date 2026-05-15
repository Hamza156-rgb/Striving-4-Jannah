import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import type { ViewWillEnter, ViewWillLeave } from '@ionic/angular/common';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ToastController
} from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { bearingToKaabaDeg, normalizeDeg } from '../../utils/qibla-bearing';
import {
  compassHeadingFromOrientation,
  compassHeadingFromQuaternionXYZW,
  getAbsoluteOrientationSensorConstructor,
  requestDeviceOrientationPermission,
  type AbsoluteOrientationSensorInstance
} from '../../utils/compass-heading';
import { PrayerService } from '../../services/prayer.service';
import { SettingsService } from '../../services/settings.service';
import { cardinal8Long, cardinal8Short } from '../../utils/bearing-cardinal';

@Component({
  selector: 'app-qibla',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonIcon
  ],
  templateUrl: './qibla.page.html',
  styleUrls: ['./qibla.page.scss']
})
export class QiblaPage implements OnDestroy, ViewWillEnter, ViewWillLeave {
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastCtrl = inject(ToastController);
  private readonly prayer = inject(PrayerService);
  private readonly settings = inject(SettingsService);

  lat: number | null = null;
  lng: number | null = null;
  /** How we obtained coordinates: GPS or saved city in Settings. */
  locationSource: 'gps' | 'settings' | null = null;
  /** e.g. "Lahore, Pk" when using Settings fallback. */
  locationCaption = '';
  qiblaBearing: number | null = null;
  /** Clockwise from top of screen (device facing) to Kaaba; null if no compass. */
  needleDeg: number | null = null;
  deviceHeading: number | null = null;
  locationError = '';
  compassActive = false;
  compassDenied = false;
  locationLoading = false;
  /** Tear down compass: AbsoluteOrientationSensor and/or DOM listeners. */
  private compassStopFns: (() => void)[] = [];
  /** Prevents duplicate DOM orientation listeners when the sensor errors and falls back. */
  private domCompassAttached = false;
  private rafId = 0;
  /** GPS watch for live position → updated Qibla bearing while on this screen (native + web). */
  private capGeoWatchId: string | null = null;
  private webGeoWatchId: number | null = null;

  /** Major tick angles on dial (degrees clockwise from north at top). */
  readonly degreeMajorTicks = [0, 45, 90, 135, 180, 225, 270, 315];

  get bearingLabel(): string {
    if (this.qiblaBearing == null) return '—';
    return `${Math.round(this.qiblaBearing)}°`;
  }

  get staticArrowDeg(): number {
    if (this.qiblaBearing == null) return 0;
    return normalizeDeg(this.qiblaBearing);
  }

  get cardinalShort(): string {
    if (this.qiblaBearing == null) {
      return '';
    }
    return cardinal8Short(this.qiblaBearing);
  }

  get cardinalLong(): string {
    if (this.qiblaBearing == null) {
      return '';
    }
    return cardinal8Long(this.qiblaBearing);
  }

  ionViewWillEnter(): void {
    this.refreshLocation();
  }

  ionViewWillLeave(): void {
    this.stopLocationWatch();
    this.stopCompass();
  }

  ngOnDestroy(): void {
    this.stopLocationWatch();
    this.stopCompass();
  }

  async refreshLocation(): Promise<void> {
    this.stopLocationWatch();
    this.locationLoading = true;
    this.locationError = '';
    this.locationSource = null;
    this.locationCaption = '';
    this.cdr.markForCheck();

    let ok = false;

    try {
      const coords = await this.getGpsCoords();
      this.applyCoords(coords.latitude, coords.longitude, 'gps');
      ok = true;
    } catch {
      // GPS denied, timeout, or unavailable
    }

    if (!ok) {
      const s = this.settings.get();
      const city = (s.city || '').trim();
      const country = (s.country || '').trim();
      if (city && country) {
        try {
          const { lat, lng } = await firstValueFrom(this.prayer.resolveCoordinatesByCity(city, country));
          this.applyCoords(lat, lng, 'settings', `${city}, ${country}`);
          ok = true;
        } catch {
          /* geocode failed */
        }
      }
    }

    if (!ok) {
      this.lat = null;
      this.lng = null;
      this.qiblaBearing = null;
      this.needleDeg = null;
      this.locationError =
        'Could not use GPS. Allow location for on-the-spot Qibla, or set city and country in Settings (tap Save Location), then open this page again.';
    } else if (this.locationSource === 'gps') {
      this.startLocationWatchFromGps();
    }

    this.locationLoading = false;
    this.cdr.markForCheck();
  }

  private applyCoords(latitude: number, longitude: number, source: 'gps' | 'settings', caption = ''): void {
    this.lat = latitude;
    this.lng = longitude;
    this.qiblaBearing = bearingToKaabaDeg(latitude, longitude);
    this.locationSource = source;
    this.locationCaption = caption;
    this.updateNeedle();
  }

  /** Keep Qibla bearing in sync with GPS while this page is open (no backend). */
  private startLocationWatchFromGps(): void {
    this.stopLocationWatch();
    if (Capacitor.isNativePlatform()) {
      void Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          maximumAge: 4000,
          timeout: 20000,
          interval: 6000,
          minimumUpdateInterval: 5000
        },
        (pos, err) => {
          if (err || !pos?.coords) {
            return;
          }
          this.zone.run(() => {
            if (this.locationSource !== 'gps') {
              return;
            }
            const { latitude, longitude } = pos.coords;
            this.lat = latitude;
            this.lng = longitude;
            this.qiblaBearing = bearingToKaabaDeg(latitude, longitude);
            this.updateNeedle();
            this.cdr.markForCheck();
          });
        }
      ).then(id => {
        this.capGeoWatchId = id;
      });
      return;
    }
    if (navigator.geolocation) {
      this.webGeoWatchId = navigator.geolocation.watchPosition(
        pos => {
          this.zone.run(() => {
            if (this.locationSource !== 'gps') {
              return;
            }
            this.lat = pos.coords.latitude;
            this.lng = pos.coords.longitude;
            this.qiblaBearing = bearingToKaabaDeg(pos.coords.latitude, pos.coords.longitude);
            this.updateNeedle();
            this.cdr.markForCheck();
          });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 8000, timeout: 20000 }
      );
    }
  }

  private stopLocationWatch(): void {
    if (this.webGeoWatchId != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.webGeoWatchId);
      this.webGeoWatchId = null;
    }
    if (this.capGeoWatchId != null) {
      void Geolocation.clearWatch({ id: this.capGeoWatchId })
        .then(() => {})
        .catch(() => {});
      this.capGeoWatchId = null;
    }
  }

  private async getGpsCoords(): Promise<{ latitude: number; longitude: number }> {
    if (Capacitor.isNativePlatform()) {
      const perm = await Geolocation.requestPermissions();
      if (perm.location === 'denied') {
        throw new Error('denied');
      }
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000 });
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    }
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('no api'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => reject(new Error('geo')),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
      );
    });
  }

  async enableCompass(): Promise<void> {
    const perm = await requestDeviceOrientationPermission();
    if (perm === 'denied') {
      this.compassDenied = true;
      await this.toastCtrl
        .create({ message: 'Motion access was denied. You can still use the angle from north below.', duration: 3500 })
        .then(t => t.present());
      this.cdr.markForCheck();
      return;
    }
    this.compassDenied = false;
    await this.startCompass();
  }

  /**
   * Prefer AbsoluteOrientationSensor (Chrome / Android WebView): true compass-style updates.
   * Fallback: deviceorientation + deviceorientationabsolute with relaxed `absolute` handling.
   */
  private async startCompass(): Promise<void> {
    if (typeof window === 'undefined' || !window.addEventListener) {
      return;
    }
    this.stopCompass();

    const Ctor = getAbsoluteOrientationSensorConstructor();
    if (Ctor) {
      let sensor: AbsoluteOrientationSensorInstance | null = null;
      try {
        sensor = new Ctor({ frequency: 25 });
        const sensorInst = sensor;
        let sensorFallbackScheduled = false;
        const onReading = () => {
          const q = sensorInst.quaternion;
          if (!q || q.length < 4) {
            return;
          }
          const h = compassHeadingFromQuaternionXYZW(q[0], q[1], q[2], q[3]);
          this.scheduleHeadingUpdate(h);
        };
        const onError = () => {
          if (sensorFallbackScheduled) {
            return;
          }
          sensorFallbackScheduled = true;
          this.stopCompass();
          this.beginDomOrientationCompass();
        };
        sensorInst.addEventListener('reading', onReading);
        sensorInst.addEventListener('error', onError);
        this.compassStopFns.push(() =>
          this.teardownAbsoluteOrientationSensor(sensorInst, onReading, onError)
        );
        await sensorInst.start();
        this.compassActive = true;
        this.cdr.markForCheck();
        return;
      } catch {
        this.teardownAbsoluteOrientationSensor(sensor, () => {}, () => {});
      }
    }

    this.beginDomOrientationCompass();
  }

  private teardownAbsoluteOrientationSensor(
    sensor: AbsoluteOrientationSensorInstance | null,
    onReading: () => void,
    onError: () => void
  ): void {
    if (!sensor) {
      return;
    }
    try {
      sensor.removeEventListener('reading', onReading);
      sensor.removeEventListener('error', onError);
    } catch {
      /* ignore */
    }
    try {
      sensor.stop();
    } catch {
      /* ignore */
    }
  }

  private beginDomOrientationCompass(): void {
    if (this.domCompassAttached) {
      return;
    }
    this.domCompassAttached = true;
    const handler = (e: DeviceOrientationEvent) => {
      const h = compassHeadingFromOrientation(e);
      this.scheduleHeadingUpdate(h);
    };
    window.addEventListener('deviceorientationabsolute', handler, true);
    window.addEventListener('deviceorientation', handler, true);
    this.compassStopFns.push(() => {
      window.removeEventListener('deviceorientationabsolute', handler, true);
      window.removeEventListener('deviceorientation', handler, true);
    });
    this.compassActive = true;
    this.cdr.markForCheck();
  }

  private scheduleHeadingUpdate(h: number | null): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.zone.run(() => {
        this.deviceHeading = h;
        this.updateNeedle();
        this.cdr.markForCheck();
      });
    });
  }

  private stopCompass(): void {
    this.domCompassAttached = false;
    for (const fn of this.compassStopFns) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
    this.compassStopFns = [];
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.compassActive = false;
    this.deviceHeading = null;
    this.needleDeg = null;
    this.cdr.markForCheck();
  }

  private updateNeedle(): void {
    if (this.qiblaBearing == null) {
      this.needleDeg = null;
      return;
    }
    if (this.deviceHeading == null) {
      this.needleDeg = null;
      return;
    }
    this.needleDeg = normalizeDeg(this.qiblaBearing - this.deviceHeading);
  }
}
