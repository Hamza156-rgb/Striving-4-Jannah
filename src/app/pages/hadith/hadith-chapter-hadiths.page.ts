import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { ModalController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonTitle,
  IonSpinner,
  IonToolbar,
  IonIcon,
  ToastController
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { Hadith, HadithService } from '../../services/hadith.service';
import { hadithBookTitle } from './hadith-books.meta';
import { ShareContentService } from '../../services/share-content.service';
import { ShareFormatPickerComponent } from '../../components/share-format-picker/share-format-picker.component';

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
    IonSpinner,
    IonIcon
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
    private cdr: ChangeDetectorRef,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private shareContent: ShareContentService
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

  async openHadithShare(h: Hadith, ev: Event): Promise<void> {
    ev.stopPropagation();
    ev.preventDefault();
    this.blurActiveElement();
    const modal = await this.modalCtrl.create({
      component: ShareFormatPickerComponent,
      componentProps: {
        heading: 'Share this hadith',
        hint: 'Send the hadith as plain text (WhatsApp, notes) or as a styled gold card image.'
      },
      cssClass: 'share-format-modal',
      backdropDismiss: true,
      showBackdrop: true
    });
    await modal.present();
    const { data } = await modal.onWillDismiss<{ choice?: 'text' | 'image' }>();
    if (data?.choice === 'text') {
      void this.shareHadithText(h);
    } else if (data?.choice === 'image') {
      void this.shareHadithImage(h);
    }
  }

  private shareHadithMeaning(h: Hadith): string {
    if (this.language === 'urdu') {
      return (h.hadithUrdu || h.hadithEnglish || '').trim();
    }
    return (h.hadithEnglish || '').trim();
  }

  private async shareHadithText(h: Hadith): Promise<void> {
    try {
      const text = this.shareContent.buildHadithPlainText({
        bookName: h.bookName,
        hadithNumber: h.hadithNumber,
        chapterName: h.chapterName,
        narrator: h.englishNarrator,
        arabic: h.hadithArabic?.trim() || undefined,
        body: this.shareHadithMeaning(h)
      });
      await this.shareContent.sharePlainText(text);
    } catch (e) {
      await this.handleShareError(e);
    }
  }

  private async shareHadithImage(h: Hadith): Promise<void> {
    try {
      await this.shareContent.shareHadithImage({
        bookName: h.bookName,
        hadithNumber: h.hadithNumber,
        chapterName: h.chapterName,
        narrator: h.englishNarrator,
        arabic: h.hadithArabic?.trim() || undefined,
        body: this.shareHadithMeaning(h),
        rtl: this.isRtl()
      });
    } catch (e) {
      await this.handleShareError(e);
    }
  }

  private async handleShareError(e: unknown): Promise<void> {
    if (this.shareContent.isCancelled(e)) return;
    if (this.shareContent.isClipboardOk(e)) {
      (await this.toastCtrl.create({ message: 'Copied to clipboard.', duration: 2200, color: 'success' })).present();
      return;
    }
    if (this.shareContent.isDownloadFallback(e)) {
      (await this.toastCtrl.create({
        message: 'Image download started — check your downloads folder.',
        duration: 2800,
        color: 'success'
      })).present();
      return;
    }
    const msg = e instanceof Error ? e.message : 'Could not share.';
    (await this.toastCtrl.create({ message: msg, duration: 2600, color: 'danger' })).present();
  }

  private blurActiveElement(): void {
    const el = document.activeElement;
    if (el instanceof HTMLElement) {
      el.blur();
    }
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
