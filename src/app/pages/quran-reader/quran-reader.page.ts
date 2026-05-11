import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonIcon,
  ToastController
} from '@ionic/angular/standalone';
import { Ayah, QuranService, SurahDetail } from '../../services/quran.service';
import { ShareContentService } from '../../services/share-content.service';
import { ShareFormatPickerComponent } from '../../components/share-format-picker/share-format-picker.component';

@Component({
  selector: 'app-quran-reader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonIcon],
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
