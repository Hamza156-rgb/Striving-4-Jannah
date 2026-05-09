import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Capacitor } from '@capacitor/core';
import { filter } from 'rxjs/operators';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  standalone: true,
  imports: [IonApp, IonRouterOutlet]
})
export class App {
  private router = inject(Router);
  private title = inject(Title);

  constructor() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    const stripNativeCaption = () => {
      this.title.setTitle('');
      document.title = '';
    };
    stripNativeCaption();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(stripNativeCaption);
  }
}
