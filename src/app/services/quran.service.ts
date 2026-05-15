import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, shareReplay } from 'rxjs';

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

/** Chapter metadata for mushaf page navigation (islamic.app). */
export interface MushafChapter {
  id: number;
  nameSimple: string;
  nameArabic: string;
  translatedName: string;
  versesCount: number;
  pageStart: number;
  pageEnd: number;
  revelationPlace: string;
}

export interface MushafPageMeta {
  page: number;
  juz: number;
  juzLabel: string;
  surahId: number;
  surahNameAr: string;
}

export interface MushafVerse {
  id: number;
  verseNumber: number;
  verseKey: string;
  chapterId: number;
  juz: number;
  page: number;
  textUthmani: string;
}

export interface MushafPageContent {
  page: number;
  verses: MushafVerse[];
  juz: number;
  juzLabel: string;
  surahId: number;
  surahNameAr: string;
}

/** Juz opening phrases (Indo-Pak mushaf style headers). */
const JUZ_LABELS: Record<number, string> = {
  1: 'الم',
  2: 'سَيَقُولُ',
  3: 'تِلْكَ الرُّسُلُ',
  4: 'لَنْ تَنَالُوا',
  5: 'وَالْمُحْصَنَاتُ',
  6: 'لَا يُحِبُّ اللَّهُ',
  7: 'وَإِذَا سَمِعُوا',
  8: 'وَلَوْ أَنَّنَا',
  9: 'قَالَ الْمَلَأُ',
  10: 'وَاعْلَمُوا',
  11: 'يَعْتَذِرُونَ',
  12: 'وَمَا مِنْ دَابَّةٍ',
  13: 'وَمَا أُبَرِّئُ',
  14: 'رُبَمَا',
  15: 'سُبْحَانَ الَّذِي',
  16: 'قَالَ أَلَمْ',
  17: 'اقْتَرَبَ',
  18: 'قَدْ أَفْلَحَ',
  19: 'وَقَالَ الَّذِينَ',
  20: 'أَمَّنْ خَلَقَ',
  21: 'اتْلُ مَا أُوحِيَ',
  22: 'وَمَنْ يَقْنُتْ',
  23: 'وَمَا لِيَ',
  24: 'فَمَنْ أَظْلَمُ',
  25: 'إِلَيْهِ يُرَدُّ',
  26: 'حم',
  27: 'قَالَ فَمَا خَطْبُكُمْ',
  28: 'قَدْ سَمِعَ',
  29: 'تَبَارَكَ',
  30: 'عَمَّ'
};

@Injectable({ providedIn: 'root' })
export class QuranService {
  private base = 'https://api.alquran.cloud/v1';
  private islamicAppBase = 'https://api.islamic.app/v1';
  private mushafChapters$?: Observable<MushafChapter[]>;

  constructor(private http: HttpClient) {}

  getSurahs(): Observable<Surah[]> {
    return this.http.get<any>(`${this.base}/surah`).pipe(
      map(r => (Array.isArray(r?.data) ? r.data : []) as Surah[])
    );
  }

  /** Surahs with mushaf page ranges for 16-line / Indo-Pak page view. */
  getMushafChapters(): Observable<MushafChapter[]> {
    if (!this.mushafChapters$) {
      this.mushafChapters$ = this.http.get<any>(`${this.islamicAppBase}/chapters?language=en`).pipe(
        map(r => this.mapMushafChapters(r)),
        shareReplay(1)
      );
    }
    return this.mushafChapters$;
  }

  private mapMushafChapters(r: unknown): MushafChapter[] {
    const chapters = (r as { data?: { chapters?: unknown[] } })?.data?.chapters;
    if (!Array.isArray(chapters)) {
      return [];
    }
    return chapters.map((c: any) => ({
      id: c.id,
      nameSimple: c.name_simple,
      nameArabic: c.name_arabic,
      translatedName: c.translated_name?.name ?? c.name_simple,
      versesCount: c.verses_count,
      pageStart: c.pages?.[0] ?? 1,
      pageEnd: c.pages?.[1] ?? 1,
      revelationPlace: c.revelation_place === 'makkah' ? 'Meccan' : 'Medinan'
    })) as MushafChapter[];
  }

  mushafPageImageUrl(page: number, width = 900): string {
    const p = Math.min(604, Math.max(1, page));
    return `${this.islamicAppBase}/mushaf/page/${p}.svg?font=indopak&theme=light&width=${width}`;
  }

  getMushafPageContent(page: number): Observable<MushafPageContent> {
    const p = Math.min(604, Math.max(1, page));
    return forkJoin([
      this.http.get<any>(`${this.islamicAppBase}/verses/by_page/${p}`),
      this.getMushafChapters()
    ]).pipe(map(([verseRes, chapters]) => this.mapMushafPageContent(p, verseRes, chapters)));
  }

  /** @deprecated Use getMushafPageContent */
  getMushafPageMeta(page: number): Observable<MushafPageMeta> {
    return this.getMushafPageContent(page).pipe(
      map(({ page, juz, juzLabel, surahId, surahNameAr }) => ({
        page,
        juz,
        juzLabel,
        surahId,
        surahNameAr
      }))
    );
  }

  private mapMushafPageContent(
    page: number,
    verseRes: unknown,
    chapters: MushafChapter[]
  ): MushafPageContent {
    const raw = (verseRes as { data?: { verses?: unknown[] } })?.data?.verses;
    const verses: MushafVerse[] = Array.isArray(raw)
      ? raw.map((v: any) => ({
          id: v.id,
          verseNumber: v.verse_number,
          verseKey: v.verse_key,
          chapterId: v.chapter_id,
          juz: v.juz,
          page: v.page,
          textUthmani: v.text_uthmani ?? ''
        }))
      : [];
    const first = verses[0];
    const juz = first?.juz ?? 1;
    const surahId = first?.chapterId ?? 1;
    const ch = chapters.find(c => c.id === surahId);
    return {
      page,
      verses,
      juz,
      juzLabel: JUZ_LABELS[juz] ?? `جزء ${juz}`,
      surahId,
      surahNameAr: ch?.nameArabic ? `سورة ${ch.nameArabic}` : `سورة ${surahId}`
    };
  }

  mushafSurahAudioUrl(surahId: number, reciter = '7'): string {
    return `${this.islamicAppBase}/audio/surah?reciter=${reciter}&surah=${surahId}`;
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
