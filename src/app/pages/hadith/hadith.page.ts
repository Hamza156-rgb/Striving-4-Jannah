import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonSegment, IonSegmentButton,
  IonLabel, IonRefresher, IonRefresherContent, IonSpinner, IonFab, IonFabButton, IonIcon
} from '@ionic/angular/standalone';
import { HadithService, Hadith } from '../../services/hadith.service';

@Component({
  selector: 'app-hadith',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonSegment, IonSegmentButton, IonLabel, IonRefresher, IonRefresherContent,
    IonSpinner, IonFab, IonFabButton, IonIcon],
  templateUrl: './hadith.page.html',
  styleUrls: ['./hadith.page.scss']
})
export class HadithPage implements OnInit {
  hadiths: Hadith[] = [];
  loading = true;
  loadingRandom = false;
  language: 'english' | 'arabic' | 'urdu' = 'english';

  books = [
    { id: 'sahih-bukhari', name: 'Sahih Al-Bukhari', arabicName: 'صحيح البخاري', count: '7276' },
    { id: 'sahih-muslim', name: 'Sahih Muslim', arabicName: 'صحيح مسلم', count: '7564' },
    { id: 'abu-dawood', name: 'Sunan Abu Dawud', arabicName: 'سنن أبو داود', count: '5274' },
    { id: 'al-tirmidhi', name: 'Jami At-Tirmidhi', arabicName: 'جامع الترمذي', count: '3956' },
    { id: 'sunan-nasai', name: "Sunan An-Nasa'i", arabicName: 'سنن النسائي', count: '5761' },
    { id: 'ibn-e-majah', name: 'Sunan Ibn Majah', arabicName: 'سنن ابن ماجه', count: '4341' }
  ];

  constructor(private hadithService: HadithService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadFallbackHadiths(); }

  loadFallbackHadiths() {
    this.loading = true;
    // Load multiple random hadiths from fallback
    const hadiths = this.getDefaultHadiths();
    this.hadiths = hadiths;
    this.loading = false;
  }

  selectBook(bookId: string) {
    this.loading = true;
    console.log('Loading hadiths for book:', bookId);
    this.hadithService.getHadiths(bookId).subscribe({
      next: (hadiths) => {
        console.log('Received hadiths:', hadiths);
        console.log('Hadiths array length:', hadiths?.length);
        console.log('First hadith:', hadiths?.[0]);
        this.hadiths = hadiths;
        console.log('this.hadiths after assignment:', this.hadiths);
        console.log('this.hadiths.length:', this.hadiths?.length);
        console.log('Set hadiths, setting loading to false');
        this.loading = false;
        console.log('Loading state after setting:', this.loading);
        console.log('Final state - loading:', this.loading, 'hadiths.length:', this.hadiths?.length);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading hadiths:', err);
        this.loadFallbackHadiths();
        this.cdr.detectChanges();
      }
    });
  }

  loadRandom(event?: any) {
    this.loadingRandom = true;
    this.hadithService.getRandomHadith().subscribe({
      next: (h) => {
        this.hadiths = [h, ...this.hadiths.slice(0, 9)];
        this.loadingRandom = false;
        if (event) {
          event.target.complete();
        }
      },
      error: () => {
        this.loadingRandom = false;
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  setLanguage(lang: any) { this.language = lang.detail.value; }

  getHadithText(h: Hadith): string {
    if (this.language === 'arabic') return h.hadithArabic;
    if (this.language === 'urdu') return h.hadithUrdu || h.hadithEnglish;
    return h.hadithEnglish;
  }

  isRtl(): boolean { return this.language === 'arabic' || this.language === 'urdu'; }

  private getDefaultHadiths(): Hadith[] {
    return [
      {
        id: 1, hadithNumber: '1', bookSlug: 'sahih-bukhari', bookName: 'Sahih Al-Bukhari',
        englishNarrator: 'Narrated Umar ibn Al-Khattab (RA):',
        hadithEnglish: 'The Messenger of Allah (ﷺ) said: "Actions are according to intentions, and everyone will get what was intended. Whoever migrates for Allah and His Messenger, his migration will be for Allah and His Messenger."',
        hadithArabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ',
        hadithUrdu: 'بیشک اعمال کا دارومدار نیتوں پر ہے اور ہر شخص کو وہی ملے گا جس کی اس نے نیت کی۔ جس نے اللہ اور اس کے رسول کی طرف ہجرت کی تو اس کی ہجرت اللہ اور اس کے رسول کی طرف ہے۔',
        chapterName: 'How the Divine Revelation started'
      },
      {
        id: 2, hadithNumber: '6018', bookSlug: 'sahih-bukhari', bookName: 'Sahih Al-Bukhari',
        englishNarrator: 'Narrated Abu Hurairah (RA):',
        hadithEnglish: 'The Prophet (ﷺ) said, "Whoever believes in Allah and the Last Day should speak good or keep silent; and whoever believes in Allah and the Last Day should be generous to his neighbor."',
        hadithArabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ جَارَهُ',
        hadithUrdu: 'جو اللہ اور یوم آخرت پر ایمان رکھتا ہو وہ اچھی بات کہے یا خاموش رہے، اور جو اللہ اور یوم آخرت پر ایمان رکھتا ہو وہ اپنے پڑوسی کا اکرام کرے۔',
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
        hadithEnglish: 'A man asked the Prophet (ﷺ): "Which deed is the best?" He replied, "To offer the prayers at their early stated fixed times." The man asked, "What is next?" He replied, "To be good and dutiful to your parents." The man asked, "What is next?" He replied, "To participate in Jihad in Allah\'s Cause."',
        hadithArabic: 'أَيُّ الْعَمَلِ أَحَبُّ إِلَى اللَّهِ؟ قَالَ: الصَّلَاةُ عَلَى وَقْتِهَا. قُلْتُ: ثُمَّ أَيٌّ؟ قَالَ: بِرُّ الْوَالِدَيْنِ',
        hadithUrdu: 'کون سا عمل اللہ کو سب سے زیادہ پسند ہے؟ فرمایا: نماز کو اس کے وقت پر ادا کرنا۔ پھر کونسا؟ فرمایا: والدین کے ساتھ نیکی کرنا۔',
        chapterName: 'Times of the Prayers'
      },
      {
        id: 5, hadithNumber: '2609', bookSlug: 'sahih-muslim', bookName: 'Sahih Muslim',
        englishNarrator: 'Narrated Abu Hurairah (RA):',
        hadithEnglish: 'The Messenger of Allah (ﷺ) said: "The strong man is not the one who can wrestle others down. The strong man is the one who can control himself when angry."',
        hadithArabic: 'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ',
        hadithUrdu: 'پہلوان وہ نہیں جو لوگوں کو پچھاڑ دے، بلکہ پہلوان وہ ہے جو غصے کے وقت خود پر قابو رکھے۔',
        chapterName: 'Virtue and Good Manners'
      }
    ];
  }
}
