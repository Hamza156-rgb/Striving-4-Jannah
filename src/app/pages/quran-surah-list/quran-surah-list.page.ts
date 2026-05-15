import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSkeletonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import type { ViewWillEnter, ViewWillLeave } from '@ionic/angular/common';
import { finalize } from 'rxjs';
import { QuranService, Surah } from '../../services/quran.service';

@Component({
  selector: 'app-quran-surah-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonSkeletonText,
    IonIcon
  ],
  templateUrl: './quran-surah-list.page.html',
  styleUrls: ['./quran-surah-list.page.scss']
})
export class QuranSurahListPage implements OnInit, ViewWillEnter, ViewWillLeave {
  private readonly quranService = inject(QuranService);
  private readonly cdr = inject(ChangeDetectorRef);

  surahs: Surah[] = [];
  filtered: Surah[] = [];
  searchTerm = '';
  loading = true;
  activeTab: 'all' | 'meccan' | 'medinan' = 'all';

  ngOnInit(): void {
    this.quranService
      .getSurahs()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: s => {
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

  ionViewWillEnter(): void {
    if (!this.loading && this.surahs.length > 0) {
      this.applyFilter();
      this.cdr.detectChanges();
    }
  }

  ionViewWillLeave(): void {
    const el = document.activeElement;
    if (el instanceof HTMLElement) {
      el.blur();
    }
  }

  onSearchModelChange(): void {
    this.applyFilter();
    this.cdr.detectChanges();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
    this.cdr.detectChanges();
  }

  setTab(tab: 'all' | 'meccan' | 'medinan'): void {
    this.activeTab = tab;
    this.applyFilter();
    this.cdr.detectChanges();
  }

  applyFilter(): void {
    let list = [...this.surahs];
    if (this.activeTab === 'meccan') {
      list = list.filter(s => s.revelationType === 'Meccan');
    }
    if (this.activeTab === 'medinan') {
      list = list.filter(s => s.revelationType === 'Medinan');
    }
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(
        s =>
          s.englishName.toLowerCase().includes(q) ||
          s.name.includes(q) ||
          s.englishNameTranslation.toLowerCase().includes(q) ||
          String(s.number).includes(q)
      );
    }
    this.filtered = list;
  }

  skeletons(): number[] {
    return Array(10).fill(0);
  }
}
