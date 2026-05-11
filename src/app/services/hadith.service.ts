import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';

export interface Hadith {
  id: number;
  hadithNumber: string;
  englishNarrator: string;
  hadithEnglish: string;
  hadithArabic: string;
  hadithUrdu?: string;
  bookSlug: string;
  bookName: string;
  chapterName?: string;
  /** Kitāb / chapter index in this book (from API `chapter.chapterNumber`) */
  chapterNumber?: string;
  /** e.g. Sahih, Hasan, Da'if — from API `status` when present */
  status?: string;
}

export interface HadithChapter {
  id: number;
  chapterNumber: string;
  chapterEnglish: string;
  chapterUrdu?: string;
  chapterArabic?: string;
  bookSlug: string;
}

export interface HadithPageResult {
  hadiths: Hadith[];
  currentPage: number;
  lastPage: number;
}

export interface Location {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
}

@Injectable({ providedIn: 'root' })
export class HadithService {
  /** Canonical API base (avoids 301 from legacy `/api/` paths). */
  private base = 'https://hadithapi.com/public/api';
  private apiKey = '$2y$10$xwd7IkrzH62O1LogMNpgOA7mHCbIF7vKTTwLCvZ6XEfqAff46';

  constructor(private http: HttpClient) {}

  getChapters(bookSlug: string): Observable<HadithChapter[]> {
    const url = `${this.base}/${encodeURIComponent(bookSlug)}/chapters?apiKey=${this.apiKey}`;
    return this.http.get<{ chapters?: HadithChapter[] }>(url).pipe(
      map(r => (Array.isArray(r?.chapters) ? r.chapters : [])),
      catchError(() => of([]))
    );
  }

  /**
   * Paginated hadiths for a book, optionally filtered by chapter number (as returned by {@link getChapters}).
   */
  getHadiths(
    book: string,
    options: { page?: number; limit?: number; chapter?: string } = {}
  ): Observable<HadithPageResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 15;
    let url = `${this.base}/hadiths?apiKey=${this.apiKey}&book=${encodeURIComponent(book)}&paginate=${limit}&page=${page}`;
    if (options.chapter != null && options.chapter !== '') {
      url += `&chapter=${encodeURIComponent(options.chapter)}`;
    }
    return this.http.get<any>(url).pipe(
      map(r => this.mapHadithPage(r, book)),
      catchError(() =>
        of({
          hadiths: this.getFallbackHadiths().filter(h => h.bookSlug === book || book === 'sahih-bukhari'),
          currentPage: 1,
          lastPage: 1
        })
      )
    );
  }

  /**
   * Fetch a single hadith in this book by its published hadith number (API `hadithNumber` query).
   * Returns `null` if not found or on error — does not use fallback hadiths.
   */
  getHadithByNumber(book: string, hadithNumber: string): Observable<Hadith | null> {
    const n = hadithNumber.trim();
    if (!n) {
      return of(null);
    }
    const url = `${this.base}/hadiths?apiKey=${this.apiKey}&book=${encodeURIComponent(book)}&hadithNumber=${encodeURIComponent(
      n
    )}&paginate=1&page=1`;
    return this.http.get<any>(url).pipe(
      map(r => {
        const block = r?.hadiths;
        const arr = Array.isArray(block?.data) ? block.data : [];
        if (!arr.length) {
          return null;
        }
        return this.mapHadithApi(arr[0], book);
      }),
      catchError(() => of(null))
    );
  }

  getRandomHadith(): Observable<Hadith> {
    const books = ['sahih-bukhari', 'sahih-muslim', 'abu-dawood', 'al-tirmidhi', 'sunan-nasai', 'ibn-e-majah'];
    const book = books[Math.floor(Math.random() * books.length)];
    const randomPage = Math.floor(Math.random() * 200) + 1;
    const url = `${this.base}/hadiths?apiKey=${this.apiKey}&book=${encodeURIComponent(book)}&paginate=1&page=${randomPage}`;
    return this.http.get<any>(url).pipe(
      map(r => {
        const block = r?.hadiths;
        const row = block?.data?.[0];
        if (row) {
          return this.mapHadithApi(row, book);
        }
        return this.getFallbackHadiths()[0];
      }),
      catchError(() => {
        const fallbackHadiths = this.getFallbackHadiths();
        const randomIndex = Math.floor(Math.random() * fallbackHadiths.length);
        return of(fallbackHadiths[randomIndex]);
      })
    );
  }

  private mapHadithPage(r: any, book: string): HadithPageResult {
    const block = r?.hadiths;
    const arr = Array.isArray(block?.data) ? block.data : [];
    const hadiths = arr.filter((h: any) => h && typeof h === 'object').map((h: any) => this.mapHadithApi(h, book));
    const currentPage = Number(block?.current_page);
    const lastPage = Number(block?.last_page);
    return {
      hadiths,
      currentPage: Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1,
      lastPage: Number.isFinite(lastPage) && lastPage > 0 ? lastPage : 1
    };
  }

  private mapHadithApi(d: any, book: string): Hadith {
    if (!d || typeof d !== 'object') {
      return {
        id: Math.random(),
        hadithNumber: '?',
        englishNarrator: '',
        hadithEnglish: '',
        hadithArabic: '',
        bookSlug: book,
        bookName: this.getBookName(book)
      };
    }
    const rawStatus = d.status ?? d.hadithStatus ?? d.grade ?? d.authenticity;
    const status =
      rawStatus != null && String(rawStatus).trim() !== '' ? String(rawStatus).trim() : undefined;
    const chNum = d.chapter?.chapterNumber;
    return {
      id: d.id || Math.random(),
      hadithNumber: d.hadithNumber?.toString() || d.id?.toString() || '1',
      englishNarrator: d.englishNarrator || d.urduNarrator || 'Narrated',
      hadithEnglish: d.hadithEnglish || d.english || '',
      hadithArabic: d.hadithArabic || d.arabic || '',
      hadithUrdu: d.hadithUrdu || d.urdu || '',
      bookSlug: book,
      bookName: d.book?.bookName || this.getBookName(book),
      chapterName: d.chapter?.chapterEnglish || d.chapterName || '',
      chapterNumber: chNum != null && String(chNum).trim() !== '' ? String(chNum) : undefined,
      status
    };
  }

  private getBookName(slug: string): string {
    const names: Record<string, string> = {
      'sahih-bukhari': 'Sahih Al-Bukhari',
      'sahih-muslim': 'Sahih Muslim',
      'abu-dawood': 'Sunan Abu Dawud',
      'al-tirmidhi': 'Jami At-Tirmidhi',
      'sunan-nasai': "Sunan An-Nasa'i",
      'ibn-e-majah': 'Sunan Ibn Majah'
    };
    return names[slug] || slug;
  }

  private getFallbackHadiths(): Hadith[] {
    return [
      {
        id: 1,
        hadithNumber: '1',
        bookSlug: 'sahih-bukhari',
        bookName: 'Sahih Al-Bukhari',
        englishNarrator: 'Narrated Umar ibn Al-Khattab (RA):',
        hadithEnglish:
          'The Messenger of Allah (ﷺ) said: "Actions are according to intentions, and everyone will get what was intended."',
        hadithArabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
        hadithUrdu: 'اعمال کا دارومدار نیتوں پر ہے اور ہر شخص کو وہی ملے گا جس کی اس نے نیت کی۔',
        chapterName: 'How the Divine Revelation started',
        status: 'Sahih'
      },
      {
        id: 2,
        hadithNumber: '6018',
        bookSlug: 'sahih-bukhari',
        bookName: 'Sahih Al-Bukhari',
        englishNarrator: 'Narrated Abu Hurairah (RA):',
        hadithEnglish:
          'The Prophet (ﷺ) said, "Whoever believes in Allah and the Last Day should speak good or keep silent."',
        hadithArabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
        hadithUrdu: 'جو شخص اللہ اور آخرت کے دن پر ایمان رکھتا ہے وہ اچھی بات کہے یا خاموش رہے۔',
        chapterName: 'Good Manners',
        status: 'Sahih'
      },
      {
        id: 3,
        hadithNumber: '2442',
        bookSlug: 'sahih-muslim',
        bookName: 'Sahih Muslim',
        englishNarrator: 'Narrated Abu Hurairah (RA):',
        hadithEnglish:
          'The Messenger of Allah (ﷺ) said: "Do not consider any act of kindness insignificant, even meeting your brother with a cheerful face."',
        hadithArabic: 'لَا تَحْقِرَنَّ مِنَ الْمَعْرُوفِ شَيْئًا وَلَوْ أَنْ تَلْقَى أَخَاكَ بِوَجْهٍ طَلْقٍ',
        hadithUrdu: 'کسی نیک کام کو حقیر مت سمجھو، چاہے تم اپنے بھائی سے خوشی کے ساتھ ملو۔',
        chapterName: 'Virtue and Doing Good',
        status: 'Sahih'
      },
      {
        id: 4,
        hadithNumber: '55',
        bookSlug: 'sahih-bukhari',
        bookName: 'Sahih Al-Bukhari',
        englishNarrator: 'Narrated Ibn Masud (RA):',
        hadithEnglish:
          'A man asked the Prophet (ﷺ): "Which deed is the best?" He replied, "To offer the prayers at their early stated fixed times."',
        hadithArabic: 'أَيُّ الْعَمَلِ أَحَبُّ إِلَى اللَّه قَالَ الصَّلَاةُ عَلَى وَقْتِهَا',
        hadithUrdu: 'سب سے بہتر عمل کونسا ہے؟ آپ ﷺ نے فرمایا: نماز کو اس کے وقت پر ادا کرنا۔',
        chapterName: 'Times of the Prayers',
        status: 'Sahih'
      },
      {
        id: 5,
        hadithNumber: '1',
        bookSlug: 'sahih-muslim',
        bookName: 'Sahih Muslim',
        englishNarrator: 'Narrated Abu Hurairah (RA):',
        hadithEnglish:
          'The Messenger of Allah (ﷺ) said: "The strong man is not the one who can wrestle others down. The strong man is the one who can control himself when angry."',
        hadithArabic: 'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ',
        hadithUrdu: 'پہلوان وہ نہیں جو لوگوں کو پچھاڑ دے، بلکہ پہلوان وہ ہے جو غصے کے وقت خود پر قابو رکھے۔',
        chapterName: 'Virtue and Good Manners',
        status: 'Sahih'
      }
    ];
  }
}
