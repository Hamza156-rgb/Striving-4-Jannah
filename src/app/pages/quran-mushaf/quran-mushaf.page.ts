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
import { finalize } from 'rxjs';
import { MushafChapter, QuranService } from '../../services/quran.service';

@Component({
  selector: 'app-quran-mushaf',
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
    IonIcon,
    IonSkeletonText
  ],
  templateUrl: './quran-mushaf.page.html',
  styleUrls: ['./quran-mushaf.page.scss']
})
export class QuranMushafPage implements OnInit {
  private readonly quran = inject(QuranService);
  private readonly cdr = inject(ChangeDetectorRef);

  chapters: MushafChapter[] = [];
  filtered: MushafChapter[] = [];
  searchTerm = '';
  loading = true;

  ngOnInit(): void {
    this.quran
      .getMushafChapters()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: list => {
          this.chapters = list;
          this.applyFilter();
          this.cdr.detectChanges();
        },
        error: () => {
          this.chapters = [];
          this.applyFilter();
          this.cdr.detectChanges();
        }
      });
  }

  onSearchChange(): void {
    this.applyFilter();
    this.cdr.detectChanges();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
    this.cdr.detectChanges();
  }

  private applyFilter(): void {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) {
      this.filtered = [...this.chapters];
      return;
    }
    this.filtered = this.chapters.filter(
      c =>
        c.nameSimple.toLowerCase().includes(q) ||
        c.translatedName.toLowerCase().includes(q) ||
        c.nameArabic.includes(this.searchTerm.trim()) ||
        String(c.id).includes(q)
    );
  }

  pageRangeLabel(c: MushafChapter): string {
    if (c.pageStart === c.pageEnd) {
      return `Page ${c.pageStart}`;
    }
    return `Pages ${c.pageStart}–${c.pageEnd}`;
  }

  skeletons(): number[] {
    return Array(12).fill(0);
  }
}
