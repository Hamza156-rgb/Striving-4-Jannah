import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
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
    IonInfiniteScroll,
    IonInfiniteScrollContent,
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
  /** Mirror of `?hadith=` for template (optional card ring). */
  hadithNumberHighlight = '';
  /** True after lookup when `?hadith=` was used but API returned nothing. */
  singleHadithNotFound = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hadithService: HadithService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.paramsSub = combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, q]) => {
      const prevHadithQuery = this.hadithNumberHighlight;
      const nextBook = params.get('bookSlug') || '';
      const nextCh = params.get('chapterNumber') || '';
      const nextHighlight = (q.get('hadith') || '').trim();
      const routeChanged = nextBook !== this.bookSlug || nextCh !== this.chapterNumber;
      const highlightChanged = prevHadithQuery !== nextHighlight;

      this.bookSlug = nextBook;
      this.chapterNumber = nextCh;
      this.hadithNumberHighlight = nextHighlight;
      this.bookTitle = hadithBookTitle(this.bookSlug);

      const needReload = routeChanged || highlightChanged || !this.hadiths.length;
      if (!needReload) {
        return;
      }

      if (nextHighlight) {
        this.loadSingleHadithByQuery(nextHighlight);
      } else {
        this.loadPage(1, true);
      }
    });
  }

  ngOnDestroy(): void {
    this.paramsSub?.unsubscribe();
  }

  /**
   * Disable only when there is nothing more to fetch.
   * Do not tie this to `loadingMore`: disabling mid-request breaks `complete()` and leaves
   * ion-infinite-scroll stuck on “Loading…”.
   */
  get infiniteScrollDisabled(): boolean {
    if (this.hadithNumberHighlight.trim()) {
      return true;
    }
    if (this.loading) {
      return true;
    }
    if (!this.hadiths.length) {
      return true;
    }
    if (this.currentPage >= this.lastPage) {
      return true;
    }
    return false;
  }

  onInfinite(ev: Event): void {
    const target = ev.target as HTMLIonInfiniteScrollElement;
    if (this.hadithNumberHighlight.trim()) {
      target.complete();
      return;
    }
    if (this.loadingMore || this.currentPage >= this.lastPage) {
      target.complete();
      return;
    }
    const next = this.currentPage + 1;
    this.loadPage(next, false, target);
  }

  private loadPage(page: number, reset: boolean, infiniteTarget?: HTMLIonInfiniteScrollElement): void {
    if (reset) {
      this.loading = true;
      this.currentPage = 1;
      this.hadiths = [];
      this.singleHadithNotFound = false;
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
          infiniteTarget?.complete();
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

  setLanguageDirect(lang: 'english' | 'arabic' | 'urdu'): void {
    this.language = lang;
    this.cdr.detectChanges();
  }

  openFullChapter(): void {
    this.router.navigate(['/hadith', this.bookSlug, this.chapterNumber], { queryParams: {} });
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

  /** `?hadith=N`: show only that hadith (no chapter list / infinite scroll). */
  private loadSingleHadithByQuery(q: string): void {
    this.loading = true;
    this.loadingMore = false;
    this.hadiths = [];
    this.singleHadithNotFound = false;
    this.lastPage = 1;
    this.currentPage = 1;
    this.cdr.detectChanges();
    this.hadithService
      .getHadithByNumber(this.bookSlug, q)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.loadingMore = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe(h => {
        if (!h) {
          this.hadiths = [];
          this.singleHadithNotFound = true;
          return;
        }
        const ch = h.chapterNumber?.trim();
        if (ch && ch !== this.chapterNumber) {
          this.router.navigate(['/hadith', this.bookSlug, ch], { queryParams: { hadith: q }, replaceUrl: true });
          return;
        }
        this.hadiths = [h];
        this.singleHadithNotFound = false;
        this.lastPage = 1;
        this.currentPage = 1;
      });
  }
}
