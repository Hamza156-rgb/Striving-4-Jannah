import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, BehaviorSubject, interval, throwError } from 'rxjs';

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  date: string;
  location: string;
  hijriDate?: string;
}

export interface Location {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
}

@Injectable({ providedIn: 'root' })
export class PrayerService {
  private base = 'https://api.aladhan.com/v1';
  currentTime$ = new BehaviorSubject<Date>(new Date());

  constructor(private http: HttpClient) {
    interval(1000).subscribe(() => this.currentTime$.next(new Date()));
  }

  getPrayerTimesByCoords(lat: number, lng: number, method: number = 3, school: 0 | 1 = 1): Observable<PrayerTimes> {
    const today = new Date();
    const date = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
    return this.http.get<any>(
      `${this.base}/timings/${date}?latitude=${lat}&longitude=${lng}&method=${method}&school=${school}`
    ).pipe(
      map(r => ({
        Fajr: r.data.timings.Fajr,
        Sunrise: r.data.timings.Sunrise,
        Dhuhr: r.data.timings.Dhuhr,
        Asr: r.data.timings.Asr,
        Maghrib: r.data.timings.Maghrib,
        Isha: r.data.timings.Isha,
        date: r.data.date.readable,
        location: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
        hijriDate: `${r.data.date.hijri.day} ${r.data.date.hijri.month.en} ${r.data.date.hijri.year} AH`
      }))
    );
  }

  /**
   * Resolve saved city + country to coordinates (for Qibla, etc.).
   * Uses Open-Meteo geocoding (no API key). Use a 2-letter country code (e.g. PK) or full country name.
   */
  resolveCoordinatesByCity(city: string, country: string): Observable<{ lat: number; lng: number }> {
    const c = city.trim();
    const cc = country.trim();
    if (!c || !cc) {
      return throwError(() => new Error('invalid city/country'));
    }
    const params = new URLSearchParams({ name: c, count: '1' });
    if (/^[A-Za-z]{2}$/.test(cc)) {
      params.set('countryCode', cc.toUpperCase());
    } else {
      params.set('country', cc);
    }
    const url = `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
    return this.http.get<{ results?: { latitude: number; longitude: number }[] }>(url).pipe(
      map(r => {
        const row = r.results?.[0];
        if (row && typeof row.latitude === 'number' && typeof row.longitude === 'number') {
          return { lat: row.latitude, lng: row.longitude };
        }
        throw new Error('city not found');
      })
    );
  }

  getPrayerTimesByCity(city: string, country: string, method: number = 3, school: 0 | 1 = 1): Observable<PrayerTimes> {
    const today = new Date();
    const date = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
    return this.http.get<any>(
      `${this.base}/timingsByCity/${date}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}&school=${school}`
    ).pipe(
      map(r => ({
        Fajr: r.data.timings.Fajr,
        Sunrise: r.data.timings.Sunrise,
        Dhuhr: r.data.timings.Dhuhr,
        Asr: r.data.timings.Asr,
        Maghrib: r.data.timings.Maghrib,
        Isha: r.data.timings.Isha,
        date: r.data.date.readable,
        location: `${city}, ${country}`,
        hijriDate: `${r.data.date.hijri.day} ${r.data.date.hijri.month.en} ${r.data.date.hijri.year} AH`
      }))
    );
  }

  getNextPrayer(times: PrayerTimes): { name: string; time: string; timeLeft: string } {
    const prayers = [
      { name: 'Fajr', time: times.Fajr },
      { name: 'Dhuhr', time: times.Dhuhr },
      { name: 'Asr', time: times.Asr },
      { name: 'Maghrib', time: times.Maghrib },
      { name: 'Isha', time: times.Isha }
    ];
    const now = new Date();
    for (const p of prayers) {
      const [h, m] = p.time.split(':').map(Number);
      const pDate = new Date(); pDate.setHours(h, m, 0, 0);
      if (pDate > now) {
        const diff = pDate.getTime() - now.getTime();
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return { name: p.name, time: p.time, timeLeft: hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m` };
      }
    }
    return { name: 'Fajr', time: times.Fajr, timeLeft: 'Tomorrow' };
  }

  getCurrentPrayer(times: PrayerTimes): string {
    const prayers = [
      { name: 'Fajr', time: times.Fajr },
      { name: 'Sunrise', time: times.Sunrise },
      { name: 'Dhuhr', time: times.Dhuhr },
      { name: 'Asr', time: times.Asr },
      { name: 'Maghrib', time: times.Maghrib },
      { name: 'Isha', time: times.Isha }
    ];
    const now = new Date();
    let current = 'Isha';
    for (const p of prayers) {
      const [h, m] = p.time.split(':').map(Number);
      const pDate = new Date(); pDate.setHours(h, m, 0, 0);
      if (now >= pDate) current = p.name;
    }
    return current;
  }
}
