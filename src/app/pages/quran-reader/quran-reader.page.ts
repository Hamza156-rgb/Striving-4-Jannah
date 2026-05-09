import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon
} from '@ionic/angular/standalone';
import { QuranService, SurahDetail } from '../../services/quran.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-quran-reader',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon],
  templateUrl: './quran-reader.page.html',
  styleUrls: ['./quran-reader.page.scss']
})
export class QuranReaderPage implements OnInit {
  detail: SurahDetail | null = null;
  loading = true;
  language = 'english';
  surahNum = 1;
  showTranslation = true;
  fontSize = 26;

  constructor(
    private route: ActivatedRoute,
    private quranService: QuranService,
    private settings: SettingsService
  ) {}

  ngOnInit() {
    this.language = this.settings.get().language;
    this.route.params.subscribe(p => {
      this.surahNum = +p['surahId'];
      this.loadSurah();
    });
  }

  loadSurah() {
    this.loading = true;
    this.quranService.getSurahWithTranslation(this.surahNum, this.language).subscribe(d => {
      this.detail = d;
      this.loading = false;
    });
  }

  changeLanguage(ev: any) {
    this.language = ev.detail.value;
    this.loadSurah();
  }

  toggleTranslation() { this.showTranslation = !this.showTranslation; }
  increaseFontSize() { if (this.fontSize < 40) this.fontSize += 2; }
  decreaseFontSize() { if (this.fontSize > 18) this.fontSize -= 2; }
  skeletons() { return Array(8).fill(0); }
}
