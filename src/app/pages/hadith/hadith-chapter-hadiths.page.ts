import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonTitle,
  IonSpinner,
  IonToolbar
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { Hadith, HadithService } from '../../services/hadith.service';
import { hadithBookTitle } from './hadith-books.meta';

@Component({
  selector: 'app-hadith-chapter-hadiths',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSpinner
  ],
  templateUrl: './hadith-chapter-hadiths.page.html',
  styleUrls: ['./hadith-chapter-hadiths.page.scss']
})
export class HadithChapterHadithsPage implements OnInit, OnDestroy {
  bookSlug = '';
  chapterNumber = '';
  bookTitle = '';
  hadiths: Hadith[] = [];
  loading = true;
  loadingMore = false;
  language: 'english' | 'arabic' | 'urdu' = 'english';
  currentPage = 1;
  lastPage = 1;
  pageSize = 12;
  private paramsSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private hadithService: HadithService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.paramsSub = this.route.paramMap.subscribe(params => {
      const nextBook = params.get('bookSlug') || '';
      const nextCh = params.get('chapterNumber') || '';
      const changed = nextBook !== this.bookSlug || nextCh !== this.chapterNumber;
      this.bookSlug = nextBook;
      this.chapterNumber = nextCh;
      this.bookTitle = hadithBookTitle(this.bookSlug);
      if (changed || !this.hadiths.length) {
        this.loadPage(1, true);
      }
    });
  }

  ngOnDestroy(): void {
    this.paramsSub?.unsubscribe();
  }

  private loadPage(page: number, reset: boolean): void {
    if (reset) {
      this.loading = true;
      this.currentPage = 1;
      this.hadiths = [];
    } else {
      this.loadingMore = true;
    }
    this.cdr.detectChanges();
    this.hadithService
      .getHadiths(this.bookSlug, { page, limit: this.pageSize, chapter: this.chapterNumber })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.loadingMore = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: res => {
          this.lastPage = res.lastPage;
          this.currentPage = res.currentPage;
          if (reset) {
            this.hadiths = res.hadiths;
          } else {
            this.hadiths = [...this.hadiths, ...res.hadiths];
          }
          this.cdr.detectChanges();
        },
        error: () => {
          if (reset) {
            this.hadiths = [];
          }
          this.cdr.detectChanges();
        }
      });
  }

  loadMore(): void {
    if (this.loadingMore || this.currentPage >= this.lastPage) {
      return;
    }
    const next = this.currentPage + 1;
    this.loadPage(next, false);
  }

  setLanguageDirect(lang: 'english' | 'arabic' | 'urdu'): void {
    this.language = lang;
    this.cdr.detectChanges();
  }

  getHadithText(h: Hadith): string {
    if (this.language === 'arabic') {
      return h.hadithArabic;
    }
    if (this.language === 'urdu') {
      return h.hadithUrdu || h.hadithEnglish;
    }
    return h.hadithEnglish;
  }

  isRtl(): boolean {
    return this.language === 'arabic' || this.language === 'urdu';
  }
}
