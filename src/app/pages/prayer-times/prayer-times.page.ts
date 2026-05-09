import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonRefresher, IonRefresherContent,
  IonSpinner, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { PrayerService, PrayerTimes } from '../../services/prayer.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-prayer-times',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonRefresher, IonRefresherContent, IonSpinner, IonItem, IonLabel, IonInput,
    IonSelect, IonSelectOption],
  templateUrl: './prayer-times.page.html',
  styleUrls: ['./prayer-times.page.scss']
})
export class PrayerTimesPage implements OnInit, OnDestroy {
  prayerTimes: PrayerTimes | null = null;
  currentTime = new Date();
  loading = true;
  locationLoading = false;
  currentPrayer = '';
  nextPrayer: any = null;
  city = '';
  country = '';
  useLocation = false;
  error = '';
  methods: any[] = [];
  selectedMethod = 3;
  private subs: Subscription[] = [];

  prayerConfig = [
    { key: 'Fajr', arabic: 'الفجر', icon: '🌅', color: '#8b9dc3' },
    { key: 'Sunrise', arabic: 'الشروق', icon: '☀️', color: '#e8c97a' },
    { key: 'Dhuhr', arabic: 'الظهر', icon: '🌞', color: '#f4a261' },
    { key: 'Asr', arabic: 'العصر', icon: '🌤', color: '#e76f51' },
    { key: 'Maghrib', arabic: 'المغرب', icon: '🌇', color: '#e07a5f' },
    { key: 'Isha', arabic: 'العشاء', icon: '🌙', color: '#9b72cf' }
  ];

  constructor(private prayerService: PrayerService, private settings: SettingsService) {}

  ngOnInit() {
    const s = this.settings.get();
    this.city = s.city; this.country = s.country; this.selectedMethod = s.calculationMethod;
    this.methods = this.settings.getCalculationMethods();
    this.subs.push(this.prayerService.currentTime$.subscribe(t => this.currentTime = t));
    this.loadByCity();
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  loadByCity(event?: any) {
    this.loading = true; this.error = '';
    this.prayerService.getPrayerTimesByCity(this.city, this.country, this.selectedMethod, this.settings.get().asrSchool).subscribe({
      next: pt => {
        this.prayerTimes = pt;
        this.currentPrayer = this.prayerService.getCurrentPrayer(pt);
        this.nextPrayer = this.prayerService.getNextPrayer(pt);
        this.loading = false;
        if (event) event.target.complete();
      },
      error: () => { this.error = 'Could not load prayer times. Check city/country.'; this.loading = false; if (event) event.target.complete(); }
    });
  }

  loadByGPS() {
    this.locationLoading = true;
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.prayerService.getPrayerTimesByCoords(pos.coords.latitude, pos.coords.longitude, this.selectedMethod, this.settings.get().asrSchool).subscribe(pt => {
          this.prayerTimes = pt;
          this.currentPrayer = this.prayerService.getCurrentPrayer(pt);
          this.nextPrayer = this.prayerService.getNextPrayer(pt);
          this.locationLoading = false; this.loading = false;
        });
      },
      () => { this.locationLoading = false; this.loadByCity(); }
    );
  }

  updateMethod() { this.settings.update({ calculationMethod: this.selectedMethod }); this.loadByCity(); }
  updateCity() { this.settings.update({ city: this.city, country: this.country }); this.loadByCity(); }

  getPrayerTime(key: string): string {
    if (!this.prayerTimes) return '--:--';
    return (this.prayerTimes as any)[key] || '--:--';
  }

  isActive(key: string): boolean { return key === this.currentPrayer; }
  isNext(key: string): boolean { return key === this.nextPrayer?.name; }

  get formattedTime() {
    return this.currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  }

  dhikrList = [
    { arabic: 'سُبْحَانَ اللَّهِ', english: 'Glory be to Allah', count: 33 },
    { arabic: 'الْحَمْدُ لِلَّهِ', english: 'All praise be to Allah', count: 33 },
    { arabic: 'اللَّهُ أَكْبَرُ', english: 'Allah is the Greatest', count: 33 },
    { arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', english: 'There is no god but Allah', count: 1 }
  ];
}

// dhikr list (add as class property)
// (already in template, add to class body)
