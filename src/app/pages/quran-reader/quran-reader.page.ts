import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonIcon,
  IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { Subject, switchMap, tap } from 'rxjs';
import { Ayah, QuranService, SurahDetail } from '../../services/quran.service';
import { ShareContentService } from '../../services/share-content.service';
import { ShareFormatPickerComponent } from '../../components/share-format-picker/share-format-picker.component';

type ReaderLang = 'arabic' | 'english' | 'urdu';

interface LoadRequest {
  surahNum: number;
  language: ReaderLang;
}

@Component({
  selector: 'app-quran-reader',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonIcon, IonSpinner],
  templateUrl: './quran-reader.page.html',
  styleUrls: ['./quran-reader.page.scss']
})
export class QuranReaderPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly quranService = inject(QuranService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly shareContent = inject(ShareContentService);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastCtrl = inject(ToastController);
  private readonly loadRequest$ = new Subject<LoadRequest>();

  detail: SurahDetail | null = null;
  /** First visit — full skeleton until surah loads. */
  loading = true;
  /** Language switch — keep ayahs visible, show light overlay. */
  translating = false;
  language: ReaderLang = 'arabic';
  surahNum = 1;
  fontSize = 26;

  ngOnInit() {
    this.loadRequest$
      .pipe(
        tap(req => this.beginLoad(req)),
        switchMap(req => this.quranService.getSurahWithTranslation(req.surahNum, req.language)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: d => this.applySurah(d),
        error: () => this.failLoad()
      });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('surahId');
      if (id == null) {
        return;
      }
      this.surahNum = +id;
      this.detail = null;
      this.requestLoad();
    });
  }

  private beginLoad(req: LoadRequest): void {
    const isInitial = !this.detail || req.surahNum !== this.surahNum;
    if (isInitial) {
      this.loading = true;
      this.translating = false;
    } else {
      this.loading = false;
      this.translating = true;
    }
    this.language = req.language;
    this.cdr.detectChanges();
  }

  private applySurah(d: SurahDetail): void {
    this.detail = d;
    this.loading = false;
    this.translating = false;
    this.cdr.detectChanges();
  }

  private failLoad(): void {
    this.loading = false;
    this.translating = false;
    this.cdr.detectChanges();
  }

  requestLoad(): void {
    this.loadRequest$.next({ surahNum: this.surahNum, language: this.language });
  }

  changeLanguage(ev: CustomEvent): void {
    const next = ev.detail?.value as ReaderLang | undefined;
    if (!next || next === this.language) {
      return;
    }
    this.language = next;
    this.requestLoad();
  }

  increaseFontSize(): void {
    if (this.fontSize < 40) {
      this.fontSize += 2;
      this.cdr.detectChanges();
    }
  }

  decreaseFontSize(): void {
    if (this.fontSize > 18) {
      this.fontSize -= 2;
      this.cdr.detectChanges();
    }
  }

  skeletons(): number[] {
    return Array(8).fill(0);
  }

  async openAyahShare(ayah: Ayah, ev: Event) {
    ev.stopPropagation();
    ev.preventDefault();
    if (!this.detail) return;
    this.blurActiveElement();
    const modal = await this.modalCtrl.create({
      component: ShareFormatPickerComponent,
      componentProps: {
        heading: 'Share this ayah',
        hint: 'Send the verse as plain text (WhatsApp, notes) or as a styled gold card image.'
      },
      cssClass: 'share-format-modal',
      backdropDismiss: true,
      showBackdrop: true
    });
    await modal.present();
    const { data } = await modal.onWillDismiss<{ choice?: 'text' | 'image' }>();
    if (data?.choice === 'text') {
      void this.shareAyahText(ayah);
    } else if (data?.choice === 'image') {
      void this.shareAyahImage(ayah);
    }
  }

  private async shareAyahText(ayah: Ayah) {
    if (!this.detail) return;
    try {
      const text = this.shareContent.buildVersePlainText({
        surahEnglish: this.detail.surah.englishName,
        surahArabic: this.detail.surah.name,
        ayahNum: ayah.numberInSurah,
        arabic: ayah.text,
        translation: ayah.translation
      });
      await this.shareContent.sharePlainText(text);
    } catch (e) {
      await this.handleShareError(e);
    }
  }

  private async shareAyahImage(ayah: Ayah) {
    if (!this.detail) return;
    try {
      await this.shareContent.shareVerseImage({
        surahEnglish: this.detail.surah.englishName,
        surahArabic: this.detail.surah.name,
        ayahNum: ayah.numberInSurah,
        arabic: ayah.text,
        translation: ayah.translation
      });
    } catch (e) {
      await this.handleShareError(e);
    }
  }

  private async handleShareError(e: unknown) {
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
}
