import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon
} from '@ionic/angular/standalone';
import { QuranService, SurahDetail } from '../../services/quran.service';

@Component({
  selector: 'app-quran-reader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon],
  templateUrl: './quran-reader.page.html',
  styleUrls: ['./quran-reader.page.scss']
})
export class QuranReaderPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly quranService = inject(QuranService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  detail: SurahDetail | null = null;
  loading = true;
  /** Arabic-only by default; English / Urdu fetch and show that translation in one tap. */
  language: 'arabic' | 'english' | 'urdu' = 'arabic';
  surahNum = 1;
  fontSize = 26;

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('surahId');
      if (id == null) return;
      this.surahNum = +id;
      this.loadSurah();
    });
  }

  loadSurah() {
    this.loading = true;
    this.cdr.markForCheck();
    this.quranService.getSurahWithTranslation(this.surahNum, this.language).subscribe({
      next: d => {
        this.detail = d;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  changeLanguage(ev: CustomEvent) {
    this.language = ev.detail.value as 'arabic' | 'english' | 'urdu';
    this.loadSurah();
  }
  increaseFontSize() { if (this.fontSize < 40) this.fontSize += 2; }
  decreaseFontSize() { if (this.fontSize > 18) this.fontSize -= 2; }
  skeletons() { return Array(8).fill(0); }
}
