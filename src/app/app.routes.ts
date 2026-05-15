import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'quran',
        loadComponent: () => import('./pages/quran/quran.page').then(m => m.QuranPage)
      },
      {
        path: 'quran/surahs',
        loadComponent: () =>
          import('./pages/quran-surah-list/quran-surah-list.page').then(m => m.QuranSurahListPage)
      },
      {
        path: 'quran/mushaf',
        loadComponent: () => import('./pages/quran-mushaf/quran-mushaf.page').then(m => m.QuranMushafPage)
      },
      {
        path: 'quran/mushaf/:surahId',
        loadComponent: () =>
          import('./pages/quran-mushaf/quran-mushaf-reader.page').then(m => m.QuranMushafReaderPage)
      },
      {
        path: 'hadith',
        loadComponent: () => import('./pages/hadith/hadith-shell.page').then(m => m.HadithShellPage),
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/hadith/hadith-books.page').then(m => m.HadithBooksPage)
          },
          {
            path: ':bookSlug/:chapterNumber',
            loadComponent: () =>
              import('./pages/hadith/hadith-chapter-hadiths.page').then(m => m.HadithChapterHadithsPage)
          },
          {
            path: ':bookSlug',
            loadComponent: () => import('./pages/hadith/hadith-chapters.page').then(m => m.HadithChaptersPage)
          }
        ]
      },
      {
        path: 'prayer-times',
        loadComponent: () => import('./pages/prayer-times/prayer-times.page').then(m => m.PrayerTimesPage)
      },
      {
        path: 'qibla',
        loadComponent: () => import('./pages/qibla/qibla.page').then(m => m.QiblaPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'quran/:surahId',
    loadComponent: () => import('./pages/quran-reader/quran-reader.page').then(m => m.QuranReaderPage)
  }
];
