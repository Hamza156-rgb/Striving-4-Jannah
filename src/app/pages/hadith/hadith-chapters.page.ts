import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner } from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { HadithChapter, HadithService } from '../../services/hadith.service';
import { hadithBookTitle } from './hadith-books.meta';

@Component({
  selector: 'app-hadith-chapters',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSpinner
  ],
  templateUrl: './hadith-chapters.page.html',
  styleUrls: ['./hadith-chapters.page.scss']
})
export class HadithChaptersPage implements OnInit {
  bookSlug = '';
  bookTitle = '';
  chapters: HadithChapter[] = [];
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private hadithService: HadithService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.bookSlug = this.route.snapshot.paramMap.get('bookSlug') || '';
    this.bookTitle = hadithBookTitle(this.bookSlug);
    this.loading = true;
    this.cdr.detectChanges();
    this.hadithService
      .getChapters(this.bookSlug)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: rows => {
          this.error = '';
          this.chapters = rows;
          if (!rows.length) {
            this.error = 'No chapters found for this book.';
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Could not load chapters.';
          this.cdr.detectChanges();
        }
      });
  }

  chapterEnglish(c: HadithChapter): string {
    return c.chapterEnglish || `Chapter ${c.chapterNumber}`;
  }

  chapterArabicLine(c: HadithChapter): string {
    if (c.chapterArabic) {
      return c.chapterArabic;
    }
    return c.chapterUrdu || '';
  }
}
