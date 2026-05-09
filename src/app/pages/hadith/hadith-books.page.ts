import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonSpinner } from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { HadithService, Hadith } from '../../services/hadith.service';
import { HADITH_BOOKS } from './hadith-books.meta';

@Component({
  selector: 'app-hadith-books',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonHeader, IonToolbar, IonTitle, IonSpinner],
  templateUrl: './hadith-books.page.html',
  styleUrls: ['./hadith-books.page.scss']
})
export class HadithBooksPage {
  books = HADITH_BOOKS;
  loadingRandom = false;
  previewHadith: Hadith | null = null;

  constructor(
    private hadithService: HadithService,
    private cdr: ChangeDetectorRef
  ) {}

  loadRandom(): void {
    this.loadingRandom = true;
    this.cdr.detectChanges();
    this.hadithService
      .getRandomHadith()
      .pipe(
        finalize(() => {
          this.loadingRandom = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: h => {
          this.previewHadith = h;
          this.cdr.detectChanges();
        },
        error: () => this.cdr.detectChanges()
      });
  }
}
