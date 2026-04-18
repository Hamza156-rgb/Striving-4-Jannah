import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { PrayerService, PrayerTimes } from '../../services/prayer.service';
import { QuranService, Surah } from '../../services/quran.service';
import { HadithService, Hadith } from '../../services/hadith.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  currentTime = new Date();
  prayerTimes: PrayerTimes | null = null;
  nextPrayer: any = null;
  currentPrayer = '';
  dailyVerse: any = null;
  dailyHadith: Hadith | null = null;
  private subs: Subscription[] = [];

  islamicGreeting = 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ';
  basmala = 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ';

  quickLinks = [
    { label: 'Al-Fatiha', icon: '📖', route: '/quran/1' },
    { label: 'Al-Kahf', icon: '🕌', route: '/quran/18' },
    { label: 'Yaseen', icon: '⭐', route: '/quran/36' },
    { label: 'Al-Mulk', icon: '🌙', route: '/quran/67' }
  ];

  prayerIcons: Record<string, string> = {
    Fajr: '🌅', Sunrise: '☀️', Dhuhr: '🌞', Asr: '🌤', Maghrib: '🌇', Isha: '🌙'
  };

  constructor(
    private prayerService: PrayerService,
    private quranService: QuranService,
    private hadithService: HadithService,
    private settings: SettingsService
  ) {}

  ngOnInit() {
    this.subs.push(
      this.prayerService.currentTime$.subscribe(t => this.currentTime = t)
    );
    this.loadData();
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  loadData() {
    const s = this.settings.get();

    // Load prayer times
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          this.prayerService.getPrayerTimesByCoords(pos.coords.latitude, pos.coords.longitude, s.calculationMethod)
            .subscribe(pt => {
              this.prayerTimes = pt;
              this.nextPrayer = this.prayerService.getNextPrayer(pt);
              this.currentPrayer = this.prayerService.getCurrentPrayer(pt);
            });
        },
        () => this.loadByCity(s)
      );
    } else {
      this.loadByCity(s);
    }

    // Load daily verse (Al-Fatiha Ayah 1 as daily verse)
    this.quranService.getSurahWithTranslation(1, 'english').subscribe(d => {
      if (d.ayahs.length > 1) {
        this.dailyVerse = d.ayahs[1];
        this.dailyVerse.surahName = 'Al-Fatiha';
      }
    });

    // Load hadith
    this.subs.push(
      this.hadithService.getRandomHadith().subscribe(h => {
        this.dailyHadith = h;
      })
    );
  }

  private loadByCity(s: any) {
    this.prayerService.getPrayerTimesByCity(s.city, s.country, s.calculationMethod)
      .subscribe(pt => {
        this.prayerTimes = pt;
        this.nextPrayer = this.prayerService.getNextPrayer(pt);
        this.currentPrayer = this.prayerService.getCurrentPrayer(pt);
      });
  }

  get hijriDate(): string {
    return this.prayerTimes?.hijriDate || '';
  }

  get formattedTime(): string {
    return this.currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  get formattedDate(): string {
    return this.currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  getPrayerList() {
    if (!this.prayerTimes) return [];
    return [
      { name: 'Fajr', time: this.prayerTimes.Fajr },
      { name: 'Dhuhr', time: this.prayerTimes.Dhuhr },
      { name: 'Asr', time: this.prayerTimes.Asr },
      { name: 'Maghrib', time: this.prayerTimes.Maghrib },
      { name: 'Isha', time: this.prayerTimes.Isha }
    ];
  }
}
