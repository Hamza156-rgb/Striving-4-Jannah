import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonSearchbar, IonList, IonItem, IonLabel, IonSkeletonText, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/angular/standalone';
import type { ViewWillEnter } from '@ionic/angular/common';
import { finalize } from 'rxjs';
import { QuranService, Surah } from '../../services/quran.service';

@Component({
  selector: 'app-quran',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonSearchbar, IonList, IonItem, IonLabel, IonSkeletonText, IonInfiniteScroll, IonInfiniteScrollContent],
  templateUrl: './quran.page.html',
  styleUrls: ['./quran.page.scss']
})
export class QuranPage implements OnInit, ViewWillEnter {
  private quranService = inject(QuranService);
  private cdr = inject(ChangeDetectorRef);

  surahs: Surah[] = [];
  filtered: Surah[] = [];
  searchTerm = '';
  loading = true;
  juzFilter: number | null = null;
  activeTab: 'all' | 'meccan' | 'medinan' = 'all';

  juzSurahMap: Record<number, number[]> = {
    1: [1,2], 2: [2], 3: [2,3], 4: [3,4], 5: [4], 6: [4,5], 7: [5,6]
  };

  ngOnInit() {
    this.quranService
      .getSurahs()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (s) => {
          this.surahs = s;
          this.applyFilter();
          this.cdr.detectChanges();
        },
        error: () => {
          this.surahs = [];
          this.applyFilter();
          this.cdr.detectChanges();
        }
      });
  }

  /** Re-sync list when returning to this tab (fixes first paint / Ionic outlet timing). */
  ionViewWillEnter() {
    if (!this.loading && this.surahs.length > 0) {
      this.applyFilter();
      this.cdr.detectChanges();
    }
  }

  search(ev: any) {
    this.searchTerm = ev.detail.value || '';
    this.applyFilter();
  }

  setTab(tab: 'all' | 'meccan' | 'medinan') {
    this.activeTab = tab;
    this.applyFilter();
    this.cdr.detectChanges();
  }

  applyFilter() {
    let list = [...this.surahs];
    if (this.activeTab === 'meccan') list = list.filter(s => s.revelationType === 'Meccan');
    if (this.activeTab === 'medinan') list = list.filter(s => s.revelationType === 'Medinan');
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(s =>
        s.englishName.toLowerCase().includes(q) ||
        s.name.includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        String(s.number).includes(q)
      );
    }
    this.filtered = list;
  }

  skeletons() { return Array(10).fill(0); }
}
