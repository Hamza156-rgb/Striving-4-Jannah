import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppSettings {
  language: 'arabic' | 'english' | 'urdu';
  calculationMethod: number;
  /** AlAdhan `school`: 0 = Shafi/Maliki (earlier Asr), 1 = Hanafi (later Asr) */
  asrSchool: 0 | 1;
  city: string;
  country: string;
  theme: 'dark';
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private defaults: AppSettings = {
    language: 'english',
    calculationMethod: 3,
    asrSchool: 1,
    city: 'Makkah',
    country: 'SA',
    theme: 'dark'
  };

  private settings$ = new BehaviorSubject<AppSettings>(this.load());
  settings = this.settings$.asObservable();

  private load(): AppSettings {
    try {
      const s = localStorage.getItem('noor_settings');
      return s ? { ...this.defaults, ...JSON.parse(s) } : { ...this.defaults };
    } catch { return { ...this.defaults }; }
  }

  get(): AppSettings { return this.settings$.value; }

  update(partial: Partial<AppSettings>) {
    const next = { ...this.settings$.value, ...partial };
    localStorage.setItem('noor_settings', JSON.stringify(next));
    this.settings$.next(next);
  }

  getCalculationMethods() {
    return [
      { id: 1, name: 'University of Islamic Sciences, Karachi' },
      { id: 2, name: 'Islamic Society of North America (ISNA)' },
      { id: 3, name: 'Muslim World League' },
      { id: 4, name: 'Umm al-Qura, Makkah' },
      { id: 5, name: 'Egyptian General Authority of Survey' },
      { id: 7, name: 'Institute of Geophysics, University of Tehran' },
      { id: 8, name: 'Gulf Region' },
      { id: 9, name: 'Kuwait' },
      { id: 10, name: 'Qatar' },
      { id: 11, name: 'Majlis Ugama Islam Singapura' },
      { id: 15, name: 'Spiritual Administration of Muslims of Russia' }
    ];
  }
}
