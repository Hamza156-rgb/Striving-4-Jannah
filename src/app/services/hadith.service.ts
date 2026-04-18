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
}

@Injectable({ providedIn: 'root' })
export class HadithService {
  private base = 'https://hadithapi.com/api';
  private apiKey = '$2y$10$xwd7IkrzH62O1LogMNpgOA7mHCbIF7vKTTwLCvZ6XEfqAff46';
  // Using CORS proxy to bypass restrictions
  private corsProxy = 'https://corsproxy.io/?';
  // Using ihadis.com as backup - public API
  private altBase = 'https://api.sunnah.com/v1';

  constructor(private http: HttpClient) {}

  // Using hadithapi.com through CORS proxy to bypass CORS
  getHadiths(book: string = 'sahih-bukhari', page: number = 1): Observable<Hadith[]> {
    const apiUrl = `${this.base}/hadiths/?apiKey=${this.apiKey}&book=${book}&page=${page}&limit=10`;
    const url = `${this.corsProxy}${encodeURIComponent(apiUrl)}`;
    console.log('Fetching hadiths from:', url);
    return this.http.get<any>(url).pipe(
      map(r => {
        console.log('API response:', r);
        // corsproxy.io returns data directly
        const data = r;
        if (data && data.hadiths && data.hadiths.data) {
          const mapped = data.hadiths.data.map((h: any) => this.mapHadithApi(h, book));
          console.log('Mapped hadiths:', mapped);
          return mapped;
        }
        console.log('Using fallback hadiths');
        return this.getFallbackHadiths();
      }),
      catchError((err) => {
        console.error('API error:', err);
        return of(this.getFallbackHadiths().filter(h => h.bookSlug === book || book === 'sahih-bukhari'));
      })
    );
  }

  getRandomHadith(): Observable<Hadith> {
    const books = ['sahih-bukhari', 'sahih-muslim', 'abu-dawood', 'al-tirmidhi', 'sunan-nasai', 'ibn-e-majah'];
    const book = books[Math.floor(Math.random() * books.length)];
    const randomPage = Math.floor(Math.random() * 100) + 1;
    return this.http.get<any>(`${this.base}/hadiths/?apiKey=${this.apiKey}&book=${book}&page=${randomPage}&limit=1`).pipe(
      map(r => {
        if (r && r.hadiths && r.hadiths.data && r.hadiths.data.length > 0) {
          return this.mapHadithApi(r.hadiths.data[0], book);
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

  private mapHadithApi(d: any, book: string): Hadith {
    return {
      id: d.id || Math.random(),
      hadithNumber: d.hadithNumber?.toString() || d.id?.toString() || '1',
      englishNarrator: d.englishNarrator || 'Narrated',
      hadithEnglish: d.hadithEnglish || d.english || '',
      hadithArabic: d.hadithArabic || d.arabic || '',
      hadithUrdu: d.hadithUrdu || d.urdu || '',
      bookSlug: book,
      bookName: d.book?.bookName || this.getBookName(book),
      chapterName: d.chapter?.chapterEnglish || d.chapterName || ''
    };
  }

  private mapSunnahHadith(d: any, book: string): Hadith {
    return {
      id: d.hadithNumber || Math.random(),
      hadithNumber: d.hadithNumber?.toString() || '1',
      englishNarrator: d.raw?.en || 'Narrated',
      hadithEnglish: d.translation?.en || d.text?.en || '',
      hadithArabic: d.raw?.ar || d.text?.ar || '',
      hadithUrdu: d.translation?.ur || '',
      bookSlug: book,
      bookName: this.getBookName(book),
      chapterName: d.chapter?.title || d.book?.name || ''
    };
  }

  private mapHadith(d: any, book: string): Hadith {
    return {
      id: Math.random(),
      hadithNumber: d.id || d.hadithNumber || '1',
      englishNarrator: d.englishNarrator || d.header || 'Narrated',
      hadithEnglish: d.hadith_english || d.hadithEnglish || d.text || '',
      hadithArabic: d.hadith_arabic || d.hadithArabic || '',
      hadithUrdu: d.hadith_urdu || '',
      bookSlug: book,
      bookName: this.getBookName(book),
      chapterName: d.chapterName || d.chapter || ''
    };
  }

  private getBookName(slug: string): string {
    const map: Record<string, string> = {
      'sahih-bukhari': 'Sahih Al-Bukhari',
      'sahih-muslim': 'Sahih Muslim',
      'abu-dawood': 'Sunan Abu Dawud',
      'al-tirmidhi': 'Jami At-Tirmidhi',
      'sunan-nasai': "Sunan An-Nasa'i",
      'ibn-e-majah': 'Sunan Ibn Majah'
    };
    return map[slug] || slug;
  }

  private getFallbackHadiths(): Hadith[] {
    return [
      {
        id: 1, hadithNumber: '1', bookSlug: 'sahih-bukhari', bookName: 'Sahih Al-Bukhari',
        englishNarrator: 'Narrated Umar ibn Al-Khattab (RA):',
        hadithEnglish: 'The Messenger of Allah (ﷺ) said: "Actions are according to intentions, and everyone will get what was intended."',
        hadithArabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
        hadithUrdu: 'اعمال کا دارومدار نیتوں پر ہے اور ہر شخص کو وہی ملے گا جس کی اس نے نیت کی۔',
        chapterName: 'How the Divine Revelation started'
      },
      {
        id: 2, hadithNumber: '6018', bookSlug: 'sahih-bukhari', bookName: 'Sahih Al-Bukhari',
        englishNarrator: 'Narrated Abu Hurairah (RA):',
        hadithEnglish: 'The Prophet (ﷺ) said, "Whoever believes in Allah and the Last Day should speak good or keep silent."',
        hadithArabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
        hadithUrdu: 'جو شخص اللہ اور آخرت کے دن پر ایمان رکھتا ہے وہ اچھی بات کہے یا خاموش رہے۔',
        chapterName: 'Good Manners'
      },
      {
        id: 3, hadithNumber: '2442', bookSlug: 'sahih-muslim', bookName: 'Sahih Muslim',
        englishNarrator: 'Narrated Abu Hurairah (RA):',
        hadithEnglish: 'The Messenger of Allah (ﷺ) said: "Do not consider any act of kindness insignificant, even meeting your brother with a cheerful face."',
        hadithArabic: 'لَا تَحْقِرَنَّ مِنَ الْمَعْرُوفِ شَيْئًا وَلَوْ أَنْ تَلْقَى أَخَاكَ بِوَجْهٍ طَلْقٍ',
        hadithUrdu: 'کسی نیک کام کو حقیر مت سمجھو، چاہے تم اپنے بھائی سے خوشی کے ساتھ ملو۔',
        chapterName: 'Virtue and Doing Good'
      },
      {
        id: 4, hadithNumber: '55', bookSlug: 'sahih-bukhari', bookName: 'Sahih Al-Bukhari',
        englishNarrator: 'Narrated Ibn Masud (RA):',
        hadithEnglish: 'A man asked the Prophet (ﷺ): "Which deed is the best?" He replied, "To offer the prayers at their early stated fixed times."',
        hadithArabic: 'أَيُّ الْعَمَلِ أَحَبُّ إِلَى اللَّه قَالَ الصَّلَاةُ عَلَى وَقْتِهَا',
        hadithUrdu: 'سب سے بہتر عمل کونسا ہے؟ آپ ﷺ نے فرمایا: نماز کو اس کے وقت پر ادا کرنا۔',
        chapterName: 'Times of the Prayers'
      },
      {
        id: 5, hadithNumber: '1', bookSlug: 'sahih-muslim', bookName: 'Sahih Muslim',
        englishNarrator: 'Narrated Abu Hurairah (RA):',
        hadithEnglish: 'The Messenger of Allah (ﷺ) said: "The strong man is not the one who can wrestle others down. The strong man is the one who can control himself when angry."',
        hadithArabic: 'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ',
        hadithUrdu: 'پہلوان وہ نہیں جو لوگوں کو پچھاڑ دے، بلکہ پہلوان وہ ہے جو غصے کے وقت خود پر قابو رکھے۔',
        chapterName: 'Virtue and Good Manners'
      }
    ];
  }
}
