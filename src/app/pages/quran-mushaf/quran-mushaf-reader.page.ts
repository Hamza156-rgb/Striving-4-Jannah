import { ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { MushafChapter, MushafVerse, QuranService } from '../../services/quran.service';
import { toArabicIndic } from '../../utils/arabic-indic';

@Component({
  selector: 'app-quran-mushaf-reader',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonSpinner
  ],
  templateUrl: './quran-mushaf-reader.page.html',
  styleUrls: ['./quran-mushaf-reader.page.scss']
})
export class QuranMushafReaderPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly quran = inject(QuranService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  chapter: MushafChapter | null = null;
  page = 1;
  juzNumber = 1;
  juzLabel = '';
  pageVerses: MushafVerse[] = [];
  pageContentLoading = true;
  pageContentError = false;
  loading = true;
  autoScroll = false;
  /** Arabic mushaf text size (px); smaller default for phones. */
  fontSize = 20;

  private autoScrollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const stateChapter = history.state?.['mushafChapter'] as MushafChapter | undefined;

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = +(params.get('surahId') ?? 0);
      if (stateChapter?.id === id) {
        this.applyChapter(stateChapter);
        return;
      }
      this.loadChapter(id);
    });
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  private loadChapter(surahId: number): void {
    this.loading = true;
    this.chapter = null;
    this.cdr.detectChanges();

    this.quran
      .getMushafChapters()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: list => {
          const found = list.find(c => c.id === surahId) ?? null;
          if (found) {
            this.applyChapter(found);
          } else {
            this.chapter = null;
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.chapter = null;
          this.cdr.detectChanges();
        }
      });
  }

  private applyChapter(chapter: MushafChapter): void {
    this.chapter = chapter;
    this.page = chapter.pageStart;
    this.loading = false;
    this.refreshPageExtras();
  }

  /** Verses + juz for current mushaf page. */
  private refreshPageExtras(): void {
    this.pageContentLoading = true;
    this.pageContentError = false;
    this.pageVerses = [];
    this.cdr.detectChanges();

    this.quran
      .getMushafPageContent(this.page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: content => {
          this.juzNumber = content.juz;
          this.juzLabel = content.juzLabel;
          this.pageVerses = content.verses;
          this.pageContentLoading = false;
          this.pageContentError = content.verses.length === 0;
          this.cdr.detectChanges();
        },
        error: () => {
          this.juzLabel = '';
          this.pageVerses = [];
          this.pageContentLoading = false;
          this.pageContentError = true;
          this.cdr.detectChanges();
        }
      });
  }

  get showSurahBannerOnPage(): boolean {
    return this.pageVerses.length > 0 && this.pageVerses[0].verseNumber === 1;
  }

  get pageImageUrl(): string {
    return this.quran.mushafPageImageUrl(this.page);
  }

  /** Surah title on sheet when this page opens a surah (ayah 1). */
  get sheetSurahTitle(): string {
    if (!this.showSurahBannerOnPage) {
      return '';
    }
    const first = this.pageVerses[0];
    if (first?.chapterId === this.chapter?.id) {
      return this.chapter?.nameArabic ?? '';
    }
    return '';
  }

  get pageMin(): number {
    return this.chapter?.pageStart ?? 1;
  }

  get pageMax(): number {
    return this.chapter?.pageEnd ?? 604;
  }

  get pageIndexInSurah(): number {
    if (!this.chapter) {
      return 0;
    }
    return this.page - this.chapter.pageStart + 1;
  }

  get pagesInSurah(): number {
    return this.pageMax - this.pageMin + 1;
  }

  get firstAyahOnPage(): number {
    return this.pageVerses[0]?.verseNumber ?? 0;
  }

  get lastAyahOnPage(): number {
    const last = this.pageVerses[this.pageVerses.length - 1];
    return last?.verseNumber ?? 0;
  }

  get ayahRangeLabel(): string {
    if (!this.pageVerses.length) {
      return '';
    }
    const first = this.firstAyahOnPage;
    const last = this.lastAyahOnPage;
    return first === last ? `Ayah ${first}` : `Ayahs ${first}–${last}`;
  }

  ayahIndic(n: number): string {
    return toArabicIndic(n);
  }

  increaseFontSize(): void {
    if (this.fontSize < 36) {
      this.fontSize += 2;
      this.cdr.detectChanges();
    }
  }

  decreaseFontSize(): void {
    if (this.fontSize > 14) {
      this.fontSize -= 2;
      this.cdr.detectChanges();
    }
  }

  onPageSlider(ev: Event): void {
    const value = +(ev.target as HTMLInputElement).value;
    if (!Number.isFinite(value)) {
      return;
    }
    this.goToPage(value);
  }

  goToPage(target: number): void {
    if (!this.chapter) {
      return;
    }
    const next = Math.min(this.pageMax, Math.max(this.pageMin, target));
    if (next === this.page) {
      return;
    }
    this.page = next;
    this.refreshPageExtras();
    this.cdr.detectChanges();
  }

  goPrev(): void {
    this.goToPage(this.page - 1);
  }

  goNext(): void {
    this.goToPage(this.page + 1);
  }

  toggleAutoScroll(): void {
    if (this.autoScroll) {
      this.stopAutoScroll();
    } else {
      this.startAutoScroll();
    }
    this.cdr.detectChanges();
  }

  private startAutoScroll(): void {
    this.stopAutoScroll();
    this.autoScroll = true;
    this.autoScrollTimer = setInterval(() => {
      if (!this.chapter) {
        return;
      }
      if (this.page >= this.pageMax) {
        this.stopAutoScroll();
        this.cdr.detectChanges();
        return;
      }
      this.page++;
      this.refreshPageExtras();
      this.cdr.detectChanges();
    }, 4000);
  }

  private stopAutoScroll(): void {
    this.autoScroll = false;
    if (this.autoScrollTimer) {
      clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = null;
    }
  }
}
