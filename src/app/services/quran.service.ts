import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  translation?: string;
}

export interface SurahDetail {
  surah: Surah;
  ayahs: Ayah[];
}

@Injectable({ providedIn: 'root' })
export class QuranService {
  private base = 'https://api.alquran.cloud/v1';

  constructor(private http: HttpClient) {}

  getSurahs(): Observable<Surah[]> {
    return this.http.get<any>(`${this.base}/surah`).pipe(
      map(r => (Array.isArray(r?.data) ? r.data : []) as Surah[])
    );
  }

  getSurahWithTranslation(surahNum: number, lang: string): Observable<SurahDetail> {
    const editionMap: Record<string, string> = {
      arabic: 'quran-uthmani',
      english: 'en.asad',
      urdu: 'ur.maududi'
    };
    const translationEdition = editionMap[lang] || 'en.asad';

    if (lang === 'arabic') {
      return this.http.get<any>(`${this.base}/surah/${surahNum}/quran-uthmani`).pipe(
        map(r => ({
          surah: r.data,
          ayahs: r.data.ayahs.map((a: any) => ({
            number: a.number, numberInSurah: a.numberInSurah, text: a.text, translation: ''
          }))
        }))
      );
    }

    return forkJoin([
      this.http.get<any>(`${this.base}/surah/${surahNum}/quran-uthmani`),
      this.http.get<any>(`${this.base}/surah/${surahNum}/${translationEdition}`)
    ]).pipe(
      map(([arabic, trans]) => ({
        surah: arabic.data,
        ayahs: arabic.data.ayahs.map((a: any, i: number) => ({
          number: a.number, numberInSurah: a.numberInSurah,
          text: a.text, translation: trans.data.ayahs[i]?.text || ''
        }))
      }))
    );
  }
}
