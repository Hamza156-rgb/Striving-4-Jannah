import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { Observable, Subscription, finalize } from 'rxjs';
import { PrayerService, PrayerTimes } from '../../services/prayer.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-prayer-times',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption
  ],
  templateUrl: './prayer-times.page.html',
  styleUrls: ['./prayer-times.page.scss']
})
export class PrayerTimesPage implements OnInit, OnDestroy {
  prayerTimes: PrayerTimes | null = null;
  currentTime = new Date();
  loading = true;
  locationLoading = false;
  currentPrayer = '';
  nextPrayer: { name: string; time: string; timeLeft: string } | null = null;
  city = '';
  country = '';
  useLocation = false;
  error = '';
  methods: { id: number; name: string }[] = [];
  selectedMethod = 3;
  private subs: Subscription[] = [];
  private inflight: Subscription | null = null;
  /** Bumps when a new load starts so a stale request’s `finalize` cannot clear a newer load’s loading state. */
  private loadGeneration = 0;
  private lastCoords: { lat: number; lng: number } | null = null;

  prayerConfig = [
    { key: 'Fajr', arabic: 'الفجر', icon: '🌅', color: '#8b9dc3' },
    { key: 'Sunrise', arabic: 'الشروق', icon: '☀️', color: '#e8c97a' },
    { key: 'Dhuhr', arabic: 'الظهر', icon: '🌞', color: '#f4a261' },
    { key: 'Asr', arabic: 'العصر', icon: '🌤', color: '#e76f51' },
    { key: 'Maghrib', arabic: 'المغرب', icon: '🌇', color: '#e07a5f' },
    { key: 'Isha', arabic: 'العشاء', icon: '🌙', color: '#9b72cf' }
  ];

  constructor(
    private prayerService: PrayerService,
    private settings: SettingsService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const s = this.settings.get();
    this.city = s.city;
    this.country = s.country;
    this.selectedMethod = s.calculationMethod;
    this.methods = this.settings.getCalculationMethods();
    this.subs.push(this.prayerService.currentTime$.subscribe(t => (this.currentTime = t)));
    this.tryGeolocationThenCity();
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.cancelInflight();
  }

  private cancelInflight(): void {
    this.inflight?.unsubscribe();
    this.inflight = null;
  }

  /**
   * One in-flight HTTP load; cancel previous; always clear loading for the *current* generation only.
   */
  private runPrayerLoad(
    stream$: Observable<PrayerTimes>,
    opts: {
      fromCoords: boolean;
      coords?: { lat: number; lng: number };
      refresher?: { target?: { complete: () => void } };
    }
  ): void {
    this.cancelInflight();
    const gen = ++this.loadGeneration;
    this.loading = true;
    this.error = '';
    this.inflight = stream$
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            if (gen === this.loadGeneration) {
              this.loading = false;
              this.locationLoading = false;
              opts.refresher?.target?.complete();
              this.cdr.markForCheck();
            }
          });
        })
      )
      .subscribe({
        next: pt => {
          this.ngZone.run(() => {
            if (gen !== this.loadGeneration) {
              return;
            }
            if (opts.fromCoords && opts.coords) {
              this.lastCoords = opts.coords;
              this.useLocation = true;
            } else {
              this.lastCoords = null;
              this.useLocation = false;
            }
            this.prayerTimes = pt;
            this.currentPrayer = this.prayerService.getCurrentPrayer(pt);
            this.nextPrayer = this.prayerService.getNextPrayer(pt);
            this.loading = false;
            this.locationLoading = false;
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            if (gen !== this.loadGeneration) {
              return;
            }
            this.prayerTimes = null;
            this.error = opts.fromCoords
              ? 'Could not load times for your location. Try city and country below.'
              : 'Could not load prayer times. Check city and country.';
            this.loading = false;
            this.locationLoading = false;
            this.cdr.markForCheck();
          });
        }
      });
  }

  private applyFromCoords(lat: number, lng: number, refresher?: { target?: { complete: () => void } }): void {
    this.runPrayerLoad(
      this.prayerService.getPrayerTimesByCoords(
        lat,
        lng,
        this.selectedMethod,
        this.settings.get().asrSchool
      ),
      { fromCoords: true, coords: { lat, lng }, refresher }
    );
  }

  private tryGeolocationThenCity(): void {
    if (!navigator.geolocation) {
      this.loadByCity();
      return;
    }
    this.loading = true;
    this.error = '';
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.ngZone.run(() => {
          this.applyFromCoords(pos.coords.latitude, pos.coords.longitude);
        });
      },
      () => this.ngZone.run(() => this.loadByCity()),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  }

  loadByCity(event?: { target?: { complete: () => void } }): void {
    this.runPrayerLoad(
      this.prayerService.getPrayerTimesByCity(
        this.city,
        this.country,
        this.selectedMethod,
        this.settings.get().asrSchool
      ),
      { fromCoords: false, refresher: event }
    );
  }

  loadByGPS(): void {
    if (!navigator.geolocation) {
      this.loadByCity();
      return;
    }
    this.locationLoading = true;
    this.loading = true;
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.ngZone.run(() => {
          this.applyFromCoords(pos.coords.latitude, pos.coords.longitude);
        });
      },
      () => {
        this.ngZone.run(() => {
          this.locationLoading = false;
          this.loadByCity();
        });
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  }

  updateMethod(): void {
    this.settings.update({ calculationMethod: this.selectedMethod });
    if (this.lastCoords) {
      this.applyFromCoords(this.lastCoords.lat, this.lastCoords.lng);
    } else {
      this.loadByCity();
    }
  }

  updateCity(): void {
    this.lastCoords = null;
    this.useLocation = false;
    this.settings.update({ city: this.city, country: this.country });
    this.loadByCity();
  }

  getPrayerTime(key: string): string {
    if (!this.prayerTimes) {
      return '--:--';
    }
    return ((this.prayerTimes as unknown) as Record<string, string>)[key] || '--:--';
  }

  isActive(key: string): boolean {
    return key === this.currentPrayer;
  }

  isNext(key: string): boolean {
    return key === this.nextPrayer?.name;
  }

  get formattedTime(): string {
    return this.currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  dhikrList = [
    { arabic: 'سُبْحَانَ اللَّهِ', english: 'Glory be to Allah', count: 33 },
    { arabic: 'الْحَمْدُ لِلَّهِ', english: 'All praise be to Allah', count: 33 },
    { arabic: 'اللَّهُ أَكْبَرُ', english: 'Allah is the Greatest', count: 33 },
    { arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', english: 'There is no god but Allah', count: 1 }
  ];
}
